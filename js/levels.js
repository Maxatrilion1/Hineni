// The nested circles of Jewish time: world ⊃ shemitah ⊃ year ⊃ month ⊃ week ⊃ day ⊃ hour.
// Each level is a ring of its parts with "now" marked, plus a panel of lore.
import { jewishDay, hourOf, zmanimFor, addDays, weekday, dayInfo } from './zmanim.js';
import { hebrewDate, gematria, WEEKDAYS, monthLore, moonPhase } from './hebrew.js';
import { MONTH_NUM, isLeap, molad, moladText, nextMonth, kiddushLevanah, planetOf, omerDay, omerSefirah } from './calendar.js';
import { TRIBES, CAMPS, DAYS, MONTH_FOCUS, DAY_DEPTH, hourMonth, towardJerusalem, compassWord } from './lore.js';
import { art, artAt } from './art.js';
import { parshahFor } from './parshah.js';

export const RENDER = { lite: false, rot: 0 };
export const LEVELS = ['hour', 'day', 'week', 'month', 'year', 'shemitah', 'world'];
const C = 200, R_OUT = 188, R_IN = 158, R_BAND = 150, R_NUM = 173, R_ICON = 122;
const pt = (r, a) => [C + r * Math.sin((a * Math.PI) / 180), C - r * Math.cos((a * Math.PI) / 180)];
const f = (n) => n.toFixed(2);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const plain = (s) => s.replace(/[׳״]/g, '');
const monthHe = (date) => hebrewDate(date).he.split(' ').slice(1, -1).join(' ');

function sector(r1, r2, a1, a2) {
  const large = a2 - a1 > 180 ? 1 : 0;
  const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2), [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
  return `M${f(x1)} ${f(y1)}A${r2} ${r2} 0 ${large} 1 ${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}A${r1} ${r1} 0 ${large} 0 ${f(x4)} ${f(y4)}Z`;
}

// ---------- Model ----------
const yearCache = new Map();
export function yearMonths(year, near) {
  if (yearCache.has(year)) return yearCache.get(year);
  let rh = near;
  for (let k = 0; k < 400; k++) {
    for (const d of [addDays(near, -k), addDays(near, k)]) {
      const h = hebrewDate(d);
      if (h.year === year && h.month === 'Tishrei' && h.day === 1) { rh = d; k = 400; break; }
    }
  }
  const months = [];
  let len = 0;
  for (let i = 0; i < 390; i++) {
    const d = addDays(rh, i), h = hebrewDate(d);
    if (h.year !== year) break;
    if (h.day === 1) months.push({ name: h.month, start: d, len: 0 });
    months[months.length - 1].len++;
    len++;
  }
  const y = { year, rh, len, months };
  yearCache.set(year, y);
  return y;
}
export const dayIndex = (a, b) => Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
export function monthLength(date, hd) { return hebrewDate(addDays(date, 30 - hd.day)).day === 30 ? 30 : 29; }
const dateForYear = (y) => ({ y: y - 3761, m: 11, d: 15 });

export function hourTribe(h) {
  const m = hourMonth(h);
  const lore = monthLore(m.month);
  return { ...m, lore, tribe: lore.tribe, t: TRIBES[lore.tribe], focus: MONTH_FOCUS[m.month] };
}

export function cosmic(year) {
  const mil = Math.floor(year / 1000);
  const frac = (year % 1000) / 1000, sha = frac * 24, isDay = sha >= 12;
  return { mil: mil + 1, dayName: WEEKDAYS[mil].en, hour: Math.floor(isDay ? sha - 12 : sha) + 1, isDay };
}

export function context(focus, now, loc, opts) {
  const jd = jewishDay(focus, loc, opts);
  const nowJd = jewishDay(now, loc, opts);
  const date = jd.day.date, hd = jd.info.hd, wd = jd.info.wd;
  const chatzos = (d) => zmanimFor(d, loc).chatzos ?? Date.UTC(d.y, d.m - 1, d.d, 12);
  return { focus, now, loc, opts, jd, nowJd, date, hd, wd, chatzos };
}
const dayFrac = (x) => (x.now - x.nowJd.start) / (x.nowJd.end - x.nowJd.start);

// ---------- Ring drawing ----------
function hand(angle, kind = 'dot', from = 100) {
  const [x1, y1] = pt(from, angle), [x2, y2] = pt(R_OUT + 2, angle), [mx, my] = pt(R_OUT + 3, angle);
  const tip = kind === 'sun' ? `<circle cx="${f(mx)}" cy="${f(my)}" r="11" fill="url(#sunGlow2)"/><circle cx="${f(mx)}" cy="${f(my)}" r="6" class="sun-core"/>`
    : kind === 'moon' ? `<circle cx="${f(mx)}" cy="${f(my)}" r="7" class="moon-lit"/><circle cx="${f(mx + 3.5)}" cy="${f(my - 2.5)}" r="6" class="moon-dark2"/>`
    : `<circle cx="${f(mx)}" cy="${f(my)}" r="5.5" class="marker"/>`;
  return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="ray"/>${tip}`;
}
const DEFS = `<defs><radialGradient id="sunGlow2"><stop offset="0%" stop-color="#fff6c9"/><stop offset="55%" stop-color="#f5c443"/><stop offset="100%" stop-color="#f5c443" stop-opacity="0"/></radialGradient></defs>`;

/** Text set along an arc, letter by letter, reading right to left; on the lower half it is turned to stay readable. */
function arcText(str, r, mid, cls, fs) {
  const chars = [...str], step = ((fs * 0.6) / r) * (180 / Math.PI), span = step * (chars.length - 1);
  // RENDER.rot: how far this face will be turned on screen, so the words read upright where they end up.
  const m = (((mid + RENDER.rot) % 360) + 360) % 360, bottom = m > 90 && m < 270;
  return chars.map((c, k) => {
    if (c === ' ') return '';
    const a = bottom ? mid - span / 2 + k * step : mid + span / 2 - k * step, [x, y] = pt(r, a);
    return `<text x="${f(x)}" y="${f(y)}" class="${cls}" data-w="${str}" transform="rotate(${f(bottom ? a + 180 : a)} ${f(x)} ${f(y)})">${c}</text>`;
  }).join('');
}

function ring(segs, { marker = null, extra = '' } = {}) {
  let s = DEFS + `<circle cx="${C}" cy="${C}" r="${R_OUT + 6}" class="face"/>`;
  segs.forEach((g, i) => {
    s += `<path d="${sector(R_IN, R_OUT, g.a1, g.a2)}" class="rs${i % 2 ? ' alt' : ''} ${g.cls || ''}${g.isNow ? ' now' : ''}${g.isFocus && !g.isNow ? ' focus' : ''}" data-child="${g.id}" data-a="${g.a1.toFixed(2)},${g.a2.toFixed(2)}"/>`;
    if (g.band) {
      const k = g.band.length;
      g.band.forEach((c, j) => { s += `<path d="${sector(R_BAND, R_IN - 1, g.a1 + ((g.a2 - g.a1) * j) / k, g.a1 + ((g.a2 - g.a1) * (j + 1)) / k)}" fill="${c}" class="band" data-child="${g.id}"/>`; });
    }
    const mid = (g.a1 + g.a2) / 2;
    const dark = /sab/.test(g.cls || '') && !g.isNow ? ' on-dark' : '', nowC = g.isNow ? ' now' : '';
    if (g.sub) s += arcText(g.sub, R_IN + 7, mid, `rsub${nowC}${dark}`, 8.6);
    if (g.label) {
      const fs = /small/.test(g.labelCls || '') ? 11.5 : 15, rr = g.sub ? R_OUT - 9 : R_NUM;
      if ([...g.label].length > 2) s += arcText(g.label, rr, mid, `rnum${nowC}${dark} ${g.labelCls || ''}`, fs);
      else { const [x, y] = pt(rr, mid); s += `<text x="${f(x)}" y="${f(y)}" class="rnum${nowC}${dark} ${g.labelCls || ''}">${g.label}</text>`; }
    }
    if (g.art && !RENDER.lite) { const [x, y] = pt(R_ICON, mid); s += artAt(g.art, x, y, g.artSize || 30, g.isNow ? 'now' : 'dim'); }
    if (g.moon != null) { const [x, y] = pt(R_ICON + 8, mid); s += moonShape(x, y, 5, g.moon, g.isNow); }
  });
  s += extra;
  if (marker != null) s += hand(marker);
  return s;
}

function moonShape(cx, cy, r, phase, hi) {
  const k = Math.cos(2 * Math.PI * phase), waxing = phase < 0.5, rx = Math.abs(k) * r;
  const limb = waxing ? 1 : 0, sweep = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
  return `<g class="moonph${hi ? ' now' : ''}"><circle cx="${f(cx)}" cy="${f(cy)}" r="${r}" class="mp-dark"/><path d="M${f(cx)} ${f(cy - r)}A${r} ${r} 0 0 ${limb} ${f(cx)} ${f(cy + r)}A${f(rx)} ${r} 0 0 ${sweep} ${f(cx)} ${f(cy - r)}Z" class="mp-lit"/></g>`;
}
const seven = (i) => { const step = 360 / 7; return [(i - 6) * step - step / 2, (i - 5) * step - step / 2]; };

// ---------- Center ----------
function centerHTML({ eyebrow = '', badge, badgeSize = 64, big = '', line = '', sub = '' }) {
  return `${eyebrow ? `<span class="c-eyebrow">${eyebrow}</span>` : ''}${badge ? `<span class="c-art">${art(badge, badgeSize)}</span>` : ''}${big ? `<span class="c-big he" lang="he">${big}</span>` : ''}${line ? `<span class="c-line">${line}</span>` : ''}${sub ? `<span class="c-sub">${sub}</span>` : ''}`;
}
const fmtT = (x, t) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: x.loc.tz }).format(new Date(t));
const fmtD = (x, t) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: x.loc.tz }).format(new Date(t));
const civ = (d) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(d.y, d.m - 1, d.d, 12)));

// ---------- Levels ----------
export function weekView(x) {
  const start = addDays(x.date, -x.wd);
  const nowIn = dayIndex(start, x.nowJd.day.date);
  const segs = DAYS.map((d, i) => {
    const [a1, a2] = seven(i), date = addDays(start, i);
    const hols = dayInfo(date, x.opts.israel).hols.filter((h) => h.kind !== 'erev' && h.kind !== 'rc');
    return { a1, a2, id: i, label: i === 6 ? 'ש' : plain(gematria(i + 1)), sub: d.creationHe, art: d.icon, artSize: 34, isNow: nowIn === i, isFocus: i === x.wd, cls: i === 6 ? 'sab' : '', band: hols.length ? ['#c9973a'] : null, date };
  });
  let marker = null;
  if (nowIn >= 0 && nowIn < 7) { const [a1, a2] = seven(nowIn); marker = a1 + (a2 - a1) * dayFrac(x); }
  const W = WEEKDAYS[x.wd];
  const P = parshahFor(start, x.opts.israel);
  const pName = P.holiday ? P.holiday : `Parshas ${P.names}`;
  return {
    title: P.holiday ? 'The week' : `The week of ${P.names}`, marker, svg: ring(segs, { marker }),
    center: centerHTML({ big: W.he, line: P.holiday ? P.holiday : `פרשת ${P.he}`, sub: `Day ${x.wd + 1} of 7` }),
    panel: (P.holiday ? '' : `<section class="pcard feature"><h3>This week's parshah</h3><div class="parshah"><span class="he" lang="he">פרשת ${P.he}</span><small>Read on Shabbos, ${civ(P.date)}</small></div></section>`) + weekPanel(x, start),
    children: Object.fromEntries(segs.map((s) => [s.id, { level: 'day', focus: x.chatzos(s.date) }])),
    prev: { level: 'week', focus: x.chatzos(addDays(start, -4)) }, next: { level: 'week', focus: x.chatzos(addDays(start, 10)) },
  };
}

export function monthView(x) {
  const len = monthLength(x.date, x.hd), start = addDays(x.date, -(x.hd.day - 1));
  const lore = monthLore(x.hd.month), T = TRIBES[lore.tribe];
  const nowIn = dayIndex(start, x.nowJd.day.date), step = 360 / len;
  const segs = Array.from({ length: len }, (_, i) => {
    const date = addDays(start, i);
    const hols = dayInfo(date, x.opts.israel).hols.filter((h) => h.kind !== 'erev' && h.kind !== 'rc');
    return { a1: i * step, a2: (i + 1) * step, id: i, label: plain(gematria(i + 1)), labelCls: 'small', moon: moonPhase(i + 1), isNow: nowIn === i, isFocus: i === x.hd.day - 1, cls: weekday(date) === 6 ? 'sab' : '', band: hols.length ? ['#c9973a'] : null, date };
  });
  const marker = nowIn >= 0 && nowIn < len ? (nowIn + dayFrac(x)) * step : null;
  return {
    title: `${x.hd.month} ${x.hd.year}`, marker, svg: ring(segs, { marker }),
    center: centerHTML({ badge: T.icon, badgeSize: 58, big: `${plain(gematria(x.hd.day))} ${monthHe(x.date)}`, line: `Month of ${lore.tribe}`, sub: `Day ${x.hd.day} of ${len}` }),
    panel: monthPanel(x, lore, T, start, len),
    children: Object.fromEntries(segs.map((s) => [s.id, { level: 'day', focus: x.chatzos(s.date) }])),
    prev: { level: 'month', focus: x.chatzos(addDays(start, -10)) }, next: { level: 'month', focus: x.chatzos(addDays(start, len + 10)) },
  };
}

export function yearView(x) {
  const Y = yearMonths(x.hd.year, x.date), n = Y.months.length, step = 360 / n;
  const nowHd = x.nowJd.info.hd;
  const segs = Y.months.map((m, i) => {
    const lore = monthLore(m.name), T = TRIBES[lore.tribe], he = monthHe(m.start);
    return { a1: i * step, a2: (i + 1) * step, id: i, label: he, labelCls: 'small', sub: T.he, art: T.icon, artSize: 30, band: T.flag,
      isNow: nowHd.year === x.hd.year && nowHd.month === m.name, isFocus: x.hd.month === m.name, m };
  });
  let marker = null;
  const ni = Y.months.findIndex((m) => m.name === nowHd.month);
  if (nowHd.year === x.hd.year && ni >= 0) marker = (ni + (nowHd.day - 1 + dayFrac(x)) / Y.months[ni].len) * step;
  return {
    title: `Year ${x.hd.year}`, marker, svg: ring(segs, { marker }),
    center: centerHTML({ big: gematria(x.hd.year % 1000), line: `${x.hd.year} · ${isLeap(x.hd.year) ? 'a leap year' : 'twelve months'}`, sub: `Day ${dayIndex(Y.rh, x.date) + 1} of ${Y.len}` }),
    panel: yearPanel(x, Y),
    children: Object.fromEntries(segs.map((s) => [s.id, { level: 'month', focus: x.chatzos(s.isNow ? x.nowJd.day.date : addDays(s.m.start, 14)) }])),
    prev: { level: 'year', focus: x.chatzos(dateForYear(x.hd.year - 1)) }, next: { level: 'year', focus: x.chatzos(dateForYear(x.hd.year + 1)) },
  };
}

const MAASER = (n) => (n === 7 ? 'rest' : [3, 6].includes(n) ? 'ani' : 'sheni');
const MAASER_COLOR = { sheni: '#7fa7d9', ani: '#c27b8a', rest: '#5f9a63' };
export function shemitahView(x) {
  const pos = x.hd.year % 7 || 7, first = x.hd.year - pos + 1, nowPos = x.nowJd.info.hd.year - first;
  const segs = Array.from({ length: 7 }, (_, i) => {
    const [a1, a2] = seven(i);
    return { a1, a2, id: i, label: i === 6 ? 'שמיטה' : plain(gematria((first + i) % 1000)), labelCls: 'small', band: [MAASER_COLOR[MAASER(i + 1)]], isNow: nowPos === i, isFocus: i === pos - 1, cls: i === 6 ? 'sab' : '', year: first + i };
  });
  let marker = null;
  if (nowPos >= 0 && nowPos < 7) {
    const Y = yearMonths(x.nowJd.info.hd.year, x.nowJd.day.date), [a1, a2] = seven(nowPos);
    marker = a1 + (a2 - a1) * (dayIndex(Y.rh, x.nowJd.day.date) / Y.len);
  }
  return {
    title: `Shemitah cycle ${first}–${first + 6}`, marker, svg: ring(segs, { marker }),
    center: centerHTML({ big: pos === 7 ? 'שמיטה' : `${pos}<small> / 7</small>`, line: pos === 7 ? 'The land rests' : `Ma'aser ${MAASER(pos)}`, sub: `Year ${pos} of 7` }),
    panel: shemitahPanel(x, first, pos),
    children: Object.fromEntries(segs.map((s) => [s.id, { level: 'year', focus: x.chatzos(dateForYear(s.year)) }])),
    prev: { level: 'shemitah', focus: x.chatzos(dateForYear(x.hd.year - 7)) }, next: { level: 'shemitah', focus: x.chatzos(dateForYear(x.hd.year + 7)) },
  };
}

const ERA_COLOR = ['#a89a86', '#a89a86', '#7fa7d9', '#7fa7d9', '#c9973a', '#c9973a', '#efe7d4'];
export function worldView(x) {
  const mil = Math.floor(x.hd.year / 1000);
  const segs = Array.from({ length: 7 }, (_, i) => {
    const [a1, a2] = seven(i);
    return { a1, a2, id: i, label: i === 6 ? 'ש' : plain(gematria(i + 1)), sub: ['תהו', 'תהו', 'תורה', 'תורה', 'ימות המשיח', 'ימות המשיח', 'שבת'][i], art: DAYS[i].icon, artSize: 34, band: [ERA_COLOR[i]], isNow: i === mil, isFocus: i === mil, cls: i === 6 ? 'sab' : '' };
  });
  const [a1, a2] = seven(mil), c = cosmic(x.hd.year);
  const marker = a1 + (a2 - a1) * ((x.nowJd.info.hd.year % 1000) / 1000);
  return {
    title: 'Six thousand years', marker, svg: ring(segs, { marker }),
    center: centerHTML({ big: x.hd.year.toLocaleString(), line: 'of 6,000 years', sub: `Millennium <bdi class="he" lang="he">${plain(gematria(c.mil))}</bdi> · the ${ordinal(c.mil)}` }),
    panel: worldPanel(x, c),
    children: { [mil]: { level: 'shemitah', focus: x.focus } },
  };
}

/** Inside one hour: a clock of its 60 minutes, with one hand. */
export function hourView(x, sel) {
  const len = sel.isDay ? x.jd.day.hour : x.jd.night.hour;
  const a = (sel.isDay ? x.jd.day.netz : x.jd.night.start) + (sel.hour - 1) * len, b = a + len;
  const ht = hourTribe(sel.hour), T = ht.t;
  const live = x.now >= a && x.now < b, frac = live ? (x.now - a) / len : null;
  const tone = sel.isDay ? 'day' : 'night';
  let s = DEFS + `<circle cx="${C}" cy="${C}" r="${R_OUT + 6}" class="face"/>`;
  s += `<path d="${sector(R_IN, R_OUT, 0, 359.99)}" class="hr ${tone}"/>`;
  if (frac) s += `<path d="${sector(R_IN, R_OUT, 0, Math.max(0.5, frac * 360))}" class="hr-fill ${tone}"/>`;
  for (let m = 0; m < 60; m++) {
    const big = m % 5 === 0, [x1, y1] = pt(R_OUT - (big ? 9 : 4), m * 6), [x2, y2] = pt(R_OUT - 1, m * 6);
    s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="mtick ${tone}${big ? ' big' : ''}"/>`;
  }
  const k = T.flag.length, slices = k === 1 ? 1 : 24;
  for (let j = 0; j < slices; j++) s += `<path d="${sector(R_BAND, R_IN - 1, (360 * j) / slices, (360 * (j + 1)) / slices - (slices === 1 ? 0.01 : 0))}" fill="${T.flag[j % k]}" class="band"/>`;
  const L = ht.lore;
  const facet = (ang, label, value, he) => { const [fx, fy] = pt(ang % 180 ? 124 : 132, ang); return `<text x="${f(fx)}" y="${f(fy - 7)}" class="facet-l">${label}</text><text x="${f(fx)}" y="${f(fy + 8)}" class="facet-v${he ? ' he' : ''}">${value}</text>`; };
  s += facet(0, 'MONTH', ht.monthHe, true) + facet(90, 'LETTER', L.letter, true) + facet(180, 'MAZAL', L.mazal) + facet(270, 'SENSE', L.sense);
  if (frac != null) s += hand(frac * 360, sel.isDay ? 'sun' : 'moon', 146); // a short hand, outside the facets
  const step = (d) => ({ level: 'hour', focus: d > 0 ? b + 60000 : a - 60000 });
  return {
    title: `The ${ordinal(sel.hour)} hour of the ${sel.isDay ? 'day' : 'night'}: the hour of ${ht.tribe}`, live, marker: frac != null ? frac * 360 : null, svg: s,
    center: centerHTML({ badge: T.icon, badgeSize: 54, big: T.he, line: `the hour of ${ht.tribe}`, sub: live ? `Minute ${Math.floor(frac * 60) + 1} of 60` : `${fmtT(x, a)}–${fmtT(x, b)}` }),
    panel: hourPanel(x, sel, ht, a, b, live),
    children: {}, prev: step(-1), next: step(1),
  };
}

// ---------- Grounding: where you are, read from the inside out ----------
const PARENT = { hour: 'day', day: 'week', week: 'month', month: 'year', year: 'shemitah', shemitah: 'world' };
function places(x) {
  const { hd, wd } = x.jd.info, pos = hd.year % 7 || 7, mil = Math.floor(hd.year / 1000) + 1;
  const P = parshahFor(addDays(x.date, -wd), x.opts.israel);
  return {
    day: `the ${ordinal(wd + 1)} day`,
    week: P.holiday ? 'this week' : `the week of ${P.names}`,
    month: `the ${ordinal(hd.day)} of ${hd.month}`,
    year: `${hd.year}`,
    shemitah: `the ${ordinal(pos)} year of the shemitah cycle`,
    world: `the ${ordinal(mil)} millennium`,
  };
}
/** "Held within the week of Vayishlach ›": the one circle around this one. Tap it to step out. */
export function bowl(x, level) {
  const up = PARENT[level];
  if (!up) return '';
  const name = { day: places(x).day, week: places(x).week, month: x.jd.info.hd.month, year: `the year ${x.jd.info.hd.year}`, shemitah: 'the shemitah cycle', world: 'the six thousand years' }[up];
  return `<button type="button" class="bowl" data-lad="${up}">Held within ${name} <span aria-hidden="true">›</span></button>`;
}
/** The whole stack in one sentence, from the hour outward; each part takes you there. */
export function grounding(x, level) {
  const live = x.now >= x.jd.start && x.now < x.jd.end, pl = places(x);
  const h = hourOf(level === 'hour' ? x.focus : x.now, x.jd);
  const part = (l, t) => `<button type="button" class="g-part${l === level ? ' here' : ''}" data-lad="${l}">${t}</button>`;
  const hour = level === 'hour' || (level === 'day' && live) ? `${part('hour', `the ${ordinal(h.hour)} hour`)} of ` : '';
  return `<p class="grounding"><b>Here I am:</b> in ${hour}${part('day', pl.day)}, in ${part('week', pl.week)}, on ${part('month', pl.month)}, in ${part('year', pl.year)}, ${part('shemitah', pl.shemitah)}, in ${part('world', pl.world)}.</p>`;
}

// ---------- The scale: every level at once ----------
export function scales(x) {
  const n = x.nowJd, hd = n.info.hd, wd = n.info.wd, df = dayFrac(x);
  const h = hourOf(x.now, n);
  const Y = yearMonths(hd.year, n.day.date);
  const mi = Y.months.findIndex((m) => m.name === hd.month), mlen = Y.months[mi]?.len ?? 30;
  const pos = hd.year % 7 || 7, mil = Math.floor(hd.year / 1000), c = cosmic(hd.year);
  const hourIdx = (h.isDay ? 12 : 0) + h.hour - 1, hourFrac = (h.fraction * 12) % 1;
  const ht = hourTribe(h.hour);
  return [
    { level: 'world', label: 'World', value: `${ordinal(mil + 1)} millennium · the world's ${c.dayName}`, parts: 7, at: mil, frac: (hd.year % 1000) / 1000, he: true },
    { level: 'shemitah', label: 'Shemitah', value: pos === 7 ? 'Shemitah year' : `Year ${pos} of 7`, parts: 7, at: pos - 1, frac: dayIndex(Y.rh, n.day.date) / Y.len },
    { level: 'year', label: 'Year', value: `<span class="he" lang="he">${gematria(hd.year % 1000)}</span> · ${hd.year}`, parts: Y.months.length, at: mi, frac: (hd.day - 1 + df) / mlen },
    { level: 'month', label: 'Month', value: `${hd.day} ${hd.month} · ${monthLore(hd.month).tribe}`, parts: mlen, at: hd.day - 1, frac: df },
    { level: 'week', label: 'Week', value: `<span class="he" lang="he">${WEEKDAYS[wd].he}</span> · ${(() => { const P = parshahFor(addDays(n.day.date, -wd), x.opts.israel); return P.holiday ? DAYS[wd].creation : 'Parshas ' + P.names; })()}`, parts: 7, at: wd, frac: df },
    { level: 'day', label: 'Day', value: `${ordinal(h.hour)} hour of the ${h.isDay ? 'day' : 'night'}`, parts: 24, at: hourIdx, frac: hourFrac, split: 12 },
    { level: 'hour', label: 'Hour', value: `${ht.tribe} · ${ht.month}`, parts: 12, at: Math.min(11, Math.floor(hourFrac * 12)), frac: (hourFrac * 12) % 1 },
  ];
}

// ---------- Space ----------
/** The camp around the Mishkan. `rot` turns the whole dial (degrees); 0 = north up. */
export function spaceView(x, rot) {
  const j = towardJerusalem(x.loc);
  const h = hourOf(x.now, x.nowJd);
  const hourTr = hourTribe(h.hour).tribe, monthTr = monthLore(x.nowJd.info.hd.month).tribe;
  const sideCenter = { north: 0, east: 90, south: 180, west: 270 };
  let segs = '';
  const tribeAt = {};
  for (const [side, tribes] of Object.entries(CAMPS)) tribes.forEach((t, i) => {
    const a1 = sideCenter[side] - 45 + i * 30, a2 = a1 + 30, T = TRIBES[t], L = Object.values({}).length;
    const cls = t === hourTr ? ' now' : t === monthTr ? ' focus' : '';
    tribeAt[t] = a1 + 15;
    segs += `<path d="${sector(R_IN, R_OUT, a1, a2)}" class="rs${i % 2 ? ' alt' : ''}${cls}"/>`;
    T.flag.forEach((c, q) => { segs += `<path d="${sector(R_BAND, R_IN - 1, a1 + (30 * q) / T.flag.length, a1 + (30 * (q + 1)) / T.flag.length)}" fill="${c}" class="band"/>`; });
    const [lx, ly] = pt(R_NUM, a1 + 15);
    segs += `<text x="${f(lx)}" y="${f(ly)}" class="rnum small${cls ? ' now' : ''}" transform="rotate(${f(-rot)} ${f(lx)} ${f(ly)})">${T.he}</text>`;
    const [ix, iy] = pt(R_ICON, a1 + 15);
    segs += `<g transform="rotate(${f(-rot)} ${f(ix)} ${f(iy)})">${artAt(T.icon, ix, iy, 30, cls ? 'now' : 'dim')}</g>`;
  });
  for (const [d, a, l] of [['N', 0, 'פ'], ['E', 90, 'ד'], ['S', 180, 'ר'], ['W', 270, 'כ']]) {
    const [tx, ty] = pt(R_OUT + 14, a + 3.4);
    segs += `<text x="${f(tx)}" y="${f(ty)}" class="dir${d === 'N' ? ' north' : ''}" transform="rotate(${f(-rot)} ${f(tx)} ${f(ty)})">${d}</text>`;
    const [lx, ly] = pt(R_OUT + 14, a - 3.4);
    segs += `<text x="${f(lx)}" y="${f(ly)}" class="dir-letter" transform="rotate(${f(-rot)} ${f(lx)} ${f(ly)})">${l}</text>`;
  }
  const [jx, jy] = pt(R_OUT + 3, j.bearing), [jx1, jy1] = pt(100, j.bearing);
  segs += `<line x1="${f(jx1)}" y1="${f(jy1)}" x2="${f(jx)}" y2="${f(jy)}" class="ray"/><circle cx="${f(jx)}" cy="${f(jy)}" r="8" class="marker jer"/>`;
  // Fixed labels for the person holding the phone.
  const fixed = [['▲ Ahead', 0], ['Behind', 180]].map(([t, a]) => { const [tx, ty] = pt(R_OUT + 27, a); return `<text x="${f(tx)}" y="${f(ty)}" class="body-dir">${t}</text>`; }).join('');
  const svg = `${DEFS}<circle cx="${C}" cy="${C}" r="${R_OUT + 6}" class="face"/><g class="space-rot" transform="rotate(${f(rot)} ${C} ${C})">${segs}</g>${fixed}`;
  // Which camp side lies ahead, right, behind, left.
  const facing = ((-rot % 360) + 360) % 360;
  const sideOf = (deg) => ['north', 'east', 'south', 'west'][Math.round((((deg % 360) + 360) % 360) / 90) % 4];
  const around = { ahead: sideOf(facing), right: sideOf(facing + 90), behind: sideOf(facing + 180), left: sideOf(facing + 270) };
  const mi = Math.round(j.km * 0.621371);
  const offJ = Math.abs(((j.bearing - facing + 540) % 360) - 180);
  return {
    title: `Facing ${compassWord(facing)}`, svg, around, bearing: j.bearing, facing,
    center: centerHTML({ badge: 'mikdash', badgeSize: 70, big: 'ירושלים', line: offJ < 12 ? 'Straight ahead' : `${mi.toLocaleString()} mi · ${compassWord(j.bearing)}`, sub: offJ < 12 ? `${mi.toLocaleString()} mi away` : 'Turn until the dot is at the top' }),
    panel: spacePanel(x, j, mi, hourTr, monthTr, around, rot),
  };
}

// ---------- Panels ----------
function emblemPhrase(e) {
  const l = e.charAt(0).toLowerCase() + e.slice(1);
  if (/^(the|a|an) /.test(l) || /s$/.test(l)) return l;
  return (/^[aeiou]/.test(l) ? 'an ' : 'a ') + l;
}
/** A source, folded: tap "Source" to open it, tap again to close. */
export const src = (html) => `<p class="src-body">${html}</p>`;
const BUILT_REF = ['1:3–5', '1:6–8', '1:9–13', '1:14–19', '1:20–23', '1:24–31', '2:1–3'];
const card = (title, body, cls = '') => `<section class="pcard ${cls}">${title ? `<h3>${title}</h3>` : ''}${body}</section>`;
const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
const swatch = (cols) => `<span class="swatch">${cols.map((c) => `<i style="background:${c}"></i>`).join('')}</span>`;

function hourPanel(x, sel, ht, a, b, live) {
  const T = ht.t, L = ht.lore, F = ht.focus;
  const p = planetOf(x.jd.info.wd, sel.isDay, sel.hour);
  const zs = x.jd.list.filter((z) => z.t >= a && z.t < b);
  return `
    ${card(live ? 'This hour' : `${ordinal(sel.hour)} hour of the ${sel.isDay ? 'day' : 'night'}`, `
      <div class="hold"><div><span>Energy</span><p>${esc(F.energy)}</p></div><div><span>Focus</span><p>${esc(F.focus)}</p></div><div><span>Be aware</span><p>${esc(F.aware)}</p></div></div>
      ${src(`Each hour belongs to a month, in order from Nissan, after the Arizal's twelve permutations of the Name for months and hours. The month's sense and letter: Sefer Yetzirah, chapter 5. Its energy draws on the classic teachings on the months, such as Bnei Yissaschar. "Focus" and "Be aware" are Hineni's own reflections.`)}`, 'feature')}
    ${card('', `<div class="blessing"><div class="he" lang="he">${T.blessing.he}</div><div>${esc(T.blessing.en)}</div><small>${T.blessing.ref}</small></div>`)}
    ${card(`Where ${ht.tribe} camped`, campSvg(ht.tribe) + `<p class="fine">On the ${T.camp} side of the Mishkan, under a ${esc(T.flagText)} flag bearing ${esc(emblemPhrase(T.emblem))} (Bamidbar 2; Bamidbar Rabbah 2:7).</p>`)}
    ${card(`The tribe of ${ht.tribe}`, `<div class="tribe-row">${art(T.icon, 64)}<p class="lore-p">${esc(T.about)}</p></div>
      ${kv('Name', esc(T.name))}${kv('Mother', T.mother)}${kv('Flag', `${swatch(T.flag)} ${esc(T.flagText)}`)}${kv('Stone', `${L.stone}, on the choshen`)}`)}
    ${card(`Its month: ${ht.month}`, `<div class="facets">
      <div><span>Letter</span><b class="he" lang="he">${L.letter}</b></div><div><span>Sense</span><b>${L.sense}</b></div>
      <div><span>Mazal</span><b>${L.mazal}</b><small>${L.mazalEn}</small></div><div><span>Planet</span><b>${p.tr}</b><small>${p.en}</small></div></div>`)}
    ${card('The hour in time', `${live ? jewishNow(x, sel, a, b) : ''}${kv('Jewish time', `${sel.hour - 1}:00 – ${sel.hour}:00 of the ${sel.isDay ? 'day' : 'night'}`)}${kv('Part of the ' + (sel.isDay ? 'day' : 'night'), partOf(sel))}${kv('Your clock', `${fmtT(x, a)} – ${fmtT(x, b)} · ${Math.round((b - a) / 60000)} min`)}${zs.map((z) => kv(esc(z.tr), fmtT(x, z.t))).join('')}`)}
    <p class="fine src">Each hour follows a month: the first hour is Nisan's, the second Iyar's, as the Arizal ties hours and months to the same twelve permutations of the Name; Hineni repeats the cycle at night. Senses and letters: Sefer Yetzirah. The planet of the hour: Shabbos 156a, which concludes <bdi lang="he">אין מזל לישראל</bdi>.</p>`;
}

/** Where we are inside the hour, the Jewish way: its minutes, and its 1,080 chalakim. */
function jewishNow(x, sel, a, b) {
  const fr = (x.now - a) / (b - a), m = Math.floor(fr * 60), ch = Math.floor(fr * 1080) + 1;
  return kv('Now', `${sel.hour - 1}:${String(m).padStart(2, '0')} of the ${sel.isDay ? 'day' : 'night'}<small>Minute ${m + 1} of the hour's 60 · chelek ${ch.toLocaleString()} of its 1,080 (Rambam, Kiddush HaChodesh 6:2)</small>`);
}
function partOf(sel) {
  if (!sel.isDay) return `The ${ordinal(Math.ceil(sel.hour / 4))} watch of three<small>The night has three watches of four hours (Brachos 3a)</small>`;
  const h = sel.hour;
  return h <= 3 ? 'Morning: the time for Shema' : h === 4 ? 'Morning: the time for Shacharis' : h <= 6 ? 'Late morning, toward midday (chatzos)' : h <= 9 ? 'Afternoon: from Mincha Gedolah' : 'Late afternoon: Mincha Ketanah and plag';
}

export function dayPanel(x) {
  const { wd, hols, hd } = x.jd.info, D = DAYS[wd], W = WEEKDAYS[wd], Q = DAY_DEPTH[wd];
  const L = monthLore(hd.month), T = TRIBES[L.tribe];
  const om = omerDay(hd);
  const live = x.now >= x.jd.start && x.now < x.jd.end;
  const marks = [...hols.map((h) => esc(h.name)), ...(om ? [`Omer tonight: day ${om}, ${omerSefirah(om).tr}`] : [])];
  const today = live ? 'Today · ' : '';
  const head = `${today}The ${ordinal(wd + 1)} day <bdi class="he head-he" lang="he">${W.he}</bdi>`;
  return `
    ${card(head, `<div class="tribe-row">${art(D.icon, 76)}<div><small class="made">Made on the ${ordinal(wd + 1)} day</small><b class="built">${D.creation}</b><div class="he muted" lang="he">${D.creationHe}</div></div></div>
      ${marks.length ? `<p class="day-marks">${marks.join(' · ')}</p>` : ''}
      <p class="lore-p">${esc(Q.built)}</p>
      <div class="hold"><div><span>Today asks</span><p>${esc(Q.ask)}</p></div></div>
      ${live && x.now < x.jd.day.shkiah ? `<p class="edge-note">This day ends at sunset, <b>${fmtT(x, x.jd.day.shkiah)}</b>, and ${wd === 5 ? '<b>Shabbos</b> begins' : `<b>the ${ordinal((wd + 1) % 7 + 1)} day</b> begins`}. A Jewish day runs from sunset to sunset.</p>` : ''}
      ${src(`The work of the day: Bereishis ${BUILT_REF[wd]}. A day begins in the evening: "there was evening and there was morning" (Bereishis 1:5). Nissan is counted as the first month (Shemos 12:2), so ${hd.month} is the ${ordinal(MONTH_NUM[hd.month])}; the count of years begins in Tishrei (Rosh Hashanah 1:1). "Today asks" is Hineni's own reflection on the day's work, not a quotation.`)}`, 'feature day-head')}
    ${card('The day\'s light', `<div class="facets">
      <div><span>Sefirah</span><b>${D.sefirah}</b><small>${esc(Q.quality.split(': ')[1].split(',')[0])}</small></div>
      <div><span>Guest</span><b>${D.ushpiz}</b><small>${esc(Q.guest.replace(/^\w+,? ?/, ''))}</small></div>
      <div><span>Song</span><b>Tehillim ${D.shir}</b><small class="he" lang="he">${D.shirHe}</small></div></div>
      ${src('The seven days and the seven lower sefiros, from Chesed to Malchus: Kabbalah, following the Zohar. The seven "guests" (ushpizin): Zohar III 103b–104a. The song of the day, sung by the Levi\'im in the Beis Hamikdash: Mishnah Tamid 7:4.')}`)}
`;
}

function weekPanel(x, start) {
  return card('The seven days of Creation', DAYS.map((d, i) => `<button type="button" class="wkrow${i === x.wd ? ' now' : ''}" data-child="${i}">${art(d.icon, 40)}<span><b>${WEEKDAYS[i].tr}</b><small>${d.creation} · ${d.sefirah}</small></span><span class="muted">${civ(addDays(start, i))}</span></button>`).join(''));
}

function monthPanel(x, lore, T, start, len) {
  const m = MONTH_NUM[x.hd.month], F = MONTH_FOCUS[x.hd.month];
  const cur = molad(m, x.hd.year), [nm, ny] = nextMonth(m, x.hd.year), nxt = molad(nm, ny);
  const kl = kiddushLevanah(m, x.hd.year);
  const kls = x.now < kl.start ? `From ${fmtD(x, kl.start)}` : x.now < kl.end ? `<b>Now</b>, until ${fmtD(x, kl.end)}` : 'Passed for this month';
  const hols = [];
  for (let i = 0; i < len; i++) for (const h of dayInfo(addDays(start, i), x.opts.israel).hols) if (h.kind !== 'erev' && h.key !== 'rc' && !hols.some((q) => q.key === h.key)) hols.push({ ...h, day: i + 1 });
  return `
    ${card(`${x.hd.month}: the month of ${lore.tribe}`, `<div class="hold"><div><span>Energy</span><p>${esc(F.energy)}</p></div><div><span>Focus</span><p>${esc(F.focus)}</p></div></div>`, 'feature')}
    ${card('', `<div class="tribe-row">${art(T.icon, 64)}<p class="lore-p">${esc(T.about)}</p></div>
      <div class="facets"><div><span>Letter</span><b class="he" lang="he">${lore.letter}</b></div><div><span>Sense</span><b>${lore.sense}</b></div><div><span>Mazal</span><b>${lore.mazal}</b><small>${lore.mazalEn}</small></div></div>`)}
    ${card('The moon', `${kv(`Molad ${esc(cur.month)}`, `${moladText(cur)}<small>Jerusalem time · ${fmtD(x, cur.utc)}, ${fmtT(x, cur.utc)} your time</small>`)}
      ${kv(`Molad ${esc(nxt.month)}`, `${moladText(nxt)}<small>${fmtD(x, nxt.utc)}, ${fmtT(x, nxt.utc)} your time</small>`)}
      ${kv('Kiddush Levanah', `${kls}<small>From 7 days after the molad (Chabad custom) to mid-month</small>`)}`)}
    ${hols.length ? card('This month', hols.map((h) => kv(`${h.day} ${x.hd.month}`, esc(h.name.replace(/ · \d+\w+ light/, '')))).join('')) : ''}`;
}

function yearPanel(x, Y) {
  const cyc = ((x.hd.year - 1) % 19) + 1, leaps = [3, 6, 8, 11, 14, 17, 19];
  const items = [], seen = new Set();
  const di = dayIndex(Y.rh, x.nowJd.day.date), from = di >= 0 && di < Y.len ? x.nowJd.day.date : Y.rh;
  for (let i = 0; i < 120 && items.length < 6; i++) {
    const inf = dayInfo(addDays(from, i), x.opts.israel);
    for (const h of inf.hols) { const k = h.key === 'chm' ? h.name : h.key; if (seen.has(k) || h.kind === 'erev' || h.kind === 'rc') continue; seen.add(k); items.push({ h, inf }); }
  }
  return `
    ${card('Coming up', `<ul class="upcoming">${items.map(({ h, inf }) => `<li><span class="dot k-${h.kind}"></span><span class="u-name">${esc(h.name.replace(/ · \d+\w+ light/, ''))}<small>${inf.hd.day} ${inf.hd.month} · ${civ(inf.date)}</small></span></li>`).join('')}</ul>`)}
    ${card('The 19-year cycle', `<div class="dots-row big">${Array.from({ length: 19 }, (_, i) => `<span class="wk${i + 1 < cyc ? ' done' : ''}${i + 1 === cyc ? ' now' : ''}${leaps.includes(i + 1) ? ' leap' : ''}">${i + 1}</span>`).join('')}</div><p class="fine">Seven years in nineteen add a second Adar so Pesach stays in spring. Ringed years are leap years; this is year ${cyc}.</p>`)}`;
}

function shemitahPanel(x, first, pos) {
  const name = { sheni: "Ma'aser sheni: eaten in Yerushalayim", ani: "Ma'aser ani: given to the poor", rest: 'Shemitah: the land rests, debts are released' };
  return card('Seven years', Array.from({ length: 7 }, (_, i) => `<div class="wkrow${i === pos - 1 ? ' now' : ''}"><span class="swatch big"><i style="background:${MAASER_COLOR[MAASER(i + 1)]}"></i></span><span><b>${first + i}</b><small>${name[MAASER(i + 1)]}</small></span><span class="muted">Year ${i + 1}</span></div>`).join('') + '<p class="fine">Vayikra 25; Devarim 14. The colors on the ring show which tithe each year carries.</p>');
}

function worldPanel(x, c) {
  return card('Six days of a thousand years', `<p class="lore-p">"The world exists for six thousand years: two thousand of tohu, two thousand of Torah, two thousand of the days of Moshiach" (Sanhedrin 97a). Each millennium is a day of the cosmic week, and the seventh is Shabbos.</p>
    <div class="eras"><span style="--c:${ERA_COLOR[0]}">Tohu</span><span style="--c:${ERA_COLOR[2]}">Torah</span><span style="--c:${ERA_COLOR[4]}">Days of Moshiach</span><span style="--c:${ERA_COLOR[6]}">Shabbos</span></div>
    <p class="lore-p">${x.hd.year} is in the ${ordinal(c.mil)} millennium, the world's ${c.dayName}. Year ${x.hd.year % 1000} of it is like the ${ordinal(c.hour)} hour of ${c.isDay ? 'that day' : 'that night'}${c.dayName === 'Friday' ? ': Erev Shabbos afternoon, time to prepare.' : '.'}</p>`, 'feature');
}

const DIR_LETTER = { east: ['ד', 'Dalet'], west: ['כ', 'Kaf'], north: ['פ', 'Pei'], south: ['ר', 'Reish'] };
const DIR_HE = { north: 'צפון', south: 'דרום', east: 'מזרח', west: 'מערב' };
// The angels around you, as said in the Shema at bedtime (from Bamidbar Rabbah 2:10).
const ANGEL = { Ahead: ['Uriel', 'אוריאל'], Behind: ['Refael', 'רפאל'], Right: ['Michael', 'מיכאל'], Left: ['Gavriel', 'גבריאל'] };
// Sefer Yetzirah 1:13: the six directions sealed with the three letters of the Name (Kaplan's text; editions differ).
const SEALS = [['Above', 'יהו'], ['Below', 'יוה'], ['East · ahead', 'היו'], ['West · behind', 'הוי'], ['South · right', 'ויה'], ['North · left', 'והי']];
function spacePanel(x, j, mi, hourTr, monthTr, around, rot) {
  const row = (lbl, side) => `<div class="kv"><span>${lbl}<small class="angel">${ANGEL[lbl][0]} <bdi class="he" lang="he">${ANGEL[lbl][1]}</bdi></small></span><b><span class="dirrow"><span class="he big-l" lang="he">${DIR_LETTER[side][0]}</span> ${side[0].toUpperCase() + side.slice(1)} · <bdi class="he" lang="he">${DIR_HE[side]}</bdi></span><small><bdi class="he" lang="he">${CAMPS[side].map((t) => TRIBES[t].he).join(' · ')}</bdi></small></b></div>`;
  const phone = typeof DeviceOrientationEvent !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  return `
    ${card('Around you', `${row('Ahead', around.ahead)}${row('Right', around.right)}${row('Behind', around.behind)}${row('Left', around.left)}
      <div class="kv"><span>Above · below<small class="angel">The Shechinah above</small></span><b><span class="dirrow"><span class="he big-l" lang="he">ב</span> above · <span class="he big-l" lang="he">ג</span> below</span></b></div>
      <div class="space-btns"><button id="faceJ" class="btn" type="button">Face Yerushalayim</button><button id="northUp" class="btn ghost" type="button">North up</button>${phone ? '<button id="compassBtn" class="btn ghost" type="button">Connect to compass</button>' : ''}</div>
      <p class="fine">Drag the dial to turn it${phone ? ', or connect it to your phone\'s compass' : ''}. The top of the dial is the way you face.</p>
      ${src('The letters of the six directions, and ת for the Holy Palace in the middle: Sefer Yetzirah 4:3 (editions differ in the order). The angels around you: "On my right Michael, on my left Gavriel, before me Uriel, behind me Refael, and above my head the Shechinah of G-d," from the Shema at bedtime, based on Bamidbar Rabbah 2:10. The camp: Bamidbar 2.')}`, 'feature')}
    ${card('The six directions, sealed', `<p class="lore-p">Sefer Yetzirah tells how the world's six directions were sealed, each with the three letters of the Name in a different order. Wherever you turn, the Name is there.</p>
      <div class="seals">${SEALS.map(([d, l]) => `<div><span>${d}</span><b class="he" lang="he">${l}</b></div>`).join('')}</div>
      ${src('Sefer Yetzirah 1:13, as translated by Rabbi Aryeh Kaplan. Editions of Sefer Yetzirah differ in which order goes with which direction.')}`)}
    ${card(`Where ${hourTr} camped`, campSvg(hourTr, rot) + `<p class="fine">This hour's tribe, in the camp around the Mishkan, turned with the dial to the way you face.</p>`, 'camp-card')}
    ${card('The camp', `<p class="lore-p">The dial is the camp in the desert (Bamidbar 2): Yehudah, Yissachar and Zevulun to the east; Reuven, Shimon and Gad to the south; Ephraim, Menashe and Binyamin to the west; Dan, Asher and Naftali to the north. At the center, where the Mishkan stood and the Beis Hamikdash would stand, is the Holy Palace.</p>
      <p class="lore-p">Lit: <b>${hourTr}</b>, this hour's tribe. Outlined: <b>${monthTr}</b>, this month's. The gold dot points to Yerushalayim, ${mi.toLocaleString()} miles to the ${compassWord(j.bearing)}.</p>`)}`;
}

export function campSvg(hi, rot = null) {
  const slots = { north: (i) => [22 + i * 28, 10, 26], south: (i) => [22 + i * 28, 90, 26], east: (i) => [112, 28 + i * 22, 30], west: (i) => [-12, 28 + i * 22, 30] };
  // In Space it turns with the dial; its words stay upright.
  const up = (tx, ty) => (rot == null ? '' : ` transform="rotate(${f(-rot)} ${tx} ${ty})"`);
  let out = '';
  for (const [side, tribes] of Object.entries(CAMPS)) tribes.forEach((t, i) => {
    const [x, y, w] = slots[side](i);
    out += `<g class="camp-t${t === hi ? ' hour' : ''}"><rect x="${x - w / 2}" y="${y - 6.5}" width="${w}" height="13" rx="3"/><text x="${x}" y="${y + 0.5}"${up(x, y + 0.5)}>${TRIBES[t].he}</text></g>`;
  });
  const body = `<text x="50" y="-6" class="camp-dir"${up(50, -6)}>North</text><text x="50" y="106" class="camp-dir"${up(50, 106)}>South</text><text x="140" y="50" class="camp-dir"${up(140, 50)}>East</text><text x="-40" y="50" class="camp-dir"${up(-40, 50)}>West</text>
    <rect x="30" y="28" width="40" height="44" rx="2" class="mishkan"/><text x="50" y="47" class="camp-m"${up(50, 47)}>משכן</text><text x="50" y="58" class="camp-l"${up(50, 58)}>לוי</text>${out}`;
  if (rot == null) return `<svg class="camp" viewBox="-52 -12 204 124" role="img" aria-label="The tribes camped around the Mishkan">${body}</svg>`;
  return `<svg class="camp" viewBox="-52 -52 204 204" role="img" aria-label="The tribes camped around the Mishkan, turned to the way you face"><g transform="rotate(${f(rot)} 50 50)">${body}</g></svg>`;
}
