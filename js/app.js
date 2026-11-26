import { hourOf, civilDate, addDays, SHITAH } from './zmanim.js';
import { gematria, WEEKDAYS, hebrewDate } from './hebrew.js';
import { buildDial, updateDial } from './dial.js';
import { paintSky } from './sky.js';
import { art } from './art.js';
import { LEVELS, context, hourTribe, ordinal, scales, weekView, monthView, yearView, shemitahView, worldView, hourView, spaceView, dayPanel } from './levels.js';
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
  $('nowBtn').textContent = view.mode === 'space' ? 'Back to time' : 'Back to now';
  animate(dir);

  if (x.jd.polar) {
    $('panel').innerHTML = `<div class="pcard"><p>The sun doesn't rise or set here today, so the hours can't be calculated. Polar zmanim need a rav's guidance.</p></div>`;
    return;
  }

  if (view.mode === 'space') {
    renderSpace();
    $('prevBtn').hidden = $('nextBtn').hidden = true;
    $('scale').hidden = true;
    return;
  }
  $('scale').hidden = false;

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
  $('viewTitle').innerHTML = v.title || '';
  renderScale();
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
    $('compassBtn').addEventListener('click', startCompass);
  } else {
    const fresh = document.createElement('div');
    fresh.innerHTML = v.panel;
    $('panel').querySelector('.pcard').replaceWith(fresh.querySelector('.pcard'));
    $('faceJ').addEventListener('click', () => { rotMode = 'jer'; renderSpace(); });
    $('northUp').addEventListener('click', () => { rotMode = 'north'; rot = 0; renderSpace(); });
    $('compassBtn').addEventListener('click', startCompass);
  }
}
const spaceBearing = () => { const r = Math.PI / 180, T = { lat: 31.7781, lon: 35.2354 }; const y = Math.sin((T.lon - loc.lon) * r) * Math.cos(T.lat * r); const xx = Math.cos(loc.lat * r) * Math.sin(T.lat * r) - Math.sin(loc.lat * r) * Math.cos(T.lat * r) * Math.cos((T.lon - loc.lon) * r); return ((Math.atan2(y, xx) / r) + 360) % 360; };

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
  $('viewTitle').innerHTML = `<bdi class="he" lang="he">${date}</bdi>`;
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
    if (view.mode === 'time') renderScale();
    if (view.mode === 'space') renderSpace();
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
  if (view.level === 'hour') return zoomTo('day');
  const i = LEVELS.indexOf(view.level);
  if (i > 0) zoomTo(LEVELS[i - 1]);
});
$('nowBtn').addEventListener('click', goNow);
$('prevBtn').addEventListener('click', () => go(v?.prev, 'side'));
$('nextBtn').addEventListener('click', () => go(v?.next, 'side'));
$('scale').addEventListener('click', (e) => {
  const c = e.target.closest('[data-level]');
  if (!c || c.dataset.level === view.level) return;
  view.focus = Date.now(); view.follow = c.dataset.level === 'day';
  zoomTo(c.dataset.level);
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

render();
setInterval(tick, 1000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && tick());
locationOnLoad();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
