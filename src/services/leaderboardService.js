const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const UserActivity = require('../database/models/UserActivity');
const { Symbols, formatDuration, createSymbolProgressBar } = require('../config/symbols');
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

    // Adjust for currently active live voice sessions
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
 * Generates aesthetic symbol-styled embed for Voice Leaderboard
 * @param {string} guildName
 * @param {Array} entries
 */
function buildVoiceLeaderboardEmbed(guildName, entries) {
    const embed = new EmbedBuilder()
        .setColor(Symbols.colors.accent)
        .setTitle(`[ LEADERBOARD // VOICE ACTIVITY ]`)
        .setDescription(`SERVER: **${guildName.toUpperCase()}**\n${Symbols.divider}`);

    if (!entries || entries.length === 0) {
        embed.addFields({
            name: `${Symbols.diamond} STATUS`,
            value: `No recorded voice channel activity yet.\nJoin a voice channel to start tracking.`
        });
        return embed;
    }

    const maxTime = entries[0].currentTotal || entries[0].voiceTimeSeconds || 1;

    const lines = entries.map((item, index) => {
        const rank = index + 1;
        const badge = Symbols.ranks[rank] || `❯ [${rank < 10 ? '0' + rank : rank}]`;
        const timeStr = formatDuration(item.currentTotal || item.voiceTimeSeconds);
        const bar = createSymbolProgressBar(item.currentTotal || item.voiceTimeSeconds, maxTime, 8);

        return `${badge} <@${item.userId}>\n` +
               `   ${Symbols.verticalBar} ${Symbols.bullet} Time: \`${timeStr}\`\n` +
               `   ${Symbols.cornerBottomLeft} ${Symbols.subBullet} Ratio: \`${bar}\``;
    });

    embed.addFields({
        name: `TOP VOICE TALKERS`,
        value: lines.join('\n\n')
    });

    embed.setFooter({
        text: `[ SYMBOL ENGINE // METRICS RECORDED IN REALTIME ]`
    });
    embed.setTimestamp();

    return embed;
}

/**
 * Generates aesthetic symbol-styled embed for Message Leaderboard
 * @param {string} guildName
 * @param {Array} entries
 */
function buildMessageLeaderboardEmbed(guildName, entries) {
    const embed = new EmbedBuilder()
        .setColor(Symbols.colors.accent)
        .setTitle(`[ LEADERBOARD // MESSAGE COUNT ]`)
        .setDescription(`SERVER: **${guildName.toUpperCase()}**\n${Symbols.divider}`);

    if (!entries || entries.length === 0) {
        embed.addFields({
            name: `${Symbols.diamond} STATUS`,
            value: `No recorded text activity yet.\nSend messages in chat to start tracking.`
        });
        return embed;
    }

    const maxCount = entries[0].messageCount || 1;

    const lines = entries.map((item, index) => {
        const rank = index + 1;
        const badge = Symbols.ranks[rank] || `❯ [${rank < 10 ? '0' + rank : rank}]`;
        const bar = createSymbolProgressBar(item.messageCount, maxCount, 8);

        return `${badge} <@${item.userId}>\n` +
               `   ${Symbols.verticalBar} ${Symbols.bullet} Messages: \`${item.messageCount.toLocaleString()}\`\n` +
               `   ${Symbols.cornerBottomLeft} ${Symbols.subBullet} Ratio: \`${bar}\``;
    });

    embed.addFields({
        name: `TOP CHATTERS`,
        value: lines.join('\n\n')
    });

    embed.setFooter({
        text: `[ SYMBOL ENGINE // METRICS RECORDED IN REALTIME ]`
    });
    embed.setTimestamp();

    return embed;
}

/**
 * Generates overview leaderboard embed
 * @param {string} guildName
 * @param {Array} voiceEntries
 * @param {Array} messageEntries
 */
function buildOverviewLeaderboardEmbed(guildName, voiceEntries, messageEntries) {
    const embed = new EmbedBuilder()
        .setColor(Symbols.colors.primary)
        .setTitle(`[ SERVER TELEMETRY // OVERVIEW ]`)
        .setDescription(`SERVER: **${guildName.toUpperCase()}**\n${Symbols.divider}`);

    // Top 3 voice
    let voiceText = 'No voice activity recorded.';
    if (voiceEntries.length > 0) {
        voiceText = voiceEntries.slice(0, 3).map((item, idx) => {
            const timeStr = formatDuration(item.currentTotal || item.voiceTimeSeconds);
            return `${Symbols.ranks[idx + 1]} <@${item.userId}> ─ \`${timeStr}\``;
        }).join('\n');
    }

    // Top 3 messages
    let messageText = 'No message activity recorded.';
    if (messageEntries.length > 0) {
        messageText = messageEntries.slice(0, 3).map((item, idx) => {
            return `${Symbols.ranks[idx + 1]} <@${item.userId}> ─ \`${item.messageCount.toLocaleString()} msgs\``;
        }).join('\n');
    }

    embed.addFields(
        {
            name: `${Symbols.diamond} TOP VOICE OPERATORS`,
            value: voiceText,
            inline: false
        },
        {
            name: `${Symbols.diamond} TOP CHAT OPERATORS`,
            value: messageText,
            inline: false
        }
    );

    embed.setFooter({
        text: `[ SYMBOL ENGINE // SWITCH TABS BELOW ]`
    });
    embed.setTimestamp();

    return embed;
}

/**
 * Creates interactive button row to switch between tabs
 * @param {string} activeCategory 'voice' | 'messages' | 'overview'
 */
function createLeaderboardButtons(activeCategory = 'overview') {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('lb_voice')
            .setLabel('[ ◈ VOICE TIME ]')
            .setStyle(activeCategory === 'voice' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('lb_messages')
            .setLabel('[ ◈ MESSAGES ]')
            .setStyle(activeCategory === 'messages' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('lb_overview')
            .setLabel('[ ◈ OVERVIEW ]')
            .setStyle(activeCategory === 'overview' ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );
}

module.exports = {
    getVoiceLeaderboard,
    getMessageLeaderboard,
    buildVoiceLeaderboardEmbed,
    buildMessageLeaderboardEmbed,
    buildOverviewLeaderboardEmbed,
    createLeaderboardButtons
};
