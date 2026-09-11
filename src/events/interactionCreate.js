const { Events } = require('discord.js');
const {
    getVoiceLeaderboard,
    getMessageLeaderboard,
    buildVoiceLeaderboardEmbed,
    buildMessageLeaderboardEmbed,
    buildOverviewLeaderboardEmbed,
    createLeaderboardButtons
} = require('../services/leaderboardService');
const { buildPanel } = require('../utils/panelBuilder');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // 1. Handle Slash Commands
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
                    content: `❌ An internal error occurred while executing this command.`,
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

        // 2. Handle Dropdown Select Menus
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'panel_select') {
                const selectedTab = interaction.values[0] || 'home';
                const panelPayload = await buildPanel(selectedTab, interaction.client, interaction);
                return await interaction.update(panelPayload).catch(() => {});
            }
        }

        // 3. Handle Buttons
        if (interaction.isButton()) {
            const customId = interaction.customId;

            // Delete button (Red Trash Icon)
            if (customId === 'panel_btn_delete') {
                return await interaction.message.delete().catch(() => {});
            }

            // Panel navigation buttons
            if (customId.startsWith('panel_btn_')) {
                const tab = customId.replace('panel_btn_', '');
                const panelPayload = await buildPanel(tab, interaction.client, interaction);
                return await interaction.update(panelPayload).catch(() => {});
            }

            // Leaderboard tab buttons
            if (['lb_voice', 'lb_messages', 'lb_overview'].includes(customId)) {
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

                return await interaction.update({
                    embeds: [embed],
                    components: [buttons]
                }).catch(() => {});
            }
        }
    }
};
