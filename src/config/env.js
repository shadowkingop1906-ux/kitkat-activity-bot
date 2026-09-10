const dotenv = require('dotenv');

dotenv.config();

const config = {
    discordToken: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    guildId: process.env.GUILD_ID || '',
    mongoUri: process.env.MONGODB_URI || '',
    port: parseInt(process.env.PORT || '3000', 10),
    trackDeafened: process.env.TRACK_DEAFENED_USERS === 'true',
    ignoreAfk: process.env.IGNORE_AFK_CHANNEL !== 'false',
    nodeEnv: process.env.NODE_ENV || 'development'
};

function validateConfig() {
    const missing = [];
    if (!config.discordToken) missing.push('DISCORD_TOKEN');
    if (!config.clientId) missing.push('CLIENT_ID');
    if (!config.mongoUri) missing.push('MONGODB_URI');

    if (missing.length > 0) {
        console.warn(`[ CONFIG // WARNING ] Missing environment variables: ${missing.join(', ')}`);
        console.warn(`[ CONFIG // NOTICE ] Please populate them in your .env file or Render dashboard.`);
    }

    return config;
}

module.exports = {
    config,
    validateConfig
};
