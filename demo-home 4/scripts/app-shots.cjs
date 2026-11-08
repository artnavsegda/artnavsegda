// Скриншоты основного прототипа: node scripts/app-shots.cjs <outdir> [фильтр] (ждёт vite preview на :4173)
const { chromium } = require('playwright');
const out = process.argv[2];
const shots = [
  ['home', 390, 844, 'home'],
  ['home2', 390, 844, 'home', async p => { await p.evaluate(() => scrollTo(0, 820)); }],
  ['t-home', 1366, 1024, 'home'],
  ['dom', 390, 844, 'plan'],
  ['dom-f1', 390, 844, 'plan', async p => { await p.click('button[aria-label="1 этаж"]', { timeout: 2000 }); }],
  ['room', 390, 844, 'room-living', async p => { await p.evaluate(() => scrollTo(0, 560)); }],
  ['device', 390, 844, 'lamp-living-pendant'],
  ['media', 390, 844, 'media'],
  ['t-dom', 1366, 1024, 'plan'],
  ['t-room', 1366, 1024, 'room-kitchen'],
  ['t-media', 1366, 1024, 'media']
];
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const errs = [];
  for (const [name, w, h, hash, act] of shots) {
    if (process.argv[3] && !name.includes(process.argv[3])) continue;
    const p = await b.newPage({ viewport: { width: w, height: h }, timezoneId: process.env.TZID || undefined });
    if (!process.env.FONTS) await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.addInitScript(() => { localStorage.setItem('dd.project', 'typical'); localStorage.setItem('demo.profile', 'auto'); }); if (process.env.TREND) await p.addInitScript(t => localStorage.setItem('demo.trend', t), process.env.TREND);
    await p.goto('http://localhost:4173/index.html#' + hash, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2200);
    if (act) { await act(p).catch(() => {}); await p.waitForTimeout(1200); }
    await p.screenshot({ path: `${out}/${name}.png` });
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
