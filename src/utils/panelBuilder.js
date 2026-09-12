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
                `### ⚡ **${toSmallCaps('KitKat Core Protocol')}**\n\n` +
                `> 👑 **${toSmallCaps('Owner')}:** <@${ownerId}>\n` +
                `> 🏷️ **${toSmallCaps('Prefix')}:** \` ${prefix} \`  •  🟢 **${toSmallCaps('Status')}:** \` Online \`\n` +
                `> 📊 **${toSmallCaps('Engine')}:** \` Realtime Voice & Chat Telemetry \`\n\n` +
                `*A high-performance telemetry engine recording voice activity, chat volume, and server rankings.*\n\n` +
                `───────────────────────────────────\n\n` +
                `### 📋 **${toSmallCaps('Command Matrix')}**\n\n` +
                `▸ **\`/stats\`** ᴏʀ **\`${prefix}stats [@user]\`**\n` +
                `╰─› *Inspect member voice hours, chat volume & rank dossier.*\n\n` +
                `▸ **\`/leaderboard\`** ᴏʀ **\`${prefix}lb\`**\n` +
                `╰─› *Interactive server rankings with realtime tabs for voice & text.*\n\n` +
                `▸ **\`/ping\`** ᴏʀ **\`${prefix}ping\`**\n` +
                `╰─› *Realtime WebSocket latency gauge, host memory footprint & uptime.*\n\n` +
                `▸ **\`/help\`** ᴏʀ **\`${prefix}help\`**\n` +
                `╰─› *Open this interactive component navigation panel.*\n\n` +
                `───────────────────────────────────\n` +
                `*Select a tab from the buttons or dropdown menu below to inspect details.*`
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
                `### 📡 **${toSmallCaps('System Diagnostics & Telemetry')}**\n\n` +
                `> ⚡ **${toSmallCaps('Gateway Ping')}:** \` ${wsPing} \`\n` +
                `> 🌐 **${toSmallCaps('Host Uptime')}:** \` ${uptime} \`\n\n` +
                `> 💾 **${toSmallCaps('Memory Footprint')}:** \` ${memoryMB} MB \`\n` +
                `> 🟢 **${toSmallCaps('Database Cluster')}:** \` MongoDB Atlas [Connected] \`\n\n` +
                `> ⚙️ **${toSmallCaps('Node.js Engine')}:** \` ${process.version} \`\n` +
                `> 📦 **${toSmallCaps('Discord.js')}:** \` v14.17.3 \`\n\n` +
                `> 🛡️ **${toSmallCaps('Guilds Monitored')}:** \` ${guildCount.toLocaleString()} Servers \`\n` +
                `> 👥 **${toSmallCaps('Total Members')}:** \` ${totalMembers.toLocaleString()} Users \`\n\n` +
                `───────────────────────────────────\n` +
                `*Host environment is operational and synchronizing background metrics.*`
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
                `### 💻 **${toSmallCaps('Developer & Core Architecture')}**\n\n` +
                `> 🛠️ **${toSmallCaps('Lead Architecture')}:** Google DeepMind / Antigravity AGY\n` +
                `> 🏛️ **${toSmallCaps('Design Pattern')}:** Clean Hexagonal Architecture (Node.js)\n` +
                `> 🗄️ **${toSmallCaps('Database Layer')}:** Mongoose ORM / MongoDB Atlas\n` +
                `> 💓 **${toSmallCaps('Keep-Alive Service')}:** Express HTTP Microservice (8m Heartbeat)\n` +
                `> 🎛️ **${toSmallCaps('Component Framework')}:** Discord Component V2 ActionRows & Selects\n` +
                `> 📂 **${toSmallCaps('Open Source Repo')}:** [GitHub Repository](https://github.com/shadowkingop1906-ux/kitkat-activity-bot)\n\n` +
                `───────────────────────────────────\n` +
                `*Engineered for 24/7 uptime with automated session recovery.*`
            )
            .setFooter({
                text: `${toSmallCaps('KitKat Dev Team')} • Enterprise Architecture`
            })
            .setTimestamp();
    } else if (activeTab === 'owner') {
        embed
            .setAuthor({
                name: `${toSmallCaps('KitKat Owner Directory')}`,
                iconURL: ownerAvatar
            })
            .setThumbnail(ownerAvatar)
            .setDescription(
                `### 👑 **${toSmallCaps('KitKat Owner')}**\n\n` +
                `> 👑 **${toSmallCaps('Primary Owner')}:** ${ownerName}\n` +
                `> 🆔 **${toSmallCaps('User ID')}:** \` ${ownerId} \`\n\n` +
                `> 🛡️ **${toSmallCaps('Root Operator')}:** Verified\n` +
                `> ⚡ **${toSmallCaps('Access Level')}:** \` Full Administrative & Cluster Access \`\n\n` +
                `───────────────────────────────────\n` +
                `*Authorized to execute root telemetry maintenance and cluster commands.*`
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
                `### 🌟 **${toSmallCaps('Supporters & Contributors')}**\n\n` +
                `> ✨ **${toSmallCaps('Server Communities')}:** Special thanks to all active guilds utilizing KitKat Engine!\n\n` +
                `> 🎁 **${toSmallCaps('Supporter Perks')}:**\n` +
                `> • Custom profile telemetry badge\n` +
                `> • Priority database synchronization\n` +
                `> • Verified supporter role in our community\n\n` +
                `> 💬 **${toSmallCaps('Get Involved')}:** Click the Support button below to join the official guild!\n\n` +
                `───────────────────────────────────\n` +
                `*Thank you for supporting continuous development and hosting!*`
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
                .setDescription('Commands matrix & general protocol')
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

    // 2. Navigation Buttons (Row 1: 4 Category Buttons)
    const rowButtonsTop = new ActionRowBuilder().addComponents(
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
            .setStyle(activeTab === 'owner' ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );

    // 3. Navigation Buttons (Row 2: 4 Action & Link Buttons)
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${config.clientId}&permissions=8&scope=bot%20applications.commands`;
    const supportUrl = 'https://discord.gg/';

    const rowButtonsBottom = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('panel_btn_supporter')
            .setLabel('Supporter')
            .setEmoji('🌟')
            .setStyle(activeTab === 'supporter' ? ButtonStyle.Primary : ButtonStyle.Secondary),
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
            .setLabel('Close')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
    );

    return {
        embeds: [embed],
        components: [rowSelect, rowButtonsTop, rowButtonsBottom]
    };
}

module.exports = {
    buildPanel
};
