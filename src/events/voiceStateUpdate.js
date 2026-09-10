const { Events } = require('discord.js');
const { handleVoiceStateChange } = require('../services/activityService');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        await handleVoiceStateChange(oldState, newState);
    }
};
