<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { Diorama, type ZoneStyle } from '../house/scene';
  import { houseLayout } from '../client/layout';
  import { house, roomById } from '../core/house';
  import { S, ui, engine, openZone, setPref, profile, hash } from './state.svelte';
  import type { MediaZone } from '../../model/media/types.ts';

  // Дом-диорама в медиацентре: где что играет — видно сразу. Комната с музыкой или кино
  // окрашена обложкой, остальные уходят в тень. Тап по комнате — её зона.
  // onPick — режим выбора «где»: тап отдаёт зону наружу; only — какие зоны вообще подходят
  let { onPick, only, selected = '', height = 400, caption = true }: { onPick?: (zone: string) => void; only?: string[]; selected?: string; height?: number; caption?: boolean } = $props();
  const spaceRoom: Record<string, string[]> = { living: ['living'], kitchen: ['kitchen'], bath1: ['bath1', 'bath'], bed: ['bed1', 'bedroom'], kids: ['kids'], bath2b: ['bed2'], bath3: ['guest'] };
  const roomOf = (z: MediaZone) => (spaceRoom[z.space] ?? [z.space]).find(id => roomById[id]);
  const byRoom: Record<string, MediaZone[]> = {};
  for (const z of engine.cfg.zones) { const r = roomOf(z); if (r) (byRoom[r] ??= []).push(z); }
  for (const r in byRoom) byRoom[r].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const activeZone = (r: string) => byRoom[r]?.find(z => S.zone[z.id]?.session || S.zone[z.id]?.plan);
  const pickRoom = (r: string) => {
    const list = (byRoom[r] ?? []).filter(z => !only || only.includes(z.id));
    const z = list.find(x => x.id !== selected && onPick) ?? (activeZone(r) && list.includes(activeZone(r)!) ? activeZone(r) : list[0]); if (!z) return;
    if (onPick) return onPick(z.id);
    profile() === 'phone' ? openZone(z.id) : setPref('zone', z.id);
  };
  function view(r: string) {
    const z = activeZone(r); const ses = z && S.zone[z.id].session;
    const c = ses ? S.src[ses.source].content : undefined;
    return { z, c, plan: z ? S.zone[z.id].plan : undefined, playing: ses ? S.src[ses.source].playing : false };
  }
  function hex(h: number) { const c = document.createElement('canvas').getContext('2d')!; c.fillStyle = `hsl(${h}, 55%, 50%)`; return parseInt(c.fillStyle.slice(1), 16); }
  const styles = $derived.by(() => {
    const out: Record<string, ZoneStyle> = {};
    for (const r of house.rooms) {
      const v = view(r.id), has = !!byRoom[r.id]?.some(z => !only || only.includes(z.id));
      const sel = !!selected && !!byRoom[r.id]?.some(z => z.id === selected);
      out[r.id] = { glow: sel ? .9 : v.c ? .35 : 0, tint: v.c ? hex(hash(v.c.art) % 360) : null, tintK: v.c ? .85 : 0, dim: !has, alert: false };
    }
    return out;
  });

  let host: HTMLDivElement, canvas: HTMLCanvasElement;
  let d: Diorama | undefined;
  let tick = $state(0), lastKey = '';
  onMount(() => {
    d = new Diorama(canvas, houseLayout);
    d.onFrame = () => untrack(() => tick++);
    const ro = new ResizeObserver(() => d!.resize(host.clientWidth, host.clientHeight));
    ro.observe(host);
    return () => { ro.disconnect(); d?.dispose(); };
  });
  // перерисовка — только когда меняется картина, а не на каждый такт движка
  $effect(() => {
    const st = styles, night = (document.documentElement.dataset.mode ?? ui.mode) !== 'day', key = JSON.stringify(st) + night;
    if (key !== lastKey && d) { lastKey = key; d.apply(st, night); }
  });

  let down: { x: number; moved: boolean } | null = null;
  function pd(e: PointerEvent) { down = { x: e.clientX, moved: false }; (e.target as Element).setPointerCapture(e.pointerId); }
  function pm(e: PointerEvent) { if (!down || !d) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 6) down.moved = true; if (down.moved) { d.rotate(-dx * .004); down.x = e.clientX; } }
  function pu(e: PointerEvent) {
    if (!down || !d) return; const moved = down.moved; down = null;
    if (moved) { const start = d.az, t0 = performance.now(); const step = () => { const k = Math.min(1, (performance.now() - t0) / 400); d!.az = start * Math.pow(1 - k, 3); d!.settle(); if (k < 1) requestAnimationFrame(step); }; step(); return; }
    const r = host.getBoundingClientRect(), hit = d.pick(e.clientX - r.left, e.clientY - r.top);
    if (hit?.zone && byRoom[hit.zone]) pickRoom(hit.zone);
  }
  const labels = $derived.by(() => {
    tick; if (!d) return [];
    const seen = new Set<string>();
    return d.anchors.flatMap(a => {
      if (!byRoom[a.zone] || seen.has(a.zone)) return []; seen.add(a.zone);
      if (only && !byRoom[a.zone].some(z => only.includes(z.id))) return [];
      const v = view(a.zone), names = byRoom[a.zone].map(z => z.name);
      return [{ id: a.zone, name: onPick ? (byRoom[a.zone].find(z => z.id === selected)?.name ?? names.join(' · ')) : v.z ? v.z.name : names.join(' · '), what: v.plan ? 'включается…' : v.c?.title ?? '', playing: v.playing, sel: onPick ? !!byRoom[a.zone].find(z => z.id === selected) : !!byRoom[a.zone].find(z => z.id === ui.zone) && profile() === 'tablet', name2: onPick && byRoom[a.zone].find(z => z.id === selected)?.name, ...d!.project(a.pos, a.floor) }];
    });
  });
  const playing = $derived(Object.values(S.zone).filter(z => z.session).length);
</script>

<div class="mh">
  <div class="stage" bind:this={host} style="height:{height}px">
    <canvas bind:this={canvas} onpointerdown={pd} onpointermove={pm} onpointerup={pu} aria-label="Дом: где что играет. Тап по комнате — её зона"></canvas>
    {#each labels as l (l.id)}
      <button class="lb" class:on={!!l.what} class:sel={l.sel} style="left:{l.x}px; top:{l.y}px" onclick={() => pickRoom(l.id)}>
        <b>{l.name}</b>{#if l.what}<span>{#if l.playing}<i class="eq" aria-hidden="true"><i></i><i></i><i></i></i>{/if}{l.what}</span>{/if}
      </button>
    {/each}
  </div>
  {#if caption}<p class="cap">{playing ? `Играет в ${playing} ${playing === 1 ? 'зоне' : 'зонах'} · тап по комнате — её зона` : 'Всё выключено. Нажмите на комнату'}</p>{/if}
</div>

<style>
  .mh { display: flex; flex-direction: column; gap: 4px; }
  .stage { position: relative; overflow: hidden; touch-action: pan-y; margin: 0 -8px; }
  :global(.tablet) .stage { margin: 0; }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: grab; }
  .lb { position: absolute; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; max-width: 130px; padding: 3px 8px; border-radius: 9px;
    border: 1px solid var(--border); background: var(--surface-solid); color: var(--sub); font: 500 11.5px/1.2 var(--font-ui); white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,.18); }
  .lb.on { color: var(--text); border-color: var(--accent-border); }
  .lb.sel { outline: 2px solid var(--accent); outline-offset: 1px; }
  .lb b { font-weight: 500; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .lb span { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--accent-text); overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .eq { display: inline-flex; gap: 1.5px; align-items: flex-end; height: 9px; flex: none; }
  .eq i { width: 2px; background: currentColor; border-radius: 1px; animation: eq .9s ease-in-out infinite alternate; }
  .eq i:nth-child(2) { animation-delay: -.3s; } .eq i:nth-child(3) { animation-delay: -.6s; }
  @keyframes eq { from { height: 2px; } to { height: 9px; } }
  @media (prefers-reduced-motion: reduce) { .eq i { animation: none; height: 6px; } }
  .cap { margin: 0 0 4px 4px; font-size: 12.5px; color: var(--muted); }
  :global([data-trend="minimal"]) .lb { border-radius: 0; }
</style>
