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
    const rsvpRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef<number | undefined>(undefined);
    const accumulatorRef = useRef<number>(0);

    // Refs for loop access
    const indexRef = useRef(0);
    const wpmRef = useRef(wpm);
    const isPlayingRef = useRef(isPlaying);
    const wasPlayingRef = useRef(false);
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

    const scrollIntervalRef = useRef<any>(null);
    const chunkStartRef = useRef<number>(-1);
    const chunkEndRef = useRef<number>(-1);

    const startScrolling = (direction: 'back' | 'fwd') => {
        if (scrollIntervalRef.current) return;

        scrollIntervalRef.current = setInterval(() => {
            const newIndex = direction === 'back'
                ? Math.max(0, indexRef.current - 5)
                : Math.min(wordsRef.current.length - 1, indexRef.current + 5);

            if (newIndex !== indexRef.current) {
                indexRef.current = newIndex;
                setCurrentWordIndex(newIndex);
                renderWord(newIndex, wordsRef.current);
            }
        }, 100);
    };

    const stopScrolling = () => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    };

    const renderWord = (idx: number, words: string[]) => {
        if (!containerRef.current || idx >= words.length) return;

        const CHUNK_SIZE = 200;
        const BUFFER = 50;

        // Check if we need to re-render the chunk
        let needsRender = false;
        if (idx < chunkStartRef.current + BUFFER || idx > chunkEndRef.current - BUFFER) {
            // Recalculate chunk
            chunkStartRef.current = Math.max(0, idx - CHUNK_SIZE / 2);
            chunkEndRef.current = Math.min(words.length, chunkStartRef.current + CHUNK_SIZE);
            needsRender = true;
        }

        if (needsRender || containerRef.current.children.length === 0) {
            const visibleWords = words.slice(chunkStartRef.current, chunkEndRef.current);
            const html = visibleWords.map((w, i) => {
                const actualIndex = chunkStartRef.current + i;
                const { bold, light } = getBionicSplit(w);
                return `
                    <span 
                        class="word-span inline-block mr-2 mb-2 transition-all duration-300 cursor-pointer text-gray-500 opacity-20 group-hover:opacity-50 hover:!opacity-100 hover:text-white"
                        data-index="${actualIndex}"
                        id="word-${actualIndex}"
                    >
                        <span class="font-bold">${bold}</span><span class="font-light opacity-80">${light}</span>
                    </span>
                `;
            }).join('');

            containerRef.current.innerHTML = `
                <div class="w-full flex flex-wrap content-start justify-start p-8 font-mono text-xl md:text-2xl leading-relaxed select-none">
                    ${html}
                </div>
            `;
        }

        // Update Highlights (DOM manipulation)
        // Remove old highlights
        const prevActive = containerRef.current.querySelector('.active-word');
        if (prevActive) {
            prevActive.className = "word-span inline-block mr-2 mb-2 transition-all duration-300 cursor-pointer text-gray-500 opacity-20 group-hover:opacity-50 hover:!opacity-100 hover:text-white";
            prevActive.classList.remove('active-word');
            // Reset inner colors
            const spans = prevActive.querySelectorAll('span');
            if (spans[0]) spans[0].className = "font-bold";
            if (spans[1]) spans[1].className = "font-light opacity-80";
        }

        // Remove old line highlights
        const prevLines = containerRef.current.querySelectorAll('.active-line-word');
        prevLines.forEach(el => {
            el.classList.remove('active-line-word', 'opacity-100', 'text-gray-300');
            el.classList.add('text-gray-500', 'opacity-20');
        });

        // Add new highlight
        const activeSpan = containerRef.current.querySelector(`[data-index="${idx}"]`) as HTMLElement;
        if (activeSpan) {
            // Highlight Active Word
            activeSpan.className = "word-span inline-block mr-2 mb-2 transition-all duration-100 cursor-pointer bg-white/10 text-white font-normal rounded px-1 -mx-1 active-word";
            const spans = activeSpan.querySelectorAll('span');
            if (spans[0]) spans[0].className = "text-white font-bold";
            if (spans[1]) spans[1].className = "text-gray-400 font-normal";

            // Highlight Current Line
            const currentTop = activeSpan.offsetTop;
            const allSpans = containerRef.current.querySelectorAll('.word-span');
            // We can optimize this by searching nearby, but for now iterate (chunk is small ~200)
            allSpans.forEach((el) => {
                if ((el as HTMLElement).offsetTop === currentTop) {
                    el.classList.add('active-line-word', 'opacity-100', 'text-gray-300');
                    el.classList.remove('text-gray-500', 'opacity-20');
                }
            });

            // Scroll Logic: Position active line at ~40% of container height
            // Container Height is fixed (h-96 = 384px). 40% is ~150px.
            // We want scrollTop = activeSpan.offsetTop - 150
            // Since containerRef is now absolute inside a relative overflow-hidden div, we transform it.
            const targetY = -(currentTop - 150);
            containerRef.current.style.transform = `translateY(${targetY}px)`;
        }

        // Update RSVP Display
        if (rsvpRef.current) {
            const currentWord = words[idx];
            if (currentWord) {
                const { bold, light } = getBionicSplit(currentWord);
                rsvpRef.current.innerHTML = `<span class="font-bold text-white">${bold}</span><span class="opacity-70 text-gray-300">${light}</span>`;
            }
        }
    };

    const handleRiverClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        // Check if clicked on a word span or its children
        const wordSpan = target.closest('[data-index]');
        if (wordSpan) {
            const indexStr = wordSpan.getAttribute('data-index');
            if (indexStr) {
                const newIndex = parseInt(indexStr, 10);
                if (!isNaN(newIndex)) {
                    // If clicking the current word, toggle play/pause
                    if (newIndex === indexRef.current) {
                        setIsPlaying(!isPlayingRef.current);
                    } else {
                        // Jump to new word and pause (or keep playing? User said "click to play/pause" on playing word)
                        // "Resume: User clicks the word where they left off."
                        setIsPlaying(true);
                        indexRef.current = newIndex;
                        setCurrentWordIndex(newIndex);
                        renderWord(newIndex, wordsRef.current);
                    }
                    saveProgress();
                }
            }
        }
    };

    const handleMouseEnter = () => {
        if (isPlayingRef.current) {
            wasPlayingRef.current = true;
            setIsPlaying(false);
        } else {
            wasPlayingRef.current = false;
        }
    };

    const handleMouseLeave = () => {
        if (wasPlayingRef.current) {
            setIsPlaying(true);
            wasPlayingRef.current = false;
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
                    <div
                        className="relative w-full h-96 flex flex-col items-center justify-start border-y border-white/10 mb-8 bg-black/20 backdrop-blur-sm overflow-hidden group"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Zone Indicators (Visual Only) */}
                        <div className="absolute top-0 h-[40%] w-full bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-20"></div>
                        <div className="absolute bottom-0 h-[40%] w-full bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-20"></div>
                        
                        {/* Bionic RSVP Focus Display (Fixed in Lower Center Zone) */}
                        <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none mix-blend-screen w-full text-center">
                            <div ref={rsvpRef} className="text-6xl md:text-8xl font-mono text-white tracking-tight whitespace-nowrap drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                {wordsRef.current[currentWordIndex] && (() => {
                                    const { bold, light } = getBionicSplit(wordsRef.current[currentWordIndex]);
                                    return <><span className="font-bold text-white">{bold}</span><span className="opacity-70 text-gray-300">{light}</span></>;
                                })()}
                            </div>
                        </div>

                        {/* Scroll Zones */}
                        <div
                            className="absolute top-0 left-0 right-0 h-12 z-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-mono text-magma-vent cursor-n-resize"
                            onMouseEnter={() => startScrolling('back')}
                            onMouseLeave={stopScrolling}
                        >
                            SCROLL BACK
                        </div>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-12 z-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-mono text-magma-vent cursor-s-resize"
                            onMouseEnter={() => startScrolling('fwd')}
                            onMouseLeave={stopScrolling}
                        >
                            SCROLL FWD
                        </div>

                        {/* Flow Text Container - Scrollable */}
                        <div className="w-full h-full overflow-hidden relative">
                            <div ref={containerRef} className="w-full absolute top-0 left-0 transition-transform duration-300 ease-out" onClick={handleRiverClick}></div>
                        </div>
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

                        {/* Minimal Controls */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                {/* Removed Engage Button */}
                                <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                                    {isPlaying ? 'READING...' : 'PAUSED'}
                                </span>
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
