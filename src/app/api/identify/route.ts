import { NextResponse } from "next/server";
import { checkIdentificationLimit, logUsage } from "@/lib/limits";

const isValidUUID = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// Strict auth: no guest fallback (CompanionContext is already sign-in required)
const getUserIdOrNull = (request: Request) => {
    const userId = request.headers.get("x-user-id");
    if (!userId) return null;
    if (!isValidUUID(userId)) return null;
    return userId;
};

function parseDataUri(image: string) {
    const match = image.match(/^data:(image\/[\w.+-]+);base64,(.*)$/i);
    if (match) {
        return { mimeType: match[1], base64Data: match[2] };
    }
    return { mimeType: "image/jpeg", base64Data: image };
}

function tryParseJsonLoose(text: string) {
    const cleaned = text.replace(/```json/gi, "```").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleaned);
    } catch { }

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const maybeJson = cleaned.slice(firstBrace, lastBrace + 1);
        try {
            return JSON.parse(maybeJson);
        } catch { }
    }

    return null;
}

export async function GET() {
    return NextResponse.json({ error: "Method Not Allowed. Use POST." }, { status: 405 });
}

export async function POST(request: Request) {
    const userId = getUserIdOrNull(request);
    if (!userId) {
        return NextResponse.json(
            { error: "Not authenticated. Missing or invalid x-user-id header." },
            { status: 401 }
        );
    }

    // Enforce monthly vision limit (counts identification + diagnosis)
    const allowed = await checkIdentificationLimit(userId);
    if (!allowed) {
        return NextResponse.json(
            { error: "Monthly vision limit reached. Upgrade to Premium for unlimited vision." },
            { status: 429 }
        );
    }

    try {
        const { image } = await request.json();

        if (!image || typeof image !== "string") {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const { getGeminiModel, fileToGenerativePart } = await import("@/lib/gemini");

        const model = getGeminiModel("gemini-2.5-flash-lite");

        const prompt =
            'Identify this plant species. Provide the common name, scientific name, and a brief confidence score (0-1). Return JSON ONLY in this exact shape: {"name": string, "scientific_name": string, "confidence": number, "tips": string}';

        const { mimeType, base64Data } = parseDataUri(image);
        const imagePart = fileToGenerativePart(base64Data, mimeType);

        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();

        const parsed = tryParseJsonLoose(text);

        // Log usage only after success
        await logUsage(userId, "identification");

        if (!parsed) {
            return NextResponse.json({
                message: "Plant identified (raw response).",
                raw: text,
            });
        }

        return NextResponse.json({
            message: "Plant identified!",
            result: parsed,
        });
    } catch (error: any) {
        console.error("ID API Error:", error);
        return NextResponse.json(
            { error: "Failed to identify plant.", details: error?.message },
            { status: 500 }
        );
    }
}