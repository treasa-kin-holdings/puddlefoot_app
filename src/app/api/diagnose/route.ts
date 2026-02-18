import { NextResponse } from 'next/server';
import { checkIdentificationLimit, logUsage } from '@/lib/limits'; // Reuse ID limit for now

// Mock Auth - In production, use Supabase Auth helpers to get the real user
const getUserId = (request: Request) => {
    return request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000000';
};

export async function POST(request: Request) {
    const userId = getUserId(request);

    // Check limits (using identification limit as proxy for "advanced vision features")
    const allowed = await checkIdentificationLimit(userId);

    if (!allowed) {
        return NextResponse.json(
            { error: 'Monthly diagnosis limit reached. Upgrade to Bloom for unlimited health checks.' },
            { status: 403 }
        );
    }

    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const { getGeminiModel, fileToGenerativePart } = await import('@/lib/gemini');
        const model = getGeminiModel("gemini-3-flash-preview");

        const prompt = `
        Analyze this image of a plant for any signs of pests, disease, or stress.
        Diagnose the issue if present.
        Provide a confidence score (0-1).
        Suggest 2-3 immediate treatment steps.
        
        Return ONLY valid JSON in this format:
        {
            "diagnosis": "Name of issue or 'Healthy'",
            "confidence": 0.95,
            "description": "Brief explanation of visual symptoms",
            "treatment": ["Step 1", "Step 2"]
        }
        `;

        // Strip data URI prefix if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const imagePart = fileToGenerativePart(base64Data, "image/jpeg");

        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response;
        const text = response.text();

        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanedText);

        await logUsage(userId, 'identification'); // Logging as ID for now

        return NextResponse.json({
            message: 'Diagnosis complete',
            result: data
        });

    } catch (error: any) {
        console.error('Diagnose API Error:', error);
        return NextResponse.json(
            { error: 'Failed to diagnose plant.' },
            { status: 500 }
        );
    }
}
