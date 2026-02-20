import { NextResponse } from 'next/server';
import { checkChatLimit, logUsage } from '@/lib/limits';
import * as fs from 'fs';
import * as path from 'path';

// Mock Auth - In production, use Supabase Auth helpers to get the real user
const getUserId = (request: Request) => {
    // For now, looking for a header or defaulting to a test user
    return request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000000';
};

export async function POST(request: Request) {
    const logFile = path.join(process.cwd(), 'debug-error.log');
    const payloadFile = path.join(process.cwd(), 'debug-payload.log');

    console.log("Chat API: HIT - Request received");
    try {
        // Parse body first to log it
        const bodyText = await request.text();
        fs.writeFileSync(payloadFile, `Timestamp: ${new Date().toISOString()}\nPayload: ${bodyText.substring(0, 1000)}... (truncated)\n\n`);

        const { message, history, image } = JSON.parse(bodyText);

        const userId = getUserId(request);
        // ... rest of logic ... (Re-use existing logic but with `message`, `history`, `image` already destructured)

        // Validate UUID format to prevent DB errors
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

        // Only check limits if it's a real user
        if (isValidUUID && userId !== '00000000-0000-0000-0000-000000000000') {
            const allowed = await checkChatLimit(userId);
            if (!allowed) {
                return NextResponse.json(
                    { error: 'Daily chat limit reached. Upgrade to Bloom for unlimited consultations.' },
                    { status: 403 }
                );
            }
        } else {
            console.log("Chat API: Skipping limits check for guest/test user:", userId);
        }

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        console.log("Chat API: Importing Gemini lib...");
        const { getGeminiModel, PUDDLEFOOT_SYSTEM_PROMPT } = await import('@/lib/gemini');

        console.log("Chat API: Getting model...");
        const model = getGeminiModel();

        // Construct chat history for Gemini SDK
        const chatHistory = (history || [])
            .filter((msg: any) => msg && msg.content) // Filter out empty/malformed messages
            .map((msg: any) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

        console.log("Chat API: History payload length:", chatHistory.length);

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
                maxOutputTokens: 2000,
            },
        });

        console.log("Chat API: Sending message to Gemini...");

        let result;
        if (image) {
            console.log("Chat API: Image detected, sending multimodal message...");
            // Remove "data:image/jpeg;base64," prefix if present
            const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

            result = await chat.sendMessage([
                { text: message },
                {
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: base64Image
                    }
                }
            ]);
        } else {
            result = await chat.sendMessage(message);
        }

        const response = result.response;
        const text = response.text();
        console.log("Chat API: Received response from Gemini.");

        // Log the usage only for real users
        if (isValidUUID && userId !== '00000000-0000-0000-0000-000000000000') {
            await logUsage(userId, 'chat');
        } else {
            console.log("Chat API: Skipping usage log for guest/test user");
        }

        return NextResponse.json({
            message: text,
            role: 'assistant'
        });

    } catch (error: any) {
        // Log the full error to file for debugging
        const errorLog = `Timestamp: ${new Date().toISOString()}\nError: ${error.message}\nStack: ${error.stack}\nDetails: ${JSON.stringify(error)}\n\n`;
        fs.appendFileSync(logFile, errorLog);

        console.error('Chat API Error DETAILS:', error);
        console.error('Chat API Error STACK:', error.stack);

        // Handle Rate Limits gracefully
        if (error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.status === 429) {
            return NextResponse.json(
                {
                    error: 'Puddlefoot is tired (Rate Limit Reached). Please wait a minute and try again.',
                    details: 'Gemini API Quota Exceeded'
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to process your request in the garden.', details: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}