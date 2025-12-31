import JSZip from 'jszip';
import * as cheerio from 'cheerio';
import PQueue from 'p-queue';
import { checkAIHealth, generateUnifiedCompletion } from '../ai/service';
import { initDB, type BookDocType, type ChapterDocType, type ImageDocType, type RawFileDocType } from '../sync/db';
import { removeLicenseText } from './license';
import { useSettingsStore } from '../store/settings';
import { useAIStore } from '../store/ai';

// Queue for LLM processing (concurrency: 1)
const llmQueue = new PQueue({ concurrency: 1 });

import { generateUUID } from '../../utils/uuid';

export interface InitialIngestResult {
    book: BookDocType;
    chapters: ChapterDocType[];
    images: ImageDocType[];
    rawFile: RawFileDocType;
}

export const initialIngest = async (file: File, onProgress?: (msg: string) => void): Promise<InitialIngestResult> => {
    console.log(`[Pipeline] Starting ingestion for file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    const bookId = generateUUID();
    const zip = await JSZip.loadAsync(file);

    // 1. Health Check
    onProgress?.('Checking AI service...');
    console.log('[Pipeline] Checking AI service health...');
    const isAIUp = await checkAIHealth();
    if (!isAIUp) {
        console.error('[Pipeline] AI service check failed.');
        throw new Error("WebLLM engine failed to initialize. Please check your internet connection or try reloading.");
    }
    console.log('[Pipeline] AI service is healthy.');

    // 2. Find OPF to get metadata and spine
    const opfFile = Object.keys(zip.files).find(path => path.endsWith('.opf'));
    if (!opfFile) throw new Error('Invalid EPUB: No OPF file found');
    console.log(`[Pipeline] Found OPF file: ${opfFile}`);

    const opfContent = await zip.file(opfFile)!.async('string');
    const $opf = cheerio.load(opfContent, { xmlMode: true });

    // Metadata
    let title = $opf('dc\\:title').text() || file.name.replace('.epub', '');
    let author = $opf('dc\\:creator').text() || 'Unknown';
    console.log(`[Pipeline] Metadata parsed: Title="${title}", Author="${author}"`);

    // Spine
    const spineIds: string[] = [];
    $opf('itemref').each((_, el) => {
        spineIds.push($opf(el).attr('idref')!);
    });
    console.log(`[Pipeline] Spine contains ${spineIds.length} items.`);

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
    console.log(`[Pipeline] Found ${imageFiles.length} images in archive.`);

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
    console.log(`[Pipeline] Starting background processing for book: ${bookId}`);
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
            console.log(`[Pipeline] Processing chapter ${chapterIndex + 1}/${spineIds.length}: ${chapterId}`);
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
                    if (extractedTitle) {
                        console.log(`[Pipeline] Extracted title: "${extractedTitle}"`);
                    }

                    // Remove images to avoid artifacts
                    $('img').remove();

                    let rawText = '';
                    $('p, h1, h2, h3, h4, h5, h6, div, li, blockquote').each((_, el) => {
                        rawText += $(el).text().trim() + '\n\n';
                    });
                    if (!rawText.trim()) rawText = $('body').text();

                    // Apply license removal
                    rawText = removeLicenseText(rawText);
                    console.log(`[Pipeline] Chapter ${chapterIndex + 1}: Extracted ${rawText.length} chars of raw text.`);

                    const startTime = Date.now();
                    let processedWordsCount = 0;

                    // Pipeline: Clean -> Editor/Summary -> Density -> Save
                    const settings = useSettingsStore.getState();
                    const { summarizerModel, summarizerBasePrompt, summarizerFragments } = settings;
                    const summaryFragmentText = summarizerFragments.filter(f => f.enabled).map(f => f.text).join('\n');
                    const summarySystemPrompt = `${summarizerBasePrompt}\n${summaryFragmentText}`;

                    // Fallback for legacy setting if base prompt is empty (optional, but good for transition)
                    const specificSummaryInstruction = settings.summaryPrompt || "Summarize the following text in 5 sentences.";

                    const rawChunks = chunkText(rawText, settings.summaryChunkSize || 2500);
                    console.log(`[Pipeline] Chapter ${chapterIndex + 1}: Split into ${rawChunks.length} chunks for AI processing.`);
                    let allWords: string[] = [];
                    let allDensities: number[] = [];
                    let subchapters: { title: string; summary: string; startWordIndex: number; endWordIndex: number }[] = [];

                    for (let i = 0; i < rawChunks.length; i++) {
                        const chunk = rawChunks[i];
                        console.log(`[Pipeline] Processing chunk ${i + 1}/${rawChunks.length} (Length: ${chunk.length} chars)`);

                        // Pre-calculate words to determine indices immediately
                        const cleanedChunk = chunk;
                        const newWords = cleanedChunk.trim().split(/\s+/).filter(w => w.length > 0);

                        if (newWords.length === 0) continue;

                        const startWordIndex = allWords.length;
                        const endWordIndex = startWordIndex + newWords.length;

                        // --- PRE-FILL: Immediate UI Update ---
                        // Add words and default densities immediately so the user sees text while AI processes
                        allWords = [...allWords, ...newWords];
                        const chunkDefaultDensities = new Array(newWords.length).fill(1.0);
                        allDensities = [...allDensities, ...chunkDefaultDensities];

                        const prefillDoc = await db.chapters.findOne(currentDoc.id).exec();
                        if (prefillDoc) {
                            await prefillDoc.incrementalModify((docData) => ({
                                ...docData,
                                content: [...allWords],
                                densities: [...allDensities],
                                status: 'processing' // Keep processing so TPM is tracked
                            }));
                        }
                        // -------------------------------------

                        // Shared state for this chunk
                        let chunkTitle = `Part ${i + 1}`;
                        let chunkSummary = '';
                        let isJunk = false;

                        // --- Task 1: Editor/Summary (Serial) ---
                        try {
                            const editorPrompt = `
${summarySystemPrompt}

Analyze the following text segment from a book.
Task:
1. Determine if this text is "CONTENT" (narrative, story, useful info) or "JUNK" (copyright page, table of contents, list of image references, empty space, or just garbage).
2. If CONTENT, provide a short "title" (max 5 words) and a "summary" based on this instruction: "${specificSummaryInstruction}".
3. If JUNK, return status "JUNK".

OUTPUT JSON ONLY:
{
  "status": "CONTENT" | "JUNK",
  "title": "...",
  "summary": "..."
}

TEXT:
${chunk.substring(0, 3000)}
`;
                            const completionResult = await llmQueue.add(async () => {
                                useAIStore.getState().setActivity(`Summarizing Chunk ${i + 1}`, summarizerModel);
                                try {
                                    return await generateUnifiedCompletion(editorPrompt, summarizerModel);
                                } finally {
                                    useAIStore.getState().setActivity(null);
                                }
                            });
                            const response = completionResult.response;

                            const jsonMatch = response.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                const parsed = JSON.parse(jsonMatch[0]);
                                if (parsed.status === 'JUNK') {
                                    console.log(`[Pipeline] Chunk ${i + 1} marked as JUNK.`);
                                    isJunk = true;
                                } else {
                                    chunkTitle = parsed.title || chunkTitle;
                                    chunkSummary = parsed.summary || '';
                                    console.log(`[Pipeline] Chunk ${i + 1} Summary: "${chunkTitle}" (${chunkSummary.length} chars)`);

                                    // IMMEDIATE UPDATE: Save subchapter info so user sees it ASAP
                                    const freshDoc = await db.chapters.findOne(currentDoc.id).exec();
                                    if (freshDoc) {
                                        await freshDoc.incrementalModify((docData) => {
                                            const currentSubchapters = docData.subchapters || [];
                                            return {
                                                ...docData,
                                                subchapters: [...currentSubchapters, {
                                                    title: chunkTitle,
                                                    summary: chunkSummary,
                                                    startWordIndex,
                                                    endWordIndex
                                                }]
                                            };
                                        });
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn('Failed to run Editor/Summary pass', e);
                        }

                        if (isJunk) continue;

                        // --- Task 2: Density Analysis (Serial) ---
                        let localDensityProcessedIndex = 0; // Relative to newWords
                        const DENSITY_CHUNK_SIZE = 200;

                        while (true) {
                            const remainingWords = newWords.length - localDensityProcessedIndex;
                            if (remainingWords <= 0) break;

                            // Process if we have enough words OR it's the last part of this chunk
                            if (remainingWords >= DENSITY_CHUNK_SIZE || remainingWords > 0) {
                                const start = localDensityProcessedIndex;
                                let end = Math.min(start + DENSITY_CHUNK_SIZE, newWords.length);

                                // Align sentence boundary
                                let lookAhead = 0;
                                while (end + lookAhead < newWords.length && lookAhead < 50) {
                                    const w = newWords[end + lookAhead - 1];
                                    if (w.match(/[.!?]["']?$/)) {
                                        end += lookAhead;
                                        break;
                                    }
                                    lookAhead++;
                                }

                                const chunkWords = newWords.slice(start, end);

                                // Queue the density analysis
                                // Inside this callback is where the LLM is actually called
                                const densities = await analyzeDensityRange(chunkWords, async (metrics) => {
                                    if (metrics && metrics.eval_count && metrics.eval_duration) {
                                        const durationSeconds = metrics.eval_duration / 1e9;
                                        const tpm = durationSeconds > 0 ? (metrics.eval_count / durationSeconds) * 60 : 0;
                                        const freshDoc = await db.chapters.findOne(currentDoc.id).exec();
                                        if (freshDoc) {
                                            await freshDoc.incrementalPatch({ lastTPM: Math.round(tpm) });
                                        }
                                    }
                                });
                                console.log(`[Pipeline] Chunk ${i + 1}: Density analyzed for ${chunkWords.length} words.`);

                                // Update global densities array in place
                                const globalStartIndex = startWordIndex + start;
                                for (let k = 0; k < densities.length; k++) {
                                    if (globalStartIndex + k < allDensities.length) {
                                        allDensities[globalStartIndex + k] = densities[k];
                                    }
                                }

                                // INCREMENTAL UPDATE: Save updated densities
                                const freshDoc = await db.chapters.findOne(currentDoc.id).exec();
                                if (freshDoc) {
                                    await freshDoc.incrementalModify((docData) => ({
                                        ...docData,
                                        densities: [...allDensities]
                                    }));
                                }
                                localDensityProcessedIndex = end;
                            } else {
                                break;
                            }
                        }

                        processedWordsCount += newWords.length;

                        // Update local subchapters array to match DB state (for final save)
                        subchapters.push({
                            title: chunkTitle,
                            summary: chunkSummary,
                            startWordIndex,
                            endWordIndex
                        });

                        // Final update for this chunk (Content + Densities)
                        const elapsedMin = (Date.now() - startTime) / 60000;
                        const wpm = elapsedMin > 0 ? Math.round(processedWordsCount / elapsedMin) : 0;

                        // Use incrementalPatch to avoid revision conflicts
                        const latestDoc = await db.chapters.findOne(currentDoc.id).exec();
                        if (latestDoc) {
                            currentDoc = latestDoc;
                            await currentDoc.incrementalPatch({
                                content: [...allWords],
                                densities: [...allDensities],
                                // subchapters: subchapters, // Already updated by summaryPromise, but safe to include
                                progress: Math.round(((i + 1) / rawChunks.length) * 100),
                                processingSpeed: wpm,
                                lastChunkCompletedAt: Date.now(),
                                status: 'processing'
                            });
                        }
                    }

                    const elapsedMin = (Date.now() - startTime) / 60000;
                    const finalWpm = elapsedMin > 0 ? Math.round(allWords.length / elapsedMin) : 0;
                    console.log(`[Pipeline] Chapter ${chapterId} processed: ${allWords.length} words in ${elapsedMin.toFixed(2)}m (${finalWpm} WPM)`);

                    // Final update
                    const finalDoc = await db.chapters.findOne(currentDoc.id).exec();
                    if (finalDoc) {
                        await finalDoc.incrementalPatch({
                            status: 'ready',
                            content: [...allWords],
                            densities: [...allDensities], // Should be fully populated now
                            subchapters,
                            title: extractedTitle || finalDoc.title,
                            progress: 100
                        });
                    }

                    // Update book total words
                    const bookDoc = await db.books.findOne(bookId).exec();
                    if (bookDoc) {
                        await bookDoc.incrementalPatch({
                            totalWords: (bookDoc.totalWords || 0) + allWords.length
                        });
                    }
                } else {
                    const latestDoc = await db.chapters.findOne(currentDoc.id).exec();
                    if (latestDoc) await latestDoc.incrementalPatch({ status: 'error' });
                }
            } catch (e: any) {
                console.error(`Failed to process chapter ${chapterId}`, e);
                const latestDoc = await db.chapters.findOne(currentDoc.id).exec();
                if (latestDoc) await latestDoc.incrementalPatch({ status: 'error' });
            }
        }
        chapterIndex++;
    }
};

export const analyzeDensityRange = async (words: string[], onMetrics?: (metrics: any) => void): Promise<number[]> => {
    const text = words.join(' ');

    // Split into sentences (naive split, but sufficient for this purpose)
    // Matches sequence of chars ending with .!? followed by space or end of string
    // We use a regex that captures the delimiter to keep it, then rejoin
    const rawSentences = text.match(/[^.!?]+[.!?]+(["']?)(?=\s|$)|[^.!?]+$/g) || [text];
    const sentences = rawSentences.map(s => s.trim()).filter(s => s.length > 0);

    const cleanKey = (text: string) => text.replace(/[^^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();

    const parseLooseScoreObject = (maybeObjectText: string): Record<string, number> => {
        const scores: Record<string, number> = {};
        const lines = maybeObjectText.split(/\r?\n/);

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === '{' || trimmed === '}') continue;

            // Greedy match so we split on the *last* ':' (keys can contain ':' sometimes)
            // Example invalid JSON line we want to tolerate: "" he thought": 1,
            const m = trimmed.match(/^(.*):\s*(-?\d+(?:\.\d+)?)\s*,?\s*$/);
            if (!m) continue;

            let rawKey = m[1].trim();
            const rawValue = m[2];

            // Strip leading/trailing quotes, then strip any remaining quote characters.
            // This intentionally tolerates invalid JSON where the key contains unescaped quotes.
            rawKey = rawKey.replace(/^"+/, '').replace(/"+$/, '');
            rawKey = rawKey.replace(/["\u201C\u201D]/g, '');

            const parsedValue = Number(rawValue);
            if (!Number.isFinite(parsedValue)) continue;

            const normalizedKey = cleanKey(rawKey);
            if (!normalizedKey) continue;
            scores[normalizedKey] = parsedValue;
        }

        return scores;
    };

    let sentenceScores: Record<string, number> = {};

    try {
        const { librarianModelTier, librarianBasePrompt, librarianFragments } = useSettingsStore.getState();
        const fragmentText = librarianFragments.filter(f => f.enabled).map(f => f.text).join('\n');
        const fullSystemPrompt = `${librarianBasePrompt}\n${fragmentText}`;

        const completionResult = await llmQueue.add(async () => {
            useAIStore.getState().setActivity('Analyzing Density', librarianModelTier);
            console.log(`[Pipeline] Analyzing density for ${sentences.length} sentences...`);
            try {
                return await generateUnifiedCompletion(
                    `${fullSystemPrompt}

Analyze the literary density of the following sentences.
For each sentence, assign a "complexity_score" from 0 to 10.

CRITERIA:
- Score 0 (Junk/Structural): Footnotes, page numbers, misplaced chapter titles, URLS, copyright notices, dysfunctional formatting, or non-narrative artifacts.
- Score 1-3 (Simple): Narrative, concrete examples, simple sentence structure.
- Score 8-10 (Dense): Abstract theory, dialectics, archaic phrasing, multiple nested clauses.

OUTPUT FORMAT:
You are a JSON generator. Output ONLY valid JSON.
- Do NOT include any conversational text (e.g. "Here is the JSON").
- Do NOT use Markdown formatting (no \`\`\`json blocks).
- Key: The first 5 words of the sentence, with ALL punctuation and quotes REMOVED.
- Value: The score (number).

EXAMPLE INPUT:
"The wealth of those societies in which the capitalist mode of production prevails, presents itself as an immense accumulation of commodities. This is a fact. [12]"

EXAMPLE OUTPUT:
{
  "The wealth of those societies": 9,
  "This is a fact": 2,
  "12": 0
}

TEXT TO ANALYZE:
${sentences.join('\n')}
`,
                    librarianModelTier
                );
            } finally {
                useAIStore.getState().setActivity(null);
            }
        });

        const result = completionResult.response;
        console.log(`[Pipeline] Density analysis result (length: ${result.length}):`, result.substring(0, 100) + '...');
        if (completionResult.metrics && onMetrics) {
            onMetrics(completionResult.metrics);
        }

        try {
            let jsonMatch = result.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // Fallback: Try to match start of JSON if end is missing (truncated response)
                jsonMatch = result.match(/\{[\s\S]*/);
            }

            if (jsonMatch) {
                let jsonStr = jsonMatch[0];

                // If truncated (missing closing brace), append it
                if (!jsonStr.trim().endsWith('}')) {
                    jsonStr = jsonStr.trim() + '}';
                }

                // Fix smart quotes ( ) to straight quotes (")
                jsonStr = jsonStr.replace(/[\u201C\u201D]/g, '"');
                // Remove trailing commas before closing braces/brackets
                jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

                const normalizedScores: Record<string, number> = {};
                let parsed: Record<string, unknown> | null = null;

                try {
                    parsed = JSON.parse(jsonStr) as Record<string, unknown>;
                } catch (e) {
                    // If the model emitted invalid JSON (e.g. unescaped quotes inside keys), fall back to a tolerant parser.
                    const loose = parseLooseScoreObject(jsonStr);
                    if (Object.keys(loose).length > 0) {
                        sentenceScores = loose;
                        parsed = null;
                    } else {
                        throw e;
                    }
                }

                if (parsed) {
                    for (const [k, v] of Object.entries(parsed)) {
                        const numeric = typeof v === 'number' ? v : Number(v);
                        if (!Number.isFinite(numeric)) continue;
                        normalizedScores[cleanKey(k)] = numeric;
                    }
                    sentenceScores = normalizedScores;
                }
            } else {
                console.warn('No JSON object found in density result:', result);
            }
        } catch (e) {
            console.warn('Failed to parse density JSON', e, result);
        }
    } catch (e) {
        console.warn('LLM failed for density analysis', e);
    }

    // Map scores back to words
    const densities: number[] = [];

    for (const sentence of sentences) {
        // Find score for this sentence
        // Try to match by first 5 words
        const sentenceWords = sentence.split(/\s+/);
        const rawFirst5 = sentenceWords.slice(0, 5).join(' ');
        const cleanFirst5 = cleanKey(rawFirst5);

        // Fuzzy match key? For now, exact match or default
        let score = 5; // Default normal speed

        // Try exact match
        if (sentenceScores[cleanFirst5]) {
            score = sentenceScores[cleanFirst5];
        } else {
            // Try finding a key that starts with the first few words
            const cleanFirst3 = cleanKey(sentenceWords.slice(0, 3).join(' '));
            const key = Object.keys(sentenceScores).find(k => k.startsWith(cleanFirst3));
            if (key) score = sentenceScores[key];
        }

        // Calculate Density Factor (AI Layer)
        let densityFactor = 1.0;
        if (score === 0) {
            densityFactor = 0;
        } else {
            densityFactor = 1 + ((score - 5) * 0.1);
        }

        // Apply to all words in this sentence
        for (const word of sentenceWords) {
            // Structural Rhythm (Code Layer)
            let structuralMultiplier = 1.0;
            if (word.match(/[.!?]["']?$/)) structuralMultiplier = 3.0;
            else if (word.match(/[,;]["']?$/)) structuralMultiplier = 1.5;
            else if (word.length > 8) structuralMultiplier = 1.2;

            // Final Score
            const finalScore = structuralMultiplier * densityFactor;

            // Ensure we don't go too crazy
            let clamped: number;
            if (finalScore === 0) {
                clamped = 0;
            } else {
                clamped = Math.max(0.5, Math.min(5.0, finalScore));
            }
            densities.push(clamped);
        }
    }

    // If we have a mismatch in word count (due to splitting/joining), pad or trim
    // This can happen if regex split differs from original word split
    if (densities.length !== words.length) {
        // console.warn(`Density word count mismatch. Expected ${words.length}, got ${densities.length}`);
        if (densities.length < words.length) {
            const missing = words.length - densities.length;
            densities.push(...new Array(missing).fill(1.0));
        } else {
            // This is tricky, we might have generated more tokens? 
            // Just slice to fit
            return densities.slice(0, words.length);
        }
    }

    return densities;
};

const chunkText = (text: string, maxChars: number): string[] => {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (const word of words) {
        currentChunk.push(word);
        currentLength += word.length + 1; // +1 for space

        // Break if we exceed maxChars AND we are at a sentence boundary
        if (currentLength >= maxChars && word.match(/[.!?]["']?$/)) {
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
            currentLength = 0;
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }
    return chunks;
};
