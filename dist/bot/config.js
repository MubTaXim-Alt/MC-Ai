"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    minecraft: {
        host: process.env.MC_HOST || 'localhost',
        port: parseInt(process.env.MC_PORT || '25565', 10),
        username: process.env.MC_USERNAME || 'SuvaBot',
        password: process.env.MC_PASSWORD, // Can be undefined for offline mode or if auth is 'microsoft'
        auth: process.env.MC_AUTH, // Cast for safety
        version: process.env.MC_VERSION || false,
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
    },
    botSettings: {
        chatPrefix: 'Suva',
        randomMessageInterval: 5 * 60 * 1000, // 5 minutes
        antiAfkInterval: 45 * 1000, // 45 seconds
    },
};
if (!exports.config.gemini.apiKey) {
    console.warn('[WARNING] GEMINI_API_KEY is not set. AI features will be disabled.');
}
if (!process.env.MC_HOST) {
    console.warn('[WARNING] MC_HOST is not set. Bot will try to connect to localhost.');
}
if (!process.env.MC_USERNAME) {
    console.warn('[WARNING] MC_USERNAME is not set. Bot will use "SuvaBot" as username.');
}
