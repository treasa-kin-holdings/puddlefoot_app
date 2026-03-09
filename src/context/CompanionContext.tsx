'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserTier } from '@/lib/limits';
import { saveGardenMedia, base64ToBlob } from '@/lib/gardenMedia';

export type UiMode = 'IDLE' | 'SPEAKING' | 'CHATTING' | 'CAMERA' | 'AUTH';

export type Message = {
    role: 'user' | 'assistant';
    content: string;
    image?: string;
    imageKind?: 'photo' | 'prediction' | 'overlay' | 'reference' | 'export' | 'other';
    imageTitle?: string;
    imageMetadata?: any;
};

type VisionIntent = 'IDENTIFY' | 'DIAGNOSE' | null;
type AuthStatus = 'loading' | 'signed_out' | 'signed_in';
type OnboardingStatus = 'loading' | 'incomplete' | 'complete';
type OnboardingStep =
    | 'preferred_name'
    | 'garden_city'
    | 'garden_country'
    | 'language'
    | 'language_confirm'
    | null;

type NormalizedLanguage = {
    label: string;
    code: string;
    locale: string;
    confidence: 'high' | 'medium' | 'low';
};

type Profile = {
    preferred_name: string | null;
    garden_city: string | null;
    garden_country: string | null;
    language: string | null;
    onboarding_complete: boolean;
};

type OnboardingDraft = {
    preferred_name: string;
    garden_city: string;
    garden_country: string;
    language: string;
};

interface CompanionContextType {
    uiMode: UiMode;
    setUiMode: (mode: UiMode) => void;

    interactionMode: 'SPEAK' | 'CHAT';
    setInteractionMode: (mode: 'SPEAK' | 'CHAT') => void;

    tier: 'free' | 'premium';
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;

    // Auth
    authStatus: AuthStatus;
    authChecked: boolean;
    userId: string | null;
    signInWithMagicLink: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
    requestUpgrade: (reason: 'vision_limit' | 'save_garden_media' | 'chat_limit') => void;

    // Onboarding / profile
    onboardingStatus: OnboardingStatus;
    profile: Profile | null;

    // UI
    isKeyboardOpen: boolean;
    setIsKeyboardOpen: (isOpen: boolean) => void;
    isUploadOpen: boolean;
    setIsUploadOpen: (isOpen: boolean) => void;
    isCameraActive: boolean;
    setIsCameraActive: (isActive: boolean) => void;
    cameraVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;

    // Vision (no persistence)
    identifyPlant: () => Promise<any>;
    diagnosePlant: () => Promise<any>;

    // Chat
    messages: Message[];
    isLoading: boolean;
    sendMessage: (content: string) => Promise<void>;
    addMessage: (message: Message) => void;

    // Speech
    isListening?: boolean;
}

const CompanionContext = createContext<CompanionContextType | undefined>(undefined);

const isValidEmail = (s: string) => {
    const t = s.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
};

export function CompanionProvider({ children }: { children: ReactNode }) {
    const [uiMode, setUiMode] = useState<UiMode>('IDLE');
    const [interactionMode, setInteractionMode] = useState<'SPEAK' | 'CHAT'>('SPEAK');

    // Sync isKeyboardOpen automatically with interactionMode = 'CHAT'
    const isKeyboardOpen = interactionMode === 'CHAT';
    const setIsKeyboardOpen = (isOpen: boolean) => {
        if (isOpen) setInteractionMode('CHAT');
        // if closing, do nothing (let user stay in CHAT unless they toggle)
    };

    // FORCING PREMIUM FOR TESTING - Keep this as requested
    const [tier, setTier] = useState<'free' | 'premium'>('premium');

    const [isProcessing, setIsProcessing] = useState(false);

    // Auth
    const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
    const [userId, setUserId] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    // Onboarding / profile
    const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>('loading');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(null);
    const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>({
        preferred_name: '',
        garden_city: '',
        garden_country: '',
        language: '',
    });

    // UI
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesRef = useRef<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Refs for latest values (avoid stale closures)
    const uiModeRef = useRef(uiMode);
    const userIdRef = useRef(userId);
    const authStatusRef = useRef<AuthStatus>(authStatus);
    const onboardingStatusRef = useRef<OnboardingStatus>(onboardingStatus);
    const onboardingStepRef = useRef<OnboardingStep>(onboardingStep);
    const onboardingDraftRef = useRef<OnboardingDraft>(onboardingDraft);
    const profileRef = useRef<Profile | null>(profile);

    useEffect(() => {
        uiModeRef.current = uiMode;
    }, [uiMode]);

    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    useEffect(() => {
        authStatusRef.current = authStatus;
    }, [authStatus]);

    useEffect(() => {
        onboardingStatusRef.current = onboardingStatus;
    }, [onboardingStatus]);

    useEffect(() => {
        onboardingStepRef.current = onboardingStep;
    }, [onboardingStep]);

    useEffect(() => {
        onboardingDraftRef.current = onboardingDraft;
    }, [onboardingDraft]);

    useEffect(() => {
        profileRef.current = profile;
    }, [profile]);

    // Keep uiMode aligned with interactionMode (so the UI doesn't drift)
    useEffect(() => {
        // Don't mess with auth screen
        if (authStatus !== 'signed_in') return;
        if (onboardingStatus !== 'complete') return;

        if (interactionMode === 'CHAT') {
            setUiMode('CHATTING');
        } else {
            // Speak mode selected. We do NOT auto-start listening here.
            // Leave as IDLE unless you explicitly want auto-listen.
            setUiMode((prev) => (prev === 'CHATTING' ? 'IDLE' : prev));
        }
    }, [interactionMode, authStatus, onboardingStatus]);

    useEffect(() => {
        if (authStatus !== 'signed_in') {
            setUiMode('AUTH');
            return;
        }

        if (onboardingStatus !== 'complete') {
            setUiMode('CHATTING');
            return;
        }

        setUiMode((prev) => (prev === 'AUTH' ? 'IDLE' : prev));
    }, [authStatus, onboardingStatus]);

    // Sync messages ref
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Speech Logic
    const playSpeech = async (text: string) => {
        if (!text) return;
        try {
            const cleanText = text.replace(/[*#_]/g, '');
            const res = await fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText }),
            });

            if (!res.ok) throw new Error('Speech generation failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            await audio.play();
        } catch (e) {
            console.error('Speech error:', e);
        }
    };

    const respondLocal = (text: string, extra?: Partial<Message>) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: text, ...extra }]);
        if (uiModeRef.current === 'SPEAKING') {
            playSpeech(text);
        }
    };

    const requestUpgrade = (reason: 'vision_limit' | 'save_garden_media' | 'chat_limit') => {
        const msg =
            reason === 'vision_limit'
                ? 'You’ve hit the free monthly vision limit (identify/diagnose).'
                : reason === 'save_garden_media'
                    ? 'Saving garden photos + overlays is Premium-only.'
                    : 'You’ve hit the free daily chat limit.';

        respondLocal(
            `💎 ${msg}\n\nTo upgrade, please subscribe in the **App Store / Google Play**. Once your subscription is active, Premium will unlock automatically here.`
        );
    };

    const isProfileOnboardingComplete = (p: Partial<Profile> | null | undefined) => {
        return Boolean(
            p?.onboarding_complete &&
            p?.preferred_name?.trim() &&
            p?.garden_city?.trim() &&
            p?.garden_country?.trim() &&
            p?.language?.trim()
        );
    };

    const normalizeLanguage = (input: string): NormalizedLanguage => {
        const raw = input.trim();
        const t = raw.toLowerCase();

        if (!t) {
            return {
                label: 'English',
                code: 'en',
                locale: 'en-US',
                confidence: 'low',
            };
        }

        // English
        if (
            t === 'en' ||
            t.includes('english') ||
            t.includes('anglais')
        ) {
            return {
                label: 'English',
                code: 'en',
                locale: 'en-US',
                confidence: 'high',
            };
        }

        // French
        if (
            t === 'fr' ||
            t.includes('french') ||
            t.includes('français') ||
            t.includes('francais') ||
            t.includes('canadian french') ||
            t.includes('québécois') ||
            t.includes('quebecois')
        ) {
            return {
                label: 'French',
                code: 'fr',
                locale: 'fr-CA',
                confidence: 'high',
            };
        }

        // Spanish
        if (
            t === 'es' ||
            t.includes('spanish') ||
            t.includes('español') ||
            t.includes('espanol')
        ) {
            return {
                label: 'Spanish',
                code: 'es',
                locale: 'es-ES',
                confidence: 'high',
            };
        }

        // German
        if (
            t === 'de' ||
            t.includes('german') ||
            t.includes('deutsch')
        ) {
            return {
                label: 'German',
                code: 'de',
                locale: 'de-DE',
                confidence: 'high',
            };
        }

        // Italian
        if (
            t === 'it' ||
            t.includes('italian') ||
            t.includes('italiano')
        ) {
            return {
                label: 'Italian',
                code: 'it',
                locale: 'it-IT',
                confidence: 'high',
            };
        }

        // Portuguese
        if (
            t === 'pt' ||
            t.includes('portuguese') ||
            t.includes('português') ||
            t.includes('portugues')
        ) {
            return {
                label: 'Portuguese',
                code: 'pt',
                locale: 'pt-BR',
                confidence: 'high',
            };
        }

        // Japanese
        if (
            t === 'ja' ||
            t.includes('japanese') ||
            t.includes('日本語')
        ) {
            return {
                label: 'Japanese',
                code: 'ja',
                locale: 'ja-JP',
                confidence: 'high',
            };
        }

        // Chinese / Mandarin
        if (
            t === 'zh' ||
            t.includes('chinese') ||
            t.includes('mandarin') ||
            t.includes('中文') ||
            t.includes('普通话') ||
            t.includes('國語') ||
            t.includes('国语')
        ) {
            return {
                label: 'Chinese',
                code: 'zh',
                locale: 'zh-CN',
                confidence: 'high',
            };
        }

        // Dutch
        if (
            t === 'nl' ||
            t.includes('dutch') ||
            t.includes('nederlands')
        ) {
            return {
                label: 'Dutch',
                code: 'nl',
                locale: 'nl-NL',
                confidence: 'high',
            };
        }

        // Korean
        if (
            t === 'ko' ||
            t.includes('korean') ||
            t.includes('한국어')
        ) {
            return {
                label: 'Korean',
                code: 'ko',
                locale: 'ko-KR',
                confidence: 'high',
            };
        }

        // Arabic
        if (
            t === 'ar' ||
            t.includes('arabic') ||
            t.includes('العربية')
        ) {
            return {
                label: 'Arabic',
                code: 'ar',
                locale: 'ar-SA',
                confidence: 'high',
            };
        }

        // Russian
        if (
            t === 'ru' ||
            t.includes('russian') ||
            t.includes('русский')
        ) {
            return {
                label: 'Russian',
                code: 'ru',
                locale: 'ru-RU',
                confidence: 'high',
            };
        }

        // Hindi
        if (
            t === 'hi' ||
            t.includes('hindi') ||
            t.includes('हिन्दी') ||
            t.includes('हिंदी')
        ) {
            return {
                label: 'Hindi',
                code: 'hi',
                locale: 'hi-IN',
                confidence: 'high',
            };
        }

        // Fallback: preserve what the user said
        return {
            label: raw,
            code: 'unknown',
            locale: 'en-US',
            confidence: 'low',
        };
    };

    const getSpeechRecognitionLocale = (language: string | null | undefined): string => {
        if (!language?.trim()) return 'en-US';
        return normalizeLanguage(language).locale;
    };

    const resetOnboardingState = () => {
        setOnboardingStatus('loading');
        setOnboardingStep(null);
        setOnboardingDraft({
            preferred_name: '',
            garden_city: '',
            garden_country: '',
            language: '',
        });
    };

    const startOnboarding = () => {
        setOnboardingDraft({
            preferred_name: '',
            garden_city: '',
            garden_country: '',
            language: '',
        });
        setOnboardingStep('preferred_name');
        setOnboardingStatus('incomplete');

        respondLocal(
            "👋 Hello! I’m Bramble.\n\nBefore we start, I just need a few details so I can personalize your gardening help.\n\nWhat would you like me to call you?"
        );
    };

    const saveOnboardingProfile = async (draft: OnboardingDraft, currentUserId: string) => {
        const normalized = normalizeLanguage(draft.language);

        const payload: Profile = {
            preferred_name: draft.preferred_name.trim(),
            garden_city: draft.garden_city.trim(),
            garden_country: draft.garden_country.trim(),
            language: normalized.label,
            onboarding_complete: true,
        };

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: currentUserId,
                ...payload,
                updated_at: new Date().toISOString(),
            });

        if (error) {
            console.error('Failed to save onboarding profile:', error);
            respondLocal(`Hmm — I couldn’t save your onboarding details. (${error.message})`);
            throw error;
        }

        setProfile(payload);
        setOnboardingStatus('complete');
        setOnboardingStep(null);
        setOnboardingDraft({
            preferred_name: '',
            garden_city: '',
            garden_country: '',
            language: '',
        });

        if (normalized.confidence === 'low') {
            respondLocal(
                `Wonderful — nice to meet you, **${payload.preferred_name}**.\n\nI’ll remember that your garden is in **${payload.garden_city}, ${payload.garden_country}**, and your preferred language is **${payload.language}**.\n\nSome voice features may work best once I’m fully configured for that language.\n\nHow can I help in the garden today?`
            );
            return;
        }

        respondLocal(
            `Wonderful — nice to meet you, **${payload.preferred_name}**.\n\nI’ll remember that your garden is in **${payload.garden_city}, ${payload.garden_country}**, and I’ll speak with you in **${payload.language}**.\n\nHow can I help in the garden today?`
        );
    };

    const handleOnboardingInput = async (incoming: string) => {
        const answer = incoming.trim();
        if (!answer) return true;

        const currentStep = onboardingStepRef.current;

        if (!currentStep || !userIdRef.current) return false;

        if (currentStep === 'preferred_name') {
            setOnboardingDraft((prev) => ({ ...prev, preferred_name: answer }));
            setOnboardingStep('garden_city');
            respondLocal(`Lovely to meet you, **${answer}**.\n\nWhat city is your garden in?`);
            return true;
        }

        if (currentStep === 'garden_city') {
            setOnboardingDraft((prev) => ({ ...prev, garden_city: answer }));
            setOnboardingStep('garden_country');
            respondLocal(`Got it — **${answer}**.\n\nAnd what country is that in?`);
            return true;
        }

        if (currentStep === 'garden_country') {
            setOnboardingDraft((prev) => ({ ...prev, garden_country: answer }));
            setOnboardingStep('language');
            respondLocal(
                `Perfect.\n\nWhat language would you like me to use when I speak with you?\n\nYou can just say it naturally — for example, **English**, **Français**, **Español**, or any other language you prefer.`
            );
            return true;
        }

        if (currentStep === 'language') {
            const normalized = normalizeLanguage(answer);

            if (normalized.confidence === 'low') {
                setOnboardingDraft((prev) => ({ ...prev, language: normalized.label }));
                setOnboardingStep('language_confirm');
                respondLocal(
                    `Thanks — I heard **${normalized.label}**.\n\nShould I save that as your preferred language? Please say **yes** or **no**.`
                );
                return true;
            }

            const finalDraft: OnboardingDraft = {
                ...onboardingDraftRef.current,
                language: normalized.label,
            };

            await saveOnboardingProfile(finalDraft, userIdRef.current);
            return true;
        }

        if (currentStep === 'language_confirm') {
            const t = answer.trim().toLowerCase();

            if (['yes', 'y', 'correct', 'that’s right', "that's right"].includes(t)) {
                const finalDraft: OnboardingDraft = {
                    ...onboardingDraftRef.current,
                };

                await saveOnboardingProfile(finalDraft, userIdRef.current);
                return true;
            }

            if (['no', 'n', 'incorrect', 'wrong'].includes(t)) {
                setOnboardingDraft((prev) => ({ ...prev, language: '' }));
                setOnboardingStep('language');
                respondLocal(
                    `No problem.\n\nPlease tell me the language again, in whatever way feels natural to you.`
                );
                return true;
            }

            respondLocal(`Please say **yes** or **no**.`);
            return true;
        }

        return false;
    };

    const loadProfile = async (currentUserId: string) => {
        setOnboardingStatus('loading');

        const { data, error } = await supabase
            .from('profiles')
            .select('preferred_name, garden_city, garden_country, language, onboarding_complete')
            .eq('id', currentUserId)
            .single();

        if (error) {
            console.error('Failed to load profile:', error);
            setProfile(null);
            startOnboarding();
            return;
        }

        const loadedProfile: Profile = {
            preferred_name: data?.preferred_name ?? null,
            garden_city: data?.garden_city ?? null,
            garden_country: data?.garden_country ?? null,
            language: data?.language ?? null,
            onboarding_complete: Boolean(data?.onboarding_complete),
        };

        setProfile(loadedProfile);

        if (isProfileOnboardingComplete(loadedProfile)) {
            setOnboardingStatus('complete');
            setOnboardingStep(null);
        } else {
            startOnboarding();
        }
    };

    // ----------------------------
    // Mandatory sign-in helpers
    // ----------------------------
    const ensureSignedIn = (actionLabel?: string): boolean => {
        if (authStatusRef.current === 'loading') {
            respondLocal('One sec — checking your sign-in status…');
            return false;
        }
        if (userIdRef.current) return true;

        const extra = actionLabel ? ` to **${actionLabel}**` : '';
        respondLocal(
            `Please **sign in${extra}**.\n\nType your **email address** here and I’ll send you a **magic link**.`
        );
        return false;
    };

    const signInWithMagicLink = async (email: string) => {
        const clean = email.trim().toLowerCase();
        const redirectTo =
            typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

        const { error } = await supabase.auth.signInWithOtp({
            email: clean,
            options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
        });

        if (error) {
            console.error('Magic link error:', error);
            respondLocal(`Hmm — I couldn't send the link. (${error.message})`);
            return;
        }

        respondLocal(`✅ Magic link sent to **${clean}**.\n\nOpen your email and tap the link to finish signing in.`);
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Sign out error:', error);
            respondLocal(`I couldn’t sign you out. (${error.message})`);
            return;
        }
        respondLocal('Signed out. 👋');
    };

    const getCurrentImage = React.useCallback(async (): Promise<string | null> => {
        let capturedImage: string | null = null;

        if (isCameraActive && cameraVideoRef.current) {
            try {
                const video = cameraVideoRef.current;
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0);
                    capturedImage = canvas.toDataURL('image/jpeg', 0.8);
                }
            } catch (e) {
                console.error('Failed to capture camera frame:', e);
            }
        } else if (selectedImage) {
            capturedImage = selectedImage;
        }

        return capturedImage;
    }, [isCameraActive, selectedImage]);

    // ----------------------------
    // Intent helpers
    // ----------------------------
    const normalize = (s: string) => s.toLowerCase().trim().replace(/[.!?]+$/g, '');

    const detectVisionIntent = (s: string): VisionIntent => {
        const t = normalize(s);

        // IDENTIFY
        if (
            t === 'identify' ||
            t === 'identify this' ||
            t === 'identify plant' ||
            t === 'what plant is this' ||
            t === 'what is this plant'
        )
            return 'IDENTIFY';

        // DIAGNOSE
        if (
            t === 'diagnose' ||
            t === 'diagnose this' ||
            t === 'diagnose plant' ||
            t === "what's wrong" ||
            t === 'what is wrong' ||
            t === "what's wrong with this plant" ||
            t === 'what is wrong with this plant'
        )
            return 'DIAGNOSE';

        return null;
    };

    // helper: get a nice error message regardless of JSON/text response
    const readErrorMessage = async (res: Response) => {
        try {
            const data = await res.json();
            return data?.error || data?.message || JSON.stringify(data);
        } catch {
            try {
                const t = await res.text();
                return t || `Request failed (${res.status})`;
            } catch {
                return `Request failed (${res.status})`;
            }
        }
    };

    // ----------------------------
    // sendMessage (sign-in gate + onboarding gate + chat/vision)
    // ----------------------------
    const sendMessage = React.useCallback(
        async (content: string) => {
            if (!content.trim()) return;

            const imageForUserMessage = await getCurrentImage();

            setMessages((prev) => [
                ...prev,
                {
                    role: 'user',
                    content,
                    image: !detectVisionIntent(content) && imageForUserMessage ? imageForUserMessage : undefined,
                    imageKind: 'photo',
                    imageTitle: 'Chat Upload',
                },
            ]);
            setIsLoading(true);

            const incoming = content.trim();

            try {
                // Mandatory sign-in gate
                if (!userIdRef.current) {
                    if (isValidEmail(incoming)) {
                        await signInWithMagicLink(incoming);
                        return;
                    }

                    respondLocal('🔒 Sign-in required.\n\nType your **email address** and I’ll send you a **magic link**.');
                    return;
                }

                // Onboarding gate
                if (onboardingStatusRef.current !== 'complete') {
                    const handled = await handleOnboardingInput(incoming);
                    if (handled) return;

                    startOnboarding();
                    return;
                }

                // Vision intents (identify/diagnose)
                const visionIntent = detectVisionIntent(incoming);
                if (visionIntent) {
                    const image = await getCurrentImage();
                    if (!image) {
                        respondLocal('I can do that — I just need a plant photo. Turn on the camera or upload an image first.');
                        return;
                    }

                    const endpoint = visionIntent === 'IDENTIFY' ? '/api/identify' : '/api/diagnose';

                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-id': userIdRef.current!,
                        },
                        body: JSON.stringify({ image }),
                    });

                    if (!res.ok) {
                        if (res.status === 401) {
                            respondLocal('🔒 Please sign in again to use vision tools.');
                            throw new Error('AUTH_401');
                        }

                        if (res.status === 429) {
                            await readErrorMessage(res).catch(() => { });
                            requestUpgrade('vision_limit');
                            throw new Error('VISION_LIMIT_429');
                        }

                        const msg = await readErrorMessage(res);
                        console.error('Vision intent failed:', msg);
                        respondLocal('I tried, but something went wrong analyzing that image. Can you try again?');
                        throw new Error(msg);
                    }

                    const data = await res.json();
                    const r = data?.result;

                    if (visionIntent === 'IDENTIFY') {
                        const name = r?.name ?? 'Unknown plant';
                        const sci = r?.scientific_name ? ` (${r.scientific_name})` : '';
                        const confPct = typeof r?.confidence === 'number' ? `${Math.round(r.confidence * 100)}%` : '—';
                        const tips = r?.tips ? `\n\nTip: ${r.tips}` : '';

                        respondLocal(`I think this is **${name}${sci}**. Confidence: **${confPct}**.${tips}`, {
                            image,
                            imageKind: 'prediction',
                            imageTitle: name,
                            imageMetadata: r,
                        });
                        return;
                    } else {
                        const dx = r?.diagnosis ?? 'Unknown';
                        const confPct = typeof r?.confidence === 'number' ? `${Math.round(r.confidence * 100)}%` : '—';
                        const desc = r?.description ? `\n\nWhat I’m seeing: ${r.description}` : '';
                        const steps =
                            Array.isArray(r?.treatment) && r.treatment.length
                                ? `\n\nNext steps:\n- ${r.treatment.join('\n- ')}`
                                : '';

                        respondLocal(`Here’s my read: **${dx}**. Confidence: **${confPct}**.${desc}${steps}`, {
                            image,
                            imageKind: 'prediction',
                            imageTitle: dx,
                            imageMetadata: r,
                        });
                        return;
                    }
                }

                // Normal chat request -> /api/chat
                let capturedImage: string | null = null;

                if (isCameraActive && cameraVideoRef.current) {
                    try {
                        const video = cameraVideoRef.current;
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(video, 0, 0);
                            capturedImage = canvas.toDataURL('image/jpeg', 0.8);
                        }
                    } catch (e) {
                        console.error('Failed to capture camera frame:', e);
                    }
                } else if (selectedImage) {
                    capturedImage = selectedImage;
                    setSelectedImage(null);
                }

                const historyPayload = messagesRef.current.slice(-20);

                const chatRes = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userIdRef.current!,
                    },
                    body: JSON.stringify({
                        message: content,
                        history: historyPayload,
                        image: capturedImage,
                        profile: profileRef.current,
                    }),
                });

                if (chatRes.status === 429) {
                    respondLocal('Bramble is taking a short breath (Rate Limit hit). Please try again in 30 seconds.');
                    return;
                }

                if (!chatRes.ok) {
                    const errorData = await chatRes.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to get response');
                }

                const data = await chatRes.json();
                const aiMessage: Message = { role: 'assistant', content: data.message };
                setMessages((prev) => [...prev, aiMessage]);

                if (uiModeRef.current === 'SPEAKING') {
                    playSpeech(data.message);
                }
            } catch (error: any) {
                const msg = String(error?.message || '');

                if (msg === 'VISION_LIMIT_429' || msg === 'AUTH_401') {
                    return;
                }

                console.error('sendMessage Error:', msg || error);
                respondLocal("I'm having trouble connecting to the garden network. Please try again.");
            } finally {
                setIsLoading(false);
            }
        },
        [getCurrentImage, isCameraActive, selectedImage]
    );

    // Convenience methods (vision only, no persistence)
    const identifyPlant = React.useCallback(async () => {
        if (!ensureSignedIn('identify plants')) throw new Error('Not authenticated.');
        if (onboardingStatusRef.current !== 'complete') {
            respondLocal("Let's finish onboarding first so I know who I'm gardening with.");
            throw new Error('ONBOARDING_INCOMPLETE');
        }

        const image = await getCurrentImage();
        if (!image) throw new Error('No image available (camera not active and no upload selected).');

        const res = await fetch('/api/identify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userIdRef.current!,
            },
            body: JSON.stringify({ image }),
        });

        if (!res.ok) {
            if (res.status === 401) {
                respondLocal('🔒 Please sign in to use plant identification. Type your email and I’ll send a magic link.');
                throw new Error('AUTH_401');
            }

            if (res.status === 429) {
                requestUpgrade('vision_limit');
                throw new Error('VISION_LIMIT_429');
            }

            const msg = await readErrorMessage(res);
            respondLocal(`Hmm — I couldn’t identify that plant. (${msg})`);
            throw new Error(msg);
        }

        const json = await res.json();
        const r = json?.result;

        const name = r?.name ?? 'Unknown plant';
        const sci = r?.scientific_name ? ` (${r.scientific_name})` : '';
        const confPct = typeof r?.confidence === 'number' ? `${Math.round(r.confidence * 100)}%` : '—';
        const tips = r?.tips ? `\n\nTip: ${r.tips}` : '';

        respondLocal(`I think this is **${name}${sci}**. Confidence: **${confPct}**.${tips}`, {
            image,
            imageKind: 'prediction',
            imageTitle: name,
            imageMetadata: r,
        });
        return json;
    }, [getCurrentImage]);

    const diagnosePlant = React.useCallback(async () => {
        if (!ensureSignedIn('diagnose plants')) throw new Error('Not authenticated.');
        if (onboardingStatusRef.current !== 'complete') {
            respondLocal("Let's finish onboarding first so I know who I'm gardening with.");
            throw new Error('ONBOARDING_INCOMPLETE');
        }

        const image = await getCurrentImage();
        if (!image) throw new Error('No image available (camera not active and no upload selected).');

        const res = await fetch('/api/diagnose', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userIdRef.current!,
            },
            body: JSON.stringify({ image }),
        });

        if (!res.ok) {
            if (res.status === 401) {
                respondLocal('🔒 Please sign in to use plant diagnosis. Type your email and I’ll send a magic link.');
                throw new Error('AUTH_401');
            }

            if (res.status === 429) {
                requestUpgrade('vision_limit');
                throw new Error('VISION_LIMIT_429');
            }

            const msg = await readErrorMessage(res);
            respondLocal(`Hmm — I couldn’t diagnose that plant. (${msg})`);
            throw new Error(msg);
        }

        const json = await res.json();
        const r = json?.result;

        const dx = r?.diagnosis ?? 'Unknown';
        const confPct = typeof r?.confidence === 'number' ? `${Math.round(r.confidence * 100)}%` : '—';
        const desc = r?.description ? `\n\nWhat I’m seeing: ${r.description}` : '';
        const steps =
            Array.isArray(r?.treatment) && r.treatment.length ? `\n\nNext steps:\n- ${r.treatment.join('\n- ')}` : '';

        respondLocal(`Here’s my read: **${dx}**. Confidence: **${confPct}**.${desc}${steps}`, {
            image,
            imageKind: 'prediction',
            imageTitle: dx,
            imageMetadata: r,
        });
        return json;
    }, [getCurrentImage]);

    const addMessage = (message: Message) => {
        setMessages((prev) => [...prev, message]);
    };

    // ----------------------------
    // Auth bootstrap + state changes
    // ----------------------------
    useEffect(() => {
        const setSignedOutPrompt = () => {
            setMessages((prev) => {
                if (prev.length) return prev;
                return [
                    {
                        role: 'assistant',
                        content:
                            '🔒 **Sign-in required**.\n\nType your **email address** and I’ll send you a **magic link** to continue.',
                    },
                ];
            });
        };

        const checkUser = async () => {
            setAuthStatus('loading');
            resetOnboardingState();

            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (session?.user) {
                    setUserId(session.user.id);
                    setAuthStatus('signed_in');

                    try {
                        const userTier = await getUserTier(session.user.id);
                        setTier(userTier);
                    } catch {
                        setTier('premium');
                    }

                    await loadProfile(session.user.id);
                } else {
                    setUserId(null);
                    setProfile(null);
                    resetOnboardingState();
                    setAuthStatus('signed_out');
                    setTier('premium');
                    setSignedOutPrompt();
                }
            } catch (err) {
                setUserId(null);
                setProfile(null);
                resetOnboardingState();
                setAuthStatus('signed_out');
                setTier('premium');
                setSignedOutPrompt();
            } finally {
                setAuthChecked(true);
            }
        };

        checkUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
            setAuthChecked(true);

            if (session?.user) {
                setUserId(session.user.id);
                setAuthStatus('signed_in');
                getUserTier(session.user.id).then(setTier).catch(() => setTier('premium'));
                await loadProfile(session.user.id);
            } else {
                setUserId(null);
                setProfile(null);
                resetOnboardingState();
                setAuthStatus('signed_out');
                setTier('premium');
                setSignedOutPrompt();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Speech Recognition
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = React.useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
        ) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = getSpeechRecognitionLocale(profileRef.current?.language);

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript.trim()) sendMessage(transcript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
        };
    }, [sendMessage]);

    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = getSpeechRecognitionLocale(profile?.language);
        }
    }, [profile?.language]);

    useEffect(() => {
        if (uiMode === 'SPEAKING' && authStatus === 'signed_in' && onboardingStatus === 'complete') {
            recognitionRef.current?.start();
        } else {
            recognitionRef.current?.stop();
        }
    }, [uiMode, authStatus, onboardingStatus]);

    return (
        <CompanionContext.Provider
            value={{
                uiMode,
                setUiMode,

                interactionMode,
                setInteractionMode,

                tier,
                isProcessing,
                setIsProcessing,

                authStatus,
                authChecked,
                userId,
                signInWithMagicLink,
                signOut,
                requestUpgrade,

                onboardingStatus,
                profile,

                isKeyboardOpen,
                setIsKeyboardOpen,
                isUploadOpen,
                setIsUploadOpen,
                isCameraActive,
                setIsCameraActive,
                cameraVideoRef,
                selectedImage,
                setSelectedImage,

                messages,
                isLoading,
                sendMessage,
                addMessage,

                identifyPlant,
                diagnosePlant,

                isListening,
            }}
        >
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