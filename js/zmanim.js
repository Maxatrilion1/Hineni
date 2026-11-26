import { hebrewDate } from './hebrew.js';
import { holidaysOn, isYomTov } from './calendar.js';
import { sunAt } from './solar.js';

// Shitah: Alter Rebbe / Chabad, as published by chabad.org.
// Sha'os zmaniyos run from netz to shkiah; alos 16.1°, tzeis 6°.
export const SHITAH = {
  name: 'Alter Rebbe (Chabad)',
  alos: -16.1,
  horizon: -0.833,
  tzeis: -6,
  candles: 18,
};

export const ZMANIM = {
  alos: { en: 'Dawn', tr: 'Alos Hashachar', he: 'עלות השחר', why: 'First light, when the sun is 16.1° below the horizon. The earliest time for most daytime mitzvos.' },
  netz: { en: 'Sunrise', tr: 'Netz Hachamah', he: 'הנץ החמה', why: 'The sun breaks the horizon. The first of the twelve hours of the day begins.' },
  shemaMA: { en: 'Latest Shema (Magen Avraham)', tr: 'Sof Zman Shema · MA', he: 'סוף זמן ק״ש מג״א', why: 'End of the 3rd hour when the day is counted from dawn to nightfall (16.1°), per the Magen Avraham.' },
  shema: { en: 'Latest Shema', tr: 'Sof Zman Krias Shema', he: 'סוף זמן ק״ש', why: 'End of the 3rd hour. The morning Shema must be said by now.' },
  tefillahMA: { en: 'Latest Shacharis (Magen Avraham)', tr: 'Sof Zman Tefillah · MA', he: 'סוף זמן תפילה מג״א', why: 'End of the 4th hour counted from dawn to nightfall, per the Magen Avraham.' },
  tefillah: { en: 'Latest Shacharis', tr: 'Sof Zman Tefillah', he: 'סוף זמן תפילה', why: 'End of the 4th hour. Shacharis should be davened by now.' },
  chatzos: { en: 'Midday', tr: 'Chatzos', he: 'חצות היום', why: 'End of the 6th hour, the sun at its height. Halfway through the day.' },
  minchaG: { en: 'Earliest Mincha', tr: 'Mincha Gedolah', he: 'מנחה גדולה', why: 'Half an hour after chatzos (6½ hours). Mincha may be davened from now.' },
  minchaK: { en: 'Mincha Ketanah', tr: 'Mincha Ketanah', he: 'מנחה קטנה', why: '9½ hours into the day. The preferred time for Mincha begins.' },
  plag: { en: 'Plag Hamincha', tr: 'Plag Hamincha', he: 'פלג המנחה', why: '10¾ hours: 1¼ hours before sunset. Some may begin Shabbos or daven Maariv from now.' },
  candles: { en: 'Candle lighting', tr: 'Hadlakas Neiros', he: 'הדלקת נרות', why: 'Minutes before sunset, by local custom. Shabbos or Yom Tov candles are lit.' },
  candlesNight: { en: 'Candle lighting, after nightfall', tr: 'Hadlakas Neiros', he: 'הדלקת נרות', why: 'On the second night of Yom Tov, or Yom Tov after Shabbos, candles are lit after nightfall from an existing flame.' },
  shkiah: { en: 'Sunset', tr: 'Shkiah', he: 'שקיעה', why: 'The sun sets and the new Jewish day begins. The night hours start.' },
  tzeis: { en: 'Nightfall', tr: 'Tzeis Hakochavim', he: 'צאת הכוכבים', why: 'Three stars appear (sun 6° below). Night is certain; Maariv and Shema of the night.' },
  holyEnd: { en: 'Nightfall · havdalah', tr: 'Shabbos ends', he: 'מוצאי שבת', why: 'Shabbos or Yom Tov ends at nightfall (6°). Many wait longer before havdalah; follow your community.' },
  fastStart: { en: 'Fast begins', tr: 'Fast begins', he: 'תחילת הצום', why: 'A minor fast starts at dawn.' },
  fastStartEve: { en: 'Fast begins', tr: 'Fast begins', he: 'תחילת הצום', why: "Yom Kippur and Tishah B'Av begin at sunset." },
  fastEnd: { en: 'Fast ends', tr: 'Fast ends', he: 'סוף הצום', why: 'The fast ends at nightfall.' },
  chatzosL: { en: 'Midnight', tr: 'Chatzos Halailah', he: 'חצות הלילה', why: 'Halfway between sunset and sunrise. A time for Tikkun Chatzos.' },
};

export function addDays({ y, m, d }, n) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

export function weekday({ y, m, d }) {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
}

/** Civil-calendar zmanim for one date at one place. Times are UTC ms (null if the sun doesn't reach that altitude). */
export function zmanimFor(date, loc) {
  const { y, m, d } = date;
  const at = (alt, rising) => sunAt(y, m, d, loc.lat, loc.lon, alt, rising);
  const netz = at(SHITAH.horizon, true);
  const shkiah = at(SHITAH.horizon, false);
  const z = { date, alos: at(SHITAH.alos, true), netz, shkiah, tzeis: at(SHITAH.tzeis, false) };
  if (netz == null || shkiah == null) return { ...z, polar: true };
  const hour = (shkiah - netz) / 12;
  Object.assign(z, {
    hour,
    shema: netz + 3 * hour,
    tefillah: netz + 4 * hour,
    chatzos: netz + 6 * hour,
    minchaG: netz + 6.5 * hour,
    minchaK: netz + 9.5 * hour,
    plag: netz + 10.75 * hour,
  });
  const alos = z.alos, tzeisMA = at(SHITAH.alos, false);
  if (alos != null && tzeisMA != null) {
    const hMA = (tzeisMA - alos) / 12;
    z.shemaMA = alos + 3 * hMA;
    z.tefillahMA = alos + 4 * hMA;
  }
  return z;
}

/** Civil y-m-d in a time zone. */
export function civilDate(ms, tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' })
      .formatToParts(new Date(ms))
      .map((x) => [x.type, x.value])
  );
  return { y: +p.year, m: +p.month, d: +p.day };
}

/** Hebrew date, weekday and holidays of the Jewish day whose daytime is civil `date`. */
export function dayInfo(date, israel) {
  const hd = hebrewDate(date);
  const wd = weekday(date);
  let kislevLen = 30;
  if (hd.month === 'Teves') kislevLen = hebrewDate(addDays(date, -hd.day)).day;
  const hols = holidaysOn(hd, wd, israel, kislevLen);
  const yt = isYomTov(hols);
  return { date, hd, wd, hols, yt, holy: yt || wd === 6, fast: hols.find((h) => h.kind === 'fast') };
}

/**
 * Build the whole Jewish day that contains `now`.
 * A Jewish day runs from shkiah of the previous civil day to shkiah of `day.date`.
 * opts: { israel, candleMin, ma }
 */
export function jewishDay(now, loc, opts = {}) {
  const today = civilDate(now, loc.tz);
  let day = zmanimFor(today, loc);
  if (!day.polar && now >= day.shkiah) day = zmanimFor(addDays(today, 1), loc);
  const eve = zmanimFor(addDays(day.date, -1), loc);
  if (day.polar || eve.polar) return { polar: true, day, eve };

  const info = dayInfo(day.date, opts.israel);
  const prev = dayInfo(addDays(day.date, -1), opts.israel);
  const next = dayInfo(addDays(day.date, 1), opts.israel);
  const holyName = (i) => (i.yt ? 'Yom Tov' : 'Shabbos');

  const nightHour = (day.netz - eve.shkiah) / 12;
  const night = { start: eve.shkiah, end: day.netz, hour: nightHour, chatzosL: eve.shkiah + 6 * nightHour };

  const list = [];
  const push = (key, t, part, extra = {}) => t != null && list.push({ key, t, part, ...ZMANIM[key], ...extra });
  const candleMin = opts.candleMin ?? SHITAH.candles;

  // The night that opens this Jewish day.
  if (info.holy && prev.holy && info.wd !== 6) push('candlesNight', eve.tzeis, 'eve');
  if (prev.holy && !info.holy) push('holyEnd', eve.tzeis, 'eve', { tr: `${holyName(prev)} ends` });
  if (info.fast && (info.fast.key === '9av')) push('fastStartEve', eve.shkiah, 'eve');
  if (info.hols.some((h) => h.key === 'yk')) push('fastStartEve', eve.shkiah, 'eve');
  push('shkiah', eve.shkiah, 'eve');
  push('tzeis', eve.tzeis, 'eve');
  push('chatzosL', night.chatzosL, 'eve');

  // The daytime.
  if (info.fast && info.fast.key !== '9av') push('fastStart', day.alos, 'day');
  for (const k of ['alos', 'netz', ...(opts.ma ? ['shemaMA'] : []), 'shema', ...(opts.ma ? ['tefillahMA'] : []), 'tefillah', 'chatzos', 'minchaG', 'minchaK', 'plag']) push(k, day[k], 'day');
  if (next.holy && next.wd !== 0 && (!info.holy || (info.wd === 5 && info.yt)) ) {
    push('candles', day.shkiah - candleMin * 60000, 'day', { en: `Candle lighting · ${candleMin} min before sunset` });
  }
  push('shkiah', day.shkiah, 'day');
  // After this day's sunset, shown for planning (they belong to the next night).
  if (info.fast) push('fastEnd', day.tzeis, 'after');
  if (info.holy && !next.holy) push('holyEnd', day.tzeis, 'after', { tr: `${holyName(info)} ends` });
  if (info.holy && next.holy && next.wd !== 6) push('candlesNight', day.tzeis, 'after');
  list.sort((a, b) => a.t - b.t);

  return { day, eve, night, list, info, prev, next, start: eve.shkiah, end: day.shkiah };
}

/** Where `now` is in the 24 sha'os. */
export function hourOf(now, jd) {
  const isDay = now >= jd.day.netz;
  const start = isDay ? jd.day.netz : jd.night.start;
  const len = isDay ? jd.day.hour : jd.night.hour;
  const elapsed = (now - start) / len; // in sha'os
  const hour = Math.min(12, Math.floor(elapsed) + 1);
  const minutes = Math.floor((elapsed % 1) * 60);
  // chalakim: 1080 per hour
  const chalakim = Math.floor((elapsed % 1) * 1080);
  return { isDay, hour, minutes, chalakim, fraction: elapsed / 12, hourLenMin: len / 60000 };
}

/** Dial angle (deg, 0 = top, clockwise). Shkiah at right, chatzos laylah at bottom, netz at left, chatzos at top. */
export function angleOf(t, jd) {
  if (t < jd.day.netz) return 90 + (180 * (t - jd.night.start)) / (jd.night.end - jd.night.start);
  return (270 + (180 * (t - jd.day.netz)) / (jd.day.shkiah - jd.day.netz)) % 360;
}
