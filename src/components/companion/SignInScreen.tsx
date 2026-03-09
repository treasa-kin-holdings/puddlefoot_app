'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useCompanion } from '@/context/CompanionContext';
import { BRAND } from '@/lib/brand';

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function SignInScreen() {
    const { authStatus, userId, signInWithMagicLink, setUiMode } = useCompanion();

    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Helps avoid hydration weirdness if authStatus differs between server/client first paint
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const safeAuthStatus = mounted ? authStatus : 'loading';

    const canSend = useMemo(() => isValidEmail(email) && !sending, [email, sending]);

    const handleSend = async () => {
        const clean = email.trim().toLowerCase();
        if (!isValidEmail(clean)) {
            setError('That email looks a little off — can you double-check it?');
            return;
        }

        setError(null);
        setSending(true);
        setSentTo(null);

        try {
            await signInWithMagicLink(clean);
            setSentTo(clean);
        } catch (e: any) {
            setError(e?.message ?? 'Something went sideways sending the link. Try again in a sec.');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    if (safeAuthStatus === 'loading') {
        return (
            <div className="fixed inset-0 bg-[#F2E8D9]/95 backdrop-blur-[1px]">
                <div className="flex flex-col h-full w-[90%] max-w-3xl mx-auto p-4 relative z-20">
                    <div className="h-32 flex-shrink-0" />
                    <div className="w-full max-w-md mx-auto pointer-events-auto">
                        <div
                            className="bg-[#F7F5F0] border border-[#8B9276] rounded-[15px_25px_15px_20px] texture-grain overflow-hidden relative shadow-sm text-base leading-relaxed"
                            style={{ padding: '10px 16px' }}
                        >
                            <div className="text-neutral-800 leading-relaxed font-serif">
                                Hi! I’m {BRAND.assistantName}.
                                <br />
                                One sec — checking your sign-in…
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (safeAuthStatus === 'signed_in' && userId) return null;

    return (
        <div className="fixed inset-0 bg-[#F2E8D9]/95 backdrop-blur-[1px]">
            {/* Same layout constraints as ChatHistory so it never feels full-screen */}
            <div className="flex flex-col h-full w-[90%] max-w-3xl mx-auto p-4 relative z-20">
                {/* top safe space so it appears where chat bubbles normally live */}
                <div className="h-32 flex-shrink-0" />

                <div className="w-full max-w-md mx-auto pointer-events-auto">
                    {/* Bubble */}
                    <div
                        className="bg-[#F7F5F0] border border-[#8B9276] rounded-[15px_25px_15px_20px] texture-grain overflow-hidden relative shadow-sm text-base leading-relaxed"
                        style={{ padding: '10px 16px' }}
                    >
                        <div className="text-neutral-800 leading-relaxed font-serif">
                            Hi!<br></br>
                            Before we get growing, pop in your email so I can remember your garden.
                        </div>

                        {/* Input */}
                        <div className="mt-5 px-1">
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="you@example.com"
                                autoComplete="email"
                                inputMode="email"
                                className="w-full rounded-2xl px-4 py-3 bg-[#F2ECE7] border border-[#8B9276] outline-none text-sm text-neutral-800 placeholder:text-neutral-500"
                            />

                            {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

                            {sentTo ? (
                                <div className="mt-4 text-sm text-neutral-700 leading-relaxed">
                                    🌿 Magic link sent to <strong>{sentTo}</strong>.
                                    <div className="text-xs text-neutral-600 mt-1">
                                        Check your inbox (and spam/junk, just in case). Then tap the link and I’ll be right here.
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 text-xs text-neutral-600">
                                    No password. Just a quick “tap-the-link” sign in.
                                </div>
                            )}

                            <button
                                onClick={handleSend}
                                disabled={!canSend}
                                className="mt-5 w-full rounded-2xl py-3 bg-[#8B9276] text-white text-sm disabled:opacity-40"
                            >
                                {sending ? 'Sending…' : 'Send magic link'}
                            </button>
                        </div>
                    </div>

                    {/* Tail */}
                    <div
                        className="absolute left-10 -bottom-2 h-4 w-4 rotate-45 bg-[#F7F5F0] border-l border-b border-[#8B9276]"
                        aria-hidden="true"
                    />
                </div>
            </div>
        </div >
    );
}