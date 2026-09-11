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
const { Symbols, Animated, toAesthetic, formatDuration } = require('../config/symbols');

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
            const titleAesthetic = toAesthetic('SYSTEM TELEMETRY');

            const embed = new EmbedBuilder()
                .setColor(Symbols.colors.accent)
                .setTitle(`${Animated.ping} 『 ${titleAesthetic} 』`)
                .setDescription(
                    `\`\`\`asciidoc\n` +
                    `= SYSTEM TELEMETRY =\n` +
                    `[ GATEWAY LATENCY & HOST RUNTIME ]\n` +
                    `\`\`\`\n` +
                    `${Symbols.borderDoubleH}`
                )
                .addFields(
                    {
                        name: `${Animated.fire} ❖〔 ＬＡＴＥＮＣＹ 〕`,
                        value: `   ${Symbols.treeBranch} ⌁ Roundtrip: \` ${roundtrip}ms \`\n   ${Symbols.treeEnd} ⟡ Gateway: \` ${wsPing}ms \``,
                        inline: false
                    },
                    {
                        name: `${Animated.shield} ❖〔 ＲＵＮＴＩＭＥ 〕`,
                        value: `   ${Symbols.treeBranch} ⌁ Uptime: \` ${uptime} \`\n   ${Symbols.treeEnd} ⟡ Prefix: \` ${prefix} \``,
                        inline: false
                    }
                )
                .setFooter({ text: `◈ KITKAT CORE ◈ REQUESTED BY ${message.author.username.toUpperCase()}` })
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
            const titleAesthetic = toAesthetic('OPERATOR DOSSIER');

            const statusBadge = stats.isCurrentlyInVoice
                ? `\`\`\`diff\n+ [ ⟡ LIVE // CONNECTED IN VOICE ]\n\`\`\``
                : `\`\`\`yaml\n[ ◈ IDLE // VOICE DISCONNECTED ]\n\`\`\``;

            const embed = new EmbedBuilder()
                .setColor(stats.isCurrentlyInVoice ? Symbols.colors.emerald : Symbols.colors.accent)
                .setTitle(`${Animated.starSpin} 『 ${titleAesthetic} 』`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(
                    `\`\`\`asciidoc\n` +
                    `= USER: ${targetUser.username.toUpperCase()} =\n` +
                    `ID :: ${targetUser.id}\n` +
                    `\`\`\`\n` +
                    `${statusBadge}` +
                    `${Symbols.borderDoubleH}`
                )
                .addFields(
                    {
                        name: `${Animated.voiceWave} ❖【 ＶＯＩＣＥ  ＭＥＴＲＩＣＳ 】`,
                        value: [
                            `   ${Symbols.treeBranch} ⌁ Recorded Time: \` ${voiceTimeFormatted} \``,
                            `   ${Symbols.treeBranch} ⌁ Server Rank: ${Symbols.ranks[stats.voiceRank] || `⌖〔 ${stats.voiceRank} 〕`}`,
                            `   ${Symbols.treeEnd} ⟡ Voice State: \`${stats.isCurrentlyInVoice ? 'TRANSMITTING' : 'STANDBY'}\``
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: `${Animated.sparkles} ❖【 ＣＨＡＴ  ＭＥＴＲＩＣＳ 】`,
                        value: [
                            `   ${Symbols.treeBranch} ✦ Total Messages: \` ${stats.messageCount.toLocaleString()} msgs \``,
                            `   ${Symbols.treeEnd} ⌁ Server Rank: ${Symbols.ranks[stats.messageRank] || `⌖〔 ${stats.messageRank} 〕`}`
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({ text: `◈ OWNER: ${config.ownerId} ◈ GUILD: ${message.guild.name.toUpperCase()}` })
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
            const titleAesthetic = toAesthetic('COMMAND MATRIX');
            const embed = new EmbedBuilder()
                .setColor(Symbols.colors.accent)
                .setTitle(`${Animated.starSpin} 『 ${titleAesthetic} 』`)
                .setDescription(
                    `\`\`\`asciidoc\n` +
                    `= KITKAT CORE PROTOCOL =\n` +
                    `[ PREFIX: ${prefix} ｜ OWNER: ${config.ownerId} ]\n` +
                    `\`\`\`\n` +
                    `${Symbols.borderDoubleH}`
                )
                .addFields(
                    {
                        name: `${Animated.voiceWave} ❖〔 \`${prefix}stats [@user]\` 〕`,
                        value: `   ${Symbols.treeEnd} ⟡ View voice time, message count, and server rank.`
                    },
                    {
                        name: `${Animated.fire} ❖〔 \`${prefix}lb\` ｜ \`${prefix}leaderboard\` 〕`,
                        value: `   ${Symbols.treeEnd} ⟡ Display server rankings with interactive tab buttons.`
                    },
                    {
                        name: `${Animated.ping} ❖〔 \`${prefix}ping\` 〕`,
                        value: `   ${Symbols.treeEnd} ⟡ Inspect bot latency, uptime, and database connectivity.`
                    },
                    {
                        name: `${Animated.shield} ❖〔 Slash Commands 〕`,
                        value: `   ${Symbols.treeEnd} ⟡ Sabhi commands slash mein bhi available hain: \`/stats\`, \`/leaderboard\`, \`/ping\`, \`/help\`.`
                    }
                )
                .setFooter({ text: `◈ KITKAT CORE ENGINE ◈ PRO EDITION` })
                .setTimestamp();

            return message.reply({ embeds: [embed] }).catch(() => {});
        }
    }
};
