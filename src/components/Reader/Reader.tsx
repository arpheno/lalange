import React, { useEffect, useRef, useState } from 'react';
import { type BookDocType, initDB } from '../../core/sync/db';
import { calculateORP } from '../../core/rsvp/orp';

interface ReaderProps {
    book: BookDocType;
    onBack?: () => void;
}

export const Reader: React.FC<ReaderProps> = ({ book }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [wpm, setWpm] = useState(300);
    const [currentIndex, setCurrentIndex] = useState(book.progress);

    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef<number | undefined>(undefined);
    const accumulatorRef = useRef<number>(0);
    const indexRef = useRef(book.progress);
    const wpmRef = useRef(wpm);
    const isPlayingRef = useRef(isPlaying);

    const words = book.content;

    // Sync refs
    useEffect(() => {
        wpmRef.current = wpm;
    }, [wpm]);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
        if (!isPlaying) {
            // Save progress when paused
            saveProgress();
            setCurrentIndex(indexRef.current);
        } else {
            lastTimeRef.current = undefined;
            accumulatorRef.current = 0;
            requestRef.current = requestAnimationFrame(loop);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying]);

    const saveProgress = async () => {
        const db = await initDB();
        const doc = await db.books.findOne(book.id).exec();
        if (doc) {
            await doc.patch({
                progress: indexRef.current,
                lastRead: Date.now()
            });
        }
    };

    const renderWord = (idx: number) => {
        if (!containerRef.current || idx >= words.length) return;
        const word = words[idx];
        const orp = calculateORP(word);

        const left = word.slice(0, orp);
        const center = word[orp];
        const right = word.slice(orp + 1);

        // Using fixed width spans to align the ORP
        // 12ch is arbitrary but should cover most words' left/right parts
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

        // Safety cap to prevent spiral of death if tab was backgrounded
        if (accumulatorRef.current > 1000) {
            accumulatorRef.current = targetInterval;
        }

        while (accumulatorRef.current >= targetInterval) {
            if (indexRef.current < words.length - 1) {
                indexRef.current++;
                accumulatorRef.current -= targetInterval;
                shouldRender = true;
            } else {
                setIsPlaying(false);
                shouldRender = true; // Render last word
                break;
            }
        }

        if (shouldRender) {
            renderWord(indexRef.current);
        }

        requestRef.current = requestAnimationFrame(loop);
    };

    // Initial render
    useEffect(() => {
        renderWord(currentIndex);
        indexRef.current = currentIndex;
    }, [book.id]); // Reset when book changes

    // Handle slider change
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newIndex = parseInt(e.target.value);
        indexRef.current = newIndex;
        setCurrentIndex(newIndex);
        renderWord(newIndex);
        if (!isPlaying) {
            saveProgress();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full max-w-4xl p-4">
            {/* Reticle / Word Display */}
            <div className="relative w-full h-64 flex items-center justify-center border-y border-gray-800 mb-8 bg-gray-900/50">
                {/* Reticle Lines */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-700/50 transform -translate-x-1/2"></div>
                <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-700/50 transform -translate-y-1/2"></div>

                <div ref={containerRef} className="z-10"></div>
            </div>

            {/* Controls */}
            <div className="w-full flex flex-col gap-6">
                {/* Progress Bar */}
                <div className="w-full flex items-center gap-4">
                    <span className="font-mono text-xs text-gray-500 w-12 text-right">{currentIndex}</span>
                    <input
                        type="range"
                        min="0"
                        max={words.length - 1}
                        value={currentIndex}
                        onChange={handleSliderChange}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <span className="font-mono text-xs text-gray-500 w-12">{words.length}</span>
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
                            type="range"
                            min="100"
                            max="1000"
                            step="50"
                            value={wpm}
                            onChange={(e) => setWpm(parseInt(e.target.value))}
                            className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
