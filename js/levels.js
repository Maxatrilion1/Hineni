// The zoomable dial: each level is a ring of its parts, with "now" marked, and a panel of lore beneath.
import { jewishDay, hourOf, zmanimFor, addDays, weekday, dayInfo } from './zmanim.js';
import { hebrewDate, gematria, WEEKDAYS, monthLore, moonPhase } from './hebrew.js';
import { MONTH_NUM, isLeap, molad, moladText, nextMonth, kiddushLevanah, planetOf } from './calendar.js';
import { TRIBES, CAMPS, DAYS, hourMonth, towardJerusalem, compassWord } from './lore.js';
import { icon, iconAt } from './emblems.js';

export const LEVELS = ['hour', 'day', 'week', 'month', 'year', 'shemitah', 'world'];
const C = 200, R_OUT = 188, R_IN = 158, R_BAND = 150, R_NUM = 173, R_ICON = 124;
const pt = (r, a) => [C + r * Math.sin((a * Math.PI) / 180), C - r * Math.cos((a * Math.PI) / 180)];
const f = (n) => n.toFixed(2);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const plain = (s) => s.replace(/[׳״]/g, '');

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
  for (let k = -400; k < 400; k++) {
    const d = addDays(near, -Math.abs(k)), h = hebrewDate(d);
    if (h.year === year && h.month === 'Tishrei' && h.day === 1) { rh = d; break; }
    const d2 = addDays(near, Math.abs(k)), h2 = hebrewDate(d2);
    if (h2.year === year && h2.month === 'Tishrei' && h2.day === 1) { rh = d2; break; }
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
export function monthLength(date, hd) {
  return hebrewDate(addDays(date, 30 - hd.day)).day === 30 ? 30 : 29;
}
const dateForYear = (y) => ({ y: y - 3761, m: 11, d: 15 });

export function hourTribe(h) {
  const m = hourMonth(h);
  const lore = monthLore(m.month);
  return { ...m, lore, tribe: lore.tribe, t: TRIBES[lore.tribe] };
}

export function cosmic(year) {
  const mil = Math.floor(year / 1000);
  const frac = (year % 1000) / 1000, sha = frac * 24, isDay = sha >= 12;
  const hour = Math.floor(isDay ? sha - 12 : sha) + 1;
  return { mil: mil + 1, dayName: WEEKDAYS[mil].en, hour, isDay };
}

/** Everything a view needs, derived from the focus moment. */
export function context(focus, now, loc, opts) {
  const jd = jewishDay(focus, loc, opts);
  const nowJd = focus === now ? jd : jewishDay(now, loc, opts);
  const date = jd.day.date, hd = jd.info.hd, wd = jd.info.wd;
  const chatzos = (d) => zmanimFor(d, loc).chatzos ?? Date.UTC(d.y, d.m - 1, d.d, 12);
  return { focus, now, loc, opts, jd, nowJd, date, hd, wd, chatzos };
}

// ---------- Ring drawing ----------
function ring(segs, { marker = null, extra = '', band = true } = {}) {
  let s = `<circle cx="${C}" cy="${C}" r="${R_OUT + 6}" class="face"/>`;
  for (const g of segs) {
    s += `<path d="${sector(R_IN, R_OUT, g.a1, g.a2)}" class="seg ${g.cls || ''}${g.isNow ? ' now' : ''}${g.isFocus ? ' focus' : ''}" data-child="${g.id}"/>`;
    if (band && g.band) {
      const k = g.band.length;
      g.band.forEach((c, j) => { s += `<path d="${sector(R_BAND, R_IN - 1, g.a1 + ((g.a2 - g.a1) * j) / k, g.a1 + ((g.a2 - g.a1) * (j + 1)) / k)}" fill="${c}" class="band" data-child="${g.id}"/>`; });
    }
    const mid = (g.a1 + g.a2) / 2;
    if (g.label) { const [x, y] = pt(R_NUM, mid); s += `<text x="${f(x)}" y="${f(y)}" class="num${g.isNow ? ' now' : ''} ${g.labelCls || ''}">${g.label}</text>`; }
    if (g.icon) { const [x, y] = pt(R_ICON, mid); s += iconAt(g.icon, x, y, g.iconSize || 20, `ring-ico${g.isNow ? ' now' : ''}`); }
    if (g.moon != null) { const [x, y] = pt(R_ICON + 4, mid); s += moonShape(x, y, 5, g.moon, g.isNow); }
  }
  s += extra;
  if (marker != null) {
    const [x1, y1] = pt(104, marker), [x2, y2] = pt(R_OUT + 3, marker), [mx, my] = pt(R_OUT + 3, marker);
    s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="ray"/><circle cx="${f(mx)}" cy="${f(my)}" r="6" class="marker"/>`;
  }
  return s;
}

function moonShape(cx, cy, r, phase, hi) {
  const k = Math.cos(2 * Math.PI * phase), waxing = phase < 0.5, rx = Math.abs(k) * r;
  const limb = waxing ? 1 : 0, sweep = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
  return `<g class="moonph${hi ? ' now' : ''}"><circle cx="${f(cx)}" cy="${f(cy)}" r="${r}" class="moon-dark"/><path d="M${f(cx)} ${f(cy - r)}A${r} ${r} 0 0 ${limb} ${f(cx)} ${f(cy + r)}A${f(rx)} ${r} 0 0 ${sweep} ${f(cx)} ${f(cy - r)}Z" class="moon-lit"/></g>`;
}

const seven = (i) => { const step = 360 / 7; return [(i - 6) * step - step / 2, (i - 5) * step - step / 2]; };

// ---------- Levels ----------
// Each returns { svg, center, panel(html), children: id → focus, prev, next, crumb }.

export function weekView(x) {
  const start = addDays(x.date, -x.wd);
  const nowIn = dayIndex(start, x.nowJd.day.date);
  const segs = DAYS.map((d, i) => {
    const [a1, a2] = seven(i);
    const date = addDays(start, i);
    const hols = dayInfo(date, x.opts.israel).hols;
    return { a1, a2, id: i, label: i === 6 ? 'ש' : plain(gematria(i + 1)), icon: d.icon, isNow: nowIn === i, isFocus: i === x.wd,
      cls: (i === 6 ? 'shabbos' : 'day') + (hols.some((h) => h.kind === 'yt') ? ' yt' : ''), band: hols.length ? ['#e9c46a'] : null, date };
  });
  let marker = null;
  if (nowIn >= 0 && nowIn < 7) { const [a1, a2] = seven(nowIn); marker = a1 + (a2 - a1) * ((x.now - x.nowJd.start) / (x.nowJd.end - x.nowJd.start)); }
  const toShabbos = 6 - x.wd;
  return {
    svg: ring(segs, { marker }),
    center: centerHTML({ eyebrow: 'The week', icon: DAYS[x.wd].icon, big: WEEKDAYS[x.wd].he, line: x.wd === 6 ? 'Shabbos Kodesh' : `${ordinal(x.wd + 1)} day · Shabbos ${toShabbos === 1 ? 'tomorrow' : `in ${toShabbos} days`}` }),
    panel: weekPanel(x, start),
    children: Object.fromEntries(segs.map((s) => [s.id, { level: 'day', focus: x.chatzos(s.date) }])),
    prev: { level: 'week', focus: x.chatzos(addDays(start, -4)) }, next: { level: 'week', focus: x.chatzos(addDays(start, 10)) },
  };
}

export function monthView(x) {
  const len = monthLength(x.date, x.hd);
  const start = addDays(x.date, -(x.hd.day - 1));
  const lore = monthLore(x.hd.month), T = TRIBES[lore.tribe];
  const nowIn = dayIndex(start, x.nowJd.day.date);
  const step = 360 / len;
  const segs = Array.from({ length: len }, (_, i) => {
    const date = addDays(start, i);
    const hols = dayInfo(date, x.opts.israel).hols.filter((h) => h.kind !== 'erev');
    return { a1: i * step, a2: (i + 1) * step, id: i, label: plain(gematria(i + 1)), labelCls: 'small', moon: moonPhase(i + 1), isNow: nowIn === i, isFocus: i === x.hd.day - 1,
      cls: (weekday(date) === 6 ? 'shabbos' : 'day') + (hols.some((h) => h.kind === 'yt') ? ' yt' : ''), band: hols.length ? ['#e9c46a'] : (weekday(date) === 6 ? ['#8d93c9'] : null), date };
  });
  let marker = null;
  if (nowIn >= 0 && nowIn < len) marker = (nowIn + (x.now - x.nowJd.start) / (x.nowJd.end - x.nowJd.start)) * step;
  return {
    svg: ring(segs, { marker, extra: '' }),
    center: centerHTML({ eyebrow: `Month of ${lore.tribe}`, icon: T.icon, big: `${plain(gematria(x.hd.day))} ${hebrewDate(x.date).he.split(' ').slice(1, -1).join(' ')}`, line: `${x.hd.month} · day ${x.hd.day} of ${len}` }),
    panel: monthPanel(x, lore, T, start, len),
    children: Object.fromEntries(segs.map((s) => [s.id, { level: 'day', focus: x.chatzos(s.date) }])),
    prev: { level: 'month', focus: x.chatzos(addDays(start, -10)) }, next: { level: 'month', focus: x.chatzos(addDays(start, len + 10)) },
  };
}

export function yearView(x) {
  const Y = yearMonths(x.hd.year, x.date);
  const n = Y.months.length, step = 360 / n;
  const nowHd = x.nowJd.info.hd;
  const doy = dayIndex(Y.rh, x.nowJd.day.date);
  const segs = Y.months.map((m, i) => {
    const lore = monthLore(m.name), T = TRIBES[lore.tribe];
    const he = hebrewDate(m.start).he.split(' ').slice(1, -1).join(' ');
    return { a1: i * step, a2: (i + 1) * step, id: i, label: he, labelCls: he.length > 4 ? 'small' : '', icon: T.icon, iconSize: 18, band: T.flag,
      isNow: nowHd.year === x.hd.year && nowHd.month === m.name, isFocus: x.hd.month === m.name, cls: 'day', m };
  });
  let marker = null;
  if (doy >= 0 && doy < Y.len) {
    const i = Y.months.findIndex((m) => m.name === nowHd.month);
    marker = (i + (nowHd.day - 1 + (x.now - x.nowJd.start) / (x.nowJd.end - x.nowJd.start)) / Y.months[i].len) * step;
  }
  const dayOfYear = dayIndex(Y.rh, x.date) + 1;
  return {
    svg: ring(segs, { marker }),
    center: centerHTML({ eyebrow: 'The year', big: gematria(x.hd.year % 1000), line: `${x.hd.year} · ${isLeap(x.hd.year) ? 'leap year' : '12 months'}`, sub: `Day ${dayOfYear} of ${Y.len}` }),
    panel: yearPanel(x, Y),
    children: Object.fromEntries(segs.map((s) => [s.id, { level: 'month', focus: x.chatzos(s.isNow ? x.nowJd.day.date : addDays(s.m.start, 14)) }])),
    prev: { level: 'year', focus: x.chatzos(dateForYear(x.hd.year - 1)) }, next: { level: 'year', focus: x.chatzos(dateForYear(x.hd.year + 1)) },
  };
}

const MAASER = (n) => (n === 7 ? 'rest' : [3, 6].includes(n) ? 'ani' : 'sheni');
const MAASER_COLOR = { sheni: '#7fa7d9', ani: '#c27b8a', rest: '#3d7a4c' };
export function shemitahView(x) {
  const pos = x.hd.year % 7 || 7, first = x.hd.year - pos + 1;
  const nowPos = x.nowJd.info.hd.year - first;
  const segs = Array.from({ length: 7 }, (_, i) => {
    const [a1, a2] = seven(i);
    return { a1, a2, id: i, label: i === 6 ? 'שמיטה' : plain(gematria((first + i) % 1000)), labelCls: 'small', band: [MAASER_COLOR[MAASER(i + 1)]],
      isNow: nowPos === i, isFocus: i === pos - 1, cls: i === 6 ? 'shabbos' : 'day', year: first + i };
  });
  let marker = null;
  if (nowPos >= 0 && nowPos < 7) {
    const Y = yearMonths(x.nowJd.info.hd.year, x.nowJd.day.date);
    const [a1, a2] = seven(nowPos);
    marker = a1 + (a2 - a1) * (dayIndex(Y.rh, x.nowJd.day.date) / Y.len);
  }
  return {
    svg: ring(segs, { marker }),
    center: centerHTML({ eyebrow: 'The shemitah cycle', big: pos === 7 ? 'שמיטה' : `${pos} / 7`, line: pos === 7 ? 'The land rests' : `Year ${pos}: ma'aser ${MAASER(pos)}`, sub: `Shemitah in ${first + 6}` }),
    panel: shemitahPanel(x, first, pos),
    children: Object.fromEntries(segs.map((s) => [s.id, { level: 'year', focus: x.chatzos(dateForYear(s.year)) }])),
    prev: { level: 'shemitah', focus: x.chatzos(dateForYear(x.hd.year - 7)) }, next: { level: 'shemitah', focus: x.chatzos(dateForYear(x.hd.year + 7)) },
  };
}

const ERA_COLOR = ['#9a8b7a', '#9a8b7a', '#7fa7d9', '#7fa7d9', '#e9c46a', '#e9c46a', '#f2efe6'];
export function worldView(x) {
  const mil = Math.floor(x.hd.year / 1000);
  const segs = Array.from({ length: 7 }, (_, i) => {
    const [a1, a2] = seven(i);
    return { a1, a2, id: i, label: i === 6 ? 'ש' : plain(gematria(i + 1)), icon: DAYS[i].icon, band: [ERA_COLOR[i]], isNow: i === mil, isFocus: i === mil, cls: i === 6 ? 'shabbos' : 'day' };
  });
  const [a1, a2] = seven(mil);
  const c = cosmic(x.hd.year);
  return {
    svg: ring(segs, { marker: a1 + (a2 - a1) * ((x.nowJd.info.hd.year % 1000) / 1000) }),
    center: centerHTML({ eyebrow: '6,000 years', icon: 'globe', big: x.hd.year.toLocaleString(), line: `${ordinal(c.mil)} millennium · the world's ${c.dayName}`, sub: `like its ${ordinal(c.hour)} hour of ${c.isDay ? 'day' : 'night'}` }),
    panel: worldPanel(x, c),
    children: { [mil]: { level: 'shemitah', focus: x.focus } },
  };
}

/** Inside one hour: the ring is the hour itself, 60 zmani minutes. */
export function hourView(x, sel) {
  const len = sel.isDay ? x.jd.day.hour : x.jd.night.hour;
  const a = (sel.isDay ? x.jd.day.netz : x.jd.night.start) + (sel.hour - 1) * len, b = a + len;
  const ht = hourTribe(sel.hour), T = ht.t, L = ht.lore;
  const live = x.now >= a && x.now < b;
  const frac = live ? (x.now - a) / len : null;
  let s = `<circle cx="${C}" cy="${C}" r="${R_OUT + 6}" class="face"/>`;
  s += `<path d="${sector(R_IN, R_OUT, 0, 359.99)}" class="seg ${sel.isDay ? 'day' : 'night'} hour-ring"/>`;
  if (frac != null && frac > 0) s += `<path d="${sector(R_IN, R_OUT, 0, Math.max(0.5, frac * 360))}" class="seg progress"/>`;
  for (let m = 0; m < 60; m++) {
    const big = m % 5 === 0;
    const [x1, y1] = pt(R_OUT - (big ? 9 : 4), m * 6), [x2, y2] = pt(R_OUT, m * 6);
    s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="mtick${big ? ' big' : ''}"/>`;
    if (big && m) { const [tx, ty] = pt(R_IN + 12, m * 6); s += `<text x="${f(tx)}" y="${f(ty)}" class="mnum">${m}</text>`; }
  }
  const k = T.flag.length, slices = k === 1 ? 1 : 24;
  for (let j = 0; j < slices; j++) s += `<path d="${sector(R_BAND, R_IN - 1, (360 * j) / slices, (360 * (j + 1)) / slices - (slices === 1 ? 0.01 : 0))}" fill="${T.flag[j % k]}" class="band"/>`;
  const facet = (ang, label, value, he) => { const [fx, fy] = pt(ang % 180 ? 128 : 134, ang); return `<text x="${f(fx)}" y="${f(fy - 7)}" class="facet-l">${label}</text><text x="${f(fx)}" y="${f(fy + 8)}" class="facet-v${he ? ' he' : ''}">${value}</text>`; };
  s += facet(0, 'MONTH', ht.monthHe, true) + facet(90, 'LETTER', L.letter, true) + facet(180, 'MAZAL', L.mazal) + facet(270, 'SENSE', L.sense);
  if (frac != null) { const [mx, my] = pt(R_OUT + 3, frac * 360); s += `<circle cx="${f(mx)}" cy="${f(my)}" r="6" class="marker"/>`; }
  const step = (d) => { const t = d > 0 ? b + 60000 : a - 60000; return { level: 'hour', focus: t, hourAt: true }; };
  return {
    svg: s,
    center: centerHTML({ icon: T.icon, iconSize: 44, big: T.he, line: `${ht.tribe} · ${T.emblem}`, sub: live ? `${Math.floor(frac * 60)} of 60 minutes` : `${fmtT(x, a)}–${fmtT(x, b)}` }),
    panel: hourPanel(x, sel, ht, a, b),
    children: {}, prev: step(-1), next: step(1),
  };
}

// ---------- Space ----------
export function spaceView(x, heading) {
  const j = towardJerusalem(x.loc);
  const h = hourOf(x.now, x.nowJd);
  const hourTr = hourTribe(h.hour).tribe, monthTr = monthLore(x.nowJd.info.hd.month).tribe;
  const rot = heading == null ? 0 : -heading;
  // 12 tribes, 30° each, three to a side centered on N/E/S/W.
  let segs = '';
  const sideCenter = { north: 0, east: 90, south: 180, west: 270 };
  for (const [side, tribes] of Object.entries(CAMPS)) {
    tribes.forEach((t, i) => {
      const a1 = sideCenter[side] - 45 + i * 30, a2 = a1 + 30;
      const T = TRIBES[t];
      const cls = t === hourTr ? ' now' : t === monthTr ? ' focus' : '';
      segs += `<path d="${sector(R_IN, R_OUT, a1, a2)}" class="seg day${cls}"/>`;
      T.flag.forEach((c, q) => { segs += `<path d="${sector(R_BAND, R_IN - 1, a1 + (30 * q) / T.flag.length, a1 + (30 * (q + 1)) / T.flag.length)}" fill="${c}" class="band"/>`; });
      const [lx, ly] = pt(R_NUM, a1 + 15); segs += `<text x="${f(lx)}" y="${f(ly)}" class="num small${cls ? ' now' : ''}" transform="rotate(${-rot} ${f(lx)} ${f(ly)})">${T.he}</text>`;
      const [ix, iy] = pt(R_ICON, a1 + 15); segs += `<g transform="rotate(${-rot} ${f(ix)} ${f(iy)})">${iconAt(T.icon, ix, iy, 18, 'ring-ico' + (cls ? ' now' : ''))}</g>`;
    });
  }
  for (const [d, a] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]]) { const [tx, ty] = pt(R_OUT + 14, a); segs += `<text x="${f(tx)}" y="${f(ty)}" class="dir" transform="rotate(${-rot} ${f(tx)} ${f(ty)})">${d}</text>`; }
  const [jx, jy] = pt(R_OUT + 3, j.bearing), [jx1, jy1] = pt(104, j.bearing);
  segs += `<line x1="${f(jx1)}" y1="${f(jy1)}" x2="${f(jx)}" y2="${f(jy)}" class="ray"/><circle cx="${f(jx)}" cy="${f(jy)}" r="7" class="marker"/>`;
  const svg = `<circle cx="${C}" cy="${C}" r="${R_OUT + 6}" class="face"/><g transform="rotate(${rot} ${C} ${C})">${segs}</g>`;
  const mi = Math.round(j.km * 0.621371);
  return {
    svg,
    center: centerHTML({ eyebrow: x.loc.name, icon: 'mishkan', iconSize: 44, big: 'ירושלים', line: `${mi.toLocaleString()} mi to the ${compassWord(j.bearing)}`, sub: heading == null ? 'North is up' : 'Turning with you' }),
    panel: spacePanel(x, j, mi, hourTr, monthTr, heading),
  };
}

// ---------- Center ----------
function centerHTML({ eyebrow = '', icon: ic, iconSize = 34, big = '', line = '', sub = '' }) {
  return `<span class="c-eyebrow">${esc(eyebrow)}</span>${ic ? `<span class="c-ico">${icon(ic, iconSize)}</span>` : ''}<span class="c-big he" lang="he">${big}</span><span class="c-line">${esc(line)}</span>${sub ? `<span class="c-sub">${esc(sub)}</span>` : ''}`;
}
const fmtT = (x, t) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: x.loc.tz }).format(new Date(t));
const fmtD = (x, t) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: x.loc.tz }).format(new Date(t));
const civ = (d) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(d.y, d.m - 1, d.d, 12)));

// ---------- Panels ----------
const card = (title, body, cls = '') => `<section class="pcard ${cls}">${title ? `<h3>${title}</h3>` : ''}${body}</section>`;
const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
const swatch = (cols) => `<span class="swatch">${cols.map((c) => `<i style="background:${c}"></i>`).join('')}</span>`;

function hourPanel(x, sel, ht, a, b) {
  const T = ht.t, L = ht.lore;
  const p = planetOf(x.jd.info.wd, sel.isDay, sel.hour);
  const zs = x.jd.list.filter((z) => z.t >= a && z.t < b);
  return `
    ${card('', `<div class="blessing"><div class="he" lang="he">${T.blessing.he}</div><div>${esc(T.blessing.en)}</div><small>${T.blessing.ref}</small></div>`, 'hero')}
    ${card(`The tribe of ${ht.tribe}`, `<div class="tribe-row">${icon(T.icon, 52, 'big-ico')}<p class="lore-p">${esc(T.about)}</p></div>
      ${kv('Flag', `${swatch(T.flag)} ${esc(T.flagText)}`)}${kv('Emblem', `${esc(T.emblem)} <small>Bamidbar Rabbah 2:7</small>`)}
      ${kv('Name', esc(T.name))}${kv('Mother', T.mother)}${kv('Stone', `${L.stone}, on the choshen`)}`)}
    ${card('Where it camped', campSvg(ht.tribe) + `<p class="fine">${ht.tribe} camped on the ${T.camp} side of the Mishkan (Bamidbar 2).</p>`)}
    ${card(`Its month: ${ht.month}`, `<div class="facets">
      <div><span>Letter</span><b class="he" lang="he">${L.letter}</b></div>
      <div><span>Sense</span><b>${L.sense}</b></div>
      <div><span>Mazal</span><b>${L.mazal}</b><small>${L.mazalEn}</small></div>
      <div><span>Planet</span><b>${p.tr}</b><small>${p.en}</small></div></div>
      <p class="fine">Sefer Yetzirah pairs each month with a letter, a sense and a mazal. The hour's planet follows Shabbos 156a, which concludes <bdi lang="he">אין מזל לישראל</bdi>.</p>`)}
    ${card('The hour in time', `${kv('Jewish time', `${sel.hour - 1}:00 – ${sel.hour}:00 of the ${sel.isDay ? 'day' : 'night'}`)}${kv('Your clock', `${fmtT(x, a)} – ${fmtT(x, b)} · ${Math.round((b - a) / 60000)} min`)}
      ${zs.map((z) => kv(esc(z.tr), fmtT(x, z.t))).join('')}`)}
    <p class="fine src">Each hour follows a month: the first hour is Nisan's, the second Iyar's, as the Arizal ties hours and months to the same twelve permutations of the Name. Hineni repeats the cycle at night. Emblems and colors: Bamidbar Rabbah 2:7.</p>`;
}

export function dayPanel(x) {
  const { wd, hols } = x.jd.info, D = DAYS[wd], W = WEEKDAYS[wd];
  const p = planetOf(wd, true, 1);
  return `
    ${hols.length ? `<div class="chips">${hols.map((h) => `<span class="chip k-${h.kind}">${esc(h.name)}</span>`).join('')}</div>` : ''}
    ${card(`${W.tr} · ${W.he}`, `<div class="tribe-row">${icon(D.icon, 52, 'big-ico')}<div><b>${D.creation}</b><div class="he muted" lang="he">${D.creationHe}</div><p class="fine tight">Created on the ${ordinal(wd + 1)} day (Bereishis 1). Days have no names in Hebrew: each counts toward Shabbos.</p></div></div>
      <div class="facets">
        <div><span>Sefirah</span><b>${D.sefirah}</b><small class="he" lang="he">${D.sefirahHe}</small></div>
        <div><span>Ushpiz</span><b>${D.ushpiz}</b></div>
        <div><span>Song</span><b>Tehillim ${D.shir}</b><small class="he" lang="he">${D.shirHe}</small></div>
        <div><span>Planet</span><b>${p.tr}</b><small>${p.en}</small></div></div>`)}
    ${card('Tap an hour to step inside it', `<div class="hours-strip">${Array.from({ length: 12 }, (_, i) => { const t = TRIBES[monthLore(hourMonth(i + 1).month).tribe]; return `<span>${icon(t.icon, 20)}<small>${i + 1}</small></span>`; }).join('')}</div><p class="fine">The twelve hours of the day and of the night, each with its tribe.</p>`)}`;
}

function weekPanel(x, start) {
  return card('The seven days', DAYS.map((d, i) => {
    const date = addDays(start, i);
    return `<button type="button" class="wkrow${i === x.wd ? ' now' : ''}" data-child="${i}">${icon(d.icon, 22)}<span><b>${WEEKDAYS[i].tr}</b><small>${d.creation}</small></span><span class="muted">${civ(date)}</span></button>`;
  }).join(''));
}

function monthPanel(x, lore, T, start, len) {
  const m = MONTH_NUM[x.hd.month];
  const cur = molad(m, x.hd.year), [nm, ny] = nextMonth(m, x.hd.year), nxt = molad(nm, ny);
  const kl = kiddushLevanah(m, x.hd.year);
  const kls = x.now < kl.start ? `From ${fmtD(x, kl.start)}` : x.now < kl.end ? `<b>Now</b>, until ${fmtD(x, kl.end)}` : 'Passed for this month';
  const hols = [];
  for (let i = 0; i < len; i++) for (const h of dayInfo(addDays(start, i), x.opts.israel).hols) if (h.kind !== 'erev' && h.key !== 'rc' && !hols.some((q) => q.key === h.key)) hols.push({ ...h, day: i + 1 });
  return `
    ${card(`The month of ${lore.tribe}`, `<div class="tribe-row">${icon(T.icon, 52, 'big-ico')}<p class="lore-p">${esc(T.about)}</p></div>
      <div class="facets"><div><span>Letter</span><b class="he" lang="he">${lore.letter}</b></div><div><span>Sense</span><b>${lore.sense}</b></div><div><span>Mazal</span><b>${lore.mazal}</b><small>${lore.mazalEn}</small></div><div><span>Flag</span><b>${swatch(T.flag)}</b><small>${esc(T.flagText)}</small></div></div>`)}
    ${card('The moon', `${kv(`Molad ${esc(cur.month)}`, `${moladText(cur)}<small>Jerusalem time · ${fmtD(x, cur.utc)}, ${fmtT(x, cur.utc)} your time</small>`)}
      ${kv(`Molad ${esc(nxt.month)}`, `${moladText(nxt)}<small>${fmtD(x, nxt.utc)}, ${fmtT(x, nxt.utc)} your time</small>`)}
      ${kv('Kiddush Levanah', `${kls}<small>From 7 days after the molad (Chabad custom) to mid-month</small>`)}`)}
    ${hols.length ? card('This month', hols.map((h) => kv(`${h.day} ${x.hd.month}`, esc(h.name.replace(/ · \d+\w+ light/, '')))).join('')) : ''}`;
}

function yearPanel(x, Y) {
  const cyc = ((x.hd.year - 1) % 19) + 1, leaps = [3, 6, 8, 11, 14, 17, 19];
  const items = [];
  const seen = new Set();
  const from = dayIndex(Y.rh, x.nowJd.day.date) >= 0 && dayIndex(Y.rh, x.nowJd.day.date) < Y.len ? x.nowJd.day.date : Y.rh;
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
  return card('Seven years', Array.from({ length: 7 }, (_, i) => `<div class="wkrow${i === pos - 1 ? ' now' : ''}"><span class="swatch">${`<i style="background:${MAASER_COLOR[MAASER(i + 1)]}"></i>`}</span><span><b>${first + i}</b><small>${name[MAASER(i + 1)]}</small></span><span class="muted">Year ${i + 1}</span></div>`).join('') + '<p class="fine">Vayikra 25; Devarim 14. The colors on the ring show which tithe each year carries.</p>');
}

function worldPanel(x, c) {
  return card('Six days of a thousand years', `<p class="lore-p">"The world exists for six thousand years: two thousand of tohu, two thousand of Torah, two thousand of the days of Moshiach" (Sanhedrin 97a). Each millennium is a day of the cosmic week, and the seventh is Shabbos.</p>
    <div class="eras"><span style="--c:${ERA_COLOR[0]}">Tohu</span><span style="--c:${ERA_COLOR[2]}">Torah</span><span style="--c:${ERA_COLOR[4]}">Days of Moshiach</span><span style="--c:${ERA_COLOR[6]}">Shabbos</span></div>
    <p class="lore-p">${x.hd.year} falls in the ${ordinal(c.mil)} millennium, the world's ${c.dayName}. Its year ${x.hd.year % 1000} is like the ${ordinal(c.hour)} hour of ${c.isDay ? 'that day' : 'that night'}${c.dayName === 'Friday' ? ': Erev Shabbos, the time to prepare.' : '.'}</p>`);
}

function spacePanel(x, j, mi, hourTr, monthTr, heading) {
  return `
    ${card('Facing Yerushalayim', `<p class="lore-p">From ${esc(x.loc.name)}, Yerushalayim is ${mi.toLocaleString()} miles away, to the ${compassWord(j.bearing)} (${Math.round(j.bearing)}° from north). The dot on the rim points there.</p>
      <button id="compassBtn" class="btn ${heading == null ? '' : 'ghost'}" type="button">${heading == null ? 'Turn the dial with my phone' : 'Turning with your phone'}</button>`)}
    ${card('The camp', `<p class="lore-p">The ring is the camp in the desert (Bamidbar 2): Yehudah, Yissachar and Zevulun to the east; Reuven, Shimon and Gad to the south; Ephraim, Menashe and Binyamin to the west; Dan, Asher and Naftali to the north, with the Mishkan and the Levi'im in the middle.</p>
      <p class="lore-p">Lit now: <b>${hourTr}</b>, the tribe of this hour. Outlined: <b>${monthTr}</b>, the tribe of this month.</p>`)}`;
}

export function campSvg(hi) {
  const slots = { north: (i) => [22 + i * 28, 10, 26], south: (i) => [22 + i * 28, 90, 26], east: (i) => [112, 28 + i * 22, 30], west: (i) => [-12, 28 + i * 22, 30] };
  let out = '';
  for (const [side, tribes] of Object.entries(CAMPS)) tribes.forEach((t, i) => {
    const [x, y, w] = slots[side](i);
    out += `<g class="camp-t${t === hi ? ' hour' : ''}"><rect x="${x - w / 2}" y="${y - 6.5}" width="${w}" height="13" rx="3"/><text x="${x}" y="${y + 0.5}">${TRIBES[t].he}</text></g>`;
  });
  return `<svg class="camp" viewBox="-52 -12 204 124" role="img" aria-label="The tribes camped around the Mishkan">
    <text x="50" y="-6" class="camp-dir">North</text><text x="50" y="106" class="camp-dir">South</text><text x="140" y="50" class="camp-dir">East</text><text x="-40" y="50" class="camp-dir">West</text>
    <rect x="30" y="28" width="40" height="44" rx="2" class="mishkan"/><text x="50" y="47" class="camp-m">משכן</text><text x="50" y="58" class="camp-l">לוי</text>${out}</svg>`;
}
