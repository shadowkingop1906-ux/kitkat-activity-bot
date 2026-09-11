const { SlashCommandBuilder } = require('discord.js');
const { buildPanel } = require('../utils/panelBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays the interactive KitKat component panel and command manual.'),

    async execute(interaction) {
        const panelPayload = await buildPanel('home', interaction.client, interaction);
        await interaction.reply(panelPayload);
    }
};
