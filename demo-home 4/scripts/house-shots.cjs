// Скриншоты концепта «Дом»: node scripts/house-shots.cjs <outdir> (ждёт vite preview на :4173)
const { chromium } = require('playwright');
const out = process.argv[2];
const shots = [
  ['p-all', 390, 844, { layer: 'all' }],
  ['p-f1', 390, 844, { layer: 'light', focus: 'f1' }],
  ['p-sheet', 390, 844, { layer: 'light', room: 'z-living' }],
  ['p-sheet-bed', 390, 844, { layer: 'light', room: 'bed', scroll: 330 }],
  ['p-sheet-clim', 390, 844, { layer: 'climate', room: 'cabinet', scroll: 330 }],
  ['p-hero-pendant', 390, 844, { layer: 'light', room: 'z-living', device: 'chandelier' }],
  ['p-hero-curtain', 390, 844, { layer: 'all', room: 'z-living', device: 'curtain' }],
  ['p-hero-ac', 390, 844, { layer: 'climate', room: 'cabinet', device: 'ac' }],
  ['t-all', 1366, 1024, { layer: 'all' }],
  ['t-hero', 1366, 1024, { layer: 'light', room: 'bed', device: 'sconce' }]
];
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const errs = [];
  for (const [name, w, h, o] of shots) {
    if (process.argv[3] && !name.includes(process.argv[3])) continue;
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.addInitScript(([l, m]) => { localStorage.setItem('hs.layer', l); localStorage.setItem('hs.mode', m || 'night'); }, [o.layer, o.mode]);
    await p.goto('http://localhost:4173/house.html', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    await p.evaluate(async (o) => {
      const ui = window.__ui;
      if (o.focus) ui.focus = o.focus;
      if (o.room) ui.room = o.room;
      await new Promise(r => setTimeout(r, 300));
      if (o.scroll) document.querySelector('.sheet').scrollTop = o.scroll;
      if (o.device) {
        // первое устройство комнаты, чей предмет совпадает с нужным видом
        const btns = [...document.querySelectorAll('button[aria-label^="Крупный план"], .chip')];
        const want = { chandelier: /Люстра/, curtain: /штора|Шторы/i, ac: /Кондиционер/, sconce: /бра/i }[o.device];
        const b = btns.find(b => want.test(b.getAttribute('aria-label') || b.textContent));
        b && b.click();
      }
    }, o);
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `${out}/${name}.png` });
    await p.close();
  }
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
