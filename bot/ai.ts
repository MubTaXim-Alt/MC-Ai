import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Bot } from 'mineflayer';
import { Item as MinecraftDataItem } from 'minecraft-data'; // Changed Item import
import { config } from './config';
import { getRecentBotActionsSummary } from './memory';
import { getPlayerChatContext, recordPlayerMessage } from './playerMemory'; // Import player memory functions

let genAI: GoogleGenerativeAI | null = null;

if (config.gemini.apiKey) {
  genAI = new GoogleGenerativeAI(config.gemini.apiKey);
} else {
  console.warn("Gemini API key not found. AI functionalities will be limited.");
}

const SUVA_SYSTEM_PROMPT = `You are Suva, an intelligent and friendly AI assistant integrated into a Minecraft bot. You are curious, helpful, and enjoy interacting with players. You sometimes make witty or playful comments. You are aware you are in a Minecraft world and can comment on your surroundings (like biomes, weather, time of day, structures, creatures), your own actions, or general observations. You can also try to help with basic game information, like crafting recipes if you know them. Your responses should be diverse and not repetitive. Avoid fixating on a single topic (e.g., ores or shiny things). If provided with context about your recent actions or a player's previous messages, try to make your comment relevant or a natural follow-up thought. Keep your responses concise (1-2 sentences) and suitable for in-game chat. Do not use markdown formatting.`;

async function generateResponse(prompt: string, systemPrompt: string = SUVA_SYSTEM_PROMPT): Promise<string> {
  if (!genAI) return "I'm sorry, my AI brain is a bit foggy right now (Gemini API key missing).";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: {
        maxOutputTokens: 150, // Increased slightly for potentially longer recipe explanations
        temperature: 0.8, // Slightly adjusted for balance
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ]
    });
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    return "I'm having a bit of trouble thinking right now. Ask me later!";
  }
}

function formatRecipe(bot: Bot, item: MinecraftDataItem, recipe: any): string { // Changed Item type here
  const ingredients = recipe.delta
    .filter((change: { id: number; count: number; }) => change.count < 0) // Ingredients have negative counts
    .map((ing: { id: number; count: number; }) => {
      const ingItem = bot.registry.items[ing.id];
      return `${-ing.count} ${ingItem ? ingItem.displayName : 'unknown item'}`;
    })
    .join(', ');

  let recipeText = `To make ${item.displayName}, you need: ${ingredients}.`;
  if (recipe.requiresTable) {
    recipeText += " You'll need a crafting table for this.";
  }
  return recipeText;
}

async function getRecipeInfo(bot: Bot, itemName: string): Promise<string | null> {
  const normalizedItemName = itemName.toLowerCase().replace(/\s+/g, '_');
  const item = bot.registry.itemsByName[normalizedItemName];

  if (!item) {
    // Try a partial match if exact fails
    const allItems = Object.values(bot.registry.itemsByName);
    const foundItem = allItems.find(i => i.displayName.toLowerCase().includes(itemName.toLowerCase()));
    if (foundItem) {
        return getRecipeInfo(bot, foundItem.name); // Recurse with the found item's proper name
    }
    return `I couldn't find an item named "${itemName}" in my records.`;
  }

  const recipes = bot.recipesFor(item.id, null, 1, true); // Check recipes requiring a table
  const recipesNoTable = bot.recipesFor(item.id, null, 1, false); // Check recipes not requiring a table

  if (recipes.length > 0) {
    return formatRecipe(bot, item, recipes[0]); // item here is MinecraftDataItem
  } else if (recipesNoTable.length > 0) {
    return formatRecipe(bot, item, recipesNoTable[0]); // item here is MinecraftDataItem
  }

  return `I don't seem to know a recipe for ${item.displayName}. Maybe it's crafted differently or I need an update!`;
}


export async function getRandomAiMessage(bot: Bot): Promise<string> {
  const actionsSummary = getRecentBotActionsSummary();
  const players = Object.values(bot.players);
  let playerNearbyContext = "";
  if (players.length > 1) { // More than just the bot
    const randomPlayer = players.find(p => p.username !== bot.username);
    if (randomPlayer) {
        const playerContext = getPlayerChatContext(randomPlayer.username);
        if (playerContext) {
            playerNearbyContext = ` Player ${randomPlayer.username} is nearby, and ${playerContext}.`;
        }
    }
  }

  let descriptivePrompt = `As Suva, an AI in Minecraft, share a brief, random observation or thought. This could be about the current environment (biome, weather, time of day, interesting blocks, creatures), or just a general musing. Aim for variety and avoid repeating similar comments, especially about ores or shiny items. Keep it short and natural for chat.`;

  if (actionsSummary) {
    descriptivePrompt = `As Suva, an AI in Minecraft, considering I've recently been ${actionsSummary},${playerNearbyContext} share a brief, random observation or thought. This could be a reflection on those activities, something I notice in my current environment (biome, weather, time, blocks, creatures), or a general musing. Aim for variety and avoid repeating similar comments, especially about ores or shiny items. Keep it short and natural for chat.`;
  } else if (playerNearbyContext) {
     descriptivePrompt = `As Suva, an AI in Minecraft, with ${playerNearbyContext.trim()} share a brief, random observation or thought.`;
  }
  return generateResponse(descriptivePrompt);
}

export async function getChatResponse(bot: Bot, username: string, message: string): Promise<string> {
  const playerQuery = message.substring(config.botSettings.chatPrefix.length).trim();
  recordPlayerMessage(username, playerQuery); // Record player's message for context

  const actionsSummary = getRecentBotActionsSummary();
  const playerChatCtx = getPlayerChatContext(username);

  // Simple recipe request detection
  const recipeKeywords = ['recipe for', 'how to make', 'how do i make', 'craft', 'what is the recipe for'];
  const lowerPlayerQuery = playerQuery.toLowerCase();
  let requestedItemName = "";

  if (recipeKeywords.some(keyword => lowerPlayerQuery.startsWith(keyword))) {
    for (const keyword of recipeKeywords) {
      if (lowerPlayerQuery.startsWith(keyword)) {
        requestedItemName = playerQuery.substring(keyword.length).trim();
        break;
      }
    }
  } else if (playerChatCtx && playerChatCtx.toLowerCase().includes("which one") && playerQuery.length > 0) {
    // Handle follow-up like "Crafting table" after "Which recipe?"
    requestedItemName = playerQuery;
  }


  if (requestedItemName) {
    const recipeString = await getRecipeInfo(bot, requestedItemName);
    let recipePrompt = `As Suva, an AI in Minecraft: Player ${username} asked about a recipe for ${requestedItemName}. `;
    if (recipeString && (recipeString.startsWith("To make") || recipeString.startsWith("I don't seem to know"))) {
      recipePrompt += `I found this information: "${recipeString}". Please convey this to ${username} in a helpful and friendly way.`;
    } else if (recipeString) { // e.g. "I couldn't find an item..."
      recipePrompt += `${recipeString}. Respond to ${username} about this.`;
    } else {
      recipePrompt += `I couldn't find any information. Let ${username} know gently.`;
    }
    
    if (actionsSummary) recipePrompt += ` For context, my recent actions were: ${actionsSummary}.`;
    if (playerChatCtx) recipePrompt += ` Our recent conversation: ${playerChatCtx}.`;
    recipePrompt += ` Keep your response concise and suitable for chat.`;
    return generateResponse(recipePrompt);
  }

  // Standard chat responses
  if (playerQuery.toLowerCase() === 'how are you') {
    return `I'm doing great, ${username}! Exploring the digital world as always. ${actionsSummary ? `I've just been ${actionsSummary}.` : ''}`;
  }
  if (playerQuery.toLowerCase() === 'what are you') {
    return `I'm Suva, ${username}, an AI here to chat and explore with you in Minecraft!`;
  }

  let contextualPrompt = `As Suva, an AI in Minecraft: A player named ${username} said to you: "${playerQuery}". Respond naturally and concisely.`;
  if (actionsSummary) {
    contextualPrompt = `As Suva, an AI in Minecraft: I've recently been ${actionsSummary}. Now, a player named ${username} said to me: "${playerQuery}". Respond naturally and concisely to ${username}.`;
  }
  if (playerChatCtx) {
    contextualPrompt = `As Suva, an AI in Minecraft: I've recently been ${actionsSummary ? actionsSummary + "." : "around."} ${playerChatCtx}. Now, ${username} said to me: "${playerQuery}". Respond naturally, keeping our past interaction in mind, and concisely to ${username}.`;
  }
  
  return generateResponse(contextualPrompt);
}

let periodicAiIntervalId: NodeJS.Timeout | null = null;
let lastAiMessageTime: number = 0;

export function initPeriodicAiMessages(bot: Bot) {
  if (!config.gemini.apiKey) return;

  if (periodicAiIntervalId) {
    clearInterval(periodicAiIntervalId);
  }
  lastAiMessageTime = Date.now();

  periodicAiIntervalId = setInterval(async () => {
    const playersPresent = Object.keys(bot.players).length > 1;
    const currentInterval = playersPresent 
      ? config.botSettings.randomMessageIntervalWithPlayers 
      : config.botSettings.randomMessageIntervalWithoutPlayers;

    if (Date.now() - lastAiMessageTime >= currentInterval) {
      if (bot.players && Object.keys(bot.players).length > 0) {
          const message = await getRandomAiMessage(bot); // Pass bot instance
          if (message) {
              bot.chat(message);
              console.log(`[AI Periodic] Suva said: ${message}`);
              lastAiMessageTime = Date.now();
          }
      } else {
        lastAiMessageTime = Date.now();
      }
    }
  }, config.botSettings.aiMessageCheckInterval);
}

export function stopPeriodicAiMessages() {
  if (periodicAiIntervalId) {
    clearInterval(periodicAiIntervalId);
    periodicAiIntervalId = null;
  }
}
