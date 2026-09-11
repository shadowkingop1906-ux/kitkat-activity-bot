const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const { Symbols, toSmallCaps, formatDuration } = require('../config/symbols');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Inspect bot telemetry, latency gauge, and host diagnostics.'),

    async execute(interaction) {
        const sent = await interaction.deferReply({ fetchReply: true });

        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const websocketPing = interaction.client.ws.ping;
        const uptime = formatDuration(Math.floor(process.uptime()));
        const memoryMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const isDbOnline = mongoose.connection.readyState === 1;

        const embed = new EmbedBuilder()
            .setColor(roundtripLatency < 200 ? Symbols.colors.primary : Symbols.colors.danger)
            .setAuthor({
                name: `${toSmallCaps('KitKat')} • ${toSmallCaps('System Telemetry')}`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setDescription(
                `### 📡 ${toSmallCaps('Latency & Performance')}\n\n` +
                `• **Gateway Ping:** \`${websocketPing >= 0 ? websocketPing + 'ms' : 'Syncing...'}\`\n` +
                `• **Roundtrip:** \`${roundtripLatency}ms\`\n` +
                `• **Host Uptime:** \`${uptime}\`\n` +
                `• **Memory Usage:** \`${memoryMB} MB\`\n` +
                `• **Database Cluster:** ${isDbOnline ? '🟢 `Operational`' : '🔴 `Degraded`'}\n` +
                `• **Node.js Engine:** \`${process.version}\``
            )
            .setFooter({
                text: `${toSmallCaps('KitKat Core Engine')} • Realtime Telemetry`
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('panel_btn_system')
                .setLabel('System Details')
                .setEmoji('ℹ️')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('panel_btn_delete')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
};
