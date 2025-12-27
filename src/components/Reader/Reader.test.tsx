import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
        content: ['Hello', 'world', 'this', 'is', 'a', 'test'],
        toJSON: function () { return this; }
    };

    const mockChapter2 = {
        id: 'chapter-2',
        bookId: 'book-1',
        index: 1,
        title: 'Chapter 2',
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
        patch: vi.fn()
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
                )
            }))
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (dbModule.initDB as any).mockResolvedValue(mockDb);
    });

    it('should render loading state initially', () => {
        render(<Reader book={mockBook} />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should load and display the first word', async () => {
        render(<Reader book={mockBook} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // The word "Hello" should be split. ORP for "Hello" (len 5) is 1 (index 1, 'e').
        // Left: "H", Center: "e", Right: "llo"
        expect(screen.getByText('H')).toBeInTheDocument();
        expect(screen.getByText('e')).toBeInTheDocument();
        expect(screen.getByText('llo')).toBeInTheDocument();
    });

    it('should display chapter title', async () => {
        render(<Reader book={mockBook} />);
        await waitFor(() => {
            expect(screen.getByText('Chapter 1')).toBeInTheDocument();
        });
    });

    it('should toggle play/pause', async () => {
        render(<Reader book={mockBook} />);
        await waitFor(() => {
            expect(screen.getByText('READ')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('READ'));
        expect(screen.getByText('PAUSE')).toBeInTheDocument();

        fireEvent.click(screen.getByText('PAUSE'));
        expect(screen.getByText('READ')).toBeInTheDocument();
    });

    it('should navigate to next chapter', async () => {
        render(<Reader book={mockBook} />);
        await waitFor(() => {
            expect(screen.getByText('Chapter 1')).toBeInTheDocument();
        });

        const nextButton = screen.getByText('Next Chapter >');
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText('Chapter 2')).toBeInTheDocument();
        });

        // Check if content updated to "Second" (ORP index 2 for length 6 -> 'c')
        // "Second" -> len 6 -> ORP 2 ('c') -> Left "Se", Center "c", Right "ond"
        expect(screen.getByText('Se')).toBeInTheDocument();
        expect(screen.getByText('c')).toBeInTheDocument();
        expect(screen.getByText('ond')).toBeInTheDocument();
    });

    it('should save progress when pausing', async () => {
        render(<Reader book={mockBook} />);
        await waitFor(() => {
            expect(screen.getByText('READ')).toBeInTheDocument();
        });

        // Start reading
        fireEvent.click(screen.getByText('READ'));

        // Simulate some time passing or manual slider change
        // Since we can't easily wait for requestAnimationFrame in this setup without fake timers,
        // let's use the slider to change position while paused, then check save.

        fireEvent.click(screen.getByText('PAUSE'));

        // Change slider
        const progressSlider = screen.getByRole('slider', { name: 'Progress' });

        fireEvent.change(progressSlider, { target: { value: '2' } });

        // Changing slider calls saveProgress if not playing
        await waitFor(() => {
            expect(mockReadingState.patch).toHaveBeenCalledWith(expect.objectContaining({
                currentWordIndex: 2
            }));
        });
    });
});
