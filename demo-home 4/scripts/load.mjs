// node scripts/load.mjs <outdir> — прогон «типового объекта» по всем экранам, телефон и iPad
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const shots = [
  ['tablet', 1366, 1024, ['plan', 'plan-bed1', 'plan-guest', 'room', 'overview', 'media', 'climate', 'security']],
  ['phone', 390, 844, ['home', 'plan', 'plan-living', 'climate', 'security', 'media']]
];
for (const [prof, w, h, routes] of shots) {
  for (const r of routes) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: prof === 'phone', hasTouch: prof === 'phone' });
    const errs = [];
    await p.route(/fonts\.(googleapis|gstatic)\.com/, x => x.abort());
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { try { localStorage.setItem('dd.project', 'typical'); localStorage.setItem('demo.trend', 'warm'); localStorage.setItem('demo.profile', 'auto'); } catch {} });
    await p.goto('http://localhost:4173/#' + r);
    await p.waitForTimeout(2500);
    const full = prof === 'phone';
    const scrollH = await p.evaluate(() => document.scrollingElement.scrollHeight);
    await p.screenshot({ path: `${out}/${prof}-${r}.png`, fullPage: full });
    console.log(prof, r, 'h=' + scrollH, errs.length ? 'ERR ' + errs.slice(0, 3).join(' | ') : 'ok');
    await p.close();
  }
}
await b.close();
