// Illustrated badges in one style: a round "sticker" with a soft background, flat shapes, gentle highlights.
// 64×64 grid. Tribes follow the flags of Bamidbar Rabbah 2:7; days follow Bereishis 1–2.

let uid = 0;
const petals = (cx, cy, r, n, pr, fill) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  return `<circle cx="${(cx + r * Math.sin(a)).toFixed(1)}" cy="${(cy - r * Math.cos(a)).toFixed(1)}" r="${pr}" fill="${fill}"/>`;
}).join('');
const rays = (cx, cy, r1, r2, n, fill, w = 3) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2, a1 = a - w / 100, a2 = a + w / 100;
  const p = (r, t) => `${(cx + r * Math.sin(t)).toFixed(1)} ${(cy - r * Math.cos(t)).toFixed(1)}`;
  return `<path d="M${p(r1, a1)} L${p(r2, a)} L${p(r1, a2)}Z" fill="${fill}"/>`;
}).join('');
const wave = (y, fill, amp = 3) => `<path d="M0 ${y} q8 -${amp} 16 0 t16 0 t16 0 t16 0 V64 H0z" fill="${fill}"/>`;
const star = (x, y, r = 1.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`;

const ART = {
  // ----- Tribes -----
  lion: { bg: ['#d8e6f6', '#a9c4e8'], body: () => `
    ${petals(32, 35, 16, 16, 6.5, '#c87a2c')}<circle cx="32" cy="35" r="16" fill="#db8d35"/>
    <circle cx="23" cy="24.5" r="4.2" fill="#f0c26a"/><circle cx="41" cy="24.5" r="4.2" fill="#f0c26a"/>
    <circle cx="23" cy="24.5" r="2" fill="#dd9e4c"/><circle cx="41" cy="24.5" r="2" fill="#dd9e4c"/>
    <circle cx="32" cy="34" r="11.5" fill="#f3c873"/>
    <ellipse cx="32" cy="39.5" rx="6.8" ry="5" fill="#fbe6bd"/>
    <ellipse cx="27.5" cy="32" rx="1.7" ry="2" fill="#3b2a1a"/><ellipse cx="36.5" cy="32" rx="1.7" ry="2" fill="#3b2a1a"/>
    <path d="M29.5 36.3h5l-2.5 2.8z" fill="#6b3b22"/><path d="M32 39v1.6M29.4 41.6q2.6 2 5.2 0" stroke="#6b3b22" stroke-width="1.3" fill="none" stroke-linecap="round"/>` },
  sunmoon: { bg: ['#383d6b', '#1c1f3d'], body: () => `
    ${star(14, 46)}${star(50, 18, 1.1)}${star(46, 52, 1)}${star(12, 16, 1)}
    ${rays(24, 25, 10, 16, 10, '#ffbf3c', 9)}<circle cx="24" cy="25" r="9" fill="#ffd25a"/><circle cx="21.5" cy="22.5" r="3" fill="#ffe58e"/>
    <circle cx="41" cy="41" r="10" fill="#f4ecd0"/><circle cx="45.5" cy="36.5" r="9" fill="#2b2f58"/>` },
  ship: { bg: ['#f1f6f9', '#d2e3ee'], body: () => `
    ${wave(46, '#4a8ccc')}${wave(51, '#3a74b4', 2.5)}
    <path d="M14 40h36l-5.5 8.5H19.5z" fill="#8a5a32"/><path d="M14 40h36l-1 1.6H15z" fill="#a8744a"/>
    <rect x="31" y="12" width="2.2" height="28" rx="1" fill="#6b4426"/>
    <path d="M33.5 15L48 37.5H33.5z" fill="#fff"/><path d="M30.6 19L17.5 37.5h13.1z" fill="#f3ecdc"/>
    <path d="M33 12l7 2.3-7 2.3z" fill="#d0503a"/>` },
  mandrake: { bg: ['#f8dcd6', '#ecb2a8'], body: () => `
    <path d="M6 50q26-7 52 0V64H6z" fill="#8a5a32"/>
    <ellipse cx="25" cy="27" rx="5" ry="12" transform="rotate(-30 25 27)" fill="#4f9a4a"/>
    <ellipse cx="39" cy="27" rx="5" ry="12" transform="rotate(30 39 27)" fill="#4f9a4a"/>
    <ellipse cx="32" cy="23" rx="4.5" ry="12" fill="#6fb85f"/>
    <path d="M32 33l-7 10M32 33l7 10" stroke="#3e7a3a" stroke-width="2" stroke-linecap="round"/>
    <circle cx="24" cy="45" r="6.3" fill="#e2672c"/><circle cx="40" cy="45" r="6.3" fill="#e2672c"/>
    <circle cx="22" cy="43" r="1.8" fill="#f6a06a"/><circle cx="38" cy="43" r="1.8" fill="#f6a06a"/>` },
  city: { bg: ['#d9eddf', '#aed4b8'], body: () => `
    <path d="M0 52h64v12H0z" fill="#7aa86a"/>
    <path d="M10 52V30h5v-4h4v4h4v-9h4v-3h4v3h4v9h4v-4h4v4h4v22z" fill="#e3cfa2"/>
    <path d="M10 52V30h5v-4h4v4h4v-9h4v-3h4v3h4v9h4v-4h4v4h4v22z" fill="none" stroke="#b79d6c" stroke-width="1.2"/>
    <path d="M27.5 52v-8a4.5 4.5 0 0 1 9 0v8z" fill="#5a4632"/>
    <rect x="15" y="35" width="3" height="4" rx="1.5" fill="#8b7350"/><rect x="46" y="35" width="3" height="4" rx="1.5" fill="#8b7350"/>
    <rect x="30.5" y="24" width="3" height="4" rx="1.5" fill="#8b7350"/>
    <path d="M32 18v-6l6 2-6 2" fill="#3d7a4c" stroke="#3d7a4c" stroke-width="1"/>` },
  camp: { bg: ['#ededf0', '#c9c9d2'], body: () => `
    <path d="M0 50h64v14H0z" fill="#b89f78"/>
    <path d="M4 50L15 33l11 17z" fill="#c69d61"/><path d="M38 50l11-17 11 17z" fill="#c69d61"/>
    <path d="M16 50L32 24l16 26z" fill="#ead2a0"/><path d="M32 24l16 26H32z" fill="#d9bb83"/>
    <path d="M28.5 50l3.5-9 3.5 9z" fill="#7d5b33"/>
    <rect x="31.2" y="12" width="1.6" height="13" fill="#3a3a3a"/>
    <path d="M32.8 12.5h9l-2.5 3 2.5 3h-9z" fill="#1d1d1f"/><path d="M32.8 15.5h6.5" stroke="#f2efe6" stroke-width="1.4"/>` },
  ox: { bg: ['#55555c', '#26262b'], body: () => `
    <path d="M18 24q-9 1-11-8" stroke="#efe3c4" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path d="M46 24q9 1 11-8" stroke="#efe3c4" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="14" cy="30" rx="5" ry="3" fill="#7a4d30"/><ellipse cx="50" cy="30" rx="5" ry="3" fill="#7a4d30"/>
    <path d="M18 26c0-6 6-8 14-8s14 2 14 8c0 10-4 22-14 22S18 36 18 26z" fill="#9a6440"/>
    <path d="M27 20q5 4 10 0" stroke="#b27b52" stroke-width="2" fill="none"/>
    <ellipse cx="32" cy="43" rx="8.5" ry="6" fill="#ecb9a2"/>
    <ellipse cx="29" cy="43.5" rx="1.4" ry="2" fill="#7a4033"/><ellipse cx="35" cy="43.5" rx="1.4" ry="2" fill="#7a4033"/>
    <circle cx="25.5" cy="30" r="2" fill="#2a1a10"/><circle cx="38.5" cy="30" r="2" fill="#2a1a10"/>` },
  reem: { bg: ['#4a4a52', '#1f1f24'], body: () => `
    <path d="M26 22L19 5" stroke="#efe3c4" stroke-width="4" stroke-linecap="round"/><path d="M38 22l7-17" stroke="#efe3c4" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="15" cy="31" rx="5" ry="2.8" fill="#4e3322" transform="rotate(-12 15 31)"/><ellipse cx="49" cy="31" rx="5" ry="2.8" fill="#4e3322" transform="rotate(12 49 31)"/>
    <path d="M19 28c0-6 6-8 13-8s13 2 13 8c0 10-4 21-13 21S19 38 19 28z" fill="#6b4630"/>
    <path d="M24 22q8 5 16 0" stroke="#8a5d40" stroke-width="3" fill="none"/>
    <ellipse cx="32" cy="44" rx="7.5" ry="5.5" fill="#c99a80"/>
    <ellipse cx="29.5" cy="44.5" rx="1.3" ry="1.8" fill="#5a2f25"/><ellipse cx="34.5" cy="44.5" rx="1.3" ry="1.8" fill="#5a2f25"/>
    <circle cx="26" cy="31" r="1.9" fill="#f3e7c8"/><circle cx="38" cy="31" r="1.9" fill="#f3e7c8"/><circle cx="26" cy="31" r="1" fill="#1a100a"/><circle cx="38" cy="31" r="1" fill="#1a100a"/>` },
  wolf: { bg: ['#f4e7d7', '#d9c7e4'], body: () => `
    <path d="M14 12l10 14h16l10-14 0 20-18 22-18-22z" fill="#8f949e"/>
    <path d="M17 17l6 9-6 3z" fill="#f2c9c2"/><path d="M47 17l-6 9 6 3z" fill="#f2c9c2"/>
    <path d="M22 34l10 20 10-20-10 4z" fill="#f2f2f2"/>
    <path d="M14 32l18 22 18-22-3 0-15 17-15-17z" fill="#767b86"/>
    <ellipse cx="25" cy="31" rx="2.6" ry="2" fill="#f2c94c"/><ellipse cx="39" cy="31" rx="2.6" ry="2" fill="#f2c94c"/>
    <circle cx="25" cy="31" r="1" fill="#222"/><circle cx="39" cy="31" r="1" fill="#222"/>
    <path d="M29.5 47h5l-2.5 3z" fill="#2a2a2e"/>` },
  snake: { bg: ['#d3ddf5', '#9fb3e6'], body: () => `
    <path d="M10 52c-4-8 8-12 18-10s22 0 20-10-16-8-12-18" stroke="#2f7d4a" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M10 52c-4-8 8-12 18-10s22 0 20-10-16-8-12-18" stroke="#7cc58a" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="1 5"/>
    <ellipse cx="37" cy="13" rx="6.5" ry="5" fill="#2f7d4a"/>
    <circle cx="39" cy="11.5" r="1.4" fill="#ffe27a"/><circle cx="39.3" cy="11.5" r=".6" fill="#111"/>
    <path d="M43 14l5 1.5M43 14l4.5-2" stroke="#d0403a" stroke-width="1.4" stroke-linecap="round"/>` },
  olive: { bg: ['#f7f1e5', '#e6d8bc'], body: () => `
    <path d="M6 54q26-5 52 0V64H6z" fill="#b9a27a"/>
    <path d="M30 54c1-8 0-14-3-20M34 54c-1-8 1-13 5-18" stroke="#7a5232" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="22" cy="26" r="10" fill="#6f9a4a"/><circle cx="42" cy="25" r="10" fill="#6f9a4a"/><circle cx="32" cy="19" r="11" fill="#86b25a"/><circle cx="32" cy="30" r="9" fill="#7aa652"/>
    <ellipse cx="24" cy="24" rx="1.8" ry="2.4" fill="#3d4a2a"/><ellipse cx="38" cy="20" rx="1.8" ry="2.4" fill="#3d4a2a"/><ellipse cx="31" cy="28" rx="1.8" ry="2.4" fill="#3d4a2a"/><ellipse cx="43" cy="29" rx="1.8" ry="2.4" fill="#3d4a2a"/><ellipse cx="29" cy="16" rx="1.8" ry="2.4" fill="#3d4a2a"/>` },
  deer: { bg: ['#f5dfe3', '#e2b4be'], body: () => `
    <path d="M25 24C21 18 15 15 11 8M17 15l-7 1M21 19l-4 4M39 24c4-6 10-9 14-16M47 15l7 1M43 19l4 4" stroke="#7a5232" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="19" cy="30" rx="6" ry="3" transform="rotate(-20 19 30)" fill="#b77a45"/><ellipse cx="45" cy="30" rx="6" ry="3" transform="rotate(20 45 30)" fill="#b77a45"/>
    <path d="M24 30c0-5 4-8 8-8s8 3 8 8c0 9-3 20-8 20s-8-11-8-20z" fill="#c98e55"/>
    <ellipse cx="32" cy="45" rx="4.5" ry="5" fill="#f1dcc0"/><ellipse cx="32" cy="48" rx="2.2" ry="1.6" fill="#3a2418"/>
    <circle cx="28" cy="32" r="1.8" fill="#2a1a10"/><circle cx="36" cy="32" r="1.8" fill="#2a1a10"/>
    <circle cx="29" cy="38" r="1" fill="#f6e6d0"/><circle cx="35" cy="37" r="1" fill="#f6e6d0"/>` },

  // ----- Days of Creation -----
  light: { bg: ['#2c3263', '#151935'], body: (id) => `
    <defs><radialGradient id="glow${id}"><stop offset="0" stop-color="#fff8dc"/><stop offset=".35" stop-color="#ffe9a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient></defs>
    <circle cx="32" cy="32" r="26" fill="url(#glow${id})"/>${rays(32, 32, 8, 24, 12, '#fff3c4', 6)}<circle cx="32" cy="32" r="6" fill="#fff"/>` },
  firmament: { bg: ['#cfe6f7', '#a6cdee'], body: () => `
    <path d="M0 0h64v22H0z" fill="#9cc8ec"/>${wave(19, '#7fb6e6')}
    <path d="M0 33h64v31H0z" fill="#3f7fc1"/>${wave(40, '#336ca8')}${wave(50, '#2a5b90')}
    <path d="M0 29.5h64" stroke="#fff" stroke-width="5"/><path d="M0 29.5h64" stroke="#e9f3fb" stroke-width="2"/>` },
  plants: { bg: ['#e4f2f8', '#c6e3ef'], body: () => `
    <path d="M0 46q32-6 64 0V64H0z" fill="#8a5a32"/>
    <path d="M32 46V22" stroke="#3e7a3a" stroke-width="2.5"/>
    <ellipse cx="25" cy="32" rx="8" ry="4" transform="rotate(-25 25 32)" fill="#5fae55"/><ellipse cx="39" cy="27" rx="8" ry="4" transform="rotate(25 39 27)" fill="#4f9a4a"/>
    <circle cx="32" cy="19" r="4" fill="#f2c94c"/>${petals(32, 19, 5, 6, 2.6, '#f28fa0')}<circle cx="32" cy="19" r="2.6" fill="#f2c94c"/>
    <path d="M14 46c0-5 2-8 5-10M50 46c0-5-2-8-5-10" stroke="#5fae55" stroke-width="3" fill="none" stroke-linecap="round"/>` },
  lights: { bg: ['#2f3567', '#171a37'], body: () => `
    ${star(46, 14)}${star(52, 28, 1)}${star(14, 48, 1)}${star(30, 52, 1.2)}${star(50, 50, 1)}
    ${rays(22, 24, 9, 14, 10, '#ffbf3c', 9)}<circle cx="22" cy="24" r="8" fill="#ffd25a"/>
    <circle cx="42" cy="40" r="9" fill="#f4ecd0"/><circle cx="46" cy="36" r="8" fill="#282d5a"/>` },
  fishbirds: { bg: ['#e6f3fa', '#c3e2f3'], body: () => `
    <path d="M0 36h64v28H0z" fill="#5fa6db"/>${wave(36, '#5fa6db', 3)}
    <path d="M14 48c6-7 16-7 22 0-6 7-16 7-22 0z" fill="#f08a3c"/><path d="M36 48l8-6v12z" fill="#e0702e"/>
    <circle cx="20" cy="46.5" r="1.4" fill="#222"/><path d="M26 44q2 4 0 8" stroke="#f6b07a" stroke-width="1.4" fill="none"/>
    <path d="M18 18q4-4 8 0q4-4 8 0" stroke="#33364d" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M38 12q2.5-2.5 5 0q2.5-2.5 5 0" stroke="#33364d" stroke-width="2" fill="none" stroke-linecap="round"/>` },
  man: { bg: ['#eef6e8', '#cfe6c2'], body: () => `
    <path d="M0 48q32-10 64 0V64H0z" fill="#8bc06a"/>
    <ellipse cx="46" cy="47" rx="8" ry="5.5" fill="#fbfbf7"/><circle cx="41" cy="44" r="3.2" fill="#fbfbf7"/><circle cx="52" cy="44" r="3" fill="#3a3a3a"/>
    <path d="M44 51v4M49 51v4" stroke="#3a3a3a" stroke-width="1.6"/>
    <circle cx="24" cy="18" r="6" fill="#e9b98f"/>
    <path d="M16 46c0-12 3-20 8-20s8 8 8 20z" fill="#3f6fb0"/>
    <path d="M17 32l-5 8M31 32l5 8" stroke="#e9b98f" stroke-width="3" stroke-linecap="round"/>` },
  candles: { bg: ['#4a3550', '#22172a'], body: (id) => `
    <defs><radialGradient id="fl${id}"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient></defs>
    <circle cx="25" cy="17" r="9" fill="url(#fl${id})"/><circle cx="39" cy="17" r="9" fill="url(#fl${id})"/>
    <rect x="21.5" y="22" width="7" height="22" rx="1.5" fill="#fbf6ea"/><rect x="35.5" y="22" width="7" height="22" rx="1.5" fill="#fbf6ea"/>
    <path d="M25 21c-3-3-1-7 0-10 1 3 3 7 0 10z" fill="#ffb53c"/><path d="M39 21c-3-3-1-7 0-10 1 3 3 7 0 10z" fill="#ffb53c"/>
    <path d="M25 20c-1.3-1.5-.5-3.5 0-5 .5 1.5 1.3 3.5 0 5z" fill="#fff3c4"/><path d="M39 20c-1.3-1.5-.5-3.5 0-5 .5 1.5 1.3 3.5 0 5z" fill="#fff3c4"/>
    <path d="M18 44h14l-2 4H20zM32 44h14l-2 4H34z" fill="#d8d8de"/><rect x="14" y="48" width="36" height="3" rx="1.5" fill="#bfbfc8"/>` },

  // ----- Places -----
  mishkan: { bg: ['#f3ead6', '#e1cfa6'], body: () => `
    <path d="M6 50h52v8H6z" fill="#cdb98e"/>
    <path d="M14 50V30h36v20z" fill="#b48a4a"/><path d="M12 30l20-10 20 10z" fill="#8a3a3a"/>
    <path d="M14 30h36" stroke="#e4c66a" stroke-width="2"/>
    <rect x="28" y="38" width="8" height="12" fill="#3a5a8a"/><path d="M28 38h8" stroke="#e4c66a" stroke-width="1.5"/>
    <path d="M22 50V34M42 50V34" stroke="#e4c66a" stroke-width="1.5"/>` },
  globe: { bg: ['#dbe9f6', '#a9c6e6'], body: () => `
    <circle cx="32" cy="32" r="19" fill="#4a8ccc"/>
    <path d="M22 20c4 2 6 6 4 10s2 6 6 6 4 6 0 10M38 16c-2 4 2 6 6 6s4 4 2 8" fill="none" stroke="#7cc58a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32" cy="32" r="19" fill="none" stroke="#2f6aa8" stroke-width="1.5"/>` },
};

/** A badge as a standalone SVG. */
export function art(name, size = 48, cls = '') {
  const a = ART[name];
  if (!a) return '';
  const id = `a${++uid}`;
  return `<svg class="art ${cls}" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a.bg[0]}"/><stop offset="1" stop-color="${a.bg[1]}"/></linearGradient>
    <clipPath id="c${id}"><circle cx="32" cy="32" r="30"/></clipPath></defs>
    <circle cx="32" cy="32" r="31.5" fill="#fff" opacity=".85"/>
    <g clip-path="url(#c${id})"><rect width="64" height="64" fill="url(#bg${id})"/>${a.body(id)}</g>
    <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,.08)"/></svg>`;
}

/** The same badge drawn inside another SVG, centered at x, y. */
export function artAt(name, x, y, size, cls = '') {
  const s = size / 64;
  return `<g class="art-at ${cls}" transform="translate(${(x - size / 2).toFixed(2)} ${(y - size / 2).toFixed(2)}) scale(${s.toFixed(4)})">${art(name, 64)}</g>`;
}

export const ART_NAMES = Object.keys(ART);
