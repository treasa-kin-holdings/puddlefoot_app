'use client';

import React, { useState, useRef } from 'react';
import { useCompanion } from '@/context/CompanionContext';
import { Send, Image as ImageIcon, X, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { uploadPlantImage } from '@/lib/storage';
import { compressImage } from '@/lib/compression';
import { Toast, ToastType } from '@/components/ui/Toast';

// Helper to use existing chat logic or reimplement for companion
// I will reimplement a simplified version tailored for this UI
export default function ChatInterface() {
    const {
        uiMode, setUiMode,
        tier,
        isProcessing, setIsProcessing,
        isKeyboardOpen,
        isUploadOpen, setIsUploadOpen
    } = useCompanion();

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    // Trigger file selection when isUploadOpen changes to true
    React.useEffect(() => {
        if (isUploadOpen && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [isUploadOpen]);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Immediately process and upload upon selection
            showToast("Optimizing Image...", "info");
            setUiMode('SPEAKING');
            setIsProcessing(true);

            try {
                const compressedImage = await compressImage(file);
                showToast("Uploading...", "info");
                const imageUrl = await uploadPlantImage(compressedImage);
                console.log('Image uploaded successfully:', imageUrl);
                showToast("Image Uploaded!", "success");

                // Simulate AI response
                setTimeout(() => {
                    setMessages(prev => [...prev, { role: 'assistant', content: "I see your plant! Analyzing..." }]);
                    setIsProcessing(false);
                    setIsUploadOpen(false); // Close upload state
                }, 2000);

            } catch (error) {
                console.error(error);
                setIsProcessing(false);
                showToast("Upload failed.", "error");
                setIsUploadOpen(false);
            }
        } else {
            // Cancelled
            setIsUploadOpen(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isProcessing) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsProcessing(true);
        setUiMode('SPEAKING'); // Trigger avatar animation

        // Simulate AI response
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: "That's a great question about your garden." }]);
            setIsProcessing(false);
        }, 2000);
    };

    return (
        <>
            {/* Messages Area - Always visible if there are messages, or specific mode? */}
            {/* Let's make messages fade in/out or stay persistent in background */}
            <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-end pb-32 px-4">
                <div className="flex-1 overflow-y-auto space-y-4 max-h-[50vh] mask-image-gradient" style={{ scrollbarWidth: 'none' }}>
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`pointer-events-auto max-w-[85%] p-3 rounded-2xl shadow-sm ${m.role === 'user'
                                ? 'bg-nature-green text-white rounded-br-none'
                                : 'bg-white/90 backdrop-blur-sm text-foreground rounded-bl-none border border-white/40'}`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Input Overlay - Only visible when isKeyboardOpen is true */}
            <AnimatePresence>
                {isKeyboardOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 left-0 right-0 px-4 z-40"
                    >
                        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-2 flex items-center gap-2 max-w-md mx-auto">
                            <input
                                autoFocus
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Puddlefoot..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-foreground placeholder-gray-400 py-2 px-2"
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isProcessing}
                                className={`p-2 rounded-full transition-all ${(!input.trim()) ? 'bg-gray-200 text-gray-400' : 'bg-nature-green text-white shadow-md hover:scale-105'}`}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden File Input */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageSelect}
            />

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
