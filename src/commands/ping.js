const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const { Symbols, formatDuration } = require('../config/symbols');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Inspect bot telemetry, latency, and host diagnostics.'),

    async execute(interaction) {
        const sent = await interaction.deferReply({ fetchReply: true });

        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const websocketPing = interaction.client.ws.ping;
        const uptime = formatDuration(Math.floor(process.uptime()));
        const memoryMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const dbStatus = mongoose.connection.readyState === 1 ? 'Operational' : 'Degraded';

        const embed = new EmbedBuilder()
            .setColor(Symbols.colors.accent)
            .setTitle(`[ SYSTEM // TELEMETRY DIAGNOSTICS ]`)
            .setDescription(`${Symbols.divider}`)
            .addFields(
                {
                    name: `${Symbols.diamond} LATENCY`,
                    value: [
                        `${Symbols.tBranch} ${Symbols.bullet} Roundtrip: \`${roundtripLatency}ms\``,
                        `${Symbols.cornerBottomLeft} ${Symbols.bullet} Gateway: \`${websocketPing}ms\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `${Symbols.diamond} RUNTIME`,
                    value: [
                        `${Symbols.tBranch} ${Symbols.bullet} Uptime: \`${uptime}\``,
                        `${Symbols.cornerBottomLeft} ${Symbols.bullet} Memory: \`${memoryMB} MB\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: `${Symbols.diamond} INFRASTRUCTURE`,
                    value: [
                        `${Symbols.tBranch} ${Symbols.bullet} Database: \`${dbStatus}\``,
                        `${Symbols.cornerBottomLeft} ${Symbols.bullet} Cluster: \`Render Web Service\``
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({
                text: `[ NODE ${process.version} // DISCORD.JS V14 ]`
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
