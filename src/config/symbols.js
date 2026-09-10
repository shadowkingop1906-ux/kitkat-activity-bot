/**
 * Professional Aesthetic Symbol Font Palette
 * Clean, minimalist, and geometric typography for Discord embeds.
 * No emojis used.
 */

const Symbols = {
    // Hierarchy & Dividers
    line: '━',
    divider: '──────────────────────────────────',
    subDivider: '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄',
    bullet: '✦',
    subBullet: '✧',
    diamond: '◈',
    diamondEmpty: '◇',
    pointer: '❯',
    doublePointer: '»',
    hexagon: '⬡',
    hexagonFilled: '⬢',
    square: '■',
    squareEmpty: '□',
    triangle: '▲',
    triangleRight: '►',
    circle: '●',
    circleEmpty: '○',
    cross: '✕',
    check: '✓',
    cornerTopLeft: '┌',
    cornerBottomLeft: '└',
    verticalBar: '│',
    tBranch: '├',

    // Ranks formatted with aesthetic numerals
    ranks: {
        1: '◈ [01]',
        2: '◈ [02]',
        3: '◈ [03]',
        4: '❯ [04]',
        5: '❯ [05]',
        6: '❯ [06]',
        7: '❯ [07]',
        8: '❯ [08]',
        9: '❯ [09]',
        10: '❯ [10]'
    },

    // Embed Accent Colors (Dark, sleek, cyber slate)
    colors: {
        primary: 0x0F172A,   // Deep slate
        accent: 0x38BDF8,    // Stealth Cyan
        success: 0x10B981,   // Emerald
        warning: 0xF59E0B,   // Amber
        error: 0xEF4444,     // Crimson
        secondary: 0x64748B  // Muted gray
    }
};

/**
 * Creates a visual progress bar using symbol blocks
 * @param {number} value Current value
 * @param {number} max Maximum value
 * @param {number} size Bar length in characters
 * @returns {string} Progress bar e.g. "■■■■■□□□□□"
 */
function createSymbolProgressBar(value, max, size = 10) {
    if (max <= 0) return Symbols.squareEmpty.repeat(size);
    const progress = Math.min(Math.max(value / max, 0), 1);
    const filledCount = Math.round(progress * size);
    const emptyCount = size - filledCount;
    return Symbols.square.repeat(filledCount) + Symbols.squareEmpty.repeat(emptyCount);
}

/**
 * Formats seconds into clean readable duration (e.g. "12h 45m 20s" or "3d 4h")
 * @param {number} seconds
 * @returns {string}
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
    createSymbolProgressBar,
    formatDuration
};
