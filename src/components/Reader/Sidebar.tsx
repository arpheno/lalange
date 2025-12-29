import React from 'react';
import { type ChapterDocType } from '../../core/sync/db';
import { formatReadingTime } from '../../hooks/useReadingTimeEstimate';
import { clsx } from 'clsx';

interface SidebarProps {
    chapters: ChapterDocType[];
    currentChapter: ChapterDocType | null;
    onLoadChapter: (id: string) => void;
    onInspectChapter: (chapter: ChapterDocType) => void;
    wpm: number;
    className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
    chapters,
    currentChapter,
    onLoadChapter,
    onInspectChapter,
    wpm,
    className
}) => {
    // Calculate total stats
    const totalWords = chapters.reduce((acc, c) => acc + (c.content?.length || 0), 0);
    const totalTimeMinutes = totalWords / wpm;
    const timeBank = formatReadingTime(totalTimeMinutes);

    // Calculate average ingest speed (from processing chapters)
    const processingChapters = chapters.filter(c => c.status === 'processing');
    const ingestSpeed = processingChapters.length > 0
        ? Math.round(processingChapters.reduce((acc, c) => acc + (c.processingSpeed || 0), 0) / processingChapters.length)
        : 0;

    const getChapterReadingTime = (chapter: ChapterDocType) => {
        const reportedWords = chapter.content?.length || 0;

        if (chapter.status === 'ready') {
            const minutes = reportedWords / wpm;
            return formatReadingTime(minutes);
        }

        if (chapter.status === 'processing') {
            const speed = chapter.processingSpeed || 0;
            const lastChunkTime = chapter.lastChunkCompletedAt || 0;

            if (speed > 0 && lastChunkTime > 0) {
                const now = Date.now();
                const timeSinceLastChunk = (now - lastChunkTime) / 60000;
                const projectedNewWords = Math.floor(speed * timeSinceLastChunk);
                const estimatedTotalWords = reportedWords + projectedNewWords;
                const minutes = estimatedTotalWords / wpm;
                return `~${formatReadingTime(minutes)}`;
            } else if (reportedWords > 0) {
                const minutes = reportedWords / wpm;
                return `~${formatReadingTime(minutes)}`;
            }
        }

        return null;
    };

    return (
        <div className={clsx("flex flex-col h-full bg-basalt border-r border-white/10 font-mono text-xs", className)}>
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <h3 className="text-dune-gold font-bold tracking-widest mb-1">MANIFEST</h3>
                <div className="flex justify-between text-gray-500">
                    <span>{chapters.length} CHUNKS</span>
                    <span>{timeBank} BANKED</span>
                </div>
            </div>

            {/* Chapter List (Fill-Bars) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {chapters.map(chapter => {
                    const readingTime = getChapterReadingTime(chapter);
                    const isCurrent = currentChapter?.id === chapter.id;
                    const isProcessing = chapter.status === 'processing';
                    const isReady = chapter.status === 'ready';

                    // Calculate fill percentage for processing chapters
                    // For ready chapters, it's 100%. For processing, use progress or estimate.
                    let fillPercent = 0;
                    if (isReady) fillPercent = 100;
                    else if (isProcessing) fillPercent = chapter.progress || 0;

                    return (
                        <div key={chapter.id} className="relative group">
                            {/* Background Fill Bar */}
                            <div
                                className="absolute inset-0 bg-white/5 transition-all duration-1000 ease-linear"
                                style={{ width: `${fillPercent}%`, opacity: isCurrent ? 0.2 : 0.1 }}
                            />

                            <div className="relative flex items-stretch">
                                <button
                                    onClick={() => onLoadChapter(chapter.id)}
                                    disabled={!isReady && (!chapter.content || chapter.content.length === 0)}
                                    className={clsx(
                                        "flex-1 text-left p-3 transition-colors border-l-2",
                                        isCurrent ? "border-magma-vent bg-white/5 text-white" : "border-transparent text-gray-400 hover:text-white hover:bg-white/5",
                                        (!isReady && (!chapter.content || chapter.content.length === 0)) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex justify-between items-center w-full mb-1">
                                        <span className="truncate font-bold">{chapter.title}</span>
                                        {isProcessing && (
                                            <span className="w-1.5 h-1.5 bg-dune-gold rounded-full animate-pulse" />
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
                                        <span className={isReady ? "text-canarian-pine" : "text-dune-shadow"}>
                                            {readingTime || "PENDING"}
                                        </span>
                                        {isProcessing && (
                                            <span className="text-gray-600">{chapter.processingSpeed} TPS</span>
                                        )}
                                    </div>
                                </button>

                                {/* Inspect Button (Hover only) */}
                                <button
                                    onClick={() => onInspectChapter(chapter)}
                                    disabled={!isReady}
                                    className="w-8 flex items-center justify-center text-gray-600 hover:text-dune-gold opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Inspect Density"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Telemetry Footer */}
            <div className="p-3 border-t border-white/10 bg-black/20 text-[10px] space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">NEURAL ENGINE</span>
                    <span className="text-magma-vent">[LLAMA-3-8B]</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">INGEST VELOCITY</span>
                    <span className={ingestSpeed > 0 ? "text-dune-gold animate-pulse" : "text-gray-700"}>
                        {ingestSpeed > 0 ? `~${ingestSpeed} TPS` : "IDLE"}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">BUFFER STATUS</span>
                    <span className="text-canarian-pine">OPTIMAL</span>
                </div>
            </div>
        </div>
    );
};
