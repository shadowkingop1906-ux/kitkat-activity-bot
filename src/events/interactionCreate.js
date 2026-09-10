const { Events } = require('discord.js');
const {
    getVoiceLeaderboard,
    getMessageLeaderboard,
    buildVoiceLeaderboardEmbed,
    buildMessageLeaderboardEmbed,
    buildOverviewLeaderboardEmbed,
    createLeaderboardButtons
} = require('../services/leaderboardService');
const { Symbols } = require('../config/symbols');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.warn(`[ INTERACTION // WARNING ] No command handler for ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`[ INTERACTION // ERROR ] Error executing ${interaction.commandName}:`, error);
                const replyPayload = {
                    content: `${Symbols.cross} An internal error occurred while executing this command.`,
                    ephemeral: true
                };

                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp(replyPayload).catch(() => {});
                } else {
                    await interaction.reply(replyPayload).catch(() => {});
                }
            }
            return;
        }

        // Handle Interactive Leaderboard Tab Buttons
        if (interaction.isButton()) {
            const customId = interaction.customId;
            if (!['lb_voice', 'lb_messages', 'lb_overview'].includes(customId)) {
                return;
            }

            const guildId = interaction.guild.id;
            const guildName = interaction.guild.name;

            let embed;
            let activeCategory;

            if (customId === 'lb_voice') {
                activeCategory = 'voice';
                const list = await getVoiceLeaderboard(guildId, 10);
                embed = buildVoiceLeaderboardEmbed(guildName, list);
            } else if (customId === 'lb_messages') {
                activeCategory = 'messages';
                const list = await getMessageLeaderboard(guildId, 10);
                embed = buildMessageLeaderboardEmbed(guildName, list);
            } else {
                activeCategory = 'overview';
                const voiceList = await getVoiceLeaderboard(guildId, 3);
                const msgList = await getMessageLeaderboard(guildId, 3);
                embed = buildOverviewLeaderboardEmbed(guildName, voiceList, msgList);
            }

            const buttons = createLeaderboardButtons(activeCategory);

            await interaction.update({
                embeds: [embed],
                components: [buttons]
            }).catch(() => {});
        }
    }
};
