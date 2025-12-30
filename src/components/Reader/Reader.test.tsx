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

        // The word "Hello" should be split.
        // In the new gradient implementation, "Hello" is split into individual characters for the first 4 in the RSVP view.
        // H (900), e (800), l (700), l (600), o (light)

        // Check RSVP container text content
        const rsvpContainer = screen.getByTestId('rsvp-container');
        expect(rsvpContainer).toHaveTextContent('Hello');
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
            expect(screen.getByTestId('play-overlay')).toBeInTheDocument();
        });

        // Click the RSVP container to toggle play
        const rsvpContainer = screen.getByTestId('rsvp-container');
        fireEvent.click(rsvpContainer);

        // Should be playing now (no overlay)
        await waitFor(() => {
            expect(screen.queryByTestId('play-overlay')).not.toBeInTheDocument();
        });

        // Click again to pause
        fireEvent.click(rsvpContainer);

        await waitFor(() => {
            expect(screen.getByTestId('play-overlay')).toBeInTheDocument();
        });
    });

    it('should navigate to next chapter', async () => {
        render(<Reader book={mockBook} />);
        await waitFor(() => {
            const elements = screen.getAllByText('Chapter 1');
            expect(elements.length).toBeGreaterThan(0);
        });

        // Open settings
        const settingsBtn = screen.getByTestId('settings-button');
        fireEvent.click(settingsBtn);

        // Click next chapter
        const nextBtn = screen.getByTestId('next-chapter-button');
        fireEvent.click(nextBtn);

        await waitFor(() => {
            const elements = screen.getAllByText('Chapter 2');
            expect(elements.length).toBeGreaterThan(0);
        });

        // Check if content updated to "Second"
        // Check RSVP container text content
        const rsvpContainer = screen.getByTestId('rsvp-container');
        expect(rsvpContainer).toHaveTextContent('Second');
    });

    it('should save progress when pausing', async () => {
        render(<Reader book={mockBook} />);
        await waitFor(() => {
            expect(screen.getByTestId('play-overlay')).toBeInTheDocument();
        });

        // Open settings to access slider
        const settingsBtn = screen.getByTestId('settings-button');
        fireEvent.click(settingsBtn);

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
