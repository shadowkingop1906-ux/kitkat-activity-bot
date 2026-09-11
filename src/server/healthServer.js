const express = require('express');
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const { config } = require('../config/env');
const { formatDuration } = require('../config/symbols');

let serverInstance = null;
let keepAliveInterval = null;

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
        res.status(200).send('OK - ALIVE');
    });

    const port = config.port || 3000;
    serverInstance = app.listen(port, () => {
        console.log(`[ WEB SERVER // READY ] Health check server listening on port ${port}`);
        
        // Start Self-Ping / Keep-Alive mechanism to prevent Render from sleeping
        initSelfPinger(port);
    });

    return serverInstance;
}

/**
 * Self-Ping mechanism for Render Free Tier (pings every 8 minutes)
 * Render provides process.env.RENDER_EXTERNAL_URL automatically.
 */
function initSelfPinger(port) {
    if (keepAliveInterval) clearInterval(keepAliveInterval);

    // 8 minutes = 480,000 ms (Render free sleeps at 15 minutes of inactivity)
    const INTERVAL_MS = 8 * 60 * 1000;

    keepAliveInterval = setInterval(() => {
        const targetUrl = process.env.RENDER_EXTERNAL_URL 
            ? `${process.env.RENDER_EXTERNAL_URL}/health`
            : `http://localhost:${port}/health`;

        const isHttps = targetUrl.startsWith('https://');
        const requester = isHttps ? https : http;

        requester.get(targetUrl, (res) => {
            if (res.statusCode === 200) {
                console.log(`[ KEEP-ALIVE // HEARTBEAT ] Self-ping successful to ${targetUrl} (Render Sleep Prevented)`);
            } else {
                console.warn(`[ KEEP-ALIVE // WARN ] Self-ping status: ${res.statusCode}`);
            }
        }).on('error', (err) => {
            console.error(`[ KEEP-ALIVE // ERROR ] Failed self-ping: ${err.message}`);
        });

    }, INTERVAL_MS);

    console.log(`[ KEEP-ALIVE // ACTIVE ] Self-pinger started (Cycle: every 8 minutes).`);
}

function stopHealthServer() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
    if (serverInstance) {
        serverInstance.close();
        console.log('[ WEB SERVER // CLOSED ] Health check server stopped.');
    }
}

module.exports = {
    startHealthServer,
    stopHealthServer
};
