// Medallions: a deep, softly lit disc with a fine gold rim, and a refined silhouette
// in warm gold (or bronze on light grounds). 64×64 grid.
// Tribes follow the flags of Bamidbar Rabbah 2:7; days follow Bereishis 1–2.

let uid = 0;
const P = (n) => n.toFixed(1);
const spiky = (cx, cy, rx, ry, n, inset) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2, k = i % 2 ? inset : 1;
    pts.push(`${P(cx + rx * k * Math.sin(a))} ${P(cy - ry * k * Math.cos(a))}`);
  }
  return `M${pts.join(' L')}Z`;
};
const rays = (cx, cy, r1, r2, n, w) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2, p = (r, t) => `${P(cx + r * Math.sin(t))} ${P(cy - r * Math.cos(t))}`;
  return `M${p(r1, a - w)} L${p(r2, a)} L${p(r1, a + w)}Z`;
}).join('');
const stars = (list) => list.map(([x, y, r]) => `<path d="M${x} ${y - r * 2.2}L${x + r * .6} ${y - r * .6}L${x + r * 2.2} ${y}L${x + r * .6} ${y + r * .6}L${x} ${y + r * 2.2}L${x - r * .6} ${y + r * .6}L${x - r * 2.2} ${y}L${x - r * .6} ${y - r * .6}Z" fill="#fff6dc" opacity=".9"/>`).join('');

// G = main fill, D = detail (darker), L = light accent
const ART = {
  // ----- Tribes -----
  lion: { bg: ['#6a8fbf', '#2c4670'], body: (G, D, L) => `
    <path d="${spiky(33, 33, 21, 22, 18, .86)}" fill="${D}" opacity=".95"/>
    <ellipse cx="32" cy="33" rx="18" ry="19" fill="#9a6a2e"/>
    <path d="M18 24c4 3 6 8 6 14M20 44c4-1 7-3 9-6M28 14c3 3 4 6 4 9" stroke="${D}" stroke-width="1.2" fill="none" opacity=".6"/>
    <path d="M28.5 21.5C35 18 43.5 19.5 47.5 24c2.6 3 4.2 6 5.6 8 .9 1.6.2 3.3-1.6 3.7l-2.6.6c-.2 3-2.2 5.2-5 5.7-2 3.6-6.5 4.6-9.6 2.6-3.3-2.1-5.3-6.6-5.6-11.3-.3-4.3.3-8.3 2-11.8z" fill="${G}"/>
    <path d="M29.4 18.8a3.6 3.6 0 1 1 3.8 4.4" fill="${G}"/>
    <path d="M41 26.6c1.4-.9 3-.9 4 .1-1.2 1.2-2.8 1.3-4-.1z" fill="${D}"/>
    <path d="M51.4 30.6l2.6 1.4-.9 2.2-2.4-.8z" fill="${D}"/>
    <path d="M49.6 36.4c-2.2 1-4.6 1-6.8 0M44 41c1.2-.4 2.2-1.2 2.8-2.4" stroke="${D}" stroke-width="1" fill="none" stroke-linecap="round"/>
    <path d="M33 30c2 4 2 8 0 11" stroke="${L}" stroke-width="1" fill="none" opacity=".6"/>` },
  sunmoon: { bg: ['#3a4068', '#121528'], body: (G, D, L) => `
    ${stars([[50, 14, .9], [12, 48, .8], [46, 52, .7], [15, 14, .6]])}
    <path d="${rays(24, 25, 9.5, 17, 12, .13)}" fill="${G}" opacity=".9"/>
    <circle cx="24" cy="25" r="9" fill="${G}"/><circle cx="24" cy="25" r="9" fill="none" stroke="${D}" stroke-width=".8" opacity=".5"/>
    <circle cx="21.5" cy="22.5" r="3.2" fill="${L}" opacity=".7"/>
    <path d="M44.5 30.5a11 11 0 1 0 6.5 17.5 9 9 0 1 1-6.5-17.5z" fill="#efe6cc"/>
    <path d="M44.5 30.5a11 11 0 1 0 6.5 17.5" fill="none" stroke="#c9bd98" stroke-width=".8"/>` },
  ship: { bg: ['#e9f0f4', '#b6c9d6'], ink: 'bronze', body: (G, D, L) => `
    <path d="M6 47c4-2.4 8-2.4 12 0s8 2.4 12 0 8-2.4 12 0 8 2.4 12 0 8-2.4 12 0" stroke="${D}" stroke-width="1.6" fill="none" opacity=".55"/>
    <path d="M10 53c4-2 8-2 12 0s8 2 12 0 8-2 12 0 8 2 12 0" stroke="${D}" stroke-width="1.2" fill="none" opacity=".35"/>
    <path d="M9 38.5h46c-1.5 5-5.5 8-11 8.4H20c-5.6-.3-9.6-3.4-11-8.4z" fill="${G}"/>
    <path d="M12 41.5h40" stroke="${L}" stroke-width="1" opacity=".7"/>
    <path d="M31.2 8h1.8v30.5h-1.8z" fill="${D}"/>
    <path d="M21 13.5c6.5 1.6 15.5 1.6 22 0 1.8 7 1.8 13.5 0 20-6.5-1.6-15.5-1.6-22 0-1.8-6.5-1.8-13 0-20z" fill="${L}"/>
    <path d="M21 13.5c6.5 1.6 15.5 1.6 22 0" stroke="${D}" stroke-width=".8" fill="none" opacity=".6"/><path d="M32 14v19" stroke="${D}" stroke-width=".6" opacity=".4"/>
    <path d="M33 8l8 2.4-8 2.4z" fill="#b5523e"/>
    <path d="M16 46.5l-3 5M24 46.8l-2 5M40 46.8l2 5M48 46.5l3 5" stroke="${D}" stroke-width="1.1" opacity=".7"/>` },
  mandrake: { bg: ['#b04e43', '#5e1f1a'], body: (G, D, L) => `
    <path d="M32 44C27 36 20 30 13 27c3 7 9 13 19 17z" fill="${G}"/><path d="M32 44C37 36 44 30 51 27c-3 7-9 13-19 17z" fill="${G}"/>
    <path d="M32 44c-3-9-5-18-4-28 4 8 6 18 4 28z" fill="${L}"/><path d="M32 44c3-9 5-18 4-28-4 8-6 18-4 28z" fill="${G}"/>
    <path d="M32 44C26 40 18 39 10 40c6 4 14 6 22 4zM32 44c6-4 14-5 22-4-6 4-14 6-22 4z" fill="${D}"/>
    <path d="M13 27c6 5 12 11 19 17M51 27c-6 5-12 11-19 17M30 17c1 9 2 18 2 27" stroke="${D}" stroke-width=".7" fill="none" opacity=".5"/>
    <circle cx="25" cy="47" r="4.6" fill="#f0a24a"/><circle cx="39" cy="47" r="4.6" fill="#f0a24a"/><circle cx="32" cy="50" r="4.2" fill="#e88a36"/>
    <circle cx="23.6" cy="45.6" r="1.3" fill="#fde1a8"/><circle cx="37.6" cy="45.6" r="1.3" fill="#fde1a8"/><circle cx="30.8" cy="48.6" r="1.1" fill="#fde1a8"/>` },
  city: { bg: ['#5a9466', '#22452b'], body: (G, D, L) => `
    <path d="M2 40c8-10 16-14 22-14 6 0 9 5 14 5 7 0 12-9 24-6v39H2z" fill="${D}" opacity=".55"/>
    <path d="M9 52V33h3.2v-2.6H15V33h3v-9h3v-2.6h3V24h2v-6h2.6v-2.6h3V18H36v6h2v-2.6h3V24h3v9h3v-2.6h2.8V33H53v19z" fill="${G}"/>
    <path d="M28 52v-8a4 4 0 0 1 8 0v8z" fill="${D}"/>
    <path d="M14 38h2.4v4H14zM47.6 38H50v4h-2.4zM30.8 25h2.4v4h-2.4z" fill="${D}" opacity=".8"/>
    <path d="M9 45h44" stroke="${D}" stroke-width=".7" opacity=".35"/><path d="M18 33v19M46 33v19" stroke="${L}" stroke-width=".8" opacity=".5"/>
    <path d="M32 15.4V9" stroke="${D}" stroke-width="1"/><path d="M32 9l6 1.8-6 1.8z" fill="${L}"/>` },
  camp: { bg: ['#5e5e66', '#222226'], body: (G, D, L) => `
    <path d="M4 50h56" stroke="${G}" stroke-width="1.2" opacity=".6"/>
    <path d="M5 50l9-14 9 14z" fill="${D}"/><path d="M41 50l9-14 9 14z" fill="${D}"/>
    <path d="M15 50l17-26 17 26z" fill="${G}"/><path d="M32 24l17 26H32z" fill="${D}" opacity=".35"/>
    <path d="M23.5 37h17M19.6 43h24.8" stroke="${L}" stroke-width="1.6" opacity=".7"/>
    <path d="M28.6 50l3.4-8 3.4 8z" fill="#2a2620"/>
    <path d="M32 24V11" stroke="${G}" stroke-width="1.2"/><path d="M32 11h9l-2.4 2.8L41 16.6h-9z" fill="#f4f1e8"/><path d="M32 13.8h7" stroke="#1d1d1f" stroke-width="1.4"/>
    <path d="M14 36v-7M50 36v-7" stroke="${G}" stroke-width="1"/><path d="M14 29l4 1.4-4 1.4zM50 29l4 1.4-4 1.4z" fill="${L}"/>` },
  ox: { bg: ['#4a4744', '#191716'], body: (G, D, L) => `
    <path d="M24.5 21.5c-4.5-4-4-10.5 1.5-14.5-1.6 4.4-.8 8.6 2.6 12z" fill="${L}"/>
    <path d="M21 24.5c-2.6-2.4-7-2.6-9.8-.4 2.8 2.6 6.6 3 9.8.4z" fill="${G}"/>
    <path d="M22 22c4-4 12-4.6 17-1.6 4.4 2.6 8 8.4 11.6 12.2 2.6 2.7 2.4 7.2-.8 9.4-2.6 1.8-5.4 1.4-7.6-.4-2.2 3.4-7 5-11.2 3.4C27 43.6 24 39.6 22.4 35c-1.5-4.3-1.8-9.4-.4-13z" fill="${G}"/>
    <path d="M22.4 35c-1 8-1.4 15 .4 23h17c-1.6-5-2-9.6-1-14-4 1.2-8.6 0-11.4-3" fill="${D}"/>
    <ellipse cx="47.6" cy="39.4" rx="3.4" ry="2.6" fill="${D}" opacity=".6"/><circle cx="48.6" cy="38.6" r=".9" fill="${D}"/>
    <path d="M33 27.2c1.4-1 3.2-1 4.4 0-1.2 1.2-3 1.3-4.4 0z" fill="${D}"/>
    <path d="M30 22c3 3 4.6 7 4.6 11" stroke="${L}" stroke-width="1" fill="none" opacity=".5"/>` },
  reem: { bg: ['#3d3832', '#14110e'], body: (G, D, L) => `
    <path d="M27 21L9 4.6l1.8-.8L29.6 19.4z" fill="${L}"/><path d="M30.6 19.6L15.6 2.6l1.8-.6 15.4 16.2z" fill="${G}"/>
    <path d="M24 25c-2.8-2.4-7-2.6-9.6-.4 2.6 2.6 6.4 3 9.6.4z" fill="${G}"/>
    <path d="M25 22.4c4-3.4 10.6-3.6 15-.8 4 2.6 6.8 7.6 9.8 11.4 2.2 2.8 1.8 6.6-1 8.4-2.4 1.6-5 1.2-6.8-.4-2 3-6 4.4-9.6 3-3.8-1.4-6.2-5-7.6-9-1.4-4-1.6-9 .2-12.6z" fill="${G}"/>
    <path d="M24.8 35c-1 8-1.2 15 .2 23h15c-1.2-5-1.6-9.4-.8-13.6-3.6 1-7.6 0-10.2-2.8" fill="${D}"/>
    <path d="M33 27.4c1.4-1 3.1-1 4.3 0-1.2 1.2-2.9 1.3-4.3 0z" fill="${D}"/>
    <ellipse cx="46.6" cy="39.2" rx="3" ry="2.3" fill="${D}" opacity=".6"/>
    <path d="M28 30l12 0M27 34h13" stroke="${D}" stroke-width=".8" opacity=".35"/>` },
  wolf: { bg: ['#6e5486', '#2a1f3a'], ring: ['#a33a32', '#3d7a4c', '#7fa7d9', '#e7c55a', '#7a4f9e', '#f2efe6', '#23263a', '#c27b8a', '#2f4fa8', '#9a8b7a', '#6fb6b4', '#141414'], body: (G, D, L) => `
    <path d="M36 12c3.6 2.4 4.6 5.6 4.8 8.6 3-1.8 6.4-5.8 9-11.2 1 3.2.2 7.4-2.4 11.4-1.8 2.8-4.4 5.4-5.6 7.6 1.6 3 1.6 6.6 0 10.2-2.4 5.4-4.4 11.4-4.8 19.4H17c.4-8.4 2.4-14.6 6-19.8 2.4-3.6 4.8-6.6 6.6-10.4L31 18.4z" fill="${G}"/>
    <path d="M17 58c.4-8.4 2.4-14.6 6-19.8l2 2.4-1.4 3.6 2.8-.6-1.8 5 3-.8-1.2 4.4 2.4-.4L28 58z" fill="${D}" opacity=".5"/>
    <path d="M31 18.4L36 12c.6 2.8.4 5.4-.8 7.6z" fill="${D}"/>
    <path d="M39.6 23.4c1.2-.6 2.6-.4 3.4.6-1.2.8-2.6.6-3.4-.6z" fill="${D}"/>
    <path d="M49.8 9.4l1.4 1.6-1 1.4-1.4-1z" fill="${D}"/>
    <path d="M41 27.6c2.6-.4 5-2.2 6.4-4.8" stroke="${D}" stroke-width="1" fill="none"/>` },
  snake: { bg: ['#4566b8', '#1a2a5e'], body: (G, D, L) => `
    <path d="M13 52c-5-8 5-13.6 16-11.6 9 1.6 18.4.4 18.4-7.4S36 23.4 34 17.6" stroke="${D}" stroke-width="8.4" fill="none" stroke-linecap="round"/>
    <path d="M13 52c-5-8 5-13.6 16-11.6 9 1.6 18.4.4 18.4-7.4S36 23.4 34 17.6" stroke="${G}" stroke-width="6.4" fill="none" stroke-linecap="round"/>
    <path d="M13 52c-5-8 5-13.6 16-11.6 9 1.6 18.4.4 18.4-7.4S36 23.4 34 17.6" stroke="${D}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="1.6 3.4" opacity=".55"/>
    <path d="M29.6 18.4c-.6-4 2-7.6 6-8.2 3.4-.6 6.6 1 7.6 3.6-1.6 2.4-4.4 4-7.6 4.6-2.2.4-4.4.4-6-.0z" fill="${G}"/>
    <path d="M29.6 18.4c-.6-4 2-7.6 6-8.2" stroke="${D}" stroke-width=".8" fill="none" opacity=".6"/>
    <ellipse cx="38" cy="12.6" rx="1.2" ry=".9" fill="${D}"/>
    <path d="M43 13.4l4 .4m-4-.4l3.6-1.8" stroke="#d65a4a" stroke-width="1" stroke-linecap="round"/>` },
  olive: { bg: ['#f0e9da', '#cdbc98'], ink: 'bronze', body: (G, D, L) => `
    <path d="M29 56c1.6-6 1-11-2-16-1.6-2.8-1-5.6 1.2-7.6M35 56c-1-5.4.4-10 3.4-14 2-2.6 2-5.4.2-7.6" stroke="${D}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path d="M27 40c-3-1-5.6-.6-7.6 1M38.4 42c2.6-1.4 5.4-1.4 7.6 0" stroke="${D}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    ${[[18, 26, -30], [24, 18, -10], [32, 14, 0], [40, 18, 15], [46, 26, 30], [26, 28, -20], [38, 28, 20], [32, 24, 0], [20, 33, -40], [44, 33, 40], [14, 30, -50], [50, 30, 50]].map(([x, y, r], i) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="2.6" transform="rotate(${r} ${x} ${y})" fill="${i % 3 ? '#8a9a5e' : '#a3b27a'}"/>`).join('')}
    ${[[23, 23], [36, 21], [30, 29], [42, 29], [19, 30]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.1" fill="#3e4426"/>`).join('')}
    <path d="M20 56h24" stroke="${D}" stroke-width="1.2" opacity=".5"/>` },
  deer: { bg: ['#ad6576', '#5e2836'], body: (G, D, L) => `
    <path d="M30 25C27 17 22 12 15 8.4M24.6 16.6l-6.4-.6M21.4 13l-1.4-5.2M33.2 24c1.6-7.6 5.6-13 12-16.6M38.4 14.6l6 .6M41.8 10.6l1.6-5.2" stroke="${L}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M26.6 29.6c-2.8-2.6-7-3-9.8-1 2.6 2.8 6.6 3.4 9.8 1z" fill="${G}"/>
    <path d="M28 26.6c3.4-2.6 8.4-2.6 12 .2 3.6 2.6 6.6 5.8 9.8 8.6 1.8 1.6 1.2 4.4-1.2 4.8-3.2.6-6.4.2-9.2-.6-2 5.2-4.4 11-5.4 18.4H25.6c-.6-8 .2-15.4 1.2-21.2.4-3.6.4-7.2 1.2-10.2z" fill="${G}"/>
    <path d="M25.6 58c-.6-8 .2-15.4 1.2-21.2 2.2 3.4 5.4 4.8 8.8 4.4-1.6 5-2.6 10.4-3.2 16.8z" fill="${D}" opacity=".45"/>
    <path d="M38.4 30.6c1.2-.8 2.8-.8 3.8 0-1 1-2.6 1.1-3.8 0z" fill="${D}"/>
    <ellipse cx="49.4" cy="37.4" rx="1.8" ry="1.4" fill="${D}"/>` },

  // ----- Days of Creation -----
  light: { bg: ['#2f3566', '#0d1029'], body: (G, D, L, id) => `
    <defs><radialGradient id="gl${id}"><stop offset="0" stop-color="#fffbe6"/><stop offset=".3" stop-color="#ffeeb0" stop-opacity=".85"/><stop offset="1" stop-color="#ffeeb0" stop-opacity="0"/></radialGradient></defs>
    <circle cx="32" cy="32" r="27" fill="url(#gl${id})"/><path d="${rays(32, 32, 7, 25, 16, .06)}" fill="#fff4cc" opacity=".85"/>
    <circle cx="32" cy="32" r="5.5" fill="#fffdf2"/>` },
  firmament: { bg: ['#8fbde6', '#2a5687'], body: (G, D, L) => `
    <path d="M0 0h64v27H0z" fill="#a9cdee" opacity=".55"/>
    ${[12, 18, 23].map((y, i) => `<path d="M2 ${y}c5-2.4 10-2.4 15 0s10 2.4 15 0 10-2.4 15 0 10 2.4 15 0" stroke="#fff" stroke-width="1.2" fill="none" opacity="${.7 - i * .15}"/>`).join('')}
    <path d="M0 30h64" stroke="${G}" stroke-width="3.2"/><path d="M0 30h64" stroke="${L}" stroke-width="1"/>
    ${[38, 45, 52].map((y, i) => `<path d="M2 ${y}c5-2.4 10-2.4 15 0s10 2.4 15 0 10-2.4 15 0 10 2.4 15 0" stroke="#d9ecfa" stroke-width="1.4" fill="none" opacity="${.75 - i * .15}"/>`).join('')}` },
  plants: { bg: ['#86b276', '#2f5226'], body: (G, D, L) => `
    <path d="M6 50c10-3 42-3 52 0" stroke="${G}" stroke-width="1.4" fill="none" opacity=".7"/>
    <path d="M32 50V20" stroke="${G}" stroke-width="1.6"/>
    <path d="M32 40c-6 0-11-4-12-10 6 0 11 4 12 10zM32 33c6 0 11-4 12-10-6 0-11 4-12 10z" fill="${G}"/>
    <path d="M32 40c-4-2-8-5-12-10M32 33c4-2 8-5 12-10" stroke="${D}" stroke-width=".7" fill="none" opacity=".5"/>
    ${Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2; return `<ellipse cx="${P(32 + 4.2 * Math.sin(a))}" cy="${P(16 - 4.2 * Math.cos(a))}" rx="2.4" ry="3.6" transform="rotate(${P(i * 360 / 7)} ${P(32 + 4.2 * Math.sin(a))} ${P(16 - 4.2 * Math.cos(a))})" fill="${L}"/>`; }).join('')}
    <circle cx="32" cy="16" r="2.6" fill="${D}"/>
    <path d="M14 50c0-6 2-10 6-13M50 50c0-6-2-10-6-13M22 50c0-3 1-6 3-8M42 50c0-3-1-6-3-8" stroke="${G}" stroke-width="1.4" fill="none" stroke-linecap="round"/>` },
  lights: { bg: ['#323a6e', '#0e1129'], body: (G, D, L) => `
    ${stars([[44, 12, 1.1], [52, 24, .8], [14, 46, .9], [28, 52, .7], [50, 48, .8], [38, 20, .6]])}
    <path d="${rays(21, 22, 8.5, 14, 12, .13)}" fill="${G}" opacity=".9"/><circle cx="21" cy="22" r="8" fill="${G}"/>
    <path d="M41 31a10 10 0 1 0 6 16 8 8 0 1 1-6-16z" fill="#efe6cc"/>` },
  fishbirds: { bg: ['#6aa5d6', '#1f4a76'], body: (G, D, L) => `
    <path d="M0 34c8-2.4 16-2.4 24 0s16 2.4 24 0 12-2.4 16 0" stroke="#d9ecfa" stroke-width="1.2" fill="none" opacity=".7"/>
    <path d="M12 46c5-6.6 15-7.6 22-2l7-5-1.4 8 1.4 8-7-5c-7 5.6-17 4.6-22-2z" fill="${G}"/>
    <path d="M24 41.4c1.6 2.6 1.6 5.8 0 8.4" stroke="${D}" stroke-width=".9" fill="none" opacity=".6"/><circle cx="17.4" cy="45" r="1.1" fill="${D}"/>
    <path d="M28 43l1.4 1.4M30 46l1.6 0M28 49l1.4-1.4" stroke="${L}" stroke-width=".8" opacity=".7"/>
    <path d="M16 18c3-3.4 6-3.4 8.4-.6 2.4-2.8 5.4-2.8 8.4.6-3-.8-5.8-.6-8.4 1.4-2.6-2-5.4-2.2-8.4-1.4z" fill="${G}"/>
    <path d="M38 11c2-2.2 4-2.2 5.6-.4 1.6-1.8 3.6-1.8 5.6.4-2-.6-3.8-.4-5.6.9-1.8-1.3-3.6-1.5-5.6-.9z" fill="${G}" opacity=".85"/>` },
  man: { bg: ['#8fb27e', '#33532a'], body: (G, D, L) => `
    <path d="M2 52c14-6 46-6 60 0v12H2z" fill="${D}" opacity=".45"/>
    <circle cx="24" cy="15.5" r="4.6" fill="${G}"/>
    <path d="M24 21.6c-4.4 0-6.6 3.4-7 8.4l-.8 8.6h3l.6 13.4h8.4l.6-13.4h3l-.8-8.6c-.4-5-2.6-8.4-7-8.4z" fill="${G}"/>
    <path d="M38 47c0-4 3.6-6.6 8-6.6 3 0 5.2 1 6.6 2.6l2.4-1.4.6 2.4-2 1c.4 1.2.4 2.6-.2 4-1 2.4-3.6 3.6-7.4 3.6-4.6 0-8-1.6-8-5.6z" fill="${L}"/>
    <path d="M41 52.4v3.6M50 52.4v3.6" stroke="${L}" stroke-width="1.4"/>` },
  candles: { bg: ['#5e3e62', '#1e1222'], body: (G, D, L, id) => `
    <defs><radialGradient id="fl${id}"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient></defs>
    <circle cx="25" cy="17" r="10" fill="url(#fl${id})"/><circle cx="39" cy="17" r="10" fill="url(#fl${id})"/>
    <rect x="22" y="22" width="6" height="21" rx="1" fill="#fbf6ea"/><rect x="36" y="22" width="6" height="21" rx="1" fill="#fbf6ea"/>
    <path d="M25 21c-2.6-2.6-1-6.4 0-9.4 1 3 2.6 6.8 0 9.4zM39 21c-2.6-2.6-1-6.4 0-9.4 1 3 2.6 6.8 0 9.4z" fill="#ffbf4a"/>
    <path d="M25 20c-1-1.4-.4-3.2 0-4.6.4 1.4 1 3.2 0 4.6zM39 20c-1-1.4-.4-3.2 0-4.6.4 1.4 1 3.2 0 4.6z" fill="#fff6d0"/>
    <path d="M19 43h12l-2 3h-8zM33 43h12l-2 3h-8z" fill="${G}"/><path d="M24 46v5h2v-5zM38 46v5h2v-5z" fill="${G}"/><rect x="16" y="51" width="32" height="2.6" rx="1.3" fill="${G}"/>` },

  // ----- Places -----
  mishkan: { bg: ['#6e4c2c', '#2e1f12'], body: (G, D, L) => `
    <path d="M8 50h48" stroke="${G}" stroke-width="1.2" opacity=".6"/>
    <path d="M14 50V30h36v20z" fill="${G}"/><path d="M11 30.5L32 19l21 11.5z" fill="#9a3d3a"/><path d="M11 30.5h42" stroke="${L}" stroke-width="1.2"/>
    <path d="M20 50V33M26 50V33M38 50V33M44 50V33" stroke="${D}" stroke-width="1" opacity=".5"/>
    <path d="M28.5 50V36h7v14z" fill="#33508a"/><path d="M28.5 36h7" stroke="${L}" stroke-width="1"/>` },
  globe: { bg: ['#4677b2', '#16304f'], body: (G, D, L) => `
    <circle cx="32" cy="32" r="19" fill="none" stroke="${G}" stroke-width="1.6"/>
    <ellipse cx="32" cy="32" rx="8" ry="19" fill="none" stroke="${G}" stroke-width="1" opacity=".8"/>
    <path d="M13 32h38M16 22h32M16 42h32" stroke="${G}" stroke-width="1" opacity=".8"/>
    <path d="M23 20c4 2 5 6 3 9s2 5 6 5 4 5 0 9M38 17c-2 3 1 5 5 5s4 3 2 6" fill="none" stroke="${L}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>` },
};

const INK = {
  gold: ['#fbf1d4', '#dcb466', '#7a5525', '#fff8e6'],
  bronze: ['#c99a4f', '#8a6028', '#5a3c18', '#f3e3c0'],
};

/** A medallion as a standalone SVG. */
export function art(name, size = 48, cls = '') {
  const a = ART[name];
  if (!a) return '';
  const id = `m${++uid}`;
  const [g1, g2, D, L] = INK[a.ink || 'gold'];
  const ring = a.ring
    ? a.ring.map((c, i) => { const a1 = (i / a.ring.length) * Math.PI * 2, a2 = ((i + 1) / a.ring.length) * Math.PI * 2, p = (t) => `${P(32 + 30.6 * Math.sin(t))} ${P(32 - 30.6 * Math.cos(t))}`; return `<path d="M${p(a1)} A30.6 30.6 0 0 1 ${p(a2)}" stroke="${c}" stroke-width="2.4" fill="none"/>`; }).join('')
    : `<circle cx="32" cy="32" r="30.6" fill="none" stroke="#d6b46a" stroke-width="1.6"/>`;
  return `<svg class="art ${cls}" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <radialGradient id="bg${id}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="${a.bg[0]}"/><stop offset="1" stop-color="${a.bg[1]}"/></radialGradient>
      <linearGradient id="ink${id}" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${g1}"/><stop offset="1" stop-color="${g2}"/></linearGradient>
      <clipPath id="c${id}"><circle cx="32" cy="32" r="29.6"/></clipPath>
    </defs>
    <circle cx="32" cy="32" r="31.8" fill="#fffaf0" opacity=".9"/>
    <g clip-path="url(#c${id})"><rect width="64" height="64" fill="url(#bg${id})"/>${a.body(`url(#ink${id})`, D, L, id)}
      <ellipse cx="24" cy="12" rx="22" ry="9" fill="#fff" opacity=".08"/></g>
    ${ring}<circle cx="32" cy="32" r="28.2" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width=".6"/></svg>`;
}

export function artAt(name, x, y, size, cls = '') {
  return `<g class="art-at ${cls}" transform="translate(${(x - size / 2).toFixed(2)} ${(y - size / 2).toFixed(2)}) scale(${(size / 64).toFixed(4)})">${art(name, 64)}</g>`;
}

export const ART_NAMES = Object.keys(ART);
