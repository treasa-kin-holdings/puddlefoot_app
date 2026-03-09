'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useCompanion } from '@/context/CompanionContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function BrambleAvatar() {
    const { interactionMode, isKeyboardOpen, isProcessing, isCameraActive, uiMode, selectedImage } = useCompanion();

    // Prevent hydration mismatches if any of these values depend on browser-only state
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const safeInteractionMode = mounted ? interactionMode : 'SPEAK';
    const safeKeyboardOpen = mounted ? isKeyboardOpen : false;
    const safeCameraActive = mounted ? isCameraActive : false;
    const safeSelectedImage = mounted ? selectedImage : null;
    const safeUiMode = mounted ? uiMode : 'IDLE';

    // Mini mode whenever in CHAT, or camera is active, or an image is selected
    const isMini = safeInteractionMode === 'CHAT' || safeCameraActive || safeSelectedImage !== null;
    const isSpeaking = safeUiMode === 'SPEAKING' || isProcessing;

    return (
        <motion.div
            className={twMerge(
                'z-40 pointer-events-none fixed',
                isMini ? 'border-2 border-white/50 rounded-full overflow-hidden bg-black/20 backdrop-blur-sm shadow-lg' : ''
            )}
            initial={false}
            animate={isMini ? 'ACTIVE' : 'IDLE'}
            variants={{
                IDLE: {
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    x: '-50%',
                    y: '-50%',
                    scale: 1,
                    position: 'fixed',
                    width: '300px',
                    height: '300px',
                },
                ACTIVE: {
                    top: 16,
                    right: 16,
                    left: 'auto',
                    bottom: 'auto',
                    x: 112.5,
                    y: -112.5,
                    scale: 0.25,
                    position: 'fixed',
                    width: '300px',
                    height: '300px',
                },
            }} transition={{
                duration: 0.6,
                ease: [0.34, 1.56, 0.64, 1]
            }}
        >
            <div className={clsx('relative w-full h-full', isSpeaking && 'animate-pulse-talk')}>
                <Image
                    src="/bramble.png"
                    alt="Bramble"
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-contain"
                    priority
                />
            </div>

            {isSpeaking && !isMini && (
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-nature-green/50"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                />
            )}
        </motion.div>
    );
}