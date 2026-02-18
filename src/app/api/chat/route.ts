import { NextResponse } from 'next/server';
import { checkChatLimit, logUsage } from '@/lib/limits';

// Mock Auth - In production, use Supabase Auth helpers to get the real user
const getUserId = (request: Request) => {
    // For now, looking for a header or defaulting to a test user
    return request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000000';
};

export async function POST(request: Request) {
    const userId = getUserId(request);
    const allowed = await checkChatLimit(userId);

    if (!allowed) {
        return NextResponse.json(
            { error: 'Daily chat limit reached. Upgrade to Bloom for unlimited consultations.' },
            { status: 403 }
        );
    }

    // ... (Actual Gemini/Chat logic would go here) ...
    try {
        console.log("Chat API: Parsing request...");
        const body = await request.json();
        const { message, history } = body;

        console.log("Chat API: Importing Gemini lib...");
        const { getGeminiModel, PUDDLEFOOT_SYSTEM_PROMPT } = await import('@/lib/gemini');

        console.log("Chat API: Getting model...");
        const model = getGeminiModel();

        // Construct chat history for Gemini SDK
        const chatHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        console.log("Chat API: Starting chat session...");
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "System Instruction: " + PUDDLEFOOT_SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am Puddlefoot, ready to assist." }],
                },
                ...chatHistory
            ],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        console.log("Chat API: Sending message to Gemini...");
        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();
        console.log("Chat API: Received response from Gemini.");

        // Log the usage
        await logUsage(userId, 'chat');

        return NextResponse.json({
            message: text,
            role: 'assistant'
        });

    } catch (error: any) {
        console.error('Chat API Error Details:', error);
        console.error('Chat API Error Stack:', error.stack);
        return NextResponse.json(
            { error: 'Failed to process your request in the garden.', details: error.message },
            { status: 500 }
        );
    }
}
