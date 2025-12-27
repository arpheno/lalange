import JSZip from 'jszip';
import * as cheerio from 'cheerio';
import PQueue from 'p-queue';
import { checkOllamaHealth, generateCompletion } from '../ai/ollama';
import type { BookDocType, ChapterDocType, ImageDocType } from '../sync/db';

// Queue for LLM processing (concurrency: 1)
const llmQueue = new PQueue({ concurrency: 1 });

interface IngestionResult {
    book: BookDocType;
    chapters: ChapterDocType[];
    images: ImageDocType[];
}

export const ingestEpubWithLLM = async (file: File, onProgress?: (msg: string) => void): Promise<IngestionResult> => {
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
    const title = $opf('dc\\:title').text() || file.name.replace('.epub', '');
    const author = $opf('dc\\:creator').text() || 'Unknown';
    
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
        // Simple mime type guess
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
    // Try to find cover in meta
    let coverBase64 = '';
    const coverMeta = $opf('meta[name="cover"]').attr('content');
    if (coverMeta && manifest[coverMeta]) {
        // Resolve path relative to OPF? Usually manifest hrefs are relative to OPF folder.
        // For simplicity, let's try to find the file in zip by suffix match if exact match fails
        // because path resolution in zip is tricky without a full path resolver.
        // But usually manifest href is relative to OPF.
        
        // Let's just look for the file in the images array we just extracted
        const coverHref = manifest[coverMeta];
        const coverFilename = coverHref.split('/').pop();
        const coverImg = images.find(img => img.filename === coverFilename);
        if (coverImg) {
            coverBase64 = `data:${coverImg.mimeType};base64,${coverImg.data}`;
        }
    }

    // 4. Process Chapters
    const chapters: ChapterDocType[] = [];
    let totalWords = 0;
    let chapterIndex = 0;

    // Resolve OPF directory for relative paths
    const opfDir = opfFile.includes('/') ? opfFile.substring(0, opfFile.lastIndexOf('/') + 1) : '';

    for (const idref of spineIds) {
        const href = manifest[idref];
        if (!href) continue;

        // Construct full path in zip
        // href is relative to OPF
        // We need to handle ".." if present, but simple concat usually works for standard epubs
        // A robust path resolver would be better, but let's try simple join first.
        // Actually, JSZip files are just paths.
        
        // Simple path join
        let fullPath = opfDir + href;
        // Normalize (remove ./ etc) - basic handling
        // If href starts with ../, we need to go up.
        // For this MVP, let's assume standard structure or flat.
        // If file not found, try to find by suffix.
        
        let fileInZip = zip.file(fullPath);
        if (!fileInZip) {
            // Fallback: search by filename
            const filename = href.split('/').pop();
            const foundPath = Object.keys(zip.files).find(p => p.endsWith(filename!));
            if (foundPath) fileInZip = zip.file(foundPath);
        }

        if (!fileInZip) {
            console.warn(`Could not find chapter file: ${href}`);
            continue;
        }

        onProgress?.(`Processing chapter ${chapterIndex + 1}/${spineIds.length}...`);

        const htmlContent = await fileInZip.async('string');
        const $ = cheerio.load(htmlContent);

        // Replace images with placeholder
        $('img').each((_, el) => {
            const src = $(el).attr('src');
            if (src) {
                const filename = src.split('/').pop();
                $(el).replaceWith(` [[IMAGE_REF: ${filename}]] `);
            }
        });

        // Extract text (preserve paragraphs)
        // We want to keep \n\n between block elements.
        // Cheerio .text() joins with empty string usually.
        // Let's manually traverse block elements.
        let rawText = '';
        $('p, h1, h2, h3, h4, h5, h6, div, li, blockquote').each((_, el) => {
            rawText += $(el).text().trim() + '\n\n';
        });
        
        // Fallback if no block tags found (e.g. plain text wrapped in body)
        if (!rawText.trim()) {
            rawText = $('body').text();
        }

        // Clean with LLM
        const cleanedText = await cleanTextWithLLM(rawText);
        
        const words = cleanedText.trim().split(/\s+/).filter(w => w.length > 0);
        
        if (words.length > 0) {
            chapters.push({
                id: `${bookId}_${chapterIndex}`,
                bookId,
                index: chapterIndex,
                title: `Chapter ${chapterIndex + 1}`, // Could extract h1
                content: words
            });
            totalWords += words.length;
            chapterIndex++;
        }
    }

    return {
        book: {
            id: bookId,
            title,
            author,
            cover: coverBase64,
            totalWords,
            chapterIds: chapters.map(c => c.id)
        },
        chapters,
        images
    };
};

const cleanTextWithLLM = async (text: string): Promise<string> => {
    // Chunking
    const chunks = chunkText(text, 1000);
    const cleanedChunks: string[] = [];

    for (const chunk of chunks) {
        try {
            const result = await llmQueue.add(async () => {
                return await generateCompletion(
                    `You are an OCR correction engine. Fix typos, joining hyphenated words (e.g. 'rev- olution' -> 'revolution') and scan errors. Do not rewrite, summarize, or include conversational filler. Output ONLY the fixed text.\n\nTEXT TO FIX:\n${chunk}`
                );
            });
            cleanedChunks.push(result || chunk); // Fallback to chunk if result is empty
        } catch (e) {
            console.warn('LLM failed for chunk, using raw text', e);
            cleanedChunks.push(chunk);
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
