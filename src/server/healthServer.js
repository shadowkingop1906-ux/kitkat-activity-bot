const express = require('express');
const mongoose = require('mongoose');
const { config } = require('../config/env');
const { formatDuration } = require('../config/symbols');

let serverInstance = null;

function startHealthServer(client) {
    const app = express();

    app.get('/', (req, res) => {
        const isDbReady = mongoose.connection.readyState === 1;
        res.status(200).json({
            status: 'operational',
            bot: client.user ? client.user.tag : 'initializing',
            guilds: client.guilds ? client.guilds.cache.size : 0,
            database: isDbReady ? 'connected' : 'disconnected',
            uptime: formatDuration(Math.floor(process.uptime())),
            timestamp: new Date().toISOString()
        });
    });

    app.get('/health', (req, res) => {
        res.status(200).send('OK');
    });

    const port = config.port || 3000;
    serverInstance = app.listen(port, () => {
        console.log(`[ WEB SERVER // READY ] Health check server listening on port ${port}`);
    });

    return serverInstance;
}

function stopHealthServer() {
    if (serverInstance) {
        serverInstance.close();
        console.log('[ WEB SERVER // CLOSED ] Health check server stopped.');
    }
}

module.exports = {
    startHealthServer,
    stopHealthServer
};
