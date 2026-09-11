/**
 * Clean & Professional Typography & Component Utility Engine
 * Inspired by modern Discord UI bots (Orbis / Sapphire).
 */

// Custom Small-Caps Font Dictionary for clean, non-cluttered headers
const smallCapsMap = {
    'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
    'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
    's': 'ꜱ', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
    'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ꜰ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
    'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
    'S': 'ꜱ', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ',
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'
};

/**
 * Converts text into sleek Discord Small Caps font
 * e.g. "KitKat Protocol" -> "ᴋɪᴛᴋᴀᴛ ᴘʀᴏᴛᴏᴄᴏʟ"
 */
function toSmallCaps(text) {
    if (!text) return '';
    return text.split('').map(c => smallCapsMap[c] || c).join('');
}

const Symbols = {
    // Clean Bullet Points & Pointers
    bullet: '•',
    arrow: '›',
    subArrow: '▸',
    dot: '·',
    pipe: '│',
    dash: '─',
    
    // Status Badges
    online: '🟢',
    idle: '🟡',
    offline: '⚪',
    active: '⚡',
    crown: '👑',
    verified: '🛡️',
    star: '⭐',
    sparkle: '✨',
    gear: '⚙️',
    info: 'ℹ️',
    dev: '💻',
    owner: '👑',
    supporter: '🌟',
    voice: '🎙️',
    chat: '💬',
    ping: '📡',
    trash: '🗑️',
    link: '↗',

    // Ranks with clean medal icons
    ranks: {
        1: '🥇',
        2: '🥈',
        3: '🥉',
        4: '`#4`',
        5: '`#5`',
        6: '`#6`',
        7: '`#7`',
        8: '`#8`',
        9: '`#9`',
        10: '`#10`'
    },

    // Modern High-Contrast Hex Color Palette
    colors: {
        primary: 0x2B82D9,    // Orbis Sleek Blue
        accent: 0x5865F2,     // Blurple
        success: 0x57F287,    // Emerald Green
        warning: 0xFEE75C,    // Amber Gold
        danger: 0xED4245,     // Soft Red
        dark: 0x2B2D31,       // Discord Embedded Dark
        slate: 0x1E1F22       // Deep Background
    }
};

/**
 * Clean & minimal progress meter
 * e.g. "▰▰▰▰▰▱▱▱▱▱ 50%"
 */
function createSymbolProgressBar(value, max, size = 10) {
    if (max <= 0) return `\`▱▱▱▱▱▱▱▱▱▱\` 0%`;
    const ratio = Math.min(Math.max(value / max, 0), 1);
    const filled = Math.round(ratio * size);
    const empty = size - filled;
    const percentage = Math.round(ratio * 100);
    return `\`${'▰'.repeat(filled)}${'▱'.repeat(empty)}\` \`${percentage}%\``;
}

/**
 * Human-readable duration formatter
 */
function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0s';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (parts.length === 0 || (days === 0 && hours === 0 && secs > 0)) {
        parts.push(`${secs}s`);
    }

    return parts.join(' ');
}

module.exports = {
    Symbols,
    toSmallCaps,
    toAesthetic: toSmallCaps, // Backward-compat fallback
    Animated: {},
    createSymbolProgressBar,
    formatDuration
};
