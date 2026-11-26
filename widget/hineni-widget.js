// Hineni · הִנֵּנִי — home-screen widget for iPhone (runs in the free Scriptable app).
// Shows the day as 24 sha'os zmaniyos, the hour you are in and its tribe, and the Hebrew date.
// Tap the widget to open Hineni.
//
// Setup: install Scriptable from the App Store → tap + → paste this whole file → name it "Hineni".
// Then long-press the home screen → + → Scriptable → pick a size → tap the widget → Script: Hineni.

const SITE = 'https://claude.ai/artifact/LYZpksh76vFZ9vqPQr7S3M';
const FALLBACK = { lat: 40.7128, lon: -74.006, name: 'New York' };

// ---------- Sun ----------
const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
function sunParams(ms) {
  const T = (ms / 86400000 + 2440587.5 - 2451545) / 36525;
  let L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360; if (L0 < 0) L0 += 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T), e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T) + Math.sin(rad(3 * M)) * 0.000289;
  const om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(om));
  const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(rad(om));
  const dec = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lam)))), y = Math.tan(rad(eps / 2)) ** 2;
  const eq = 4 * deg(y * Math.sin(2 * rad(L0)) - 2 * e * Math.sin(rad(M)) + 4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) - 0.5 * y * y * Math.sin(4 * rad(L0)) - 1.25 * e * e * Math.sin(2 * rad(M)));
  return { dec, eq };
}
function sunAt(date, lat, lon, alt, rising) {
  const base = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  let t = base + (720 - 4 * lon) * 60000;
  for (let i = 0; i < 4; i++) {
    const { dec, eq } = sunParams(t);
    const c = (Math.sin(rad(alt)) - Math.sin(rad(lat)) * Math.sin(rad(dec))) / (Math.cos(rad(lat)) * Math.cos(rad(dec)));
    if (c < -1 || c > 1) return null;
    t = base + (720 - 4 * lon - eq + (rising ? -4 : 4) * deg(Math.acos(c))) * 60000;
  }
  return t;
}
const dayAt = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

// ---------- Hebrew ----------
const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'], TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'], HUN = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
function gem(n) {
  let s = HUN[Math.floor(n / 100)]; const r = n % 100;
  s += r === 15 ? 'טו' : r === 16 ? 'טז' : TENS[Math.floor(r / 10)] + ONES[r % 10];
  return s.length === 1 ? s + '׳' : s.slice(0, -1) + '״' + s.slice(-1);
}
const MONTHS = { Tishri: ['Tishrei', 'תשרי'], Heshvan: ['Cheshvan', 'חשון'], Kislev: ['Kislev', 'כסלו'], Tevet: ['Teves', 'טבת'], Shevat: ['Shevat', 'שבט'], 'Adar I': ['Adar I', 'אדר א׳'], 'Adar II': ['Adar II', 'אדר ב׳'], Adar: ['Adar', 'אדר'], Nisan: ['Nissan', 'ניסן'], Iyar: ['Iyar', 'אייר'], Sivan: ['Sivan', 'סיון'], Tamuz: ['Tammuz', 'תמוז'], Av: ['Menachem Av', 'מנחם אב'], Elul: ['Elul', 'אלול'] };
function hebrewDate(d) {
  const p = {};
  new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(d).forEach((x) => (p[x.type] = x.value));
  const m = MONTHS[p.month] || [p.month, p.month];
  return { day: +p.day, month: m[0], he: `${gem(+p.day)} ${m[1]} ${gem(+p.year % 1000)}` };
}
const WEEKDAY_HE = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת קודש'];

// ---------- Tribes of the hours (hour 1 = Nisan = Yehudah …) ----------
const TRIBES = [
  ['Yehudah', 'יהודה', 'Nissan', '#7fa7d9'], ['Yissachar', 'יששכר', 'Iyar', '#3a3f5c'], ['Zevulun', 'זבולן', 'Sivan', '#e9e4d6'],
  ['Reuven', 'ראובן', 'Tammuz', '#a33a32'], ['Shimon', 'שמעון', 'Menachem Av', '#3d7a4c'], ['Gad', 'גד', 'Elul', '#555555'],
  ['Ephraim', 'אפרים', 'Tishrei', '#1a1a1a'], ['Menashe', 'מנשה', 'Cheshvan', '#1a1a1a'], ['Binyamin', 'בנימין', 'Kislev', '#9b6fb0'],
  ['Dan', 'דן', 'Teves', '#2f4fa8'], ['Asher', 'אשר', 'Shevat', '#d9cdb4'], ['Naftali', 'נפתלי', 'Adar', '#c27b8a'],
];
const ord = (n) => n + (['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]);

/** Everything the widget shows, for a moment and a place. */
function compute(now, loc) {
  const today = new Date(now);
  const z = (d) => ({ netz: sunAt(d, loc.lat, loc.lon, -0.833, true), shkiah: sunAt(d, loc.lat, loc.lon, -0.833, false), tzeis: sunAt(d, loc.lat, loc.lon, -6, false) });
  const t0 = z(dayAt(today, 0));
  let D = dayAt(today, now >= t0.shkiah ? 1 : 0);
  const day = z(D), eve = z(dayAt(D, -1));
  const isDay = now >= day.netz;
  const start = isDay ? day.netz : eve.shkiah, len = ((isDay ? day.shkiah : day.netz) - start) / 12;
  const el = (now - start) / len, hour = Math.min(12, Math.floor(el) + 1), frac = el % 1;
  const angle = isDay ? 270 + (180 * (now - day.netz)) / (day.shkiah - day.netz) : 90 + (180 * (now - eve.shkiah)) / (day.netz - eve.shkiah);
  const hd = hebrewDate(D);
  const hourEnd = start + hour * len;
  // Next marker worth knowing.
  const zm = [['Sunrise', day.netz], ['Latest Shema', day.netz + 3 * (day.shkiah - day.netz) / 12], ['Midday', day.netz + 6 * (day.shkiah - day.netz) / 12], ['Plag', day.netz + 10.75 * (day.shkiah - day.netz) / 12], ['Sunset', day.shkiah], ['Nightfall', day.tzeis]];
  const next = zm.find(([, t]) => t > now) || ['Sunset', day.shkiah];
  return { isDay, hour, frac, angle: angle % 360, tribe: TRIBES[hour - 1], hd, weekday: WEEKDAY_HE[D.getDay()], hourEnd, next, minLeft: Math.round((hourEnd - now) / 60000) };
}

// ---------- Drawing (Scriptable) ----------
function drawDial(s, size) {
  const ctx = new DrawContext();
  ctx.size = new Size(size, size); ctx.opaque = false; ctx.respectScreenScale = true;
  const c = size / 2, R = size * 0.48, Rin = size * 0.38, Rb = size * 0.355;
  const P = (r, a) => new Point(c + r * Math.sin(rad(a)), c - r * Math.cos(rad(a)));
  const sector = (r1, r2, a1, a2, color) => {
    const p = new Path(); const n = 10;
    p.move(P(r2, a1)); for (let i = 1; i <= n; i++) p.addLine(P(r2, a1 + ((a2 - a1) * i) / n));
    for (let i = n; i >= 0; i--) p.addLine(P(r1, a1 + ((a2 - a1) * i) / n)); p.closeSubpath();
    ctx.addPath(p); ctx.setFillColor(new Color(color)); ctx.fillPath();
  };
  ctx.setFillColor(new Color('#fbf6ea')); ctx.fillEllipse(new Rect(c - R - 3, c - R - 3, 2 * R + 6, 2 * R + 6));
  for (let i = 0; i < 12; i++) {
    const nowSeg = (s.isDay ? 'd' : 'n') + (s.hour - 1);
    for (const [part, base] of [['n', 90], ['d', 270]]) {
      const a1 = base + 15 * i, cur = nowSeg === part + i;
      sector(Rin, R, a1 + 0.6, a1 + 14.4, cur ? (part === 'd' ? '#d9a640' : '#6a74d0') : part === 'd' ? (i % 2 ? '#e3d0a3' : '#ecdcb6') : (i % 2 ? '#252a55' : '#2b3060'));
      sector(Rb, Rin - 1, a1 + 0.6, a1 + 14.4, TRIBES[i][3]);
    }
  }
  ctx.setFillColor(new Color('#fbf6ea')); ctx.fillEllipse(new Rect(c - Rb + 1, c - Rb + 1, 2 * Rb - 2, 2 * Rb - 2));
  // Hand with the sun or moon.
  const tip = P(R - 2, s.angle), from = P(Rb * 0.55, s.angle);
  const hand = new Path(); hand.move(from); hand.addLine(tip); ctx.addPath(hand);
  ctx.setStrokeColor(new Color('#c9973a')); ctx.setLineWidth(size * 0.012); ctx.strokePath();
  const tr = size * 0.045;
  ctx.setFillColor(new Color(s.isDay ? '#ffd54a' : '#f3f0dc')); ctx.fillEllipse(new Rect(tip.x - tr, tip.y - tr, 2 * tr, 2 * tr));
  // Center.
  ctx.setTextAlignedCenter();
  ctx.setFont(Font.boldSystemFont(size * 0.1)); ctx.setTextColor(new Color('#8a6214'));
  ctx.drawTextInRect(`${ord(s.hour)} hour`, new Rect(0, c - size * 0.13, size, size * 0.13));
  ctx.setFont(Font.mediumSystemFont(size * 0.075)); ctx.setTextColor(new Color('#2b2416'));
  ctx.drawTextInRect(s.tribe[1], new Rect(0, c + size * 0.005, size, size * 0.1));
  ctx.setFont(Font.systemFont(size * 0.05)); ctx.setTextColor(new Color('#6f634c'));
  ctx.drawTextInRect(s.isDay ? 'of the day' : 'of the night', new Rect(0, c + size * 0.1, size, size * 0.07));
  return ctx.getImage();
}

async function location() {
  const fm = FileManager.local(), path = fm.joinPath(fm.documentsDirectory(), 'hineni-loc.json');
  try {
    Location.setAccuracyToThreeKilometers();
    const l = await Location.current();
    const loc = { lat: l.latitude, lon: l.longitude };
    fm.writeString(path, JSON.stringify(loc));
    return loc;
  } catch (e) {
    if (fm.fileExists(path)) return JSON.parse(fm.readString(path));
    return FALLBACK;
  }
}

async function build() {
  const loc = await location();
  const s = compute(Date.now(), loc);
  const family = config.widgetFamily || 'medium';
  const w = new ListWidget();
  const g = new LinearGradient();
  g.colors = s.isDay ? [new Color('#86aed4'), new Color('#eef0ee')] : [new Color('#0f1430'), new Color('#1e2447')];
  g.locations = [0, 1]; w.backgroundGradient = g;
  w.url = SITE;
  w.refreshAfterDate = new Date(Math.min(s.hourEnd + 30000, Date.now() + 15 * 60000));
  const ink = new Color(s.isDay ? '#1f2433' : '#ecebf7'), muted = new Color(s.isDay ? '#4d5568' : '#a3a7cc'), gold = new Color(s.isDay ? '#8a6214' : '#e9c46a');
  const fmt = (t) => { const df = new DateFormatter(); df.useNoDateStyle(); df.useShortTimeStyle(); return df.string(new Date(t)); };
  if (family === 'small') {
    w.setPadding(8, 8, 8, 8);
    const img = w.addImage(drawDial(s, 300)); img.centerAlignImage();
    return w;
  }
  const row = w.addStack(); row.centerAlignContent();
  row.addImage(drawDial(s, family === 'large' ? 300 : 260)).imageSize = family === 'large' ? new Size(150, 150) : new Size(130, 130);
  row.addSpacer(12);
  const col = row.addStack(); col.layoutVertically();
  const t1 = col.addText(`${s.weekday} · ${s.hd.he}`); t1.font = Font.semiboldSystemFont(13); t1.textColor = gold;
  col.addSpacer(4);
  const t2 = col.addText(`${ord(s.hour)} hour of the ${s.isDay ? 'day' : 'night'}`); t2.font = Font.boldSystemFont(17); t2.textColor = ink;
  const t3 = col.addText(`${s.tribe[0]} ${s.tribe[1]} · ${s.tribe[2]}`); t3.font = Font.mediumSystemFont(13); t3.textColor = ink;
  col.addSpacer(6);
  const t4 = col.addText(`${s.minLeft} min left in this hour`); t4.font = Font.systemFont(12); t4.textColor = muted;
  const t5 = col.addText(`${s.next[0]} ${fmt(s.next[1])}`); t5.font = Font.systemFont(12); t5.textColor = muted;
  return w;
}

if (typeof config !== 'undefined') {
  const w = await build();
  if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
  Script.complete();
} else if (typeof module !== 'undefined') {
  module.exports = { compute };
}
