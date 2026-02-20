'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useCompanion } from '@/context/CompanionContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function PuddlefootAvatar() {
    const { uiMode, isKeyboardOpen, isProcessing, isCameraActive } = useCompanion();

    // Determine if we should be in "Mini" mode (Top-Right)
    const isMini = uiMode === 'CHATTING' || isCameraActive || isKeyboardOpen;
    const isSpeaking = uiMode === 'SPEAKING' || isProcessing;

    return (
        <motion.div
            className={twMerge(
                'z-40 pointer-events-none fixed', // Fixed positioning to escape flow
                isMini ? 'border-2 border-white/50 rounded-full overflow-hidden bg-black/20 backdrop-blur-sm shadow-lg' : ''
            )}
            initial={false}
            animate={isMini ? 'ACTIVE' : 'IDLE'}
            variants={{
                IDLE: {
                    top: '50%',
                    left: '50%',
                    x: '-50%',
                    y: '-50%',
                    scale: 1,
                    position: 'fixed',
                    width: '300px',
                    height: '300px'
                },
                ACTIVE: {
                    top: '8%',   // Approx top-8 region
                    left: '85%', // Approx right-8 region
                    x: '-50%',   // Keep centered on anchor
                    y: '-50%',   // Keep centered on anchor
                    scale: 0.25, // Shrink to ~75px
                    position: 'fixed',
                    width: '300px', // Maintain base size for scaling
                    height: '300px'
                }
            }}
            transition={{
                duration: 0.6,
                ease: [0.34, 1.56, 0.64, 1] // Bouncy/Whimsical
            }}
        >
            <div className={clsx("relative w-full h-full", isSpeaking && "animate-pulse-talk")}>
                <Image
                    src="/puddlefoot.png"
                    alt="Puddlefoot"
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-contain"
                    priority
                />
            </div>

            {/* Pulse Ring for Speaking */}
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
