import { jewishDay, hourOf, civilDate, weekday, addDays, dayInfo, SHITAH } from './zmanim.js';
import { hebrewDate, gematria, WEEKDAYS, monthLore, moonPhase } from './hebrew.js';
import { MONTH_NUM, molad, moladText, nextMonth, kiddushLevanah, omerDay, omerSefirah, planetOf } from './calendar.js';
import { buildDial, updateDial } from './dial.js';
import { paintSky } from './sky.js';
import { NEW_YORK, CITIES, isIsrael, candleMinutes, geolocate, geoPermission, placeName, searchPlaces, weather, distanceKm } from './places.js';

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('hineni.' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('hineni.' + k, JSON.stringify(v)); } catch {} },
};

let loc = store.get('loc') || NEW_YORK;
let prefs = { ma: false, candles: 'auto', ...(store.get('prefs') || {}) };
let jd = null, builtFor = '', wx = null, wxFor = '', wxAt = 0;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const opts = () => ({ israel: isIsrael(loc), ma: prefs.ma, candleMin: prefs.candles === 'auto' ? candleMinutes(loc) : +prefs.candles });
const locKey = () => [loc.lat, loc.lon, prefs.ma, prefs.candles].join('|');
const fmt = (t) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: loc.tz }).format(new Date(t));
const fmtDay = (t) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: loc.tz }).format(new Date(t));
const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

function until(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 1) return 'now';
  if (m < 60) return `in ${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return `in ${h}h${r ? ' ' + r + 'm' : ''}`;
}

function moonGlyph(day) {
  return ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][Math.round(moonPhase(day) * 8) % 8];
}

// ---------- Build (once per Jewish day / location change) ----------
function rebuild(now) {
  jd = jewishDay(now, loc, opts());
  builtFor = locKey();
  $('locName').textContent = loc.name;
  if (jd.polar) {
    $('next').innerHTML = `<p>The sun doesn't rise or set here today, so the hours can't be calculated. Polar zmanim need a rav's guidance.</p>`;
    return;
  }
  buildDial($('dial'), jd, loc.tz);
  renderDate(now);
  renderZmanimList();
  renderMoon(now);
  renderMonth();
  renderUpcoming();
  const o = opts();
  $('hourLen').textContent =
    `Today a daytime hour is ${Math.round(jd.day.hour / 60000)} min and a night hour ${Math.round(jd.night.hour / 60000)} min. ` +
    `Shitah: ${SHITAH.name}${o.ma ? ', with Magen Avraham times' : ''}. Candles ${o.candleMin} min before sunset${o.israel ? '; Israel: one day of Yom Tov' : ''}.`;
}

function renderDate(now) {
  const { hd, wd, hols } = jd.info;
  const w = WEEKDAYS[wd];
  const civilWd = weekday(civilDate(now, loc.tz));
  const afterSunset = now < jd.day.netz && civilWd !== wd;
  let shabbos;
  if (wd === 6) shabbos = `Shabbos Kodesh`;
  else if (wd === 5) shabbos = `Erev Shabbos`;
  else shabbos = `Shabbos in ${6 - wd} day${6 - wd === 1 ? '' : 's'}`;
  const omer = omerDay(hd);
  const chips = hols.map((h) => `<span class="chip k-${h.kind}">${esc(h.name)}</span>`).join('');
  $('date').innerHTML = `
    <div class="date-row">
      <div><div class="date-en">${hd.en}</div><div class="date-wd">${w.tr} · ${w.en}</div></div>
      <div class="date-he he" lang="he" dir="rtl">${hd.he}<div class="date-wd he">${w.he}</div></div>
    </div>
    ${chips ? `<div class="chips">${chips}</div>` : ''}
    <div class="date-meta">
      <span>${moonGlyph(hd.day)} ${ordinal(hd.day)} of ${hd.month}</span>
      <span>${shabbos}</span>
    </div>
    ${omer ? `<div class="omer"><b>Tonight's count: day ${omer} of the Omer</b><span>${omerSefirah(omer).tr} · <span class="he" lang="he">${omerSefirah(omer).he}</span></span></div>` : ''}
    ${afterSunset ? `<p class="fine">The Jewish day began at sunset, so it's already ${w.en} by Jewish reckoning.</p>` : ''}`;
}

function renderZmanimList() {
  const ol = $('zmanim');
  ol.replaceChildren();
  let lastPart = '';
  const label = { eve: 'Night', day: 'Day', after: 'After sunset' };
  for (const z of jd.list) {
    if (z.part !== lastPart) {
      const h = document.createElement('li');
      h.className = 'part';
      h.textContent = label[z.part];
      ol.appendChild(h);
      lastPart = z.part;
    }
    const li = document.createElement('li');
    li.className = 'z' + (['candles', 'candlesNight', 'holyEnd', 'fastStart', 'fastStartEve', 'fastEnd'].includes(z.key) ? ' special' : '');
    li.dataset.z = z.key + z.part;
    li.innerHTML = `
      <button type="button" aria-expanded="false">
        <span class="z-name">${esc(z.tr)}<small>${esc(z.en)}</small></span>
        <span class="z-he he" lang="he">${z.he}</span>
        <span class="z-time">${fmt(z.t)}</span>
      </button>
      <p class="z-why">${esc(z.why)}</p>`;
    li.querySelector('button').addEventListener('click', (e) => {
      const open = li.classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', open);
    });
    ol.appendChild(li);
  }
}

function renderMoon(now) {
  const hd = jd.info.hd;
  const m = MONTH_NUM[hd.month];
  const cur = molad(m, hd.year);
  const [nm, ny] = nextMonth(m, hd.year);
  const nxt = molad(nm, ny);
  const kl = kiddushLevanah(m, hd.year);
  let kls;
  if (now < kl.start) kls = `Kiddush Levanah from ${fmtDay(kl.start)}, ${fmt(kl.start)}`;
  else if (now < kl.end) kls = `<b>Kiddush Levanah can be said now</b>, until ${fmtDay(kl.end)}, ${fmt(kl.end)}`;
  else kls = `Kiddush Levanah has passed for ${hd.month}`;
  const showNext = hd.day >= 20;
  const mm = showNext ? nxt : cur;
  $('moon').innerHTML = `
    <h2>The moon</h2>
    <div class="moon-row">
      <div class="moon-big" aria-hidden="true">${moonGlyph(hd.day)}</div>
      <div>
        <div class="moon-line"><span class="muted">Molad ${esc(mm.month)}</span> ${moladText(mm)}</div>
        <div class="fine tight">Jerusalem time. Your time: ${fmtDay(mm.utc)}, ${fmt(mm.utc)}</div>
        <div class="moon-line">${kls}</div>
      </div>
    </div>
    <p class="fine">Kiddush Levanah from 7 days after the molad (Chabad custom) until the middle of the month.</p>`;
}

function renderMonth() {
  const hd = jd.info.hd;
  const l = monthLore(hd.month);
  if (!l) { $('month').hidden = true; return; }
  $('month').hidden = false;
  $('month').innerHTML = `
    <h2>The month of ${hd.month}</h2>
    <dl class="lore">
      <div><dt>Tribe</dt><dd>${l.tribe}</dd></div>
      <div><dt>Mazal</dt><dd>${l.mazal}<small>${l.mazalEn}</small></dd></div>
      <div><dt>Letter</dt><dd class="he big">${l.letter}</dd></div>
      <div><dt>Sense</dt><dd>${l.sense}</dd></div>
      <div><dt>Stone</dt><dd>${l.stone}<small>on the choshen</small></dd></div>
    </dl>
    <p class="fine">Sefer Yetzirah gives each of the twelve months a letter, a sense and a mazal. The Arizal pairs each with a tribe.</p>`;
}

function renderUpcoming() {
  const israel = isIsrael(loc);
  const seen = new Set();
  const items = [];
  for (let i = 1; i <= 60 && items.length < 5; i++) {
    const d = addDays(jd.day.date, i);
    const inf = dayInfo(d, israel);
    for (const h of inf.hols) {
      const k = h.key === 'chm' ? h.name : h.key;
      if (seen.has(k) || h.kind === 'erev') continue;
      seen.add(k);
      items.push({ i, h, inf });
    }
  }
  $('upcoming').innerHTML = `<h2>Coming up</h2><ul class="upcoming">${items
    .map(({ i, h, inf }) => {
      const civ = new Date(Date.UTC(inf.date.y, inf.date.m - 1, inf.date.d, 12));
      const civTxt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(civ);
      return `<li><span class="dot k-${h.kind}"></span><span class="u-name">${esc(h.name.replace(/ · \d+\w+ light/, ''))}<small>${inf.hd.day} ${inf.hd.month} · ${civTxt}</small></span><span class="u-when">${i === 1 ? 'tomorrow' : `in ${i} days`}</span></li>`;
    })
    .join('')}</ul><p class="fine">Days start the evening before.</p>`;
}

// ---------- Tick (every second) ----------
function tick() {
  const now = Date.now();
  if (!jd || builtFor !== locKey() || now >= jd.end || now < jd.start) rebuild(now);
  paintSky(now, loc, wx?.clouds ?? null);
  if (jd.polar) return;

  const h = hourOf(now, jd);
  const next = jd.list.find((z) => z.t > now);
  const nextKey = next ? next.key + next.part : '';
  updateDial($('dial'), now, jd, h, nextKey);

  const twilight = !h.isDay && jd.eve.tzeis && now < jd.eve.tzeis;
  $('cPeriod').textContent = h.isDay ? 'Day · יום' : twilight ? 'Twilight' : 'Night · לילה';
  $('cHour').textContent = gematria(h.hour);
  $('cHourLabel').textContent = `${ordinal(h.hour)} hour · ${h.minutes} min`;
  $('cCivil').textContent = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: loc.tz }).format(now);

  if (next) {
    $('next').innerHTML = `<span class="next-label">Next</span>
      <span class="next-name">${esc(next.tr)} <span class="he" lang="he">${next.he}</span></span>
      <span class="next-when"><b>${until(next.t - now)}</b> · ${fmt(next.t)}</span>`;
  }
  document.querySelectorAll('#zmanim .z').forEach((li) => {
    const z = jd.list.find((x) => x.key + x.part === li.dataset.z);
    if (!z) return;
    li.classList.toggle('past', z.t <= now);
    li.classList.toggle('next', li.dataset.z === nextKey);
  });
  if ($('hourDlg').open && openHour) renderHour(openHour, now);
  if (now - wxAt > 20 * 60000 || wxFor !== locKey()) refreshWeather();
}

// ---------- Weather ----------
async function refreshWeather() {
  wxAt = Date.now();
  wxFor = locKey();
  wx = await weather(loc);
  const el = $('wx');
  if (!wx) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = `${wx.icon} ${wx.temp}${wx.unit}`;
  el.title = wx.label;
}

// ---------- Hour detail ----------
let openHour = null;
function hourBounds({ isDay, hour }) {
  const start = isDay ? jd.day.netz + (hour - 1) * jd.day.hour : jd.night.start + (hour - 1) * jd.night.hour;
  return [start, start + (isDay ? jd.day.hour : jd.night.hour)];
}
function renderHour(sel, now) {
  const [a, b] = hourBounds(sel);
  const p = planetOf(jd.info.wd, sel.isDay, sel.hour);
  const zs = jd.list.filter((z) => z.t >= a && z.t < b);
  const isNow = now >= a && now < b;
  $('hourBody').innerHTML = `
    <div class="hour-head">
      <div class="hour-letter he" lang="he">${gematria(sel.hour)}</div>
      <div><div class="hour-title">${ordinal(sel.hour)} hour of the ${sel.isDay ? 'day' : 'night'}</div>
      <div class="muted">${fmt(a)} – ${fmt(b)} · ${Math.round((b - a) / 60000)} min</div>
      ${isNow ? `<div class="now-pill">Now · ${Math.round((b - now) / 60000)} min left</div>` : ''}</div>
    </div>
    <div class="hour-sec">
      <div class="lbl">Ruling planet</div>
      <div><b>${p.tr}</b> <span class="he" lang="he">${p.he}</span> <span class="muted">· ${p.en}</span></div>
      <p class="fine tight">Shabbos 156a: one born under ${p.tr}: ${p.trait} The Gemara concludes that Israel is not bound by the mazalos (<bdi lang="he">אין מזל לישראל</bdi>).</p>
    </div>
    ${zs.length ? `<div class="hour-sec"><div class="lbl">Zmanim in this hour</div>${zs.map((z) => `<div class="hz"><span>${esc(z.tr)}</span><b>${fmt(z.t)}</b></div>`).join('')}</div>` : ''}`;
}
function showHour(sel) {
  openHour = sel;
  renderHour(sel, Date.now());
  $('hourDlg').showModal();
}

// ---------- Location ----------
async function setLoc(l, { silent = false } = {}) {
  loc = l;
  store.set('loc', l);
  if (!silent) $('locDlg').close();
  $('geoBanner').hidden = true;
  tick();
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
    const local = CITIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
    renderCityButtons(list, local);
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
    // Already allowed: follow the user quietly when they've moved.
    try {
      const p = await geolocate();
      if (!loc.geo || distanceKm(p, loc) > 3) await setLoc({ ...p, name: await placeName(p), geo: true }, { silent: true });
    } catch {}
  } else if (!store.get('loc') && perm !== 'denied' && navigator.geolocation) {
    $('geoBanner').hidden = false;
  }
}

// ---------- Settings ----------
function initSettings() {
  $('setBtn').addEventListener('click', () => {
    $('optMA').checked = prefs.ma;
    $('optCandles').value = prefs.candles;
    $('setDlg').showModal();
  });
  $('setClose').addEventListener('click', () => $('setDlg').close());
  $('optMA').addEventListener('change', (e) => { prefs.ma = e.target.checked; store.set('prefs', prefs); tick(); });
  $('optCandles').addEventListener('change', (e) => { prefs.candles = e.target.value; store.set('prefs', prefs); tick(); });
}

// ---------- Start ----------
initLocation();
initSettings();
$('dial').addEventListener('click', (e) => {
  const seg = e.target.closest('[data-seg]');
  if (seg) showHour({ isDay: seg.dataset.seg[0] === 'd', hour: +seg.dataset.seg.slice(1) + 1 });
});
$('centerBtn').addEventListener('click', () => { if (jd && !jd.polar) showHour(hourOf(Date.now(), jd)); });
$('hourClose').addEventListener('click', () => $('hourDlg').close());
for (const d of document.querySelectorAll('dialog')) d.addEventListener('click', (e) => { if (e.target === d) d.close(); });

tick();
setInterval(tick, 1000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && tick());
locationOnLoad();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
