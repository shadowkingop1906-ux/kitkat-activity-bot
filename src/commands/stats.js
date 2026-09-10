const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserStats } = require('../services/activityService');
const { Symbols, formatDuration, createSymbolProgressBar } = require('../config/symbols');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Display server activity statistics and rankings for a member.')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The member whose statistics you want to inspect (defaults to you).')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        const stats = await getUserStats(interaction.guild.id, targetUser.id);
        const voiceTimeFormatted = formatDuration(stats.totalVoiceSeconds);

        const embed = new EmbedBuilder()
            .setColor(Symbols.colors.accent)
            .setTitle(`[ DOSSIER // ACTIVITY TELEMETRY ]`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(
                `IDENTIFIER: **${targetUser.username.toUpperCase()}** (<@${targetUser.id}>)\n` +
                `STATUS: ${stats.isCurrentlyInVoice ? `\`[ LIVE // IN VOICE CHANNEL ]\`` : `\`[ OFFLINE // VOICE IDLE ]\` `}\n` +
                `${Symbols.divider}`
            );

        // Voice Section
        const vcRankBadge = Symbols.ranks[stats.voiceRank] || `❯ [${stats.voiceRank}]`;
        embed.addFields({
            name: `${Symbols.diamond} VOICE METRICS`,
            value: [
                `${Symbols.tBranch} ${Symbols.bullet} Time Spent: \`${voiceTimeFormatted}\``,
                `${Symbols.tBranch} ${Symbols.bullet} Server Rank: \`${vcRankBadge}\``,
                `${Symbols.cornerBottomLeft} ${Symbols.subBullet} Active Status: ${stats.isCurrentlyInVoice ? 'Connected' : 'Disconnected'}`
            ].join('\n'),
            inline: false
        });

        // Message Section
        const msgRankBadge = Symbols.ranks[stats.messageRank] || `❯ [${stats.messageRank}]`;
        embed.addFields({
            name: `${Symbols.diamond} TEXT METRICS`,
            value: [
                `${Symbols.tBranch} ${Symbols.bullet} Total Messages: \`${stats.messageCount.toLocaleString()}\``,
                `${Symbols.cornerBottomLeft} ${Symbols.bullet} Server Rank: \`${msgRankBadge}\``
            ].join('\n'),
            inline: false
        });

        // Joined / Last Active Info
        const joinedDiscord = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`;
        const joinedServer = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown';

        embed.addFields({
            name: `${Symbols.diamond} TIMELINE`,
            value: [
                `${Symbols.tBranch} ${Symbols.bullet} Joined Server: ${joinedServer}`,
                `${Symbols.cornerBottomLeft} ${Symbols.bullet} Created Account: ${joinedDiscord}`
            ].join('\n'),
            inline: false
        });

        embed.setFooter({
            text: `[ SYMBOL ENGINE // GUILD: ${interaction.guild.name.toUpperCase()} ]`
        });
        embed.setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
