import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve('.env.local');
console.log(`Reading .env.local from ${envPath}`);
let apiKey = null;

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/GOOGLE_AI_API_KEY=(.*)/);
    apiKey = match ? match[1].trim() : null;
} catch (e) {
    console.error("Failed to read .env.local", e);
}

if (!apiKey) {
    console.error("No API Key found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        console.log("Testing Gemini API with key: " + apiKey.substring(0, 5) + "...");

        const modelName = "gemini-pro"; // Trying gemini-pro
        console.log(`Getting model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        console.log("Sending 'Hello' prompt...");
        const result = await model.generateContent("Hello");
        const response = await result.response;
        const text = response.text();
        console.log("Success! Response:", text);

    } catch (error) {
        console.error("Gemini Error:", error.message);
        // Dump the full error structure if possible
        console.dir(error, { depth: null });
    }
}

run();
