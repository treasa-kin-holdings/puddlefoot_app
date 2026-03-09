'use client';

import React from 'react';
import { useCompanion } from '@/context/CompanionContext';
import { AnimatePresence } from 'framer-motion';

import BrambleAvatar from './BrambleAvatar';
import ChatHistory from './ChatHistory';
import ChatInterface from './ChatInterface';
import ControlBar from './HUDControlBar';
import CameraView from './CameraView';

export default function CompanionLayout() {
    const { isCameraActive } = useCompanion();

    return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#F2E8D9] pointer-events-none z-40">
            {/* Camera overlay */}
            <AnimatePresence>{isCameraActive && <CameraView />}</AnimatePresence>

            {/* Background / scrollable content area (if you use it) */}
            <main className="absolute inset-0 z-0 overflow-y-auto">{/* Background content area */}</main>

            {/* Avatar layer (should manage its own pointer-events if needed) */}
            <BrambleAvatar />

            {/* Chat History - behind avatar */}
            <div className="fixed inset-0 z-20 pointer-events-none flex justify-center">
                <ChatHistory />
            </div>

            {/* HUD RAIL pinned to viewport bottom */}
            {/* IMPORTANT:
          - pointer-events-none on the rail so it doesn't block the screen
          - ControlBar must use pointer-events-auto on its actual clickable clusters/buttons
          - the relative "track" gives ControlBar a stable box for absolute left/right positioning
      */}
            <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
                <div className="relative h-[96px]">
                    <ControlBar />
                </div>
            </div>

            {/* Chat Interface overlay (keyboard/input UI) */}
            <ChatInterface />
        </div>
    );
}