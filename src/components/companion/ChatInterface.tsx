'use client';

import React, { useState, useRef } from 'react';
import { useCompanion } from '@/context/CompanionContext';
import { Send, Image as ImageIcon, X, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadPlantImage } from '@/lib/storage';
import { compressImage } from '@/lib/compression';
import { Toast, ToastType } from '@/components/ui/Toast';

export default function ChatInterface() {
    const {
        uiMode, setUiMode,
        tier,
        isProcessing, setIsProcessing,
        isKeyboardOpen,
        isUploadOpen, setIsUploadOpen,
        sendMessage: sendContextMessage,
        addMessage,
        isLoading
    } = useCompanion();

    const [input, setInput] = useState('');
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

            // Add local feedback message
            addMessage({ role: 'assistant', content: "Optimizing your image..." });

            try {
                const compressedImage = await compressImage(file);
                showToast("Uploading...", "info");
                const imageUrl = await uploadPlantImage(compressedImage);
                console.log('Image uploaded successfully:', imageUrl);
                showToast("Image Uploaded!", "success");

                addMessage({ role: 'assistant', content: "I see your plant! Analyzing..." });
                setIsProcessing(false);
                setIsUploadOpen(false); // Close upload state

            } catch (error) {
                console.error(error);
                setIsProcessing(false);
                showToast("Upload failed.", "error");
                addMessage({ role: 'assistant', content: "I couldn't upload that image. Please try again." });
                setIsUploadOpen(false);
            }
        } else {
            // Cancelled
            setIsUploadOpen(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isProcessing || isLoading) return;

        const content = input;
        setInput('');
        setUiMode('SPEAKING'); // Trigger avatar animation

        await sendContextMessage(content);
    };

    return (
        <>
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
                                disabled={!input.trim() || isProcessing || isLoading}
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
