// node scripts/shot.mjs <route> <w>x<h> <out.png> [trend] [night|day]
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [route = 'plan', size = '1366x1024', out = 'shot.png', trend = 'warm', time = ''] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const errs = [];
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
await p.addInitScript(([t]) => { try { localStorage.setItem('demo.trend', t); localStorage.setItem('demo.profile', 'auto'); } catch {} }, [trend]);
await p.goto('http://localhost:4173/#' + route);
await p.waitForTimeout(600);
if (time) { await p.evaluate((n) => window.__sim?.send({ cmd: 'demo.time', night: n === 'night' }), time); }
await p.waitForTimeout(3200);
await p.screenshot({ path: out });
console.log(errs.slice(0, 10).join('\n') || 'no errors');
await b.close();
