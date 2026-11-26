import { jewishDay, hourOf, civilDate, weekday, addDays, dayInfo, SHITAH } from './zmanim.js';
import { hebrewDate, gematria, WEEKDAYS, monthLore, moonPhase } from './hebrew.js';
import { MONTH_NUM, isLeap, molad, moladText, nextMonth, kiddushLevanah, omerDay, omerSefirah, planetOf } from './calendar.js';
import { TRIBES, CAMPS, DAYS, hourMonth, towardJerusalem, compassWord } from './lore.js';
import { buildDial, updateDial } from './dial.js';
import { paintSky } from './sky.js';
import { NEW_YORK, CITIES, isIsrael, candleMinutes, geolocate, geoPermission, placeName, searchPlaces, distanceKm } from './places.js';

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('hineni.' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('hineni.' + k, JSON.stringify(v)); } catch {} },
};

let loc = store.get('loc') || NEW_YORK;
let prefs = { ma: false, candles: 'auto', ...(store.get('prefs') || {}) };
let jd = null, builtFor = '', yr = null, sheetFn = null;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const opts = () => ({ israel: isIsrael(loc), ma: prefs.ma, candleMin: prefs.candles === 'auto' ? candleMinutes(loc) : +prefs.candles });
const locKey = () => [loc.lat, loc.lon, prefs.ma, prefs.candles].join('|');
const fmt = (t) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: loc.tz }).format(new Date(t));
const fmtDay = (t) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: loc.tz }).format(new Date(t));
const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const pct = (x) => `${(Math.max(0, Math.min(1, x)) * 100).toFixed(2)}%`;

function until(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 1) return 'now';
  if (m < 60) return `in ${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return `in ${h}h${r ? ' ' + r + 'm' : ''}`;
}
const moonGlyph = (day) => ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][Math.round(moonPhase(day) * 8) % 8];

/** A moment as Jewish time: hours and zmani minutes since sunrise (day) or sunset (night). */
function jewishTime(t) {
  let base, len, part;
  if (t < jd.day.netz) [base, len, part] = [jd.night.start, jd.night.hour, 'night'];
  else if (t <= jd.day.shkiah) [base, len, part] = [jd.day.netz, jd.day.hour, "day"];
  else [base, len, part] = [jd.day.shkiah, jd.night.hour, 'night'];
  const h = (t - base) / len;
  let H = Math.floor(h), M = Math.round((h - H) * 60);
  if (M === 60) { H += 1; M = 0; }
  return { text: `${H}:${String(M).padStart(2, '0')}`, part };
}

function hourTribe(h) {
  const m = hourMonth(h);
  const lore = monthLore(m.month);
  return { ...m, lore, tribe: lore.tribe, t: TRIBES[lore.tribe] };
}

// ---------- Year (cached per Hebrew year) ----------
function yearInfo(date, hd) {
  if (yr && yr.year === hd.year) return yr;
  let rh = date;
  for (let k = 0; k < 400; k++) {
    const d = addDays(date, -k), h = hebrewDate(d);
    if (h.month === 'Tishrei' && h.day === 1) { rh = d; break; }
  }
  let len = 354;
  for (const L of [353, 354, 355, 383, 384, 385]) {
    const h = hebrewDate(addDays(rh, L));
    if (h.month === 'Tishrei' && h.day === 1) { len = L; break; }
  }
  yr = { year: hd.year, rh, len };
  return yr;
}
const dayIndex = (a, b) => Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
function monthLength(date, hd) {
  const h = hebrewDate(addDays(date, 30 - hd.day));
  return h.day === 30 ? 30 : 29;
}

// ---------- Build (once per Jewish day / location change) ----------
function rebuild(now) {
  jd = jewishDay(now, loc, opts());
  builtFor = locKey();
  $('locName').textContent = loc.name;
  if (jd.polar) {
    $('stack').innerHTML = `<p>The sun doesn't rise or set here today, so the hours can't be calculated. Polar zmanim need a rav's guidance.</p>`;
    return;
  }
  buildDial($('dial'), jd, loc.tz);
  renderChips();
  renderZmanimList();
  renderUpcoming();
  const o = opts();
  $('hourLen').textContent =
    `Today a daytime hour is ${Math.round(jd.day.hour / 60000)} min and a night hour ${Math.round(jd.night.hour / 60000)} min. ` +
    `Shitah: ${SHITAH.name}${o.ma ? ', with Magen Avraham times' : ''}. Candles ${o.candleMin} min before sunset${o.israel ? '; Israel: one day of Yom Tov' : ''}.`;
}

function renderChips() {
  const { hd, hols } = jd.info;
  const omer = omerDay(hd);
  const chips = hols.map((h) => `<span class="chip k-${h.kind}">${esc(h.name)}</span>`);
  if (omer) chips.push(`<span class="chip">Omer: day ${omer} · ${omerSefirah(omer).tr}</span>`);
  $('chips').innerHTML = chips.join('');
  $('chips').hidden = !chips.length;
}

// ---------- The time stack: hour → day → week → month → year → shemitah → world ----------
function renderStack(now, h) {
  const { hd, wd } = jd.info;
  const ht = hourTribe(h.hour);
  const dayFrac = (now - jd.start) / (jd.end - jd.start);
  const mLen = monthLength(jd.day.date, hd);
  const y = yearInfo(jd.day.date, hd);
  const dayOfYear = dayIndex(y.rh, jd.day.date) + 1;
  const shem = hd.year % 7 || 7;
  const cyc = ((hd.year - 1) % 19) + 1;
  const toShabbos = 6 - wd;
  const week = DAYS.map((d, i) => `<span class="wk${i < wd ? ' done' : ''}${i === wd ? ' now' : ''}">${i === 6 ? 'ש' : gematria(i + 1).replace(/[׳״]/g, '')}</span>`).join('');
  const shemDots = Array.from({ length: 7 }, (_, i) => `<span class="wk${i + 1 < shem ? ' done' : ''}${i + 1 === shem ? ' now' : ''}">${i === 6 ? 'ש' : i + 1}</span>`).join('');

  const rows = [
    { key: 'hour', label: 'Hour', main: `${ordinal(h.hour)} hour of the ${h.isDay ? 'day' : 'night'}`, sub: `${ht.t.emoji} ${ht.tribe} · ${ht.month}`, bar: (h.fraction * 12) % 1 },
    { key: 'day', label: 'Day', main: `${WEEKDAYS[wd].tr}`, sub: `${WEEKDAYS[wd].he} · ${DAYS[wd].creation}`, bar: dayFrac },
    { key: 'week', label: 'Week', main: wd === 6 ? 'Shabbos Kodesh' : `${ordinal(wd + 1)} day of the week`, sub: wd === 6 ? 'The seventh day' : toShabbos === 1 ? 'Shabbos tomorrow' : `Shabbos in ${toShabbos} days`, dots: week },
    { key: 'month', label: 'Month', main: `${hd.day} ${hd.month}`, sub: `${moonGlyph(hd.day)} Day ${hd.day} of ${mLen} · month of ${monthLore(hd.month)?.tribe ?? ''}`, bar: (hd.day - 1 + dayFrac) / mLen },
    { key: 'year', label: 'Year', main: `${hd.year} · ${gematria(hd.year % 1000)}`, sub: `Day ${dayOfYear} of ${y.len}${isLeap(hd.year) ? ' · leap year' : ''}`, bar: (dayOfYear - 1 + dayFrac) / y.len },
    { key: 'shemitah', label: 'Shemitah', main: shem === 7 ? 'Shemitah year' : `Year ${shem} of 7`, sub: `Year ${cyc} of the 19-year cycle`, dots: shemDots },
    { key: 'world', label: 'World', main: `Year ${hd.year.toLocaleString()} of 6,000`, sub: cosmic(hd.year).short, bar: hd.year / 6000 },
  ];
  $('stack').innerHTML = rows
    .map((r) => `<button type="button" class="row" data-row="${r.key}">
      <span class="row-label">${r.label}</span>
      <span class="row-text"><b>${esc(r.main)}</b><small>${esc(r.sub)}</small></span>
      ${r.dots ? `<span class="dots-row he" lang="he">${r.dots}</span>` : `<span class="bar"><i style="width:${pct(r.bar)}"></i></span>`}
    </button>`)
    .join('');
}

/** Sanhedrin 97a: six thousand years, as six days of a cosmic week. */
function cosmic(year) {
  const mil = Math.floor(year / 1000); // 0-based
  const frac = (year % 1000) / 1000;
  const dayName = WEEKDAYS[mil].en;
  const sha = frac * 24;
  const isDay = sha >= 12;
  const hour = Math.floor(isDay ? sha - 12 : sha) + 1;
  return { mil: mil + 1, dayName, hour, isDay, short: `${dayName === 'Friday' ? 'Erev Shabbos' : dayName}, the ${ordinal(hour)} hour of the ${isDay ? 'day' : 'night'}` };
}

// ---------- Space ----------
let heading = null;
function renderSpace() {
  const j = towardJerusalem(loc);
  const mi = Math.round(j.km * 0.621371);
  const h = hourOf(Date.now(), jd);
  const hourTr = hourTribe(h.hour).tribe;
  const monthTr = monthLore(jd.info.hd.month)?.tribe;
  const arrowRot = heading == null ? j.bearing : j.bearing - heading;
  $('space').innerHTML = `
    <div class="space-row">
      <svg class="compass" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" class="c-ring"/>
        ${heading == null ? '<text x="50" y="13" class="c-n">N</text>' : ''}
        <g transform="rotate(${arrowRot.toFixed(1)} 50 50)"><path d="M50 14 L58 50 L50 44 L42 50 Z" class="c-arrow"/><circle cx="50" cy="50" r="3" class="c-arrow"/></g>
      </svg>
      <div>
        <div class="space-place">${esc(loc.name)}</div>
        <div class="space-line">Yerushalayim is <b>${mi.toLocaleString()} mi</b> away, to the ${compassWord(j.bearing)} (${Math.round(j.bearing)}°). Face this way to daven.</div>
        <button id="compassBtn" class="btn ghost small" type="button">${heading == null ? 'Point with my phone' : 'Pointing live'}</button>
      </div>
    </div>
    ${campSvg(hourTr, monthTr)}
    <p class="fine">The camp in the desert (Bamidbar 2): three tribes on each side of the Mishkan. Gold is the tribe of this hour (${hourTr}); outlined is the tribe of this month (${monthTr}).</p>`;
  $('compassBtn').addEventListener('click', startCompass);
}

function campSvg(hourTr, monthTr) {
  // North up, east right. The Mishkan's entrance faced east, where Yehudah camped.
  const slots = {
    north: (i) => [22 + i * 28, 10, 26], south: (i) => [22 + i * 28, 90, 26],
    east: (i) => [112, 28 + i * 22, 30], west: (i) => [-12, 28 + i * 22, 30],
  };
  let out = '';
  for (const [side, tribes] of Object.entries(CAMPS)) {
    tribes.forEach((t, i) => {
      const [x, y, w] = slots[side](i);
      const cls = t === hourTr ? 'camp-t hour' : t === monthTr ? 'camp-t month' : 'camp-t';
      out += `<g class="${cls}"><rect x="${x - w / 2}" y="${y - 6.5}" width="${w}" height="13" rx="3"/><text x="${x}" y="${y + 0.5}">${TRIBES[t].he}</text></g>`;
    });
  }
  return `<svg class="camp" viewBox="-52 -12 204 124" role="img" aria-label="The tribes camped around the Mishkan">
    <text x="50" y="-6" class="camp-dir">North</text><text x="50" y="106" class="camp-dir">South</text>
    <text x="140" y="50" class="camp-dir">East</text><text x="-40" y="50" class="camp-dir">West</text>
    <rect x="30" y="28" width="40" height="44" rx="2" class="mishkan"/><text x="50" y="47" class="camp-m">משכן</text><text x="50" y="58" class="camp-l">לוי</text>
    ${out}</svg>`;
}

async function startCompass() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') throw new Error('denied');
    }
    const on = (e) => {
      const hd = e.webkitCompassHeading ?? (e.absolute && e.alpha != null ? 360 - e.alpha : null);
      if (hd == null) return;
      heading = hd;
      const svg = document.querySelector('.compass g');
      if (svg) svg.setAttribute('transform', `rotate(${(towardJerusalem(loc).bearing - heading).toFixed(1)} 50 50)`);
    };
    window.addEventListener('deviceorientationabsolute', on);
    window.addEventListener('deviceorientation', on);
    setTimeout(() => { if (heading == null) $('compassBtn').textContent = 'No compass on this device'; }, 2500);
  } catch {
    $('compassBtn').textContent = 'Compass not available';
  }
}

// ---------- Sheets ----------
function openSheet(title, fn) {
  sheetFn = fn;
  $('sheetTitle').textContent = title;
  $('sheetBody').innerHTML = fn(Date.now());
  if (!$('sheet').open) $('sheet').showModal();
  $('sheetBody').scrollTop = 0;
}
const sec = (label, body) => `<div class="hour-sec"><div class="lbl">${label}</div>${body}</div>`;

function hourSheet(sel) {
  return (now) => {
    const len = sel.isDay ? jd.day.hour : jd.night.hour;
    const a = (sel.isDay ? jd.day.netz : jd.night.start) + (sel.hour - 1) * len, b = a + len;
    const ht = hourTribe(sel.hour), T = ht.t, L = ht.lore;
    const p = planetOf(jd.info.wd, sel.isDay, sel.hour);
    const zs = jd.list.filter((z) => z.t >= a && z.t < b);
    const isNow = now >= a && now < b;
    const swatch = `<span class="swatch">${T.flag.map((c) => `<i style="background:${c}"></i>`).join('')}</span>`;
    return `
      <div class="hour-head">
        <div class="badge-lg" aria-hidden="true">${T.emoji}</div>
        <div><div class="hour-title">${ordinal(sel.hour)} hour of the ${sel.isDay ? 'day' : 'night'} <span class="he" lang="he">· ${gematria(sel.hour)}</span></div>
        <div class="muted">${sel.hour - 1}:00–${sel.hour}:00 of the ${sel.isDay ? 'day' : 'night'} · ${fmt(a)}–${fmt(b)}</div>
        ${isNow ? `<div class="now-pill">Now · ${Math.round((b - now) / 60000)} min left</div>` : ''}</div>
      </div>
      ${sec('The tribe of this hour', `
        <div class="tribe-name"><b>${ht.tribe}</b> <span class="he" lang="he">${T.he}</span></div>
        <p class="lore-p">${esc(T.about)}</p>
        <div class="kv"><span>Emblem</span><b>${T.emoji} ${esc(T.emblem)}</b></div>
        <div class="kv"><span>Flag</span><b>${swatch} ${esc(T.flagText)}</b></div>
        <div class="kv"><span>Blessing</span><b><span class="he" lang="he">${T.blessing.he}</span><small>${esc(T.blessing.en)} · ${T.blessing.ref}</small></b></div>
        <div class="kv"><span>Name</span><b>${esc(T.name)}</b></div>
        <div class="kv"><span>Mother</span><b>${T.mother}</b></div>
        <div class="kv"><span>Camp</span><b>${T.camp[0].toUpperCase() + T.camp.slice(1)} of the Mishkan</b></div>
        <div class="kv"><span>Stone</span><b>${L.stone}, on the choshen</b></div>`)}
      ${sec('The month of this hour', `
        <div class="kv"><span>Month</span><b>${ht.month} <span class="he" lang="he">${ht.monthHe}</span></b></div>
        <div class="kv"><span>Letter</span><b class="he big" lang="he">${L.letter}</b></div>
        <div class="kv"><span>Sense</span><b>${L.sense}</b></div>
        <div class="kv"><span>Mazal</span><b>${L.mazal} · ${L.mazalEn}</b></div>`)}
      ${sec('Ruling planet', `<div><b>${p.tr}</b> <span class="he" lang="he">${p.he}</span> <span class="muted">· ${p.en}</span></div>
        <p class="fine tight">Shabbos 156a: one born under ${p.tr}: ${p.trait} The Gemara concludes that Israel is not bound by the mazalos (<bdi lang="he">אין מזל לישראל</bdi>).</p>`)}
      ${zs.length ? sec('Zmanim in this hour', zs.map((z) => `<div class="hz"><span>${esc(z.tr)}</span><b>${jewishTime(z.t).text} · ${fmt(z.t)}</b></div>`).join('')) : ''}
      <p class="fine">The twelve hours follow the twelve months: the first hour is Nisan's, the second Iyar's, and so on, as the Arizal ties both to the same twelve permutations of Hashem's Name. Hineni repeats the cycle at night. Tribes and months: Arizal; emblems and colors: Bamidbar Rabbah 2:7.</p>`;
  };
}

function daySheet() {
  const { wd } = jd.info, D = DAYS[wd], W = WEEKDAYS[wd];
  const p = planetOf(wd, true, 1);
  const week = DAYS.map((d, i) => `<div class="wkrow${i === wd ? ' now' : ''}"><span class="he" lang="he">${WEEKDAYS[i].he}</span><span>${d.creation}</span><span class="muted">${d.sefirah}</span></div>`).join('');
  return `
    <div class="hour-head"><div class="badge-lg he" lang="he">${wd === 6 ? 'ש' : gematria(wd + 1).replace(/[׳״]/g, '')}</div>
      <div><div class="hour-title">${W.tr}</div><div class="muted">${wd === 6 ? 'The seventh day' : `The ${ordinal(wd + 1)} day`} · ${W.en} · began at sunset</div></div></div>
    ${sec('Created on this day', `<div><b>${D.creation}</b> <span class="he" lang="he">· ${D.creationHe}</span></div><p class="fine tight">Bereishis 1–2. The days have no names in Hebrew: each is counted toward Shabbos.</p>`)}
    ${sec('Song of the day', `<div><b>Tehillim ${D.shir}</b> <span class="he" lang="he">· ${D.shirHe}</span></div><p class="fine tight">Sung by the Levi\'im in the Beis Hamikdash (Tamid 7:4), and said after Shacharis.</p>`)}
    ${sec('Sefirah and guest', `<div class="kv"><span>Sefirah</span><b>${D.sefirah} <span class="he" lang="he">${D.sefirahHe}</span></b></div><div class="kv"><span>Ushpiz</span><b>${D.ushpiz}</b></div><div class="kv"><span>Day's planet</span><b>${p.tr} · ${p.en}</b></div>`)}
    ${sec('The week', week)}`;
}

function monthSheet(now) {
  const hd = jd.info.hd, L = monthLore(hd.month), T = TRIBES[L.tribe];
  const m = MONTH_NUM[hd.month];
  const cur = molad(m, hd.year);
  const [nm, ny] = nextMonth(m, hd.year);
  const nxt = molad(nm, ny);
  const kl = kiddushLevanah(m, hd.year);
  let kls;
  if (now < kl.start) kls = `From ${fmtDay(kl.start)}, ${fmt(kl.start)} until ${fmtDay(kl.end)}`;
  else if (now < kl.end) kls = `<b>Can be said now</b>, until ${fmtDay(kl.end)}, ${fmt(kl.end)}`;
  else kls = `Has passed for ${hd.month}`;
  return `
    <div class="hour-head"><div class="badge-lg" aria-hidden="true">${moonGlyph(hd.day)}</div>
      <div><div class="hour-title">${hd.month} <span class="he" lang="he">${hebrewDate(jd.day.date).he.split(' ').slice(1, -1).join(' ')}</span></div><div class="muted">Day ${hd.day} of ${monthLength(jd.day.date, hd)}</div></div></div>
    ${sec('The tribe of this month', `<div class="tribe-name"><b>${T.emoji} ${L.tribe}</b> <span class="he" lang="he">${T.he}</span></div><p class="lore-p">${esc(T.about)}</p>`)}
    ${sec('Sefer Yetzirah', `<div class="kv"><span>Letter</span><b class="he big" lang="he">${L.letter}</b></div><div class="kv"><span>Sense</span><b>${L.sense}</b></div><div class="kv"><span>Mazal</span><b>${L.mazal} · ${L.mazalEn}</b></div><div class="kv"><span>Stone</span><b>${L.stone}</b></div>`)}
    ${sec('The moon', `<div class="kv"><span>Molad ${esc(cur.month)}</span><b>${moladText(cur)}<small>Jerusalem time · ${fmtDay(cur.utc)}, ${fmt(cur.utc)} your time</small></b></div>
      <div class="kv"><span>Molad ${esc(nxt.month)}</span><b>${moladText(nxt)}<small>${fmtDay(nxt.utc)}, ${fmt(nxt.utc)} your time</small></b></div>
      <div class="kv"><span>Kiddush Levanah</span><b>${kls}<small>From 7 days after the molad (Chabad custom) to mid-month</small></b></div>`)}`;
}

function yearSheet() {
  const hd = jd.info.hd, y = yearInfo(jd.day.date, hd);
  const shem = hd.year % 7 || 7, cyc = ((hd.year - 1) % 19) + 1;
  const maaser = shem === 7 ? 'None: the land rests' : [3, 6].includes(shem) ? "Ma'aser ani (for the poor)" : "Ma'aser sheni (eaten in Yerushalayim)";
  const leaps = [3, 6, 8, 11, 14, 17, 19];
  const c = cosmic(hd.year);
  return `
    <div class="hour-head"><div class="badge-lg he long" lang="he">${gematria(hd.year % 1000)}</div>
      <div><div class="hour-title">${hd.year} since Creation</div><div class="muted">${y.len} days · ${isLeap(hd.year) ? 'a leap year with two Adars' : 'twelve months'}</div></div></div>
    ${sec('The 19-year cycle', `<div class="dots-row big">${Array.from({ length: 19 }, (_, i) => `<span class="wk${i + 1 < cyc ? ' done' : ''}${i + 1 === cyc ? ' now' : ''}${leaps.includes(i + 1) ? ' leap' : ''}">${i + 1}</span>`).join('')}</div>
      <p class="fine tight">Seven of every nineteen years add a second Adar, keeping Pesach in the spring. Outlined years are leap years. This is year ${cyc}.</p>`)}
    ${sec('Shemitah', `<div class="kv"><span>Cycle</span><b>${shem === 7 ? 'Shemitah: the seventh year' : `Year ${shem} of 7`}</b></div><div class="kv"><span>Next shemitah</span><b>${hd.year + (7 - shem || 7)}</b></div><div class="kv"><span>Tithe this year</span><b>${maaser}</b></div>`)}
    ${sec('The cosmic week', `<p class="lore-p">"The world exists for six thousand years" (Sanhedrin 97a): six millennia like six days, then a Shabbos. We are in the ${ordinal(c.mil)} millennium, the world's ${c.dayName}. Year ${hd.year % 1000} of it falls like the ${ordinal(c.hour)} hour of ${c.isDay ? 'that day' : 'that night'}: ${c.dayName === 'Friday' ? 'Erev Shabbos, preparing for the seventh millennium.' : ''}</p>`)}`;
}

// ---------- Zmanim ----------
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
    const jt = jewishTime(z.t);
    const li = document.createElement('li');
    li.className = 'z' + (['candles', 'candlesNight', 'holyEnd', 'fastStart', 'fastStartEve', 'fastEnd'].includes(z.key) ? ' special' : '');
    li.dataset.z = z.key + z.part;
    li.innerHTML = `
      <button type="button" aria-expanded="false">
        <span class="z-name">${esc(z.tr)}<small><span class="he" lang="he">${z.he}</span> · ${esc(z.en)}</small></span>
        <span class="z-jt">${jt.text}<small>${jt.part}</small></span>
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

function renderUpcoming() {
  const israel = isIsrael(loc);
  const seen = new Set();
  const items = [];
  for (let i = 1; i <= 60 && items.length < 5; i++) {
    const inf = dayInfo(addDays(jd.day.date, i), israel);
    for (const h of inf.hols) {
      const k = h.key === 'chm' ? h.name : h.key;
      if (seen.has(k) || h.kind === 'erev') continue;
      seen.add(k);
      items.push({ i, h, inf });
    }
  }
  const name = (h) => h.name.replace(/ · \d+\w+ light/, '');
  const first = items[0];
  $('upSum').textContent = first ? `${name(first.h)} ${first.i === 1 ? 'tomorrow' : `in ${first.i} days`}` : '';
  $('upcoming').innerHTML = `<ul class="upcoming">${items
    .map(({ i, h, inf }) => {
      const civ = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(inf.date.y, inf.date.m - 1, inf.date.d, 12)));
      return `<li><span class="dot k-${h.kind}"></span><span class="u-name">${esc(name(h))}<small>${inf.hd.day} ${inf.hd.month} · ${civ}</small></span><span class="u-when">${i === 1 ? 'tomorrow' : `in ${i} days`}</span></li>`;
    })
    .join('')}</ul><p class="fine">Days start the evening before.</p>`;
}

// ---------- Tick (every second) ----------
let lastMinute = -1;
function tick() {
  const now = Date.now();
  if (!jd || builtFor !== locKey() || now >= jd.end || now < jd.start) { rebuild(now); lastMinute = -1; }
  paintSky(now, loc);
  if (jd.polar) return;

  const h = hourOf(now, jd);
  const next = jd.list.find((z) => z.t > now);
  updateDial($('dial'), now, jd, h, next ? next.key + next.part : '');

  const ht = hourTribe(h.hour);
  const { hd, wd } = jd.info;
  $('cEyebrow').textContent = `${WEEKDAYS[wd].he} · ${gematria(hd.day)} ${hebrewDate(jd.day.date).he.split(' ').slice(1, -1).join(' ')}`;
  $('cBadge').textContent = ht.t.emoji;
  $('cHour').textContent = `${ordinal(h.hour)} hour`;
  $('cPart').textContent = `of the ${h.isDay ? 'day' : 'night'}`;
  $('cTribe').textContent = `${ht.tribe} · ${ht.month}`;
  $('cCivil').textContent = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: loc.tz }).format(now);
  $('zSum').textContent = next ? `Next: ${next.tr} ${fmt(next.t)}` : '';

  const minute = Math.floor(now / 60000);
  if (minute !== lastMinute) {
    lastMinute = minute;
    renderStack(now, h);
    renderSpace();
    document.querySelectorAll('#zmanim .z').forEach((li) => {
      const z = jd.list.find((x) => x.key + x.part === li.dataset.z);
      if (!z) return;
      li.classList.toggle('past', z.t <= now);
      li.classList.toggle('next', next && li.dataset.z === next.key + next.part);
    });
    if ($('sheet').open && sheetFn) $('sheetBody').innerHTML = sheetFn(now);
  }
}

// ---------- Location ----------
async function setLoc(l, { silent = false } = {}) {
  loc = l;
  store.set('loc', l);
  if (!silent) $('locDlg').close();
  $('geoBanner').hidden = true;
  heading = null;
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
const showHour = (sel) => openSheet('The hour', hourSheet(sel));
$('dial').addEventListener('click', (e) => {
  const t = e.target.closest('[data-seg],[data-band]');
  if (!t) return;
  const id = t.dataset.seg || t.dataset.band;
  showHour({ isDay: id[0] === 'd', hour: +id.slice(1) + 1 });
});
$('centerBtn').addEventListener('click', () => { if (jd && !jd.polar) showHour(hourOf(Date.now(), jd)); });
$('stack').addEventListener('click', (e) => {
  const r = e.target.closest('[data-row]');
  if (!r || !jd) return;
  const k = r.dataset.row;
  if (k === 'hour') showHour(hourOf(Date.now(), jd));
  else if (k === 'day' || k === 'week') openSheet('The day', daySheet);
  else if (k === 'month') openSheet('The month', monthSheet);
  else openSheet('The year', yearSheet);
});
$('sheetClose').addEventListener('click', () => $('sheet').close());
for (const d of document.querySelectorAll('dialog')) d.addEventListener('click', (e) => { if (e.target === d) d.close(); });

tick();
setInterval(tick, 1000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && tick());
locationOnLoad();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
