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
                .setColor(0x2B2D31)
                .setAuthor({
                    name: `${toSmallCaps('KitKat')} • ${toSmallCaps('System Telemetry')}`,
                    iconURL: message.client.user.displayAvatarURL()
                })
                .setDescription(
                    `### 📡 **${toSmallCaps('Latency & System Telemetry')}**\n\n` +
                    `> ⚡ **${toSmallCaps('Gateway Latency')}:** \` ${wsPing >= 0 ? wsPing + 'ms' : 'Syncing...'} \`\n` +
                    `> 🌐 **${toSmallCaps('Roundtrip Ping')}:** \` ${roundtrip}ms \`\n\n` +
                    `> ⏱️ **${toSmallCaps('Host Uptime')}:** \` ${uptime} \`\n` +
                    `> 💾 **${toSmallCaps('Memory Footprint')}:** \` ${memoryMB} MB \`\n\n` +
                    `> 🏷️ **${toSmallCaps('Prefix')}:** \` ${prefix} \`\n` +
                    `> 🟢 **${toSmallCaps('Database Cluster')}:** \` MongoDB Atlas [Connected] \`\n\n` +
                    `───────────────────────────────────\n` +
                    `*Discord Gateway WebSocket connection is nominal.*`
                )
                .setFooter({
                    text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
                })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('panel_btn_system')
                    .setLabel('System')
                    .setEmoji('ℹ️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('ping_refresh')
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('panel_btn_delete')
                    .setLabel('Close')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger)
            );

            return message.reply({ embeds: [embed], components: [row] }).catch(() => {});
        }

        // Command: k?stats [@user] (Aliases: k?u, k?profile)
        if (commandName === 'stats' || commandName === 'profile' || commandName === 'u' || commandName === 'user') {
            const targetMember = message.mentions.members.first() ||
                (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null) ||
                message.member;

            const targetUser = targetMember.user;
            const stats = await getUserStats(message.guild.id, targetUser.id);
            const voiceTimeFormatted = formatDuration(stats.totalVoiceSeconds);

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setAuthor({
                    name: `${targetUser.displayName || targetUser.username} (${targetUser.tag})`,
                    iconURL: targetUser.displayAvatarURL({ dynamic: true })
                })
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(
                    `**${message.guild.name}**\n` +
                    `📅 **Created On:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:D>   •   📥 **Joined On:** <t:${Math.floor(targetMember.joinedTimestamp / 1000)}:D>\n` +
                    `───────────────────────────────────`
                )
                .addFields(
                    {
                        name: '🏆 Server Ranks',
                        value: 
                            `> • **Message:** \`${stats.messageRank ? '#' + stats.messageRank : 'No Data'}\`\n` +
                            `> • **Voice:** \`${stats.voiceRank ? '#' + stats.voiceRank : 'No Data'}\``,
                        inline: false
                    },
                    {
                        name: '# Messages',
                        value: `> • **Total:** \`${stats.messageCount.toLocaleString()} messages\``,
                        inline: true
                    },
                    {
                        name: '🔊 Voice Activity',
                        value: 
                            `> • **Total:** \`${voiceTimeFormatted}\`\n` +
                            `> • **State:** ${stats.isCurrentlyInVoice ? '🟢 `Transmitting`' : '⚪ `Standby`'}`,
                        inline: true
                    }
                )
                .setFooter({
                    text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
                })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('lb_overview')
                    .setLabel('Overview')
                    .setEmoji('🕒')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`stats_refresh_${targetUser.id}`)
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('panel_btn_delete')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger)
            );

            return message.reply({ embeds: [embed], components: [row] }).catch(() => {});
        }

        // Command: k?leaderboard, k?lb, k?top, k?t, k?m, k?v
        if (['leaderboard', 'lb', 'top', 't', 'm', 'messages', 'msg', 'v', 'voice', 'vc'].includes(commandName)) {
            let subType = (args[0] || 'overview').toLowerCase();
            if (['m', 'messages', 'msg'].includes(commandName)) subType = 'messages';
            if (['v', 'voice', 'vc'].includes(commandName)) subType = 'voice';

            const guildId = message.guild.id;

            let embed;
            let activeCategory = 'overview';

            if (subType === 'voice' || subType === 'vc' || subType === 'v') {
                activeCategory = 'voice';
                const list = await getVoiceLeaderboard(guildId, 10);
                embed = buildVoiceLeaderboardEmbed(message.guild, list);
            } else if (subType === 'messages' || subType === 'msg' || subType === 'chat' || subType === 'm') {
                activeCategory = 'messages';
                const list = await getMessageLeaderboard(guildId, 10);
                embed = buildMessageLeaderboardEmbed(message.guild, list);
            } else {
                activeCategory = 'overview';
                const voiceList = await getVoiceLeaderboard(guildId, 6);
                const msgList = await getMessageLeaderboard(guildId, 6);
                embed = buildOverviewLeaderboardEmbed(message.guild, voiceList, msgList);
            }

            const components = createLeaderboardButtons(activeCategory);
            return message.reply({ embeds: [embed], components }).catch(() => {});
        }

        // Command: k?help
        if (commandName === 'help') {
            const panelPayload = await buildPanel('home', message.client, message);
            return message.reply(panelPayload).catch(() => {});
        }
    }
};
