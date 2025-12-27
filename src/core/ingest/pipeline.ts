import JSZip from 'jszip';
import * as cheerio from 'cheerio';
import PQueue from 'p-queue';
import { checkOllamaHealth, generateCompletion } from '../ai/ollama';
import { initDB, type BookDocType, type ChapterDocType, type ImageDocType, type RawFileDocType } from '../sync/db';

// Queue for LLM processing (concurrency: 1)
const llmQueue = new PQueue({ concurrency: 1 });

interface InitialIngestResult {
    book: BookDocType;
    chapters: ChapterDocType[];
    images: ImageDocType[];
    rawFile: RawFileDocType;
}

export const initialIngest = async (file: File, onProgress?: (msg: string) => void): Promise<InitialIngestResult> => {
    const bookId = crypto.randomUUID();
    const zip = await JSZip.loadAsync(file);

    // 1. Health Check
    onProgress?.('Checking local AI service...');
    const isOllamaUp = await checkOllamaHealth();
    if (!isOllamaUp) {
        throw new Error("Ollama service not detected. Please open the Ollama app and ensure it's running on port 11434.");
    }

    // 2. Find OPF to get metadata and spine
    const opfFile = Object.keys(zip.files).find(path => path.endsWith('.opf'));
    if (!opfFile) throw new Error('Invalid EPUB: No OPF file found');

    const opfContent = await zip.file(opfFile)!.async('string');
    const $opf = cheerio.load(opfContent, { xmlMode: true });

    // Metadata
    let title = $opf('dc\\:title').text() || file.name.replace('.epub', '');
    let author = $opf('dc\\:creator').text() || 'Unknown';

    // Fix Metadata with LLM
    onProgress?.('Fixing metadata...');
    try {
        const fixedMeta = await generateCompletion(
            `Fix the following book metadata. Return ONLY a JSON object with "title" and "author" keys. Do not include any other text.
            
            Title: ${title}
            Author: ${author}`
        );
        // Try to parse JSON, handle potential markdown code blocks
        const jsonStr = fixedMeta.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.title) title = parsed.title;
        if (parsed.author) author = parsed.author;
    } catch (e) {
        console.warn('Failed to fix metadata with LLM', e);
    }

    // Spine
    const spineIds: string[] = [];
    $opf('itemref').each((_, el) => {
        spineIds.push($opf(el).attr('idref')!);
    });

    // Manifest (ID -> Href)
    const manifest: Record<string, string> = {};
    $opf('item').each((_, el) => {
        const id = $opf(el).attr('id')!;
        const href = $opf(el).attr('href')!;
        manifest[id] = href;
    });

    // 3. Extract Images
    onProgress?.('Extracting images...');
    const images: ImageDocType[] = [];
    const imageFiles = Object.keys(zip.files).filter(path => /\.(jpg|jpeg|png|gif|webp)$/i.test(path));

    for (const imgPath of imageFiles) {
        const imgData = await zip.file(imgPath)!.async('base64');
        const filename = imgPath.split('/').pop()!;
        const ext = filename.split('.').pop()?.toLowerCase();
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;

        images.push({
            id: `${bookId}_img_${filename}`,
            bookId,
            filename,
            data: imgData,
            mimeType
        });
    }

    // Cover
    let coverBase64 = '';
    const coverMeta = $opf('meta[name="cover"]').attr('content');
    if (coverMeta && manifest[coverMeta]) {
        const coverHref = manifest[coverMeta];
        const coverFilename = coverHref.split('/').pop();
        const coverImg = images.find(img => img.filename === coverFilename);
        if (coverImg) {
            coverBase64 = `data:${coverImg.mimeType};base64,${coverImg.data}`;
        }
    }

    // 4. Create Placeholder Chapters
    const chapters: ChapterDocType[] = [];
    let chapterIndex = 0;

    for (const idref of spineIds) {
        const href = manifest[idref];
        if (!href) continue;

        chapters.push({
            id: `${bookId}_${chapterIndex}`,
            bookId,
            index: chapterIndex,
            title: `Chapter ${chapterIndex + 1}`,
            status: 'pending',
            content: []
        });
        chapterIndex++;
    }

    // 5. Prepare Raw File
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
        new Uint8Array(arrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    return {
        book: {
            id: bookId,
            title,
            author,
            cover: coverBase64,
            totalWords: 0,
            chapterIds: chapters.map(c => c.id)
        },
        chapters,
        images,
        rawFile: {
            id: bookId,
            data: base64
        }
    };
};

export const processChaptersInBackground = async (bookId: string) => {
    const db = await initDB();
    const rawFileDoc = await db.raw_files.findOne(bookId).exec();
    if (!rawFileDoc) {
        console.error('Raw file not found for book', bookId);
        return;
    }

    const rawData = atob(rawFileDoc.data);
    const uint8Array = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        uint8Array[i] = rawData.charCodeAt(i);
    }

    const zip = await JSZip.loadAsync(uint8Array);

    // Re-parse OPF to get spine/manifest
    const opfFile = Object.keys(zip.files).find(path => path.endsWith('.opf'));
    if (!opfFile) return;

    const opfContent = await zip.file(opfFile)!.async('string');
    const $opf = cheerio.load(opfContent, { xmlMode: true });

    const spineIds: string[] = [];
    $opf('itemref').each((_, el) => {
        spineIds.push($opf(el).attr('idref')!);
    });

    const manifest: Record<string, string> = {};
    $opf('item').each((_, el) => {
        const id = $opf(el).attr('id')!;
        const href = $opf(el).attr('href')!;
        manifest[id] = href;
    });

    const opfDir = opfFile.includes('/') ? opfFile.substring(0, opfFile.lastIndexOf('/') + 1) : '';

    let chapterIndex = 0;
    for (const idref of spineIds) {
        const href = manifest[idref];
        if (!href) continue;

        const chapterId = `${bookId}_${chapterIndex}`;
        const chapterDoc = await db.chapters.findOne(chapterId).exec();

        if (chapterDoc && chapterDoc.status === 'pending') {
            // Capture the updated document instance to avoid conflict
            let currentDoc = await chapterDoc.patch({ status: 'processing', progress: 0 });

            try {
                let fullPath = opfDir + href;
                let fileInZip = zip.file(fullPath);
                if (!fileInZip) {
                    const filename = href.split('/').pop();
                    const foundPath = Object.keys(zip.files).find(p => p.endsWith(filename!));
                    if (foundPath) fileInZip = zip.file(foundPath);
                }

                if (fileInZip) {
                    const htmlContent = await fileInZip.async('string');
                    const $ = cheerio.load(htmlContent);

                    // Extract Title if possible (h1)
                    const extractedTitle = $('h1').first().text().trim();

                    $('img').each((_, el) => {
                        const src = $(el).attr('src');
                        if (src) {
                            const filename = src.split('/').pop();
                            $(el).replaceWith(` [[IMAGE_REF: ${filename}]] `);
                        }
                    });

                    let rawText = '';
                    $('p, h1, h2, h3, h4, h5, h6, div, li, blockquote').each((_, el) => {
                        rawText += $(el).text().trim() + '\n\n';
                    });
                    if (!rawText.trim()) rawText = $('body').text();

                    const startTime = Date.now();
                    let processedWordsCount = 0;

                    const cleanedText = await cleanTextWithLLM(rawText, async (chunkIndex, totalChunks, chunkText) => {
                        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);

                        const wordsInChunk = chunkText.split(/\s+/).length;
                        processedWordsCount += wordsInChunk;
                        const elapsedMin = (Date.now() - startTime) / 60000;
                        const wpm = elapsedMin > 0 ? Math.round(processedWordsCount / elapsedMin) : 0;

                        // Update currentDoc reference
                        currentDoc = await currentDoc.patch({
                            progress,
                            processingSpeed: wpm
                        });
                    });

                    const words = cleanedText.trim().split(/\s+/).filter(w => w.length > 0);

                    const elapsedMin = (Date.now() - startTime) / 60000;
                    const finalWpm = elapsedMin > 0 ? Math.round(words.length / elapsedMin) : 0;
                    console.log(`[Pipeline] Chapter ${chapterId} processed: ${words.length} words in ${elapsedMin.toFixed(2)}m (${finalWpm} WPM)`);

                    // Use currentDoc for final update
                    await currentDoc.patch({
                        status: 'ready',
                        content: words,
                        title: extractedTitle || currentDoc.title,
                        progress: 100
                    });

                    // Update book total words
                    const bookDoc = await db.books.findOne(bookId).exec();
                    if (bookDoc) {
                        await bookDoc.incrementalPatch({
                            totalWords: (bookDoc.totalWords || 0) + words.length
                        });
                    }
                } else {
                    await currentDoc.patch({ status: 'error' });
                }
            } catch (e) {
                console.error(`Failed to process chapter ${chapterId}`, e);
                await currentDoc.patch({ status: 'error' });
            }
        }
        chapterIndex++;
    }
};

const cleanTextWithLLM = async (
    text: string,
    onChunkProcessed?: (index: number, total: number, chunkText: string) => Promise<void>
): Promise<string> => {
    const chunks = chunkText(text, 1000);
    const cleanedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            const result = await llmQueue.add(async () => {
                return await generateCompletion(
                    `You are an OCR correction engine. Fix typos, joining hyphenated words (e.g. 'rev- olution' -> 'revolution') and scan errors. Do not rewrite, summarize, or include conversational filler. Output ONLY the fixed text.\n\nTEXT TO FIX:\n${chunk}`
                );
            });
            const cleaned = result || chunk;
            cleanedChunks.push(cleaned);

            if (onChunkProcessed) {
                await onChunkProcessed(i, chunks.length, cleaned);
            }
        } catch (e) {
            console.warn('LLM failed for chunk, using raw text', e);
            cleanedChunks.push(chunk);
            if (onChunkProcessed) {
                await onChunkProcessed(i, chunks.length, chunk);
            }
        }
    }

    return cleanedChunks.join(' ');
};

const chunkText = (text: string, maxWords: number): string[] => {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];

    for (const word of words) {
        currentChunk.push(word);
        if (currentChunk.length >= maxWords && word.match(/[.!?]$/)) {
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }
    return chunks;
};
