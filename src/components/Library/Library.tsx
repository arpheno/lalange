import React, { useState, useEffect } from 'react';
import { initDB, type BookDocType } from '../../core/sync/db';
import { ingestEpubWithLLM } from '../../core/ingest/pipeline';

interface LibraryProps {
    onOpenBook: (book: BookDocType) => void;
}

export const Library: React.FC<LibraryProps> = ({ onOpenBook }) => {
    const [books, setBooks] = useState<BookDocType[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        let sub: any;
        const setup = async () => {
            const db = await initDB();
            sub = db.books.find().$.subscribe(docs => {
                setBooks(docs.map(d => d.toJSON() as BookDocType));
            });
        };
        setup();
        return () => {
            if (sub) sub.unsubscribe();
        };
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setLoading(true);
        setStatus('Starting ingestion...');
        try {
            const { book, chapters, images } = await ingestEpubWithLLM(e.target.files[0], (msg) => setStatus(msg));
            const db = await initDB();
            await db.books.insert(book);
            await db.chapters.bulkInsert(chapters);
            if (images.length > 0) {
                await db.images.bulkInsert(images);
            }
            
            // Initialize reading state
            await db.reading_states.insert({
                bookId: book.id,
                currentChapterId: chapters[0]?.id,
                currentWordIndex: 0,
                lastRead: Date.now(),
                highlights: []
            });
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to load book');
        } finally {
            setLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="p-8 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-mono font-bold">Library</h2>
                <div className="flex items-center gap-4">
                    {status && <span className="font-mono text-xs text-yellow-500 animate-pulse">{status}</span>}
                    <label className="cursor-pointer bg-white text-black px-4 py-2 font-mono font-bold hover:bg-gray-200 transition-colors">
                        {loading ? 'Processing...' : 'Add EPUB'}
                        <input
                            type="file"
                            accept=".epub"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={loading}
                        />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {books.map(book => (
                    <div
                        key={book.id}
                        onClick={() => onOpenBook(book)}
                        className="cursor-pointer group"
                    >
                        <div className="aspect-[2/3] bg-gray-800 mb-2 overflow-hidden border border-gray-700 group-hover:border-white transition-colors relative">
                            {book.cover ? (
                                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-xs p-2 text-center">
                                    No Cover
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                                {/* Progress bar removed for now as it requires async lookup of reading state */}
                            </div>
                        </div>
                        <h3 className="font-mono text-sm font-bold truncate">{book.title}</h3>
                        <p className="font-mono text-xs text-gray-400 truncate">{book.author}</p>
                    </div>
                ))}
            </div>

            {books.length === 0 && !loading && (
                <div className="text-center text-gray-500 font-mono mt-20">
                    Library is empty. Add an EPUB to start.
                </div>
            )}
        </div>
    );
};
