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
                `### 📡 **${toSmallCaps('Latency & System Telemetry')}**\n\n` +
                `> ⚡ **${toSmallCaps('Gateway Latency')}:** \` ${websocketPing >= 0 ? websocketPing + 'ms' : 'Syncing...'} \`\n` +
                `> 🌐 **${toSmallCaps('Roundtrip Ping')}:** \` ${roundtripLatency}ms \`\n\n` +
                `> ⏱️ **${toSmallCaps('Host Uptime')}:** \` ${uptime} \`\n` +
                `> 💾 **${toSmallCaps('Memory Footprint')}:** \` ${memoryMB} MB \`\n\n` +
                `> 🟢 **${toSmallCaps('Database Cluster')}:** \` ${isDbOnline ? 'MongoDB Atlas [Connected]' : 'Degraded [Offline]'} \`\n` +
                `> ⚙️ **${toSmallCaps('Node.js Engine')}:** \` ${process.version} \`\n\n` +
                `───────────────────────────────────\n` +
                `*Discord Gateway WebSocket connection is nominal.*`
            )
            .setFooter({
                text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('panel_btn_system')
                .setLabel('System')
                .setEmoji('ℹ️')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('ping_refresh')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('panel_btn_delete')
                .setLabel('Close')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
};
