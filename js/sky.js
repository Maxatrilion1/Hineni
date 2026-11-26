// A sky behind the page that follows the real sun: night, dawn, day, sunset.
import { sunAltitude } from './solar.js';

// [altitude, top, middle, horizon]
const STOPS = [
  [-90, '#04061a', '#080c28', '#0d1338'],
  [-18, '#05081e', '#0b1232', '#151d4a'],
  [-12, '#0a1036', '#1a2160', '#33316f'],
  [-6, '#18205a', '#45407f', '#a85d7c'],
  [-2, '#26357a', '#86679f', '#ef976d'],
  [1, '#365597', '#c88a96', '#ffb067'],
  [5, '#4f80c6', '#d9b2a0', '#ffd49a'],
  [12, '#5e9be0', '#a8cdee', '#f2e6cc'],
  [30, '#4f93e2', '#93c3ef', '#dceaf5'],
  [90, '#4a8fe0', '#8cbeee', '#d6e8f6'],
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
  return { cols, light: alt > -3, topDark: lum(cols[0]) < 0.45, stars: Math.max(0, Math.min(1, (-alt - 4) / 8)) };
}

let starsDrawn = false;
function drawStars(el) {
  if (starsDrawn) return;
  starsDrawn = true;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const dots = [];
  for (let i = 0; i < 140; i++) {
    const x = rnd() * 100, y = rnd() * 70, r = rnd() < 0.1 ? 1.4 : 0.5 + rnd() * 0.6, o = 0.35 + rnd() * 0.65;
    dots.push(`<circle cx="${x.toFixed(2)}%" cy="${y.toFixed(2)}%" r="${r.toFixed(2)}" fill="#fff" opacity="${o.toFixed(2)}"/>`);
  }
  el.innerHTML = `<svg width="100%" height="100%" aria-hidden="true">${dots.join('')}</svg>`;
}

/** Paint the sky for this moment. clouds: 0..1 cover, or null when unknown. */
export function paintSky(now, loc, clouds = null) {
  const alt = sunAltitude(now, loc.lat, loc.lon);
  const s = skyAt(alt);
  const root = document.documentElement.style;
  root.setProperty('--sky-top', rgb(s.cols[0]));
  root.setProperty('--sky-mid', rgb(s.cols[1]));
  root.setProperty('--sky-low', rgb(s.cols[2]));
  root.setProperty('--sky-ink', s.topDark ? '#f3f1fb' : '#1f2433');
  const c = clouds ?? 0;
  root.setProperty('--cloud', (c * (s.light ? 0.5 : 0.7)).toFixed(2));
  root.setProperty('--stars', (s.stars * (1 - c * 0.9)).toFixed(2));
  drawStars(document.getElementById('stars'));
  document.body.classList.toggle('day', s.light);
  document.body.classList.toggle('night', !s.light);
  return alt;
}
