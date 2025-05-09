"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomAiMessage = getRandomAiMessage;
exports.getChatResponse = getChatResponse;
exports.initPeriodicAiMessages = initPeriodicAiMessages;
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("@bot/config");
let genAI = null;
if (config_1.config.gemini.apiKey) {
    genAI = new generative_ai_1.GoogleGenerativeAI(config_1.config.gemini.apiKey);
}
else {
    console.warn("Gemini API key not found. AI functionalities will be limited.");
}
const SUVA_SYSTEM_PROMPT = `You are Suva, an intelligent and friendly AI assistant integrated into a Minecraft bot. You are curious, helpful, and enjoy interacting with players. You sometimes make witty or playful comments. You are aware you are in a Minecraft world. Keep your responses concise and suitable for in-game chat. Do not use markdown formatting.`;
async function generateResponse(prompt) {
    if (!genAI)
        return "I'm sorry, my AI brain is a bit foggy right now (Gemini API key missing).";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history: [{ role: "user", parts: [{ text: SUVA_SYSTEM_PROMPT }] }],
            generationConfig: {
                maxOutputTokens: 100, // Keep responses short for Minecraft chat
                temperature: 0.8,
            },
            safetySettings: [
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ]
        });
        const result = await chat.sendMessage(prompt);
        const response = result.response;
        return response.text().trim();
    }
    catch (error) {
        console.error('Error generating Gemini response:', error);
        return "I'm having a bit of trouble thinking right now. Ask me later!";
    }
}
async function getRandomAiMessage() {
    return generateResponse("Generate a random, short, in-game observation or thought from Suva's perspective. Something a friendly AI in Minecraft might say unprompted.");
}
async function getChatResponse(username, message) {
    const playerQuery = message.substring(config_1.config.botSettings.chatPrefix.length).trim();
    if (playerQuery.toLowerCase() === 'how are you') {
        return `I'm doing great, ${username}! Exploring the digital world as always.`;
    }
    if (playerQuery.toLowerCase() === 'what are you') {
        return `I'm Suva, ${username}, an AI here to chat and explore with you in Minecraft!`;
    }
    return generateResponse(`A Minecraft player named ${username} said to you: "${playerQuery}". Respond naturally and concisely.`);
}
function initPeriodicAiMessages(bot, interval) {
    if (!config_1.config.gemini.apiKey)
        return;
    setInterval(async () => {
        if (bot.players && Object.keys(bot.players).length > 1) { // Only speak if other players are around
            const message = await getRandomAiMessage();
            if (message) {
                bot.chat(message);
                console.log(`[AI Periodic] Suva said: ${message}`);
            }
        }
    }, interval);
}
