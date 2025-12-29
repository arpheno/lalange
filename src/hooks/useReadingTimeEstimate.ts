import { useEffect, useState } from 'react';
import type { ChapterDocType } from '../core/sync/db';

export interface ReadingTimeEstimate {
    // For finished chapters
    totalMinutesAtCurrentWpm: number;

    // For processing chapters
    estimatedWordsProcessed: number;
    estimatedMinutesAvailable: number;
    processingWpm: number;

    // Combined
    isProcessing: boolean;
}

/**
 * Calculate reading time estimates for chapters.
 * 
 * For finished chapters: calculates total reading time at user's current WPM.
 * For processing chapters: uses linear projection from last chunk speed to estimate
 * how many words are already processed but not yet reported (due to chunk size).
 */
export const useReadingTimeEstimate = (
    chapter: ChapterDocType | null,
    userReadingWpm: number = 300
): ReadingTimeEstimate | null => {
    const [estimate, setEstimate] = useState<ReadingTimeEstimate | null>(null);

    useEffect(() => {
        if (!chapter) {
            setEstimate(null);
            return;
        }

        const calculateEstimate = () => {
            const isProcessing = chapter.status === 'processing';
            const reportedWords = chapter.content.length;
            const processingSpeed = chapter.processingSpeed || 0;
            const lastChunkTime = chapter.lastChunkCompletedAt || 0;

            // For finished chapters, just calculate reading time
            if (chapter.status === 'ready') {
                const totalMinutes = reportedWords / userReadingWpm;
                setEstimate({
                    totalMinutesAtCurrentWpm: totalMinutes,
                    estimatedWordsProcessed: reportedWords,
                    estimatedMinutesAvailable: totalMinutes,
                    processingWpm: 0,
                    isProcessing: false
                });
                return;
            }

            // For processing chapters, use linear projection
            if (isProcessing && processingSpeed > 0 && lastChunkTime > 0) {
                const now = Date.now();
                const timeSinceLastChunk = (now - lastChunkTime) / 60000; // minutes
                const projectedNewWords = Math.floor(processingSpeed * timeSinceLastChunk);
                const estimatedTotalWords = reportedWords + projectedNewWords;
                const estimatedMinutesAvailable = estimatedTotalWords / userReadingWpm;

                setEstimate({
                    totalMinutesAtCurrentWpm: 0, // Not finished yet
                    estimatedWordsProcessed: estimatedTotalWords,
                    estimatedMinutesAvailable,
                    processingWpm: processingSpeed,
                    isProcessing: true
                });
            } else {
                // Fallback if no speed data yet
                const totalMinutes = reportedWords / userReadingWpm;
                setEstimate({
                    totalMinutesAtCurrentWpm: 0,
                    estimatedWordsProcessed: reportedWords,
                    estimatedMinutesAvailable: totalMinutes,
                    processingWpm: processingSpeed,
                    isProcessing
                });
            }
        };

        calculateEstimate();

        // Update estimate every second while processing
        if (chapter.status === 'processing') {
            const interval = setInterval(calculateEstimate, 1000);
            return () => clearInterval(interval);
        }
    }, [chapter, userReadingWpm]);

    return estimate;
};

/**
 * Format minutes into human-readable time string.
 */
export const formatReadingTime = (minutes: number): string => {
    if (minutes < 1) {
        return '< 1 min';
    }
    if (minutes < 60) {
        return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};
