import { useSettingsStore } from '../store/settings';
import { useAIStore } from '../store/ai';
import { initDB } from '../sync/db';
import { analyzeDensityRange } from './pipeline';
import { generateUnifiedCompletion } from '../ai/service';
import PQueue from 'p-queue';

export type TaskType = 'DENSITY' | 'SUMMARY';

export interface IngestionTask {
    id: string;
    bookId: string;
    chapterId: string;
    subchapterIndex: number;
    startWordIndex: number;
    endWordIndex: number;
    type: TaskType;
    priority: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    text: string; // The text chunk to process
}

export class IngestionScheduler {
    private tasks: IngestionTask[] = [];
    private isRunning = false;
    private currentBookId: string | null = null;
    private currentChapterId: string | null = null;
    private currentWordIndex: number = 0;
    
    // Queue for LLM processing (concurrency: 1 to enforce Single Model Policy)
    private llmQueue = new PQueue({ concurrency: 1 });

    constructor() {
        // potentially load saved state? For now, in-memory.
    }

    public setCursor(bookId: string, chapterId: string, wordIndex: number) {
        this.currentBookId = bookId;
        this.currentChapterId = chapterId;
        this.currentWordIndex = wordIndex;
        this.rebalancePriorities();
    }

    public addTask(task: Omit<IngestionTask, 'priority' | 'status'>) {
        // Check if task already exists
        const exists = this.tasks.find(t => 
            t.bookId === task.bookId && 
            t.chapterId === task.chapterId && 
            t.subchapterIndex === task.subchapterIndex && 
            t.type === task.type
        );
        if (exists) return;

        const newTask: IngestionTask = {
            ...task,
            priority: 0,
            status: 'pending'
        };
        this.tasks.push(newTask);
        this.rebalancePriorities();
        this.processNext();
    }

    private rebalancePriorities() {
        if (!this.currentBookId) return;

        this.tasks.forEach(task => {
            if (task.status !== 'pending') return;

            // Base priority
            let score = 0;

            // 1. Book Priority
            if (task.bookId === this.currentBookId) {
                score += 10000;
            }

            // 2. Chapter/Location Priority
            // We need to know the order of chapters. 
            // For simplicity, we assume chapterId string comparison or we need to look up index.
            // Let's rely on the fact that we usually process one book.
            // If we are in the same chapter:
            if (task.chapterId === this.currentChapterId) {
                score += 5000;
                
                // Distance from current word
                const distance = task.startWordIndex - this.currentWordIndex;
                
                if (distance < 0) {
                    // Passed chunk. 
                    // If it's SUMMARY, we still need it (for review).
                    // If it's DENSITY, we might not need it as much if we already read it? 
                    // But we want to fill the map.
                    score += 100; 
                } else if (distance === 0 || (distance > 0 && distance < 2500)) {
                    // Current Chunk
                    score += 2000;
                } else {
                    // Future Chunk - closer is better
                    // Max words ~100k. 
                    score += 1000 - (distance / 100);
                }
            } else {
                // Different chapter. 
                // We'd need chapter indexes to know if it's next or prev.
                // For now, give a generic low score, but higher than other books.
                score += 500;
            }

            // 3. Task Type Priority
            // Density > Summary (Start reading > Finish reading)
            if (task.type === 'DENSITY') {
                score += 50;
            }

            task.priority = score;
        });

        // Sort: Higher priority first
        this.tasks.sort((a, b) => b.priority - a.priority);
    }

    private async processNext() {
        if (this.isRunning) return;
        if (this.llmQueue.pending > 0 || this.llmQueue.size > 0) return; // Already working

        const nextTask = this.tasks.find(t => t.status === 'pending');
        if (!nextTask) return;

        this.isRunning = true;
        nextTask.status = 'processing';

        try {
            await this.llmQueue.add(async () => {
                await this.executeTask(nextTask);
            });
            nextTask.status = 'completed';
            // Remove completed task
            this.tasks = this.tasks.filter(t => t.id !== nextTask.id);
        } catch (e) {
            console.error("Task failed", e);
            nextTask.status = 'failed';
            // Move to end or retry logic?
        } finally {
            this.isRunning = false;
            this.processNext(); // Loop
        }
    }

    private async executeTask(task: IngestionTask) {
        const db = await initDB();
        const settings = useSettingsStore.getState();
        const aiState = useAIStore.getState();

        console.log(`[Scheduler] Executing ${task.type} for ${task.chapterId} sub ${task.subchapterIndex}`);

        if (task.type === 'DENSITY') {
            const { librarianModelTier } = settings;
            aiState.setActivity(`Scanning Density (Chunk ${task.subchapterIndex + 1})`, librarianModelTier);
            
            try {
                // Split text into words for density analysis
                const words = task.text.trim().split(/\s+/);
                const densities = await analyzeDensityRange(words);

                // Save to DB
                const chapter = await db.chapters.findOne(task.chapterId).exec();
                if (chapter) {
                    await chapter.incrementalModify(doc => {
                        const currentDensities = [...(doc.densities || [])];
                        // Splice in the new densities
                        // We need to be careful about indices. 
                        // The task.startWordIndex should align with the chapter content.
                        for (let i = 0; i < densities.length; i++) {
                            if (task.startWordIndex + i < currentDensities.length) {
                                currentDensities[task.startWordIndex + i] = densities[i];
                            }
                        }
                        return {
                            ...doc,
                            densities: currentDensities
                        };
                    });
                }
            } finally {
                aiState.setActivity(null);
            }
        } 
        
        else if (task.type === 'SUMMARY') {
            const { summarizerModel, summarizerBasePrompt, summarizerFragments, enableJunkRemoval } = settings;
            aiState.setActivity(`Summarizing (Chunk ${task.subchapterIndex + 1})`, summarizerModel);

            try {
                const summaryFragmentText = summarizerFragments.filter(f => f.enabled).map(f => f.text).join('\n');
                const summarySystemPrompt = `${summarizerBasePrompt}\n${summaryFragmentText}`;
                const specificSummaryInstruction = settings.summaryPrompt || "Summarize the following text in 5 sentences.";

                let prompt = '';
                if (enableJunkRemoval) {
                    prompt = `
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
${task.text.substring(0, 3000)}
`;
                } else {
                    prompt = `
${summarySystemPrompt}

Analyze the following text segment from a book.
Task:
1. Provide a short "title" (max 5 words) and a "summary" based on this instruction: "${specificSummaryInstruction}".

OUTPUT JSON ONLY:
{
  "status": "CONTENT",
  "title": "...",
  "summary": "..."
}

TEXT:
${task.text.substring(0, 3000)}
`;
                }

                const { response } = await generateUnifiedCompletion(prompt, summarizerModel);
                
                let title = `Part ${task.subchapterIndex + 1}`;
                let summary = '';
                let isJunk = false;

                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (enableJunkRemoval && parsed.status === 'JUNK') {
                            isJunk = true;
                        } else {
                            title = parsed.title || title;
                            summary = parsed.summary || '';
                        }
                    } catch (e) {
                        console.warn("Failed to parse summary JSON", e);
                    }
                }

                // Save to DB
                const chapter = await db.chapters.findOne(task.chapterId).exec();
                if (chapter) {
                    await chapter.incrementalModify(doc => {
                        const subchapters = [...(doc.subchapters || [])];
                        if (subchapters[task.subchapterIndex]) {
                            subchapters[task.subchapterIndex] = {
                                ...subchapters[task.subchapterIndex],
                                title: isJunk ? "SKIPPED (JUNK)" : title,
                                summary: isJunk ? "Content identified as non-narrative junk." : summary
                            };
                        }
                        
                        // If Junk, we might want to zero out densities or mark them?
                        // For now, let's just leave them.
                        
                        return {
                            ...doc,
                            subchapters
                        };
                    });
                }

            } finally {
                aiState.setActivity(null);
            }
        }
    }
}

export const scheduler = new IngestionScheduler();
