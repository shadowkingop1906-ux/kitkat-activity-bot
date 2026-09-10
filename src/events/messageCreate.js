const { Events } = require('discord.js');
const { recordMessage } = require('../services/activityService');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Discard messages from bots, system, webhooks, or direct messages
        if (!message.guild || message.author.bot || message.system || message.webhookId) {
            return;
        }

        // Record message count in database
        await recordMessage(message.guild.id, message.author.id);
    }
};
