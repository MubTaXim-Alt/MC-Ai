import { Bot } from 'mineflayer';
import { recordBotAction } from './memory'; // Import memory function

export function initAntiAfk(bot: Bot, interval: number) {
  setInterval(() => {
    performRandomAction(bot);
  }, interval);
}

function performRandomAction(bot: Bot) {
  if (!bot.entity) return;

  const actions = [
    () => {
      // Use setControlState for jumping, similar to anti-stuck
      bot.setControlState('jump', true);
      console.log('[Anti-AFK] Started jump');
      recordBotAction("jumping");
      // Release jump after a short delay
      setTimeout(() => {
        if (bot && bot.controlState) { // Check if bot and controlState still exist
            bot.setControlState('jump', false);
            console.log('[Anti-AFK] Ended jump');
        }
      }, 200); // Jump for 200ms
    },
    () => {
      const yaw = Math.random() * Math.PI * 2;
      const pitch = (Math.random() * Math.PI) - (Math.PI / 2);
      bot.look(yaw, pitch, false);
      console.log('[Anti-AFK] Looked around');
      recordBotAction("looking around");
    },
    () => {
      bot.setControlState('forward', true);
      setTimeout(() => {
        if (bot && bot.controlState) {
            bot.setControlState('forward', false);
        }
      }, 500 + Math.random() * 500);
      console.log('[Anti-AFK] Moved forward');
      recordBotAction("moving forward");
    },
    () => {
      bot.setControlState('back', true);
      setTimeout(() => {
        if (bot && bot.controlState) {
            bot.setControlState('back', false);
        }
      }, 500 + Math.random() * 500);
      console.log('[Anti-AFK] Moved backward');
      recordBotAction("moving backward");
    },
    () => {
      bot.setControlState('left', true);
      setTimeout(() => {
        if (bot && bot.controlState) {
            bot.setControlState('left', false);
        }
      }, 300 + Math.random() * 300);
      console.log('[Anti-AFK] Strafed left');
      recordBotAction("strafing left");
    },
    () => {
      bot.setControlState('right', true);
      setTimeout(() => {
        if (bot && bot.controlState) {
            bot.setControlState('right', false);
        }
      }, 300 + Math.random() * 300);
      console.log('[Anti-AFK] Strafed right');
      recordBotAction("strafing right");
    },
  ];

  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  try {
    randomAction();
  } catch (error) {
    console.error('[Anti-AFK] Error performing action:', error);
  }
}
