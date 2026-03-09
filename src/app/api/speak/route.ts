import { NextResponse } from 'next/server';
import { checkChatLimit, logUsage } from '@/lib/limits';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'L820P36PyM0qW6c1AqiR';

// Mock Auth - In production, use Supabase Auth helpers to get the real user
const getUserId = (request: Request) => {
    return request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000000';
};

const isUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function POST(request: Request) {
    if (!ELEVENLABS_API_KEY) {
        return NextResponse.json({ error: 'Server misconfiguration: Missing ELEVENLABS_API_KEY' }, { status: 500 });
    }

    const userId = getUserId(request);
    const realUser = isUuid(userId) && userId !== '00000000-0000-0000-0000-000000000000';

    // Limits: only for real users
    if (realUser) {
        const allowed = await checkChatLimit(userId);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Daily limit reached. Upgrade to Bloom for more Puddlefoot interactions.' },
                { status: 403 }
            );
        }
    }

    try {
        const { text } = await request.json();

        if (typeof text !== 'string' || !text.trim()) {
            return NextResponse.json({ error: 'Text input must be a non-empty string' }, { status: 400 });
        }

        const cleanedText = text.trim();

        // guardrail for huge pastes
        if (cleanedText.length > 5000) {
            return NextResponse.json({ error: 'Text input exceeds the maximum length of 5000 characters' }, { status: 400 });
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text: cleanedText,
                model_id: 'eleven_monolingual_v1',
                voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs API Error:', errorText);
            return NextResponse.json({ error: 'Failed to generate speech', details: errorText }, { status: response.status });
        }

        // Usage logging: only for real users
        if (realUser) {
            await logUsage(userId, 'chat', { type: 'voice_generation', char_count: cleanedText.length });
        }

        const contentType = response.headers.get('content-type') || 'audio/mpeg';

        return new NextResponse(response.body, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-store',
                'Content-Disposition': 'inline',
            },
        });
    } catch (error) {
        console.error('Voice Generation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}