import { NextResponse } from 'next/server';
import { checkChatLimit, logUsage } from '@/lib/limits';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'L820P36PyM0qW6c1AqiR';

// Mock Auth - In production, use Supabase Auth helpers to get the real user
const getUserId = (request: Request) => {
    return request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000000';
};

export async function POST(request: Request) {
    if (!ELEVENLABS_API_KEY) {
        return NextResponse.json({ error: 'Server misconfiguration: Missing API Key' }, { status: 500 });
    }

    const userId = getUserId(request);

    // Usage Check: Reuse "Chat" limit for now as per plan
    const allowed = await checkChatLimit(userId);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Daily limit reached. Upgrade to Bloom for more Puddlefoot interactions.' },
            { status: 403 }
        );
    }

    try {
        const { text } = await request.json();

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY,
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_monolingual_v1", // or eleven_turbo_v2 for lower latency
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs API Error:', errorText);
            return NextResponse.json({ error: 'Failed to generate speech' }, { status: response.status });
        }

        // Log usage (as "chat" feature for now, or we could add "voice" enum later)
        await logUsage(userId, 'chat', { type: 'voice_generation', char_count: text.length });

        // Stream the audio back
        return new NextResponse(response.body, {
            headers: {
                'Content-Type': 'audio/mpeg',
            },
        });

    } catch (error) {
        console.error('Voice Generation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
