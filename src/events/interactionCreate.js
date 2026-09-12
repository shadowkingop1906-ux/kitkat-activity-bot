const { Events } = require('discord.js');
const {
    getVoiceLeaderboard,
    getMessageLeaderboard,
    buildVoiceLeaderboardEmbed,
    buildMessageLeaderboardEmbed,
    buildOverviewLeaderboardEmbed,
    buildUserStatsEmbed,
    createLeaderboardButtons,
    createUserStatsButtons
} = require('../services/leaderboardService');
const { getUserStats } = require('../services/activityService');
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

            if (interaction.customId === 'lb_select_menu') {
                const selected = interaction.values[0] || 'lb_overview';
                const guild = interaction.guild;
                const guildId = guild.id;

                let embed;
                let activeCategory = 'overview';

                if (selected === 'lb_voice') {
                    activeCategory = 'voice';
                    const list = await getVoiceLeaderboard(guildId, 10);
                    embed = buildVoiceLeaderboardEmbed(guild, list);
                } else if (selected === 'lb_messages') {
                    activeCategory = 'messages';
                    const list = await getMessageLeaderboard(guildId, 10);
                    embed = buildMessageLeaderboardEmbed(guild, list);
                } else {
                    activeCategory = 'overview';
                    const voiceList = await getVoiceLeaderboard(guildId, 6);
                    const msgList = await getMessageLeaderboard(guildId, 6);
                    embed = buildOverviewLeaderboardEmbed(guild, voiceList, msgList);
                }

                const components = createLeaderboardButtons(activeCategory);
                return await interaction.update({ embeds: [embed], components }).catch(() => {});
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

            // Ping refresh button
            if (customId === 'ping_refresh') {
                const wsPing = interaction.client.ws.ping;
                const uptime = require('../config/symbols').formatDuration(Math.floor(process.uptime()));
                const memoryMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
                const prefix = require('../config/env').config.prefix || 'k?';

                const embed = new (require('discord.js').EmbedBuilder)()
                    .setColor(0x2B2D31)
                    .setAuthor({
                        name: `${require('../config/symbols').toSmallCaps('KitKat')} • ${require('../config/symbols').toSmallCaps('System Telemetry')}`,
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setDescription(
                        `### 📡 **${require('../config/symbols').toSmallCaps('Latency & System Telemetry')}**\n\n` +
                        `> ⚡ **${require('../config/symbols').toSmallCaps('Gateway Latency')}:** \` ${wsPing >= 0 ? wsPing + 'ms' : 'Syncing...'} \`\n` +
                        `> 🌐 **${require('../config/symbols').toSmallCaps('Roundtrip Ping')}:** \` ~${Math.floor(wsPing + 15)}ms \`\n\n` +
                        `> ⏱️ **${require('../config/symbols').toSmallCaps('Host Uptime')}:** \` ${uptime} \`\n` +
                        `> 💾 **${require('../config/symbols').toSmallCaps('Memory Footprint')}:** \` ${memoryMB} MB \`\n\n` +
                        `> 🏷️ **${require('../config/symbols').toSmallCaps('Prefix')}:** \` ${prefix} \`\n` +
                        `> 🟢 **${require('../config/symbols').toSmallCaps('Database Cluster')}:** \` MongoDB Atlas [Connected] \`\n\n` +
                        `───────────────────────────────────\n` +
                        `*Refreshed just now • WebSocket connection is nominal.*`
                    )
                    .setFooter({
                        text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
                    })
                    .setTimestamp();

                return await interaction.update({ embeds: [embed] }).catch(() => {});
            }

            // Stats refresh button
            if (customId.startsWith('stats_refresh_')) {
                const targetUserId = customId.replace('stats_refresh_', '');
                const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);
                const targetUser = targetMember ? targetMember.user : await interaction.client.users.fetch(targetUserId).catch(() => null);

                if (targetUser) {
                    const stats = await getUserStats(interaction.guild.id, targetUser.id);
                    const embed = buildUserStatsEmbed(interaction.guild, targetUser, targetMember, stats);
                    return await interaction.update({ embeds: [embed] }).catch(() => {});
                }
            }

            // Leaderboard tab buttons & refresh
            if (['lb_voice', 'lb_messages', 'lb_overview', 'lb_refresh'].includes(customId)) {
                const guild = interaction.guild;
                const guildId = guild.id;

                let embed;
                let activeCategory = 'overview';

                if (customId === 'lb_voice') {
                    activeCategory = 'voice';
                    const list = await getVoiceLeaderboard(guildId, 10);
                    embed = buildVoiceLeaderboardEmbed(guild, list);
                } else if (customId === 'lb_messages') {
                    activeCategory = 'messages';
                    const list = await getMessageLeaderboard(guildId, 10);
                    embed = buildMessageLeaderboardEmbed(guild, list);
                } else {
                    activeCategory = 'overview';
                    const voiceList = await getVoiceLeaderboard(guildId, 6);
                    const msgList = await getMessageLeaderboard(guildId, 6);
                    embed = buildOverviewLeaderboardEmbed(guild, voiceList, msgList);
                }

                const components = createLeaderboardButtons(activeCategory);

                return await interaction.update({
                    embeds: [embed],
                    components
                }).catch(() => {});
            }
        }
    }
};
