import React, { useState } from 'react';
import { type ChapterDocType } from '../../core/sync/db';
import { formatReadingTime } from '../../hooks/useReadingTimeEstimate';
import { clsx } from 'clsx';

interface SidebarProps {
    chapters: ChapterDocType[];
    currentChapter: ChapterDocType | null;
    onLoadChapter: (id: string, wordIndex?: number) => void;
    onInspectChapter: (chapter: ChapterDocType) => void;
    wpm: number;
    className?: string;
    currentWordIndex?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
    chapters,
    currentChapter,
    onLoadChapter,
    onInspectChapter,
    wpm,
    className,
    currentWordIndex
}) => {
    const [expandedSummary, setExpandedSummary] = useState<string | null>(null);

    // Calculate total stats
    const totalWords = chapters.reduce((acc, c) => acc + (c.content?.length || 0), 0);
    const totalTimeMinutes = totalWords / wpm;
    const timeBank = formatReadingTime(totalTimeMinutes);

    // Calculate average ingest speed (from processing chapters)
    const processingChapters = chapters.filter(c => c.status === 'processing');
    const ingestSpeed = processingChapters.length > 0
        ? Math.round(processingChapters.reduce((acc, c) => acc + (c.lastTPM || 0), 0) / processingChapters.length)
        : 0;

    const getChapterReadingTime = (chapter: ChapterDocType) => {
        const reportedWords = chapter.content?.length || 0;

        if (chapter.status === 'ready') {
            const minutes = reportedWords / wpm;
            return formatReadingTime(minutes);
        }

        if (chapter.status === 'processing') {
            const speed = chapter.processingSpeed || 0; // WPM
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
                        <div key={chapter.id} className="relative group flex flex-col">
                            {/* Background Fill Bar */}
                            <div
                                className="absolute inset-0 bg-white/5 transition-all duration-1000 ease-linear pointer-events-none"
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
                                            <span className="text-gray-600">
                                                {chapter.lastTPM ? `${chapter.lastTPM} TPM` : `${chapter.processingSpeed} WPM`}
                                            </span>
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

                            {/* Subchapters */}
                            {chapter.subchapters && chapter.subchapters.length > 0 && (
                                <div className="pl-4 border-l border-white/10 ml-2 mb-2 space-y-2">
                                    {chapter.subchapters.map((sub, idx) => {
                                        const summaryId = `${chapter.id}_${idx}`;
                                        const isExpanded = expandedSummary === summaryId;
                                        // Check if we have ANY content for this subchapter (start index exists in content array)
                                        const currentContentLength = chapter.content?.length || 0;
                                        const hasStarted = currentContentLength > sub.startWordIndex;
                                        const isFullyReady = currentContentLength >= sub.endWordIndex;

                                        // Safe to read if user WPM is slower than processing speed (or if fully ready)
                                        const processingSpeed = chapter.processingSpeed || 0;
                                        const isSafeSpeed = wpm < processingSpeed;
                                        const isSafeToRead = isFullyReady || (hasStarted && isSafeSpeed);

                                        // Check if this is the currently active subchapter being read
                                        const isActive = isCurrent && currentWordIndex !== undefined &&
                                            currentWordIndex >= sub.startWordIndex &&
                                            (currentWordIndex < sub.endWordIndex || (idx === chapter.subchapters!.length - 1 && currentWordIndex >= sub.startWordIndex));

                                        return (
                                            <div key={idx} className="flex flex-col relative group/sub">
                                                {/* Active Reading Highlight */}
                                                <div
                                                    className={clsx(
                                                        "absolute inset-0 transition-opacity duration-300 rounded-sm border border-white/10",
                                                        isActive ? "opacity-100 bg-white/5" : "opacity-0"
                                                    )}
                                                />
                                                {/* Health Bar Background */}
                                                <div
                                                    className={clsx(
                                                        "absolute inset-0 transition-all duration-1000 ease-out rounded-sm",
                                                        isFullyReady ? "opacity-0" : "opacity-100 animate-pulse",
                                                        isSafeToRead ? "bg-canarian-pine/20" : "bg-dune-gold/10"
                                                    )}
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                />

                                                <div className="flex items-center justify-between relative z-10 pl-1">
                                                    <button
                                                        className={clsx(
                                                            "flex-1 text-left text-[10px] py-1 transition-colors truncate pr-2",
                                                            isActive ? "text-white font-bold" : (isFullyReady ? "text-gray-500 hover:text-dune-gold" : (isSafeToRead ? "text-canarian-pine font-bold" : "text-dune-gold font-bold"))
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isExpanded) {
                                                                if (hasStarted) {
                                                                    onLoadChapter(chapter.id, sub.startWordIndex);
                                                                }
                                                            } else {
                                                                setExpandedSummary(summaryId);
                                                            }
                                                        }}
                                                    >
                                                        {sub.title} {!isFullyReady && "..."}
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (hasStarted) {
                                                                onLoadChapter(chapter.id, sub.startWordIndex);
                                                            }
                                                        }}
                                                        disabled={!hasStarted}
                                                        className={clsx(
                                                            "p-1 rounded hover:bg-white/10 transition-colors",
                                                            hasStarted ? "text-dune-gold" : "text-gray-600 opacity-50 cursor-not-allowed"
                                                        )}
                                                        title="Read Subchapter"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {isExpanded && (
                                                    <div className="text-[10px] text-gray-400 italic bg-black/20 p-2 rounded border border-white/5 mb-1 animate-in fade-in slide-in-from-top-1 relative z-10">
                                                        {sub.summary}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Telemetry Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40">
                <div className="text-[10px] text-gray-500 tracking-widest mb-1">SYSTEM VELOCITY</div>
                <div className="text-2xl font-mono text-dune-gold flex items-baseline gap-2">
                    {ingestSpeed > 0 ? ingestSpeed : "IDLE"} <span className="text-xs text-gray-600">TPM</span>
                </div>
                {ingestSpeed > 0 && (
                    <div className="text-[10px] text-gray-600 mt-1">
                        ~{(ingestSpeed / 60).toFixed(1)} TPS
                    </div>
                )}
            </div>
        </div>
    );
};
