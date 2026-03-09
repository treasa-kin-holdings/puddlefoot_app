import React, { useRef, useEffect, useState } from 'react';
import { useCompanion } from '@/context/CompanionContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Download, Check, Loader2 } from 'lucide-react';
import { saveGardenMedia, base64ToBlob } from '@/lib/gardenMedia';

export default function ChatHistory() {
    const { messages, isLoading, uiMode, tier, userId, requestUpgrade } = useCompanion();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const isChatting = uiMode === 'CHATTING';

    const [savingIndexes, setSavingIndexes] = useState<Record<number, 'saving' | 'saved'>>({});

    const handleSaveImage = async (index: number, m: any) => {
        if (tier !== 'premium') {
            requestUpgrade("save_garden_media");
            return;
        }
        if (!userId || !m.image) return;

        setSavingIndexes(prev => ({ ...prev, [index]: 'saving' }));
        try {
            const { blob, mime } = base64ToBlob(m.image);
            await saveGardenMedia({
                userId,
                blob,
                mimeType: mime,
                kind: m.imageKind ?? 'photo',
                title: m.imageTitle ?? 'Chat Image',
                metadata: m.imageMetadata,
            });
            setSavingIndexes(prev => ({ ...prev, [index]: 'saved' }));
            setTimeout(() => {
                setSavingIndexes(prev => {
                    const next = { ...prev };
                    delete next[index];
                    return next;
                });
            }, 3000);
        } catch (err: any) {
            console.error(err);
            setSavingIndexes(prev => {
                const next = { ...prev };
                delete next[index];
                return next;
            });
        }
    };

    // Check if user is near bottom
    const isNearBottom = () => {
        if (!scrollRef.current) return true;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        return scrollHeight - scrollTop - clientHeight < 100;
    };

    const handleScroll = () => {
        if (!scrollRef.current) return;
        // Show button if NOT near bottom
        setShowScrollButton(!isNearBottom());
    };

    const scrollToBottom = (instant = false) => {
        // Prefer scrolling the container directly for stability
        if (scrollRef.current) {
            const { scrollHeight, clientHeight } = scrollRef.current;
            scrollRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: instant ? 'auto' : 'smooth'
            });
            return;
        }

        // Fallback to scrollIntoView if scrollRef is missing (rare)
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: instant ? 'auto' : 'smooth',
                block: 'end'
            });
        }
    };

    // Auto-scroll effect
    useEffect(() => {
        // Safety check to ensure refs are attached
        if (!scrollRef.current) return;

        // Double RAF to ensure layout paint
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollToBottom();
            });
        });
    }, [messages, isLoading, uiMode]);

    return (
        <AnimatePresence>
            {isChatting && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }} // Wait for Puddlefoot
                    className="flex flex-col h-full w-[90%] max-w-3xl mx-auto p-4 pointer-events-none relative z-20"
                >
                    {/* Spacer for top safe zone / header */}
                    <div className="h-32 flex-shrink-0" />

                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="w-full space-y-6 px-4 pointer-events-auto h-[calc(100vh-160px)] overflow-y-auto"
                    >
                        {messages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div
                                    className="w-full shadow-sm text-base leading-relaxed relative bg-[#FDFBF7] text-[#333333] border border-[#8F9779] font-serif rounded-[15px_25px_15px_20px] texture-grain mt-8"
                                    style={{ padding: '10px 16px' }}
                                >
                                    <p className="font-heading text-xl text-oxblood-plum mb-2">Hi! I'm Puddlefoot.</p>
                                    <p className="font-sans text-base text-slate-blue-grey">How can I help you grow?</p>
                                </div>
                            </motion.div>
                        )}

                        {messages.map((m, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`w-full shadow-sm text-base leading-relaxed relative ${m.role === 'user'
                                        ? 'bg-nature-green text-white rounded-2xl rounded-br-none shadow-md backdrop-blur-md'
                                        : 'bg-[#FDFBF7] text-[#333333] border border-[#8F9779] font-serif rounded-[15px_25px_15px_20px] texture-grain'
                                        }`}
                                    style={{ padding: '10px 16px' }}
                                >
                                    {m.image && (
                                        <div className="mb-3 relative max-w-[240px] rounded-lg overflow-hidden border border-[#8F9779]/20 shadow-sm w-fit">
                                            <img
                                                src={m.image}
                                                alt="Attached"
                                                className="w-full object-cover block"
                                            />
                                            <button
                                                onClick={() => handleSaveImage(i, m)}
                                                disabled={savingIndexes[i] === 'saving' || savingIndexes[i] === 'saved'}
                                                className="absolute bottom-2 right-2 p-2 rounded-full shadow-md border border-gray-200 z-[100] transition-colors bg-white text-[#8F9779] hover:bg-gray-100 disabled:opacity-80 flex items-center justify-center"
                                                style={{
                                                    backgroundColor: savingIndexes[i] === 'saved' ? '#22c55e' : 'white',
                                                    color: savingIndexes[i] === 'saved' ? 'white' : '#8F9779',
                                                    borderColor: savingIndexes[i] === 'saved' ? '#16a34a' : 'rgba(255,255,255,0.4)',
                                                }}
                                                aria-label="Save to Gallery"
                                            >
                                                {savingIndexes[i] === 'saved' ? (
                                                    <Check size={18} />
                                                ) : savingIndexes[i] === 'saving' ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <Download size={18} className="stroke-[2.5]" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap">{m.content}</div>
                                </div>
                            </motion.div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-[#FFFDD0]/90 backdrop-blur-sm text-slate-blue-grey p-4 rounded-2xl rounded-bl-none border border-stone-200/50 shadow-sm flex items-center gap-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-oxblood-plum/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                        <div className="w-2 h-2 bg-oxblood-plum/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <div className="w-2 h-2 bg-oxblood-plum/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Spacer for bottom input/dock */}
                        <div className="h-[140px] flex-shrink-0" />
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Floating Scroll Button */}
                    <AnimatePresence>
                        {showScrollButton && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                onClick={() => scrollToBottom(false)}
                                className="absolute bottom-32 right-8 pointer-events-auto bg-[#8F9779] text-white p-3 rounded-full shadow-lg hover:bg-[#7A8268] transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-[#8F9779]/50"
                                aria-label="Scroll to bottom"
                            >
                                <ArrowDown className="w-5 h-5" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
