const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { config, validateConfig } = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./database/connection');
const { flushAllActiveVoiceSessions } = require('./services/activityService');
const { startHealthServer, stopHealthServer } = require('./server/healthServer');

// 1. Validate environment settings
validateConfig();

// 2. Initialize Discord client with required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// 3. Dynamically load command files
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`[ COMMAND // LOADED ] ${command.data.name}`);
        } else {
            console.warn(`[ COMMAND // WARNING ] ${file} is missing required data or execute property.`);
        }
    }
}

// 4. Dynamically load event files
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`[ EVENT // REGISTERED ] ${event.name}`);
    }
}

// 5. Graceful shutdown handler for Render & Docker container lifecycles
let isShuttingDown = false;

async function handleGracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[ SYSTEM // SHUTDOWN ] Received ${signal}. Starting graceful shutdown...`);

    try {
        // Persist all live voice channel durations
        await flushAllActiveVoiceSessions();

        // Close web health server
        stopHealthServer();

        // Disconnect MongoDB
        await disconnectDatabase();

        // Destroy Discord gateway connection
        client.destroy();
        console.log('[ SYSTEM // SHUTDOWN ] All resources cleanly decommissioned.');
        process.exit(0);
    } catch (error) {
        console.error('[ SYSTEM // ERROR ] Error during shutdown:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    console.error('[ RUNTIME // UNHANDLED REJECTION ]', reason);
});

process.on('uncaughtException', (error) => {
    console.error('[ RUNTIME // UNCAUGHT EXCEPTION ]', error);
});

// 6. Bootstrap application
async function bootstrap() {
    console.log('──────────────────────────────────────────────────');
    console.log('   ✦ DISCORD ACTIVITY TELEMETRY SYSTEM ✦         ');
    console.log('   Clean Architecture • MongoDB • Render Ready    ');
    console.log('──────────────────────────────────────────────────');

    // Connect to MongoDB
    const isDbConnected = await connectDatabase();
    if (!isDbConnected) {
        console.warn('[ BOOTSTRAP // WARN ] Proceeding with caution without database connection.');
    }

    // Start Render health check web server
    startHealthServer(client);

    // Login to Discord
    if (config.discordToken) {
        try {
            await client.login(config.discordToken);
        } catch (error) {
            console.error('[ DISCORD // FATAL ] Failed to login to Discord:', error.message);
        }
    } else {
        console.warn('[ DISCORD // HALT ] DISCORD_TOKEN is empty. Set it in .env to login.');
    }
}

bootstrap();
