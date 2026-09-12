const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const UserActivity = require('../database/models/UserActivity');
const { Symbols, toSmallCaps, formatDuration, createSymbolProgressBar } = require('../config/symbols');
const { activeVoiceSessions } = require('./activityService');

/**
 * Fetch top voice users in a guild
 * @param {string} guildId
 * @param {number} limit
 */
async function getVoiceLeaderboard(guildId, limit = 10) {
    const rawList = await UserActivity.find({ guildId, voiceTimeSeconds: { $gt: 0 } })
        .sort({ voiceTimeSeconds: -1 })
        .limit(limit)
        .lean();

    const list = rawList.map(entry => {
        const sessionKey = `${guildId}-${entry.userId}`;
        let total = entry.voiceTimeSeconds;
        if (activeVoiceSessions.has(sessionKey)) {
            const start = activeVoiceSessions.get(sessionKey);
            total += Math.max(0, Math.floor((Date.now() - start) / 1000));
        }
        return { ...entry, currentTotal: total };
    });

    list.sort((a, b) => b.currentTotal - a.currentTotal);
    return list;
}

/**
 * Fetch top message users in a guild
 * @param {string} guildId
 * @param {number} limit
 */
async function getMessageLeaderboard(guildId, limit = 10) {
    return await UserActivity.find({ guildId, messageCount: { $gt: 0 } })
        .sort({ messageCount: -1 })
        .limit(limit)
        .lean();
}

/**
 * Generates sleek modern embed for Voice Leaderboard
 * @param {string} guildName
 * @param {Array} entries
 */
/**
 * Generates Statbot-styled embed for Voice Leaderboard
 * @param {object|string} guildOrName
 * @param {Array} entries
 */
/**
 * Generates Statbot-styled embed for Voice Leaderboard (Matching ping aesthetic)
 * @param {object|string} guildOrName
 * @param {Array} entries
 */
function buildVoiceLeaderboardEmbed(guildOrName, entries) {
    const guildName = typeof guildOrName === 'string' ? guildOrName : (guildOrName?.name || 'Server');
    const guildIcon = typeof guildOrName === 'object' && guildOrName?.iconURL ? guildOrName.iconURL() : undefined;

    let voiceLines = '> ` N/A                                      0 h `';
    if (entries && entries.length > 0) {
        const maxTime = entries[0].currentTotal || entries[0].voiceTimeSeconds || 1;
        voiceLines = entries.slice(0, 10).map((item, idx) => {
            const badge = Symbols.ranks[idx + 1] || `\`#${idx + 1}\``;
            const timeStr = formatDuration(item.currentTotal || item.voiceTimeSeconds);
            const bar = createSymbolProgressBar(item.currentTotal || item.voiceTimeSeconds, maxTime, 6);
            return `> ${badge} <@${item.userId}>\n> ╰─› \` ${timeStr} \`  •  ${bar}`;
        }).join('\n\n');
    }

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({
            name: `${guildName} • Voice Leaderboard`,
            iconURL: guildIcon
        })
        .setDescription(
            `### 🔊 **${toSmallCaps('Voice Activity Leaderboard')}**\n\n` +
            `> 🏠 **${toSmallCaps('Guild')}:** \` ${guildName} \`\n` +
            `> 🎙️ **${toSmallCaps('Metrics')}:** \` Realtime Voice Presence & Duration \`\n\n` +
            `───────────────────────────────────\n\n` +
            `${voiceLines}\n\n` +
            `───────────────────────────────────\n` +
            `*Realtime voice presence synchronized with MongoDB Atlas.*`
        )
        .setFooter({
            text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
        })
        .setTimestamp();

    return embed;
}

/**
 * Generates Statbot-styled embed for Message Leaderboard (Matching ping aesthetic)
 * @param {object|string} guildOrName
 * @param {Array} entries
 */
function buildMessageLeaderboardEmbed(guildOrName, entries) {
    const guildName = typeof guildOrName === 'string' ? guildOrName : (guildOrName?.name || 'Server');
    const guildIcon = typeof guildOrName === 'object' && guildOrName?.iconURL ? guildOrName.iconURL() : undefined;

    let msgLines = '> ` N/A                                        0 `';
    if (entries && entries.length > 0) {
        const maxCount = entries[0].messageCount || 1;
        msgLines = entries.slice(0, 10).map((item, idx) => {
            const badge = Symbols.ranks[idx + 1] || `\`#${idx + 1}\``;
            const bar = createSymbolProgressBar(item.messageCount, maxCount, 6);
            return `> ${badge} <@${item.userId}>\n> ╰─› \` ${item.messageCount.toLocaleString()} messages \`  •  ${bar}`;
        }).join('\n\n');
    }

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({
            name: `${guildName} • Chat Leaderboard`,
            iconURL: guildIcon
        })
        .setDescription(
            `### #️⃣ **${toSmallCaps('Message Volume Leaderboard')}**\n\n` +
            `> 🏠 **${toSmallCaps('Guild')}:** \` ${guildName} \`\n` +
            `> 💬 **${toSmallCaps('Metrics')}:** \` Total Logged Messages & Server Volume \`\n\n` +
            `───────────────────────────────────\n\n` +
            `${msgLines}\n\n` +
            `───────────────────────────────────\n` +
            `*Realtime text messages synchronized with MongoDB Atlas.*`
        )
        .setFooter({
            text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
        })
        .setTimestamp();

    return embed;
}

/**
 * Generates Statbot-styled Overview embed (Top Statistics matching s?t and ping aesthetic)
 * @param {object|string} guildOrName
 * @param {Array} voiceEntries
 * @param {Array} messageEntries
 */
function buildOverviewLeaderboardEmbed(guildOrName, voiceEntries, messageEntries) {
    const guildName = typeof guildOrName === 'string' ? guildOrName : (guildOrName?.name || 'Server');
    const guildIcon = typeof guildOrName === 'object' && guildOrName?.iconURL ? guildOrName.iconURL() : undefined;

    let msgLines = '> ` N/A                                        0 `';
    if (messageEntries && messageEntries.length > 0) {
        msgLines = messageEntries.slice(0, 5).map((item, idx) => {
            const badge = Symbols.ranks[idx + 1] || `\`#${idx + 1}\``;
            return `> ${badge} <@${item.userId}> ╰─› \` ${item.messageCount.toLocaleString()} msgs \``;
        }).join('\n');
    }

    let voiceLines = '> ` N/A                                      0 h `';
    if (voiceEntries && voiceEntries.length > 0) {
        voiceLines = voiceEntries.slice(0, 5).map((item, idx) => {
            const badge = Symbols.ranks[idx + 1] || `\`#${idx + 1}\``;
            const timeStr = formatDuration(item.currentTotal || item.voiceTimeSeconds);
            return `> ${badge} <@${item.userId}> ╰─› \` ${timeStr} \``;
        }).join('\n');
    }

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({
            name: `${guildName} • Top Statistics`,
            iconURL: guildIcon
        })
        .setDescription(
            `### 🏆 **${toSmallCaps('Server Top Statistics')}**\n\n` +
            `> 🏠 **${toSmallCaps('Guild')}:** \` ${guildName} \`\n` +
            `> 📊 **${toSmallCaps('Lookback')}:** \` All-Time Synchronized Telemetry \`\n\n` +
            `───────────────────────────────────\n\n` +
            `### #️⃣ **${toSmallCaps('Top Message Members')}**\n` +
            `${msgLines}\n\n` +
            `### 🔊 **${toSmallCaps('Top Voice Members')}**\n` +
            `${voiceLines}\n\n` +
            `───────────────────────────────────\n` +
            `*Use the buttons or dropdown menu below to switch detailed tabs.*`
        )
        .setFooter({
            text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
        })
        .setTimestamp();

    return embed;
}

/**
 * Creates interactive dropdown menu and button row matching Statbot Component V2
 * @param {string} activeCategory 'voice' | 'messages' | 'overview'
 */
function createLeaderboardButtons(activeCategory = 'overview') {
    const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('lb_select_menu')
        .setPlaceholder('Navigation • Choose leaderboard view')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Overview (Top Statistics)')
                .setDescription('Combined voice and chat statistics')
                .setEmoji('🕒')
                .setValue('lb_overview')
                .setDefault(activeCategory === 'overview'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Voice Activity')
                .setDescription('Detailed voice duration rankings')
                .setEmoji('🔊')
                .setValue('lb_voice')
                .setDefault(activeCategory === 'voice'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Messages')
                .setDescription('Detailed message volume rankings')
                .setEmoji('💬')
                .setValue('lb_messages')
                .setDefault(activeCategory === 'messages')
        );

    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

    const rowButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('lb_overview')
            .setLabel('Overview')
            .setEmoji('🕒')
            .setStyle(activeCategory === 'overview' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('lb_voice')
            .setLabel('Voice')
            .setEmoji('🔊')
            .setStyle(activeCategory === 'voice' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('lb_messages')
            .setLabel('Messages')
            .setEmoji('💬')
            .setStyle(activeCategory === 'messages' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('lb_refresh')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('panel_btn_delete')
            .setLabel('Close')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
    );

    return [rowSelect, rowButtons];
}

/**
 * Generates Statbot / Ping styled embed for Member Stats
 * @param {object} guild
 * @param {object} targetUser
 * @param {object|null} member
 * @param {object} stats
 */
function buildUserStatsEmbed(guild, targetUser, member, stats) {
    const voiceTimeFormatted = formatDuration(stats.totalVoiceSeconds);
    const createdTimestamp = Math.floor(targetUser.createdTimestamp / 1000);
    const joinedTimestamp = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
    const joinedStr = joinedTimestamp ? `<t:${joinedTimestamp}:D>` : '`Unknown`';

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({
            name: `${targetUser.displayName || targetUser.username} (${targetUser.tag})`,
            iconURL: targetUser.displayAvatarURL({ dynamic: true })
        })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(
            `### 👤 **${toSmallCaps('Member Telemetry Dossier')}**\n\n` +
            `> 🏠 **${toSmallCaps('Guild')}:** \` ${guild.name} \`\n` +
            `> 📅 **${toSmallCaps('Created')}:** <t:${createdTimestamp}:D>  •  📥 **${toSmallCaps('Joined')}:** ${joinedStr}\n\n` +
            `> 🏆 **${toSmallCaps('Message Rank')}:** \` ${stats.messageRank ? '#' + stats.messageRank : 'No Rank'} \`\n` +
            `> 👑 **${toSmallCaps('Voice Rank')}:** \` ${stats.voiceRank ? '#' + stats.voiceRank : 'No Rank'} \`\n\n` +
            `> 💬 **${toSmallCaps('Messages')}:** \` ${stats.messageCount.toLocaleString()} msgs \`\n` +
            `> 🎙️ **${toSmallCaps('Voice Time')}:** \` ${voiceTimeFormatted} \`\n` +
            `> 🟢 **${toSmallCaps('Voice Status')}:** ${stats.isCurrentlyInVoice ? '`🟢 Transmitting`' : '`⚪ Standby`'}\n\n` +
            `───────────────────────────────────\n` +
            `*Realtime member telemetry synchronized with MongoDB Atlas.*`
        )
        .setFooter({
            text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
        })
        .setTimestamp();

    return embed;
}

/**
 * Creates button row for Member Stats
 * @param {string} targetUserId
 */
function createUserStatsButtons(targetUserId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('lb_overview')
            .setLabel('Overview')
            .setEmoji('🕒')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`stats_refresh_${targetUserId}`)
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('panel_btn_delete')
            .setLabel('Close')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
    );
}

module.exports = {
    getVoiceLeaderboard,
    getMessageLeaderboard,
    buildVoiceLeaderboardEmbed,
    buildMessageLeaderboardEmbed,
    buildOverviewLeaderboardEmbed,
    buildUserStatsEmbed,
    createLeaderboardButtons,
    createUserStatsButtons
};
