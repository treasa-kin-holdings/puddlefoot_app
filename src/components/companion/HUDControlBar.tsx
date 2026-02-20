'use client';
// Force rebuild 2


import React from 'react';
import { useCompanion } from '@/context/CompanionContext';
import { Image as ImagePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ControlBar() {
    const {
        uiMode, setUiMode,
        tier,
        isKeyboardOpen, setIsKeyboardOpen,
        isUploadOpen, setIsUploadOpen,
        isCameraActive, setIsCameraActive,
        setSelectedImage,
        sendMessage, isLoading,
        isListening // Add listening state
    } = useCompanion();

    const [inputText, setInputText] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

    // --- Hand-Drawn Icons ---
    const HandDrawnMic = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F5DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C10 2 9 3 9 5V11C9 13 10 14 12 14C14 14 15 13 15 11V5C15 3 14 2 12 2Z" />
            <path d="M19 10V11C19 15 16 18 12 18C8 18 5 15 5 11V10" />
            <path d="M12 18V22" />
            <path d="M8 22H16" />
        </svg>
    );

    const HandDrawnCamera = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F5DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19C23 19 23 20 22 21C21 22 20 22 20 22H4C4 22 3 22 2 21C1 20 1 19 1 19V8C1 8 1 7 2 6C3 5 4 5 4 5H7L9 3H15L17 5H20C20 5 21 5 22 6C23 7 23 8 23 8V19Z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    );

    const HandDrawnKeyboard = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F5DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8H7" />
            <path d="M11 8H13" />
            <path d="M17 8H18" />
            <path d="M6 12H7" />
            <path d="M11 12H13" />
            <path d="M17 12H18" />
            <path d="M7 16H17" />
        </svg>
    );

    // Auto-focus input when keyboard opens
    React.useEffect(() => {
        if (isKeyboardOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isKeyboardOpen]);

    // Handle Upload Trigger
    React.useEffect(() => {
        if (isUploadOpen && fileInputRef.current) {
            fileInputRef.current.click();
            setIsUploadOpen(false);
        }
    }, [isUploadOpen, setIsUploadOpen]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        sendMessage(inputText);
        setInputText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    const handleTierAction = (action: () => void) => {
        if (tier === 'free') {
            setShowUpgradeModal(true);
        } else {
            action();
        }
    };

    // Style for unified buttons
    const buttonStyle = {
        borderRadius: '40% 60% 50% 50% / 60% 40% 60% 40%',
        backgroundColor: 'var(--forest-green)',
        color: '#F5F5DC',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 6px rgba(0,0,0,0.2)',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const activeButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#5A3741', // Oxblood
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
        transform: 'scale(0.95)'
    };

    return (
        <>
            {/* Input Overlay - Slides up from bottom when keyboard is active */}
            {/* Input removed - moved to ChatInputOverlay */}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64String = reader.result as string;
                            setSelectedImage(base64String);
                            // Open keyboard to allow typing a message with the image
                            setIsKeyboardOpen(true);
                            setUiMode('CHATTING');
                        };
                        reader.readAsDataURL(file);
                    }
                }}
            />

            {/* Control Bar Container - Pure flex, no transforms */}
            <div className="w-full flex justify-center items-center pointer-events-none">
                <motion.div
                    className="texture-grain relative flex justify-between items-center w-full mx-auto pointer-events-auto px-6 py-4"
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)', // bg-white/20
                        backdropFilter: 'blur(12px)', // backdrop-blur-md
                        borderRadius: '24px', // rounded-3xl (approx 1.5rem / 24px)
                        border: '1px solid rgba(255, 255, 255, 0.3)', // border-white/30
                        boxShadow: '0 8px 32px 0 rgba(70, 70, 60, 0.1)'
                    }}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    {/* Voice Mode */}
                    <motion.button
                        initial={{ opacity: 1, scale: 1 }}
                        onClick={() => setUiMode(uiMode === 'SPEAKING' ? 'IDLE' : 'SPEAKING')}
                        whileHover={{ scale: 1.1, rotate: -3 }}
                        whileTap={{ scale: 0.9 }}
                        animate={isListening ? {
                            scale: [1, 1.1, 1],
                            boxShadow: [
                                "0 0 0 0 rgba(245, 245, 220, 0.4)",
                                "0 0 0 10px rgba(245, 245, 220, 0)",
                                "0 0 0 0 rgba(245, 245, 220, 0)"
                            ],
                            transition: {
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }
                        } : {
                            y: 0, opacity: 1 // Default state from parent trigger, but here safe to just let it be or reset
                        }}
                        style={uiMode === 'SPEAKING' ? activeButtonStyle : buttonStyle}
                        aria-label="Voice Mode"
                    >
                        <HandDrawnMic />
                    </motion.button>

                    {/* Camera Mode */}
                    <motion.button
                        initial={{ opacity: 1, scale: 1 }}
                        onClick={() => handleTierAction(() => setIsCameraActive(!isCameraActive))}
                        whileHover={{ scale: 1.1, rotate: 3 }}
                        whileTap={{ scale: 0.9 }}
                        style={isCameraActive ? activeButtonStyle : buttonStyle}
                        aria-label="Camera Mode"
                    >
                        <HandDrawnCamera />
                    </motion.button>

                    {/* Keyboard Mode */}
                    <motion.button
                        initial={{ opacity: 1, scale: 1 }}
                        onClick={() => {
                            const newState = !isKeyboardOpen;
                            setIsKeyboardOpen(newState);
                            setUiMode(newState ? 'CHATTING' : 'IDLE');
                        }}
                        whileHover={{ scale: 1.1, rotate: -2 }}
                        whileTap={{ scale: 0.9 }}
                        style={isKeyboardOpen ? activeButtonStyle : buttonStyle}
                        aria-label="Text Chat"
                    >
                        <HandDrawnKeyboard />
                    </motion.button>

                    {/* Upload Mode */}
                    <motion.button
                        initial={{ opacity: 1, scale: 1 }}
                        onClick={() => handleTierAction(() => setIsUploadOpen(true))}
                        whileHover={{ scale: 1.1, rotate: 2 }}
                        whileTap={{ scale: 0.9 }}
                        style={isUploadOpen ? activeButtonStyle : buttonStyle}
                        aria-label="Upload Image"
                    >
                        <ImagePlus size={24} stroke="#F5F5DC" strokeWidth={2} />
                    </motion.button>
                </motion.div>
            </div>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    {/* Modal Content */}
                    <div className="bg-white p-6 rounded-2xl relative">
                        <button onClick={() => setShowUpgradeModal(false)} className="absolute top-2 right-2"><X /></button>
                        <p>Upgrade to use this feature!</p>
                    </div>
                </div>
            )}
        </>
    );
}
