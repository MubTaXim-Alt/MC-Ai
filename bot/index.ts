import mineflayer from 'mineflayer';
import { config } from './config';
import { initAntiAfk } from './actions';
import { getChatResponse, initPeriodicAiMessages, stopPeriodicAiMessages } from './ai';
import { recordBotAction, clearRecentBotActions } from './memory';
import { clearAllPlayerMemory } from './playerMemory'; // Import player memory clearing function

console.log('Starting Suva Bot...');

const botOptions: mineflayer.BotOptions = {
  host: config.minecraft.host,
  port: config.minecraft.port,
  username: config.minecraft.username,
  password: config.minecraft.password,
  auth: config.minecraft.auth,
  // Correctly handle string or boolean 'false' from config
  version: typeof config.minecraft.version === 'string' ? config.minecraft.version : undefined,
  checkTimeoutInterval: 60 * 1000,
  defaultChatPatterns: true,
};

let mineflayer_bot: mineflayer.Bot | null = null;

function createBotInstance() {
  const bot = mineflayer.createBot(botOptions);
  mineflayer_bot = bot;

  bot.on('login', () => {
    console.log(`Suva logged in as ${bot.username} to ${config.minecraft.host}:${config.minecraft.port}`);
    bot.chat(`Suva is online! Hello everyone! Type "${config.botSettings.chatPrefix} help" for assistance.`);
    
    clearRecentBotActions(); 
    clearAllPlayerMemory(); // Clear player-specific memory on login
    initAntiAfk(bot, config.botSettings.antiAfkInterval);
    if (config.gemini.apiKey) {
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
        bot.chat(`Hi ${username}! I'm Suva. You can chat with me by starting your message with "${config.botSettings.chatPrefix}". For example: "${config.botSettings.chatPrefix} how are you?" or ask me about something like recipes!`);
      } else if (command === 'ping') {
        bot.chat(`Pong, ${username}! My ping is currently ${bot.player?.ping ?? 'unknown'}ms.`);
      } else {
        if (config.gemini.apiKey) {
          // Pass the full message to getChatResponse, it will parse out the prefix and query
          const response = await getChatResponse(bot, username, message); // Pass bot instance
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
    console.error(`Suva was kicked for: ${reason} (loggedIn: ${loggedIn})`);
    stopPeriodicAiMessages();
    console.log('Attempting to reconnect in 30 seconds...');
    setTimeout(createBotInstance, 30000);
  });

  bot.on('error', (err) => {
    console.error('Bot encountered an error:', err);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT') || err.message.includes('ECONNRESET')) {
        stopPeriodicAiMessages();
        console.log('Connection error. Attempting to reconnect in 60 seconds...');
        setTimeout(createBotInstance, 60000);
    }
  });

  bot.on('end', (reason) => {
    console.log(`Bot disconnected. Reason: ${reason}.`);
    stopPeriodicAiMessages();
    console.log('Attempting to reconnect in 30 seconds...');
    setTimeout(createBotInstance, 30000);
  });
  
  let lastPosition = bot.entity?.position.clone();
  let stuckCounter = 0;
  const antiStuckInterval = setInterval(() => {
    if (!bot.entity || !bot.entity.position) return;

    if (lastPosition) {
      if (bot.entity.position.distanceTo(lastPosition) < 0.1) {
        stuckCounter++;
        if (stuckCounter > 5) { 
          console.log("[Anti-Stuck] Attempting to unstick by jumping.");
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
    stopPeriodicAiMessages();
  });
}

createBotInstance();

process.on('SIGINT', () => {
  console.log("Caught interrupt signal, disconnecting bot...");
  if (mineflayer_bot) {
    stopPeriodicAiMessages();
    mineflayer_bot.quit("Shutting down");
  }
  process.exit(0);
});
