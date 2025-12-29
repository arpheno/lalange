import React, { useEffect, useRef, useState } from 'react';
import { type BookDocType, type ChapterDocType, type ReadingStateDocType, initDB } from '../../core/sync/db';
import { getBionicSplit } from '../../core/rsvp/bionic';
import { getPunctuationDelay } from '../../core/rsvp/timing';
import { Sidebar } from './Sidebar';

interface ReaderProps {
    book: BookDocType;
    onBack?: () => void;
}

export const Reader: React.FC<ReaderProps> = ({ book }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [wpm, setWpm] = useState(300);

    // State for current chapter and reading position
    const [currentChapter, setCurrentChapter] = useState<ChapterDocType | null>(null);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [readingState, setReadingState] = useState<ReadingStateDocType | null>(null);
    const [loading, setLoading] = useState(true);

    // Sidebar & Chapters
    const [chapters, setChapters] = useState<ChapterDocType[]>([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [inspectingChapter, setInspectingChapter] = useState<ChapterDocType | null>(null);
    const [, setTick] = useState(0); // Force re-render for live time updates

    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef<number | undefined>(undefined);
    const accumulatorRef = useRef<number>(0);

    // Refs for loop access
    const indexRef = useRef(0);
    const wpmRef = useRef(wpm);
    const isPlayingRef = useRef(isPlaying);
    const wordsRef = useRef<string[]>([]);
    const densitiesRef = useRef<number[]>([]);

    // Sync refs
    useEffect(() => {
        wpmRef.current = wpm;
    }, [wpm]);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
        if (!isPlaying) {
            saveProgress();
            setCurrentWordIndex(indexRef.current);
        } else {
            lastTimeRef.current = undefined;
            accumulatorRef.current = 0;
            requestRef.current = requestAnimationFrame(loop);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying]);

    // Load initial state & Subscribe to chapters
    useEffect(() => {
        let sub: any;
        const loadState = async () => {
            setLoading(true);
            const db = await initDB();

            // Subscribe to chapters
            sub = db.chapters.find({
                selector: { bookId: book.id },
                sort: [{ index: 'asc' }]
            }).$.subscribe(docs => {
                setChapters(docs.map(d => d.toJSON() as ChapterDocType));
            });

            // Get reading state
            let state = await db.reading_states.findOne(book.id).exec();
            if (!state) {
                // Create default state if missing
                state = await db.reading_states.insert({
                    bookId: book.id,
                    currentChapterId: book.chapterIds[0],
                    currentWordIndex: 0,
                    lastRead: Date.now(),
                    highlights: []
                });
            }

            const stateDoc = state.toJSON() as ReadingStateDocType;
            setReadingState(stateDoc);

            // Load chapter
            if (stateDoc.currentChapterId) {
                loadChapter(stateDoc.currentChapterId, stateDoc.currentWordIndex);
            } else {
                setLoading(false);
            }
        };
        loadState();
        return () => {
            if (sub) sub.unsubscribe();
        };
    }, [book.id]);

    // Live update sidebar for processing chapters
    useEffect(() => {
        const hasProcessing = chapters.some(c => c.status === 'processing');
        if (hasProcessing) {
            const interval = setInterval(() => {
                setTick(t => t + 1); // Force re-render
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [chapters]);

    // Effect to render word when chapter or index changes, ensuring ref is available
    useEffect(() => {
        if (!loading && currentChapter && wordsRef.current.length > 0) {
            renderWord(currentWordIndex, wordsRef.current);
        }
    }, [loading, currentChapter, currentWordIndex]);

    const saveProgress = async () => {
        if (loading || !readingState || !currentChapter) return;
        const db = await initDB();
        const doc = await db.reading_states.findOne(book.id).exec();
        if (doc) {
            await doc.incrementalPatch({
                currentChapterId: currentChapter.id,
                currentWordIndex: indexRef.current,
                lastRead: Date.now()
            });
        }
    };

    // Ref to hold the current chapter subscription
    const chapterSubRef = useRef<any>(null);

    const loadChapter = async (chapterId: string, initialIndex: number = 0) => {
        setIsPlaying(false);
        setLoading(true);
        // Use a local flag to track if this is the first emission (load) or subsequent (update)
        let isFirstEmission = true;

        const db = await initDB();

        // Unsubscribe previous
        if (chapterSubRef.current) {
            chapterSubRef.current.unsubscribe();
            chapterSubRef.current = null;
        }

        // Subscribe to the chapter document
        chapterSubRef.current = db.chapters.findOne(chapterId).$.subscribe(async (doc) => {
            if (!doc) return;
            const chapterDoc = doc.toJSON() as ChapterDocType;

            // Allow loading if ready OR if processing but has content
            const isReadable = chapterDoc.status === 'ready' || (chapterDoc.status === 'processing' && chapterDoc.content.length > 0);

            if (!isReadable) {
                return;
            }

            if (isFirstEmission) {
                isFirstEmission = false;
                setCurrentChapter(chapterDoc);
                wordsRef.current = chapterDoc.content;
                densitiesRef.current = chapterDoc.densities || [];

                indexRef.current = initialIndex;
                setCurrentWordIndex(initialIndex);
                renderWord(initialIndex, chapterDoc.content);
                setLoading(false);
                setShowSidebar(false);

                // Update state immediately if starting fresh
                if (initialIndex === 0) {
                    const stateDoc = await db.reading_states.findOne(book.id).exec();
                    if (stateDoc) {
                        await stateDoc.incrementalPatch({
                            currentChapterId: chapterId,
                            currentWordIndex: 0
                        });
                    }
                }
            } else {
                // Live update
                setCurrentChapter(chapterDoc);
                wordsRef.current = chapterDoc.content;
                densitiesRef.current = chapterDoc.densities || [];
                renderWord(indexRef.current, chapterDoc.content);
            }
        });
    };

    // Cleanup subscription on unmount
    useEffect(() => {
        return () => {
            if (chapterSubRef.current) chapterSubRef.current.unsubscribe();
        };
    }, []);

    const handleNextChapter = () => {
        if (!currentChapter) return;
        const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
        if (currentIndex < chapters.length - 1) {
            loadChapter(chapters[currentIndex + 1].id);
        }
    };

    const handlePrevChapter = () => {
        if (!currentChapter) return;
        const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
        if (currentIndex > 0) {
            loadChapter(chapters[currentIndex - 1].id);
        }
    };

    const renderWord = (idx: number, words: string[]) => {
        if (!containerRef.current || idx >= words.length) return;
        const word = words[idx];
        const { bold, light } = getBionicSplit(word);

        // River Context
        const PREV_COUNT = 10;
        const NEXT_COUNT = 10;

        const prevWords = words.slice(Math.max(0, idx - PREV_COUNT), idx);
        const nextWords = words.slice(idx + 1, idx + 1 + NEXT_COUNT);

        const prevHtml = prevWords.map((w, i) => {
            const actualIndex = Math.max(0, idx - PREV_COUNT) + i;
            const opacity = (i + 1) / PREV_COUNT * 0.5; // Fade in
            return `<span class="text-gray-500 mx-1 cursor-pointer hover:text-white transition-colors" style="opacity: ${opacity}" data-index="${actualIndex}">${w}</span>`;
        }).join('');

        const nextHtml = nextWords.map((w, i) => {
            const actualIndex = idx + 1 + i;
            const opacity = (NEXT_COUNT - i) / NEXT_COUNT * 0.5; // Fade out
            return `<span class="text-gray-500 mx-1 cursor-pointer hover:text-white transition-colors" style="opacity: ${opacity}" data-index="${actualIndex}">${w}</span>`;
        }).join('');

        containerRef.current.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full">
                <div class="text-lg md:text-xl text-center mb-8 max-w-2xl leading-relaxed h-24 overflow-hidden flex items-end justify-center flex-wrap content-end">
                    ${prevHtml}
                </div>
                
                <div class="flex items-center justify-center text-4xl md:text-6xl font-mono tracking-wide py-4">
                    <span class="text-white font-bold">${bold}</span>
                    <span class="text-gray-400 font-normal opacity-80">${light}</span>
                </div>

                <div class="text-lg md:text-xl text-center mt-8 max-w-2xl leading-relaxed h-24 overflow-hidden flex items-start justify-center flex-wrap content-start">
                    ${nextHtml}
                </div>
            </div>
        `;
    };

    const handleRiverClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const indexStr = target.getAttribute('data-index');
        if (indexStr) {
            const newIndex = parseInt(indexStr, 10);
            if (!isNaN(newIndex)) {
                setIsPlaying(false);
                indexRef.current = newIndex;
                setCurrentWordIndex(newIndex);
                renderWord(newIndex, wordsRef.current);
                saveProgress();
            }
        }
    };

    const loop = (time: number) => {
        if (!isPlayingRef.current) return;

        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        accumulatorRef.current += deltaTime;
        const baseInterval = 60000 / wpmRef.current;

        let shouldRender = false;

        if (accumulatorRef.current > Math.max(1000, baseInterval * 10)) {
            accumulatorRef.current = baseInterval;
        }

        while (true) {
            const currentWord = wordsRef.current[indexRef.current] || '';
            const density = densitiesRef.current[indexRef.current];
            const currentDensity = density !== undefined ? density : 1.0;
            // If density is 0 (junk), we ignore punctuation delay to ensure it's skipped instantly
            const punctuationDelay = currentDensity === 0 ? 0 : getPunctuationDelay(currentWord, baseInterval);

            const targetInterval = (baseInterval * currentDensity) + punctuationDelay;

            if (accumulatorRef.current >= targetInterval) {
                if (indexRef.current < wordsRef.current.length - 1) {
                    indexRef.current++;
                    accumulatorRef.current -= targetInterval;
                    shouldRender = true;
                } else {
                    setIsPlaying(false);
                    shouldRender = true;
                    break;
                }
            } else {
                break;
            }
        }

        if (shouldRender) {
            renderWord(indexRef.current, wordsRef.current);
        }

        requestRef.current = requestAnimationFrame(loop);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newIndex = parseInt(e.target.value);
        indexRef.current = newIndex;
        setCurrentWordIndex(newIndex);
        renderWord(newIndex, wordsRef.current);
        if (!isPlaying) {
            saveProgress();
        }
    };

    const getDensityColor = (score: number) => {
        if (score < 0.8) return 'text-gray-500';
        if (score < 1.5) return 'text-gray-300';
        if (score < 2.5) return 'text-yellow-500';
        return 'text-red-500 font-bold';
    };

    if (loading && !currentChapter) {
        return <div className="flex items-center justify-center h-full font-mono text-dune-gold animate-pulse">INITIALIZING COCKPIT...</div>;
    }

    return (
        <div className="flex w-full h-full bg-basalt text-white overflow-hidden">
            {/* Sidebar - Desktop (Always visible) */}
            <div className="hidden md:block w-72 shrink-0 h-full">
                <Sidebar
                    chapters={chapters}
                    currentChapter={currentChapter}
                    onLoadChapter={loadChapter}
                    onInspectChapter={setInspectingChapter}
                    wpm={wpm}
                />
            </div>

            {/* Sidebar - Mobile (Overlay, toggled) */}
            {showSidebar && (
                <div className="md:hidden absolute top-0 left-0 bottom-0 w-72 z-40 shadow-2xl">
                    <Sidebar
                        chapters={chapters}
                        currentChapter={currentChapter}
                        onLoadChapter={(id) => {
                            loadChapter(id);
                            setShowSidebar(false);
                        }}
                        onInspectChapter={setInspectingChapter}
                        wpm={wpm}
                    />
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative h-full">
                {/* Mobile Sidebar Toggle */}
                <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="md:hidden absolute top-4 left-4 z-50 p-2 text-dune-gold hover:bg-white/10 rounded"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Reader Content */}
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4 relative">
                    {/* Header Info */}
                    <div className="absolute top-16 left-0 right-0 text-center">
                        <h3 className="font-mono text-sm text-gray-500 tracking-widest uppercase">{currentChapter?.title}</h3>
                    </div>

                    {/* Reticle / Word Display */}
                    <div className="relative w-full h-64 flex items-center justify-center border-y border-white/10 mb-8 bg-black/20 backdrop-blur-sm">
                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-magma-vent/30 transform -translate-x-1/2"></div>
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-magma-vent/30 transform -translate-y-1/2"></div>
                        <div ref={containerRef} className="z-10 w-full h-full" onClick={handleRiverClick}></div>
                    </div>

                    {/* Controls */}
                    <div className="w-full flex flex-col gap-6">
                        {/* Progress Bar */}
                        <div className="w-full flex items-center gap-4">
                            <span className="font-mono text-xs text-gray-500 w-12 text-right">{currentWordIndex}</span>
                            <input
                                type="range" aria-label="Progress" min="0"
                                max={wordsRef.current.length - 1}
                                value={currentWordIndex}
                                onChange={handleSliderChange}
                                className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-dune-gold hover:accent-magma-vent transition-colors"
                            />
                            <span className="font-mono text-xs text-gray-500 w-12">{wordsRef.current.length}</span>
                        </div>

                        {/* Play/Pause & WPM */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className={`px-10 py-4 font-mono font-bold tracking-widest transition-all rounded-sm ${isPlaying
                                        ? 'bg-magma-vent text-white shadow-[0_0_20px_rgba(207,16,32,0.4)]'
                                        : 'bg-dune-gold text-black hover:bg-white'
                                        }`}
                                >
                                    {isPlaying ? 'HALT' : 'ENGAGE'}
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">Velocity: {wpm}</span>
                                <input
                                    type="range" aria-label="WPM" min="100"
                                    max="1000"
                                    step="50"
                                    value={wpm}
                                    onChange={(e) => setWpm(parseInt(e.target.value))}
                                    className="w-32 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-dune-gold"
                                />
                            </div>
                        </div>

                        {/* Chapter Navigation */}
                        <div className="flex justify-between items-center mt-4 border-t border-white/10 pt-4">
                            <button
                                onClick={handlePrevChapter}
                                disabled={!currentChapter || chapters.findIndex(c => c.id === currentChapter.id) === 0}
                                className="text-xs font-mono text-gray-500 hover:text-dune-gold disabled:opacity-30 uppercase tracking-wider transition-colors"
                            >
                                &lt; Prev Sequence
                            </button>
                            <button
                                onClick={handleNextChapter}
                                disabled={!currentChapter || chapters.findIndex(c => c.id === currentChapter.id) === chapters.length - 1}
                                className="text-xs font-mono text-gray-500 hover:text-dune-gold disabled:opacity-30 uppercase tracking-wider transition-colors"
                            >
                                Next Sequence &gt;
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inspection Modal */}
            {inspectingChapter && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12">
                    <div className="bg-basalt w-full h-full max-w-4xl rounded-lg border border-magma-vent/30 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        <div className="flex justify-between items-center p-4 border-b border-white/10">
                            <h2 className="font-mono text-xl font-bold text-dune-gold tracking-widest uppercase">{inspectingChapter.title} // DENSITY_MAP</h2>
                            <button
                                onClick={() => setInspectingChapter(null)}
                                className="text-gray-400 hover:text-magma-vent transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 font-mono text-lg leading-relaxed selection:bg-magma-vent selection:text-white">
                            {inspectingChapter.content.map((word, i) => {
                                const density = inspectingChapter.densities?.[i] || 1.0;
                                return (
                                    <span key={i} className={`${getDensityColor(density)} inline-block mr-1.5 mb-1 transition-colors hover:text-white cursor-crosshair`} title={`Density: ${density}`}>
                                        {word}
                                    </span>
                                );
                            })}
                        </div>
                        <div className="p-4 border-t border-white/10 flex gap-6 text-xs font-mono flex-wrap uppercase tracking-wider bg-black/20">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-gray-500 rounded-full"></span> Flow (&lt;0.8)</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-gray-300 rounded-full"></span> Normal</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Complex (1.5-2.5)</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Anchor (&gt;2.5)</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
