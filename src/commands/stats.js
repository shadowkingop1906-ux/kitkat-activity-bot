const { SlashCommandBuilder } = require('discord.js');
const { getUserStats } = require('../services/activityService');
const { buildUserStatsEmbed, createUserStatsButtons } = require('../services/leaderboardService');

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

        const embed = buildUserStatsEmbed(interaction.guild, targetUser, member, stats);
        const row = createUserStatsButtons(targetUser.id);

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
};
