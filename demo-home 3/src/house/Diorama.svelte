<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { Vector3 } from 'three';
  import { Diorama, type ZoneStyle, type Layout } from './scene';
  import { plan, floorOrder, stairsRect, entrance, W, D } from './layout';
  import { S, P, rooms, roomById, lightsOn, lightLevel, anyAlert, hue, type Layer, type Room } from './data.svelte';
  import { ui, profile } from './ui.svelte';

  // Дом-диорама поверх three.js: сцена рисует дом, подписи — обычный HTML поверх,
  // чтобы текст был чётким, а цели для пальца — крупными.
  let { layer }: { layer: Layer } = $props();
  let host: HTMLDivElement, canvas: HTMLCanvasElement;
  let d: Diorama | undefined;
  let tick = $state(0);

  const spaceZone: Record<string, string> = {};
  for (const r of rooms) for (const s of r.zone.spaces) spaceZone[s] = r.id;
  const spaceKind = Object.fromEntries(P.spaces.map(s => [s.id, s.kind]));
  const floorNames: Record<string, string> = { f0: 'Цоколь', f1: '1 этаж', f2: '2 этаж', f3: '3 этаж' };

  const fmt = (n: number) => n.toFixed(1).replace('.', ',');
  function value(r: Room, L: Layer): { t: string; k: string } | null {
    const t = S.temp[r.id], m = S.media[r.id], on = lightsOn(r);
    if (L === 'light') return r.lights.length ? { t: on ? `${on} из ${r.lights.length}` : 'выкл', k: on ? 'warm' : '' } : null;
    if (L === 'climate') return t ? { t: `${fmt(t.cur)}°`, k: t.cur - t.target < -.6 ? 'heat' : t.cur - t.target > .6 ? 'cool' : '' } : null;
    if (L === 'media') return m ? { t: m.title, k: 'media' } : null;
    if (L === 'security') return anyAlert(r) ? { t: 'окно открыто', k: 'alert' } : S.sec[r.id]?.motion ? { t: 'движение', k: '' } : null;
    if (anyAlert(r)) return { t: 'окно', k: 'alert' };
    if (m) return { t: m.title, k: 'media' };
    return t ? { t: `${fmt(t.cur)}°`, k: on ? 'warm' : '' } : null;
  }
  const active = (r: Room, L: Layer) => {
    const v = value(r, L);
    if (!v) return false;
    if (L === 'all') return v.k === 'alert' || v.k === 'media' || lightsOn(r) > 0;
    return L === 'light' ? lightsOn(r) > 0 : L === 'climate' ? v.k !== '' : true;
  };

  function styles(L: Layer): Record<string, ZoneStyle> {
    const out: Record<string, ZoneStyle> = {};
    for (const r of rooms) {
      const t = S.temp[r.id], m = S.media[r.id];
      const relevant = L === 'all' || L === 'security' ? true : L === 'light' ? r.lights.length > 0 : L === 'climate' ? !!t : r.media.length > 0 || !!m;
      let tint: number | null = null, tintK = 0;
      if (L === 'climate' && t) { const dd = t.cur - t.target; if (dd < -.6) { tint = 0xe8803c; tintK = .7; } else if (dd > .6) { tint = 0x5a96e6; tintK = .7; } }
      if (L === 'media' && m) { tint = cssHex(`hsl(${hue(m.art)}, 55%, 50%)`); tintK = .8; }
      out[r.id] = { glow: lightLevel(r), tint, tintK, dim: !relevant, alert: (L === 'security' || L === 'all') && anyAlert(r) };
    }
    return out;
  }
  function cssHex(c: string) { const el = document.createElement('canvas').getContext('2d')!; el.fillStyle = c; return parseInt(el.fillStyle.slice(1), 16); }

  onMount(() => {
    const layout: Layout = { W, D, ground: 1, entrance, floors: floorOrder.map(f => ({ id: f, rooms: [
      ...plan[f].map(r => ({ ...r, zone: spaceZone[r.space], kind: spaceKind[r.space] ?? 'hall' })),
      { ...stairsRect, zone: 'z-stairs', kind: 'stairs', label: f === 'f1' }
    ] })) };
    d = new Diorama(canvas, layout);
    d.onFrame = () => untrack(() => tick++);
    const ro = new ResizeObserver(() => d!.resize(host.clientWidth, host.clientHeight));
    ro.observe(host);
    return () => { ro.disconnect(); d?.dispose(); };
  });
  // любое изменение состояния дома или слоя — один кадр
  $effect(() => { const st = styles(layer); const night = ui.mode === 'night'; d?.apply(st, night); });
  $effect(() => { const f = ui.focus; d?.setFocus(f); });

  // жесты: тап — этаж или комната, протяжка — поворот на рельсах
  let down: { x: number; y: number; moved: boolean } | null = null;
  function pd(e: PointerEvent) { down = { x: e.clientX, y: e.clientY, moved: false }; (e.target as Element).setPointerCapture(e.pointerId); }
  function pm(e: PointerEvent) {
    if (!down || !d) return;
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 6) down.moved = true;
    if (down.moved) { d.rotate(-dx * .004); down.x = e.clientX; }
  }
  function pu(e: PointerEvent) {
    if (!down || !d) return;
    const moved = down.moved; down = null;
    if (moved) { snap(); return; }
    const r = host.getBoundingClientRect();
    const hit = d.pick(e.clientX - r.left, e.clientY - r.top);
    if (!hit) { if (ui.focus) ui.focus = null; return; }
    if (!ui.focus && profile() === 'phone' && hit.zone !== 'entrance') ui.focus = hit.floor;
    else ui.room = hit.zone;
  }
  function snap() {
    if (!d) return;
    const start = d.az, t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 400); d!.az = start * (1 - (1 - Math.pow(1 - k, 3))); d!.settle(); if (k < 1) requestAnimationFrame(step); };
    step();
  }

  const labels = $derived.by(() => {
    tick; if (!d) return [];
    const seen = new Set<string>();
    return d.anchors.flatMap(a => {
      const key = a.zone + a.floor; if (seen.has(key)) return []; seen.add(key);
      const r = roomById[a.zone]; if (!r) return [];
      const fl = a.floor === 'site' ? 'f1' : a.floor;
      if (ui.focus && fl !== ui.focus) return [];
      const v = value(r, layer);
      const show = ui.focus ? true : active(r, layer);
      if (!show) return [];
      const p = d!.project(a.pos, a.floor);
      return [{ id: a.id, r, v, ...p, full: !!ui.focus || profile() === 'tablet' }];
    });
  });
  const floorLabels = $derived.by(() => {
    tick; if (!d || ui.focus) return [];
    return ['f3', 'f2', 'f1', 'f0'].map(f => {
      const p = d!.project(new Vector3(-.4, .5, 9), f);
      const rs = rooms.filter(r => r.floor === f);
      const n = rs.filter(r => active(r, layer)).length;
      return { f, ...p, name: floorNames[f], n };
    });
  });
</script>

<div class="dio" bind:this={host}>
  <canvas bind:this={canvas} onpointerdown={pd} onpointermove={pm} onpointerup={pu} aria-label="Дом в 3D: тап по этажу или комнате"></canvas>
  {#each floorLabels as f (f.f)}
    <button class="fl" style="left:{f.x}px; top:{f.y}px" onclick={() => (ui.focus = f.f)}>
      <b>{f.name}</b>{#if f.n}<i>{f.n}</i>{/if}
    </button>
  {/each}
  {#each labels as l (l.id)}
    <button class="lb {l.v?.k ?? ''}" class:full={l.full} style="left:{l.x}px; top:{l.y}px" onclick={() => (ui.room = l.r.id)}>
      {#if l.full}<b>{l.r.name}</b>{/if}{#if l.v}<span>{l.v.t}</span>{:else if !l.full}<b>{l.r.name}</b>{/if}
    </button>
  {/each}
</div>

<style>
  .dio { position: relative; width: 100%; height: 100%; min-height: 0; overflow: hidden; touch-action: pan-y; }
  canvas { display: block; width: 100%; height: 100%; cursor: grab; }
  .fl { position: absolute; transform: translate(-100%, -50%); display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: var(--r-pill);
    border: 1px solid var(--border); background: var(--glass, var(--surface)); backdrop-filter: blur(8px); color: var(--text); font: 500 12.5px var(--font-ui); white-space: nowrap; }
  .fl i { font-style: normal; min-width: 18px; height: 18px; border-radius: 9px; background: var(--accent-soft); color: var(--accent-text); display: grid; place-items: center; font-size: 11px; }
  .lb { position: absolute; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; gap: 0; max-width: 130px; padding: 4px 9px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--glass, var(--surface)); backdrop-filter: blur(8px); color: var(--text); font: 500 12px/1.2 var(--font-ui); white-space: nowrap; }
  .lb b { font-weight: 500; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .lb span { font-size: 11.5px; color: var(--sub); overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .lb:not(.full) span { color: var(--text); }
  .lb.warm span { color: #E0A15A; }
  .lb.heat span { color: #E8803C; } .lb.cool span { color: #6FA3EA; }
  .lb.alert { border-color: var(--danger); } .lb.alert span { color: var(--danger); }
  .lb.media { border-color: var(--accent-border); }
  :global([data-trend="minimal"]) .lb, :global([data-trend="minimal"]) .fl { border-radius: 0; }
</style>
