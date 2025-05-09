"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mineflayer_1 = __importDefault(require("mineflayer"));
const config_1 = require("@bot/config");
const actions_1 = require("@bot/actions");
const ai_1 = require("@bot/ai");
console.log('Starting Suva Bot...');
const botOptions = {
    host: config_1.config.minecraft.host,
    port: config_1.config.minecraft.port,
    username: config_1.config.minecraft.username,
    password: config_1.config.minecraft.password,
    auth: config_1.config.minecraft.auth,
    version: config_1.config.minecraft.version || undefined, // Pass undefined if false
    checkTimeoutInterval: 60 * 1000, // 60 seconds
    defaultChatPatterns: true, // Use default chat patterns
};
function createBot() {
    const bot = mineflayer_1.default.createBot(botOptions);
    bot.on('login', () => {
        console.log(`Suva logged in as ${bot.username} to ${config_1.config.minecraft.host}:${config_1.config.minecraft.port}`);
        bot.chat(`Suva is online! Hello everyone! Type "${config_1.config.botSettings.chatPrefix} help" for assistance.`);
        (0, actions_1.initAntiAfk)(bot, config_1.config.botSettings.antiAfkInterval);
        if (config_1.config.gemini.apiKey) {
            (0, ai_1.initPeriodicAiMessages)(bot, config_1.config.botSettings.randomMessageInterval);
        }
    });
    bot.on('chat', async (username, message) => {
        if (username === bot.username)
            return; // Ignore self
        console.log(`<${username}> ${message}`);
        if (message.toLowerCase().startsWith(config_1.config.botSettings.chatPrefix.toLowerCase())) {
            const command = message.substring(config_1.config.botSettings.chatPrefix.length).trim().toLowerCase();
            if (command === 'help') {
                bot.chat(`Hi ${username}! I'm Suva. You can chat with me by starting your message with "${config_1.config.botSettings.chatPrefix}". For example: "${config_1.config.botSettings.chatPrefix} how are you?"`);
            }
            else if (command === 'ping') {
                bot.chat(`Pong, ${username}! My ping is currently ${bot.player?.ping || 'unknown'}ms.`);
            }
            else if (config_1.config.gemini.apiKey) {
                const response = await (0, ai_1.getChatResponse)(username, message);
                if (response) {
                    bot.chat(response);
                }
            }
            else {
                if (command === 'how are you') {
                    bot.chat(`I'm doing well, ${username}! Just a bit limited without my AI brain fully connected.`);
                }
                else {
                    bot.chat(`I'm here, ${username}, but my advanced AI features are offline. You can still ask me for 'help' or 'ping'.`);
                }
            }
        }
    });
    bot.on('kicked', (reason, loggedIn) => {
        console.error(`Suva was kicked for: ${reason} (loggedIn: ${loggedIn})`);
        console.log('Attempting to reconnect in 30 seconds...');
        setTimeout(createBot, 30000);
    });
    bot.on('error', (err) => {
        console.error('Bot encountered an error:', err);
        // Avoid immediate reconnect on all errors to prevent spamming,
        // but you might want more sophisticated error handling here.
        if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
            console.log('Connection error. Attempting to reconnect in 60 seconds...');
            setTimeout(createBot, 60000);
        }
    });
    bot.on('end', (reason) => {
        console.log(`Bot disconnected. Reason: ${reason}. Attempting to reconnect in 30 seconds...`);
        setTimeout(createBot, 30000);
    });
    // A simple way to make the bot responsive to being "stuck"
    // This is very basic and might need refinement with pathfinder for real stuck detection.
    let lastPosition = bot.entity?.position.clone();
    let stuckCounter = 0;
    setInterval(() => {
        if (bot.entity && lastPosition) {
            if (bot.entity.position.distanceTo(lastPosition) < 0.1) { // If moved less than 0.1 blocks
                stuckCounter++;
                if (stuckCounter > 5) { // Stuck for ~5 seconds (assuming 1s interval)
                    console.log("[Anti-Stuck] Attempting to unstick by jumping.");
                    bot.jump();
                    stuckCounter = 0;
                }
            }
            else {
                stuckCounter = 0;
            }
            lastPosition = bot.entity.position.clone();
        }
        else if (bot.entity) {
            lastPosition = bot.entity.position.clone();
        }
    }, 1000);
}
// Initial bot creation
createBot();
// Graceful shutdown
process.on('SIGINT', () => {
    console.log("Caught interrupt signal, disconnecting bot...");
    if (mineflayer_bot) { // Check if bot instance exists
        mineflayer_bot.quit("Shutting down");
    }
    process.exit(0);
});
// Keep a global reference for SIGINT or other handlers if needed
let mineflayer_bot = null;
// This is a bit of a hack to make the bot instance available to the SIGINT handler.
// In createBot, assign the created bot to mineflayer_bot.
// e.g., inside createBot: mineflayer_bot = mineflayer.createBot(botOptions);
// This is not ideal, a class-based approach or better state management would be cleaner for larger apps.
// For now, let's adjust createBot to assign to this global var.
const originalCreateBot = createBot;
global.createBot = () => {
    mineflayer_bot = originalCreateBot(); // This won't work as originalCreateBot doesn't return the bot
    // Let's redefine createBot to assign to the global var
};
// Redefine createBot to assign to the global var
function createAndAssignBot() {
    const bot = mineflayer_1.default.createBot(botOptions);
    mineflayer_bot = bot; // Assign to global var
    bot.on('login', () => {
        console.log(`Suva logged in as ${bot.username} to ${config_1.config.minecraft.host}:${config_1.config.minecraft.port}`);
        bot.chat(`Suva is online! Hello everyone! Type "${config_1.config.botSettings.chatPrefix} help" for assistance.`);
        (0, actions_1.initAntiAfk)(bot, config_1.config.botSettings.antiAfkInterval);
        if (config_1.config.gemini.apiKey) {
            (0, ai_1.initPeriodicAiMessages)(bot, config_1.config.botSettings.randomMessageInterval);
        }
    });
    bot.on('chat', async (username, message) => {
        if (username === bot.username)
            return;
        console.log(`<${username}> ${message}`);
        if (message.toLowerCase().startsWith(config_1.config.botSettings.chatPrefix.toLowerCase())) {
            const command = message.substring(config_1.config.botSettings.chatPrefix.length).trim().toLowerCase();
            if (command === 'help') {
                bot.chat(`Hi ${username}! I'm Suva. You can chat with me by starting your message with "${config_1.config.botSettings.chatPrefix}". For example: "${config_1.config.botSettings.chatPrefix} how are you?"`);
            }
            else if (command === 'ping') {
                bot.chat(`Pong, ${username}! My ping is currently ${bot.player?.ping || 'unknown'}ms.`);
            }
            else if (config_1.config.gemini.apiKey) {
                const response = await (0, ai_1.getChatResponse)(username, message);
                if (response) {
                    bot.chat(response);
                }
            }
            else {
                if (command === 'how are you') {
                    bot.chat(`I'm doing well, ${username}! Just a bit limited without my AI brain fully connected.`);
                }
                else {
                    bot.chat(`I'm here, ${username}, but my advanced AI features are offline. You can still ask me for 'help' or 'ping'.`);
                }
            }
        }
    });
    bot.on('kicked', (reason, loggedIn) => {
        console.error(`Suva was kicked for: ${reason} (loggedIn: ${loggedIn})`);
        console.log('Attempting to reconnect in 30 seconds...');
        setTimeout(createAndAssignBot, 30000);
    });
    bot.on('error', (err) => {
        console.error('Bot encountered an error:', err);
        if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT') || err.message.includes('ECONNRESET')) {
            console.log('Connection error. Attempting to reconnect in 60 seconds...');
            setTimeout(createAndAssignBot, 60000);
        }
    });
    bot.on('end', (reason) => {
        console.log(`Bot disconnected. Reason: ${reason}. Attempting to reconnect in 30 seconds...`);
        setTimeout(createAndAssignBot, 30000);
    });
    let lastPosition = bot.entity?.position.clone();
    let stuckCounter = 0;
    setInterval(() => {
        if (bot.entity && lastPosition) {
            if (bot.entity.position.distanceTo(lastPosition) < 0.1) {
                stuckCounter++;
                if (stuckCounter > 5) {
                    console.log("[Anti-Stuck] Attempting to unstick by jumping.");
                    bot.jump();
                    stuckCounter = 0;
                }
            }
            else {
                stuckCounter = 0;
            }
            lastPosition = bot.entity.position.clone();
        }
        else if (bot.entity) {
            lastPosition = bot.entity.position.clone();
        }
    }, 1000);
}
// Start the bot
createAndAssignBot();
