
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

async function testGemini() {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing from .env");
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        console.log("Connecting to Gemini...");

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents: "Reply with exactly: ECHO AI connection successful!"
        });

        console.log("\nGemini response:");
        console.log(response.text);

        console.log("\nECHO Gemini connection successful!");

    } catch (error) {
        console.error("\nGemini connection failed:");
        console.error("Status:", error.status || "Unavailable");
        console.error("Message:", error.message);
    }
}

testGemini();
