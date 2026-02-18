'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useCompanion } from '@/context/CompanionContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatInputOverlay() {
    const { isKeyboardOpen, sendMessage, isLoading } = useCompanion();
    const [inputText, setInputText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when keyboard opens
    useEffect(() => {
        if (isKeyboardOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isKeyboardOpen]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        sendMessage(inputText);
        setInputText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <AnimatePresence>
            {isKeyboardOpen && (
                <div
                    className="fixed z-[60] px-4 pointer-events-none flex justify-center"
                    style={{
                        bottom: '7rem', // bottom-28
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '90%', // Added space on sides
                        maxWidth: '48rem' // max-w-3xl
                    }}
                >
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full pointer-events-auto"
                    >
                        <div
                            className="flex gap-3 bg-[#FDFBF7] shadow-sm border border-[#8F9779] items-center transition-shadow duration-300 focus-within:ring-2 focus-within:ring-[#8F9779]/50 rounded-[15px_25px_15px_20px] texture-grain overflow-hidden"
                            style={{ padding: '8px 12px' }} // Reduced spacing (50%)
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Write in the garden journal..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-lg text-[#333333] placeholder:text-[#8C8174]/70 font-serif"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !inputText.trim()}
                                className="bg-[#8F9779] text-white p-2.5 rounded-full hover:bg-[#7A8268] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-sm"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
