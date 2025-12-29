import { describe, it, expect, beforeAll } from 'vitest';
import { initDB } from '../sync/db';
import { checkOllamaHealth, generateCompletion } from '../ai/ollama';

describe('Pipeline Robustness Integration (with Ollama)', () => {

    let ollamaReady = false;
    let ollamaNotReadyReason = 'Ollama is not reachable at http://localhost:11434';

    beforeAll(async () => {
        const isOllamaUp = await checkOllamaHealth();
        if (!isOllamaUp) {
            ollamaReady = false;
            ollamaNotReadyReason = 'Ollama is not reachable at http://localhost:11434';
            return;
        }

        try {
            const smoke = await generateCompletion('Return ONLY the word OK.');
            if (!smoke || !smoke.trim().toUpperCase().startsWith('OK')) {
                ollamaReady = false;
                ollamaNotReadyReason = `Ollama generate smoke-check failed. Got: ${JSON.stringify(smoke)}`;
                return;
            }
        } catch (e) {
            ollamaReady = false;
            ollamaNotReadyReason = `Ollama generate smoke-check threw: ${String(e)}`;
            return;
        }

        ollamaReady = true;
    });

    it('should handle complex punctuation and quotes in density analysis', async () => {
        expect(ollamaReady, ollamaNotReadyReason).toBe(true);
        console.log('Starting robustness integration test with Ollama...');

        const bookId = 'robustness-test-book';
        const chapterId = `${bookId}_0`;

        // 1. Setup DB with a "processing" chapter containing complex text
        const db = await initDB();

        // Clean up previous runs
        try {
            const existingBook = await db.books.findOne(bookId).exec();
            if (existingBook) await existingBook.remove();
            const existingChapter = await db.chapters.findOne(chapterId).exec();
            if (existingChapter) await existingChapter.remove();
        } catch (e) { }

        await db.books.insert({
            id: bookId,
            title: 'Robustness Test Book',
            author: 'Test Author',
            cover: '',
            totalWords: 0,
            chapterIds: [chapterId]
        });

        // Complex text designed to trip up JSON parsing
        // 1. "Key: Value" structure (colon in key)
        // 2. Quotes in key
        // 3. Smart quotes
        // 4. JSON-like characters
        const complexText = `
            The key: value pair is tricky.
            He said "hello" to me.
            It’s a “smart quote” test.
            JSON looks like { "a": 1 }.
            Review: "The Best Book".
        `;

        // We insert it as if it was just extracted from HTML (raw text needs to be chunked/cleaned by pipeline)
        // But processChaptersInBackground expects the chapter to be in 'processing' state but usually it starts from scratch?
        // Wait, processChaptersInBackground iterates chapters. 
        // If status is 'processing' and content is empty, it tries to load from EPUB (which we don't have).
        // If status is 'processing' and content is NOT empty?
        // The pipeline logic:
        // if (chapter.status === 'processing') {
        //    if (chapter.content.length === 0) { ... load from zip ... }
        // }

        // We can't easily inject into the middle of the pipeline without a ZIP file because the pipeline logic is tightly coupled to reading from the ZIP if content is empty.
        // However, if we look at the code:
        // It iterates chapters.
        // const chapters = await db.chapters.find().exec();
        // for (const chapter of chapters) {
        //    if (chapter.status === 'processing' || chapter.status === 'new') {
        //       ...
        //       let fileInZip;
        //       if (chapter.content.length === 0) { ... load zip ... }
        //    }
        // }

        // If we provide content already, does it skip loading from zip?
        // The code says:
        // if (chapter.content.length === 0) { ... }
        // if (fileInZip) { ... process HTML ... }

        // It seems if content is NOT empty, it might skip the HTML processing block entirely?
        // Let's check the code again.
        // Lines 200-300 in previous read_file output show:
        // if (fileInZip) { ... processing ... }

        // So if we don't have a fileInZip, nothing happens!
        // This means we MUST provide a ZIP file or modify the pipeline to accept pre-loaded text.

        // BUT, we can use `analyzeDensityRange` directly!
        // The user wants an INTEGRATION test. Calling the function directly is a unit test (which we already did).
        // The user wants to see the "parsing is robust enough" in a real flow.

        // To do a true integration test without a ZIP, we'd need to mock JSZip or the file loading.
        // OR, we can just call `analyzeDensityRange` with the real Ollama backend.
        // The user said "i dont trust the unit tests". Unit tests usually mock the backend.
        // If we call `analyzeDensityRange` with the REAL backend, that IS an integration test of the LLM + Parsing logic.
        // We don't necessarily need the full DB/Pipeline loop to test the "parsing robustness" of the LLM output.

        // So, I will write a test that calls `analyzeDensityRange` (the function that does the LLM call and parsing)
        // but runs it against the REAL Ollama instance, not a mock.

        const { analyzeDensityRange } = await import('./pipeline');

        // Split text into words as the pipeline would
        const words = complexText.trim().split(/\s+/);

        console.log('Sending complex text to Ollama:', words.join(' '));

        const densities = await analyzeDensityRange(words);

        console.log('Received densities:', densities);

        // Verify we got densities back (meaning no crash, no empty array due to parse error)
        expect(densities.length).toBe(words.length);

        // Check specific values if possible, or just that they are numbers
        densities.forEach(d => {
            expect(d).toBeGreaterThan(0);
            expect(d).toBeLessThan(10); // Reasonable range
        });
    }, 30000); // Increase timeout to 30s for LLM

    it('should handle Kafka text with dialogue quotes that caused JSON parsing errors', async () => {
        expect(ollamaReady, ollamaNotReadyReason).toBe(true);
        const { analyzeDensityRange } = await import('./pipeline');

        // Text from Metamorphosis that caused the issue: "" he thought": 1
        const kafkaText = `
            One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. 
            He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. 
            The bedding was hardly able to cover it and seemed ready to slide off any moment. 
            His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked. 
            "What's happened to me?" he thought. 
            It wasn't a dream. 
            His room, a proper human room although a little too small, lay peacefully between its four familiar walls.
        `;

        const words = kafkaText.trim().split(/\s+/);
        console.log('Sending Kafka text to Ollama...');

        const densities = await analyzeDensityRange(words);

        console.log('Received densities for Kafka text:', densities);

        expect(densities.length).toBe(words.length);
        densities.forEach(d => {
            expect(d).toBeGreaterThan(0);
        });
    }, 30000);
});
