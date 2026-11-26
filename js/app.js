import { hourOf, civilDate, addDays, angleOf, SHITAH } from './zmanim.js';
import { gematria, WEEKDAYS, hebrewDate } from './hebrew.js';
import { buildDial, updateDial } from './dial.js';
const SVGNS = 'http://www.w3.org/2000/svg';
import { paintSky } from './sky.js';
import { intro } from './intro.js';
import { art } from './art.js';
import { DAYS } from './lore.js';
import { monthLore } from './hebrew.js';
import { src, ladder, RENDER, LEVELS, context, hourTribe, ordinal, scales, weekView, monthView, yearView, shemitahView, worldView, hourView, spaceView, dayPanel } from './levels.js';
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
// While a step is moving, a new tap does not wait: the step jumps straight to its end, and the new one begins.
let busyUntil = 0, goldTimer = 0;
const busy = () => performance.now() < busyUntil;
const hold = (ms) => { if (!matchMedia('(prefers-reduced-motion: reduce)').matches) busyUntil = performance.now() + ms; };
function settle() {
  if (!busy()) return;
  busyUntil = 0;
  const w = $('dialWrap');
  w.querySelectorAll('.ring-ghost, .halos-ghost, .morph, .fly').forEach((el) => el.remove());
  w.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  $('dial').classList.remove('no-now');
}
function go(next, dir) {
  if (!next) return;
  settle();
  view.level = next.level;
  view.focus = next.focus;
  view.follow = false;
  render(dir);
}
function goNow() {
  settle();
  Object.assign(view, { mode: 'time', level: 'day', focus: Date.now(), follow: true });
  render('out');
}
function hint(key, text) {
  if (store.get(key)) return;
  store.set(key, true);
  $('toast').innerHTML = `<span><b>${text}</b></span>`;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 6000);
}
function zoomOut() {
  settle();
  if (!journey) setTimeout(() => hint('hint.in', 'Tap any section to step inside it'), STEP);
  const i = LEVELS.indexOf(view.level);
  if (i < LEVELS.length - 1) { view.level = LEVELS[i + 1]; render('out'); }
}
function zoomTo(level) {
  settle();
  const dir = LEVELS.indexOf(level) > LEVELS.indexOf(view.level) ? 'out' : 'in';
  view.level = level;
  // Back at the day you're living in: follow the clock again.
  if (level === 'day' && x && x.now >= x.jd.start && x.now < x.jd.end) view.follow = true;
  render(dir);
}

// ---------- Render ----------
// State shared by the step animations.
let lastMarker = null, pendingGhost = null, shownLevel = null, ringT = {}, pendingBlock = null, pendingNest = null;

/** V2 motion, in two calm stages and with no turning:
 *  1. the "now" block closes into a full ring while everything holds still (morphBlock);
 *  2. the old circle expands outward into the first outer ring, pushing the outer rings out,
 *     while the new circle fades in at the centre. Ring angles change by cross-fading, never by spinning. */
// One step is one gesture: as you tap, the circle you were in moves out and turns gently to its outer place,
// and at the same moment the block you tapped grows into the gold ring of the new circle.
const STEP = 4000, STAGE = 0, SETTLE = STEP;
function animateV2(dir) {
  const g = pendingGhost; pendingGhost = null;
  if (!g || !(dir === 'in' || dir === 'out') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const w = $('dialWrap'), delay = 0, calm = 'cubic-bezier(.37, 0, .25, 1)';   // slow start, long gentle settle
  const opts = { duration: STEP, delay, easing: calm, fill: 'both' };      // for ghosts, removed when done
  const keep = { duration: STEP, delay, easing: calm, fill: 'backwards' }; // for what stays
  const S = (s) => `scale(${s.toFixed(4)})`;
  if (dir === 'out' && g.T[view.level]?.s > 1) g.handoff = view.level;
  pushRings(g, dir, delay);
  // The dial you leave. Stepping in: its ring fades a little as it expands, turns gently, and settles
  // exactly where it now belongs as the first outer ring; its middle melts away. Stepping out: it sinks.
  const to = ringT[g.level];
  const mk = (cls, html = g.html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; w.appendChild(d); return d; };
  const gone = (anim, el) => anim.finished.then(() => el.remove(), () => el.remove());
  if (dir === 'in' && to) {
    // Its ring band, with no gold "now" (that belongs to the new circle), moves out and turns into its outer place,
    // dimming as it goes, then hands over to the real ring. Its words fade early and come back, upright, with the real ring.
    const ring = mk('ring-ghost ghost-band no-now'), words = mk('ring-ghost ghost-band ghost-words no-now'), mid = mk('ring-ghost ghost-mid');
    const end = `rotate(${to.rot.toFixed(2)}deg) scale(${to.s.toFixed(4)})`;
    gone(ring.animate([{ transform: 'none', opacity: 1, easing: calm }, { transform: end, opacity: 0.4, offset: 0.82 }, { transform: end, opacity: 0 }], { ...opts, easing: 'linear' }), ring);
    gone(words.animate([{ transform: 'none', opacity: 1, easing: calm }, { transform: end, opacity: 0, offset: 0.82 }, { transform: end, opacity: 0 }], { ...opts, easing: 'linear' }), words);
    words.animate([{ opacity: 1 }, { opacity: 0, offset: 0.22 }, { opacity: 0 }], { duration: STEP, fill: 'both', composite: 'replace' });
    gone(mid.animate([{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }], opts), mid);
    // The real ring takes over only once the old one has arrived.
    document.querySelectorAll(`#halos .or2[data-level="${g.level}"]`).forEach((el) => {
      el.getAnimations().forEach((a) => a.cancel());
      el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.74 }, { opacity: 1 }], { ...opts, fill: 'backwards', easing: 'linear' });
    });
  } else {
    const ghost = mk('ring-ghost');
    gone(ghost.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.6)', opacity: 0 }], opts), ghost);
  }
  const from = g.T[view.level];
  if (dir === 'out' && from && from.s > 1) {
    // Stepping out: the outer ring you are stepping into comes in, turning back upright, and becomes the circle.
    const band = mk('ring-ghost ghost-band no-words', $('dial').outerHTML.replace(/ id="[^"]*"/g, ''));
    gone(band.animate([{ transform: `rotate(${from.rot.toFixed(2)}deg) scale(${from.s.toFixed(4)})`, opacity: 0.4 }, { transform: 'none', opacity: 1, offset: 0.8 }, { transform: 'none', opacity: 0 }], opts), band);
    for (const el of [$('dial'), $('centerBtn')]) {
      el.style.transformOrigin = '50% 50%';
      el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], keep);
    }
    return;
  }
  // The new dial: in from slightly smaller (in), or down from its outer-ring size (out).
  const fromS = dir === 'in' ? 'scale(.9)' : S(from?.s ?? 1.25);
  for (const el of [$('dial'), $('centerBtn')]) {
    el.style.transformOrigin = '50% 50%';
    el.animate([{ transform: fromS, opacity: 0 }, { opacity: 0, offset: 0.45 }, { transform: 'none', opacity: 1 }], keep);
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
  old.querySelector(`.or2[data-level="${g.handoff}"]`)?.remove(); // it is becoming the circle itself
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
  $('dialWrap').appendChild(ov);
  const mid = (a[0] + a[1]) / 2, w0 = a[1] - a[0], t0 = performance.now(), GROW = STEP * 0.7;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  (function step(now) {
    const t = now - t0, w = w0 + (359.9 - w0) * ease(Math.min(1, t / GROW));
    path.setAttribute('d', sector(R1, R2, mid - w / 2, mid + w / 2));
    ov.style.opacity = t < GROW ? 0.9 : 0.9 * Math.max(0, 1 - (t - GROW) / (STEP - GROW));
    if (t < STEP) requestAnimationFrame(step); else ov.remove();
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
  const T = 5200, ease = 'cubic-bezier(.4, .1, .2, 1)';
  hold(T * 0.9);
  g.querySelectorAll('.nr').forEach((r, i) => {
    r.style.transformBox = 'view-box'; r.style.transformOrigin = '200px 200px';
    if (i === 0) r.animate([{ opacity: 1 }, { opacity: 1, offset: 0.25 }, { opacity: 0, offset: 0.45 }, { opacity: 0 }], { duration: T, easing: ease, fill: 'forwards' });
    else {
      r.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.9)', offset: 0.2 }, { opacity: 0 }], { duration: T, easing: ease, fill: 'forwards' });
      r.querySelectorAll('.nr-dot').forEach((d) => d.animate([{ opacity: 1 }, { opacity: 0, offset: 0.12 }, { opacity: 0 }], { duration: T, fill: 'forwards' }));
    }
  });
  g.querySelectorAll('.nr-label').forEach((el, i) => el.animate([{ opacity: 1 }, { opacity: 0, offset: i === 0 ? 0.28 : 0.16 }, { opacity: 0 }], { duration: T, fill: 'forwards' }));
  g.querySelectorAll('.face').forEach((el) => el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.22 }, { opacity: 0, offset: 0.45 }, { opacity: 0 }], { duration: T, fill: 'forwards' }));
  g.querySelector('.c-sub, .nr-now')?.remove();
  // The new circle: its ring first (beat 2), then everything inside it (beat 3).
  const dial = $('dial');
  const inner = [...dial.querySelectorAll('text, .art-at, .moonph, .ray, .marker, .band')];
  dial.animate([{ opacity: 0 }, { opacity: 0, offset: 0.24 }, { opacity: 1, offset: 0.46 }, { opacity: 1 }], { duration: T, easing: ease });
  // Its own gold "now" stays plain until the travelling arc has arrived on it: only one gold at a time.
  dial.classList.add('no-now');
  setTimeout(() => dial.classList.remove('no-now'), T * 0.8);
  inner.forEach((el) => el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 1 }], { duration: T, easing: 'ease' }));
  $('centerBtn').animate([{ opacity: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 1 }], { duration: T, easing: 'ease' });
  $('journey').animate([{ opacity: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 1 }], { duration: T, easing: 'ease' });
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
      const t = (now - t0) / T, k = e3(Math.min(1, Math.max(0, (t - 0.2) / 0.62)));
      const r1 = 170.5 + (158 - 170.5) * k, r2 = 185.5 + (188 - 185.5) * k;
      path.setAttribute('d', sec(r1, r2, a0 + (b1 - a0) * k, aE + (b2 - aE) * k));
      ov.style.opacity = t < 0.2 ? 0 : t < 0.84 ? 1 : Math.max(0, 1 - (t - 0.84) / 0.16);
      if (t < 1) requestAnimationFrame(step); else ov.remove();
    })(t0);
    g.querySelector('.nr .nr-arc')?.animate([{ opacity: 1 }, { opacity: 1, offset: 0.19 }, { opacity: 0, offset: 0.21 }, { opacity: 0 }], { duration: T, fill: 'forwards' });
  }
  setTimeout(() => g.remove(), T + 50);
}

function renderVer() {
  $('ver').innerHTML = [['clean', 'Clean'], ['detailed', 'Detailed']].map(([k, t]) => `<button type="button" data-ver="${k}" class="${prefs.view === k ? 'on' : ''}">${t}</button>`).join('');
}

function render(dir) {
  const now = Date.now();
  if ((dir === 'in' || dir === 'out') && $('dial').firstChild) {
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
    lastMarker = null;
    showJourney();
    return;
  }

  if (view.level === 'day') {
    buildDial($('dial'), x.jd, loc.tz);
    v = {
      prev: { level: 'day', focus: x.chatzos(addDays(x.date, -1)) },
      next: { level: 'day', focus: x.chatzos(addDays(x.date, 1)) },
      panel: framed(dayPanel(x), '', 'day') + zmanimHTML(x) + howHTML(),
    };
    $('panel').innerHTML = v.panel;
    updateDay(now);
  } else if (view.level === 'hour') {
    const h = hourOf(view.focus, x.jd);
    v = hourView(x, { isDay: h.isDay, hour: h.hour });
    $('dial').innerHTML = v.svg;
    $('centerBtn').innerHTML = v.center;
    $('panel').innerHTML = framed(v.panel, v.title, 'hour');
  } else {
    v = { week: weekView, month: monthView, year: yearView, shemitah: shemitahView, world: worldView }[view.level](x);
    $('dial').innerHTML = v.svg;
    $('centerBtn').innerHTML = v.center;
    $('panel').innerHTML = journey ? '' : framed(v.panel, v.title, view.level);
  }
  if (journey) $('panel').innerHTML = '';
  $('centerBtn').dataset.level = view.level;
  lastMarker = view.level === 'day' ? (x.now >= x.jd.start && x.now < x.jd.end ? angleOf(x.now, x.jd) : null) : v.marker ?? null;
  shownLevel = view.level;
  $('dialWrap').classList.toggle('not-now', !journey && lastMarker == null);
  markSources();
  setHalos(outerRings());
  if (pendingNest) { pendingGhost = null; pendingBlock = null; nestToFace(); }
  else {
    if (pendingGhost && (dir === 'in' || dir === 'out')) hold(STEP * 0.92);
    if (dir === 'in' && pendingBlock) {
      $('dial').classList.add('no-now'); clearTimeout(goldTimer);
      goldTimer = setTimeout(() => $('dial').classList.remove('no-now'), STEP * 0.72);
    }
    animateV2(dir);
    morphBlock();
  }
  if (journey) showJourney();
  renderVer();
}

// Every level's panel: its heading inside the first box, then Here I am: the ladder of circles.
function framed(panel, title, level) {
  let out = panel;
  if (title) out = out.replace(/<section class="pcard([^"]*)">(\s*<h3>[\s\S]*?<\/h3>)?/, (m, cls) => `<section class="pcard${cls}"><h3 class="lvl-title">${title}</h3>`);
  if (level) out = out.replace('</section>', `</section><section class="pcard here-box"><h3>Here I am</h3>${ladder(x, level)}</section>`);
  return out;
}

function markSources() {
  const lad = $('panel').querySelector('.ladder'), h = lad?.querySelector('.here');
  if (h) lad.scrollLeft += h.getBoundingClientRect().left - lad.getBoundingClientRect().left - (lad.clientWidth - h.offsetWidth) / 2;
  // Mark every box that carries a source, so its text can be tapped to open it.
  document.querySelectorAll('.src-body').forEach((b) => b.closest('.pcard, .journey')?.classList.add('has-src'));
}

function renderSpace() {
  setTimeout(markSources);
  if (rotMode === 'jer') rot = -spaceBearing();
  else if (rotMode === 'phone' && heading != null) rot = -heading;
  v = spaceView(x, rot);
  $('dial').innerHTML = v.svg;
  $('centerBtn').innerHTML = v.center;
  if (!document.getElementById('faceJ')) {
    $('panel').innerHTML = framed(v.panel, `<span id="spaceTitle">${v.title}</span>`);
    $('faceJ').addEventListener('click', () => { rotMode = 'jer'; renderSpace(); });
    $('northUp').addEventListener('click', () => { rotMode = 'north'; rot = 0; renderSpace(); });
    $('compassBtn')?.addEventListener('click', startCompass);
  } else {
    const fresh = document.createElement('div');
    fresh.innerHTML = framed(v.panel, `<span id="spaceTitle">${v.title}</span>`);
    $('panel').querySelector('.pcard').replaceWith(fresh.querySelector('.pcard'));
    $('panel').querySelector('.camp-card')?.replaceWith(fresh.querySelector('.camp-card'));
    $('faceJ').addEventListener('click', () => { rotMode = 'jer'; renderSpace(); });
    $('northUp').addEventListener('click', () => { rotMode = 'north'; rot = 0; renderSpace(); });
    $('compassBtn')?.addEventListener('click', startCompass);
  }
}
const spaceBearing = () => { const r = Math.PI / 180, T = { lat: 31.7781, lon: 35.2354 }; const y = Math.sin((T.lon - loc.lon) * r) * Math.cos(T.lat * r); const xx = Math.cos(loc.lat * r) * Math.sin(T.lat * r) - Math.sin(loc.lat * r) * Math.cos(T.lat * r) * Math.cos((T.lon - loc.lon) * r); return ((Math.atan2(y, xx) / r) + 360) % 360; };

/** Live parts of the day view: hand, highlighted hour and the center. */
function updateDay(now) {
  const jd = x.jd;
  const live = now >= jd.start && now < jd.end;
  const ref = live ? now : view.focus;
  const h = hourOf(ref, jd);
  const next = live ? jd.list.find((z) => z.t > now) : null;
  updateDial($('dial'), now, jd, h, next ? next.key + next.part : '', live);
  const ht = hourTribe(h.hour);
  const { wd } = x;
  $('centerBtn').innerHTML = live
    ? `<span class="c-art">${art(ht.t.icon, 58)}</span><span class="c-big">${ordinal(h.hour)} hour</span><span class="c-line">of the ${h.isDay ? 'day' : 'night'} · the hour of ${ht.tribe}</span><span class="c-sub civil-now">(${fmt(now)})</span>`
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
    <p class="lore-p">Each hour belongs to a month and its tribe; the colored band is the tribe's flag. Tap the gold, or any section, to step inside it, and tap outside the circle to step back out. Under the first box, the row of circles shows where you are inside the bigger ones; tap any of them to go there.</p></details>`;
}

const monthTribe = (hd) => monthLore(hd.month)?.tribe ?? '';
const dayMade = (wd) => ({ 0: 'light', 1: 'the firmament', 2: 'the land and its plants', 3: 'the sun, moon and stars', 4: 'the fish and the birds', 5: 'the animals and man', 6: 'rest' })[wd];
// ---------- The journey: from the outside in ----------
// nest → world → shemitah → year → month → week → (tap outside: out) month → week → day → (tap the hour) hour → (tap the middle) today
const STEPS = ['nest', 'world', 'shemitah', 'year', 'month', 'week', 'day', 'hour'];
const STEP_LEVEL = { nest: 'world', world: 'world', shemitah: 'shemitah', year: 'year', month: 'month', week: 'week', day: 'day', hour: 'hour' };
const OUTER = ['world', 'shemitah', 'year', 'month', 'week', 'day'];
let journey = null;
const isTouch = () => matchMedia('(pointer: coarse)').matches;

function journeyCopy(step) {
  const { hd, wd } = x, pos = hd.year % 7 || 7, mil = Math.floor(hd.year / 1000) + 1;
  const h = hourOf(Date.now(), x.nowJd), ht = hourTribe(h.hour);
  return {
    nest: ['Time, according to Judaism', 'In Judaism, time is not a straight line but circles inside circles: the six thousand years of the world, the seven-year shemitah cycle, the year, the month, the week, the day and the hour. You stand at the center of them all.', 'Tap the outer ring', "Shabbos every seventh day: Bereishis 2:1–3. Shemitah every seventh year: Vayikra 25:1–7. Six thousand years: Sanhedrin 97a. The month begins with the new moon: Shemos 12:2 with Rashi."],
    world: [`The ${ordinal(mil)} millennium`, "Our sages teach that the world runs for six thousand years, like the six days of creation, and the seventh millennium is a Shabbos (Sanhedrin 97a). We are in the sixth: the world's Friday, getting ready.", 'Tap the gold to step in', "Sanhedrin 97a: \"The world exists for six thousand years\"; Rashi there compares the seventh millennium to Shabbos."],
    shemitah: [pos === 7 ? 'A shemitah year' : `Shemitah · year ${pos} of 7`, 'The Torah counts years in sevens. Six years the land of Israel is worked, and in the seventh, the shemitah, it rests (Vayikra 25).', 'Tap the gold to step in', "Vayikra 25:1–7. The years of the cycle and their tithes: Rambam, Hilchos Shemitah v'Yovel."],
    year: [`${hd.year} · <span class="he" lang="he">${gematria(hd.year % 1000)}</span>`, 'The Jewish year follows both the moon and the sun. It begins at Rosh Hashanah, and a thirteenth month is added in some years to keep Pesach in spring. Each month is linked to one of the twelve tribes.', 'Tap the gold to step in', "Keeping Pesach in spring: \"Guard the month of spring\" (Devarim 16:1), the reason for a leap month (Sanhedrin 11b). The months and the tribes: the Arizal."],
    month: [`${hd.month}`, `A Jewish month begins with the new moon, Rosh Chodesh, and grows and wanes with it. This is ${hd.month}, the month of ${monthTribe(hd)}. Today is its ${ordinal(hd.day)} day.`, 'Tap the gold to step in', "\"This month shall be for you the first of the months\" (Shemos 12:2); Rashi there: Hashem showed Moshe the new moon."],
    week: [`<span class="he" lang="he">${WEEKDAYS[wd].he}</span>`, `In Hebrew the weekdays have no names of their own, only numbers counting toward Shabbos. Today is the ${ordinal(wd + 1)} day, when Hashem made ${dayMade(wd)}.`, 'Tap the gold to step in', "The days are counted toward Shabbos: Ramban on Shemos 20:8, \"Remember the day of Shabbos\". The work of each day: Bereishis 1."],
    day: ['Today', 'A Jewish day begins at sunset: "there was evening and there was morning." It has twelve hours of night and twelve of day. Each is a twelfth of the dark or the light, so they stretch in summer and shrink in winter. At sunset this day ends and the next one begins. The line is now.', 'Tap the gold to step in', "\"There was evening and there was morning, one day\" (Bereishis 1:5): the night comes first. The hours are a twelfth of the day or night, so they change with the seasons (sha'os zmaniyos)."],
    hour: [`The ${ordinal(h.hour)} hour · ${ht.tribe}`, "This is the hour you're in. Each hour is linked to a month and its tribe, with its own quality and pasuk. Every circle holds the one inside it: tap the gold to step in, tap outside to step back out.", 'Tap outside the circle to step back out to today', "Each hour follows a month, from Nissan, after the Arizal's twelve permutations of the Name. The tribes' flags: Bamidbar Rabbah 2:7."],
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
    // Its name rides the ring itself, just past its "now" dot, upright and reading along it.
    const word = r.label.toUpperCase(), fs = 8.5, stp = ((fs * 0.78) / R) * (180 / Math.PI), span = stp * (word.length - 1);
    const dotDeg = frac * 360, mid = dotDeg + (13 / R) * (180 / Math.PI) + span / 2, m = ((mid % 360) + 360) % 360, flip = m > 90 && m < 270;
    [...word].forEach((ch, k) => {
      const d = flip ? mid + span / 2 - k * stp : mid - span / 2 + k * stp, rr = (d * Math.PI) / 180;
      const lx = C + R * Math.sin(rr), ly = C - R * Math.cos(rr);
      svg += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="nr-label big" transform="rotate(${(flip ? d + 180 : d).toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})">${ch}</text>`;
    });
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
function levelFace(level, rot = 0) {
  if (level === 'day') {
    const tmp = document.createElementNS(SVGNS, 'svg');
    const live = x.now >= x.jd.start && x.now < x.jd.end;
    buildDial(tmp, x.jd, loc.tz);
    updateDial(tmp, x.now, x.jd, hourOf(live ? x.now : x.focus, x.jd), '', live);
    return { html: tmp.innerHTML, marker: live ? angleOf(x.now, x.jd) : null };
  }
  RENDER.lite = true; RENDER.rot = rot; // the faint outer faces carry no medallions
  try {
    const f = { week: weekView, month: monthView, year: yearView, shemitah: shemitahView, world: worldView }[level](x);
    return { html: f.svg, marker: f.marker ?? null };
  } finally { RENDER.lite = false; RENDER.rot = 0; }
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
    let face = levelFace(L);
    let rot = face.marker == null ? 0 : hand - face.marker;
    rot = ((rot % 360) + 540) % 360 - 180; // the shorter way round
    if (rot && L !== 'day') face = levelFace(L, rot); // lay its words out again for where they will sit
    ringT[L] = { rot, s };
    const upright = face.html.replace(/<text([^>]*?) x="(-?[\d.]+)" y="(-?[\d.]+)"([^>]*?)>/g, (m, a1, tx, ty, a2) => /transform=/.test(a1 + a2) ? m : `<text${a1} x="${tx}" y="${ty}"${a2} transform="rotate(${(-rot).toFixed(2)} ${tx} ${ty})">`);
    face.html = upright;
    html += `<div class="or2" data-level="${L}" style="--o:${[0.36, 0.26, 0.2, 0.15, 0.11, 0.08][k]};transform: rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})"><svg viewBox="-30 -30 460 460">${face.html.replace(/ id="[^"]*"/g, '')}</svg></div>`;
  });
  if (lastMarker != null) {
    const a = (hand * Math.PI) / 180, p = (r) => `${(200 + r * Math.sin(a)).toFixed(1)} ${(200 - r * Math.cos(a)).toFixed(1)}`;
    html += `<svg class="or-hand" viewBox="-30 -30 460 460"><path d="M${p(191)} L${p(1400)}"/></svg>`;
  }
  return html;
}

function showJourney() {
  if (document.body.classList.contains('intro-on') || !journey) return;
  const [big, text, prompt, source] = journeyCopy(journey.step);
  $('jBig').innerHTML = big;
  $('jText').textContent = text;
  $('jTap').innerHTML = esc(prompt);
  $('jSrc').innerHTML = source ? src(esc(source)) : '';
  $('journey').classList.toggle('has-src', !!source);
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
  // The card sinks away, the clock grows to its full size and steps back to today, and the rest of the page fades in.
  const card = $('journey');
  card.animate([{ opacity: 1, transform: 'translateX(-50%)' }, { opacity: 0, transform: 'translateX(-50%) translateY(24px)' }], { duration: 700, easing: 'ease', fill: 'forwards' })
    .finished.then(() => { card.hidden = true; card.getAnimations().forEach((a) => a.cancel()); });
  // The clock takes its full size at once in the layout, and is shown growing into it with one smooth scale:
  // nothing is measured or laid out again while it moves.
  const wrap = $('dialWrap'), r0 = wrap.getBoundingClientRect();
  document.body.classList.add('arriving');
  document.body.classList.remove('journeying');
  delete document.body.dataset.jstep;
  setTimeout(() => document.body.classList.remove('arriving'), 4200);
  setTimeout(() => hint('hint.out', 'Tap outside the circle to explore'), 4600);
  Object.assign(view, { mode: 'time', level: 'day', focus: Date.now(), follow: true });
  render('out');
  const r1 = wrap.getBoundingClientRect(), k = r0.width / r1.width;
  if (Math.abs(1 - k) > 0.01 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const dx = r0.left + r0.width / 2 - (r1.left + r1.width / 2), dy = r0.top + r0.height / 2 - (r1.top + r1.height / 2);
    wrap.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${k})` }, { transform: 'none' }], { duration: 1800, easing: 'cubic-bezier(.4, .1, .2, 1)' });
  }
}

/** One action moves the journey on: 'outer' (the outer ring), 'middle', 'outside', or 'hour' (a block of the day). */
function journeyDo(action, arg) {
  settle();
  const st = journey.step;
  const move = (step, level, dir, focus) => {
    journey.step = step;
    view.level = level; view.focus = focus ?? Date.now(); view.follow = level === 'day';
    render(dir);
  };
  if (st === 'nest' && action === 'outer') { pendingNest = $('dial').outerHTML.replace(/ id="[^"]*"/g, ''); return move('world', 'world'); }
  if (action === 'middle') {
    const next = { world: ['shemitah', 'shemitah'], shemitah: ['year', 'year'], year: ['month', 'month'], month: ['week', 'week'], week: ['day', 'day'] }[st];
    if (next) return move(next[0], next[1], 'in');
  }
  if (st === 'hour' && (action === 'outside' || action === 'middle')) return endJourney();
  if (st === 'day' && (action === 'hour' || action === 'middle')) return move('hour', 'hour', 'in', arg ?? Date.now());
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
  if (busy()) return;
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
  if (minute !== lastMinute && !busy()) {
    lastMinute = minute;
    if (view.mode === 'space') renderSpace();
    if (!journey) setHalos(outerRings());
    if (view.mode === 'time' && view.level !== 'day' && !journey) {
      // Move only the hand and the parts that change; the pictures are never redrawn, so nothing flashes.
      const fresh = view.level === 'hour' ? hourView(context(view.focus, now, loc, opts()), hourOf(view.focus, x.jd)) : { week: weekView, month: monthView, year: yearView, shemitah: shemitahView, world: worldView }[view.level](context(view.focus, now, loc, opts()));
      const tmp = document.createElementNS(SVGNS, 'svg'); tmp.innerHTML = fresh.svg;
      for (const sel of ['line.ray', 'circle.marker', 'path.hr-fill', '.sun', '.moon']) {
        const a = $('dial').querySelectorAll(sel), b = tmp.querySelectorAll(sel);
        if (a.length === b.length) a.forEach((el, i) => { for (const at of b[i].attributes) el.setAttribute(at.name, at.value); });
      }
      const c = $('centerBtn').querySelectorAll('.c-sub, .c-line'), fc = document.createElement('div'); fc.innerHTML = fresh.center;
      const nc = fc.querySelectorAll('.c-sub, .c-line');
      c.forEach((el, i) => { if (nc[i] && el.innerHTML !== nc[i].innerHTML) el.innerHTML = nc[i].innerHTML; });
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
  $('locBtn').addEventListener('click', () => { $('setDlg').close(); $('geoMsg').textContent = ''; $('locDlg').showModal(); });
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
/** Is the tap in the same direction from the middle as the gold block? (Nearer the middle or just past the rim.) */
function inGoldAngle(e) {
  const nb = $('dial').querySelector('.rs.now[data-a], .seg.now[data-a]');
  if (!nb) return false;
  const r = $('dial').getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const d = Math.hypot(dx, dy) / (r.width / 460);
  if (d > 225) return false;
  const ang = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360, [a1, a2] = nb.dataset.a.split(',').map(Number);
  const rel = (((ang - a1) % 360) + 360) % 360;
  return rel <= (((a2 - a1) % 360) + 360) % 360 + 2 || rel >= 358;
}
const outsideDial = (e) => { const r = $('dial').getBoundingClientRect(); return Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) > r.width * (194 / 460); };
function onChild(e) {
  if (e.currentTarget.id === 'dial' && outsideDial(e)) return; // the corners of the square belong to "outside"
  if (journey) {
    if (e.currentTarget.id !== 'dial') return;
    if (journey.step === 'nest') return journeyDo('outer'); // any tap on the circles begins at the outer ring
    if (view.level === 'day') return journeyDo('hour', Date.now()); // anywhere on today's clock: into the hour you're in
    if (e.target.closest('[data-child]')?.matches('.now, .now *') || inGoldAngle(e)) return journeyDo('middle');
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
document.addEventListener('click', (e) => {
  const box = e.target.closest('.has-src');
  if (!box || e.target.closest('button, a, summary, [data-child], [data-lad]')) return;
  box.querySelectorAll('.src-body').forEach((b) => b.classList.toggle('open'));
});
$('panel').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lad]');
  if (!b || b.dataset.lad === view.level) return;
  const L = b.dataset.lad;
  if (L === 'hour') return go({ level: 'hour', focus: Date.now() }, 'in');
  zoomTo(L);
  scrollTo({ top: 0, behavior: 'smooth' });
});
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
// Tap inside the circle to step in; tap outside it to step out.
document.addEventListener('click', (e) => {
  if (view.mode !== 'time' || document.body.classList.contains('intro-on')) return;
  if (e.target.closest('a, input, select, label, summary, dialog, .pcard, .card, .journey, .top, .toast')) return;
  if (e.target.closest('button') && e.target.closest('button').id !== 'centerBtn') return;
  if (!outsideDial(e)) return; // inside the circle: its own taps handle it
  if (journey) return journeyDo(journey.step !== 'hour' && inGoldAngle(e) ? 'middle' : 'outside');
  zoomOut();
});

// Space: drag to turn.
let drag = null;
const angleAt = (e) => { const r = $('dial').getBoundingClientRect(); return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI; };
$('dialWrap').addEventListener('pointerdown', (e) => { if (view.mode !== 'space' || e.target.closest('#centerBtn')) return; drag = { a: angleAt(e), rot }; $('dialWrap').setPointerCapture(e.pointerId); });
$('dialWrap').addEventListener('pointermove', (e) => { if (!drag) return; rotMode = 'manual'; rot = drag.rot + angleAt(e) - drag.a; renderSpace(); });
$('dialWrap').addEventListener('pointerup', () => { drag = null; });
$('dialWrap').addEventListener('pointercancel', () => { drag = null; });
const fadeIn = () => { for (const el of [$('dial'), $('centerBtn'), $('halos')]) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: 'ease' }); };
$('modeTime').addEventListener('click', () => { if (view.mode !== 'time') { settle(); view.mode = 'time'; render(); fadeIn(); } });
$('dial').style.touchAction = 'manipulation';
$('modeSpace').addEventListener('click', () => { if (view.mode !== 'space') { settle(); view.mode = 'space'; $('panel').innerHTML = ''; render(); fadeIn(); } });
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
