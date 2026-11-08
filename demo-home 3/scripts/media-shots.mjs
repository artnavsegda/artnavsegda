// node scripts/media-shots.mjs <outdir> — медиацентр: iPad и телефон в ключевых сценариях
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const b = await chromium.launch();
async function page(w, h, phone) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, x => x.abort());
  await p.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('mc.speed', '5'); } catch {} });
  await p.goto('http://localhost:4173/media.html'); await p.waitForTimeout(500);
  return { p, errs };
}
const click = async (p, text) => { await p.getByRole('button', { name: text }).first().click(); await p.waitForTimeout(300); };
// iPad: кинотеатр с Kodi — идёт переход
{ const { p, errs } = await page(1366, 1024, false);
  await click(p, /^Кинотеатр/); await click(p, /^Kodi/); await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/ipad-plan.png' });
  await click(p, /Северный свет/); await p.waitForTimeout(9000);
  await p.screenshot({ path: out + '/ipad-playing.png' });
  // кухня и спальня заняли оба Apple TV → гостиная получает выбор
  await click(p, /^Кухня/); await click(p, /^Apple TV/); await click(p, /^Спальня/); await click(p, /^Apple TV/);
  await click(p, /^Гостиная/); await click(p, /^Apple TV/); await p.waitForTimeout(400);
  await p.screenshot({ path: out + '/ipad-conflict.png' });
  console.log('ipad errors', errs);
  await p.close(); }
// телефон: санузел, радио, мультирум
{ const { p, errs } = await page(390, 844, true);
  await p.screenshot({ path: out + '/phone-home.png' });
  await click(p, /^Санузел спальни/); await click(p, /Волна джаза/); await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/phone-zone.png', fullPage: true });
  await click(p, /Мультирум/); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/phone-group.png' });
  console.log('phone errors', errs);
  await p.close(); }
await b.close();
