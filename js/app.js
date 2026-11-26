import { hourOf, civilDate, addDays, SHITAH } from './zmanim.js';
import { gematria, WEEKDAYS, hebrewDate } from './hebrew.js';
import { buildDial, updateDial } from './dial.js';
import { paintSky } from './sky.js';
import { icon } from './emblems.js';
import { LEVELS, context, hourTribe, ordinal, weekView, monthView, yearView, shemitahView, worldView, hourView, spaceView, dayPanel } from './levels.js';
import { NEW_YORK, CITIES, isIsrael, candleMinutes, geolocate, geoPermission, placeName, searchPlaces, distanceKm } from './places.js';

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('hineni.' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('hineni.' + k, JSON.stringify(v)); } catch {} },
};
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

let loc = store.get('loc') || NEW_YORK;
let prefs = { ma: false, candles: 'auto', ...(store.get('prefs') || {}) };
const view = { mode: 'time', level: 'day', focus: Date.now(), follow: true };
let x = null, v = null, renderedKey = '', heading = null;

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
  render(dir);
}

// ---------- Render ----------
function animate(dir) {
  if (!dir) return;
  const w = $('dialWrap');
  w.classList.remove('in', 'out');
  void w.offsetWidth;
  w.classList.add(dir);
}

function render(dir) {
  const now = Date.now();
  if (view.follow) view.focus = now;
  x = context(view.focus, now, loc, opts());
  renderedKey = key();
  $('locName').textContent = loc.name;
  $('modeTime').setAttribute('aria-selected', view.mode === 'time');
  $('modeSpace').setAttribute('aria-selected', view.mode === 'space');
  const atNow = view.follow && view.level === 'day' && view.mode === 'time';
  $('nowBtn').hidden = atNow;
  animate(dir);

  if (x.jd.polar) {
    $('panel').innerHTML = `<div class="pcard"><p>The sun doesn't rise or set here today, so the hours can't be calculated. Polar zmanim need a rav's guidance.</p></div>`;
    return;
  }

  if (view.mode === 'space') {
    v = spaceView(x, heading);
    $('dial').innerHTML = v.svg;
    $('centerBtn').innerHTML = v.center;
    $('panel').innerHTML = v.panel;
    $('crumbs').innerHTML = `<span class="crumb cur">${esc(loc.name)}</span><span class="crumb">→ ירושלים</span>`;
    $('prevBtn').hidden = $('nextBtn').hidden = $('outBtn').hidden = true;
    $('compassBtn')?.addEventListener('click', startCompass);
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
    $('panel').innerHTML = v.panel;
  }
  $('prevBtn').hidden = !v.prev;
  $('nextBtn').hidden = !v.next;
  const up = LEVELS[LEVELS.indexOf(view.level) + 1];
  $('outBtn').hidden = !up;
  if (up) $('outBtn').innerHTML = `<span aria-hidden="true">⤢</span> ${cap(up)}`;
  renderCrumbs();
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function renderCrumbs() {
  const { hd, wd } = x;
  const pos = hd.year % 7 || 7;
  const h = hourOf(view.focus, x.jd);
  const label = {
    world: `${Math.floor(hd.year / 1000) + 1}th millennium`,
    shemitah: pos === 7 ? 'Shemitah' : `Shemitah ${pos}/7`,
    year: `<span class="he" lang="he">${gematria(hd.year % 1000)}</span>`,
    month: esc(hd.month),
    week: 'Week',
    day: `<bdi class="he" lang="he">${WEEKDAYS[wd].he}</bdi> · ${hd.day} ${esc(hd.month.split(' ').pop())}`,
    hour: `${ordinal(h.hour)} hour`,
  };
  const i = LEVELS.indexOf(view.level);
  $('crumbs').innerHTML = LEVELS.slice(i).reverse().map((l) => `<button type="button" class="crumb${l === view.level ? ' cur' : ''}" data-level="${l}">${label[l]}</button>`).join('<span class="sep">›</span>');
  const c = $('crumbs');
  c.scrollLeft = c.scrollWidth;
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
  $('centerBtn').innerHTML = live
    ? `<span class="c-eyebrow he" lang="he">${date}</span><span class="c-ico">${icon(ht.t.icon, 34)}</span><span class="c-big">${ordinal(h.hour)} hour</span><span class="c-line">of the ${h.isDay ? 'day' : 'night'} · ${ht.tribe}</span><span class="c-sub">${fmt(now)}</span>`
    : `<span class="c-eyebrow">${WEEKDAYS[wd].en}</span><span class="c-big he" lang="he">${date}</span><span class="c-line">Tap an hour to step inside</span>`;
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
      <div class="zrow"><span class="z-name">${esc(z.tr)}<small><span class="he" lang="he">${z.he}</span> · ${esc(z.en)}</small></span>
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
      if (Date.now() - last > 120) { last = Date.now(); const s = spaceView(x, heading); $('dial').innerHTML = s.svg; $('centerBtn').innerHTML = s.center; }
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
let lastMinute = -1;
function tick() {
  const now = Date.now();
  paintSky(now, loc);
  if (!x || (view.follow && (now >= x.jd.end || now < x.jd.start)) || key() !== renderedKey) { render(); lastMinute = Math.floor(now / 60000); return; }
  if (x.jd.polar) return;
  x.now = now;
  if (view.mode === 'time' && view.level === 'day') updateDay(now);
  const minute = Math.floor(now / 60000);
  if (minute !== lastMinute) {
    lastMinute = minute;
    if (view.mode === 'time' && view.level !== 'day') {
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

function initSettings() {
  $('setBtn').addEventListener('click', () => { $('optMA').checked = prefs.ma; $('optCandles').value = prefs.candles; $('setDlg').showModal(); });
  $('setClose').addEventListener('click', () => $('setDlg').close());
  $('optMA').addEventListener('change', (e) => { prefs.ma = e.target.checked; store.set('prefs', prefs); render(); });
  $('optCandles').addEventListener('change', (e) => { prefs.candles = e.target.value; store.set('prefs', prefs); render(); });
}

// ---------- Events ----------
function onChild(e) {
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
$('dial').addEventListener('click', onChild);
$('panel').addEventListener('click', onChild);
$('centerBtn').addEventListener('click', () => {
  if (view.mode !== 'time') return;
  if (view.level === 'day') { const live = x.now >= x.jd.start && x.now < x.jd.end; return go({ level: 'hour', focus: live ? x.now : view.focus }, 'in'); }
  const i = LEVELS.indexOf(view.level);
  if (i > 0) zoomTo(LEVELS[i - 1]);
});
$('outBtn').addEventListener('click', zoomOut);
$('nowBtn').addEventListener('click', goNow);
$('prevBtn').addEventListener('click', () => go(v?.prev, 'side'));
$('nextBtn').addEventListener('click', () => go(v?.next, 'side'));
$('crumbs').addEventListener('click', (e) => { const c = e.target.closest('[data-level]'); if (c && c.dataset.level !== view.level) zoomTo(c.dataset.level); });
$('modeTime').addEventListener('click', () => { if (view.mode !== 'time') { view.mode = 'time'; render('in'); } });
$('modeSpace').addEventListener('click', () => { if (view.mode !== 'space') { view.mode = 'space'; render('out'); } });
for (const d of document.querySelectorAll('dialog')) d.addEventListener('click', (e) => { if (e.target === d) d.close(); });

render();
setInterval(tick, 1000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && tick());
locationOnLoad();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
