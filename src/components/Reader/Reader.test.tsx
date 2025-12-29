import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Reader } from './Reader';
import * as dbModule from '../../core/sync/db';

// Mock the DB module
vi.mock('../../core/sync/db', () => ({
    initDB: vi.fn(),
    // Mock types if needed, but usually not for runtime
}));

describe('Reader Component', () => {
    const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        cover: '',
        totalWords: 100,
        chapterIds: ['chapter-1', 'chapter-2']
    };

    const mockChapter1 = {
        id: 'chapter-1',
        bookId: 'book-1',
        index: 0,
        title: 'Chapter 1',
        status: 'ready',
        content: ['Hello', 'world', 'this', 'is', 'a', 'test'],
        toJSON: function () { return this; }
    };

    const mockChapter2 = {
        id: 'chapter-2',
        bookId: 'book-1',
        index: 1,
        title: 'Chapter 2',
        status: 'ready',
        content: ['Second', 'chapter', 'content'],
        toJSON: function () { return this; }
    };

    const mockReadingState = {
        bookId: 'book-1',
        currentChapterId: 'chapter-1',
        currentWordIndex: 0,
        lastRead: Date.now(),
        highlights: [],
        toJSON: function () { return this; },
        patch: vi.fn(),
        incrementalPatch: vi.fn()
    };

    const mockDb = {
        reading_states: {
            findOne: vi.fn().mockReturnValue({
                exec: vi.fn().mockResolvedValue(mockReadingState)
            }),
            insert: vi.fn().mockResolvedValue(mockReadingState)
        },
        chapters: {
            findOne: vi.fn().mockImplementation((id) => ({
                exec: vi.fn().mockResolvedValue(
                    id === 'chapter-1' ? mockChapter1 : mockChapter2
                ),
                $: {
                    subscribe: vi.fn().mockImplementation((callback) => {
                        callback(id === 'chapter-1' ? mockChapter1 : mockChapter2);
                        return { unsubscribe: vi.fn() };
                    })
                }
            })),
            find: vi.fn().mockReturnValue({
                $: {
                    subscribe: vi.fn().mockImplementation((callback) => {
                        callback([mockChapter1, mockChapter2]);
                        return { unsubscribe: vi.fn() };
                    })
                },
                exec: vi.fn().mockResolvedValue([mockChapter1, mockChapter2])
            })
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (dbModule.initDB as any).mockResolvedValue(mockDb);
    });

    it('should render loading state initially', () => {
        render(<Reader book={mockBook} />);
        expect(screen.getByText('INITIALIZING COCKPIT...')).toBeInTheDocument();
    });

    it('should load and display the first word', async () => {
        render(<Reader book={mockBook} />);

        await waitFor(() => {
            expect(screen.queryByText('INITIALIZING COCKPIT...')).not.toBeInTheDocument();
        });

        // The word "Hello" should be split. Bionic for "Hello" (len 5) is 2 bold.
        // Bold: "He", Light: "llo"
        expect(screen.getByText('He')).toBeInTheDocument();
        expect(screen.getByText('llo')).toBeInTheDocument();
    });

    it('should display chapter title', async () => {
        render(<Reader book={mockBook} />);
        await waitFor(() => {
            // There might be multiple "Chapter 1" (sidebar and main view)
            const elements = screen.getAllByText('Chapter 1');
            expect(elements.length).toBeGreaterThan(0);
        });
    });

    it('should toggle play/pause', async () => {
        render(<Reader book={mockBook} />);
        await waitFor(() => {
            expect(screen.getByText('ENGAGE')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('ENGAGE'));
        expect(screen.getByText('HALT')).toBeInTheDocument();

        fireEvent.click(screen.getByText('HALT'));
        expect(screen.getByText('ENGAGE')).toBeInTheDocument();
    });

    it('should navigate to next chapter', async () => {
        render(<Reader book={mockBook} />);
        await waitFor(() => {
            const elements = screen.getAllByText('Chapter 1');
            expect(elements.length).toBeGreaterThan(0);
        });

        const nextButtons = screen.getAllByText('Next Sequence >');
        fireEvent.click(nextButtons[0]);

        await waitFor(() => {
            const elements = screen.getAllByText('Chapter 2');
            expect(elements.length).toBeGreaterThan(0);
        });

        // Check if content updated to "Second" (Bionic for "Second" len 6 -> 3 bold)
        // "Second" -> len 6 -> Bold "Sec", Light "ond"
        expect(screen.getByText('Sec')).toBeInTheDocument();
        expect(screen.getByText('ond')).toBeInTheDocument();
    });

    it('should save progress when pausing', async () => {
        render(<Reader book={mockBook} />);
        await waitFor(() => {
            expect(screen.getByText('ENGAGE')).toBeInTheDocument();
        });

        // Start reading
        fireEvent.click(screen.getByText('ENGAGE'));

        // Simulate some time passing or manual slider change
        // Since we can't easily wait for requestAnimationFrame in this setup without fake timers,
        // let's use the slider to change position while paused, then check save.

        fireEvent.click(screen.getByText('HALT'));
        await waitFor(() => {
            expect(screen.getByText('ENGAGE')).toBeInTheDocument();
        });

        // Change slider
        const progressSlider = screen.getByRole('slider', { name: 'Progress' });

        fireEvent.change(progressSlider, { target: { value: '2' } });

        // Changing slider calls saveProgress if not playing
        await waitFor(() => {
            expect(mockReadingState.incrementalPatch).toHaveBeenCalledWith(expect.objectContaining({
                currentWordIndex: 2
            }));
        });
    });
});
