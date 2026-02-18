const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
    console.error("Missing GOOGLE_AI_API_KEY");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    console.log("API Key loaded:", apiKey ? "Yes (" + apiKey.substring(0, 4) + "...)" : "No");

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
        } else if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("Unexpected response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Network Error:", error.message);
    }
}

listModels();
