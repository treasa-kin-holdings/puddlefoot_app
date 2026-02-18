import { NextResponse } from 'next/server';
import { checkIdentificationLimit, logUsage } from '@/lib/limits';

// Mock Auth - In production, use Supabase Auth helpers to get the real user
const getUserId = (request: Request) => {
    // For now, looking for a header or defaulting to a test user
    return request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000000';
};

export async function POST(request: Request) {
    const userId = getUserId(request);
    const allowed = await checkIdentificationLimit(userId);

    if (!allowed) {
        return NextResponse.json(
            { error: 'Monthly identification limit reached. Upgrade to Bloom for unlimited ID.' },
            { status: 403 }
        );
    }

    // ... (Actual Gemini/ID logic would go here) ...
    try {
        const { image } = await request.json(); // Expect base64 image string

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const { getGeminiModel, fileToGenerativePart } = await import('@/lib/gemini');
        const model = getGeminiModel("gemini-3-flash-preview"); // Use Gemini 3 for better vision capabilities

        const prompt = "Identify this plant species. Provide the common name, scientific name, and a brief confidence score (0-1). Return JSON: { \"name\": string, \"scientific_name\": string, \"confidence\": number, \"tips\": string }";

        // Strip data URI prefix if present (e.g., "data:image/jpeg;base64,")
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const imagePart = fileToGenerativePart(base64Data, "image/jpeg"); // Assuming JPEG for now, or extract from data URI

        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response;
        const text = response.text();

        // Cleaner JSON parsing
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanedText);

        // Log the usage
        await logUsage(userId, 'identification');

        return NextResponse.json({
            message: 'Plant identified!',
            result: data
        });

    } catch (error: any) {
        console.error('ID API Error:', error);
        return NextResponse.json(
            { error: 'Failed to identify plant.' },
            { status: 500 }
        );
    }
}
