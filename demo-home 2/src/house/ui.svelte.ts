import type { Layer } from './data.svelte';

const read = (k: string, d: string) => { try { return localStorage.getItem('hs.' + k) ?? d; } catch { return d; } };
const write = (k: string, v: string) => { try { localStorage.setItem('hs.' + k, v); } catch { /* песочница */ } };

export const ui = $state({
  layer: read('layer', 'all') as Layer,
  floor: 'f1',
  room: '' as string,
  focus: null as string | null,
  device: '' as string,
  view: read('view', '3d') as '3d' | 'scheme',
  frame: read('frame', 'auto') as 'auto' | 'phone',
  trend: read('trend', 'warm'),
  mode: read('mode', 'night'),
  width: typeof window !== 'undefined' ? innerWidth : 390
});
if (typeof window !== 'undefined') addEventListener('resize', () => (ui.width = innerWidth));

export const profile = () => (ui.frame === 'phone' || ui.width < 860 ? 'phone' : 'tablet');
export function setPref(k: 'layer' | 'frame' | 'trend' | 'mode' | 'view', v: string) {
  (ui as any)[k] = v; write(k, v);
  if (k === 'trend' || k === 'mode') applyTheme();
}
export function applyTheme() {
  document.documentElement.dataset.trend = ui.trend;
  document.documentElement.dataset.mode = ui.mode;
}
if (typeof window !== 'undefined') (window as any).__ui = ui;
