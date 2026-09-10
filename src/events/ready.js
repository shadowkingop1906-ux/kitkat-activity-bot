const { Events, ActivityType, Routes } = require('discord.js');
const { config } = require('../config/env');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`[ SYSTEM // ONLINE ] Bot initialized as ${client.user.tag}`);

        // Set rich presence
        client.user.setPresence({
            activities: [
                {
                    name: 'Activity Telemetry ◈ /stats',
                    type: ActivityType.Custom
                }
            ],
            status: 'online'
        });

        // Register Slash Commands with Discord REST API
        try {
            const commandsData = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());

            if (config.guildId) {
                console.log(`[ REST // REGISTER ] Registering ${commandsData.length} command(s) for guild ${config.guildId}...`);
                await client.rest.put(
                    Routes.applicationGuildCommands(config.clientId, config.guildId),
                    { body: commandsData }
                );
                console.log(`[ REST // SUCCESS ] Guild commands registered successfully.`);
            } else {
                console.log(`[ REST // REGISTER ] Registering ${commandsData.length} global command(s)...`);
                await client.rest.put(
                    Routes.applicationCommands(config.clientId),
                    { body: commandsData }
                );
                console.log(`[ REST // SUCCESS ] Global slash commands registered.`);
            }
        } catch (error) {
            console.error('[ REST // ERROR ] Failed to register slash commands:', error.message);
        }
    }
};
