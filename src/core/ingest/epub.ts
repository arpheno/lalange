import ePub from 'epubjs';
import type { BookDocType } from '../sync/db';

export const ingestEpub = async (file: File): Promise<BookDocType> => {
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

    // Extract Text
    const content: string[] = [];

    // Iterate through the spine
    // @ts-ignore - epubjs types are incomplete
    const spineItems = book.spine.items;

    for (const item of spineItems) {
        try {
            // Load the chapter
            let doc: Document;
            // @ts-ignore
            if (typeof item.load === 'function') {
                // @ts-ignore
                doc = await item.load(book.load.bind(book));
            } else {
                // Fallback: load directly via book.load
                // @ts-ignore
                const loaded = await book.load(item.href);
                if (typeof loaded === 'string') {
                    const parser = new DOMParser();
                    doc = parser.parseFromString(loaded, 'application/xhtml+xml');
                } else {
                    doc = loaded as Document;
                }
            }

            // Extract text from the document
            // We can use a simple textContent for now, but ideally we want to preserve some structure
            // For RSVP, we just need a stream of words.
            // We should handle paragraph breaks as pauses (maybe insert special tokens)

            // Simple extraction:
            const text = doc.body.textContent || '';
            // Split by whitespace
            const words = text.trim().split(/\s+/);
            content.push(...words);

            // Unload to free memory
            // @ts-ignore
            if (typeof item.unload === 'function') {
                // @ts-ignore
                item.unload();
            }
        } catch (e) {
            console.warn('Failed to load chapter', item, e);
        }
    }

    return {
        id: crypto.randomUUID(),
        title: metadata.title || file.name,
        author: metadata.creator || 'Unknown',
        cover: coverBase64,
        progress: 0,
        totalWords: content.length,
        content: content,
        lastRead: Date.now()
    };
};
