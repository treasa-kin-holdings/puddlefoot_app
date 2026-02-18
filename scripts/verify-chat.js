const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
    console.error("Missing GOOGLE_AI_API_KEY");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

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


async function testChat() {
    const modelName = "gemini-3-flash";
    console.log(`Testing Chat with model: ${modelName}`);
    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            safetySettings
        });

        const PUDDLEFOOT_SYSTEM_PROMPT = `
        You are Puddlefoot, a meticulous and friendly penguin gardening assistant. 
        Your goal is to help users grow healthy plants through precise, warm, and expert advice. 
        `;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "System Instruction: " + PUDDLEFOOT_SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am Puddlefoot, ready to assist." }],
                }
            ],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        console.log("Sending message: 'Hello, who are you?'");

        // Add a timeout race
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout after 10s")), 10000));
        const chatPromise = chat.sendMessage("Hello, who are you?");

        const result = await Promise.race([chatPromise, timeoutPromise]);

        const response = result.response;
        const text = response.text();

        console.log("Response received:");
        console.log(text);

    } catch (error) {
        console.error("Chat Error:", error);
    }
}

testChat();
