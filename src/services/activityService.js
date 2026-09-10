const UserActivity = require('../database/models/UserActivity');
const { config } = require('../config/env');

// In-memory active voice sessions map for fast delta tracking: key: `${guildId}-${userId}` -> timestamp
const activeVoiceSessions = new Map();

/**
 * Increments message counter for a user in a guild
 * @param {string} guildId
 * @param {string} userId
 */
async function recordMessage(guildId, userId) {
    try {
        await UserActivity.findOneAndUpdate(
            { guildId, userId },
            {
                $inc: { messageCount: 1 },
                $set: { lastActive: new Date() }
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error(`[ ACTIVITY // ERROR ] Failed to record message for ${userId}:`, error.message);
    }
}

/**
 * Handle voice state updates: join, leave, move, deaf/undeaf
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
async function handleVoiceStateChange(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guildId = (newState.guild || oldState.guild).id;
    const userId = member.id;
    const sessionKey = `${guildId}-${userId}`;

    const isAfkChannel = (channelId) => {
        if (!config.ignoreAfk) return false;
        const guild = newState.guild || oldState.guild;
        return guild.afkChannelId && guild.afkChannelId === channelId;
    };

    const isEligibleForTracking = (state) => {
        if (!state.channelId) return false;
        if (isAfkChannel(state.channelId)) return false;
        if (!config.trackDeafened && (state.selfDeaf || state.serverDeaf)) return false;
        return true;
    };

    const wasEligible = isEligibleForTracking(oldState);
    const isNowEligible = isEligibleForTracking(newState);

    // 1. User became ineligible or left voice
    if (wasEligible && !isNowEligible) {
        const startTime = activeVoiceSessions.get(sessionKey);
        activeVoiceSessions.delete(sessionKey);

        if (startTime) {
            const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
            if (elapsedSeconds > 0) {
                try {
                    await UserActivity.findOneAndUpdate(
                        { guildId, userId },
                        {
                            $inc: { voiceTimeSeconds: elapsedSeconds },
                            $set: {
                                joinedVoiceAt: null,
                                currentVoiceChannelId: null,
                                lastActive: new Date()
                            }
                        },
                        { upsert: true }
                    );
                } catch (error) {
                    console.error(`[ VOICE // ERROR ] Failed to save voice session for ${userId}:`, error.message);
                }
            }
        }
    }

    // 2. User joined voice or became eligible (e.g. un-deafened)
    if (!wasEligible && isNowEligible) {
        const now = Date.now();
        activeVoiceSessions.set(sessionKey, now);

        try {
            await UserActivity.findOneAndUpdate(
                { guildId, userId },
                {
                    $set: {
                        joinedVoiceAt: new Date(now),
                        currentVoiceChannelId: newState.channelId,
                        lastActive: new Date(now)
                    }
                },
                { upsert: true }
            );
        } catch (error) {
            console.error(`[ VOICE // ERROR ] Failed to update voice start for ${userId}:`, error.message);
        }
    }

    // 3. User changed channel but remained eligible
    if (wasEligible && isNowEligible && oldState.channelId !== newState.channelId) {
        try {
            await UserActivity.findOneAndUpdate(
                { guildId, userId },
                { $set: { currentVoiceChannelId: newState.channelId } }
            );
        } catch (error) {
            console.error(`[ VOICE // ERROR ] Failed to update voice channel move for ${userId}:`, error.message);
        }
    }
}

/**
 * Flush all active voice sessions before shutdown or restart
 */
async function flushAllActiveVoiceSessions() {
    if (activeVoiceSessions.size === 0) return;

    console.log(`[ VOICE // FLUSH ] Flushing ${activeVoiceSessions.size} active voice session(s)...`);
    const now = Date.now();
    const updatePromises = [];

    for (const [sessionKey, startTime] of activeVoiceSessions.entries()) {
        const [guildId, userId] = sessionKey.split('-');
        const elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));

        if (elapsedSeconds > 0) {
            const p = UserActivity.findOneAndUpdate(
                { guildId, userId },
                {
                    $inc: { voiceTimeSeconds: elapsedSeconds },
                    $set: {
                        joinedVoiceAt: null,
                        currentVoiceChannelId: null,
                        lastActive: new Date()
                    }
                },
                { upsert: true }
            ).catch(err => console.error(`[ FLUSH // ERROR ] ${userId}:`, err.message));

            updatePromises.push(p);
        }
    }

    await Promise.all(updatePromises);
    activeVoiceSessions.clear();
    console.log('[ VOICE // FLUSH ] All active voice sessions persisted successfully.');
}

/**
 * Retrieve comprehensive statistics for a single user
 * @param {string} guildId
 * @param {string} userId
 */
async function getUserStats(guildId, userId) {
    let activity = await UserActivity.findOne({ guildId, userId }).lean();

    if (!activity) {
        activity = {
            guildId,
            userId,
            messageCount: 0,
            voiceTimeSeconds: 0,
            joinedVoiceAt: null,
            currentVoiceChannelId: null,
            lastActive: new Date()
        };
    }

    // Calculate live voice time if user is currently active in voice
    const sessionKey = `${guildId}-${userId}`;
    let liveVoiceSeconds = activity.voiceTimeSeconds;
    let isCurrentlyInVoice = false;

    if (activeVoiceSessions.has(sessionKey)) {
        const startTime = activeVoiceSessions.get(sessionKey);
        const liveElapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        liveVoiceSeconds += liveElapsed;
        isCurrentlyInVoice = true;
    }

    // Determine user rankings in guild
    const messageRank = await UserActivity.countDocuments({
        guildId,
        messageCount: { $gt: activity.messageCount }
    }) + 1;

    const voiceRank = await UserActivity.countDocuments({
        guildId,
        voiceTimeSeconds: { $gt: activity.voiceTimeSeconds }
    }) + 1;

    return {
        ...activity,
        totalVoiceSeconds: liveVoiceSeconds,
        isCurrentlyInVoice,
        messageRank,
        voiceRank
    };
}

module.exports = {
    recordMessage,
    handleVoiceStateChange,
    flushAllActiveVoiceSessions,
    getUserStats,
    activeVoiceSessions
};
