const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { config } = require('../config/env');
const { recordMessage, getUserStats } = require('../services/activityService');
const {
    getVoiceLeaderboard,
    getMessageLeaderboard,
    buildVoiceLeaderboardEmbed,
    buildMessageLeaderboardEmbed,
    buildOverviewLeaderboardEmbed,
    createLeaderboardButtons
} = require('../services/leaderboardService');
const { Symbols, toSmallCaps, formatDuration } = require('../config/symbols');
const { buildPanel } = require('../utils/panelBuilder');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Discard messages from bots, system, webhooks, or direct messages
        if (!message.guild || message.author.bot || message.system || message.webhookId) {
            return;
        }

        // 1. Record message count in database
        await recordMessage(message.guild.id, message.author.id);

        // 2. Prefix Command Handler (e.g. k?stats, k?lb, k?ping, k?help)
        const prefix = config.prefix || 'k?';
        if (!message.content.startsWith(prefix)) {
            return;
        }

        const args = message.content.slice(prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        // Command: k?ping
        if (commandName === 'ping') {
            const roundtrip = Date.now() - message.createdTimestamp;
            const wsPing = message.client.ws.ping;
            const uptime = formatDuration(Math.floor(process.uptime()));
            const memoryMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

            const embed = new EmbedBuilder()
                .setColor(roundtrip < 200 ? Symbols.colors.primary : Symbols.colors.danger)
                .setAuthor({
                    name: `${toSmallCaps('KitKat')} • ${toSmallCaps('System Telemetry')}`,
                    iconURL: message.client.user.displayAvatarURL()
                })
                .setDescription(
                    `### 📡 ${toSmallCaps('Latency & Performance')}\n\n` +
                    `• **Gateway Ping:** \`${wsPing >= 0 ? wsPing + 'ms' : 'Syncing...'}\`\n` +
                    `• **Roundtrip:** \`${roundtrip}ms\`\n` +
                    `• **Host Uptime:** \`${uptime}\`\n` +
                    `• **Memory Usage:** \`${memoryMB} MB\`\n` +
                    `• **Prefix:** \`${prefix}\``
                )
                .setFooter({
                    text: `${toSmallCaps('KitKat Core Engine')} • Realtime Telemetry`
                })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('panel_btn_system')
                    .setLabel('System Details')
                    .setEmoji('ℹ️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('panel_btn_delete')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger)
            );

            return message.reply({ embeds: [embed], components: [row] }).catch(() => {});
        }

        // Command: k?stats [@user]
        if (commandName === 'stats' || commandName === 'profile') {
            const targetMember = message.mentions.members.first() ||
                (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null) ||
                message.member;

            const targetUser = targetMember.user;
            const stats = await getUserStats(message.guild.id, targetUser.id);
            const voiceTimeFormatted = formatDuration(stats.totalVoiceSeconds);

            const vcRankBadge = Symbols.ranks[stats.voiceRank] || `\`#${stats.voiceRank}\``;
            const msgRankBadge = Symbols.ranks[stats.messageRank] || `\`#${stats.messageRank}\``;

            const embed = new EmbedBuilder()
                .setColor(stats.isCurrentlyInVoice ? Symbols.colors.success : Symbols.colors.primary)
                .setAuthor({
                    name: `${targetUser.username} • ${toSmallCaps('Activity Dossier')}`,
                    iconURL: targetUser.displayAvatarURL({ dynamic: true })
                })
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(
                    `### ${toSmallCaps('Member Telemetry')}\n` +
                    `**User:** <@${targetUser.id}> • \`${targetUser.id}\`\n` +
                    `**Status:** ${stats.isCurrentlyInVoice ? '🟢 `Transmitting in Voice`' : '⚪ `Voice Disconnected`'}\n\n` +
                    `🎙️ **${toSmallCaps('Voice Metrics')}**\n` +
                    `• **Time Spent:** \`${voiceTimeFormatted}\`\n` +
                    `• **Server Rank:** ${vcRankBadge}\n\n` +
                    `💬 **${toSmallCaps('Chat Metrics')}**\n` +
                    `• **Messages Sent:** \`${stats.messageCount.toLocaleString()} msgs\`\n` +
                    `• **Server Rank:** ${msgRankBadge}\n\n` +
                    `📅 **${toSmallCaps('Timeline')}**\n` +
                    `• **Joined Guild:** <t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>\n` +
                    `• **Registered:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`
                )
                .setFooter({
                    text: `${toSmallCaps('KitKat Core Engine')} • ${message.guild.name}`
                })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('lb_overview')
                    .setLabel('Leaderboard')
                    .setEmoji('🏆')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('panel_btn_delete')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger)
            );

            return message.reply({ embeds: [embed], components: [row] }).catch(() => {});
        }

        // Command: k?leaderboard or k?lb [voice|messages|overview]
        if (commandName === 'leaderboard' || commandName === 'lb' || commandName === 'top') {
            const subType = (args[0] || 'overview').toLowerCase();
            const guildId = message.guild.id;
            const guildName = message.guild.name;

            let embed;
            let activeCategory = 'overview';

            if (subType === 'voice' || subType === 'vc') {
                activeCategory = 'voice';
                const list = await getVoiceLeaderboard(guildId, 10);
                embed = buildVoiceLeaderboardEmbed(guildName, list);
            } else if (subType === 'messages' || subType === 'msg' || subType === 'chat') {
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
            return message.reply({ embeds: [embed], components: [buttons] }).catch(() => {});
        }

        // Command: k?help
        if (commandName === 'help') {
            const panelPayload = await buildPanel('home', message.client, message);
            return message.reply(panelPayload).catch(() => {});
        }
    }
};
