// bot/playerMemory.ts

interface PlayerChatEntry {
  message: string;
  timestamp: number;
}

interface PlayerMemory {
  lastMessages: PlayerChatEntry[];
}

const playerMemoryStore = new Map<string, PlayerMemory>();
const MAX_PLAYER_MESSAGES = 3; // Remember the last 3 messages from a player
const PLAYER_MEMORY_TIMEOUT = 15 * 60 * 1000; // Forget player-specific context after 15 minutes of inactivity

/**
 * Records a message sent by a player.
 */
export function recordPlayerMessage(username: string, message: string): void {
  if (!playerMemoryStore.has(username)) {
    playerMemoryStore.set(username, { lastMessages: [] });
  }
  const playerData = playerMemoryStore.get(username)!;
  playerData.lastMessages.push({ message, timestamp: Date.now() });
  if (playerData.lastMessages.length > MAX_PLAYER_MESSAGES) {
    playerData.lastMessages.shift(); // Remove the oldest message
  }
}

/**
 * Gets a summarized context of recent messages from a specific player.
 * Filters out messages older than PLAYER_MEMORY_TIMEOUT.
 * @returns A string summarizing recent messages, or null if no relevant recent messages.
 */
export function getPlayerChatContext(username: string): string | null {
  const playerData = playerMemoryStore.get(username);
  if (!playerData || playerData.lastMessages.length === 0) {
    return null;
  }

  const now = Date.now();
  const recentMessages = playerData.lastMessages
    .filter(entry => (now - entry.timestamp) < PLAYER_MEMORY_TIMEOUT)
    .map(entry => entry.message);

  if (recentMessages.length === 0) {
    // Clean up if all messages are too old
    playerMemoryStore.delete(username);
    return null;
  }
  // Update the stored messages to only include recent ones
  playerData.lastMessages = playerData.lastMessages.filter(entry => (now - entry.timestamp) < PLAYER_MEMORY_TIMEOUT);


  if (recentMessages.length > 0) {
    return `Our recent conversation involved you saying: "${recentMessages.join('; ')}"`;
  }
  return null;
}

/**
 * Clears all recorded player chat history.
 */
export function clearAllPlayerMemory(): void {
  playerMemoryStore.clear();
  console.log('[Memory] All player-specific chat memory cleared.');
}

// Periodically clean up old player memory entries
setInterval(() => {
  const now = Date.now();
  for (const [username, data] of playerMemoryStore.entries()) {
    data.lastMessages = data.lastMessages.filter(entry => (now - entry.timestamp) < PLAYER_MEMORY_TIMEOUT);
    if (data.lastMessages.length === 0) {
      playerMemoryStore.delete(username);
      console.log(`[Memory] Cleared stale memory for player ${username}.`);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes
