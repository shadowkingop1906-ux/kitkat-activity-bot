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
            .setColor(stats.isCurrentlyInVoice ? Symbols.colors.success : Symbols.colors.primary)
            .setAuthor({
                name: `${targetUser.username} • ${toSmallCaps('Activity Dossier')}`,
                iconURL: targetUser.displayAvatarURL({ dynamic: true })
            })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(
                `### 📊 **${toSmallCaps('Operator Activity Dossier')}**\n\n` +
                `> 👤 **${toSmallCaps('Member')}:** <@${targetUser.id}> (\`${targetUser.id}\`)\n` +
                `> 📡 **${toSmallCaps('Voice State')}:** ${stats.isCurrentlyInVoice ? '🟢 ` Transmitting in Voice `' : '⚪ ` Voice Standby / Idle `'}\n\n` +
                `───────────────────────────────────\n\n` +
                `🎙️ **${toSmallCaps('Voice Metrics')}**\n` +
                `• **${toSmallCaps('Duration Recorded')}:** \` ${voiceTimeFormatted} \`\n` +
                `• **${toSmallCaps('Guild Rank')}:** ${vcRankBadge}\n\n` +
                `💬 **${toSmallCaps('Chat Metrics')}**\n` +
                `• **${toSmallCaps('Messages Logged')}:** \` ${stats.messageCount.toLocaleString()} msgs \`\n` +
                `• **${toSmallCaps('Guild Rank')}:** ${msgRankBadge}\n\n` +
                `───────────────────────────────────\n\n` +
                `📅 **${toSmallCaps('Account Timeline')}**\n` +
                `• **${toSmallCaps('Joined Server')}:** ${member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown'}\n` +
                `• **${toSmallCaps('Registered Discord')}:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`
            )
            .setFooter({
                text: `${toSmallCaps('KitKat Core Engine')} • ${interaction.guild.name}`
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('lb_overview')
                .setLabel('Leaderboard')
                .setEmoji('🏆')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('panel_btn_delete')
                .setLabel('Close')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
};
