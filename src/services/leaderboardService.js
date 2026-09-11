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
function buildVoiceLeaderboardEmbed(guildName, entries) {
    const embed = new EmbedBuilder()
        .setColor(Symbols.colors.primary)
        .setAuthor({
            name: `${toSmallCaps('Voice Leaderboard')} • ${guildName}`
        })
        .setDescription(`### 🎙️ ${toSmallCaps('Top Voice Members')}\nReal-time recorded voice activity.`);

    if (!entries || entries.length === 0) {
        embed.addFields({
            name: 'Status',
            value: 'No voice activity recorded yet for this server.'
        });
        return embed;
    }

    const maxTime = entries[0].currentTotal || entries[0].voiceTimeSeconds || 1;

    const lines = entries.map((item, index) => {
        const rank = index + 1;
        const badge = Symbols.ranks[rank] || `\`#${rank}\``;
        const timeStr = formatDuration(item.currentTotal || item.voiceTimeSeconds);
        const bar = createSymbolProgressBar(item.currentTotal || item.voiceTimeSeconds, maxTime, 6);

        return `${badge} <@${item.userId}>\n› Time: \`${timeStr}\` • ${bar}`;
    });

    embed.addFields({
        name: '🏆 Rankings',
        value: lines.join('\n\n')
    });

    embed.setFooter({
        text: `${toSmallCaps('KitKat Telemetry')} • Auto-Synchronized`
    });
    embed.setTimestamp();

    return embed;
}

/**
 * Generates sleek modern embed for Message Leaderboard
 * @param {string} guildName
 * @param {Array} entries
 */
function buildMessageLeaderboardEmbed(guildName, entries) {
    const embed = new EmbedBuilder()
        .setColor(Symbols.colors.accent)
        .setAuthor({
            name: `${toSmallCaps('Chat Leaderboard')} • ${guildName}`
        })
        .setDescription(`### 💬 ${toSmallCaps('Top Chat Members')}\nReal-time recorded message volume.`);

    if (!entries || entries.length === 0) {
        embed.addFields({
            name: 'Status',
            value: 'No text messages recorded yet for this server.'
        });
        return embed;
    }

    const maxCount = entries[0].messageCount || 1;

    const lines = entries.map((item, index) => {
        const rank = index + 1;
        const badge = Symbols.ranks[rank] || `\`#${rank}\``;
        const bar = createSymbolProgressBar(item.messageCount, maxCount, 6);

        return `${badge} <@${item.userId}>\n› Messages: \`${item.messageCount.toLocaleString()}\` • ${bar}`;
    });

    embed.addFields({
        name: '🏆 Rankings',
        value: lines.join('\n\n')
    });

    embed.setFooter({
        text: `${toSmallCaps('KitKat Telemetry')} • Auto-Synchronized`
    });
    embed.setTimestamp();

    return embed;
}

/**
 * Generates overview leaderboard embed (Dual Podium)
 * @param {string} guildName
 * @param {Array} voiceEntries
 * @param {Array} messageEntries
 */
function buildOverviewLeaderboardEmbed(guildName, voiceEntries, messageEntries) {
    const embed = new EmbedBuilder()
        .setColor(Symbols.colors.primary)
        .setAuthor({
            name: `${toSmallCaps('Server Overview')} • ${guildName}`
        })
        .setDescription(`### 🌟 ${toSmallCaps('Activity Overview')}\nTop performers in voice and text channels.`);

    // Top 3 voice
    let voiceText = '*No voice activity recorded yet.*';
    if (voiceEntries && voiceEntries.length > 0) {
        voiceText = voiceEntries.slice(0, 3).map((item, idx) => {
            const timeStr = formatDuration(item.currentTotal || item.voiceTimeSeconds);
            const badge = Symbols.ranks[idx + 1];
            return `${badge} <@${item.userId}> — \`${timeStr}\``;
        }).join('\n');
    }

    // Top 3 messages
    let messageText = '*No message activity recorded yet.*';
    if (messageEntries && messageEntries.length > 0) {
        messageText = messageEntries.slice(0, 3).map((item, idx) => {
            const badge = Symbols.ranks[idx + 1];
            return `${badge} <@${item.userId}> — \`${item.messageCount.toLocaleString()} msgs\``;
        }).join('\n');
    }

    embed.addFields(
        {
            name: '🎙️ Voice Leaders',
            value: voiceText,
            inline: true
        },
        {
            name: '💬 Chat Leaders',
            value: messageText,
            inline: true
        }
    );

    embed.setFooter({
        text: `${toSmallCaps('KitKat Telemetry')} • Switch tabs below`
    });
    embed.setTimestamp();

    return embed;
}

/**
 * Creates interactive button row to switch between tabs with delete button
 * @param {string} activeCategory 'voice' | 'messages' | 'overview'
 */
function createLeaderboardButtons(activeCategory = 'overview') {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('lb_overview')
            .setLabel('Overview')
            .setEmoji('🏆')
            .setStyle(activeCategory === 'overview' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('lb_voice')
            .setLabel('Voice')
            .setEmoji('🎙️')
            .setStyle(activeCategory === 'voice' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('lb_messages')
            .setLabel('Chat')
            .setEmoji('💬')
            .setStyle(activeCategory === 'messages' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('panel_btn_delete')
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
    createLeaderboardButtons
};
