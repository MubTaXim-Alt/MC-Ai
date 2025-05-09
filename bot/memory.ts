// bot/memory.ts
let recentBotActions: string[] = [];
const MAX_ACTIONS_IN_MEMORY = 3; // Store the last 3 actions

/**
 * Records a description of an action the bot just took.
 * @param actionDescription A brief description of the action, e.g., "jumped", "looked around".
 */
export function recordBotAction(actionDescription: string): void {
  recentBotActions.push(actionDescription);
  if (recentBotActions.length > MAX_ACTIONS_IN_MEMORY) {
    recentBotActions.shift(); // Remove the oldest action
  }
}

/**
 * Gets a summary of recent bot actions.
 * @returns A string summarizing recent actions, or null if no actions are recorded.
 *          Example: "involved in activities such as: jumping, looking around"
 */
export function getRecentBotActionsSummary(): string | null {
  if (recentBotActions.length === 0) {
    return null;
  }
  return `involved in activities such as: ${recentBotActions.join(', ')}`;
}

/**
 * Clears all recorded bot actions from memory.
 */
export function clearRecentBotActions(): void {
  recentBotActions = [];
}
