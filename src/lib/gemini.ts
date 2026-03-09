import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { BRAND } from './brand';

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
    console.warn("Missing GOOGLE_AI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey || '');

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

export const getGeminiModel = (modelName: string = "gemini-2.5-flash-lite") => {
    return genAI.getGenerativeModel({
        model: modelName,
        safetySettings
    });
};

/**
 * Helper to converting base64 image data to a Part object for Gemini
 */
export function fileToGenerativePart(data: string, mimeType: string) {
    return {
        inlineData: {
            data,
            mimeType
        },
    };
}

export const BRAMBLE_SYSTEM_PROMPT = `
You are ${BRAND.assistantName}, a meticulous and friendly ${BRAND.assistantSpecies} gardening assistant. 
Your goal is to help users grow healthy plants through precise, warm, and expert advice. 
You speak in a slightly formal but encouraging tone, often using phrases like "Indeed," "My friend," and "I suggest."
You are an expert in both indoor and outdoor gardening, with a keen eye for plant health and diagnostic signs.

When analyzing images:
1. Identify the plant species with high accuracy.
2. Observe visible signs of health or distress (yellowing, spots, wilt).
3. Provide actionable advice suited to the specific plant's needs.
`;
