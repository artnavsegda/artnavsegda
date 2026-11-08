// node scripts/nav.mjs <outdir> [project] — новая навигация на телефоне и iPad
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [out, project = 'typical'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const T = project === 'typical'
  ? [['tablet', 1366, 1024, ['plan', 'rooms', 'room-living', 'room-kids', 'media', 'media-kids', 'climate-living', 'security']],
     ['phone', 390, 844, ['home', 'rooms', 'rooms?q=детская телевизор', 'room-living', 'room-bath1', 'media', 'climate', 'security']]]
  : [['tablet', 1366, 1024, ['plan', 'rooms', 'room-living', 'media']], ['phone', 390, 844, ['home', 'rooms', 'room-kitchen']]];
for (const [prof, w, h, routes] of T) for (const r0 of routes) {
  const [r, q = ''] = r0.split('?q=');
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: prof === 'phone', hasTouch: prof === 'phone' });
  const errs = [];
  await p.route(/fonts\.(googleapis|gstatic)\.com/, x => x.abort());
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(([pr, q]) => { try { localStorage.setItem('dd.project', pr); localStorage.setItem('demo.trend', 'warm'); localStorage.setItem('demo.profile', 'auto'); sessionStorage.setItem('rooms.q', q); } catch {} }, [project, q]);
  await p.goto('http://localhost:4173/#' + r);
  await p.waitForTimeout(2600);
  const name = `${project}-${prof}-${r}${q ? '-search' : ''}`;
  await p.screenshot({ path: `${out}/${name}.png`, fullPage: prof === 'phone' });
  const H = await p.evaluate(() => document.scrollingElement.scrollHeight);
  console.log(name, 'h=' + H, errs.length ? 'ERR ' + errs.slice(0, 3).join(' | ') : 'ok');
  await p.close();
}
await b.close();
