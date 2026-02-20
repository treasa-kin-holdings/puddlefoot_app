'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
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
    isCameraActive: boolean;
    setIsCameraActive: (isActive: boolean) => void;
    cameraVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;

    // Chat State
    messages: Message[];
    isLoading: boolean;
    sendMessage: (content: string) => Promise<void>;
    addMessage: (message: Message) => void;
    isListening?: boolean;
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
    const [isCameraActive, setIsCameraActive] = useState(false);
    const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesRef = useRef<Message[]>([]); // Ref to access latest messages without triggering re-renders in usage
    const [isLoading, setIsLoading] = useState(false);

    // Sync ref with state
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Speech Logic (Internal)
    const playSpeech = async (text: string) => {
        console.log("playSpeech: Called with text length:", text?.length);
        if (!text) return;
        try {
            // Remove asterisks and other markdown specific chars that ruin TTS
            const cleanText = text.replace(/[*#_]/g, '');
            console.log("playSpeech: Cleaned text:", cleanText.substring(0, 50) + "...");

            const res = await fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText }),
            });

            if (!res.ok) {
                console.error("playSpeech: API error", res.status, res.statusText);
                throw new Error('Speech generation failed');
            }

            console.log("playSpeech: API success, creating audio...");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            audio.onplay = () => console.log("playSpeech: Audio started playing");
            audio.onended = () => console.log("playSpeech: Audio finished");
            audio.onerror = (e) => console.error("playSpeech: Audio element error", e);

            await audio.play();
            console.log("playSpeech: Play command sent");
        } catch (e) {
            console.error('Speech error:', e);
        }
    };

    const sendMessage = React.useCallback(async (content: string) => {
        if (!content.trim()) return;

        console.log("sendMessage: Sending:", content);
        const userMessage: Message = { role: 'user', content };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            let capturedImage = null;

            // Capture frame if camera is active
            if (isCameraActive && cameraVideoRef.current) {
                try {
                    const video = cameraVideoRef.current;
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0);
                        // Get base64 string (data:image/jpeg;base64,...)
                        capturedImage = canvas.toDataURL('image/jpeg', 0.8);
                    }
                } catch (e) {
                    console.error("Failed to capture camera frame:", e);
                }
            } else if (selectedImage) {
                // Use uploaded image
                capturedImage = selectedImage;
                setSelectedImage(null); // Clear after sending
            }

            // API Call
            // Use messagesRef.current to get history WITHOUT adding 'messages' to dependency array
            // We ONLY send the *past* history. The current 'content' is sent as the new message.

            // Limit history to last 20 messages to avoid token limits
            const historyPayload = messagesRef.current.slice(-20);

            const chatRes = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Pass mock user ID if needed, or rely on API to handle it
                    'x-user-id': userId || 'guest'
                },
                body: JSON.stringify({
                    message: content,
                    history: historyPayload, // Pass conversation history
                    image: capturedImage // Send captured image if available
                }),
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

            console.log("sendMessage: Received response. Current uiMode:", uiMode);

            // Auto-play speech if in SPEAKING mode
            if (uiMode === 'SPEAKING') {
                console.log("sendMessage: Triggering playSpeech...");
                playSpeech(data.message);
            } else {
                console.log("sendMessage: Skipping speech (not in SPEAKING mode).");
            }

        } catch (error: any) {
            console.error("sendMessage Error:", error.message || error);
            // Fallback error message
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting to the garden network. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [isCameraActive, selectedImage, userId, uiMode, selectedImage]); // minimal dependencies

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


    // Keep a ref to sendMessage so the effect doesn't need to depend on it
    const sendMessageRef = useRef(sendMessage);
    useEffect(() => {
        sendMessageRef.current = sendMessage;
    }, [sendMessage]);

    // Speech Recognition
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = React.useRef<SpeechRecognition | null>(null);

    // Initialize Speech Recognition - RUNS ONLY ONCE
    useEffect(() => {
        if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false; // Stop after one sentence
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript.trim()) {
                    // Use the ref to call the latest version without re-running this effect
                    sendMessageRef.current(transcript);
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        // Cleanup function
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };

    }, []); // Empty dependency array = Stable initialization!

    // Toggle Listening based on UI Mode
    useEffect(() => {
        if (uiMode === 'SPEAKING') {
            recognitionRef.current?.start();
        } else {
            recognitionRef.current?.stop();
        }
    }, [uiMode]);

    return (
        <CompanionContext.Provider value={{
            uiMode, setUiMode,
            tier,
            isProcessing, setIsProcessing,
            userId,
            isKeyboardOpen, setIsKeyboardOpen,
            isUploadOpen, setIsUploadOpen,
            isCameraActive, setIsCameraActive,
            cameraVideoRef,
            selectedImage, setSelectedImage,
            messages, isLoading, sendMessage, addMessage,
            isListening // Export isListening for UI feedback
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

