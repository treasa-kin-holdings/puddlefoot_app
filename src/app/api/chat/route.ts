import { NextResponse } from 'next/server';
import { checkChatLimit, logUsage } from '@/lib/limits';

const getUserId = (request: Request) => {
    return request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000000';
};

const isUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function POST(request: Request) {
    console.log('Chat API: HIT');

    const userId = getUserId(request);
    const realUser = isUuid(userId) && userId !== '00000000-0000-0000-0000-000000000000';

    try {
        const body = await request.json();
        const message: string = body?.message;
        const history = Array.isArray(body?.history) ? body.history : [];
        const image: string | undefined = body?.image;

        if (typeof message !== 'string' || !message.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Guardrail for huge pastes (adjust if you want)
        if (message.length > 12000) {
            return NextResponse.json(
                { error: 'That message is too long. Try pasting smaller chunks (under ~12k characters).' },
                { status: 400 }
            );
        }

        // Limits only for real users
        if (realUser) {
            const allowed = await checkChatLimit(userId);
            if (!allowed) {
                return NextResponse.json(
                    { error: 'Daily chat limit reached. Upgrade to Bloom for unlimited consultations.' },
                    { status: 403 }
                );
            }
        } else {
            console.log('Chat API: guest/test user, skipping limits:', userId);
        }

        const { getGeminiModel, BRAMBLE_SYSTEM_PROMPT } = await import('@/lib/gemini');

        // IMPORTANT: use a stable model id
        const model = getGeminiModel('gemini-2.5-flash-lite');

        const chatHistory = history
            .filter((m: any) => m && typeof m.content === 'string' && m.content.trim())
            .map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: `System Instruction: ${BRAMBLE_SYSTEM_PROMPT}` }] },
                { role: 'model', parts: [{ text: 'Understood. I am Bramble, ready to assist.' }] },
                ...chatHistory,
            ],
            generationConfig: { maxOutputTokens: 2000 },
        });

        let result;
        if (image && typeof image === 'string') {
            const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
            result = await chat.sendMessage([
                { text: message.trim() },
                { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            ]);
        } else {
            result = await chat.sendMessage(message.trim());
        }

        const text = result.response.text();

        if (realUser) {
            await logUsage(userId, 'chat');
        }

        return NextResponse.json({ message: text, role: 'assistant' });
    } catch (error: any) {
        console.error('Chat API Error:', error?.message || error);
        console.error(error?.stack);

        // Rate limit detection
        if (error?.message?.includes('429') || error?.status === 429) {
            return NextResponse.json(
                { error: 'Bramble is tired (Rate Limit Reached). Please wait a minute and try again.' },
                { status: 429 }
            );
        }

        // If JSON parse fails or body too big, it often lands here
        return NextResponse.json(
            { error: 'Failed to process your request in the garden.', details: error?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}