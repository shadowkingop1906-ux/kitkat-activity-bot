const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserStats } = require('../services/activityService');
const { Symbols, Animated, toAesthetic, formatDuration, createSymbolProgressBar } = require('../config/symbols');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Display server activity dossier, live status, and rankings for a member.')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The member whose telemetry you want to inspect (defaults to you).')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        const stats = await getUserStats(interaction.guild.id, targetUser.id);
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
            );

        // Voice Section
        const vcRankBadge = Symbols.ranks[stats.voiceRank] || `⌖〔 ${stats.voiceRank} 〕`;
        embed.addFields({
            name: `${Animated.voiceWave} ❖【 ＶＯＩＣＥ  ＭＥＴＲＩＣＳ 】`,
            value: [
                `   ${Symbols.treeBranch} ⌁ Recorded Time: \` ${voiceTimeFormatted} \``,
                `   ${Symbols.treeBranch} ⌁ Server Rank: ${vcRankBadge}`,
                `   ${Symbols.treeEnd} ⟡ Voice State: \`${stats.isCurrentlyInVoice ? 'TRANSMITTING' : 'STANDBY'}\``
            ].join('\n'),
            inline: false
        });

        // Message Section
        const msgRankBadge = Symbols.ranks[stats.messageRank] || `⌖〔 ${stats.messageRank} 〕`;
        embed.addFields({
            name: `${Animated.sparkles} ❖【 ＣＨＡＴ  ＭＥＴＲＩＣＳ 】`,
            value: [
                `   ${Symbols.treeBranch} ✦ Total Messages: \` ${stats.messageCount.toLocaleString()} msgs \``,
                `   ${Symbols.treeEnd} ⌁ Server Rank: ${msgRankBadge}`
            ].join('\n'),
            inline: false
        });

        // Timeline Info
        const joinedDiscord = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`;
        const joinedServer = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown';

        embed.addFields({
            name: `${Animated.shield} ❖【 ＴＥＬＥＭＥＴＲＹ  ＴＩＭＥＬＩＮＥ 】`,
            value: [
                `   ${Symbols.treeBranch} ⌁ Guild Joined: ${joinedServer}`,
                `   ${Symbols.treeEnd} ⟡ Account Created: ${joinedDiscord}`
            ].join('\n'),
            inline: false
        });

        embed.setFooter({
            text: `◈ KITKAT CORE ENGINE ◈ GUILD: ${interaction.guild.name.toUpperCase()}`
        });
        embed.setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
