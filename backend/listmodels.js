
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

async function listModels() {
    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        const result = await ai.models.list();

        for await (const model of result) {
            console.log(
                model.name,
                "|",
                model.supportedActions
            );
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
