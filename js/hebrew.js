// Hebrew date via the browser's built-in Hebrew calendar, plus gematria and month lore.

const MONTHS = {
  Tishri: 'Tishrei', Heshvan: 'Cheshvan', Kislev: 'Kislev', Tevet: 'Teves', Shevat: 'Shevat',
  'Adar I': 'Adar I', 'Adar II': 'Adar II', Adar: 'Adar', Nisan: 'Nissan', Iyar: 'Iyar',
  Sivan: 'Sivan', Tamuz: 'Tammuz', Av: 'Menachem Av', Elul: 'Elul',
};

const MONTHS_HE = {
  Tishrei: 'תשרי', Cheshvan: 'חשון', Kislev: 'כסלו', Teves: 'טבת', Shevat: 'שבט',
  'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳', Adar: 'אדר', Nissan: 'ניסן', Iyar: 'אייר',
  Sivan: 'סיון', Tammuz: 'תמוז', 'Menachem Av': 'מנחם אב', Elul: 'אלול',
};

export function hebrewDate({ y, m, d }) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-u-ca-hebrew', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })
      .formatToParts(new Date(Date.UTC(y, m - 1, d, 12)))
      .map((x) => [x.type, x.value])
  );
  const month = MONTHS[p.month] || p.month;
  const day = +p.day;
  const year = +p.year;
  return {
    day, month, year,
    en: `${day} ${month} ${year}`,
    he: `${gematria(day)} ${MONTHS_HE[month] || ''} ${gematria(year % 1000)}`,
  };
}

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];

export function gematria(n) {
  let s = HUNDREDS[Math.floor(n / 100)];
  const r = n % 100;
  if (r === 15) s += 'טו';
  else if (r === 16) s += 'טז';
  else s += TENS[Math.floor(r / 10)] + ONES[r % 10];
  return s.length === 1 ? s + '׳' : s.slice(0, -1) + '״' + s.slice(-1);
}

export const WEEKDAYS = [
  { tr: 'Yom Rishon', he: 'יום ראשון', en: 'Sunday' },
  { tr: 'Yom Sheni', he: 'יום שני', en: 'Monday' },
  { tr: 'Yom Shlishi', he: 'יום שלישי', en: 'Tuesday' },
  { tr: "Yom Revi'i", he: 'יום רביעי', en: 'Wednesday' },
  { tr: 'Yom Chamishi', he: 'יום חמישי', en: 'Thursday' },
  { tr: 'Yom Shishi', he: 'יום שישי', en: 'Friday' },
  { tr: 'Shabbos Kodesh', he: 'שבת קודש', en: 'Saturday' },
];

// The twelve months and what is paired with each.
// Letters, senses and mazalos: Sefer Yetzirah, Gra version 5:7-10 (other versions order the senses differently).
// Tribes: the order of the camps' marching (Bamidbar 10:14-27), as the Gra (on Sefer Yetzirah 5:3) and the
// Bnei Yissaschar bring in the name of the Arizal. The Gra also brings a different order from Chazal.
const LORE = {
  Nissan: { tribe: 'Yehudah', mazal: 'Taleh', mazalEn: 'Lamb (Aries)', letter: 'ה', sense: 'Speech' },
  Iyar: { tribe: 'Yissachar', mazal: 'Shor', mazalEn: 'Ox (Taurus)', letter: 'ו', sense: 'Thought' },
  Sivan: { tribe: 'Zevulun', mazal: "Te'omim", mazalEn: 'Twins (Gemini)', letter: 'ז', sense: 'Walking' },
  Tammuz: { tribe: 'Reuven', mazal: 'Sartan', mazalEn: 'Crab (Cancer)', letter: 'ח', sense: 'Sight' },
  'Menachem Av': { tribe: 'Shimon', mazal: 'Aryeh', mazalEn: 'Lion (Leo)', letter: 'ט', sense: 'Hearing' },
  Elul: { tribe: 'Gad', mazal: 'Besulah', mazalEn: 'Maiden (Virgo)', letter: 'י', sense: 'Action' },
  Tishrei: { tribe: 'Ephraim', mazal: 'Moznayim', mazalEn: 'Scales (Libra)', letter: 'ל', sense: 'Union' },
  Cheshvan: { tribe: 'Menashe', mazal: 'Akrav', mazalEn: 'Scorpion (Scorpio)', letter: 'נ', sense: 'Smell' },
  Kislev: { tribe: 'Binyamin', mazal: 'Keshes', mazalEn: 'Bow (Sagittarius)', letter: 'ס', sense: 'Sleep' },
  Teves: { tribe: 'Dan', mazal: 'Gedi', mazalEn: 'Kid (Capricorn)', letter: 'ע', sense: 'Anger' },
  Shevat: { tribe: 'Asher', mazal: 'Dli', mazalEn: 'Bucket (Aquarius)', letter: 'צ', sense: 'Eating' },
  Adar: { tribe: 'Naftali', mazal: 'Dagim', mazalEn: 'Fish (Pisces)', letter: 'ק', sense: 'Laughter' },
};
LORE['Adar I'] = LORE['Adar II'] = LORE.Adar;

// Stone on the Kohen Gadol's choshen for each tribe, as Bamidbar Rabbah 2:7 pairs them (Ephraim and Menashe share Yosef's).
// Rashi (Shemos 28:21) and Targum Yonasan order the stones by birth instead.
const STONES = {
  Reuven: 'Odem', Shimon: 'Pitdah', Levi: 'Bareket', Yehudah: 'Nofech', Yissachar: 'Sapir',
  Zevulun: 'Yahalom', Dan: 'Leshem', Naftali: 'Achlamah', Gad: 'Shevo', Asher: 'Tarshish',
  Ephraim: 'Shoham', Menashe: 'Shoham', Binyamin: 'Yashpeh',
};

export function monthLore(month) {
  const l = LORE[month];
  return l && { ...l, stone: STONES[l.tribe] };
}

/** Rough moon phase from day of month (molad ≈ day 1). Returns 0..1, 0.5 = full. */
export function moonPhase(day) {
  return ((day - 1 + 0.5) / 29.53) % 1;
}
