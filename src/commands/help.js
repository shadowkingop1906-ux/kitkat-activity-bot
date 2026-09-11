const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Symbols, Animated, toAesthetic } = require('../config/symbols');
const { config } = require('../config/env');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays the crazy cyberpunk command interface manual.'),

    async execute(interaction) {
        const titleAesthetic = toAesthetic('COMMAND MATRIX');
        const prefix = config.prefix || 'k?';

        const embed = new EmbedBuilder()
            .setColor(Symbols.colors.accent)
            .setTitle(`${Animated.starSpin} 『 ${titleAesthetic} 』`)
            .setDescription(
                `\`\`\`asciidoc\n` +
                `= KITKAT CORE PROTOCOL =\n` +
                `[ DUAL INTERFACE: SLASH (/) & PREFIX (${prefix}) ]\n` +
                `\`\`\`\n` +
                `${Symbols.borderDoubleH}`
            )
            .addFields(
                {
                    name: `${Animated.voiceWave} ❖〔 \`/stats\` ｜ \`${prefix}stats [@user]\` 〕`,
                    value: `   ${Symbols.treeEnd} ⟡ Inspect member voice hours, chat count, activity ratio, and server rank.`
                },
                {
                    name: `${Animated.fire} ❖〔 \`/leaderboard\` ｜ \`${prefix}lb\` 〕`,
                    value: `   ${Symbols.treeEnd} ⟡ Access top 10 rankings with interactive buttons for Voice, Chat, and Overview.`
                },
                {
                    name: `${Animated.ping} ❖〔 \`/ping\` ｜ \`${prefix}ping\` 〕`,
                    value: `   ${Symbols.treeEnd} ⟡ Realtime WebSocket latency gauge, host memory footprint, and database connectivity.`
                },
                {
                    name: `${Animated.shield} ❖〔 \`/help\` ｜ \`${prefix}help\` 〕`,
                    value: `   ${Symbols.treeEnd} ⟡ Display this crazy futuristic command manual.`
                }
            )
            .setFooter({
                text: `◈ KITKAT CORE ENGINE ◈ ARCHITECTURE BY GOOGLE AGY`
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
