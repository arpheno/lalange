import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ingestEpub } from './epub';

// Mock epubjs
vi.mock('epubjs', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            ready: Promise.resolve(),
            loaded: {
                metadata: Promise.resolve({
                    title: 'Test Book',
                    creator: 'Test Author'
                })
            },
            coverUrl: vi.fn().mockResolvedValue('blob:test-cover'),
            spine: {
                items: [
                    {
                        href: 'chapter1.html',
                        load: vi.fn().mockResolvedValue({
                            body: {
                                textContent: 'This is chapter one.'
                            }
                        }),
                        unload: vi.fn()
                    },
                    {
                        href: 'chapter2.html',
                        load: vi.fn().mockResolvedValue({
                            body: {
                                textContent: 'This is chapter two.'
                            }
                        }),
                        unload: vi.fn()
                    }
                ]
            },
            load: vi.fn()
        }))
    };
});

// Mock global fetch
global.fetch = vi.fn().mockResolvedValue({
    blob: () => Promise.resolve(new Blob(['fake-image'], { type: 'image/png' }))
});

// Mock FileReader
class MockFileReader {
    onloadend: (() => void) | null = null;
    result: string = '';
    readAsDataURL() {
        this.result = 'data:image/png;base64,fake-base64';
        if (this.onloadend) this.onloadend();
    }
}
global.FileReader = MockFileReader as any;

// Mock crypto.randomUUID
global.crypto.randomUUID = vi.fn().mockReturnValue('test-book-id');

describe('ingestEpub', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should ingest an epub file correctly', async () => {
        const file = new File(['fake-epub-content'], 'test.epub', { type: 'application/epub+zip' });
        file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

        const result = await ingestEpub(file);

        expect(result.book).toEqual({
            id: 'test-book-id',
            title: 'Test Book',
            author: 'Test Author',
            cover: 'data:image/png;base64,fake-base64',
            totalWords: 8, // 4 words in ch1 + 4 words in ch2
            chapterIds: ['test-book-id_0', 'test-book-id_1']
        });

        expect(result.chapters).toHaveLength(2);

        expect(result.chapters[0]).toEqual({
            id: 'test-book-id_0',
            bookId: 'test-book-id',
            index: 0,
            title: 'Chapter 1',
            status: 'pending',
            content: ['This', 'is', 'chapter', 'one.'],
            densities: []
        });

        expect(result.chapters[1]).toEqual({
            id: 'test-book-id_1',
            bookId: 'test-book-id',
            index: 1,
            title: 'Chapter 2',
            status: 'pending',
            content: ['This', 'is', 'chapter', 'two.'],
            densities: []
        });
    });
});
