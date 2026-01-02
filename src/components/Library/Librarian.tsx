import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../../core/store/settings';
import { generateUnifiedCompletion } from '../../core/ai/service';
import { searchGutenberg, type GutenbergBook } from '../../core/api/gutendex';

interface Recommendation {
    title: string;
    author: string;
    reason: string;
    modern_counterpart?: {
        title: string;
        author: string;
        reason: string;
    };
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    recommendations?: Recommendation[];
    books?: GutenbergBook[];
}

export const Librarian: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        librarianBasePrompt,
        librarianPersona,
        affiliateLinksEnabled,
        librarianModelTier
    } = useSettingsStore();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const constructSystemPrompt = () => {
        let prompt = librarianBasePrompt;

        if (librarianPersona === 'lacanian') {
            prompt += "\n\nAdopt the persona of a Lacanian psychoanalyst. Analyze the user's desire through the lens of the symbolic, imaginary, and real. Speak in riddles and psychoanalytic jargon, but ultimately guide them to a book.";
        }

        prompt += "\n\nYou must respond in a specific JSON format. Do not include any text outside the JSON object.";
        prompt += "\nJSON Format: { \"thought\": \"your internal reasoning\", \"message\": \"your response to the user\", \"recommendations\": [ { \"title\": \"Book Title\", \"author\": \"Author Name\", \"reason\": \"Why you recommended it\", \"modern_counterpart\": { \"title\": \"Modern Book Title\", \"author\": \"Modern Author\", \"reason\": \"Connection to the classic\" } } ] }";

        if (affiliateLinksEnabled) {
            prompt += "\n\nFor each recommendation, you MUST suggest a 'modern_counterpart' that explores similar themes but is a contemporary commercial book.";
        } else {
            prompt += "\n\nDo not suggest modern counterparts unless specifically asked.";
        }

        return prompt;
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsThinking(true);

        try {
            const systemPrompt = constructSystemPrompt();
            const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
            const fullPrompt = `${systemPrompt}\n\nConversation History:\n${conversationHistory}\nUser: ${input}\nAssistant:`;

            const { response } = await generateUnifiedCompletion(fullPrompt, librarianModelTier);

            // Try to parse JSON
            let parsedResponse;
            try {
                // Find the first '{' and last '}'
                const firstBrace = response.indexOf('{');
                const lastBrace = response.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    const jsonStr = response.substring(firstBrace, lastBrace + 1);
                    parsedResponse = JSON.parse(jsonStr);
                } else {
                    throw new Error("No JSON found");
                }
            } catch (e) {
                console.error("Failed to parse AI response", e);
                // Fallback for non-JSON response
                setMessages(prev => [...prev, { role: 'assistant', content: response }]);
                setIsThinking(false);
                return;
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: parsedResponse.message || parsedResponse.thought || "Here are my recommendations.",
                recommendations: parsedResponse.recommendations
            };

            // Fetch Gutenberg books
            if (parsedResponse.recommendations && parsedResponse.recommendations.length > 0) {
                const books: GutenbergBook[] = [];
                for (const rec of parsedResponse.recommendations) {
                    try {
                        const searchRes = await searchGutenberg(`${rec.title} ${rec.author}`);
                        if (searchRes.results.length > 0) {
                            books.push(searchRes.results[0]);
                        }
                    } catch (err) {
                        console.error(`Failed to fetch book: ${rec.title}`, err);
                    }
                }
                assistantMessage.books = books;
            }

            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error("Librarian error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I apologize, but I seem to have lost my train of thought. Please try again." }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950">
                <h2 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-200">The Librarian</h2>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                    <div className={`w-2 h-2 rounded-full ${isThinking ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                    {isThinking ? 'Thinking...' : 'Ready'}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg ${msg.role === 'user'
                            ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                            : 'bg-white border border-stone-200 dark:bg-stone-800 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                            }`}>
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        </div>

                        {msg.recommendations && msg.recommendations.map((rec, rIdx) => {
                            const book = msg.books?.[rIdx]; // Simple mapping by index for now
                            return (
                                <div key={rIdx} className="mt-2 w-full max-w-[85%] bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-3 shadow-sm">
                                    <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100">{rec.title}</h3>
                                    <p className="text-xs text-stone-500 mb-2">by {rec.author}</p>
                                    <p className="text-xs italic text-stone-600 dark:text-stone-400 mb-3">{rec.reason}</p>

                                    {book && (
                                        <div className="mb-3 p-2 bg-stone-50 dark:bg-stone-900 rounded border border-stone-100 dark:border-stone-800 flex gap-3">
                                            {book.formats['image/jpeg'] && (
                                                <img src={book.formats['image/jpeg']} alt={book.title} className="w-12 h-16 object-cover rounded shadow-sm" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">{book.title}</p>
                                                <a
                                                    href={book.formats['application/epub+zip']}
                                                    className="mt-2 inline-block px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                                                    download
                                                >
                                                    Download EPUB
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {affiliateLinksEnabled && rec.modern_counterpart && (
                                        <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-700">
                                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Modern Counterpart</p>
                                            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{rec.modern_counterpart.title}</p>
                                            <p className="text-xs text-stone-500">by {rec.modern_counterpart.author}</p>
                                            <a
                                                href={`https://www.amazon.com/s?k=${encodeURIComponent(rec.modern_counterpart.title + ' ' + rec.modern_counterpart.author)}&tag=scansion-20`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-block text-xs text-amber-600 hover:text-amber-700 hover:underline"
                                            >
                                                Buy Physical Copy ↗
                                            </a>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask the Librarian..."
                        className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm"
                        disabled={isThinking}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isThinking || !input.trim()}
                        className="px-4 py-2 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};
