// Lore for each layer of Jewish time and space. Every entry names its source.

// The twelve months in order from Nisan, with their tribe (Arizal, following the camps in Bamidbar 2).
export const MONTH_ORDER = ['Nissan', 'Iyar', 'Sivan', 'Tammuz', 'Menachem Av', 'Elul', 'Tishrei', 'Cheshvan', 'Kislev', 'Teves', 'Shevat', 'Adar'];
export const MONTH_HE = ['ניסן', 'אייר', 'סיון', 'תמוז', 'מנחם אב', 'אלול', 'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר'];

// Flags and emblems: Bamidbar Rabbah 2:7. Blessings: Bereishis 49 (Yaakov), Devarim 33 (Moshe).
// Names: Bereishis 29–30, 35, 41. Camps: Bamidbar 2.
export const TRIBES = {
  Yehudah: {
    he: 'יהודה', mother: 'Leah', emblem: 'Lion', emoji: '🦁', flag: ['#7fa7d9'], flagText: 'the color of the sky',
    name: '"This time I will thank Hashem" (Bereishis 29:35)', camp: 'east',
    blessing: { he: 'גור אריה יהודה', en: 'Yehudah is a lion cub', ref: 'Bereishis 49:9' },
    about: 'The tribe of kingship: David and Moshiach come from Yehudah. It led the camp and the march, first of the tribes.',
  },
  Yissachar: {
    he: 'יששכר', mother: 'Leah', emblem: 'Sun and moon', emoji: '☀️', flag: ['#23263a'], flagText: 'black like kohl',
    name: '"Hashem has given me my reward" (Bereishis 30:18)', camp: 'east',
    blessing: { he: 'יששכר חמור גרם', en: 'Yissachar is a strong-boned donkey', ref: 'Bereishis 49:14' },
    about: 'The tribe of Torah scholars who "knew how to understand the times" (Divrei Hayamim I 12:33) and fixed the calendar. Their flag bore the sun and moon.',
  },
  Zevulun: {
    he: 'זבולן', mother: 'Leah', emblem: 'Ship', emoji: '⛵', flag: ['#f2efe6'], flagText: 'white',
    name: '"Now my husband will dwell with me" (Bereishis 30:20)', camp: 'east',
    blessing: { he: 'זבולן לחוף ימים ישכן', en: 'Zevulun will dwell by the shore of the seas', ref: 'Bereishis 49:13' },
    about: 'Seafarers and merchants who supported Yissachar\'s learning: the partnership of Torah and those who sustain it.',
  },
  Reuven: {
    he: 'ראובן', mother: 'Leah', emblem: 'Mandrakes', emoji: '🌿', flag: ['#a33a32'], flagText: 'red',
    name: '"Hashem has seen my affliction" (Bereishis 29:32)', camp: 'south',
    blessing: { he: 'ראובן בכרי אתה כחי וראשית אוני', en: 'Reuven, you are my firstborn, my strength', ref: 'Bereishis 49:3' },
    about: 'The firstborn, and the first to do teshuvah (Bereishis Rabbah 84:19). The mandrakes he found in the field are on his flag.',
  },
  Shimon: {
    he: 'שמעון', mother: 'Leah', emblem: 'The city of Shechem', emoji: '🏘️', flag: ['#3d7a4c'], flagText: 'green',
    name: '"Hashem has heard" (Bereishis 29:33)', camp: 'south',
    blessing: { he: 'שמעון ולוי אחים', en: 'Shimon and Levi are brothers', ref: 'Bereishis 49:5' },
    about: 'Zealous and fierce: with Levi he defended Dinah at Shechem, the city drawn on his flag. Yaakov scattered the tribe among Israel, and many became teachers.',
  },
  Gad: {
    he: 'גד', mother: 'Zilpah', emblem: 'A camp of troops', emoji: '⛺', flag: ['#1d1d1f', '#f2efe6'], flagText: 'black and white',
    name: '"Good fortune has come" (Bereishis 30:11)', camp: 'south',
    blessing: { he: 'גד גדוד יגודנו', en: 'Gad, a troop shall troop upon him', ref: 'Bereishis 49:19' },
    about: 'Warriors who went first across the Jordan to fight for their brothers, though their own land was already won. Moshe compared Gad to a lion (Devarim 33:20).',
  },
  Ephraim: {
    he: 'אפרים', mother: 'Rachel', emblem: 'Ox', emoji: '🐂', flag: ['#141414'], flagText: 'very black, Yosef\'s color',
    name: '"Hashem has made me fruitful" (Bereishis 41:52)', camp: 'west',
    blessing: { he: 'בכור שורו הדר לו', en: 'His firstborn ox, majesty is his', ref: 'Devarim 33:17' },
    about: 'Yosef\'s younger son, whom Yaakov placed before Menashe. Yehoshua came from Ephraim. Blessings are still given "may Hashem make you like Ephraim and Menashe."',
  },
  Menashe: {
    he: 'מנשה', mother: 'Rachel', emblem: 'Wild ox (re\'em)', emoji: '🐃', flag: ['#141414'], flagText: 'very black, Yosef\'s color',
    name: '"Hashem has made me forget my hardship" (Bereishis 41:51)', camp: 'west',
    blessing: { he: 'וקרני ראם קרניו', en: 'His horns are the horns of a wild ox', ref: 'Devarim 33:17' },
    about: 'Yosef\'s firstborn, whose tribe settled on both sides of the Jordan. Gidon came from Menashe.',
  },
  Binyamin: {
    he: 'בנימין', mother: 'Rachel', emblem: 'Wolf', emoji: '🐺', flag: ['#a33a32', '#3d7a4c', '#7fa7d9', '#e7c55a', '#7a4f9e', '#f2efe6', '#23263a', '#c27b8a', '#2f4fa8', '#9a8b7a', '#6fb6b4', '#141414'], flagText: 'all twelve colors',
    name: '"Son of my right hand" (Bereishis 35:18)', camp: 'west',
    blessing: { he: 'בנימין זאב יטרף', en: 'Binyamin is a wolf that preys', ref: 'Bereishis 49:27' },
    about: 'The youngest, the only son born in Eretz Yisrael. The Beis Hamikdash stood in his portion. His flag held all twelve colors.',
  },
  Dan: {
    he: 'דן', mother: 'Bilhah', emblem: 'Snake', emoji: '🐍', flag: ['#2f4fa8'], flagText: 'like sapphire',
    name: '"Hashem has judged me" (Bereishis 30:6)', camp: 'north',
    blessing: { he: 'יהי דן נחש עלי דרך', en: 'Dan will be a snake by the road', ref: 'Bereishis 49:17' },
    about: 'The rear guard that gathered whatever was lost on the march. Shimshon came from Dan.',
  },
  Asher: {
    he: 'אשר', mother: 'Zilpah', emblem: 'Olive tree', emoji: '🫒', flag: ['#e6dccb'], flagText: 'like a pearl',
    name: '"In my happiness" (Bereishis 30:13)', camp: 'north',
    blessing: { he: 'מאשר שמנה לחמו', en: 'From Asher, his bread will be rich', ref: 'Bereishis 49:20' },
    about: 'A land so rich in olive oil that he would "dip his foot in oil" (Devarim 33:24). Serach bas Asher is counted among those who went down to Egypt.',
  },
  Naftali: {
    he: 'נפתלי', mother: 'Bilhah', emblem: 'Deer', emoji: '🦌', flag: ['#c27b8a'], flagText: 'like clear wine',
    name: '"Bound in Hashem\'s bonds" (Bereishis 30:8)', camp: 'north',
    blessing: { he: 'נפתלי אילה שלחה', en: 'Naftali is a deer let loose', ref: 'Bereishis 49:21' },
    about: 'Swift as a deer: its land in the Galil ripened its fruit first. Devorah\'s general Barak came from Naftali.',
  },
};

export const CAMPS = { east: ['Yehudah', 'Yissachar', 'Zevulun'], south: ['Reuven', 'Shimon', 'Gad'], west: ['Ephraim', 'Menashe', 'Binyamin'], north: ['Dan', 'Asher', 'Naftali'] };

// The seven days. Sefiros and ushpizin follow the Zohar; Shir shel Yom from Tamid 7:4.
export const DAYS = [
  { n: 1, creation: 'Light', creationHe: 'יהי אור', sefirah: 'Chesed', sefirahHe: 'חסד', ushpiz: 'Avraham', shir: 24, shirHe: 'לה׳ הארץ ומלואה' },
  { n: 2, creation: 'The firmament, dividing the waters', creationHe: 'יהי רקיע', sefirah: 'Gevurah', sefirahHe: 'גבורה', ushpiz: 'Yitzchak', shir: 48, shirHe: 'גדול ה׳ ומהלל מאד' },
  { n: 3, creation: 'Dry land and plants', creationHe: 'תדשא הארץ', sefirah: 'Tiferes', sefirahHe: 'תפארת', ushpiz: 'Yaakov', shir: 82, shirHe: 'אלקים נצב בעדת אל' },
  { n: 4, creation: 'Sun, moon and stars', creationHe: 'יהי מארת', sefirah: 'Netzach', sefirahHe: 'נצח', ushpiz: 'Moshe', shir: 94, shirHe: 'א-ל נקמות ה׳' },
  { n: 5, creation: 'Fish and birds', creationHe: 'ישרצו המים', sefirah: 'Hod', sefirahHe: 'הוד', ushpiz: 'Aharon', shir: 81, shirHe: 'הרנינו לאלקים עוזנו' },
  { n: 6, creation: 'Animals and man', creationHe: 'נעשה אדם', sefirah: 'Yesod', sefirahHe: 'יסוד', ushpiz: 'Yosef', shir: 93, shirHe: 'ה׳ מלך גאות לבש' },
  { n: 7, creation: 'Rest: Shabbos', creationHe: 'ויכלו', sefirah: 'Malchus', sefirahHe: 'מלכות', ushpiz: 'David', shir: 92, shirHe: 'מזמור שיר ליום השבת' },
];

/** The month and tribe of a sha'ah: hour 1 ↔ Nisan … hour 12 ↔ Adar. */
export function hourMonth(h) {
  const i = (h - 1) % 12;
  return { month: MONTH_ORDER[i], monthHe: MONTH_HE[i], index: i };
}

/** Bearing (degrees from north) and distance (km) from a place to the Kodesh Hakodashim. */
export function towardJerusalem({ lat, lon }) {
  const T = { lat: 31.7781, lon: 35.2354 };
  const r = Math.PI / 180;
  const y = Math.sin((T.lon - lon) * r) * Math.cos(T.lat * r);
  const x = Math.cos(lat * r) * Math.sin(T.lat * r) - Math.sin(lat * r) * Math.cos(T.lat * r) * Math.cos((T.lon - lon) * r);
  const bearing = ((Math.atan2(y, x) / r) + 360) % 360;
  const h = Math.sin(((T.lat - lat) * r) / 2) ** 2 + Math.cos(lat * r) * Math.cos(T.lat * r) * Math.sin(((T.lon - lon) * r) / 2) ** 2;
  return { bearing, km: 12742 * Math.asin(Math.sqrt(h)) };
}

export function compassWord(b) {
  return ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'][Math.round(b / 45) % 8];
}
