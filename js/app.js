import { hourOf, civilDate, addDays, angleOf, SHITAH } from './zmanim.js';
import { gematria, WEEKDAYS, hebrewDate } from './hebrew.js';
import { buildDial, updateDial } from './dial.js';
const SVGNS = 'http://www.w3.org/2000/svg';
import { paintSky } from './sky.js';
import { intro } from './intro.js';
import { art } from './art.js';
import { DAYS } from './lore.js';
import { monthLore } from './hebrew.js';
import { RENDER, LEVELS, context, hourTribe, ordinal, scales, weekView, monthView, yearView, shemitahView, worldView, hourView, spaceView, dayPanel } from './levels.js';
import { NEW_YORK, CITIES, isIsrael, candleMinutes, geolocate, geoPermission, placeName, searchPlaces, distanceKm } from './places.js';

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('hineni.' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('hineni.' + k, JSON.stringify(v)); } catch {} },
};
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

let loc = store.get('loc') || NEW_YORK;
let prefs = { ma: false, candles: 'auto', view: 'detailed', ...(store.get('prefs') || {}) };
const view = { mode: 'time', level: 'day', focus: Date.now(), follow: true };
let x = null, v = null, renderedKey = '', heading = null, rot = 0, rotMode = 'north';

const opts = () => ({ israel: isIsrael(loc), ma: prefs.ma, candleMin: prefs.candles === 'auto' ? candleMinutes(loc) : +prefs.candles });
const fmt = (t) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: loc.tz }).format(new Date(t));

function jewishTime(t, jd) {
  let base, len, part;
  if (t < jd.day.netz) [base, len, part] = [jd.night.start, jd.night.hour, 'night'];
  else if (t <= jd.day.shkiah) [base, len, part] = [jd.day.netz, jd.day.hour, 'day'];
  else [base, len, part] = [jd.day.shkiah, jd.night.hour, 'night'];
  const h = (t - base) / len;
  let H = Math.floor(h), M = Math.round((h - H) * 60);
  if (M === 60) { H += 1; M = 0; }
  return { text: `${H}:${String(M).padStart(2, '0')}`, part };
}

// ---------- Navigation ----------
function go(next, dir) {
  if (!next) return;
  view.level = next.level;
  view.focus = next.focus;
  view.follow = false;
  render(dir);
}
function goNow() {
  Object.assign(view, { mode: 'time', level: 'day', focus: Date.now(), follow: true });
  render('out');
}
function zoomOut() {
  const i = LEVELS.indexOf(view.level);
  if (i < LEVELS.length - 1) { view.level = LEVELS[i + 1]; render('out'); }
}
function zoomTo(level) {
  const dir = LEVELS.indexOf(level) > LEVELS.indexOf(view.level) ? 'out' : 'in';
  view.level = level;
  // Back at the day you're living in: follow the clock again.
  if (level === 'day' && x && x.now >= x.jd.start && x.now < x.jd.end) view.follow = true;
  render(dir);
}

// ---------- Render ----------
// The next circle grows out of the segment you step into; stepping out, the old circle sinks back into its place.
let lastMarker = null, pendingGhost = null, shownLevel = null, ringT = {}, pendingBlock = null, pendingNest = null, pendingLetters = null;
const DUR = 2200;
function originOf(angle) {
  if (angle == null) return '50% 50%';
  const r = 173 / 460 * 100, a = angle * Math.PI / 180;
  return `${(50 + r * Math.sin(a)).toFixed(2)}% ${(50 - r * Math.cos(a)).toFixed(2)}%`;
}
function animate(dir, newMarker) {
  if (pendingGhost && (dir === 'in' || dir === 'out')) pushRings(pendingGhost, dir, 0);
  if (!dir || !pendingGhost || matchMedia('(prefers-reduced-motion: reduce)').matches) { pendingGhost = null; return; }
  const w = $('dialWrap');
  const origin = originOf(dir === 'in' ? pendingGhost.marker : newMarker);
  const g = document.createElement('div');
  g.className = 'ring-ghost';
  g.innerHTML = pendingGhost.html;
  g.style.transformOrigin = origin;
  w.appendChild(g);
  pendingGhost = null;
  const grow = [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(3.2)', opacity: 0 }];
  const sink = [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.08)', opacity: 0 }];
  const opts = { duration: DUR, easing: 'cubic-bezier(.35, .1, .2, 1)' };
  g.animate(dir === 'in' ? grow : sink, opts).finished.then(() => g.remove(), () => g.remove());
  for (const el of [$('dial'), $('centerBtn')]) {
    el.style.transformOrigin = origin;
    el.animate(dir === 'in'
      ? [{ transform: 'scale(.08)', opacity: 0 }, { transform: 'scale(.5)', opacity: .6, offset: .55 }, { transform: 'scale(1)', opacity: 1 }]
      : [{ transform: 'scale(3.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], opts);
  }
}

/** V2 motion, in two calm stages and with no turning:
 *  1. the "now" block closes into a full ring while everything holds still (morphBlock);
 *  2. the old circle expands outward into the first outer ring, pushing the outer rings out,
 *     while the new circle fades in at the centre. Ring angles change by cross-fading, never by spinning. */
const STAGE = 1500, SETTLE = 2000; // one calm tempo for every step
function animateV2(dir) {
  const g = pendingGhost; pendingGhost = null;
  if (!g || !(dir === 'in' || dir === 'out') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const w = $('dialWrap'), delay = dir === 'in' && pendingBlock ? STAGE : 0;
  const opts = { duration: SETTLE, delay, easing: 'cubic-bezier(.4, .1, .2, 1)', fill: 'both' };      // for ghosts, removed when done
  const keep = { duration: SETTLE, delay, easing: 'cubic-bezier(.4, .1, .2, 1)', fill: 'backwards' }; // for what stays
  const S = (s) => `scale(${s.toFixed(4)})`;
  pushRings(g, dir, delay);
  // The dial you leave. Stepping in: its ring fades a little as it expands, turns gently, and settles
  // exactly where it now belongs as the first outer ring; its middle melts away. Stepping out: it sinks.
  const to = ringT[g.level];
  const mk = (cls) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = g.html; w.appendChild(d); return d; };
  if (dir === 'in' && to) {
    const ring = mk('ring-ghost ghost-band'), mid = mk('ring-ghost ghost-mid');
    const end = `rotate(${to.rot.toFixed(2)}deg) scale(${to.s.toFixed(4)})`;
    ring.animate([{ transform: 'none', opacity: 1 }, { transform: `rotate(${(to.rot * 0.15).toFixed(2)}deg) scale(${(1 + (to.s - 1) * 0.6).toFixed(4)})`, opacity: 0.9, offset: 0.4 },
      { transform: end, opacity: 0.4, offset: 0.78 }, { transform: end, opacity: 0 }], { ...opts, easing: 'cubic-bezier(.45, .05, .3, 1)' })
      .finished.then(() => ring.remove(), () => ring.remove());
    mid.animate([{ opacity: 1 }, { opacity: 0, offset: 0.45 }, { opacity: 0 }], opts).finished.then(() => mid.remove(), () => mid.remove());
    // The real ring takes over only once the old one has arrived.
    document.querySelectorAll(`#halos .or2[data-level="${g.level}"]`).forEach((el) => {
      el.getAnimations().forEach((a) => a.cancel());
      el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }], { ...opts, fill: 'backwards', easing: 'linear' });
    });
  } else {
    const ghost = mk('ring-ghost');
    ghost.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.6)', opacity: 0 }], opts).finished.then(() => ghost.remove(), () => ghost.remove());
  }
  // The new dial: in from slightly smaller (in), or down from its outer-ring size (out).
  const from = dir === 'in' ? 'scale(.9)' : S(g.T[view.level]?.s ?? 1.25);
  for (const el of [$('dial'), $('centerBtn')]) {
    el.style.transformOrigin = '50% 50%';
    el.animate([{ transform: from, opacity: 0 }, { opacity: 0, offset: 0.2 }, { transform: 'none', opacity: 1 }], keep);
  }
}

/** Stage 2 for the rings around the dial: the old ones are pushed out one place and fade,
 *  the new ones slide in from one place further in and settle into their slots. */
function pushRings(g, dir, delay) {
  if (!(dir === 'in' || dir === 'out')) return;
  const w = $('dialWrap'), opts = { duration: SETTLE, delay, easing: 'cubic-bezier(.4, .1, .2, 1)', fill: 'both' };
  const keep = { ...opts, fill: 'backwards' };
  const f = dir === 'in' ? 1.18 : 1 / 1.18, v = dir === 'in' ? 1.06 : 1 / 1.06;
  const old = document.createElement('div');
  old.className = 'halos-ghost';
  old.innerHTML = g.halos || '';
  w.prepend(old);
  old.querySelectorAll('.or2').forEach((el) => { const t = el.style.transform; el.animate([{ transform: t, opacity: 1 }, { transform: `${t} scale(${f})`, opacity: 0 }], opts); });
  old.querySelectorAll('.outer-rings').forEach((el) => el.animate([{ transform: 'none', opacity: 1 }, { transform: `scale(${v})`, opacity: 0 }], opts));
  old.querySelectorAll('.or-hand').forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }], opts));
  setTimeout(() => old.remove(), delay + SETTLE + 80);
  // The new rings stay hidden until their turn, then slide in from one place further in.
  document.querySelectorAll('#halos .or2').forEach((el) => { const t = el.style.transform; el.animate([{ transform: `${t} scale(${1 / f})`, opacity: 0 }, { transform: `${t} scale(${(1 / f + 1) / 2})`, opacity: 0, offset: 0.25 }, { transform: t, opacity: 1 }], keep); });
  document.querySelectorAll('#halos .outer-rings').forEach((el) => el.animate([{ transform: `scale(${1 / v})`, opacity: 0 }, { transform: 'none', opacity: 1 }], keep));
  document.querySelectorAll('#halos .or-hand').forEach((el) => el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }], keep));
}

/** The "now" block you stepped into stretches around until it closes into the next circle. */
function morphBlock() {
  const a = pendingBlock; pendingBlock = null;
  if (!a || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const C = 200, R1 = 158, R2 = 188;
  const pt = (r, d) => [C + r * Math.sin((d * Math.PI) / 180), C - r * Math.cos((d * Math.PI) / 180)];
  const sector = (r1, r2, a1, a2) => {
    const large = a2 - a1 > 180 ? 1 : 0, f = (n) => n.toFixed(2);
    const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2), [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
    return `M${f(x1)} ${f(y1)}A${r2} ${r2} 0 ${large} 1 ${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}A${r1} ${r1} 0 ${large} 0 ${f(x4)} ${f(y4)}Z`;
  };
  const ov = document.createElementNS(SVGNS, 'svg');
  ov.setAttribute('viewBox', '-30 -30 460 460');
  ov.setAttribute('class', 'morph');
  const path = document.createElementNS(SVGNS, 'path');
  ov.appendChild(path);
  // The gold ring travels with the old circle as it moves out to its place.
  ($('dialWrap').querySelector('.ghost-band') || $('dialWrap')).appendChild(ov);
  const mid = (a[0] + a[1]) / 2, w0 = a[1] - a[0], t0 = performance.now(), D = STAGE + SETTLE;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  (function step(now) {
    const p = Math.min(1, (now - t0) / D), e = ease(Math.min(1, (now - t0) / STAGE)), w = w0 + (359.9 - w0) * e;
    path.setAttribute('d', sector(R1, R2, mid - w / 2, mid + w / 2));
    ov.style.opacity = now - t0 < STAGE ? 0.95 : 0.95 * Math.max(0, 1 - (now - t0 - STAGE) / SETTLE);
    if (p < 1) requestAnimationFrame(step); else ov.remove();
  })(t0);
}

/** From the landing: the outermost gold ring grows a little into the first clock face; the inner rings melt away. */
function nestToFace() {
  const html = pendingNest; pendingNest = null;
  if (!html || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const g = document.createElement('div');
  g.className = 'ring-ghost';
  g.innerHTML = html;
  $('dialWrap').appendChild(g);
  // Beat 1 (0–0.9 s): the inner rings melt away; the outer ring stays.
  // Beat 2 (0.9–1.9 s): the outer ring alone becomes the new circle.
  // Beat 3 (1.9–2.6 s): the circle's words and pictures arrive.
  const T = 3200, ease = 'cubic-bezier(.4, .1, .2, 1)';
  g.querySelectorAll('.nr').forEach((r, i) => {
    r.style.transformBox = 'view-box'; r.style.transformOrigin = '200px 200px';
    if (i === 0) r.animate([{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: 1, offset: 0.62 }, { opacity: 0, offset: 0.75 }, { opacity: 0 }], { duration: T, easing: ease, fill: 'forwards' });
    else {
      r.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.9)', offset: 0.32 }, { opacity: 0 }], { duration: T, easing: ease, fill: 'forwards' });
      r.querySelectorAll('.nr-dot').forEach((d) => d.animate([{ opacity: 1 }, { opacity: 0, offset: 0.2 }, { opacity: 0 }], { duration: T, fill: 'forwards' }));
    }
  });
  g.querySelectorAll('.nr-label').forEach((el, i) => el.animate([{ opacity: 1 }, { opacity: 0, offset: i === 0 ? 0.45 : 0.25 }, { opacity: 0 }], { duration: T, fill: 'forwards' }));
  g.querySelectorAll('.face').forEach((el) => el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: 0, offset: 0.7 }, { opacity: 0 }], { duration: T, fill: 'forwards' }));
  g.querySelector('.c-sub, .nr-now')?.remove();
  // The new circle: its ring first (beat 2), then everything inside it (beat 3).
  const dial = $('dial');
  const inner = [...dial.querySelectorAll('text, .art-at, .moonph, .ray, .marker, .band')];
  dial.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1, offset: 0.72 }, { opacity: 1 }], { duration: T, easing: ease });
  inner.forEach((el) => el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.72 }, { opacity: 1 }], { duration: T, easing: 'ease' }));
  $('centerBtn').animate([{ opacity: 0 }, { opacity: 0, offset: 0.72 }, { opacity: 1 }], { duration: T, easing: 'ease' });
  $('journey').animate([{ opacity: 0 }, { opacity: 0, offset: 0.72 }, { opacity: 1 }], { duration: T, easing: 'ease' });
  // The outer ring's gold arc travels and narrows into the gold "now" segment of the first circle.
  const seg = dial.querySelector('.rs.now[data-a]');
  const nowFrac = scales(x)[0], frac = (nowFrac.at + nowFrac.frac) / nowFrac.parts;
  if (seg) {
    const [b1, b2] = seg.dataset.a.split(',').map(Number);
    const ov = document.createElementNS(SVGNS, 'svg');
    ov.setAttribute('viewBox', '-30 -30 460 460'); ov.setAttribute('class', 'morph');
    const path = document.createElementNS(SVGNS, 'path'); ov.appendChild(path);
    $('dialWrap').appendChild(ov);
    const P = (r, d) => [200 + r * Math.sin(d * Math.PI / 180), 200 - r * Math.cos(d * Math.PI / 180)];
    const sec = (r1, r2, a1, a2) => { const L = a2 - a1 > 180 ? 1 : 0, q = (n) => n.toFixed(2); const [x1, y1] = P(r2, a1), [x2, y2] = P(r2, a2), [x3, y3] = P(r1, a2), [x4, y4] = P(r1, a1); return `M${q(x1)} ${q(y1)}A${r2} ${r2} 0 ${L} 1 ${q(x2)} ${q(y2)}L${q(x3)} ${q(y3)}A${r1} ${r1} 0 ${L} 0 ${q(x4)} ${q(y4)}Z`; };
    const e3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const a0 = 0, aE = Math.max(1, frac * 360), t0 = performance.now();
    (function step(now) {
      const t = (now - t0) / T, k = e3(Math.min(1, Math.max(0, (t - 0.3) / 0.42)));
      const r1 = 170.5 + (158 - 170.5) * k, r2 = 185.5 + (188 - 185.5) * k;
      path.setAttribute('d', sec(r1, r2, a0 + (b1 - a0) * k, aE + (b2 - aE) * k));
      ov.style.opacity = t < 0.3 ? 0 : t < 0.78 ? 1 : Math.max(0, 1 - (t - 0.78) / 0.2);
      if (t < 1) requestAnimationFrame(step); else ov.remove();
    })(t0);
    g.querySelector('.nr .nr-arc')?.animate([{ opacity: 1 }, { opacity: 1, offset: 0.29 }, { opacity: 0, offset: 0.31 }, { opacity: 0 }], { duration: T, fill: 'forwards' });
  }
  setTimeout(() => g.remove(), T + 50);
}

/** V1 with a block to follow: the old circle fades back while the block closes, then the new one settles in. */
function fadeOld() {
  const g = pendingGhost; pendingGhost = null;
  if (!g) return;
  pushRings(g, 'in', STAGE);
  const ghost = document.createElement('div');
  ghost.className = 'ring-ghost';
  ghost.innerHTML = g.html;
  $('dialWrap').appendChild(ghost);
  ghost.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.08)' }], { duration: SETTLE, delay: STAGE, easing: 'ease-out', fill: 'both' }).finished.then(() => ghost.remove(), () => ghost.remove());
  for (const el of [$('dial'), $('centerBtn')]) el.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: SETTLE, delay: STAGE, easing: 'ease', fill: 'backwards' });
}
/** The old circle's letters travel to the new circle's places, fading as the new letters arrive. */
function flyLetters(dir) {
  const from = pendingLetters; pendingLetters = null;
  if (!from || !from.length || !(dir === 'in' || dir === 'out') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const to = [...$('dial').querySelectorAll('text.rnum, text.num')].map((t) => ({ x: +t.getAttribute('x'), y: +t.getAttribute('y') }));
  if (!to.length) return;
  const ang = (p) => (Math.atan2(p.x - 200, -(p.y - 200)) * 180 / Math.PI + 360) % 360;
  const ov = document.createElementNS(SVGNS, 'svg');
  ov.setAttribute('viewBox', '-30 -30 460 460');
  ov.setAttribute('class', 'fly');
  $('dialWrap').appendChild(ov);
  const D = SETTLE, toAng = to.map(ang), delay = dir === 'in' ? STAGE : 0;
  from.forEach((p) => {
    // Each letter goes to the new place nearest its own angle, so the travel is short and gentle.
    const a = ang(p);
    let best = 0, bd = 999;
    toAng.forEach((b, j) => { const d = Math.abs(((b - a + 540) % 360) - 180); if (d < bd) { bd = d; best = j; } });
    const q = to[best];
    const t = document.createElementNS(SVGNS, 'text');
    t.setAttribute('x', p.x); t.setAttribute('y', p.y); t.setAttribute('class', 'rnum fly-l');
    t.textContent = p.s;
    ov.appendChild(t);
    t.animate([{ transform: 'translate(0px, 0px)', opacity: 1 }, { opacity: 1, offset: 0.55 }, { transform: `translate(${(q.x - p.x).toFixed(1)}px, ${(q.y - p.y).toFixed(1)}px)`, opacity: 0 }],
      { duration: D, delay, easing: 'cubic-bezier(.45, .05, .25, 1)', fill: 'both' });
  });
  // The new letters come in as the old ones arrive.
  $('dial').querySelectorAll('text.rnum, text.num').forEach((t) => t.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: D, delay, easing: 'ease', fill: 'backwards' }));
  setTimeout(() => ov.remove(), delay + D + 60);
}

function renderVer() {
  $('ver').innerHTML = [['clean', 'Clean'], ['detailed', 'Detailed']].map(([k, t]) => `<button type="button" data-ver="${k}" class="${prefs.view === k ? 'on' : ''}">${t}</button>`).join('');
}

function render(dir) {
  const now = Date.now();
  if ((dir === 'in' || dir === 'out') && $('dial').firstChild) {
    pendingLetters = [...$('dial').querySelectorAll('text.rnum, text.num')].map((t) => ({ x: +t.getAttribute('x'), y: +t.getAttribute('y'), s: t.textContent, he: true }));
    const nb = $('dial').querySelector('.rs.now[data-a], .seg.now[data-a]');
    pendingBlock = dir === 'in' && nb ? nb.dataset.a.split(',').map(Number) : null;
    pendingGhost = { html: $('dial').outerHTML.replace(/ id="[^"]*"/g, ''), center: $('centerBtn').innerHTML, halos: $('halos').innerHTML, marker: lastMarker, level: shownLevel, T: { ...ringT, [shownLevel]: { rot: 0, s: 1 } } };
  }
  if (view.follow) view.focus = now;
  x = context(view.focus, now, loc, opts());
  renderedKey = key();
  $('locName').textContent = loc.name;
  $('modeTime').setAttribute('aria-selected', view.mode === 'time');
  $('modeSpace').setAttribute('aria-selected', view.mode === 'space');
  const atNow = view.follow && view.level === 'day' && view.mode === 'time';
  $('nowBtn').classList.toggle('here', atNow);
  $('nestBtn').innerHTML = nestIcon();

  if (x.jd.polar) {
    $('panel').innerHTML = `<div class="pcard"><p>The sun doesn't rise or set here today, so the hours can't be calculated. Polar zmanim need a rav's guidance.</p></div>`;
    return;
  }

  if (view.mode === 'space') {
    renderSpace();
    setHalos('');
    pendingGhost = null;
    return;
  }

  if (journey && journey.step === 'nest') {
    setHalos('');
    $('dial').innerHTML = nestDial();
    $('centerBtn').innerHTML = '<span class="c-sub">now</span>';
    $('centerBtn').dataset.level = 'nest';
    $('panel').innerHTML = '';
    $('viewTitle').innerHTML = '';
    lastMarker = null;
    showJourney();
    return;
  }

  if (view.level === 'day') {
    buildDial($('dial'), x.jd, loc.tz);
    v = {
      prev: { level: 'day', focus: x.chatzos(addDays(x.date, -1)) },
      next: { level: 'day', focus: x.chatzos(addDays(x.date, 1)) },
      panel: dayPanel(x) + zmanimHTML(x) + howHTML(),
    };
    $('panel').innerHTML = v.panel;
    updateDay(now);
  } else if (view.level === 'hour') {
    const h = hourOf(view.focus, x.jd);
    v = hourView(x, { isDay: h.isDay, hour: h.hour });
    $('dial').innerHTML = v.svg;
    $('centerBtn').innerHTML = v.center;
    $('panel').innerHTML = v.panel;
  } else {
    v = { week: weekView, month: monthView, year: yearView, shemitah: shemitahView, world: worldView }[view.level](x);
    $('dial').innerHTML = v.svg;
    $('centerBtn').innerHTML = v.center;
    $('panel').innerHTML = journey ? '' : v.panel;
  }
  if (journey) $('panel').innerHTML = '';
  $('viewTitle').innerHTML = v.title || '';
  $('centerBtn').dataset.level = view.level;
  lastMarker = view.level === 'day' ? (x.now >= x.jd.start && x.now < x.jd.end ? angleOf(x.now, x.jd) : null) : v.marker ?? null;
  shownLevel = view.level;
  setHalos(outerRings());
  if (pendingNest) { pendingGhost = null; pendingBlock = null; pendingLetters = null; nestToFace(); }
  else {
    animateV2(dir);
    morphBlock();
    flyLetters(dir);
  }
  if (journey) showJourney();
  renderVer();
}

function renderSpace() {
  if (rotMode === 'jer') rot = -spaceBearing();
  else if (rotMode === 'phone' && heading != null) rot = -heading;
  v = spaceView(x, rot);
  $('dial').innerHTML = v.svg;
  $('centerBtn').innerHTML = v.center;
  $('viewTitle').textContent = v.title;
  if (!document.getElementById('faceJ')) {
    $('panel').innerHTML = v.panel;
    $('faceJ').addEventListener('click', () => { rotMode = 'jer'; renderSpace(); });
    $('northUp').addEventListener('click', () => { rotMode = 'north'; rot = 0; renderSpace(); });
    $('compassBtn')?.addEventListener('click', startCompass);
  } else {
    const fresh = document.createElement('div');
    fresh.innerHTML = v.panel;
    $('panel').querySelector('.pcard').replaceWith(fresh.querySelector('.pcard'));
    $('faceJ').addEventListener('click', () => { rotMode = 'jer'; renderSpace(); });
    $('northUp').addEventListener('click', () => { rotMode = 'north'; rot = 0; renderSpace(); });
    $('compassBtn')?.addEventListener('click', startCompass);
  }
}
const spaceBearing = () => { const r = Math.PI / 180, T = { lat: 31.7781, lon: 35.2354 }; const y = Math.sin((T.lon - loc.lon) * r) * Math.cos(T.lat * r); const xx = Math.cos(loc.lat * r) * Math.sin(T.lat * r) - Math.sin(loc.lat * r) * Math.cos(T.lat * r) * Math.cos((T.lon - loc.lon) * r); return ((Math.atan2(y, xx) / r) + 360) % 360; };

function nestIcon() {
  let s = '';
  for (let i = 0; i < 7; i++) s += `<circle cx="16" cy="16" r="${14.5 - i * 2}" fill="none" stroke-width="1.1"/>`;
  return `<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">${s}<circle cx="16" cy="16" r="1.6" class="nest-core"/></svg>`;
}

function renderNest() {
  const rows = scales(x);
  const arc = (r, frac) => {
    const a = Math.max(0.001, Math.min(0.9999, frac)) * Math.PI * 2;
    const x2 = 130 + r * Math.sin(a), y2 = 130 - r * Math.cos(a);
    return `M130 ${130 - r} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };
  let svg = '';
  rows.forEach((r, i) => {
    const R = 118 - i * 16, frac = (r.at + r.frac) / r.parts;
    const a = frac * Math.PI * 2, dx = 130 + R * Math.sin(a), dy = 130 - R * Math.cos(a);
    svg += `<g class="nr${r.level === view.level ? ' cur' : ''}" data-level="${r.level}"><circle cx="130" cy="130" r="${R}" class="nr-track"/><path d="${arc(R, frac)}" class="nr-arc"/><circle cx="${dx.toFixed(2)}" cy="${dy.toFixed(2)}" r="4" class="nr-dot"/><circle cx="130" cy="130" r="${R}" class="nr-hit"/></g>`;
    svg += `<text x="134" y="${(130 - R + 4).toFixed(1)}" class="nr-label">${r.label}</text>`;
  });
  $('nestRings').innerHTML = `<svg viewBox="0 0 260 260" role="img" aria-label="The circles of time, one inside the other">${svg}<text x="130" y="134" class="nr-now">now</text></svg>`;
  renderScale();
}

function renderScale() {
  const rows = scales(x);
  $('scale').innerHTML = rows.map((r) => {
    const cells = Array.from({ length: r.parts }, (_, i) => `<i class="${i < r.at ? 'done' : ''}${i === r.at ? ' at' : ''}${r.split && i < r.split ? ' night' : ''}${r.split && i >= r.split ? ' day' : ''}"${i === r.at ? ` style="--p:${(r.frac * 100).toFixed(1)}%"` : ''}></i>`).join('');
    return `<button type="button" class="sc${r.level === view.level ? ' cur' : ''}" data-level="${r.level}"><span class="sc-label">${r.label}</span><span class="sc-value">${r.value}</span><span class="sc-track${r.parts > 14 ? ' fine' : ''}">${cells}</span></button>`;
  }).join('');
}

/** Live parts of the day view: hand, highlighted hour and the center. */
function updateDay(now) {
  const jd = x.jd;
  const live = now >= jd.start && now < jd.end;
  const ref = live ? now : view.focus;
  const h = hourOf(ref, jd);
  const next = live ? jd.list.find((z) => z.t > now) : null;
  updateDial($('dial'), now, jd, h, next ? next.key + next.part : '', live);
  const ht = hourTribe(h.hour);
  const { hd, wd } = x;
  const date = `${WEEKDAYS[wd].he} · ${gematria(hd.day)} ${hebrewDate(x.date).he.split(' ').slice(1, -1).join(' ')}`;
  $('viewTitle').innerHTML = live ? `Today · <bdi class="he" lang="he">${date}</bdi>` : `<bdi class="he" lang="he">${date}</bdi>`;
  $('centerBtn').innerHTML = live
    ? `<span class="c-art">${art(ht.t.icon, 58)}</span><span class="c-big">${ordinal(h.hour)} hour</span><span class="c-line">of the ${h.isDay ? 'day' : 'night'} · ${ht.tribe}</span><span class="c-sub">${fmt(now)}</span>`
    : `<span class="c-art">${art(x.jd.info.wd >= 0 ? ['light','firmament','plants','lights','fishbirds','man','candles'][wd] : 'globe', 58)}</span><span class="c-line">${WEEKDAYS[wd].en}</span><span class="c-sub">Tap an hour to step inside</span>`;
  if (live) {
    document.querySelectorAll('#zmanim .z').forEach((li) => {
      const z = jd.list.find((q) => q.key + q.part === li.dataset.z);
      if (!z) return;
      li.classList.toggle('past', z.t <= now);
      li.classList.toggle('next', !!next && li.dataset.z === next.key + next.part);
    });
    const s = $('zSum'); if (s) s.textContent = next ? `Next: ${next.tr} ${fmt(next.t)}` : '';
  }
}

function zmanimHTML(x) {
  const jd = x.jd, label = { eve: 'Night', day: 'Day', after: 'After sunset' };
  let last = '', rows = '';
  for (const z of jd.list) {
    if (z.part !== last) { rows += `<li class="part">${label[z.part]}</li>`; last = z.part; }
    const jt = jewishTime(z.t, jd);
    rows += `<li class="z${['candles', 'candlesNight', 'holyEnd', 'fastStart', 'fastStartEve', 'fastEnd'].includes(z.key) ? ' special' : ''}" data-z="${z.key + z.part}">
      <div class="zrow"><span class="zd" aria-hidden="true"></span><span class="z-name">${esc(z.tr)}<small><span class="he" lang="he">${z.he}</span> · ${esc(z.en)}</small></span>
      <span class="z-jt">${jt.text}<small>${jt.part}</small></span><span class="z-time">${fmt(z.t)}</span></div></li>`;
  }
  const o = opts();
  return `<details class="pcard fold" id="zFold"><summary><span class="fold-title">Zmanim</span><span id="zSum" class="fold-sum"></span></summary>
    <ol id="zmanim" class="zmanim">${rows}</ol>
    <p class="fine">Jewish time counts hours from sunrise (day) or sunset (night). Today a day hour is ${Math.round(jd.day.hour / 60000)} min, a night hour ${Math.round(jd.night.hour / 60000)} min. Shitah: ${SHITAH.name}. Candles ${o.candleMin} min before sunset.</p></details>`;
}

function howHTML() {
  return `<details class="pcard fold"><summary><span class="fold-title">How to read the clock</span></summary>
    <p class="lore-p">A Jewish day begins at sunset. The night has 12 hours and the day, from sunrise to sunset, has 12 more. Each is a twelfth of the darkness or the daylight, so they stretch in summer and shrink in winter.</p>
    <p class="lore-p">Gold hours run across the top, from sunrise at the left to sunset at the right, like the sun. Blue hours run underneath. The thin inner ring is your ordinary clock, bent to fit.</p>
    <p class="lore-p">Each hour belongs to a month and its tribe; the colored band is the tribe's flag. Tap an hour to step inside it. Use the button at the top of the dial to zoom out to the week, month, year, shemitah cycle and the 6,000 years. The path above the dial shows where you are; tap any step to go there.</p></details>`;
}

const monthTribe = (hd) => monthLore(hd.month)?.tribe ?? '';
const dayMade = (wd) => ({ 0: 'light', 1: 'the firmament', 2: 'the land and its plants', 3: 'the sun, moon and stars', 4: 'the fish and the birds', 5: 'the animals and man', 6: 'rest' })[wd];
// ---------- The journey: from the outside in ----------
// nest → world → shemitah → year → month → week → (tap outside: out) month → week → day → (tap the hour) hour → (tap the middle) today
const STEPS = ['nest', 'world', 'shemitah', 'year', 'month', 'week', 'out', 'week2', 'day', 'hour'];
const STEP_LEVEL = { nest: 'world', world: 'world', shemitah: 'shemitah', year: 'year', month: 'month', week: 'week', out: 'month', week2: 'week', day: 'day', hour: 'hour' };
const OUTER = ['world', 'shemitah', 'year', 'month', 'week', 'day'];
let journey = null;
const isTouch = () => matchMedia('(pointer: coarse)').matches;

function journeyCopy(step) {
  const { hd, wd } = x, pos = hd.year % 7 || 7, mil = Math.floor(hd.year / 1000) + 1;
  const h = hourOf(Date.now(), x.nowJd), ht = hourTribe(h.hour);
  return {
    nest: ['The circles of time', 'Each circle sits inside the one around it: the world, the shemitah cycle, the year, the month, the week, the day and the hour. You are at the center.', 'Tap the outer ring'],
    world: [`The ${ordinal(mil)} millennium`, "This is where you are in the six thousand years of the world: its sixth day, its Friday, getting ready for Shabbos (Sanhedrin 97a).", 'Tap the middle to step in'],
    shemitah: [pos === 7 ? 'A shemitah year' : `Shemitah · year ${pos} of 7`, 'Inside the millennium, the land keeps a seven-year rhythm. The seventh year, it rests.', 'Tap the middle'],
    year: [`${hd.year} · <span class="he" lang="he">${gematria(hd.year % 1000)}</span>`, 'Inside the cycle, this year and its months. Each month belongs to one of the twelve tribes.', 'Tap the middle'],
    month: [`${hd.month}`, `Inside the year, the moon's month: the month of ${monthTribe(hd)}. Today is the ${ordinal(hd.day)}.`, 'Tap the middle'],
    week: [`<span class="he" lang="he">${WEEKDAYS[wd].he}</span>`, `Inside the month, the week, counting toward Shabbos. Today is the ${ordinal(wd + 1)} day, when Hashem made ${dayMade(wd)}.`, 'Now tap outside the circle to step back out'],
    out: ['Back to the month', 'Every circle holds the one inside it. Step out any time to see the bigger picture.', 'Tap the middle to go back in'],
    week2: [`<span class="he" lang="he">${WEEKDAYS[wd].he}</span>`, 'And the week again.', 'Tap the middle'],
    day: ['Today', 'And inside it all: today, live. Twelve hours of night and twelve of day, each held by a tribe. The line is now.', "Tap the hour you're in"],
    hour: [`The ${ordinal(h.hour)} hour · ${ht.tribe}`, "This is the hour you're in: its tribe, its energy, its pasuk. Step in to any hour like this. The day is home.", 'Tap the middle to come back to today'],
  }[step];
}

/** The landing view: every circle of time, nested in gold. */
function nestDial() {
  const rows = scales(x);
  const C = 200, arc = (r, frac) => {
    const a = Math.max(0.001, Math.min(0.9999, frac)) * Math.PI * 2;
    return `M${C} ${C - r} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${(C + r * Math.sin(a)).toFixed(2)} ${(C - r * Math.cos(a)).toFixed(2)}`;
  };
  let svg = `<circle cx="${C}" cy="${C}" r="196" class="face"/>`;
  rows.forEach((r, i) => {
    const R = 178 - i * 22, frac = (r.at + r.frac) / r.parts, a = frac * Math.PI * 2;
    svg += `<g class="nr nr-big${i === 0 ? ' tap-me' : ''}" data-ring="${r.level}"><circle cx="${C}" cy="${C}" r="${R}" class="nr-track"/><path d="${arc(R, frac)}" class="nr-arc"/><circle cx="${(C + R * Math.sin(a)).toFixed(2)}" cy="${(C - R * Math.cos(a)).toFixed(2)}" r="5" class="nr-dot"/><circle cx="${C}" cy="${C}" r="${R}" class="nr-hit"/></g>`;
    svg += `<text x="${C + 5}" y="${C - R}" class="nr-label big">${r.label}</text>`;
  });
  return svg;
}

function setHalos(html) {
  const h = $('halos');
  const key = html.replace(/ id="[^"]*"|url\(#[^)]*\)/g, '');
  if (h.dataset.h === key) return; // redrawing would restart the motion
  h.dataset.h = key;
  h.innerHTML = html;
}

// The outer circles belong to the journey; the everyday clock is just the dial.
// The journey always shows the circles around you; afterwards, Detailed keeps them and Clean shows only the dial.
function outerRings() { if (!journey && prefs.view === 'clean') { ringT = {}; return ''; } return outerRingsV2(); }

/** The clock face of a circle, as SVG markup, and where its "now" is. */
function levelFace(level) {
  if (level === 'day') {
    const tmp = document.createElementNS(SVGNS, 'svg');
    const live = x.now >= x.jd.start && x.now < x.jd.end;
    buildDial(tmp, x.jd, loc.tz);
    updateDial(tmp, x.now, x.jd, hourOf(live ? x.now : x.focus, x.jd), '', live);
    return { html: tmp.innerHTML, marker: live ? angleOf(x.now, x.jd) : null };
  }
  RENDER.lite = true; // the faint outer faces carry no medallions
  try {
    const f = { week: weekView, month: monthView, year: yearView, shemitah: shemitahView, world: worldView }[level](x);
    return { html: f.svg, marker: f.marker ?? null };
  } finally { RENDER.lite = false; }
}

/** V2: the outer circles as real clock faces, turned so every "now" lies on the hand's line. */
function outerRingsV2() {
  ringT = {};
  if (view.mode !== 'time' || (journey && journey.step === 'nest')) return '';
  const lvl = journey ? STEP_LEVEL[journey.step] : view.level;
  const idx = lvl === 'hour' ? OUTER.length : OUTER.indexOf(lvl);
  if (idx <= 0) return '';
  const hand = lastMarker ?? 0;
  let outer = 188, html = '';
  OUTER.slice(0, idx).reverse().forEach((L, k) => {
    const s = (outer + (k ? 6 : 10)) / 158;
    outer = 188 * s;
    const face = levelFace(L);
    let rot = face.marker == null ? 0 : hand - face.marker;
    rot = ((rot % 360) + 540) % 360 - 180; // the shorter way round
    ringT[L] = { rot, s };
    const upright = face.html.replace(/<text([^>]*?) x="(-?[\d.]+)" y="(-?[\d.]+)"([^>]*?)>/g, (m, a1, tx, ty, a2) => /transform=/.test(a1 + a2) ? m : `<text${a1} x="${tx}" y="${ty}"${a2} transform="rotate(${(-rot).toFixed(2)} ${tx} ${ty})">`);
    face.html = upright;
    html += `<div class="or2" data-level="${L}" style="--o:${[0.36, 0.26, 0.2, 0.15, 0.11][k]};transform: rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})"><svg viewBox="-30 -30 460 460">${face.html.replace(/ id="[^"]*"/g, '')}</svg></div>`;
  });
  if (lastMarker != null) {
    const a = (hand * Math.PI) / 180, p = (r) => `${(200 + r * Math.sin(a)).toFixed(1)} ${(200 - r * Math.cos(a)).toFixed(1)}`;
    html += `<svg class="or-hand" viewBox="-30 -30 460 460"><path d="M${p(191)} L${p(1400)}"/></svg>`;
  }
  return html;
}

/** V1: one thin gold ring for each circle you have come through. */
function outerRingsV1() {
  ringT = {};
  if (view.mode !== 'time' || (journey && journey.step === 'nest')) return '';
  const lvl = journey ? STEP_LEVEL[journey.step] : view.level;
  const n = Math.max(0, OUTER.indexOf(lvl === 'hour' ? 'day' : lvl) + (lvl === 'hour' ? 1 : 0));
  if (!n) return '';
  const rows = scales(x).slice(0, n).reverse(); // nearest first
  const C = 200;
  let svg = '';
  rows.forEach((r, k) => {
    const R = 206 + k * 13, frac = (r.at + r.frac) / r.parts, a = Math.max(0.001, Math.min(0.9999, frac)) * Math.PI * 2;
    svg += `<circle cx="${C}" cy="${C}" r="${R}" class="nr-track thin"/><path d="M${C} ${C - R} A${R} ${R} 0 ${a > Math.PI ? 1 : 0} 1 ${(C + R * Math.sin(a)).toFixed(2)} ${(C - R * Math.cos(a)).toFixed(2)}" class="nr-arc thin"/>`;
  });
  return `<svg viewBox="-30 -30 460 460" class="outer-rings">${svg}</svg>`;
}

function showJourney() {
  if (document.body.classList.contains('intro-on') || !journey) return;
  const [big, text, prompt] = journeyCopy(journey.step);
  $('jBig').innerHTML = big;
  $('jText').textContent = text;
  $('jTap').innerHTML = esc(prompt);
  const i = STEPS.indexOf(journey.step);
  $('jDots').innerHTML = STEPS.map((_, k) => `<i class="${k < i ? 'done' : ''}${k === i ? ' at' : ''}"></i>`).join('');
  if ($('journey').hidden) { $('journey').classList.remove('pop'); void $('journey').offsetWidth; $('journey').classList.add('pop'); }
  $('journey').hidden = false;
  document.body.classList.add('journeying');
  document.body.dataset.jstep = journey.step;
}

function startJourney() {
  journey = { step: 'nest' };
  Object.assign(view, { mode: 'time', level: 'world', focus: Date.now(), follow: false });
  $('panel').innerHTML = '';
  document.body.classList.add('journeying'); // size the dial now, so the spiral lands exactly on it
  render();
  $('journey').hidden = true;
  document.body.classList.add('intro-on');
  intro($('dialWrap'), { onLand: () => document.body.classList.remove('intro-on'), dots: scales(x).map((r) => (r.at + r.frac) / r.parts) }).then(() => showJourney());
}

function endJourney() {
  journey = null;
  store.set('journeyDone', true);
  $('journey').hidden = true;
  document.body.classList.remove('journeying');
  delete document.body.dataset.jstep;
  setHalos('');
  goNow();
}

/** One action moves the journey on: 'outer' (the outer ring), 'middle', 'outside', or 'hour' (a block of the day). */
function journeyDo(action, arg) {
  const st = journey.step;
  const move = (step, level, dir, focus) => {
    journey.step = step;
    view.level = level; view.focus = focus ?? Date.now(); view.follow = level === 'day';
    render(dir);
  };
  if (st === 'nest' && action === 'outer') { pendingNest = $('dial').outerHTML.replace(/ id="[^"]*"/g, ''); return move('world', 'world'); }
  if (action === 'middle') {
    const next = { world: ['shemitah', 'shemitah'], shemitah: ['year', 'year'], year: ['month', 'month'], month: ['week', 'week'], out: ['week2', 'week'], week2: ['day', 'day'] }[st];
    if (next) return move(next[0], next[1], 'in');
    if (st === 'hour') return endJourney();
  }
  if (st === 'week' && action === 'outside') return move('out', 'month', 'out');
  if (st === 'day' && action === 'hour') return move('hour', 'hour', 'in', arg);
  // Anything else: a gentle nudge toward the right place.
  $('jTap').classList.remove('nudge'); void $('jTap').offsetWidth; $('jTap').classList.add('nudge');
}

// ---------- Compass ----------
async function startCompass() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') throw new Error('denied');
    }
    let last = 0;
    const on = (e) => {
      const hd = e.webkitCompassHeading ?? (e.absolute && e.alpha != null ? 360 - e.alpha : null);
      if (hd == null || view.mode !== 'space') return;
      heading = hd;
      rotMode = 'phone';
      if (Date.now() - last > 150) { last = Date.now(); renderSpace(); }
    };
    window.addEventListener('deviceorientationabsolute', on);
    window.addEventListener('deviceorientation', on);
    setTimeout(() => { if (heading == null && $('compassBtn')) $('compassBtn').textContent = 'No compass on this device'; }, 2500);
  } catch {
    if ($('compassBtn')) $('compassBtn').textContent = 'Compass not available';
  }
}

// ---------- Tick ----------
const key = () => [view.mode, view.level, view.follow ? x?.jd?.start : view.focus, loc.lat, loc.lon, prefs.ma, prefs.candles].join('|');
let lastMinute = -1, lastHourKey = null, toastTimer = null;
function hourBegan(h) {
  const ht = hourTribe(h.hour);
  $('toast').innerHTML = `${art(ht.t.icon, 40)}<span><b>The ${ordinal(h.hour)} hour of the ${h.isDay ? 'day' : 'night'} has begun</b><small>${ht.tribe} · ${ht.month}</small></span>`;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 7000);
  $('centerBtn').classList.add('turning');
  setTimeout(() => $('centerBtn').classList.remove('turning'), 800);
}
function tick() {
  const now = Date.now();
  paintSky(now, loc);
  if (!x || (view.follow && (now >= x.jd.end || now < x.jd.start)) || key() !== renderedKey) { render(); lastMinute = Math.floor(now / 60000); return; }
  if (x.jd.polar) return;
  x.now = now;
  // A new hour: a gentle cue, and an hour view that was following the clock moves with it.
  const nh = hourOf(now, x.nowJd && now < x.nowJd.end ? x.nowJd : x.jd);
  const hk = `${nh.isDay}-${nh.hour}`;
  if (lastHourKey && hk !== lastHourKey && !journey) {
    hourBegan(nh);
    if (view.mode === 'time' && view.level === 'hour') {
      const prev = hourOf(view.focus, x.jd);
      if (`${prev.isDay}-${prev.hour}` === lastHourKey) { view.focus = now; setTimeout(() => render('side'), 400); }
    }
  }
  lastHourKey = hk;
  if (view.mode === 'time' && view.level === 'day') updateDay(now);
  const minute = Math.floor(now / 60000);
  if (minute !== lastMinute) {
    lastMinute = minute;
    if ($('nestDlg').open) renderNest();
    if (view.mode === 'space') renderSpace();
    setHalos(outerRings());
    if (view.mode === 'time' && view.level !== 'day' && !(journey && journey.step === 'nest')) {
      // Move markers without disturbing the panel.
      const fresh = view.level === 'hour' ? hourView(context(view.focus, now, loc, opts()), hourOf(view.focus, x.jd)) : { week: weekView, month: monthView, year: yearView, shemitah: shemitahView, world: worldView }[view.level](context(view.focus, now, loc, opts()));
      $('dial').innerHTML = fresh.svg;
      $('centerBtn').innerHTML = fresh.center;
    }
  }
}

// ---------- Location ----------
async function setLoc(l, { silent = false } = {}) {
  loc = l;
  store.set('loc', l);
  if (!silent) $('locDlg').close();
  $('geoBanner').hidden = true;
  heading = null;
  render();
}

async function useMyLocation(msgEl) {
  if (msgEl) msgEl.textContent = 'Finding you…';
  try {
    const p = await geolocate();
    const name = await placeName(p);
    await setLoc({ ...p, name, geo: true });
    if (msgEl) msgEl.textContent = '';
  } catch (e) {
    const denied = e && e.code === 1;
    if (msgEl) msgEl.textContent = denied ? 'Location is turned off for this site. Allow it in your browser settings, or pick a city.' : "Couldn't find your location. Pick a city instead.";
  }
}

function renderCityButtons(list, results) {
  list.replaceChildren();
  for (const c of results) {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `${esc(c.name)}${c.detail ? `<small>${esc(c.detail)}</small>` : ''}`;
    b.addEventListener('click', () => setLoc({ name: c.name, lat: c.lat, lon: c.lon, tz: c.tz }));
    list.appendChild(b);
  }
}

function initLocation() {
  const list = $('cityList');
  renderCityButtons(list, CITIES);
  let timer;
  $('citySearch').addEventListener('input', (e) => {
    const q = e.target.value.trim();
    clearTimeout(timer);
    if (!q) return renderCityButtons(list, CITIES);
    renderCityButtons(list, CITIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())));
    if (q.length < 2) return;
    timer = setTimeout(async () => {
      const r = await searchPlaces(q);
      if (r && r.length && $('citySearch').value.trim() === q) renderCityButtons(list, r);
    }, 300);
  });
  $('locBtn').addEventListener('click', () => { $('geoMsg').textContent = ''; $('locDlg').showModal(); });
  $('locClose').addEventListener('click', () => $('locDlg').close());
  $('useGeo').addEventListener('click', () => useMyLocation($('geoMsg')));
  $('geoYes').addEventListener('click', () => useMyLocation($('geoBannerMsg')));
  $('geoNo').addEventListener('click', () => { $('geoBanner').hidden = true; store.set('loc', loc); });
}

async function locationOnLoad() {
  const perm = await geoPermission();
  if (perm === 'granted' && (!store.get('loc') || loc.geo)) {
    try {
      const p = await geolocate();
      if (!loc.geo || distanceKm(p, loc) > 3) await setLoc({ ...p, name: await placeName(p), geo: true }, { silent: true });
    } catch {}
  } else if (!store.get('loc') && perm !== 'denied' && navigator.geolocation) {
    $('geoBanner').hidden = false;
  }
}

function initVer() {
  $('ver').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ver]');
    if (!b || b.dataset.ver === prefs.view) return;
    prefs.view = b.dataset.ver; store.set('prefs', prefs);
    $('halos').dataset.h = 'stale';
    render();
  });
}

function initSettings() {
  $('setBtn').addEventListener('click', () => { $('optMA').checked = prefs.ma; $('optCandles').value = prefs.candles; $('setDlg').showModal(); });
  $('setClose').addEventListener('click', () => $('setDlg').close());
  $('optMA').addEventListener('change', (e) => { prefs.ma = e.target.checked; store.set('prefs', prefs); render(); });
  $('optCandles').addEventListener('change', (e) => { prefs.candles = e.target.value; store.set('prefs', prefs); render(); });
}

// ---------- Events ----------
const outsideDial = (e) => { const r = $('dial').getBoundingClientRect(); return Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) > r.width * (194 / 460); };
function onChild(e) {
  if (e.currentTarget.id === 'dial' && outsideDial(e)) return; // the corners of the square belong to "outside"
  if (journey) {
    if (e.currentTarget.id !== 'dial') return;
    if (journey.step === 'nest') return journeyDo('outer'); // any tap on the circles begins at the outer ring
    const seg = e.target.closest('[data-seg],[data-band]');
    if (seg && view.level === 'day') {
      const id = seg.dataset.seg || seg.dataset.band, isDay = id[0] === 'd', n = +id.slice(1);
      const len = isDay ? x.jd.day.hour : x.jd.night.hour, start = (isDay ? x.jd.day.netz : x.jd.night.start) + n * len;
      return journeyDo('hour', x.now >= start && x.now < start + len ? x.now : start + len / 2);
    }
    return journeyDo('nudge');
  }
  const t = e.target.closest('[data-seg],[data-band],[data-child]');
  if (!t || view.mode !== 'time') return;
  if (view.level === 'day' && (t.dataset.seg || t.dataset.band)) {
    const id = t.dataset.seg || t.dataset.band, isDay = id[0] === 'd', n = +id.slice(1);
    const len = isDay ? x.jd.day.hour : x.jd.night.hour;
    const start = (isDay ? x.jd.day.netz : x.jd.night.start) + n * len;
    const nowIn = x.now >= start && x.now < start + len;
    return go({ level: 'hour', focus: nowIn ? x.now : start + len / 2 }, 'in');
  }
  if (t.dataset.child != null && v?.children?.[t.dataset.child]) go(v.children[t.dataset.child], 'in');
}

initLocation();
initSettings();
initVer();
$('dial').addEventListener('click', onChild);
$('panel').addEventListener('click', onChild);
$('centerBtn').addEventListener('click', () => {
  if (journey) return journeyDo(journey.step === 'nest' ? 'outer' : 'middle');
  if (view.mode !== 'time') return;
  if (view.level === 'day') { const live = x.now >= x.jd.start && x.now < x.jd.end; return go({ level: 'hour', focus: live ? x.now : view.focus }, 'in'); }
  if (view.level === 'hour') return zoomTo('day');
  const i = LEVELS.indexOf(view.level);
  if (i > 0) zoomTo(LEVELS[i - 1]);
});
$('nowBtn').addEventListener('click', goNow);
$('replayJourney').addEventListener('click', () => { $('setDlg').close(); startJourney(); });
function pickLevel(e) {
  const c = e.target.closest('[data-level]');
  if (!c) return;
  $('nestDlg').close();
  view.mode = 'time'; view.focus = Date.now(); view.follow = c.dataset.level === 'day';
  zoomTo(c.dataset.level);
}
$('scale').addEventListener('click', pickLevel);
$('nestRings').addEventListener('click', pickLevel);
$('nestBtn').addEventListener('click', () => { renderNest(); $('nestDlg').showModal(); });
$('nestClose').addEventListener('click', () => $('nestDlg').close());
// Tap inside the circle to step in; tap outside it to step out.
document.addEventListener('click', (e) => {
  if (view.mode !== 'time' || document.body.classList.contains('intro-on')) return;
  if (e.target.closest('a, input, select, label, summary, dialog, .pcard, .card, .journey, .top, .controls, .titlebar, .toast')) return;
  if (e.target.closest('button') && e.target.closest('button').id !== 'centerBtn') return;
  if (!outsideDial(e)) return; // inside the circle: its own taps handle it
  if (journey) return journeyDo('outside');
  zoomOut();
});

// Space: drag to turn.
let drag = null;
const angleAt = (e) => { const r = $('dial').getBoundingClientRect(); return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI; };
$('dialWrap').addEventListener('pointerdown', (e) => { if (view.mode !== 'space' || e.target.closest('#centerBtn')) return; drag = { a: angleAt(e), rot }; $('dialWrap').setPointerCapture(e.pointerId); });
$('dialWrap').addEventListener('pointermove', (e) => { if (!drag) return; rotMode = 'manual'; rot = drag.rot + angleAt(e) - drag.a; renderSpace(); });
$('dialWrap').addEventListener('pointerup', () => { drag = null; });
$('dialWrap').addEventListener('pointercancel', () => { drag = null; });
$('modeTime').addEventListener('click', () => { if (view.mode !== 'time') { view.mode = 'time'; render('in'); } });
$('dial').style.touchAction = 'manipulation';
$('modeSpace').addEventListener('click', () => { if (view.mode !== 'space') { view.mode = 'space'; $('panel').innerHTML = ''; render('out'); } });
for (const d of document.querySelectorAll('dialog')) d.addEventListener('click', (e) => { if (e.target === d) d.close(); });

// Paint the right sky and colors before anything shows, with no fade on first load.
document.documentElement.classList.add('preload');
paintSky(Date.now(), loc);
if (!store.get('journeyDone')) startJourney(); else render();
requestAnimationFrame(() => setTimeout(() => document.documentElement.classList.remove('preload'), 50));
setInterval(tick, 1000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && tick());
locationOnLoad();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
