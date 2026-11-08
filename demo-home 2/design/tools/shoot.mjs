// Снимает экраны прототипа и сервисной панели для буклета.
import { createRequire } from 'module';
import { readFileSync, readdirSync, mkdirSync } from 'fs';
const require = createRequire('/home/claude/demo-home/');
const { chromium } = require('playwright');

const S = '/tmp/claude-0/-home-claude/dd2dd794-6893-5598-bd4f-574b55064b2b/scratchpad';
const OUT = S + '/shots-booklet';
mkdirSync(OUT, { recursive: true });
const FD = S + '/fonts/node_modules/@fontsource/';

// ——— локальные шрифты вместо Google Fonts ———
const fams = {
  'Geologica': ['geologica', [300, 400, 500, 600]], 'Onest': ['onest', [400, 500, 600]], 'Manrope': ['manrope', [300, 400, 500, 600, 700]],
  'JetBrains Mono': ['jetbrains-mono', [400, 500]], 'IBM Plex Sans': ['ibm-plex-sans', [400, 500, 600]], 'IBM Plex Mono': ['ibm-plex-mono', [400, 500]]
};
let css = '';
for (const [fam, [dir, ws]] of Object.entries(fams)) for (const w of ws) for (const sub of ['cyrillic', 'latin']) {
  const f = `${dir}-${sub}-${w}-normal.woff2`;
  const range = sub === 'cyrillic' ? 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' : 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  css += `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:block;src:url(https://localfonts.test/${dir}/${f}) format('woff2');unicode-range:${range}}\n`;
}
async function fonts(p) {
  await p.route(/fonts\.googleapis\.com/, r => r.fulfill({ contentType: 'text/css', body: css }));
  await p.route(/localfonts\.test/, r => { const u = new URL(r.request().url()); const [, dir, f] = u.pathname.split('/'); r.fulfill({ contentType: 'font/woff2', body: readFileSync(FD + dir + '/files/' + f) }); });
}

const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

// ——— клиентское приложение ———
async function client(name, route, w, h, trend, night, prep) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await fonts(p);
  await p.addInitScript(([t]) => { try { localStorage.setItem('demo.trend', t); localStorage.setItem('demo.profile', 'auto'); } catch {} }, [trend]);
  await p.goto('http://localhost:4173/#' + route);
  await p.waitForTimeout(500);
  await p.evaluate((n) => window.__sim.send({ cmd: 'demo.time', night: n }), night);
  await p.waitForTimeout(800);
  if (prep) await prep(p);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(3800);
  await p.locator('.fab').evaluate(e => e.style.display = 'none').catch(() => {});
  await p.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 86 });
  await p.close();
  console.log('ok', name);
}

await client('ipad-plan-warm', 'plan', 1366, 1024, 'warm', true);
await client('ipad-room-warm', 'room-living', 1366, 1024, 'warm', true);
await client('ipad-overview-warm', 'overview', 1366, 1024, 'warm', true);
await client('ipad-house-warm', 'house', 1366, 1024, 'warm', true);
await client('ipad-security-warm', 'security', 1366, 1024, 'warm', true, async p => { await p.evaluate(() => window.__sim.send({ cmd: 'demo.event', kind: 'motion' })); });
await client('ipad-plan-min-day', 'plan', 1366, 1024, 'minimal', false);
await client('ipad-overview-min-day', 'overview', 1366, 1024, 'minimal', false);
await client('ipad-room-day', 'room-living', 1366, 1024, 'warm', false);
await client('phone-home-warm', 'home', 390, 844, 'warm', true);
await client('phone-climate-warm', 'climate', 390, 844, 'warm', true);
await client('phone-media-warm', 'media', 390, 844, 'warm', true);
await client('phone-lamp-warm', 'lamp-living-dining', 390, 844, 'warm', true);
await client('phone-lamp3d-warm', 'lamp-living-pendant', 390, 844, 'warm', true, async p => { await p.click('text=3D'); });
await client('phone-ar-warm', 'ar', 390, 844, 'warm', true);
await client('phone-home-min-day', 'home', 390, 844, 'minimal', false);
await client('phone-climate-min-day', 'climate', 390, 844, 'minimal', false);

// ——— сервисная панель: минимальный рендер .dc.html (шаблон + renderVals) ———
const RENDER = `
class DCLogic { constructor(props){ this.props = props || {}; this.state = {}; } setState(s){ Object.assign(this.state, s); } forceUpdate(){} }
window.__render = (tpl, code) => {
  const Component = new Function('DCLogic', code + '; return Component;')(DCLogic);
  const inst = new Component({});
  const vals = inst.renderVals();
  const get = (scope, path) => path.trim().split('.').reduce((o, k) => o == null ? undefined : o[k], scope);
  const lit = (s, scope) => { const t = s.trim(); if (t === 'true') return true; if (t === 'false') return false; if (/^-?\\d+(\\.\\d+)?$/.test(t)) return Number(t); return get(scope, t); };
  const interp = (s, scope) => s.replace(/\\{\\{([^}]+)\\}\\}/g, (_, p) => { const v = lit(p, scope); return v == null ? '' : String(v); });
  const walk = (node, scope, out) => {
    if (node.nodeType === 3) { out.appendChild(document.createTextNode(interp(node.textContent, scope))); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (tag === 'helmet') return;
    if (tag === 'sc-for') {
      const m = node.getAttribute('list').match(/\\{\\{([^}]+)\\}\\}/); const list = m ? lit(m[1], scope) : [];
      const as = node.getAttribute('as');
      (list || []).forEach((it, i) => node.childNodes.forEach(c => walk(c, { ...scope, [as]: it, $index: i }, out)));
      return;
    }
    if (tag === 'sc-if') { const m = node.getAttribute('value').match(/\\{\\{([^}]+)\\}\\}/); if (m && lit(m[1], scope)) node.childNodes.forEach(c => walk(c, scope, out)); return; }
    const el = node.namespaceURI === 'http://www.w3.org/2000/svg' ? document.createElementNS(node.namespaceURI, node.tagName) : document.createElement(node.tagName);
    for (const a of node.attributes) {
      if (/^on[A-Z]/.test(a.name) || /^on/.test(a.name)) continue;
      const whole = a.value.match(/^\\{\\{([^}]+)\\}\\}$/);
      if (whole) { const v = lit(whole[1], scope); if (v === false || v == null) continue; if (v === true) { el.setAttribute(a.name, ''); continue; } el.setAttribute(a.name, String(v)); }
      else el.setAttribute(a.name, interp(a.value, scope));
    }
    const kids = tag === 'template' ? node.content.childNodes : node.childNodes;
    kids.forEach(c => walk(c, scope, el));
    out.appendChild(el);
  };
  const host = document.getElementById('host');
  const t = document.createElement('div'); t.innerHTML = tpl;
  t.childNodes.forEach(c => walk(c, vals, host));
};`;

async function svc(name, file, w, h) {
  const src = readFileSync(`${S}/svc/project/${file}`, 'utf8');
  const xdc = src.slice(src.indexOf('<x-dc>') + 6, src.indexOf('</x-dc>'));
  const helmet = xdc.slice(xdc.indexOf('<helmet>') + 8, xdc.indexOf('</helmet>'));
  const body = xdc.slice(xdc.indexOf('</helmet>') + 9);
  const sc = src.indexOf('data-dc-script'); const code = src.slice(src.indexOf('>', sc) + 1, src.indexOf('</script>', sc));
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await fonts(p);
  await p.setContent(`<!doctype html><html lang="ru"><head><meta charset="utf-8">${helmet}<script>${RENDER}</script></head><body><div id="host"></div></body></html>`);
  await p.evaluate(([t, c]) => window.__render(t, c), [body, code]);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 88 });
  await p.close();
  console.log('ok', name);
}
await svc('svc-fleet', 'Main.dc.html', 1440, 980);
await svc('svc-object', 'Object.dc.html', 1440, 1060);
await svc('svc-replace', 'Replace.dc.html', 1440, 1000);
await svc('svc-calib', 'Calibration.dc.html', 1440, 960);
await svc('svc-access', 'Access.dc.html', 1440, 1000);
await svc('svc-config', 'Config.dc.html', 1440, 1020);
await svc('svc-panel', 'PanelService.dc.html', 1180, 820);
await b.close();
console.log(readdirSync(OUT).join(' '));
