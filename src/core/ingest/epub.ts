import ePub from 'epubjs';
import { generateUUID } from '../../utils/uuid';
import type { BookDocType, ChapterDocType } from '../sync/db';

export const ingestEpub = async (file: File): Promise<{ book: BookDocType, chapters: ChapterDocType[] }> => {
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    await book.ready;

    const metadata = await book.loaded.metadata;

    // Extract Cover
    let coverBase64 = '';
    try {
        const coverUrl = await book.coverUrl();
        if (coverUrl) {
            const response = await fetch(coverUrl);
            const blob = await response.blob();
            coverBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        }
    } catch (e) {
        console.warn('Failed to load cover', e);
    }

    const bookId = generateUUID();
    const chapters: ChapterDocType[] = [];
    let totalWords = 0;

    // Iterate through the spine
    const spineItems = (book.spine as any).items;

    for (let i = 0; i < spineItems.length; i++) {
        const item = spineItems[i];
        try {
            // Load the chapter
            let doc: Document;
            if (typeof item.load === 'function') {
                doc = await item.load(book.load.bind(book));
            } else {
                // Fallback: load directly via book.load
                const loaded = await book.load(item.href);
                if (typeof loaded === 'string') {
                    const parser = new DOMParser();
                    doc = parser.parseFromString(loaded, 'application/xhtml+xml');
                } else {
                    doc = loaded as Document;
                }
            }

            // Extract text from the document
            const text = doc.body.textContent || '';
            // Split by whitespace
            const words = text.trim().split(/\s+/).filter(w => w.length > 0);

            if (words.length > 0) {
                chapters.push({
                    id: `${bookId}_${i}`,
                    bookId: bookId,
                    index: i,
                    title: `Chapter ${i + 1}`, // TODO: Extract real title from TOC
                    status: 'pending',
                    content: words,
                    densities: []
                });
                totalWords += words.length;
            }

            // Unload to free memory
            if (typeof item.unload === 'function') {
                item.unload();
            }
        } catch (e) {
            console.warn('Failed to load chapter', item, e);
        }
    }

    return {
        book: {
            id: bookId,
            title: metadata.title || file.name,
            author: metadata.creator || 'Unknown',
            cover: coverBase64,
            totalWords: totalWords,
            chapterIds: chapters.map(c => c.id)
        },
        chapters: chapters
    };
};
