// End to end, as a new visitor on an iPhone: every tap a real tap, every step checked.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.env.ROOT || path.join(__dirname, '..'), OUT = process.argv[2] || fs.mkdtempSync(path.join(require('os').tmpdir(), 'hineni-e2e-'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'text/plain' }); r.end(d); }); }).listen(8787);
const fails = [];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 3, timezoneId: 'America/New_York' });
  await ctx.addInitScript(() => localStorage.setItem('hineni.loc', JSON.stringify({ name: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York' })));
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && !/ERR_|gc\.zgo|goatcounter|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  p.on('crash', () => fails.push('PAGE CRASHED'));
  let n = 0, peak = 0;
  const mem = () => p.evaluate(() => { let mb = 0; document.querySelectorAll('.or2, .ring-ghost, .halos-ghost .or2, .morph, #dial, .center, .intro canvas').forEach((el) => { const r = el.getBoundingClientRect(); if (r.width) mb += r.width * r.height * 36 / 1e6; }); return Math.round(mb); });
  const state = () => p.evaluate(() => ({ step: document.body.dataset.jstep || '', level: document.querySelector('#centerBtn')?.dataset.level, mode: document.querySelector('#modeSpace')?.getAttribute('aria-selected') === 'true' ? 'space' : 'time', journey: !document.getElementById('journey').hidden }));
  const center = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; if (!e.closest('#dialWrap')) e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel);
  const tap = async (sel) => { await center(sel); await p.waitForTimeout(250); const c = await center(sel); if (!c) { fails.push(`no ${sel} to tap`); return false; } await p.mouse.click(c[0], c[1]); return true; };
  const outside = async () => { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200); const r = await p.evaluate(() => { const d = document.getElementById('dial').getBoundingClientRect(); return [8, d.top + d.height / 2]; }); await p.mouse.click(r[0], r[1]); };
  const check = async (label, want, wait = 4600) => {
    let m = 0; for (let t = 0; t < wait; t += 400) { await p.waitForTimeout(400); m = Math.max(m, await mem()); }
    peak = Math.max(peak, m);
    const s = await state(), bad = Object.entries(want).filter(([k, v]) => s[k] !== v);
    await p.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-${label}.png` });
    const line = `${label.padEnd(22)} ${bad.length ? 'FAIL ' + JSON.stringify(s) : 'ok'}  ~${m} MB`;
    if (bad.length) fails.push(line);
    console.log(line);
  };
  await p.goto('http://localhost:8787/'); await p.waitForTimeout(2000);
  await check('spiral', { journey: false }, 400);
  await tap('.intro-go'); await check('landed on the rings', { step: 'nest', journey: true }, 5000);
  await p.mouse.click(195, 330); await check('6000 years', { step: 'world', level: 'world' }, 6000);
  for (const [step, level] of [['shemitah', 'shemitah'], ['year', 'year'], ['month', 'month'], ['week', 'week'], ['day', 'day']]) {
    await tap('#dial .rs.now'); await check(`journey: ${step}`, { step, level });
  }
  await tap('#dial .seg.now'); await check('journey: hour', { step: 'hour', level: 'hour' });
  await outside(); await check('journey ends: today', { level: 'day', journey: false }, 6500);
  // The app itself
  await tap('#centerBtn'); await check('tap middle: hour', { level: 'hour' });
  await outside(); await check('tap outside: day', { level: 'day' });
  await outside(); await check('tap outside: week', { level: 'week' });
  await tap('#dial .rs.now'); await check('tap gold: day', { level: 'day' });
  for (const l of ['week', 'month', 'year', 'shemitah', 'world']) { await tap(`.lad[data-lad="${l}"]`); await check(`ladder: ${l}`, { level: l }); }
  await tap('.lad[data-lad="day"]'); await check('ladder: day', { level: 'day' });
  // Quick taps in a row must not tangle
  await outside(); await p.waitForTimeout(300); await outside(); await p.waitForTimeout(300); await outside();
  await check('three quick taps out', { level: 'year' });
  await tap('#nowBtn'); await check('Today button', { level: 'day' });
  await tap('#modeSpace'); await check('Space', { mode: 'space' }, 1500);
  await tap('#modeTime'); await check('back to Time', { mode: 'time', level: 'day' }, 1500);
  // Settings
  await tap('#setBtn'); await p.waitForTimeout(500);
  const ver = await p.evaluate(() => document.querySelectorAll('#ver button').length);
  if (ver !== 2) fails.push('settings: Clean/Detailed missing');
  await tap('.ver [data-ver="clean"]'); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelectorAll('.get').forEach((d) => (d.open = true)));
  await tap('#copyWidget'); await p.waitForTimeout(1000);
  const clip = await p.evaluate(() => navigator.clipboard.readText().then((t) => t.length));
  if (clip < 5000) fails.push('copy widget: clipboard empty');
  await p.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-settings.png` });
  console.log('settings'.padEnd(22), ver === 2 && clip > 5000 ? 'ok' : 'FAIL', `(widget copied: ${clip} characters)`);
  await tap('#donateBtn'); await p.waitForTimeout(600);
  const zelle = await p.evaluate(() => navigator.clipboard.readText());
  if (zelle !== '4348823721') fails.push('donate: number not copied');
  console.log('donate'.padEnd(22), zelle === '4348823721' ? 'ok' : 'FAIL', `(copied ${zelle})`);
  await tap('#locBtn'); await p.waitForTimeout(500);
  const loc = await p.evaluate(() => document.getElementById('locDlg').open);
  if (!loc) fails.push('location dialog did not open');
  await p.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-location.png` });
  await tap('#locClose'); console.log('location'.padEnd(22), loc ? 'ok' : 'FAIL');
  await check('clean view', { level: 'day' }, 800);
  // Sit across a minute change: nothing should be redrawn or break
  await p.waitForTimeout(61000); await check('a minute later', { level: 'day' }, 400);
  // Start the journey again, from Settings
  await tap('#setBtn'); await p.waitForTimeout(400); await tap('#replayJourney'); await p.waitForTimeout(1500);
  const again = await p.evaluate(() => document.body.classList.contains('intro-on') && !!document.querySelector('.intro'));
  if (!again) fails.push('journey did not start again');
  console.log('journey again'.padEnd(22), again ? 'ok' : 'FAIL');
  console.log('PEAK graphics memory ~' + peak + ' MB');
  console.log('page errors:', errs.length ? errs : 'none');
  console.log(fails.length ? 'FAILED:\n  ' + fails.join('\n  ') : 'ALL PASSED');
  await b.close(); srv.close();
})();
