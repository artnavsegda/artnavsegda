// Сценарий медиа: node scripts/media-shots.cjs <outdir> [WxH] (ждёт vite preview на :4173)
const { chromium } = require('playwright');
const out = process.argv[2];
const [w, h] = (process.argv[3] || '390x844').split('x').map(Number);
const pre = w > 600 ? 't-' : '';
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  if (!process.env.FONTS) await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('dd.project', 'typical'); localStorage.setItem('demo.profile', 'auto'); }); if (process.env.TREND) await p.addInitScript(t => localStorage.setItem('demo.trend', t), process.env.TREND);
  await p.goto('http://localhost:4173/index.html#media', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2000);
  const shot = async (n) => { await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${pre}${n}.png` }); };
  await shot('m1-home');
  await p.locator('.pc').first().click(); await shot('m2-page');
  await p.locator('.primary').first().click(); await shot('m3-where');
  await p.locator('.go').click(); await p.waitForTimeout(600); await shot('m4-full-plan');
  await p.evaluate(() => { const s = window.__mediaUi; });
  await p.waitForTimeout(9000); await shot('m5-full');
  await p.locator('[aria-label="Свернуть"]').click(); await p.locator('.back').click().catch(() => {});
  await p.evaluate(() => scrollTo(0, 900)); await shot('m6-mini');
  await p.locator('.trk').first().click(); await shot('m7-where-music');
  await p.locator('.go').click(); await p.waitForTimeout(500);
  if (await p.locator('.cf').count()) { await shot('m8-conflict'); await p.locator('.cf .opt').first().click(); }
  await p.waitForTimeout(6000); await shot('m9-music');
  await p.locator('[role=tab]', { hasText: 'Зоны' }).click(); await shot('m10-zones');
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
