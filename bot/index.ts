import mineflayer from 'mineflayer';
import { config } from './config.js';
import { initAntiAfk } from './actions.js';
import { getChatResponse, initPeriodicAiMessages, stopPeriodicAiMessages } from './ai.js';
import { recordBotAction, clearRecentBotActions } from './memory.js';
import { clearAllPlayerMemory } from './playerMemory.js';

console.log('Starting Suva Bot...');

// Store the original username from config to use as a base
const baseUsername = config.minecraft.username;
let usernameSuffix = 0; // Start with 0, so first username is baseUsername, then baseUsername1, etc.

const botOptions: mineflayer.BotOptions = {
  host: config.minecraft.host,
  port: config.minecraft.port,
  username: '', // This will be set dynamically in createBotInstance
  password: config.minecraft.password,
  auth: config.minecraft.auth,
  version: typeof config.minecraft.version === 'string' ? config.minecraft.version : undefined,
  checkTimeoutInterval: 60 * 1000,
  defaultChatPatterns: true,
};

let mineflayer_bot: mineflayer.Bot | null = null;

function createBotInstance() {
  // Dynamically set the username for this connection attempt
  const currentUsername = usernameSuffix === 0 ? baseUsername : `${baseUsername}${usernameSuffix}`;
  botOptions.username = currentUsername; // Update the username in botOptions

  console.log(`Attempting to connect as ${botOptions.username}...`);
  const bot = mineflayer.createBot(botOptions);
  mineflayer_bot = bot;

  bot.on('login', () => {
    // bot.username will reflect the actual username used for login
    console.log(`Suva (as ${bot.username}) logged in to ${config.minecraft.host}:${config.minecraft.port}`);
    bot.chat(`Suva (as ${bot.username}) is online! Hello everyone! Type "${config.botSettings.chatPrefix} help" for assistance.`);
    
    clearRecentBotActions(); 
    clearAllPlayerMemory();
    initAntiAfk(bot, config.botSettings.antiAfkInterval);
    if (config.gemini.apiKey && config.gemini.apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && config.gemini.apiKey !== 'AIzaSyBoJwR_EXgX60irvbPAtCO1_YMxAoXIftM') {
      initPeriodicAiMessages(bot);
    }
  });

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;

    console.log(`<${username}> ${message}`);

    if (message.toLowerCase().startsWith(config.botSettings.chatPrefix.toLowerCase())) {
      const args = message.substring(config.botSettings.chatPrefix.length).trim().split(/\s+/);
      const command = args.shift()?.toLowerCase();
      
      if (command === 'help') {
        bot.chat(`Hi ${username}! I'm Suva (currently ${bot.username}). You can chat with me by starting your message with "${config.botSettings.chatPrefix}". For example: "${config.botSettings.chatPrefix} how are you?"`);
      } else if (command === 'ping') {
        bot.chat(`Pong, ${username}! My (as ${bot.username}) ping is currently ${bot.player?.ping ?? 'unknown'}ms.`);
      } else {
        if (config.gemini.apiKey && config.gemini.apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && config.gemini.apiKey !== 'AIzaSyBoJwR_EXgX60irvbPAtCO1_YMxAoXIftM') {
          const response = await getChatResponse(bot, username, message);
          if (response) {
            bot.chat(response);
          }
        } else {
           if (command === 'how' && args[0] === 'are' && args[1] === 'you') {
              bot.chat(`I'm doing well, ${username}! Just a bit limited without my AI brain fully connected.`);
           } else {
              bot.chat(`I'm here, ${username}, but my advanced AI features are offline. You can still ask me for 'help' or 'ping'.`);
           }
        }
      }
    }
  });

  bot.on('kicked', (reason, loggedIn) => {
    // botOptions.username reflects the name used for the connection attempt that got kicked
    console.error(`Bot (${botOptions.username}) was kicked. Reason: ${JSON.stringify(reason)}. LoggedIn: ${loggedIn}`);
    stopPeriodicAiMessages();
    
    let kickReasonString = "";
    if (typeof reason === 'string') {
        kickReasonString = reason;
    } else if (reason && typeof reason.toString === 'function') {
        // Handles Mineflayer's ChatMessage object
        kickReasonString = reason.toString();
    } else {
        // Fallback for other types, though typically it's a string or ChatMessage
        kickReasonString = JSON.stringify(reason);
    }

    const isIdleBan = kickReasonString.toLowerCase().includes("banned") && 
                      kickReasonString.toLowerCase().includes("idle for too long");

    if (isIdleBan) {
      usernameSuffix++;
      console.log(`Bot was banned for idling. Will attempt to rejoin as ${baseUsername}${usernameSuffix} in 30 seconds...`);
    } else {
      console.log(`Bot was kicked for a non-idle reason. Will attempt to reconnect in 30 seconds (using username: ${baseUsername}${usernameSuffix > 0 ? usernameSuffix : ''})...`);
    }
    setTimeout(createBotInstance, 30000); // 30 seconds reconnect delay
  });

  bot.on('error', (err) => {
    console.error(`Bot (${botOptions.username}) encountered an error:`, err);
    stopPeriodicAiMessages();
    const nextAttemptUsername = usernameSuffix === 0 ? baseUsername : `${baseUsername}${usernameSuffix}`;
    console.log(`Connection error or other bot error. Attempting to reconnect in 60 seconds (will use username: ${nextAttemptUsername})...`);
    setTimeout(createBotInstance, 60000); // 60 seconds for general errors
  });

  bot.on('end', (reason) => {
    console.log(`Bot (${botOptions.username}) disconnected. Reason: ${reason}.`);
    stopPeriodicAiMessages();
    const nextAttemptUsername = usernameSuffix === 0 ? baseUsername : `${baseUsername}${usernameSuffix}`;
    console.log(`Attempting to reconnect in 30 seconds (will use username: ${nextAttemptUsername})...`);
    setTimeout(createBotInstance, 30000); // 30 seconds for general disconnects
  });
  
  let lastPosition = bot.entity?.position.clone();
  let stuckCounter = 0;
  const antiStuckInterval = setInterval(() => {
    if (!bot.entity || !bot.entity.position) return;

    if (lastPosition) {
      if (bot.entity.position.distanceTo(lastPosition) < 0.1) {
        stuckCounter++;
        if (stuckCounter > 5) { 
          console.log(`[Anti-Stuck @ ${bot.username || botOptions.username}] Attempting to unstick by jumping.`);
          bot.setControlState('jump', true);
          recordBotAction("trying to unstick by jumping");
          setTimeout(() => bot.setControlState('jump', false), 200);
          stuckCounter = 0; 
        }
      } else {
        stuckCounter = 0; 
      }
    }
    lastPosition = bot.entity.position.clone();
  }, 1000); 

  bot.once('end', () => {
    clearInterval(antiStuckInterval);
    // stopPeriodicAiMessages(); // Already called in the 'end' handler
  });
}

// Initial call to start the bot
createBotInstance();

process.on('SIGINT', () => {
  console.log("Caught interrupt signal, disconnecting bot...");
  if (mineflayer_bot) {
    stopPeriodicAiMessages();
    mineflayer_bot.quit("Shutting down");
  }
  process.exit(0);
});
