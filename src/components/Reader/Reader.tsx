import React, { useEffect, useRef, useState } from 'react';
import { type BookDocType, type ChapterDocType, type ReadingStateDocType, initDB } from '../../core/sync/db';
import { calculateORP } from '../../core/rsvp/orp';

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

    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef<number | undefined>(undefined);
    const accumulatorRef = useRef<number>(0);

    // Refs for loop access
    const indexRef = useRef(0);
    const wpmRef = useRef(wpm);
    const isPlayingRef = useRef(isPlaying);
    const wordsRef = useRef<string[]>([]);

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

    // Load initial state
    useEffect(() => {
        const loadState = async () => {
            setLoading(true);
            const db = await initDB();

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
                const chapter = await db.chapters.findOne(stateDoc.currentChapterId).exec();
                if (chapter) {
                    const chapterDoc = chapter.toJSON() as ChapterDocType;
                    setCurrentChapter(chapterDoc);
                    wordsRef.current = chapterDoc.content;
                    indexRef.current = stateDoc.currentWordIndex;
                    setCurrentWordIndex(stateDoc.currentWordIndex);
                    renderWord(stateDoc.currentWordIndex, chapterDoc.content);
                }
            }
            setLoading(false);
        };
        loadState();
    }, [book.id]);

    // Effect to render word when chapter or index changes, ensuring ref is available
    useEffect(() => {
        if (!loading && currentChapter && wordsRef.current.length > 0) {
            renderWord(currentWordIndex, wordsRef.current);
        }
    }, [loading, currentChapter, currentWordIndex]);

    const saveProgress = async () => {
        if (!readingState || !currentChapter) return;
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

    const loadChapter = async (chapterId: string) => {
        setIsPlaying(false);
        setLoading(true);
        const db = await initDB();
        const chapter = await db.chapters.findOne(chapterId).exec();
        if (chapter) {
            const chapterDoc = chapter.toJSON() as ChapterDocType;
            setCurrentChapter(chapterDoc);
            wordsRef.current = chapterDoc.content;
            indexRef.current = 0;
            setCurrentWordIndex(0);
            renderWord(0, chapterDoc.content);

            // Update state immediately
            const stateDoc = await db.reading_states.findOne(book.id).exec();
            if (stateDoc) {
                await stateDoc.incrementalPatch({
                    currentChapterId: chapterId,
                    currentWordIndex: 0
                });
            }
        }
        setLoading(false);
    };

    const handleNextChapter = () => {
        if (!currentChapter) return;
        const currentIndex = book.chapterIds.indexOf(currentChapter.id);
        if (currentIndex < book.chapterIds.length - 1) {
            loadChapter(book.chapterIds[currentIndex + 1]);
        }
    };

    const handlePrevChapter = () => {
        if (!currentChapter) return;
        const currentIndex = book.chapterIds.indexOf(currentChapter.id);
        if (currentIndex > 0) {
            loadChapter(book.chapterIds[currentIndex - 1]);
        }
    };

    const renderWord = (idx: number, words: string[]) => {
        if (!containerRef.current || idx >= words.length) return;
        const word = words[idx];
        const orp = calculateORP(word);

        const left = word.slice(0, orp);
        const center = word[orp];
        const right = word.slice(orp + 1);

        containerRef.current.innerHTML = `
            <div class="flex items-center justify-center text-4xl md:text-6xl font-mono">
                <span class="text-right w-[12ch] whitespace-pre">${left}</span>
                <span class="text-red-500 font-bold">${center}</span>
                <span class="text-left w-[12ch] whitespace-pre">${right}</span>
            </div>
        `;
    };

    const loop = (time: number) => {
        if (!isPlayingRef.current) return;

        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        accumulatorRef.current += deltaTime;
        const targetInterval = 60000 / wpmRef.current;

        let shouldRender = false;

        if (accumulatorRef.current > 1000) {
            accumulatorRef.current = targetInterval;
        }

        while (accumulatorRef.current >= targetInterval) {
            if (indexRef.current < wordsRef.current.length - 1) {
                indexRef.current++;
                accumulatorRef.current -= targetInterval;
                shouldRender = true;
            } else {
                setIsPlaying(false);
                shouldRender = true;
                // Auto-advance to next chapter? Maybe optional.
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

    if (loading) {
        return <div className="flex items-center justify-center h-full font-mono">Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center w-full h-full max-w-4xl p-4">
            {/* Header Info */}
            <div className="absolute top-16 left-0 right-0 text-center">
                <h3 className="font-mono text-sm text-gray-500">{currentChapter?.title}</h3>
            </div>

            {/* Reticle / Word Display */}
            <div className="relative w-full h-64 flex items-center justify-center border-y border-gray-800 mb-8 bg-gray-900/50">
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-700/50 transform -translate-x-1/2"></div>
                <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-700/50 transform -translate-y-1/2"></div>
                <div ref={containerRef} className="z-10"></div>
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
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <span className="font-mono text-xs text-gray-500 w-12">{wordsRef.current.length}</span>
                </div>

                {/* Play/Pause & WPM */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="px-8 py-3 bg-white text-black font-mono font-bold hover:bg-gray-200 transition-colors rounded"
                        >
                            {isPlaying ? 'PAUSE' : 'READ'}
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="font-mono text-sm text-gray-400">WPM: {wpm}</span>
                        <input
                            type="range" aria-label="WPM" min="100"
                            max="1000"
                            step="50"
                            value={wpm}
                            onChange={(e) => setWpm(parseInt(e.target.value))}
                            className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                    </div>
                </div>

                {/* Chapter Navigation */}
                <div className="flex justify-between items-center mt-4 border-t border-gray-800 pt-4">
                    <button
                        onClick={handlePrevChapter}
                        disabled={!currentChapter || book.chapterIds.indexOf(currentChapter.id) === 0}
                        className="text-sm font-mono text-gray-400 hover:text-white disabled:opacity-30"
                    >
                        &lt; Prev Chapter
                    </button>
                    <button
                        onClick={handleNextChapter}
                        disabled={!currentChapter || book.chapterIds.indexOf(currentChapter.id) === book.chapterIds.length - 1}
                        className="text-sm font-mono text-gray-400 hover:text-white disabled:opacity-30"
                    >
                        Next Chapter &gt;
                    </button>
                </div>
            </div>
        </div>
    );
};
