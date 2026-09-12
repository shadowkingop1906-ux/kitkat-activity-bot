const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserStats } = require('../services/activityService');
const { Symbols, toSmallCaps, formatDuration } = require('../config/symbols');

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

        const vcRankBadge = Symbols.ranks[stats.voiceRank] || `\`#${stats.voiceRank}\``;
        const msgRankBadge = Symbols.ranks[stats.messageRank] || `\`#${stats.messageRank}\``;

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({
                name: `${targetUser.displayName || targetUser.username} (${targetUser.tag})`,
                iconURL: targetUser.displayAvatarURL({ dynamic: true })
            })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(
                `**${interaction.guild.name}**\n` +
                `📅 **Created On:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:D>   •   📥 **Joined On:** ${member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Unknown'}\n` +
                `───────────────────────────────────`
            )
            .addFields(
                {
                    name: '🏆 Server Ranks',
                    value: 
                        `> • **Message:** \`${stats.messageRank ? '#' + stats.messageRank : 'No Data'}\`\n` +
                        `> • **Voice:** \`${stats.voiceRank ? '#' + stats.voiceRank : 'No Data'}\``,
                    inline: false
                },
                {
                    name: '# Messages',
                    value: `> • **Total:** \`${stats.messageCount.toLocaleString()} messages\``,
                    inline: true
                },
                {
                    name: '🔊 Voice Activity',
                    value: 
                        `> • **Total:** \`${voiceTimeFormatted}\`\n` +
                        `> • **State:** ${stats.isCurrentlyInVoice ? '🟢 `Transmitting`' : '⚪ `Standby`'}`,
                    inline: true
                }
            )
            .setFooter({
                text: `Server Lookback: All-time — Timezone: UTC • ⚡ Powered by KitKat Support`
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('lb_overview')
                .setLabel('Overview')
                .setEmoji('🕒')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`stats_refresh_${targetUser.id}`)
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('panel_btn_delete')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
};
