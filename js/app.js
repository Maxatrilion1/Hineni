import { jewishDay, hourOf, civilDate, weekday, SHITAH } from './zmanim.js';
import { hebrewDate, gematria, WEEKDAYS, monthLore, moonPhase } from './hebrew.js';
import { buildDial, updateDial } from './dial.js';

const CITIES = [
  { name: 'Crown Heights', lat: 40.6694, lon: -73.9422, tz: 'America/New_York' },
  { name: 'Jerusalem', lat: 31.7683, lon: 35.2137, tz: 'Asia/Jerusalem' },
  { name: 'Tel Aviv', lat: 32.0853, lon: 34.7818, tz: 'Asia/Jerusalem' },
  { name: 'Kfar Chabad', lat: 31.9897, lon: 34.8519, tz: 'Asia/Jerusalem' },
  { name: 'Manhattan', lat: 40.7831, lon: -73.9712, tz: 'America/New_York' },
  { name: 'Miami', lat: 25.7617, lon: -80.1918, tz: 'America/New_York' },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  { name: 'Montreal', lat: 45.5017, lon: -73.5673, tz: 'America/Toronto' },
  { name: 'London', lat: 51.5072, lon: -0.1276, tz: 'Europe/London' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  { name: 'Antwerp', lat: 51.2194, lon: 4.4025, tz: 'Europe/Brussels' },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg' },
  { name: 'Melbourne', lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo' },
];

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('hineni.' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('hineni.' + k, JSON.stringify(v)); } catch {} },
};

let loc = store.get('loc') || CITIES[0];
let jd = null;
let builtFor = '';
const $ = (id) => document.getElementById(id);

const timeFmt = () => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: loc.tz });
const fmt = (t) => timeFmt().format(new Date(t));

function until(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 1) return 'now';
  if (m < 60) return `in ${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return `in ${h}h ${r ? r + 'm' : ''}`.trim();
}

const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

function moonGlyph(day) {
  return ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][Math.round(moonPhase(day) * 8) % 8];
}

function rebuild(now) {
  jd = jewishDay(now, loc);
  builtFor = loc.name + loc.lat + loc.lon;
  $('locName').textContent = loc.name;
  if (jd.polar) {
    $('next').innerHTML = `<p>The sun doesn't rise or set here today, so sha'os zmaniyos can't be calculated. Polar zmanim need a rav's guidance.</p>`;
    return;
  }
  buildDial($('dial'), jd, loc.tz);
  renderDate(now);
  renderMonth();
  renderZmanimList();
  $('hourLen').textContent =
    `Today a daytime hour is ${Math.round(jd.day.hour / 60000)} min, a night hour ${Math.round(jd.night.hour / 60000)} min. ` +
    `Shitah: ${SHITAH.name}, hours from sunrise to sunset.`;
}

function renderDate(now) {
  const hd = hebrewDate(jd.day.date);
  const wd = WEEKDAYS[weekday(jd.day.date)];
  const civilWd = WEEKDAYS[weekday(civilDate(now, loc.tz))];
  const afterSunset = now >= jd.start && now < jd.day.netz && civilWd !== wd;
  const wdNum = weekday(jd.day.date);
  let shabbos = '';
  if (wdNum === 5 && jd.day.candles) shabbos = `Erev Shabbos · candles ${fmt(jd.day.candles)}`;
  else if (wdNum === 6) shabbos = `Shabbos ends ${fmt(jd.day.tzeis ?? jd.day.shkiah)} (nightfall)`;
  else shabbos = `Shabbos in ${6 - wdNum} days`;
  $('date').innerHTML = `
    <div class="date-row">
      <div><div class="date-en">${hd.en}</div><div class="date-wd">${wd.tr} · ${wd.en}</div></div>
      <div class="date-he he" lang="he" dir="rtl">${hd.he}<div class="date-wd he">${wd.he}</div></div>
    </div>
    <div class="date-meta">
      <span>${moonGlyph(hd.day)} ${ordinal(hd.day)} of the month</span>
      <span>${shabbos}</span>
    </div>
    ${afterSunset ? `<p class="fine">The Jewish day began at sunset, so it's already ${wd.en} by Jewish reckoning.</p>` : ''}`;
}

function renderMonth() {
  const hd = hebrewDate(jd.day.date);
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

function renderZmanimList() {
  const ol = $('zmanim');
  ol.replaceChildren();
  let lastPart = '';
  for (const z of jd.list) {
    if (z.part !== lastPart) {
      const h = document.createElement('li');
      h.className = 'part';
      h.textContent = z.part === 'eve' ? 'Night' : 'Day';
      ol.appendChild(h);
      lastPart = z.part;
    }
    const li = document.createElement('li');
    li.className = 'z';
    li.dataset.z = z.key + z.part;
    li.innerHTML = `
      <button type="button" aria-expanded="false">
        <span class="z-name">${z.tr}<small>${z.en}</small></span>
        <span class="z-he he" lang="he">${z.he}</span>
        <span class="z-time">${fmt(z.t)}</span>
      </button>
      <p class="z-why">${z.why}</p>`;
    li.querySelector('button').addEventListener('click', (e) => {
      const open = li.classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', open);
    });
    ol.appendChild(li);
  }
}

function tick() {
  const now = Date.now();
  if (!jd || builtFor !== loc.name + loc.lat + loc.lon || now >= jd.end || now < jd.start) rebuild(now);
  if (jd.polar) return;

  const h = hourOf(now, jd);
  const next = jd.list.find((z) => z.t > now);
  const nextKey = next ? next.key + next.part : '';
  updateDial($('dial'), now, jd, h, nextKey);

  const twilight = !h.isDay && jd.eve.tzeis && now < jd.eve.tzeis;
  document.body.classList.toggle('day', h.isDay);
  document.body.classList.toggle('night', !h.isDay);
  $('cPeriod').textContent = h.isDay ? 'Day · יום' : twilight ? 'Twilight · בין השמשות' : 'Night · לילה';
  $('cHour').textContent = gematria(h.hour);
  $('cHourLabel').textContent = `${ordinal(h.hour)} hour · ${h.minutes} min`;
  $('cCivil').textContent = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: loc.tz }).format(now);

  if (next) {
    $('next').innerHTML = `<span class="next-label">Next</span>
      <span class="next-name">${next.tr} <span class="he" lang="he">${next.he}</span></span>
      <span class="next-when"><b>${until(next.t - now)}</b> · ${fmt(next.t)}</span>`;
  }
  document.querySelectorAll('#zmanim .z').forEach((li) => {
    const z = jd.list.find((x) => x.key + x.part === li.dataset.z);
    li.classList.toggle('past', z.t <= now);
    li.classList.toggle('next', li.dataset.z === nextKey);
  });
}

// Location picker
function setLoc(l) {
  loc = l;
  store.set('loc', l);
  $('locDlg').close();
  tick();
}

function initLocation() {
  const list = $('cityList');
  for (const c of CITIES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = c.name;
    b.addEventListener('click', () => setLoc(c));
    list.appendChild(b);
  }
  $('locBtn').addEventListener('click', () => $('locDlg').showModal());
  $('locClose').addEventListener('click', () => $('locDlg').close());
  $('useGeo').addEventListener('click', () => {
    const msg = $('geoMsg');
    if (!navigator.geolocation) { msg.textContent = 'Location is not available in this browser.'; return; }
    msg.textContent = 'Finding you…';
    navigator.geolocation.getCurrentPosition(
      (p) => {
        msg.textContent = '';
        setLoc({
          name: 'My location',
          lat: +p.coords.latitude.toFixed(4),
          lon: +p.coords.longitude.toFixed(4),
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      },
      () => { msg.textContent = "Couldn't get your location. Pick a city instead."; },
      { timeout: 10000, maximumAge: 3600000 }
    );
  });
}

initLocation();
tick();
setInterval(tick, 1000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && tick());

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
