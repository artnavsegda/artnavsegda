import { untrack } from 'svelte';
import { Vector3 } from 'three';
import { Diorama, type ZoneStyle } from '../house/scene';
import { houseLayout } from './layout';
import { house, floors, roomById, devicesIn } from '../core/house';
import { home, dev } from './store.svelte';
import { theme } from './theme.svelte';
import { go } from './router.svelte';
import { roomLight, fmtT, pluralPeople } from './derive.svelte';
import { roomStatus, hereRoom } from './nav.svelte';

// Общая механика страницы «Дом» для всех трендов: диорама, слои, этажи, подписи, жесты.
// Каждый тренд рисует свою страницу поверх этого контроллера — данные и поведение одни, вёрстка своя.

export type Layer = 'all' | 'light' | 'climate' | 'media' | 'security';
export const layers: { id: Layer; name: string; icon: string }[] = [
  { id: 'all', name: 'Всё', icon: 'house' }, { id: 'light', name: 'Свет', icon: 'bulb' }, { id: 'climate', name: 'Климат', icon: 'climate' },
  { id: 'media', name: 'Медиа', icon: 'media' }, { id: 'security', name: 'Охрана', icon: 'shield' }
];
export const fl = [...floors].sort((a, b) => a.id - b.id);

const hueOf = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
function hsl(h: number) { const c = document.createElement('canvas').getContext('2d')!; c.fillStyle = `hsl(${h}, 55%, 50%)`; return parseInt(c.fillStyle.slice(1), 16); }

export function info(room: string) {
  const list = devicesIn(room), st = roomStatus(room);
  const clim = list.find(d => d.caps.includes('climate')); const c = clim ? dev(clim.id) : undefined;
  const lock = list.find(d => d.caps.includes('lock'));
  const media = st.media ? dev(st.media.id) : undefined;
  return { st, c, media, mediaTitle: media?.title ?? st.media?.name, unlocked: !!lock && !dev(lock.id).locked, light: roomLight(room) };
}
export function value(room: string, L: Layer): { t: string; k: string } | null {
  const i = info(room), on = i.st.lights;
  if (L === 'light') return devicesIn(room).some(d => d.caps.includes('dimmer')) ? { t: on ? `свет · ${on}` : 'выкл', k: on ? 'warm' : '' } : null;
  if (L === 'climate') return i.c?.current !== undefined ? { t: `${fmtT(i.c.current)}°`, k: (i.c.target ?? 0) - i.c.current > .6 ? 'heat' : i.c.current - (i.c.target ?? 99) > .6 ? 'cool' : '' } : null;
  if (L === 'media') return i.st.media ? { t: i.mediaTitle ?? 'играет', k: 'media' } : null;
  if (L === 'security') return i.unlocked ? { t: 'дверь открыта', k: 'alert' } : i.st.here ? { t: 'движение', k: 'cool' } : null;
  if (i.unlocked) return { t: 'дверь открыта', k: 'alert' };
  if (i.st.media) return { t: i.mediaTitle ?? 'играет', k: 'media' };
  if (i.st.people) return { t: pluralPeople(i.st.people), k: 'cool' };
  return on ? { t: i.c?.current !== undefined ? `${fmtT(i.c.current)}°` : 'свет', k: 'warm' } : null;
}
function styles(L: Layer): Record<string, ZoneStyle> {
  const out: Record<string, ZoneStyle> = {};
  for (const r of house.rooms) {
    const i = info(r.id), list = devicesIn(r.id);
    const relevant = L === 'all' || L === 'security' ? true : L === 'light' ? list.some(d => d.caps.includes('dimmer')) : L === 'climate' ? !!i.c : list.some(d => d.caps.includes('media') || d.caps.includes('speaker'));
    let tint: number | null = null, tintK = 0;
    if (L === 'climate' && i.c?.current !== undefined && i.c.target !== undefined) { const dd = i.c.current - i.c.target; if (dd < -.6) { tint = 0xe8803c; tintK = .7; } else if (dd > .6) { tint = 0x5a96e6; tintK = .7; } }
    if (L === 'media' && i.st.media) { tint = hsl(hueOf(i.mediaTitle ?? r.id)); tintK = .8; }
    out[r.id] = { glow: i.light, tint, tintK, dim: !relevant, alert: (L === 'security' || L === 'all') && i.unlocked };
  }
  return out;
}

/** Сводка дома в цифрах — каждый тренд показывает её по-своему. */
export function stats() {
  const s = home.s;
  const lit = house.rooms.filter(r => roomStatus(r.id).lights).length;
  const people = s ? Object.values(s.presence).reduce((a, b) => a + b, 0) : 0;
  const temps = house.rooms.map(r => info(r.id).c?.current).filter((t): t is number => t !== undefined);
  const inside = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : undefined;
  const sec = s?.security.mode ?? 'disarmed';
  const playing = house.rooms.filter(r => roomStatus(r.id).media).length;
  const active = house.rooms.filter(r => value(r.id, 'all'));
  return { lit, people, inside, outside: s?.outside, sec, secName: { disarmed: 'снята', perimeter: 'периметр', full: 'под охраной' }[sec], playing, active, rooms: house.rooms.length };
}
export const summaryLine = () => {
  const x = stats();
  return [x.people ? `дома ${pluralPeople(x.people)}` : 'дома никого', x.lit ? `свет в ${x.lit} комн.` : 'свет выключен', x.outside !== undefined ? `${fmtT(x.outside)}° снаружи` : ''].filter(Boolean).join(' · ');
};

export class DomScene {
  layer = $state<Layer>('all');
  focus = $state<number | null>(null);
  tick = $state(0);
  d: Diorama | undefined;
  host: HTMLElement | undefined;
  /** тап по этажу на телефоне сначала приближает этаж */
  zoomFirst = true;

  constructor(private opts: { look?: 'clay' } = {}) {
    try { this.layer = (localStorage.getItem('dom.layer') as Layer) || 'all'; } catch { /* песочница */ }
    $effect(() => { const st = styles(this.layer); const night = !!home.s?.night; this.d?.apply(st, night); });
    $effect(() => { const f = this.focus; this.d?.setFocus(f === null ? null : String(f)); });
  }
  setLayer = (l: Layer) => { this.layer = l; try { localStorage.setItem('dom.layer', l); } catch { /* песочница */ } };
  /** привязать к холсту; вернуть функцию отвязки */
  attach = (host: HTMLElement, canvas: HTMLCanvasElement) => {
    this.host = host;
    const d = this.d = new Diorama(canvas, houseLayout, this.opts);
    d.onFrame = () => untrack(() => this.tick++);
    const ro = new ResizeObserver(() => d.resize(host.clientWidth, host.clientHeight));
    ro.observe(host);
    d.apply(styles(untrack(() => this.layer)), !!untrack(() => home.s?.night));
    return () => { ro.disconnect(); d.dispose(); this.d = undefined; };
  };
  step = (dir: 1 | -1) => {
    const ids = [null, ...[...fl].reverse().map(f => f.id)];
    const i = ids.indexOf(this.focus); this.focus = ids[(i + dir + ids.length) % ids.length];
  };

  // жесты: тап — этаж или комната, протяжка вбок — поворот на рельсах
  private down: { x: number; y: number; moved: boolean } | null = null;
  pd = (e: PointerEvent) => { this.down = { x: e.clientX, y: e.clientY, moved: false }; (e.target as Element).setPointerCapture(e.pointerId); };
  pm = (e: PointerEvent) => { const dn = this.down, d = this.d; if (!dn || !d) return; const dx = e.clientX - dn.x; if (Math.abs(dx) > 6) dn.moved = true; if (dn.moved) { d.rotate(-dx * .004); dn.x = e.clientX; } };
  pu = (e: PointerEvent) => {
    const d = this.d; if (!this.down || !d || !this.host) return;
    const moved = this.down.moved; this.down = null;
    if (moved) return this.snap();
    const r = this.host.getBoundingClientRect(), hit = d.pick(e.clientX - r.left, e.clientY - r.top);
    if (!hit || !hit.zone) { this.focus = null; return; }
    if (this.focus === null && this.zoomFirst && theme.profile === 'phone' && fl.length > 1) this.focus = Number(hit.floor);
    else if (roomById[hit.zone]) go('room', hit.zone);
  };
  private snap() {
    const d = this.d!, start = d.az, t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 400); d.az = start * Math.pow(1 - k, 3); d.settle(); if (k < 1) requestAnimationFrame(step); };
    step();
  }

  labels = $derived.by(() => {
    this.tick; const d = this.d; if (!d) return [];
    const here = hereRoom(), seen = new Set<string>(), focus = this.focus, layer = this.layer;
    return d.anchors.flatMap(a => {
      if (!a.zone || seen.has(a.zone)) return []; seen.add(a.zone);
      const r = roomById[a.zone]; if (!r) return [];
      if (focus !== null && a.floor !== String(focus)) return [];
      const v = value(a.zone, layer);
      if (focus === null && !v && a.zone !== here) return [];
      return [{ id: a.id, r, v, ...d.project(a.pos, a.floor), full: focus !== null || theme.profile === 'tablet', here: a.zone === here }];
    });
  });
  floorLabels = $derived.by(() => {
    this.tick; const d = this.d; if (!d || this.focus !== null || fl.length < 2) return [];
    const layer = this.layer;
    return [...fl].reverse().map(f => ({ id: f.id, name: f.name, n: house.rooms.filter(r => (r.floor ?? 1) === f.id && value(r.id, layer)).length, ...d.project(new Vector3(-.4, .5, houseLayout.D), String(f.id)) }));
  });
  hint = $derived(this.focus !== null ? 'Тап по комнате — открыть · тап мимо — весь дом' : fl.length > 1 ? 'Тап по этажу — крупно · потяните вбок — повернуть' : 'Тап по комнате — открыть');
}
