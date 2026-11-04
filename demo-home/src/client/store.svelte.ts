import { HouseSim } from '../core/sim';
import type { Command, DeviceState, HomeState } from '../core/types';

// Зеркало состояния дома. Получает snapshot один раз и дальше только дельты.
// Транспорт сейчас — симулятор в той же вкладке; для объекта он заменяется
// на WebSocket, остальной клиент не меняется.

export const transport = new HouseSim();
if (typeof window !== 'undefined') (window as any).__sim = transport; // для демо-скриптов и отладки

export const home = $state<{ s: HomeState | null; connected: boolean }>({ s: null, connected: false });

function setPath(root: any, path: string, value: unknown) {
  const keys = path.includes('|') ? path.split('|') : path.split('.');
  let o = root;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]] ??= {};
  o[keys[keys.length - 1]] = value;
}

transport.subscribe(m => {
  if (m.type === 'snapshot') { home.s = m.state; home.connected = true; }
  else if (m.type === 'delta' && home.s) for (const [p, v] of m.changes) setPath(home.s, p, v);
});

export const cmd = (c: Command) => transport.send(c);

export const dev = (id: string): DeviceState => home.s?.devices[id] ?? {};

export const lightOn = (id: string) => (dev(id).level ?? 0) > 0;

export const runScene = (scene: string, room?: string) => cmd({ cmd: 'scene.run', scene, room });

/** Цвет света по цветовой температуре: для свечения на фото, в 3D и в UI. */
export function ctColor(ct = 2700): [number, number, number] {
  if (ct <= 3000) return [1.0, 0.68, 0.38];
  if (ct <= 4500) return [1.0, 0.86, 0.68];
  return [0.86, 0.92, 1.0];
}
export const ctCss = (ct = 2700, a = 1) => { const [r, g, b] = ctColor(ct); return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`; };
