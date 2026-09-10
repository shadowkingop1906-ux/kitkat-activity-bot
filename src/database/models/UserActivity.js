const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema(
    {
        guildId: {
            type: String,
            required: true,
            index: true
        },
        userId: {
            type: String,
            required: true,
            index: true
        },
        messageCount: {
            type: Number,
            default: 0,
            index: true
        },
        voiceTimeSeconds: {
            type: Number,
            default: 0,
            index: true
        },
        joinedVoiceAt: {
            type: Date,
            default: null
        },
        currentVoiceChannelId: {
            type: String,
            default: null
        },
        lastActive: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Compound indexes for lightning fast leaderboard queries
UserActivitySchema.index({ guildId: 1, userId: 1 }, { unique: true });
UserActivitySchema.index({ guildId: 1, messageCount: -1 });
UserActivitySchema.index({ guildId: 1, voiceTimeSeconds: -1 });

module.exports = mongoose.model('UserActivity', UserActivitySchema);
