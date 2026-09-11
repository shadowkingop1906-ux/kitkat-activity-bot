const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const UserActivity = require('../database/models/UserActivity');
const { Symbols, Animated, toAesthetic, formatDuration, createSymbolProgressBar } = require('../config/symbols');
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
 * Generates crazy cyberpunk symbol-styled embed for Voice Leaderboard
 * @param {string} guildName
 * @param {Array} entries
 */
function buildVoiceLeaderboardEmbed(guildName, entries) {
    const titleAesthetic = toAesthetic('VOICE LEADERBOARD');
    const embed = new EmbedBuilder()
        .setColor(Symbols.colors.accent)
        .setTitle(`${Animated.voiceWave} 『 ${titleAesthetic} 』`)
        .setDescription(
            `\`\`\`asciidoc\n` +
            `= SERVER: ${guildName.toUpperCase()} =\n` +
            `[ PROTOCOL // REALTIME VOICE TELEMETRY ]\n` +
            `\`\`\`\n` +
            `${Symbols.borderDoubleH}`
        );

    if (!entries || entries.length === 0) {
        embed.addFields({
            name: `${Symbols.rhombus} STATUS TELEMETRY`,
            value: `\`\`\`css\n[ No active voice sessions recorded yet. ]\n\`\`\``
        });
        return embed;
    }

    const maxTime = entries[0].currentTotal || entries[0].voiceTimeSeconds || 1;

    const lines = entries.map((item, index) => {
        const rank = index + 1;
        const badge = Symbols.ranks[rank] || `⌖〔 ${rank < 10 ? '０' + rank : rank} 〕`;
        const timeStr = formatDuration(item.currentTotal || item.voiceTimeSeconds);
        const bar = createSymbolProgressBar(item.currentTotal || item.voiceTimeSeconds, maxTime, 8);

        return `${badge} <@${item.userId}>\n` +
               `   ${Symbols.treeBranch} ⌁ Voice Time: \` ${timeStr} \`\n` +
               `   ${Symbols.treeEnd} ⟡ Activity Ratio: ${bar}`;
    });

    embed.addFields({
        name: `${Animated.fire} ❖【 ＥＬＩＴＥ  ＶＯＩＣＥ  ＴＡＬＫＥＲＳ 】`,
        value: lines.join('\n\n')
    });

    embed.setFooter({
        text: `◈ KITKAT CORE ENGINE ◈ AUTO-SYNCHRONIZED METRICS`
    });
    embed.setTimestamp();

    return embed;
}

/**
 * Generates crazy cyberpunk symbol-styled embed for Message Leaderboard
 * @param {string} guildName
 * @param {Array} entries
 */
function buildMessageLeaderboardEmbed(guildName, entries) {
    const titleAesthetic = toAesthetic('CHAT LEADERBOARD');
    const embed = new EmbedBuilder()
        .setColor(Symbols.colors.purple)
        .setTitle(`${Animated.sparkles} 『 ${titleAesthetic} 』`)
        .setDescription(
            `\`\`\`asciidoc\n` +
            `= SERVER: ${guildName.toUpperCase()} =\n` +
            `[ PROTOCOL // REALTIME TEXT TELEMETRY ]\n` +
            `\`\`\`\n` +
            `${Symbols.borderDoubleH}`
        );

    if (!entries || entries.length === 0) {
        embed.addFields({
            name: `${Symbols.rhombus} STATUS TELEMETRY`,
            value: `\`\`\`css\n[ No text activity recorded yet. ]\n\`\`\``
        });
        return embed;
    }

    const maxCount = entries[0].messageCount || 1;

    const lines = entries.map((item, index) => {
        const rank = index + 1;
        const badge = Symbols.ranks[rank] || `⌖〔 ${rank < 10 ? '０' + rank : rank} 〕`;
        const bar = createSymbolProgressBar(item.messageCount, maxCount, 8);

        return `${badge} <@${item.userId}>\n` +
               `   ${Symbols.treeBranch} ✦ Total Messages: \` ${item.messageCount.toLocaleString()} msgs \`\n` +
               `   ${Symbols.treeEnd} ⟡ Activity Ratio: ${bar}`;
    });

    embed.addFields({
        name: `${Animated.gem} ❖【 ＥＬＩＴＥ  ＣＨＡＴＴＥＲＳ 】`,
        value: lines.join('\n\n')
    });

    embed.setFooter({
        text: `◈ KITKAT CORE ENGINE ◈ AUTO-SYNCHRONIZED METRICS`
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
    const titleAesthetic = toAesthetic('SERVER TELEMETRY');
    const embed = new EmbedBuilder()
        .setColor(Symbols.colors.gold)
        .setTitle(`${Animated.crown} 『 ${titleAesthetic} 』`)
        .setDescription(
            `\`\`\`asciidoc\n` +
            `= SERVER: ${guildName.toUpperCase()} =\n` +
            `[ DUAL MATRIX // VOICE & CHAT OVERVIEW ]\n` +
            `\`\`\`\n` +
            `${Symbols.borderDoubleH}`
        );

    // Top 3 voice
    let voiceText = '```fix\n[ No voice activity recorded ]\n```';
    if (voiceEntries.length > 0) {
        voiceText = voiceEntries.slice(0, 3).map((item, idx) => {
            const timeStr = formatDuration(item.currentTotal || item.voiceTimeSeconds);
            const badge = Symbols.ranks[idx + 1];
            return `${badge} <@${item.userId}>\n   ${Symbols.treeEnd} \` ${timeStr} \``;
        }).join('\n');
    }

    // Top 3 messages
    let messageText = '```fix\n[ No message activity recorded ]\n```';
    if (messageEntries.length > 0) {
        messageText = messageEntries.slice(0, 3).map((item, idx) => {
            const badge = Symbols.ranks[idx + 1];
            return `${badge} <@${item.userId}>\n   ${Symbols.treeEnd} \` ${item.messageCount.toLocaleString()} msgs \``;
        }).join('\n');
    }

    embed.addFields(
        {
            name: `${Animated.voiceWave} ❖〔 ＴＯＰ  ＶＯＩＣＥ  ＯＰＥＲＡＴＯＲＳ 〕`,
            value: voiceText,
            inline: false
        },
        {
            name: `${Animated.sparkles} ❖〔 ＴＯＰ  ＣＨＡＴ  ＯＰＥＲＡＴＯＲＳ 〕`,
            value: messageText,
            inline: false
        }
    );

    embed.setFooter({
        text: `◈ SWITCH TABS BELOW FOR TOP 10 RANKINGS ◈`
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
            .setLabel('〔 ◈ VOICE 〕')
            .setStyle(activeCategory === 'voice' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('lb_messages')
            .setLabel('〔 ◈ CHAT 〕')
            .setStyle(activeCategory === 'messages' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('lb_overview')
            .setLabel('〔 ◈ OVERVIEW 〕')
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
