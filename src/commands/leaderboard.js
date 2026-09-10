const { SlashCommandBuilder } = require('discord.js');
const {
    getVoiceLeaderboard,
    getMessageLeaderboard,
    buildVoiceLeaderboardEmbed,
    buildMessageLeaderboardEmbed,
    buildOverviewLeaderboardEmbed,
    createLeaderboardButtons
} = require('../services/leaderboardService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the guild activity leaderboard for Voice Channels and Messages.')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Category of the leaderboard to view.')
                .setRequired(false)
                .addChoices(
                    { name: 'Overview (Dual Top 3)', value: 'overview' },
                    { name: 'Voice Time (Top 10)', value: 'voice' },
                    { name: 'Messages (Top 10)', value: 'messages' }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const type = interaction.options.getString('type') || 'overview';
        const guildId = interaction.guild.id;
        const guildName = interaction.guild.name;

        let embed;
        if (type === 'voice') {
            const list = await getVoiceLeaderboard(guildId, 10);
            embed = buildVoiceLeaderboardEmbed(guildName, list);
        } else if (type === 'messages') {
            const list = await getMessageLeaderboard(guildId, 10);
            embed = buildMessageLeaderboardEmbed(guildName, list);
        } else {
            const voiceList = await getVoiceLeaderboard(guildId, 3);
            const msgList = await getMessageLeaderboard(guildId, 3);
            embed = buildOverviewLeaderboardEmbed(guildName, voiceList, msgList);
        }

        const buttons = createLeaderboardButtons(type);
        await interaction.editReply({ embeds: [embed], components: [buttons] });
    }
};
