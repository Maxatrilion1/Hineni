// Jewish calendar layers: holidays, Omer, molad, Kiddush Levanah, planetary hours.

// Month numbers as in the Torah: Nisan = 1 … Adar = 12, Adar II = 13.
export const MONTH_NUM = {
  Nissan: 1, Iyar: 2, Sivan: 3, Tammuz: 4, 'Menachem Av': 5, Elul: 6, Tishrei: 7, Cheshvan: 8,
  Kislev: 9, Teves: 10, Shevat: 11, Adar: 12, 'Adar I': 12, 'Adar II': 13,
};
const MONTH_NAME = (n, leap) => ({ 1: 'Nissan', 2: 'Iyar', 3: 'Sivan', 4: 'Tammuz', 5: 'Menachem Av', 6: 'Elul', 7: 'Tishrei', 8: 'Cheshvan', 9: 'Kislev', 10: 'Teves', 11: 'Shevat', 12: leap ? 'Adar I' : 'Adar', 13: 'Adar II' })[n];

export const isLeap = (y) => (7 * y + 1) % 19 < 7;

// ---------- Molad (Calendrical Calculations, Reingold & Dershowitz) ----------
const HEBREW_EPOCH = -1373427; // R.D. of 1 Tishrei AM 1
const MONTH_DAYS = 29 + 12 / 24 + 793 / 25920; // 29d 12h 793p
const RD_UNIX = 719163; // R.D. of 1970-01-01
const JERUSALEM_LMT = (35.2317 / 15) * 3600000; // Jerusalem mean time offset from UTC

/** Molad as an R.D. moment in Jerusalem mean time. */
function moladRD(month, year) {
  const y = month < 7 ? year + 1 : year;
  const elapsed = month - 7 + Math.floor((235 * y - 234) / 19);
  return HEBREW_EPOCH - 876 / 25920 + elapsed * MONTH_DAYS;
}

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Shabbos'];

export function molad(month, year) {
  const rd = moladRD(month, year);
  const day = Math.floor(rd);
  const parts = Math.round((rd - day) * 25920);
  const hours = Math.floor(parts / 1080);
  const rem = parts % 1080;
  return {
    month: MONTH_NAME(month, isLeap(year)),
    utc: (rd - RD_UNIX) * 86400000 - JERUSALEM_LMT,
    // The traditional announcement, in Jerusalem time.
    weekday: WEEKDAY[((day % 7) + 7) % 7],
    hours, minutes: Math.floor(rem / 18), chalakim: rem % 18,
  };
}

export function nextMonth(month, year) {
  if (month === 6) return [7, year + 1];
  if (month === 12) return [isLeap(year) ? 13 : 1, year];
  if (month === 13) return [1, year];
  return [month + 1, year];
}

export function moladText(m) {
  const h12 = m.hours % 12 || 12;
  return `${m.weekday}, ${h12}:${String(m.minutes).padStart(2, '0')} ${m.hours < 12 ? 'AM' : 'PM'} and ${m.chalakim} chalakim`;
}

/** Kiddush Levanah: from 7 days after the molad (Chabad custom) until mid-month (half a lunar month). */
export function kiddushLevanah(month, year) {
  const m = molad(month, year);
  return { start: m.utc + 7 * 86400000, end: m.utc + (MONTH_DAYS / 2) * 86400000 };
}

// ---------- Holidays ----------
const H = (key, name, he, kind) => ({ key, name, he, kind });

/**
 * Holidays on a Hebrew date.
 * wd: weekday of that Jewish day (0 = Sunday). israel: one day of yom tov. kislevLen: 29 or 30.
 */
export function holidaysOn({ day: d, month }, wd, israel, kislevLen = 30) {
  const m = MONTH_NUM[month];
  const leap = month === 'Adar I' || month === 'Adar II';
  const out = [];
  const add = (...a) => out.push(H(...a));

  if (d === 30 || (d === 1 && m !== 7)) add('rc', 'Rosh Chodesh', 'ראש חודש', 'rc');

  switch (m) {
    case 7: // Tishrei
      if (d === 1 || d === 2) add('rh', 'Rosh Hashanah', 'ראש השנה', 'yt');
      if ((d === 3 && wd !== 6) || (d === 4 && wd === 0)) add('gedaliah', 'Tzom Gedaliah', 'צום גדליה', 'fast');
      if (d === 6) add('chana', 'Yahrzeit of Rebbetzin Chana', 'ו׳ תשרי', 'chabad');
      if (d === 9) add('erevyk', 'Erev Yom Kippur', 'ערב יום כיפור', 'erev');
      if (d === 10) add('yk', 'Yom Kippur', 'יום כיפור', 'yt');
      if (d === 14) add('erevsukkos', 'Erev Sukkos', 'ערב סוכות', 'erev');
      if (d === 15 || (d === 16 && !israel)) add('sukkos', 'Sukkos', 'סוכות', 'yt');
      if (d >= (israel ? 16 : 17) && d <= 20) add('chm', "Sukkos · Chol Hamoed", 'חול המועד', 'chm');
      if (d === 21) add('hr', 'Hoshana Rabbah', 'הושענא רבה', 'chm');
      if (d === 22) add('sa', israel ? 'Shemini Atzeres · Simchas Torah' : 'Shemini Atzeres', 'שמיני עצרת', 'yt');
      if (d === 23 && !israel) add('st', 'Simchas Torah', 'שמחת תורה', 'yt');
      break;
    case 8: // Cheshvan
      if (d === 20) add('rashab', 'Birthday of the Rebbe Rashab', 'כ׳ מרחשון', 'chabad');
      break;
    case 9: // Kislev
      if (d === 10) add('yudkislev', 'Yud Kislev', 'י׳ כסלו', 'chabad');
      if (d === 19) add('yudtes', 'Yud-Tes Kislev', 'י״ט כסלו', 'chabad');
      if (d >= 25) add('chanukah', `Chanukah · ${ordinal(d - 24)} light`, 'חנוכה', 'minor');
      break;
    case 10: { // Teves
      const n = kislevLen - 24 + d;
      if (n <= 8) add('chanukah', `Chanukah · ${ordinal(n)} light`, 'חנוכה', 'minor');
      if (d === 10) add('asara', 'Asarah B\'Teves', 'עשרה בטבת', 'fast');
      if (d === 24) add('arz', 'Yahrzeit of the Alter Rebbe', 'כ״ד טבת', 'chabad');
      break;
    }
    case 11: // Shevat
      if (d === 10) add('yudshvat', 'Yud Shvat', 'י׳ שבט', 'chabad');
      if (d === 15) add('tubishvat', "Tu B'Shvat", 'ט״ו בשבט', 'minor');
      if (d === 22) add('chaf-beis', 'Chof-Beis Shvat', 'כ״ב שבט', 'chabad');
      break;
    case 12:
    case 13:
      if (month === 'Adar I') {
        if (d === 14) add('pk', 'Purim Katan', 'פורים קטן', 'minor');
        break;
      }
      if ((d === 13 && wd !== 6) || (d === 11 && wd === 4)) add('esther', 'Taanis Esther', 'תענית אסתר', 'fast');
      if (d === 14) add('purim', 'Purim', 'פורים', 'minor');
      if (d === 15) add('shushan', 'Shushan Purim', 'שושן פורים', 'minor');
      break;
    case 1: // Nisan
      if (d === 11) add('yudalefnisan', 'Yud-Alef Nissan', 'י״א ניסן', 'chabad');
      if (d === 14) add('erevpesach', 'Erev Pesach', 'ערב פסח', 'erev');
      if (d === 15 || (d === 16 && !israel)) add('pesach', 'Pesach', 'פסח', 'yt');
      if (d >= (israel ? 16 : 17) && d <= 20) add('chm', 'Pesach · Chol Hamoed', 'חול המועד', 'chm');
      if (d === 21) add('pesach7', 'Shevi\'i shel Pesach', 'שביעי של פסח', 'yt');
      if (d === 22 && !israel) add('acharon', 'Acharon shel Pesach', 'אחרון של פסח', 'yt');
      break;
    case 2: // Iyar
      if (d === 14) add('ps', 'Pesach Sheni', 'פסח שני', 'minor');
      if (d === 18) add('lag', "Lag B'Omer", 'ל״ג בעומר', 'minor');
      break;
    case 3: // Sivan
      if (d === 5) add('erevshavuos', 'Erev Shavuos', 'ערב שבועות', 'erev');
      if (d === 6 || (d === 7 && !israel)) add('shavuos', 'Shavuos', 'שבועות', 'yt');
      break;
    case 4: // Tammuz
      if (d === 3) add('gimmel', 'Gimmel Tammuz', 'ג׳ תמוז', 'chabad');
      if (d === 12 || d === 13) add('yudbeis', 'Yud-Beis Tammuz', 'י״ב תמוז', 'chabad');
      if ((d === 17 && wd !== 6) || (d === 18 && wd === 0)) add('17t', 'Shiva Asar B\'Tammuz', 'י״ז בתמוז', 'fast');
      break;
    case 5: // Av
      if ((d === 9 && wd !== 6) || (d === 10 && wd === 0)) add('9av', "Tishah B'Av", 'תשעה באב', 'fast');
      if (d === 15) add('tubav', "Tu B'Av", 'ט״ו באב', 'minor');
      if (d === 20) add('chafav', 'Chof Av', 'כ׳ אב', 'chabad');
      break;
    case 6: // Elul
      if (d === 18) add('chaielul', 'Chai Elul', 'ח״י אלול', 'chabad');
      if (d === 29) add('erevrh', 'Erev Rosh Hashanah', 'ערב ראש השנה', 'erev');
      break;
  }
  return out;
}

export const isYomTov = (hols) => hols.some((h) => h.kind === 'yt');

// ---------- Omer ----------
const SEFIROS = [
  ['Chesed', 'חסד'], ['Gevurah', 'גבורה'], ['Tiferes', 'תפארת'], ['Netzach', 'נצח'],
  ['Hod', 'הוד'], ['Yesod', 'יסוד'], ['Malchus', 'מלכות'],
];

/** Day of the Omer counted on the night that begins this Hebrew date, or 0. */
export function omerDay({ day, month }) {
  const m = MONTH_NUM[month];
  if (m === 1 && day >= 16) return day - 15;
  if (m === 2) return 15 + day;
  if (m === 3 && day <= 5) return 44 + day;
  return 0;
}

export function omerSefirah(n) {
  const inner = SEFIROS[(n - 1) % 7], outer = SEFIROS[Math.floor((n - 1) / 7)];
  return { tr: `${inner[0]} sheb'${outer[0]}`, he: `${inner[1]} שב${outer[1]}` };
}

// ---------- Planetary hours: their order שצ״ם חנכ״ל and each day's first hour, Rashi on Berachos 59b; traits, Shabbos 156a ----------
export const PLANETS = [
  { tr: 'Shabtai', en: 'Saturn', he: 'שבתאי', trait: 'Plans may come to nothing.' },
  { tr: 'Tzedek', en: 'Jupiter', he: 'צדק', trait: 'A person of tzedakah.' },
  { tr: "Ma'adim", en: 'Mars', he: 'מאדים', trait: 'One who sheds blood: a bloodletter, a thief, a shochet or a mohel.' },
  { tr: 'Chamah', en: 'Sun', he: 'חמה', trait: 'Radiant and open; eats and drinks of his own.' },
  { tr: 'Nogah', en: 'Venus', he: 'נוגה', trait: 'Wealthy, and given to passion.' },
  { tr: 'Kochav', en: 'Mercury', he: 'כוכב', trait: 'Bright and wise, quick of mind.' },
  { tr: 'Levanah', en: 'Moon', he: 'לבנה', trait: 'Builds and tears down, waxes and wanes.' },
];
const FIRST_DAY_HOUR = [3, 6, 2, 5, 1, 4, 0]; // Sunday's first daytime hour is Chamah, and so on.

/** Planet that rules a given sha'ah. wd = weekday of the Jewish day, h = 1..12. */
export function planetOf(wd, isDay, h) {
  const s = FIRST_DAY_HOUR[wd] + (isDay ? 0 : -12) + h - 1;
  return PLANETS[((s % 7) + 7) % 7];
}

function ordinal(n) {
  return n + (['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]);
}
