import dotenv from 'dotenv';
dotenv.config();

export const config = {
  minecraft: {
    host: process.env.MC_HOST || 'localhost',
    port: parseInt(process.env.MC_PORT || '25565', 10),
    username: process.env.MC_USERNAME || 'Suva',
    password: process.env.MC_PASSWORD, // Can be undefined for offline mode
    auth: process.env.MC_PASSWORD ? (process.env.MC_AUTH as 'mojang' | 'microsoft' | undefined) : undefined, // Only set auth if password is provided
    version: process.env.MC_VERSION || false,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyBoJwR_EXgX60irvbPAtCO1_YMxAoXIftM',
  },
  botSettings: {
    chatPrefix: '!',
    randomMessageIntervalWithPlayers: 10 * 60 * 1000, // 10 minutes
    randomMessageIntervalWithoutPlayers: 3 * 60 * 1000, // 3 minutes
    aiMessageCheckInterval: 30 * 1000, // How often to check if it's time for an AI message (e.g., every 30 seconds)
    antiAfkInterval: 7 * 1000, // 7 seconds
  },
};

if (!config.gemini.apiKey || config.gemini.apiKey === 'YOUR_GEMINI_API_KEY_HERE' || config.gemini.apiKey === 'AIzaSyBoJwR_EXgX60irvbPAtCO1_YMxAoXIftM') {
  if (!config.gemini.apiKey) {
    console.warn('[WARNING] GEMINI_API_KEY is not set. AI features will be disabled.');
  } else if (config.gemini.apiKey === 'AIzaSyBoJwR_EXgX60irvbPAtCO1_YMxAoXIftM') {
    console.info('[INFO] Using the provided placeholder Gemini API Key. Ensure this is intended.');
  }
}

if (!process.env.MC_HOST || process.env.MC_HOST === "your_server_address_here") {
  console.warn('[CRITICAL] MC_HOST is not set or is still the placeholder "your_server_address_here" in .env. Please update it for the bot to connect!');
}

if (!process.env.MC_USERNAME || process.env.MC_USERNAME === "SuvaBot_Offline") {
  if (process.env.MC_USERNAME === "SuvaBot_Offline") {
    console.warn('[INFO] Using default offline username "SuvaBot_Offline". Ensure MC_HOST and MC_PORT are correctly set for your offline server.');
  } else {
    console.warn('[WARNING] MC_USERNAME is not set in .env. Bot will use "Suva" or the default placeholder. Please set it for clarity.');
  }
}

if (config.minecraft.username === 'SuvaBot_Offline' && !config.minecraft.password && !config.minecraft.auth) {
    console.warn('[INFO] Bot is configured for offline mode with default username "SuvaBot_Offline". Ensure MC_HOST and MC_PORT are correctly set for your offline server.');
}
