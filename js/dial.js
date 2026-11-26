import { angleOf } from './zmanim.js';
import { gematria } from './hebrew.js';
import { TRIBES, hourMonth } from './lore.js';
import { monthLore } from './hebrew.js';

const NS = 'http://www.w3.org/2000/svg';
const C = 200;
const R_OUT = 188, R_IN = 158, R_BAND = 150, R_NUM = 173, R_CIVIL = 138, R_DOT = 144;

const pt = (r, a) => [C + r * Math.sin((a * Math.PI) / 180), C - r * Math.cos((a * Math.PI) / 180)];
const f = (n) => n.toFixed(2);

function el(name, attrs = {}, parent) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.appendChild(e);
  return e;
}

function sector(r1, r2, a1, a2) {
  const large = (a2 - a1 + 360) % 360 > 180 ? 1 : 0;
  const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2), [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
  return `M${f(x1)} ${f(y1)}A${r2} ${r2} 0 ${large} 1 ${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}A${r1} ${r1} 0 ${large} 0 ${f(x4)} ${f(y4)}Z`;
}

function localHM(t, tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' })
      .formatToParts(new Date(t))
      .map((x) => [x.type, +x.value])
  );
  return p;
}

/** Draw the static parts of the dial for one Jewish day. */
export function buildDial(svg, jd, tz) {
  svg.replaceChildren();
  const defs = el('defs', {}, svg);
  const g = el('radialGradient', { id: 'sunGlow' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#fff6c9' }, g);
  el('stop', { offset: '55%', 'stop-color': '#f5c443' }, g);
  el('stop', { offset: '100%', 'stop-color': '#f5c443', 'stop-opacity': '0' }, g);

  el('circle', { cx: C, cy: C, r: R_OUT + 6, class: 'face' }, svg);

  // 24 sha'os zmaniyos: night on the bottom half (from shkiah at right), day on top (from netz at left).
  const segs = el('g', { class: 'segs' }, svg);
  for (const [part, base] of [['n', 90], ['d', 270]]) {
    for (let i = 0; i < 12; i++) {
      const a1 = base + 15 * i, a2 = a1 + 15;
      el('path', { d: sector(R_IN, R_OUT, a1, a2), class: `seg ${part === 'd' ? 'day' : 'night'}${i % 2 ? ' alt' : ''}`, 'data-seg': part + i, role: 'button', 'aria-label': `${part === 'd' ? 'Day' : 'Night'} hour ${i + 1}` }, segs);
      // Thin band in the flag colors of the hour's tribe (Bamidbar Rabbah 2:7).
      const tribe = TRIBES[monthLore(hourMonth(i + 1).month).tribe];
      const k = tribe.flag.length;
      tribe.flag.forEach((c, j) => {
        el('path', { d: sector(R_BAND, R_IN - 1, a1 + (15 * j) / k, a1 + (15 * (j + 1)) / k), fill: c, class: 'band', 'data-band': part + i }, segs);
      });
      const [x, y] = pt(R_NUM, a1 + 7.5);
      const t = el('text', { x: f(x), y: f(y), class: `num ${part === 'd' ? 'day' : 'night'}`, 'data-num': part + i }, segs);
      t.textContent = gematria(i + 1).replace(/[׳״]/g, '');
    }
  }
  // Horizon: shkiah (right) and netz (left).
  for (const a of [90, 270]) {
    const [x1, y1] = pt(R_IN - 14, a), [x2, y2] = pt(R_OUT + 6, a);
    el('line', { x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2), class: 'horizon' }, svg);
  }

  // Civil clock, warped onto the Jewish hours.
  const civil = el('g', { class: 'civil' }, svg);
  el('circle', { cx: C, cy: C, r: R_CIVIL, class: 'civil-ring' }, civil);
  const s = localHM(jd.start, tz);
  let t = jd.start - ((s.minute * 60 + s.second) * 1000 + (jd.start % 1000)) + 3600000;
  for (; t < jd.end; t += 3600000) {
    const a = angleOf(t, jd);
    const h = localHM(t, tz).hour;
    const major = h % 3 === 0;
    const [x1, y1] = pt(R_CIVIL - (major ? 7 : 4), a), [x2, y2] = pt(R_CIVIL + (major ? 4 : 2), a);
    el('line', { x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2), class: major ? 'tick major' : 'tick' }, civil);
    if (major) {
      const [x, y] = pt(R_CIVIL - 17, a);
      const lbl = el('text', { x: f(x), y: f(y), class: 'civil-num' }, civil);
      lbl.textContent = (h % 12 || 12) + (h < 12 ? 'a' : 'p');
    }
  }

  // Zmanim markers.
  const dots = el('g', { class: 'dots' }, svg);
  for (const z of jd.list) {
    if (z.t < jd.start || z.t > jd.end) continue;
    const [x, y] = pt(R_DOT, angleOf(z.t, jd));
    el('circle', { cx: f(x), cy: f(y), r: 3, class: 'zdot', 'data-z': z.key + z.part }, dots);
  }

  // Hand: a ray plus the sun or moon riding the rim.
  const hand = el('g', { class: 'hand', id: 'hand' }, svg);
  el('line', { x1: C, y1: C - 104, x2: C, y2: C - R_OUT - 4, class: 'ray' }, hand);
  const sun = el('g', { class: 'sun' }, hand);
  el('circle', { cx: C, cy: C - R_OUT - 2, r: 15, fill: 'url(#sunGlow)' }, sun);
  el('circle', { cx: C, cy: C - R_OUT - 2, r: 7, class: 'sun-core' }, sun);
  const moon = el('g', { class: 'moon' }, hand);
  el('circle', { cx: C, cy: C - R_OUT - 2, r: 8, class: 'moon-lit' }, moon);
  el('circle', { cx: C + 4, cy: C - R_OUT - 5, r: 7, class: 'moon-dark' }, moon);
}

/** Move the hand and highlight the current hour and next zman. */
export function updateDial(svg, now, jd, h, nextKey) {
  const a = angleOf(now, jd);
  svg.querySelector('#hand')?.setAttribute('transform', `rotate(${a.toFixed(3)} ${C} ${C})`);
  svg.classList.toggle('is-day', h.isDay);
  const cur = (h.isDay ? 'd' : 'n') + (h.hour - 1);
  svg.querySelectorAll('[data-seg]').forEach((p) => p.classList.toggle('now', p.dataset.seg === cur));
  svg.querySelectorAll('[data-num]').forEach((p) => p.classList.toggle('now', p.dataset.num === cur));
  for (const z of jd.list) {
    const d = svg.querySelector(`[data-z="${z.key + z.part}"]`);
    if (!d) continue;
    d.classList.toggle('past', z.t <= now);
    d.classList.toggle('next', z.key + z.part === nextKey);
  }
}
