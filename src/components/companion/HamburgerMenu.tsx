'use client';

import React, { useState } from 'react';
import { X, User, Settings, CreditCard, Leaf, Sparkles } from 'lucide-react'; // Removing standard Menu icon
import { motion, AnimatePresence } from 'framer-motion';
import { useCompanion } from '@/context/CompanionContext';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';

export default function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const { tier } = useCompanion();

    // Custom Twig Icon Component
    const TwigIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
            {/* Top Twig */}
            <motion.path
                d="M 5,7 C 7,6 17,6 19,7"
                stroke="#F5F5DC" // Old Paper (Cream)
                strokeWidth="2"
                strokeLinecap="round"
                initial={false}
                animate={isOpen ? { d: "M 5,5 L 19,19" } : { d: "M 5,7 C 7,6 17,6 19,7" }}
            />
            {/* Middle Twig */}
            <motion.path
                d="M 4,12 C 6,11 18,13 20,12"
                stroke="#F5F5DC"
                strokeWidth="2"
                strokeLinecap="round"
                initial={false}
                animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            />
            {/* Bottom Twig */}
            <motion.path
                d="M 5,17 C 8,18 16,18 19,17"
                stroke="#F5F5DC"
                strokeWidth="2"
                strokeLinecap="round"
                initial={false}
                animate={isOpen ? { d: "M 5,19 L 19,5" } : { d: "M 5,17 C 8,18 16,18 19,17" }}
            />
        </svg>
    );

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 backdrop-blur-sm transition-transform hover:scale-105 pointer-events-auto flex items-center justify-center cursor-pointer opacity-100 z-[999] relative shrink-0"
                style={{
                    backgroundColor: 'var(--forest-green)', // #22543D
                    borderRadius: '40% 60% 50% 50% / 60% 40% 60% 40%', // Unified Shape
                    boxShadow: '2px 3px 5px rgba(0,0,0,0.2)',
                    width: '48px', // Explicit size for centering
                    height: '48px'
                }}
                aria-label="Menu"
            >
                <TwigIcon />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm pointer-events-auto"
                        />

                        {/* Parchment Drawer */}
                        <motion.div
                            initial={{ x: '-100%', rotateY: 90 }}
                            animate={{ x: 0, rotateY: 0 }}
                            exit={{ x: '-100%', rotateY: 45 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs z-50 shadow-2xl p-6 texture-grain pointer-events-auto"
                            style={{
                                backgroundColor: 'var(--old-paper)',
                                borderRight: '2px solid var(--forest-green)',
                                borderRadius: '0 20px 20px 0', // Slight curve on right edge
                                transformOrigin: 'left center'
                            }}
                        >
                            <div className="flex justify-between items-center mb-8 mt-16"> {/* Spacing for top button */}
                                <h2 className="text-2xl font-bold" style={{ color: 'var(--forest-green)', fontFamily: 'var(--font-heading)' }}>
                                    Garden Log
                                </h2>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 p-4 rounded-xl border border-[#D3C3AB]/30" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-inner" style={{ backgroundColor: 'var(--forest-green)' }}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-[#3E2723]">Guest Gardener</p>
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            <p className="text-sm text-[#5F6B6F] capitalize">{tier} Plan</p>
                                        </div>
                                    </div>
                                </div>

                                <nav className="space-y-3">
                                    <Link href="/plants" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-4 p-3 hover:bg-[#D3C3AB]/20 rounded-lg transition-colors text-left text-[#3E2723] font-medium">
                                        <Leaf size={22} color="var(--forest-green)" />
                                        <span>My Plants</span>
                                    </Link>
                                    <Link href="/assistant" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-4 p-3 hover:bg-[#D3C3AB]/20 rounded-lg transition-colors text-left text-[#3E2723] font-medium">
                                        <Sparkles size={22} color="var(--forest-green)" />
                                        <span>Assistant</span>
                                    </Link>
                                    <button className="w-full flex items-center gap-4 p-3 hover:bg-[#D3C3AB]/20 rounded-lg transition-colors text-left text-[#3E2723] font-medium">
                                        <User size={22} color="var(--forest-green)" />
                                        <span>My Profile</span>
                                    </button>
                                    <button className="w-full flex items-center gap-4 p-3 hover:bg-[#D3C3AB]/20 rounded-lg transition-colors text-left text-[#3E2723] font-medium">
                                        <CreditCard size={22} color="var(--forest-green)" />
                                        <span>Membership</span>
                                    </button>
                                    <button className="w-full flex items-center gap-4 p-3 hover:bg-[#D3C3AB]/20 rounded-lg transition-colors text-left text-[#3E2723] font-medium">
                                        <Settings size={22} color="var(--forest-green)" />
                                        <span>Settings</span>
                                    </button>
                                </nav>
                            </div>

                            <div className="absolute bottom-8 left-6 right-6 text-center text-xs text-[#8C8174] font-mono">
                                • {BRAND.appName} v1.2.0 •
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
