/**
 * Ultra-Aesthetic Cyberpunk & Geometric Typography Engine
 * Combines ornate symbol glyphs, full-width aesthetic typography,
 * animated Discord accents, and dynamic block meters.
 */

// Animated Emojis (Discord nitro/bot animated assets)
const Animated = {
    crown: '<a:crown_gold:1042784807493083166>',
    fire: '<a:fire_purple:1042784805798592532>',
    sparkles: '<a:sparkles_cyan:1042784803525287956>',
    voiceWave: '<a:voice_wave:1042784809284050965>',
    starSpin: '<a:star_spin:1042784811028889600>',
    gem: '<a:neon_gem:1042784812891168800>',
    arrow: '<a:neon_arrow:1042784814833139743>',
    ping: '<a:signal_pulse:1042784816766713876>',
    shield: '<a:cyber_shield:1042784818788368414>'
};

const Symbols = {
    // Cyber & Ornate Bullets
    crown: '👑',
    spark: '⟡',
    star: '✦',
    subStar: '✧',
    rhombus: '❖',
    diamond: '◈',
    diamondEmpty: '◇',
    target: '⌖',
    lightning: '⌁',
    benzene: '⌬',
    orbit: '✺',
    nova: '✹',
    leftBrace: '〔',
    rightBrace: '〕',
    leftBox: '【',
    rightBox: '】',
    leftAngle: '«',
    rightAngle: '»',
    pointer: '❯',
    doublePointer: '»',
    triangleRight: '►',
    triangleDown: '▼',

    // High-tech Frames & Borders
    frameTop: '╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮',
    frameBottom: '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
    borderDoubleH: '══════════════════════════════════════',
    borderSingleH: '──────────────────────────────────────',
    borderDashedH: '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄',
    vBar: '│',
    tBranch: '├─',
    cornerL: '└─',
    cornerRoundL: '╰─',
    treeBranch: '├──⌁',
    treeEnd: '└──⟡',

    // Progress Bar Glyphs
    meterFill: '▰',
    meterEmpty: '▱',
    blockFill: '■',
    blockEmpty: '□',

    // Ornate Rank Badges with full-width numerals
    ranks: {
        1: `${Animated.crown} ❖【 ０１ 】`,
        2: `⟢【 ０２ 】⟣`,
        3: `⟣【 ０３ 】⟢`,
        4: `⌖〔 ０４ 〕`,
        5: `⌖〔 ０５ 〕`,
        6: `⌖〔 ０６ 〕`,
        7: `⌖〔 ０７ 〕`,
        8: `⌖〔 ０８ 〕`,
        9: `⌖〔 ０９ 〕`,
        10: `⌖〔 １０ 〕`
    },

    // Sleek Color Themes
    colors: {
        primary: 0x0A0F1D,    // Midnight Cyber
        accent: 0x38BDF8,     // Neon Stealth Cyan
        gold: 0xFBBF24,       // Cyber Gold
        purple: 0xA855F7,     // Neon Purple
        emerald: 0x10B981,    // Emerald Pulse
        crimson: 0xF43F5E,    // Crimson Red
        slate: 0x1E293B       // Dark Slate
    }
};

/**
 * Converts English text to full-width aesthetic Japanese-style typography
 * e.g. "LEADERBOARD" -> "ＬＥＡＤＥＲＢＯＡＲＤ"
 */
function toAesthetic(text) {
    if (!text) return '';
    return text.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCharCode(code + 65248); // Uppercase A-Z
        if (code >= 97 && code <= 122) return String.fromCharCode(code + 65248); // Lowercase a-z
        if (code >= 48 && code <= 57) return String.fromCharCode(code + 65248); // Digits 0-9
        if (code === 32) return '  '; // Double space
        return char;
    }).join('');
}

/**
 * Creates an ultra-sleek cyberpunk progress meter
 * e.g. "▰▰▰▰▰▰▱▱▱▱  60%"
 */
function createSymbolProgressBar(value, max, size = 10) {
    if (max <= 0) return `${Symbols.meterEmpty.repeat(size)}  0%`;
    const ratio = Math.min(Math.max(value / max, 0), 1);
    const filled = Math.round(ratio * size);
    const empty = size - filled;
    const percentage = Math.round(ratio * 100);
    return `\`${Symbols.meterFill.repeat(filled)}${Symbols.meterEmpty.repeat(empty)}\` \`[ ${percentage}% ]\``;
}

/**
 * Formats duration with cyber styling
 * e.g. "12h 45m 20s"
 */
function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '00s';

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
    Animated,
    toAesthetic,
    createSymbolProgressBar,
    formatDuration
};
