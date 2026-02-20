'use client';

import React, { ReactNode } from 'react';
import { CompanionProvider, useCompanion } from '@/context/CompanionContext';
import PuddlefootAvatar from './PuddlefootAvatar';
import HUDControlBar from './HUDControlBar';
import ChatHistory from './ChatHistory';
import HamburgerMenu from './HamburgerMenu';
import ChatInputOverlay from './ChatInputOverlay';
import CameraView from './CameraView';

// Safe zone margin style
const SAFE_ZONE_STYLE = {
    paddingTop: '15dvh', // Using dvh for dynamic viewport height
    paddingBottom: '15dvh',
    paddingLeft: '15vw',
    paddingRight: '15vw',
};

// Inner component to access context
function CompanionLayoutInner({ children }: { children: ReactNode }) {
    const { uiMode, isCameraActive } = useCompanion();

    return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#F2ECE7]">
            {/* Camera View - Direct Child of Root */}
            {isCameraActive && <CameraView />}

            {/* Background / Main Content Area */}
            {/* This layer sits at the very back */}
            <main className="absolute inset-0 z-0 overflow-y-auto">
                {children}
            </main>

            {/* HUD / Interactive Layer Container - Strict Fixed Positioning */}

            {/* Top Section: Hamburger - Fixed Opposite Puddlefoot (Top 8%) */}
            <div className="fixed left-8 z-[60] pointer-events-auto" style={{ top: '8%' }}>
                <HamburgerMenu />
            </div>

            {/* Puddlefoot Avatar Layer - Fixed z-40 */}
            {/* The avatar component handles its own fixed positioning */}
            <PuddlefootAvatar />

            {/* Chat History - z-20 (Behind Puddlefoot) */}
            <div className="fixed inset-0 z-20 pointer-events-none flex justify-center">
                <ChatHistory />
            </div>

            {/* Bottom Section: Control Bar - Fixed bottom-10 centered z-50 */}
            <div
                className="pointer-events-none"
                style={{
                    position: 'fixed',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90%',
                    maxWidth: '28rem', // max-w-md
                    zIndex: 50
                }}
            >
                <div className="pointer-events-auto w-full">
                    <HUDControlBar />
                </div>
            </div>

            {/* Chat Input Overlay - Fixed to viewport (z-60) - Moved out of HUD container to avoid transform issues */}
            <ChatInputOverlay />

            {/* Overlay for "Scanning" or other modes if needed */}
        </div>
    );
}

export default function CompanionLayout({ children }: { children: ReactNode }) {
    return (
        <CompanionProvider>
            <CompanionLayoutInner>{children}</CompanionLayoutInner>
        </CompanionProvider>
    );
}
