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
  shema: { en: 'Latest Shema', tr: 'Sof Zman Krias Shema', he: 'סוף זמן ק״ש', why: 'End of the 3rd hour. The morning Shema must be said by now.' },
  tefillah: { en: 'Latest Shacharis', tr: 'Sof Zman Tefillah', he: 'סוף זמן תפילה', why: 'End of the 4th hour. Shacharis should be davened by now.' },
  chatzos: { en: 'Midday', tr: 'Chatzos', he: 'חצות היום', why: 'End of the 6th hour, the sun at its height. Halfway through the day.' },
  minchaG: { en: 'Earliest Mincha', tr: 'Mincha Gedolah', he: 'מנחה גדולה', why: 'Half an hour after chatzos (6½ hours). Mincha may be davened from now.' },
  minchaK: { en: 'Mincha Ketanah', tr: 'Mincha Ketanah', he: 'מנחה קטנה', why: '9½ hours into the day. The preferred time for Mincha begins.' },
  plag: { en: 'Plag Hamincha', tr: 'Plag Hamincha', he: 'פלג המנחה', why: '10¾ hours: 1¼ hours before sunset. Some may begin Shabbos or daven Maariv from now.' },
  candles: { en: 'Candle lighting', tr: 'Hadlakas Neiros', he: 'הדלקת נרות', why: '18 minutes before sunset. Shabbos candles are lit.' },
  shkiah: { en: 'Sunset', tr: 'Shkiah', he: 'שקיעה', why: 'The sun sets and the new Jewish day begins. The night hours start.' },
  tzeis: { en: 'Nightfall', tr: 'Tzeis Hakochavim', he: 'צאת הכוכבים', why: 'Three stars appear (sun 6° below). Night is certain; Maariv and Shema of the night.' },
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
  if (weekday(date) === 5) z.candles = shkiah - SHITAH.candles * 60000;
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

/**
 * Build the whole Jewish day that contains `now`.
 * A Jewish day runs from shkiah of the previous civil day to shkiah of `day.date`.
 */
export function jewishDay(now, loc) {
  const today = civilDate(now, loc.tz);
  let day = zmanimFor(today, loc);
  if (!day.polar && now >= day.shkiah) day = zmanimFor(addDays(today, 1), loc);
  const eve = zmanimFor(addDays(day.date, -1), loc);
  if (day.polar || eve.polar) return { polar: true, day, eve };
  const nightLen = day.netz - eve.shkiah;
  const nightHour = nightLen / 12;
  const night = { start: eve.shkiah, end: day.netz, hour: nightHour, chatzosL: eve.shkiah + 6 * nightHour };

  const list = [];
  const push = (key, t, part) => t != null && list.push({ key, t, part, ...ZMANIM[key] });
  if (eve.candles) push('candles', eve.candles, 'eve');
  push('shkiah', eve.shkiah, 'eve');
  push('tzeis', eve.tzeis, 'eve');
  push('chatzosL', night.chatzosL, 'eve');
  for (const k of ['alos', 'netz', 'shema', 'tefillah', 'chatzos', 'minchaG', 'minchaK', 'plag', 'candles', 'shkiah']) push(k, day[k], 'day');
  list.sort((a, b) => a.t - b.t);

  return { day, eve, night, list, start: eve.shkiah, end: day.shkiah };
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
