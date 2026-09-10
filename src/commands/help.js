const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Symbols } = require('../config/symbols');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays information about available commands and activity tracking.'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(Symbols.colors.accent)
            .setTitle(`[ COMMAND MATRIX // MANUAL ]`)
            .setDescription(
                `A professional, minimal activity tracking engine.\n` +
                `Tracks Voice Channel time and text chat frequency in real-time.\n` +
                `${Symbols.divider}`
            )
            .addFields(
                {
                    name: `${Symbols.diamond} \`/stats [target]\``,
                    value: `${Symbols.subBullet} View detailed telemetry, ranks, and voice status for yourself or another server member.`
                },
                {
                    name: `${Symbols.diamond} \`/leaderboard [type]\``,
                    value: `${Symbols.subBullet} View top ranked voice and message leaders. Switch tabs with interactive buttons.`
                },
                {
                    name: `${Symbols.diamond} \`/ping\``,
                    value: `${Symbols.subBullet} Check system latency, host memory footprint, uptime, and database connectivity.`
                },
                {
                    name: `${Symbols.diamond} \`/help\``,
                    value: `${Symbols.subBullet} Display this command interface manual.`
                }
            )
            .setFooter({
                text: `[ SYMBOL INTERFACE // CLEAN ARCHITECTURE ]`
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
