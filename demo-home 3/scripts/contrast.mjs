// Проверка контраста текста на всех экранах: оба тренда × день/вечер × iPad/телефон.
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch();
const screens = ['plan', 'room', 'overview', 'house', 'security', 'home', 'climate', 'media', 'lamp', 'ar'];
const found = new Map();
for (const trend of ['warm', 'minimal']) for (const night of [true, false]) for (const [w, h] of [[1180, 820], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.route(/fonts\./, r => r.abort());
  await p.addInitScript((t) => { localStorage.setItem('demo.trend', t); localStorage.setItem('demo.profile', 'auto'); }, trend);
  await p.goto('http://localhost:4173/#plan'); await p.waitForTimeout(400);
  await p.evaluate((n) => window.__sim.send({ cmd: 'demo.time', night: n }), night); await p.waitForTimeout(600);
  for (const s of screens) {
    await p.evaluate((s) => { location.hash = s; }, s); await p.waitForTimeout(1300);
    // открытый пульт тоже проверяем
    if (s === 'plan') await p.click('.fab'), await p.waitForTimeout(500);
    const bad = await p.evaluate(() => {
      const rgb = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0]; };
      const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
      const out = [];
      for (const el of document.querySelectorAll('button, .chip, b, span, h1, h2, p, i')) {
        if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
        const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        let a = el, bg = null, img = false;
        while (a) { const s = getComputedStyle(a); if (s.backgroundImage !== 'none' && !s.backgroundImage.includes('gradient')) { img = true; break; } const c = rgb(s.backgroundColor); if ((c[3] ?? 1) > .6) { bg = c; break; } if (a.tagName === 'IMG' || a.querySelector?.(':scope > img, :scope > canvas')) { img = true; break; } a = a.parentElement; }
        if (img || !bg) continue;
        const fg = rgb(cs.color); const L1 = lum(fg), L2 = lum(bg);
        const cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
        if (cr < 2.6) out.push(`${el.tagName}.${String(el.className).split(' ')[0]} «${el.textContent.trim().slice(0, 20)}» ${cr.toFixed(2)}`);
      }
      return out;
    });
    if (s === 'plan') await p.click('.fab'), await p.waitForTimeout(300);
    for (const x of bad) { const k = `${trend}/${night ? 'вечер' : 'день'}/${w}/${s}: ${x}`; found.set(k, 1); }
  }
  await p.close();
}
console.log([...found.keys()].join('\n') || 'всё читается');
await b.close();
