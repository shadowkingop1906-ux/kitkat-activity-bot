const { Events, EmbedBuilder } = require('discord.js');
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
const { Symbols, formatDuration } = require('../config/symbols');

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
        const isOwner = message.author.id === config.ownerId;

        // Command: k?ping
        if (commandName === 'ping') {
            const roundtrip = Date.now() - message.createdTimestamp;
            const wsPing = message.client.ws.ping;
            const uptime = formatDuration(Math.floor(process.uptime()));

            const embed = new EmbedBuilder()
                .setColor(Symbols.colors.accent)
                .setTitle(`[ SYSTEM // TELEMETRY ]`)
                .setDescription(`${Symbols.divider}`)
                .addFields(
                    {
                        name: `${Symbols.diamond} LATENCY`,
                        value: `${Symbols.tBranch} ${Symbols.bullet} Roundtrip: \`${roundtrip}ms\`\n${Symbols.cornerBottomLeft} ${Symbols.bullet} Gateway: \`${wsPing}ms\``,
                        inline: true
                    },
                    {
                        name: `${Symbols.diamond} RUNTIME`,
                        value: `${Symbols.tBranch} ${Symbols.bullet} Uptime: \`${uptime}\`\n${Symbols.cornerBottomLeft} ${Symbols.bullet} Prefix: \`${prefix}\``,
                        inline: true
                    }
                )
                .setFooter({ text: `[ PREFIX: ${prefix} // REQUESTED BY ${message.author.username.toUpperCase()} ]` })
                .setTimestamp();

            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        // Command: k?stats [@user]
        if (commandName === 'stats' || commandName === 'profile') {
            const targetMember = message.mentions.members.first() ||
                (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null) ||
                message.member;

            const targetUser = targetMember.user;
            const stats = await getUserStats(message.guild.id, targetUser.id);
            const voiceTimeFormatted = formatDuration(stats.totalVoiceSeconds);

            const embed = new EmbedBuilder()
                .setColor(Symbols.colors.accent)
                .setTitle(`[ DOSSIER // ACTIVITY TELEMETRY ]`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(
                    `IDENTIFIER: **${targetUser.username.toUpperCase()}** (<@${targetUser.id}>)\n` +
                    `STATUS: ${stats.isCurrentlyInVoice ? `\`[ LIVE // IN VOICE CHANNEL ]\`` : `\`[ OFFLINE // VOICE IDLE ]\``}\n` +
                    `${Symbols.divider}`
                )
                .addFields(
                    {
                        name: `${Symbols.diamond} VOICE METRICS`,
                        value: [
                            `${Symbols.tBranch} ${Symbols.bullet} Time Spent: \`${voiceTimeFormatted}\``,
                            `${Symbols.tBranch} ${Symbols.bullet} Server Rank: \`${Symbols.ranks[stats.voiceRank] || `❯ [${stats.voiceRank}]`}\``,
                            `${Symbols.cornerBottomLeft} ${Symbols.subBullet} Active Status: ${stats.isCurrentlyInVoice ? 'Connected' : 'Disconnected'}`
                        ].join('\n')
                    },
                    {
                        name: `${Symbols.diamond} TEXT METRICS`,
                        value: [
                            `${Symbols.tBranch} ${Symbols.bullet} Total Messages: \`${stats.messageCount.toLocaleString()}\``,
                            `${Symbols.cornerBottomLeft} ${Symbols.bullet} Server Rank: \`${Symbols.ranks[stats.messageRank] || `❯ [${stats.messageRank}]`}\``
                        ].join('\n')
                    }
                )
                .setFooter({ text: `[ OWNER ID: ${config.ownerId} // GUILD: ${message.guild.name.toUpperCase()} ]` })
                .setTimestamp();

            return message.reply({ embeds: [embed] }).catch(() => {});
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
            const embed = new EmbedBuilder()
                .setColor(Symbols.colors.accent)
                .setTitle(`[ COMMAND MATRIX // PREFIX: ${prefix} ]`)
                .setDescription(
                    `Server Activity & Voice Telemetry System.\n` +
                    `Owner: <@${config.ownerId}>\n` +
                    `${Symbols.divider}`
                )
                .addFields(
                    {
                        name: `${Symbols.diamond} \`${prefix}stats [@user]\``,
                        value: `${Symbols.subBullet} View voice time, message count, and server rank.`
                    },
                    {
                        name: `${Symbols.diamond} \`${prefix}leaderboard [voice | messages]\``,
                        value: `${Symbols.subBullet} Display server rankings with interactive tab buttons (Alias: \`${prefix}lb\`, \`${prefix}top\`).`
                    },
                    {
                        name: `${Symbols.diamond} \`${prefix}ping\``,
                        value: `${Symbols.subBullet} Display bot latency, uptime, and status.`
                    },
                    {
                        name: `${Symbols.diamond} Slash Commands`,
                        value: `${Symbols.subBullet} Sabhi commands slash format mein bhi available hain: \`/stats\`, \`/leaderboard\`, \`/ping\`, \`/help\`.`
                    }
                )
                .setFooter({ text: `[ SYMBOL ENGINE // PRO EDITION ]` })
                .setTimestamp();

            return message.reply({ embeds: [embed] }).catch(() => {});
        }
    }
};
