'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserTier, logUsage, checkChatLimit } from '@/lib/limits';

export type UiMode = 'IDLE' | 'SPEAKING' | 'CHATTING' | 'CAMERA';

export type Message = {
    role: 'user' | 'assistant';
    content: string;
};

interface CompanionContextType {
    uiMode: UiMode;
    setUiMode: (mode: UiMode) => void;
    tier: 'free' | 'premium';
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;
    userId: string | null;
    isKeyboardOpen: boolean;
    setIsKeyboardOpen: (isOpen: boolean) => void;
    isUploadOpen: boolean;
    setIsUploadOpen: (isOpen: boolean) => void;

    // Chat State
    messages: Message[];
    isLoading: boolean;
    sendMessage: (content: string) => Promise<void>;
    addMessage: (message: Message) => void;
}

const CompanionContext = createContext<CompanionContextType | undefined>(undefined);

export function CompanionProvider({ children }: { children: ReactNode }) {
    const [uiMode, setUiMode] = useState<UiMode>('IDLE');
    // FORCING PREMIUM FOR TESTING - Keep this as requested in previous turn
    const [tier, setTier] = useState<'free' | 'premium'>('premium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Speech Logic (Internal)
    const playSpeech = async (text: string) => {
        try {
            const res = await fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error('Speech generation failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
        } catch (e) {
            console.error('Speech error:', e);
        }
    };

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = { role: 'user', content };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // API Call
            const chatRes = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Pass mock user ID if needed, or rely on API to handle it
                    'x-user-id': userId || 'guest'
                },
                body: JSON.stringify({ message: content }),
            });

            if (chatRes.status === 429) {
                console.warn("Rate limit hit (429)");
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "Puddlefoot is taking a short breath (Rate Limit hit). Please try again in 30 seconds."
                }]);
                return; // Exit early, handled
            }

            if (!chatRes.ok) {
                const errorData = await chatRes.json();
                throw new Error(errorData.error || 'Failed to get response');
            }

            const data = await chatRes.json();
            const aiMessage: Message = { role: 'assistant', content: data.message };
            setMessages(prev => [...prev, aiMessage]);

            // Auto-play speech if in SPEAKING mode
            if (uiMode === 'SPEAKING') {
                playSpeech(data.message);
            }

        } catch (error: any) {
            console.error("sendMessage Error:", error);
            // Fallback error message
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting to the garden network. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const addMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
    };

    useEffect(() => {
        // Reset to IDLE on mount
        setUiMode('IDLE');

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
                const userTier = await getUserTier(session.user.id);
                setTier(userTier);
            } else {
                setUserId(null);
                // FORCING PREMIUM FOR TESTING
                setTier('premium');
            }
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            if (session?.user) {
                setUserId(session.user.id);
                getUserTier(session.user.id).then(setTier);
            } else {
                setUserId(null);
                // FORCING PREMIUM FOR TESTING
                setTier('premium');
            }
        });

        return () => subscription.unsubscribe();

    }, []);

    return (
        <CompanionContext.Provider value={{
            uiMode, setUiMode,
            tier,
            isProcessing, setIsProcessing,
            userId,
            isKeyboardOpen, setIsKeyboardOpen,
            isUploadOpen, setIsUploadOpen,
            messages, isLoading, sendMessage, addMessage
        }}>
            {children}
        </CompanionContext.Provider>
    );
}

export function useCompanion() {
    const context = useContext(CompanionContext);
    if (context === undefined) {
        throw new Error('useCompanion must be used within a CompanionProvider');
    }
    return context;
}

