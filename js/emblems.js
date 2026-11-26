// Line emblems in one style: 24×24 grid, stroked in currentColor.
// Tribes follow the flags in Bamidbar Rabbah 2:7; days follow Bereishis 1–2.

const f = (n) => +n.toFixed(2);

function lionMane() {
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, r = i % 2 ? 8.2 : 10.6;
    pts.push(`${f(12 + r * Math.sin(a))} ${f(12.5 - r * Math.cos(a))}`);
  }
  return `<path d="M${pts.join(' L')} Z"/>`;
}
function rays(cx, cy, r1, r2, n) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    d += `M${f(cx + r1 * Math.sin(a))} ${f(cy - r1 * Math.cos(a))}L${f(cx + r2 * Math.sin(a))} ${f(cy - r2 * Math.cos(a))}`;
  }
  return `<path d="${d}"/>`;
}
const dot = (x, y, r = 0.9) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`;
const crescent = (x, y, s = 1) => `<path d="M${x} ${y - 5 * s} A${5 * s} ${5 * s} 0 1 0 ${x + 4.3 * s} ${y + 2.5 * s} A${4 * s} ${4 * s} 0 0 1 ${x} ${y - 5 * s} Z"/>`;

export const ICONS = {
  // Tribes
  lion: `${lionMane()}<circle cx="12" cy="12.8" r="5.4"/>${dot(10, 11.6)}${dot(14, 11.6)}<path d="M11 15.2 L12 16.2 L13 15.2"/>`,
  sunmoon: `<circle cx="8" cy="8" r="3.2"/>${rays(8, 8, 4.6, 6.4, 8)}${crescent(16.5, 15.5, 1)}`,
  ship: `<path d="M3 15.5h18l-3 4H6z"/><path d="M12 3.5v12"/><path d="M12 4.5l6 9h-6"/><path d="M12 6.5l-5 7h5"/><path d="M2 22q2-1.4 4 0t4 0t4 0t4 0t4 0"/>`,
  mandrake: `<path d="M5 21h14M12 21v-9"/><path d="M12 12C8.5 11.5 6.5 9 6.5 5.5 9.5 6.3 11.5 8.5 12 12z"/><path d="M12 12c3.5-.5 5.5-3 5.5-6.5-3 .8-5 3-5.5 6.5z"/><circle cx="8.5" cy="17" r="2"/><circle cx="15.5" cy="17" r="2"/><path d="M8.5 15l2.5-2M15.5 15L13 13"/>`,
  city: `<path d="M3 21V11h2.5V9h2v2H10V6.5h4V11h2.5V9h2v2H21v10z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/><path d="M5.5 14h1.5M17 14h1.5"/>`,
  camp: `<path d="M1.5 20h21"/><path d="M2.5 20L7 12.5l4.5 7.5"/><path d="M12.5 20L17 12.5l4.5 7.5"/><path d="M6.5 20L12 9.5l5.5 10.5"/><path d="M12 9.5V3.5l4 1.4-4 1.6"/><path d="M12 20v-4"/>`,
  ox: `<path d="M7.5 9c0 6 2 11 4.5 11s4.5-5 4.5-11c0-2-2-3.2-4.5-3.2S7.5 7 7.5 9z"/><path d="M7.6 8.2C4.5 8.5 3 6 3.8 3.2M16.4 8.2c3.1.3 4.6-2.2 3.8-5"/>${dot(10, 11.2)}${dot(14, 11.2)}<ellipse cx="12" cy="17.2" rx="2.6" ry="1.6"/>`,
  reem: `<path d="M7.5 10c0 5.5 2 10 4.5 10s4.5-4.5 4.5-10c0-2-2-3.2-4.5-3.2S7.5 8 7.5 10z"/><path d="M9.3 7.4L7.5 1.5M14.7 7.4l1.8-5.9"/><path d="M7.6 10.2L5 9.6M16.4 10.2l2.6-.6"/>${dot(10, 12)}${dot(14, 12)}<ellipse cx="12" cy="17.6" rx="2.4" ry="1.5"/>`,
  wolf: `<path d="M5 3.5l4 5.5h6l4-5.5-.8 8.5L12 21l-6.2-9z"/>${dot(9.8, 12)}${dot(14.2, 12)}<path d="M11 18.6h2l-1 1.2z" fill="currentColor"/><path d="M12 13.5v5"/>`,
  snake: `<path d="M4 20.5c-2.5-3 1.5-5.8 5.5-5s8.5.2 8-4-6.5-3.5-5.5-7.2"/><circle cx="13.6" cy="3.6" r="1.6"/><path d="M15 3l2.2-1.2M15 3.6l2.2.6"/>`,
  olive: `<path d="M12 21v-8M12 16.5l-3-2M12 15.5l3-2"/><path d="M5 10.5C3 6 8.5 2 12 4c3.5-2 9 2 7 6.5-2 3.5-12 3.5-14 0z"/>${dot(9, 8.5, 1.1)}${dot(12.5, 7, 1.1)}${dot(15.5, 9, 1.1)}${dot(11, 10.5, 1.1)}<path d="M7 21h10"/>`,
  deer: `<path d="M10 12.5c0 4.5 1 7.5 2 7.5s2-3 2-7.5c0-1.8-.9-2.8-2-2.8s-2 1-2 2.8z"/><path d="M10.6 10.2C9 7.5 6.5 6 5 2.5M7.4 5.8L4 6.4M8.8 8L6.5 9.6M13.4 10.2C15 7.5 17.5 6 19 2.5M16.6 5.8l3.4.6M15.2 8l2.3 1.6"/><path d="M10 12l-3 .8M14 12l3 .8"/>${dot(11, 13.2, .7)}${dot(13, 13.2, .7)}`,
  // Days of Creation
  light: `${dot(12, 12, 1.6)}${rays(12, 12, 3.5, 9.5, 12)}`,
  firmament: `<path d="M2 12h20"/><path d="M2 6.5q2.5-1.6 5 0t5 0t5 0t5 0"/><path d="M2 17.5q2.5-1.6 5 0t5 0t5 0t5 0"/>`,
  plants: `<path d="M3 20.5h18M12 20.5V9"/><path d="M12 15C8.5 15 6 12.5 6 9c3.5 0 6 2.5 6 6z"/><path d="M12 12.5c3.5 0 6-2.5 6-6-3.5 0-6 2.5-6 6z"/><path d="M7 20.5c0-1.5.8-2.5 2-3M17 20.5c0-1.5-.8-2.5-2-3"/>`,
  lights: `<circle cx="7" cy="8" r="2.6"/>${rays(7, 8, 3.8, 5.4, 8)}${crescent(16, 16, .9)}<path d="M18 2.8l.6 1.5 1.6.1-1.2 1 .4 1.6-1.4-.9-1.4.9.4-1.6-1.2-1 1.6-.1z"/>`,
  fishbirds: `<path d="M2.5 16.5c3-4 8-4 11 0-3 4-8 4-11 0z"/><path d="M13.5 16.5l4-3v6z"/>${dot(6, 16, .8)}<path d="M9 7.5q2-2.2 4 0q2-2.2 4 0"/><path d="M15.5 3.5q1.2-1.3 2.4 0q1.2-1.3 2.4 0"/>`,
  man: `<circle cx="12" cy="4.6" r="2.3"/><path d="M12 7.5v7.5M7.5 10.5l4.5 1.5 4.5-1.5M12 15l-3 6M12 15l3 6"/>`,
  candles: `<path d="M5.5 21h13"/><path d="M8 21v-9.5h3V21M13 21v-9.5h3V21"/><path d="M9.5 9c-1.2-1.2-.4-2.8 0-4 .4 1.2 1.2 2.8 0 4z"/><path d="M14.5 9c-1.2-1.2-.4-2.8 0-4 .4 1.2 1.2 2.8 0 4z"/>`,
  // Other
  mishkan: `<path d="M4 20h16M6 20V9l6-4 6 4v11"/><path d="M10 20v-6h4v6"/>`,
  moon: crescent(12, 12, 1.4),
  globe: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>`,
};

export function icon(name, size = 24, cls = '') {
  const body = ICONS[name] || '';
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/** Same emblem as SVG children placed in another SVG (centered at x, y). */
export function iconAt(name, x, y, size, cls = '') {
  const s = size / 24;
  return `<g class="ico ${cls}" transform="translate(${f(x - size / 2)} ${f(y - size / 2)}) scale(${f(s)})" fill="none" stroke="currentColor" stroke-width="${f(1.4)}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</g>`;
}
