// A quiet sky behind the page that follows the real sun: night, dawn, day, dusk.
import { sunAltitude } from './solar.js';

// [altitude, top, middle, horizon]
const STOPS = [
  [-90, '#0c1027', '#111633', '#161c3d'],
  [-12, '#0f1430', '#161c3d', '#1e2447'],
  [-6, '#1a2148', '#2c3058', '#5a4a66'],
  [-1, '#2b3a68', '#5d5a7c', '#b98a78'],
  [3, '#46679c', '#9a99a8', '#e2bc96'],
  [10, '#7aa0c8', '#b9c8d6', '#ece3d2'],
  [30, '#86aed4', '#c4d5e3', '#eef0ee'],
  [90, '#86aed4', '#c4d5e3', '#eef0ee'],
];

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => `rgb(${c.join(',')})`;
const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

export function skyAt(alt) {
  let i = STOPS.findIndex((s) => s[0] > alt);
  if (i <= 0) i = i === 0 ? 1 : STOPS.length - 1;
  const [a0, ...c0] = STOPS[i - 1], [a1, ...c1] = STOPS[i];
  const t = Math.max(0, Math.min(1, (alt - a0) / (a1 - a0)));
  const cols = c0.map((c, k) => mix(hex(c), hex(c1[k]), t));
  return { cols, light: alt > -3, topDark: lum(cols[0]) < 0.45 };
}

let lastSky = '';
/** Paint the sky for this moment. */
export function paintSky(now, loc) {
  const alt = sunAltitude(now, loc.lat, loc.lon);
  const s = skyAt(alt);
  // Only when the colours really change: re-setting them restyles the whole page, and this runs every second.
  const key = s.cols.map(rgb).join() + s.topDark;
  if (key === lastSky) return alt;
  lastSky = key;
  const root = document.documentElement.style;
  root.setProperty('--sky-top', rgb(s.cols[0]));
  root.setProperty('--sky-mid', rgb(s.cols[1]));
  root.setProperty('--sky-low', rgb(s.cols[2]));
  root.setProperty('--sky-ink', s.topDark ? '#f3f1fb' : '#1f2433');
  document.body.classList.toggle('day', s.light);
  document.body.classList.toggle('night', !s.light);
  return alt;
}
