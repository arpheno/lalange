import React, { useEffect, useRef, useState } from 'react';
import { type BookDocType, type ChapterDocType, type ReadingStateDocType, initDB, resetDB } from '../../core/sync/db';
import { getBionicSplit, getBionicGradientHtml } from '../../core/rsvp/bionic';
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
    const [showSettings, setShowSettings] = useState(false);
    const [inspectingChapter, setInspectingChapter] = useState<ChapterDocType | null>(null);
    const [, setTick] = useState(0); // Force re-render for live time updates

    const containerRef = useRef<HTMLDivElement>(null);
    const prevContainerRef = useRef<HTMLDivElement>(null);
    const nextContainerRef = useRef<HTMLDivElement>(null);
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
    const chaptersRef = useRef(chapters);
    const currentChapterRef = useRef(currentChapter);

    // Summary Mode Refs
    const [isSummaryActive, setIsSummaryActive] = useState(false);
    const isSummaryActiveRef = useRef(false);
    const savedChapterIndexRef = useRef(0);
    const summaryWordsRef = useRef<string[]>([]);

    // Sync refs
    useEffect(() => {
        if (!isSummaryActiveRef.current) {
            wpmRef.current = wpm;
        }
    }, [wpm]);

    useEffect(() => {
        chaptersRef.current = chapters;
    }, [chapters]);

    useEffect(() => {
        currentChapterRef.current = currentChapter;
    }, [currentChapter]);

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

    const loadChapter = async (chapterId: string, initialIndex: number = 0, autoPlay: boolean = false) => {
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

                if (autoPlay) {
                    setIsPlaying(true);
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
        // Update RSVP Display
        if (rsvpRef.current) {
            const currentWord = words[idx];
            if (currentWord) {
                // Use gradient for the main RSVP display
                rsvpRef.current.innerHTML = getBionicGradientHtml(currentWord);
            }
        }

        // Render Previous Context (Last ~30 words)
        if (prevContainerRef.current) {
            const start = Math.max(0, idx - 30);
            const end = idx;
            const prevWords = words.slice(start, end);
            const html = prevWords.map((w, i) => {
                const actualIndex = start + i;
                const { bold, light } = getBionicSplit(w);
                return `
                    <span 
                        class="word-span inline-block mr-2 mb-2 transition-all duration-300 cursor-pointer text-gray-500 opacity-40 hover:opacity-100 hover:text-white"
                        data-index="${actualIndex}"
                    >
                        <span class="font-bold">${bold}</span><span class="font-light opacity-80">${light}</span>
                    </span>
                `;
            }).join('');
            prevContainerRef.current.innerHTML = html;
            // Scroll to bottom
            prevContainerRef.current.scrollTop = prevContainerRef.current.scrollHeight;
        }

        // Render Next Context (Next ~30 words)
        if (nextContainerRef.current) {
            const start = idx + 1;
            const end = Math.min(words.length, idx + 31);
            const nextWords = words.slice(start, end);
            const html = nextWords.map((w, i) => {
                const actualIndex = start + i;
                const { bold, light } = getBionicSplit(w);
                return `
                    <span 
                        class="word-span inline-block mr-2 mb-2 transition-all duration-300 cursor-pointer text-gray-500 opacity-40 hover:opacity-100 hover:text-white"
                        data-index="${actualIndex}"
                    >
                        <span class="font-bold">${bold}</span><span class="font-light opacity-80">${light}</span>
                    </span>
                `;
            }).join('');
            nextContainerRef.current.innerHTML = html;
            // Scroll to top (default)
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
            const activeWords = isSummaryActiveRef.current ? summaryWordsRef.current : wordsRef.current;
            const activeDensities = isSummaryActiveRef.current ? [] : densitiesRef.current;

            const currentWord = activeWords[indexRef.current] || '';
            const density = activeDensities[indexRef.current];
            const currentDensity = density !== undefined ? density : 1.0;
            // If density is 0 (junk), we ignore punctuation delay to ensure it's skipped instantly
            const punctuationDelay = currentDensity === 0 ? 0 : getPunctuationDelay(currentWord, baseInterval);

            const targetInterval = (baseInterval * currentDensity) + punctuationDelay;

            if (accumulatorRef.current >= targetInterval) {
                if (indexRef.current < activeWords.length - 1) {
                    indexRef.current++;
                    accumulatorRef.current -= targetInterval;
                    shouldRender = true;

                    // Check for Subchapter Boundary (only if NOT in summary mode)
                    if (!isSummaryActiveRef.current) {
                        const sub = currentChapterRef.current?.subchapters?.find(s => s.endWordIndex === indexRef.current);
                        if (sub && sub.summary) {
                            // Enter Summary Mode
                            isSummaryActiveRef.current = true;
                            setIsSummaryActive(true);

                            savedChapterIndexRef.current = indexRef.current;

                            // Swap words
                            summaryWordsRef.current = sub.summary.split(' ');
                            indexRef.current = 0;

                            // Slow down WPM
                            wpmRef.current = 100;

                            // Force render first word of summary
                            renderWord(0, summaryWordsRef.current);
                            return; // Continue loop next frame
                        }
                    }
                } else {
                    // End of words
                    if (isSummaryActiveRef.current) {
                        // End of Summary -> Resume Chapter
                        isSummaryActiveRef.current = false;
                        setIsSummaryActive(false);

                        // Restore
                        indexRef.current = savedChapterIndexRef.current;
                        wpmRef.current = wpm; // Restore user WPM

                        renderWord(indexRef.current, wordsRef.current);
                        return;
                    }

                    // End of Chapter
                    shouldRender = true;

                    // Find next chapter
                    const chapters = chaptersRef.current;
                    const currentChapter = currentChapterRef.current;
                    const currentIndex = chapters.findIndex(c => c.id === currentChapter?.id);

                    if (currentIndex !== -1 && currentIndex < chapters.length - 1) {
                        const nextChapter = chapters[currentIndex + 1];
                        // Auto-play next chapter
                        loadChapter(nextChapter.id, 0, true);
                        // Break loop, loadChapter will restart it via setIsPlaying(true)
                        break;
                    } else {
                        setIsPlaying(false);
                        break;
                    }
                }
            } else {
                break;
            }
        }

        if (shouldRender) {
            const activeWords = isSummaryActiveRef.current ? summaryWordsRef.current : wordsRef.current;
            renderWord(indexRef.current, activeWords);
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
        <div className="relative w-full h-screen bg-basalt text-white overflow-hidden flex">
            {/* Floating Header / Controls */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-start pointer-events-none">
                {/* Menu Button */}
                <button
                    onClick={() => setShowSidebar(true)}
                    className="pointer-events-auto p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-dune-gold hover:bg-white/10 transition-colors shadow-lg lg:hidden"
                    title="Chapters"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Chapter Title (Centered) */}
                <div className="mt-2 px-6 py-2 bg-black/20 backdrop-blur-sm rounded-full border border-white/5 shadow-lg">
                    <h3 className="font-mono text-xs text-gray-400 tracking-widest uppercase">{currentChapter?.title}</h3>
                </div>

                {/* Settings Button */}
                <button data-testid="settings-button" onClick={() => setShowSettings(!showSettings)}
                    className={`pointer-events-auto p-3 backdrop-blur-md rounded-full border border-white/10 transition-colors shadow-lg ${showSettings ? 'bg-dune-gold text-black' : 'bg-black/40 text-dune-gold hover:bg-white/10'}`}
                    title="Settings"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>

            {/* Settings Overlay (Floating) */}
            {showSettings && (
                <div className="absolute top-20 right-4 z-50 w-72 bg-basalt/95 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-2xl flex flex-col gap-6">
                    {/* Progress Control */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-mono text-gray-400">
                            <span>PROGRESS</span>
                            <span>{currentWordIndex} / {wordsRef.current.length}</span>
                        </div>
                        <input
                            type="range" aria-label="Progress" min="0"
                            max={wordsRef.current.length - 1}
                            value={currentWordIndex}
                            onChange={handleSliderChange}
                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-dune-gold hover:accent-magma-vent transition-colors"
                        />
                    </div>

                    {/* WPM Control */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-mono text-gray-400">
                            <span>VELOCITY</span>
                            <span>{wpm} WPM</span>
                        </div>
                        <input
                            type="range" aria-label="WPM" min="100"
                            max="1000"
                            step="50"
                            value={wpm}
                            onChange={(e) => setWpm(parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-dune-gold"
                        />
                    </div>

                    {/* Chapter Navigation */}
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                        <button
                            onClick={handlePrevChapter}
                            disabled={!currentChapter || chapters.findIndex(c => c.id === currentChapter.id) === 0}
                            className="text-xs font-mono text-gray-500 hover:text-dune-gold disabled:opacity-30 uppercase tracking-wider transition-colors"
                        >
                            &lt; Prev
                        </button>
                        <button
                            data-testid="next-chapter-button"
                            onClick={handleNextChapter}
                            disabled={!currentChapter || chapters.findIndex(c => c.id === currentChapter.id) === chapters.length - 1}
                            className="text-xs font-mono text-gray-500 hover:text-dune-gold disabled:opacity-30 uppercase tracking-wider transition-colors"
                        >
                            Next &gt;
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={() => {
                                if (confirm('NUKE DATABASE? This will delete all books and progress.')) {
                                    resetDB();
                                }
                            }}
                            className="w-full py-2 text-xs font-mono text-red-500 border border-red-500/30 hover:bg-red-500/10 rounded transition-colors uppercase tracking-widest"
                        >
                            NUKE DATABASE
                        </button>
                    </div>
                </div>
            )}

            {/* Sidebar Overlay (Drawer) */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-80 bg-basalt border-r border-white/10 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-0 lg:shadow-none ${showSidebar ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : '-translate-x-full'}`}
            >
                <Sidebar
                    chapters={chapters}
                    currentChapter={currentChapter}
                    onLoadChapter={(id, index) => {
                        loadChapter(id, index || 0);
                        if (window.innerWidth < 1024) {
                            setShowSidebar(false);
                        }
                    }}
                    onInspectChapter={setInspectingChapter}
                    wpm={wpm}
                />
            </div>
            {/* Backdrop for sidebar */}
            {showSidebar && <div className="absolute inset-0 bg-black/50 z-40 backdrop-blur-sm lg:hidden" onClick={() => setShowSidebar(false)} />}

            {/* Main Reader Area (Full Screen) */}
            <div className="flex-1 h-full relative flex flex-col min-w-0">
                <div className="w-full h-full flex flex-col relative group"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >

                    {/* Top Zone: Previous Context */}
                    <div className="flex-1 w-full overflow-hidden relative mask-gradient-top">
                        <div ref={prevContainerRef} className="w-full h-full flex flex-wrap content-end justify-start p-8 md:p-16 font-mono text-xl md:text-2xl leading-relaxed select-none overflow-hidden"></div>
                    </div>

                    {/* Middle Zone: RSVP (Click to Toggle) */}
                    <div
                        data-testid="rsvp-container"
                        className="relative h-48 w-full flex items-center justify-center bg-black/20 border-y border-white/5 z-30 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setIsPlaying(!isPlayingRef.current)}
                    >
                        {/* Bionic Word */}
                        <div ref={rsvpRef} className={`text-6xl md:text-8xl font-mono tracking-tight whitespace-nowrap drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] ${isSummaryActive ? 'text-orange-500' : 'text-white'}`}>
                            {wordsRef.current[currentWordIndex] && (
                                <span dangerouslySetInnerHTML={{ __html: getBionicGradientHtml(wordsRef.current[currentWordIndex]) }} />
                            )}
                        </div>

                        {/* Play/Pause Overlay */}
                        {!isPlaying && (
                            <div data-testid="play-overlay" className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
                                <div className="bg-black/40 backdrop-blur-sm p-6 rounded-full border border-white/10 shadow-2xl">
                                    <svg className="w-12 h-12 text-white/80 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Zone: Next Context */}
                    <div className="flex-1 w-full overflow-hidden relative mask-gradient-bottom">
                        <div ref={nextContainerRef} className="w-full h-full flex flex-wrap content-start justify-start p-8 md:p-16 font-mono text-xl md:text-2xl leading-relaxed select-none overflow-hidden" onClick={handleRiverClick}></div>
                    </div>

                    {/* Scroll Zones */}
                    <div
                        className="absolute top-0 left-0 right-0 h-24 z-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-center pt-4 text-xs font-mono text-magma-vent cursor-n-resize bg-gradient-to-b from-black/50 to-transparent pointer-events-auto"
                        onMouseEnter={() => startScrolling('back')}
                        onMouseLeave={stopScrolling}
                    >
                        SCROLL BACK
                    </div>
                    <div
                        className="absolute bottom-0 left-0 right-0 h-24 z-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 text-xs font-mono text-magma-vent cursor-s-resize bg-gradient-to-t from-black/50 to-transparent pointer-events-auto"
                        onMouseEnter={() => startScrolling('fwd')}
                        onMouseLeave={stopScrolling}
                    >
                        SCROLL FWD
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
