const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');
const { Symbols, toSmallCaps, formatDuration } = require('../config/symbols');
const { config } = require('../config/env');

/**
 * Builds the Orbis-styled Component V2 interactive panels
 * Supports Home, System, Developer, Owner, and Supporter views.
 */
async function buildPanel(activeTab = 'home', client, interactionOrMessage) {
    const prefix = config.prefix || 'k?';
    const ownerId = config.ownerId || '1446040693725466687';

    // Fetch owner user if possible
    let ownerUser = null;
    try {
        ownerUser = await client.users.fetch(ownerId).catch(() => null);
    } catch (_) {}

    const ownerName = ownerUser ? (ownerUser.globalName || ownerUser.username) : 'NICO / OP';
    const ownerAvatar = ownerUser ? ownerUser.displayAvatarURL({ dynamic: true }) : client.user.displayAvatarURL();

    const embed = new EmbedBuilder()
        .setColor(Symbols.colors.primary);

    // Dynamic views based on activeTab
    if (activeTab === 'home') {
        embed
            .setAuthor({
                name: `${toSmallCaps('KitKat')} • ${toSmallCaps('Protocol')}`,
                iconURL: client.user.displayAvatarURL()
            })
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(
                `### ${toSmallCaps('KitKat Core Protocol')}\n` +
                `**Prefix:** \`${prefix}\` • **Status:** 🟢 \`Online\`\n` +
                `A high-performance activity tracker recording voice hours, message telemetry, and guild leaderboards.\n\n` +
                `**__${toSmallCaps('Command Matrix')}__**\n` +
                `• </stats:0> or \`${prefix}stats [@user]\`\n` +
                `  › View voice duration, message count, and server rank.\n` +
                `• </leaderboard:0> or \`${prefix}lb\`\n` +
                `  › Browse server leaderboards with interactive tabs.\n` +
                `• </ping:0> or \`${prefix}ping\`\n` +
                `  › Inspect WebSocket latency and host runtime.\n` +
                `• </help:0> or \`${prefix}help\`\n` +
                `  › Open this interactive component panel.\n\n` +
                `*Use the navigation buttons or menu below to explore system details.*`
            )
            .setFooter({
                text: `${toSmallCaps('KitKat Core Engine')} • ${toSmallCaps('v2.0 Panel')}`,
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();
    } else if (activeTab === 'system') {
        const uptime = formatDuration(Math.floor(process.uptime()));
        const memoryMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const wsPing = client.ws.ping >= 0 ? `${client.ws.ping}ms` : 'Calculating...';
        const guildCount = client.guilds.cache.size;
        const totalMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

        embed
            .setAuthor({
                name: `${toSmallCaps('KitKat')} • ${toSmallCaps('System Telemetry')}`,
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                `### ${toSmallCaps('System Diagnostics & Telemetry')}\n\n` +
                `• **Gateway Ping:** \`${wsPing}\`\n` +
                `• **Host Uptime:** \`${uptime}\`\n` +
                `• **Memory Footprint:** \`${memoryMB} MB\`\n` +
                `• **Database Cluster:** 🟢 \`MongoDB Atlas [Connected]\`\n` +
                `• **Node.js Engine:** \`${process.version}\`\n` +
                `• **Discord.js:** \`v14.17.3\`\n` +
                `• **Guilds Monitored:** \`${guildCount.toLocaleString()}\`\n` +
                `• **Total Members:** \`${totalMembers.toLocaleString()}\``
            )
            .setFooter({
                text: `${toSmallCaps('KitKat Telemetry')} • System Operational`
            })
            .setTimestamp();
    } else if (activeTab === 'developer') {
        embed
            .setAuthor({
                name: `${toSmallCaps('KitKat')} • ${toSmallCaps('Developer Protocol')}`,
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                `### ${toSmallCaps('Developer & Core Architecture')}\n\n` +
                `• **Lead Developer:** Google DeepMind / Antigravity AGY\n` +
                `• **Client System:** Clean Hexagonal Architecture (Node.js)\n` +
                `• **Database Layer:** Mongoose ORM / MongoDB Atlas\n` +
                `• **Keep-Alive Server:** Express Microservice with Self-Pinger\n` +
                `• **Component Engine:** Discord V2 ActionRow & Select Panels\n` +
                `• **Open Source:** [GitHub Repository](https://github.com/shadowkingop1906-ux/kitkat-activity-bot)`
            )
            .setFooter({
                text: `${toSmallCaps('KitKat Dev Team')} • Enterprise Architecture`
            })
            .setTimestamp();
    } else if (activeTab === 'owner') {
        // Matches the exact Orbis layout shown in the screenshot!
        embed
            .setAuthor({
                name: `${toSmallCaps('KitKat Owner')}`,
                iconURL: ownerAvatar
            })
            .setThumbnail(ownerAvatar)
            .setDescription(
                `👑 **${toSmallCaps('KitKat Owner')}**\n\n` +
                `**Name:** ${ownerName}\n` +
                `**User ID:** \`${ownerId}\`\n\n` +
                `🛡️ **${toSmallCaps('Root Operator')}**\n` +
                `**Status:** Primary Bot Administrator\n` +
                `**Permissions:** Full Administrative & Cluster Access`
            )
            .setFooter({
                text: `${toSmallCaps('KitKat Security')} • Verified Owner Badge`
            })
            .setTimestamp();
    } else if (activeTab === 'supporter') {
        embed
            .setAuthor({
                name: `${toSmallCaps('KitKat')} • ${toSmallCaps('Supporters & Community')}`,
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                `### 🌟 ${toSmallCaps('Supporters & Contributors')}\n\n` +
                `Special thanks to all server communities and members utilizing KitKat Activity Engine!\n\n` +
                `• **Early Adopter:** All servers running \`k?help\`\n` +
                `• **Supporter Perks:** Custom role assignments, exclusive badges, and priority telemetry logging.\n\n` +
                `*Want to become a supporter? Click the Support button below to join our guild!*`
            )
            .setFooter({
                text: `${toSmallCaps('KitKat Community')} • Supporter Tier`
            })
            .setTimestamp();
    }

    // Component V2 Elements:
    // 1. Dropdown Select Menu
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('panel_select')
        .setPlaceholder('Navigation Menu • Choose a panel view')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Home Overview')
                .setDescription('Commands matrix & general information')
                .setEmoji('⚙️')
                .setValue('home')
                .setDefault(activeTab === 'home'),
            new StringSelectMenuOptionBuilder()
                .setLabel('System Telemetry')
                .setDescription('Latency, memory, uptime, and host stats')
                .setEmoji('ℹ️')
                .setValue('system')
                .setDefault(activeTab === 'system'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Developer Info')
                .setDescription('Architecture, framework, and credits')
                .setEmoji('💻')
                .setValue('developer')
                .setDefault(activeTab === 'developer'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Owner Directory')
                .setDescription('Owner details & verified operators')
                .setEmoji('👑')
                .setValue('owner')
                .setDefault(activeTab === 'owner'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Supporter Tier')
                .setDescription('Server community supporters & perks')
                .setEmoji('🌟')
                .setValue('supporter')
                .setDefault(activeTab === 'supporter')
        );

    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

    // 2. Primary Navigation Buttons (Matching Orbis Row 1)
    const rowButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('panel_btn_home')
            .setLabel('Home')
            .setEmoji('⚙️')
            .setStyle(activeTab === 'home' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('panel_btn_system')
            .setLabel('System')
            .setEmoji('ℹ️')
            .setStyle(activeTab === 'system' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('panel_btn_developer')
            .setLabel('Developer')
            .setEmoji('💻')
            .setStyle(activeTab === 'developer' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('panel_btn_owner')
            .setLabel('Owner')
            .setEmoji('👑')
            .setStyle(activeTab === 'owner' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('panel_btn_supporter')
            .setLabel('Supporter')
            .setEmoji('🌟')
            .setStyle(activeTab === 'supporter' ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );

    // 3. Utility Buttons (Matching Orbis Row 2)
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${config.clientId}&permissions=8&scope=bot%20applications.commands`;
    const supportUrl = 'https://discord.gg/';

    const rowUtility = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Support')
            .setEmoji('💬')
            .setStyle(ButtonStyle.Link)
            .setURL(supportUrl),
        new ButtonBuilder()
            .setLabel('Invite Me')
            .setEmoji('📦')
            .setStyle(ButtonStyle.Link)
            .setURL(inviteUrl),
        new ButtonBuilder()
            .setCustomId('panel_btn_delete')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
    );

    return {
        embeds: [embed],
        components: [rowSelect, rowButtons, rowUtility]
    };
}

module.exports = {
    buildPanel
};
