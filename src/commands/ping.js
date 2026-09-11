const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const { Symbols, Animated, toAesthetic, formatDuration } = require('../config/symbols');

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
        const dbStatus = mongoose.connection.readyState === 1 ? 'OPERATIONAL [CONNECTED]' : 'DEGRADED [OFFLINE]';

        const titleAesthetic = toAesthetic('SYSTEM TELEMETRY');
        const embed = new EmbedBuilder()
            .setColor(roundtripLatency < 150 ? Symbols.colors.accent : Symbols.colors.crimson)
            .setTitle(`${Animated.ping} 『 ${titleAesthetic} 』`)
            .setDescription(
                `\`\`\`asciidoc\n` +
                `= CORE ENGINE STATUS: NOMINAL =\n` +
                `[ DISCORD API GATEWAY & DATABASE HEALTH ]\n` +
                `\`\`\`\n` +
                `${Symbols.borderDoubleH}`
            )
            .addFields(
                {
                    name: `${Animated.fire} ❖〔 ＬＡＴＥＮＣＹ  ＧＡＵＧＥ 〕`,
                    value: [
                        `   ${Symbols.treeBranch} ⌁ Gateway Ping: \` ${websocketPing}ms \``,
                        `   ${Symbols.treeEnd} ⟡ Roundtrip: \` ${roundtripLatency}ms \``
                    ].join('\n'),
                    inline: false
                },
                {
                    name: `${Animated.gem} ❖〔 ＲＵＮＴＩＭＥ  ＭＥＴＲＩＣＳ 〕`,
                    value: [
                        `   ${Symbols.treeBranch} ⌁ System Uptime: \` ${uptime} \``,
                        `   ${Symbols.treeEnd} ⟡ Memory Footprint: \` ${memoryMB} MB \``
                    ].join('\n'),
                    inline: false
                },
                {
                    name: `${Animated.shield} ❖〔 ＩＮＦＲＡＳＴＲＵＣＴＵＲＥ 〕`,
                    value: [
                        `   ${Symbols.treeBranch} ⌁ Database Cluster: \` ${dbStatus} \``,
                        `   ${Symbols.treeEnd} ⟡ Node Engine: \` ${process.version} \``
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({
                text: `◈ KITKAT CORE ENGINE ◈ TELEMETRY LIVE`
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
