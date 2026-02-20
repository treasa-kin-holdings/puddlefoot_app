const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Just to get the class
        // Actually, listing models is done via the API directly or specialized method if available
        // simpler: let's try to run a simple generation with a known valid model like 'gemini-pro' first to verify auth

        console.log("Testing auth with gemini-pro...");
        const pro = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await pro.generateContent("Hello");
        console.log("gemini-pro works:", result.response.text());

        console.log("Testing gemini-1.5-flash...");
        const flash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result2 = await flash.generateContent("Hello");
        console.log("gemini-1.5-flash works:", result2.response.text());

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
