import { setDither } from '../house/tilt';
import { MediaEngine, type Conflict, type Content, type Plan, type Request } from '../../model/media/engine.ts';
import { sosnyMedia, floorNames } from '../../model/media/sosny.ts';

// Клиент медиацентра. Движок здесь — заменитель ядра: на объекте он работает на контроллере,
// а клиент получает тот же снимок состояния и шлёт те же запросы.

export const engine = new MediaEngine(sosnyMedia);
export { floorNames };

type PlanView = Omit<Plan, 'steps'> & { steps: { id: string; label: string; start: number; dur: number; done?: boolean }[] };
const planView = (p?: Plan): PlanView | undefined => p && { ...p, steps: p.steps.map(({ apply, ...s }) => s) };

function snapshot() {
  return {
    now: engine.now,
    zone: Object.fromEntries(Object.entries(engine.zone).map(([k, z]) => [k, { ...z, session: z.session && { ...z.session }, plan: planView(z.plan) }])),
    src: Object.fromEntries(Object.entries(engine.src).map(([k, s]) => [k, { ...s, zones: [...s.zones], content: s.content && { ...s.content }, restarting: planView(s.restarting) }])),
    dev: structuredClone(engine.dev),
    log: engine.log.slice(0, 6).map(l => ({ ...l }))
  };
}

export const S = $state(snapshot());
const read = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* нет хранилища */ } };

export const ui = $state({
  zone: read('mc.zone', 'living'),
  /** Телефон: какой экран открыт — список зон или зона. */
  phoneView: 'home' as 'home' | 'zone',
  panel: 'library' as 'library' | 'remote' | 'path',
  conflict: null as null | (Conflict & { activity: Request['activity']; content?: Content }),
  group: false,
  speed: Number(read('mc.speed', '1')),
  trend: read('mc.trend', 'warm'),
  mode: read('mc.mode', 'night'),
  frame: read('mc.frame', 'auto') as 'auto' | 'phone' | 'tablet',
  toast: '' as string,
  width: typeof window === 'undefined' ? 1200 : window.innerWidth
});

export const profile = () => (ui.frame === 'phone' ? 'phone' : ui.frame === 'tablet' ? 'tablet' : ui.width >= 860 ? 'tablet' : 'phone');

export function sync() { Object.assign(S, snapshot()); }

let lastLog = '';
setInterval(() => {
  engine.tick(0.25 * ui.speed);
  sync();
  const top = engine.log[0] && `${engine.log[0].t}|${engine.log[0].text}`;
  if (top && top !== lastLog) { lastLog = top; ui.toast = engine.log[0].text; }
}, 250);
if (typeof window !== 'undefined') addEventListener('resize', () => (ui.width = innerWidth));

export function setPref(k: 'speed' | 'trend' | 'mode' | 'frame' | 'zone', v: string | number) {
  (ui as any)[k] = v;
  write('mc.' + k, String(v));
  if (k === 'trend' || k === 'mode') applyTheme();
}
export function applyTheme() {
  const r = document.documentElement;
  r.dataset.trend = ui.trend;
  r.dataset.mode = ui.mode;
  // растр на мини-доме — как в основном приложении
  const cs = getComputedStyle(r), rgb = (n: string) => { const h = cs.getPropertyValue(n).trim(); const v = parseInt(h.slice(1), 16); return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255] as [number, number, number]; };
  setDither(ui.trend === 'brutal' ? { ink: rgb('--dither-ink'), paper: rgb('--dither-paper'), spot: rgb('--dither-spot') } : null);
}

export function openZone(id: string) { setPref('zone', id); ui.phoneView = 'zone'; ui.panel = 'library'; }

/** Запрос в зону: при конфликте открывается выбор, а не молчаливый отказ. */
export function ask(zone: string, r: Request) {
  const res = engine.request(zone, r);
  if ('conflict' in res) ui.conflict = { ...res.conflict, activity: r.activity, content: r.content };
  sync();
}
export function act(fn: () => unknown) { fn(); sync(); }

// ——— представление ———

export const zonesByFloor = () => {
  const out: { floor: string; name: string; zones: typeof sosnyMedia.zones }[] = [];
  for (const z of [...sosnyMedia.zones].sort((a, b) => a.floor.localeCompare(b.floor) || (a.order ?? 0) - (b.order ?? 0))) {
    let g = out.find(x => x.floor === z.floor);
    if (!g) out.push((g = { floor: z.floor, name: floorNames[z.floor], zones: [] }));
    g.zones.push(z);
  }
  return out;
};

export const kindLabel: Record<string, string> = { appletv: 'Apple TV', kodi: 'Kodi', sat: 'Спутник', streamer: 'Стример', smarttv: 'Смарт-ТВ' };

export function zoneLine(id: string) {
  const z = S.zone[id];
  if (z.plan) return z.plan.kind === 'stop' ? 'выключается…' : `включается · ${Math.max(0, Math.ceil(z.plan.total - z.plan.elapsed))} с`;
  if (!z.session) return z.note ?? 'выключено';
  const s = S.src[z.session.source];
  const n = engine.nodes[z.session.source];
  const what = s.content?.title ?? n.name;
  return `${what}${s.playing ? '' : ' · пауза'}`;
}

export const fmt = (sec = 0) => { const s = Math.max(0, Math.floor(sec)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return (h ? `${h}:${String(m).padStart(2, '0')}` : `${m}`) + `:${String(r).padStart(2, '0')}`; };

/** Хеш для процедурных обложек: соседние ключи (m01, m02) дают далёкие цвета. */
export function hash(s: string) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return h >>> 0;
}
