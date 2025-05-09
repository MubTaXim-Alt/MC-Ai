"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAntiAfk = initAntiAfk;
function initAntiAfk(bot, interval) {
    setInterval(() => {
        performRandomAction(bot);
    }, interval);
}
function performRandomAction(bot) {
    if (!bot.entity)
        return;
    const actions = [
        () => {
            bot.jump();
            console.log('[Anti-AFK] Jumped');
        },
        () => {
            const yaw = Math.random() * Math.PI * 2;
            const pitch = (Math.random() * Math.PI) - (Math.PI / 2);
            bot.look(yaw, pitch, false);
            console.log('[Anti-AFK] Looked around');
        },
        () => {
            bot.setControlState('forward', true);
            setTimeout(() => bot.setControlState('forward', false), 500 + Math.random() * 500);
            console.log('[Anti-AFK] Moved forward');
        },
        () => {
            bot.setControlState('back', true);
            setTimeout(() => bot.setControlState('back', false), 500 + Math.random() * 500);
            console.log('[Anti-AFK] Moved backward');
        },
        () => {
            bot.setControlState('left', true);
            setTimeout(() => bot.setControlState('left', false), 300 + Math.random() * 300);
            console.log('[Anti-AFK] Strafed left');
        },
        () => {
            bot.setControlState('right', true);
            setTimeout(() => bot.setControlState('right', false), 300 + Math.random() * 300);
            console.log('[Anti-AFK] Strafed right');
        },
    ];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    try {
        randomAction();
    }
    catch (error) {
        console.error('[Anti-AFK] Error performing action:', error);
    }
}
