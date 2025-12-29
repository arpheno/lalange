import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { initialIngest, processChaptersInBackground } from './pipeline';
import { initDB } from '../sync/db';
import { checkOllamaHealth, generateCompletion } from '../ai/ollama';

// Adjust path to where generate_epub.js created the file
const TEST_EPUB_PATH = path.resolve(__dirname, '../../../test_book.epub');

describe('Pipeline Integration (with Ollama)', () => {

    it('should ingest and process a book end-to-end', async () => {
        // 0. Check Prerequisites (must FAIL if Ollama isn't reachable)
        const isOllamaUp = await checkOllamaHealth();
        if (!isOllamaUp) {
            throw new Error('Ollama is not reachable at http://localhost:11434');
        }

        // Smoke check the generate endpoint so tests can't pass via fallback logic.
        const smoke = await generateCompletion('Return ONLY the word OK.');
        if (!smoke || !smoke.trim().toUpperCase().startsWith('OK')) {
            throw new Error(`Ollama generate smoke-check failed. Got: ${JSON.stringify(smoke)}`);
        }

        if (!fs.existsSync(TEST_EPUB_PATH)) {
            throw new Error(`Test EPUB not found at ${TEST_EPUB_PATH}. Run 'node scripts/generate_epub.js' first.`);
        }

        console.log('Starting integration test with Ollama...');

        // 1. Load File
        const buffer = fs.readFileSync(TEST_EPUB_PATH);
        // Polyfill File if needed (Node environment might not have it despite jsdom if not configured right, but usually it does)
        const file = new File([new Uint8Array(buffer)], 'test_book.epub', { type: 'application/epub+zip' });

        // Polyfill arrayBuffer for test environment if missing
        if (!file.arrayBuffer) {
            (file as any).arrayBuffer = async () => {
                return new Uint8Array(buffer).buffer;
            };
        }

        // 2. Initial Ingest
        console.log('Running initialIngest...');
        const { book, chapters, images, rawFile } = await initialIngest(file, (msg) => console.log(`[Ingest] ${msg}`));

        expect(book.title).toBeDefined();
        expect(chapters.length).toBeGreaterThan(0);
        console.log(`Ingested book: ${book.title} (${book.id}) with ${chapters.length} chapters`);

        // 3. Insert into DB
        const db = await initDB();
        await db.books.insert(book);
        await db.chapters.bulkInsert(chapters);
        await db.raw_files.insert(rawFile);
        if (images.length > 0) await db.images.bulkInsert(images);

        // 4. Process Background
        console.log(`Starting background processing for book ${book.id}...`);
        const startTime = Date.now();

        await processChaptersInBackground(book.id);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`Processing finished in ${duration.toFixed(2)}s`);

        // 5. Verify Results
        const processedChapters = await db.chapters.find({
            selector: { bookId: book.id }
        }).exec();

        expect(processedChapters.length).toBe(chapters.length);

        for (const chapter of processedChapters) {
            console.log(`Validating Chapter: ${chapter.title}`);
            console.log(`- Status: ${chapter.status}`);
            console.log(`- Words: ${chapter.content.length}`);
            console.log(`- Densities: ${chapter.densities?.length}`);

            expect(chapter.status).toBe('ready');
            expect(chapter.content.length).toBeGreaterThan(0);
            expect(chapter.densities).toBeDefined();
            expect(chapter.densities!.length).toBe(chapter.content.length);

            // Check for density variation in the complex chapter
            if (chapter.title.includes('Complexity')) {
                const uniqueDensities = new Set(chapter.densities);
                console.log(`- Unique density values: ${uniqueDensities.size}`);
                console.log(`- Sample densities: ${chapter.densities!.slice(0, 10).join(', ')}`);

                // We expect some variation due to punctuation/structure even if LLM returns flat scores
                // But with LLM working, we hope for more.
                expect(uniqueDensities.size).toBeGreaterThan(1);
            }
        }

    }, 120000); // 2 minutes timeout
});
