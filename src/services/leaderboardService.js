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
function buildVoiceLeaderboardEmbed(guildOrName, entries) {
    const guildName = typeof guildOrName === 'string' ? guildOrName : (guildOrName?.name || 'Server');
    const guildIcon = typeof guildOrName === 'object' && guildOrName?.iconURL ? guildOrName.iconURL() : undefined;

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({
            name: `${guildName}`,
            iconURL: guildIcon
        })
        .setTitle('🔊 Voice Activity')
        .setDescription(
            `**Server Lookback: All-time**\n` +
            `Realtime tracking of voice presence and communication duration.\n` +
            `───────────────────────────────────`
        );

    if (!entries || entries.length === 0) {
        embed.addFields({
            name: 'Voice Activity',
            value: '```\nN/A                                      0 h\n```'
        });
    } else {
        const maxTime = entries[0].currentTotal || entries[0].voiceTimeSeconds || 1;
        const lines = entries.slice(0, 10).map((item, idx) => {
            const rank = idx + 1;
            const timeStr = formatDuration(item.currentTotal || item.voiceTimeSeconds);
            const bar = createSymbolProgressBar(item.currentTotal || item.voiceTimeSeconds, maxTime, 6);
            return `**${rank}.** <@${item.userId}>\n╰─› \`${timeStr}\` • ${bar}`;
        });

        embed.addFields({
            name: 'Top Voice Members',
            value: lines.join('\n\n')
        });
    }

    embed.setFooter({
        text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
    });
    embed.setTimestamp();

    return embed;
}

/**
 * Generates Statbot-styled embed for Message Leaderboard
 * @param {object|string} guildOrName
 * @param {Array} entries
 */
function buildMessageLeaderboardEmbed(guildOrName, entries) {
    const guildName = typeof guildOrName === 'string' ? guildOrName : (guildOrName?.name || 'Server');
    const guildIcon = typeof guildOrName === 'object' && guildOrName?.iconURL ? guildOrName.iconURL() : undefined;

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({
            name: `${guildName}`,
            iconURL: guildIcon
        })
        .setTitle('# Messages')
        .setDescription(
            `**Server Lookback: All-time**\n` +
            `Realtime tracking of message volume across guild text channels.\n` +
            `───────────────────────────────────`
        );

    if (!entries || entries.length === 0) {
        embed.addFields({
            name: 'Messages',
            value: '```\nN/A                                        0\n```'
        });
    } else {
        const maxCount = entries[0].messageCount || 1;
        const lines = entries.slice(0, 10).map((item, idx) => {
            const rank = idx + 1;
            const bar = createSymbolProgressBar(item.messageCount, maxCount, 6);
            return `**${rank}.** <@${item.userId}>\n╰─› \`${item.messageCount.toLocaleString()} messages\` • ${bar}`;
        });

        embed.addFields({
            name: 'Top Message Members',
            value: lines.join('\n\n')
        });
    }

    embed.setFooter({
        text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
    });
    embed.setTimestamp();

    return embed;
}

/**
 * Generates Statbot-styled Overview embed (Top Statistics matching s?t)
 * @param {object|string} guildOrName
 * @param {Array} voiceEntries
 * @param {Array} messageEntries
 */
function buildOverviewLeaderboardEmbed(guildOrName, voiceEntries, messageEntries) {
    const guildName = typeof guildOrName === 'string' ? guildOrName : (guildOrName?.name || 'Server');
    const guildIcon = typeof guildOrName === 'object' && guildOrName?.iconURL ? guildOrName.iconURL() : undefined;

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({
            name: `${guildName}`,
            iconURL: guildIcon
        })
        .setTitle('🏆 Top Statistics');

    // Top message members (up to 6)
    let msgLines = '```\nN/A                                        0\n```';
    if (messageEntries && messageEntries.length > 0) {
        msgLines = messageEntries.slice(0, 6).map((item, idx) => {
            const rank = idx + 1;
            return `**${rank}.** <@${item.userId}> — \`${item.messageCount.toLocaleString()} msgs\``;
        }).join('\n');
    }

    // Top voice members (up to 6)
    let voiceLines = '```\nN/A                                      0 h\n```';
    if (voiceEntries && voiceEntries.length > 0) {
        voiceLines = voiceEntries.slice(0, 6).map((item, idx) => {
            const rank = idx + 1;
            const timeStr = formatDuration(item.currentTotal || item.voiceTimeSeconds);
            return `**${rank}.** <@${item.userId}> — \`${timeStr}\``;
        }).join('\n');
    }

    embed.addFields(
        {
            name: '# Messages',
            value: msgLines,
            inline: false
        },
        {
            name: '🔊 Voice Activity',
            value: voiceLines,
            inline: false
        }
    );

    embed.setFooter({
        text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
    });
    embed.setTimestamp();

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
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
    );

    return [rowSelect, rowButtons];
}

module.exports = {
    getVoiceLeaderboard,
    getMessageLeaderboard,
    buildVoiceLeaderboardEmbed,
    buildMessageLeaderboardEmbed,
    buildOverviewLeaderboardEmbed,
    createLeaderboardButtons
};
