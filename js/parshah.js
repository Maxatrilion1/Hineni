// The weekly parshah, worked out from the calendar itself.
// Anchors: Bereishis after Simchas Torah; Bamidbar on the Shabbos before Shavuos;
// Devarim on Shabbos Chazon; Nitzavim on the Shabbos before Rosh Hashanah.
// Between anchors, the paired parshiyos are joined as needed, in the customary order.
// Israel reads ahead after a diaspora-only Yom Tov on Shabbos and catches up by splitting a joined pair.
import { hebrewDate } from './hebrew.js';
import { addDays, weekday } from './zmanim.js';
import { holidaysOn } from './calendar.js';

export const PARSHIYOS = [
  ['Bereishis', 'בראשית'], ['Noach', 'נח'], ['Lech Lecha', 'לך לך'], ['Vayeira', 'וירא'], ['Chayei Sarah', 'חיי שרה'], ['Toldos', 'תולדות'],
  ['Vayeitzei', 'ויצא'], ['Vayishlach', 'וישלח'], ['Vayeishev', 'וישב'], ['Mikeitz', 'מקץ'], ['Vayigash', 'ויגש'], ['Vayechi', 'ויחי'],
  ['Shemos', 'שמות'], ["Va'eira", 'וארא'], ['Bo', 'בא'], ['Beshalach', 'בשלח'], ['Yisro', 'יתרו'], ['Mishpatim', 'משפטים'],
  ['Terumah', 'תרומה'], ['Tetzaveh', 'תצוה'], ['Ki Sisa', 'כי תשא'], ['Vayakhel', 'ויקהל'], ['Pekudei', 'פקודי'], ['Vayikra', 'ויקרא'],
  ['Tzav', 'צו'], ['Shemini', 'שמיני'], ['Tazria', 'תזריע'], ['Metzora', 'מצורע'], ['Acharei', 'אחרי'], ['Kedoshim', 'קדושים'],
  ['Emor', 'אמור'], ['Behar', 'בהר'], ['Bechukosai', 'בחקתי'], ['Bamidbar', 'במדבר'], ['Naso', 'נשא'], ["Beha'aloscha", 'בהעלתך'],
  ["Shelach", 'שלח'], ['Korach', 'קרח'], ['Chukas', 'חקת'], ['Balak', 'בלק'], ['Pinchas', 'פינחס'], ['Matos', 'מטות'],
  ['Masei', 'מסעי'], ['Devarim', 'דברים'], ["Va'eschanan", 'ואתחנן'], ['Eikev', 'עקב'], ["Re'eh", 'ראה'], ['Shoftim', 'שופטים'],
  ['Ki Seitzei', 'כי תצא'], ['Ki Savo', 'כי תבוא'], ['Nitzavim', 'נצבים'], ['Vayeilech', 'וילך'], ["Ha'azinu", 'האזינו'], ['Vezos Haberachah', 'וזאת הברכה'],
];

const key = (d) => `${d.y}-${d.m}-${d.d}`;
const ymd = (d) => Date.UTC(d.y, d.m - 1, d.d);
const isSpecial = (d, israel) => holidaysOn(hebrewDate(d), 6, israel).some((h) => h.kind === 'yt' || h.kind === 'chm');

function nextShabbos(d) { return addDays(d, (6 - weekday(d) + 7) % 7); }
function findHebrew(near, month, day, year) {
  for (let k = 0; k < 420; k++) for (const d of [addDays(near, -k), addDays(near, k)]) {
    const h = hebrewDate(d);
    if (h.year === year && h.month === month && h.day === day) return d;
  }
  return null;
}

export let JOIN_ORDER = [41, 38, 31, 28, 26, 21]; // Matos-Masei, Chukas-Balak, Behar-Bechukosai, Acharei-Kedoshim, Tazria-Metzora, Vayakhel-Pekudei
export function setJoinOrder(o) { JOIN_ORDER = o; cache.clear(); }
function* combos(arr, k, start = 0, pick = []) {
  if (pick.length === k) { yield pick; return; }
  for (let i = start; i < arr.length; i++) yield* combos(arr, k, i + 1, [...pick, arr[i]]);
}
function fitSet(first, last, joined) {
  const out = [];
  for (let i = first; i <= last; i++) {
    if (joined.has(i)) { out.push([i, i + 1]); i++; } else out.push([i]);
  }
  return out;
}

const cache = new Map();
/** Readings for every Shabbos of the cycle that starts after Simchas Torah of `year` (diaspora). Map date-key → [indices] or null. */
function diasporaCycle(year, near) {
  const ck = `d${year}`;
  if (cache.has(ck)) return cache.get(ck);
  const st = findHebrew(near, 'Tishrei', 23, year);
  const nextRH = findHebrew(addDays(st, 340), 'Tishrei', 1, year + 1);
  const shavuos = findHebrew(addDays(st, 220), 'Sivan', 6, year);
  const av9 = findHebrew(addDays(st, 280), 'Menachem Av', 9, year);
  const shabbosos = [];
  for (let d = nextShabbos(addDays(st, 1)); ymd(d) < ymd(nextRH); d = addDays(d, 7)) shabbosos.push(d);
  const special = shabbosos.map((d) => isSpecial(d, false));
  const D = shabbosos.reduce((a, d, i) => (ymd(d) <= ymd(av9) ? i : a), -1);
  const slotsIn = (a, b) => { const r = []; for (let i = a; i < b; i++) if (!special[i]) r.push(i); return r; };
  const s12 = slotsIn(0, D), s3 = slotsIn(D + 1, shabbosos.length);
  const nvJoined = ![1, 2].includes(weekday(nextRH)); // Vayeilech stands alone only when Rosh Hashanah is Monday or Tuesday
  // Bereishis…Masei into the Shabbosos before Shabbos Chazon. Join pairs in customary order,
  // keeping Bamidbar before Shavuos.
  const k = 43 - s12.length;
  let r12 = null;
  for (const set of combos(JOIN_ORDER, k)) {
    const r = fitSet(0, 42, new Set(set));
    const bi = r.findIndex((x) => x[0] === 33);
    if (bi >= 0 && ymd(shabbosos[s12[bi]]) < ymd(shavuos)) { r12 = r; break; }
  }
  r12 = r12 || fitSet(0, 42, new Set(JOIN_ORDER.slice(0, k)));
  const r3 = nvJoined ? [[44], [45], [46], [47], [48], [49], [50, 51]] : [[44], [45], [46], [47], [48], [49], [50]];
  const map = new Map();
  shabbosos.forEach((d, i) => map.set(key(d), null));
  s12.forEach((i, j) => map.set(key(shabbosos[i]), r12[j] ?? null));
  map.set(key(shabbosos[D]), [43]);
  s3.forEach((i, k) => map.set(key(shabbosos[i]), r3[k] ?? null));
  const res = { map, shabbosos, nvJoined };
  cache.set(ck, res);
  return res;
}

function israelCycle(year, near) {
  const ck = `i${year}`;
  if (cache.has(ck)) return cache.get(ck);
  const dia = diasporaCycle(year, near);
  const weeks = dia.shabbosos, list = weeks.map((d) => dia.map.get(key(d)));
  const out = list.slice();
  for (let i = 0; i < weeks.length; i++) {
    if (!(list[i] === null && !isSpecial(weeks[i], true))) continue;
    // Israel reads ahead from here, and catches up by splitting one joined pair before the next anchor.
    const nextIdx = list.slice(i + 1).find((x) => x)[0];
    const pref = [31, 38, 41, 28, 26, 21]; // which joined pair Israel splits to catch up
    let target = -1;
    for (const anchor of nextIdx < 33 ? [33, 43] : [43]) {
      let best = 99;
      for (let j = i + 1; j < weeks.length && !(list[j] && list[j][0] >= anchor); j++) {
        if (list[j] && list[j].length === 2) { const r = pref.indexOf(list[j][0]); if (r < best) { best = r; target = j; } }
      }
      if (target >= 0) break;
    }
    if (target < 0) continue;
    const seq = [];
    for (let j = i + 1; j <= target; j++) if (list[j]) { if (j === target) seq.push([list[j][0]], [list[j][1]]); else seq.push(list[j]); }
    let k = 0;
    for (let j = i; j <= target; j++) if (!isSpecial(weeks[j], true)) out[j] = seq[k++];
    i = target;
  }
  const map = new Map(weeks.map((d, i) => [key(d), out[i]]));
  const res = { map, shabbosos: weeks, nvJoined: dia.nvJoined };
  cache.set(ck, res);
  return res;
}

/** The reading for the Shabbos on or after civil date `d`: { names, he, holiday } */
export function parshahFor(d, israel) {
  const sh = nextShabbos(d), h = hebrewDate(sh);
  const hols = holidaysOn(h, 6, israel).filter((x) => x.kind === 'yt' || x.kind === 'chm');
  if (hols.length) return { holiday: hols[0].name, date: sh };
  // Between Rosh Hashanah and Simchas Torah: Vayeilech (if not already read) and Ha'azinu.
  if (h.month === 'Tishrei' && h.day < 23) {
    const prev = diasporaCycle(h.year - 1, addDays(sh, -200));
    const todo = prev.nvJoined ? [52] : [51, 52];
    const rh = findHebrew(sh, 'Tishrei', 1, h.year);
    const free = [];
    for (let s = nextShabbos(rh); ymd(s) <= ymd(sh); s = addDays(s, 7)) if (!isSpecial(s, israel)) free.push(key(s));
    const idx = free.indexOf(key(sh));
    const p = todo[Math.min(idx, todo.length - 1)];
    return { idx: [p], names: PARSHIYOS[p][0], he: PARSHIYOS[p][1], date: sh };
  }
  const year = h.month === 'Tishrei' ? h.year : h.year - (['Tishrei', 'Cheshvan', 'Kislev', 'Teves', 'Shevat', 'Adar', 'Adar I', 'Adar II', 'Nissan', 'Iyar', 'Sivan', 'Tammuz', 'Menachem Av', 'Elul'].indexOf(h.month) >= 0 ? 0 : 0);
  const cyc = (israel ? israelCycle : diasporaCycle)(year, sh);
  const r = cyc.map.get(key(sh));
  if (!r) return { holiday: 'Special reading', date: sh };
  return { idx: r, names: r.map((i) => PARSHIYOS[i][0]).join('-'), he: r.map((i) => PARSHIYOS[i][1]).join('-'), date: sh };
}
