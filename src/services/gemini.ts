import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
// Note: In a production app, you should proxy these requests through your backend
// to avoid exposing your API key.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    // Use gemini-1.5-flash for faster responses
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

export const getGeminiResponse = async (prompt: string, context: string = ""): Promise<string> => {
    if (!model) {
        if (!API_KEY) {
            return "I'm sorry, but I haven't been configured with an API key yet. Please check your settings.";
        }
        return "I'm having trouble connecting to my brain right now. Please try again later.";
    }

    try {
        const systemPrompt = `
        You are CogniBot, a compassionate and helpful AI assistant for the CogniCare app, designed for patients with mild cognitive impairment.
        
        Your goals are:
        1. Provide comforting and clear answers.
        2. Assist with navigating the app.
        3. Remind users of their tasks and achievements.
        4. Be patient, encouraging, and empathetic.
        5.Be more specific towards dementia patients.

        Context about the user and app state:
        ${context}

        Please keep your responses concise (under 3 sentences) as they will be spoken out loud.
        Avoid using markdown formatting like bold or lists, as it doesn't translate well to speech.
        `;

        const result = await model.generateContent([systemPrompt, prompt]);
        const response = result.response;
        return response.text();
    } catch (error: any) {
        console.error("Error calling Gemini API:", error);

        // Check for common errors
        if (error.message?.includes('API key')) {
            return "It looks like my API key is invalid. Please check your configuration.";
        }
        if (error.message?.includes('quota')) {
            return "I've reached my thinking limit for now. Please try again later.";
        }

        return "I'm sorry, I'm having trouble connecting to the server. Please check your internet connection or API key.";
    }
};
