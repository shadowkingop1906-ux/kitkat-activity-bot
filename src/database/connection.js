const mongoose = require('mongoose');
const { config } = require('../config/env');

let isConnected = false;

async function connectDatabase() {
    if (!config.mongoUri) {
        console.error('[ DATABASE // ERROR ] MONGODB_URI is not defined in environment variables.');
        return false;
    }

    if (isConnected) {
        return true;
    }

    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(config.mongoUri, {
            autoIndex: true,
            serverSelectionTimeoutMS: 10000
        });

        isConnected = true;
        console.log('[ DATABASE // READY ] Connected successfully to MongoDB Atlas.');

        mongoose.connection.on('error', (err) => {
            console.error('[ DATABASE // ERROR ] MongoDB connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            console.warn('[ DATABASE // DISCONNECTED ] MongoDB connection lost. Attempting reconnect...');
        });

        return true;
    } catch (error) {
        console.error('[ DATABASE // FATAL ] Failed to connect to MongoDB:', error.message);
        return false;
    }
}

async function disconnectDatabase() {
    if (isConnected) {
        await mongoose.disconnect();
        isConnected = false;
        console.log('[ DATABASE // CLOSED ] MongoDB connection closed cleanly.');
    }
}

module.exports = {
    connectDatabase,
    disconnectDatabase
};
