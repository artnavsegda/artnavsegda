<script lang="ts">
  import type { Snippet } from 'svelte';
  import { house } from '../core/house';
  import { theme } from '../client/theme.svelte';
  import { dev, ctColor } from '../client/store.svelte';
  import { Relight } from '../client/gl/relight';

  // Фото интерьера, вписанное как object-fit: cover, + слой «живого» света.
  // Координаты устройств хранятся в пикселях исходника; map() переводит их
  // в координаты контейнера при любом кадрировании — хотспоты не уезжают.

  export type Map = (x: number, y: number) => [number, number];
  let { photo, ox = 0.5, oy = 0.5, lights = [], dim = 0, children, rounded = true }:
    { photo: string; ox?: number; oy?: number; lights?: { id: string; x: number; y: number; r: number }[]; dim?: number; children?: Snippet<[Map, number]>; rounded?: boolean } = $props();

  let box: HTMLDivElement;
  let canvas: HTMLCanvasElement = $state()!;
  let W = $state(0), H = $state(0);
  const p = $derived(house.photos[photo]);
  const s = $derived(p ? Math.max(W / p.w, H / p.h) : 1);
  const dx = $derived(p ? (W - p.w * s) * ox : 0);
  const dy = $derived(p ? (H - p.h * s) * oy : 0);
  const map: Map = (x, y) => [dx + x * s, dy + y * s];

  $effect(() => {
    const ro = new ResizeObserver(([e]) => { W = e.contentRect.width; H = e.contentRect.height; });
    ro.observe(box);
    return () => ro.disconnect();
  });

  let gl: Relight | null = null;
  $effect(() => {
    if (!theme.t.features.relight || !canvas) return;
    gl = new Relight(canvas);
    return () => { gl?.destroy(); gl = null; };
  });
  $effect(() => {
    const L = lights.map(l => {
      const d = dev(l.id);
      const [x, y] = map(l.x, l.y);
      return { x, y, r: l.r * s, color: ctColor(d.ct), level: (d.level ?? 0) / 100 * (theme.night ? .55 : .32) };
    });
    gl?.set(L);
  });
</script>

<div class="ph" class:rounded bind:this={box}>
  {#if p}
    {#key p.src}
      <img src={p.src} alt="" style="object-position: {ox * 100}% {oy * 100}%" class:day={!theme.night} draggable="false" />
    {/key}
  {/if}
  <div class="dim" style="opacity:{dim}"></div>
  {#if theme.t.features.relight}<canvas bind:this={canvas}></canvas>{/if}
  {#if children && W}{@render children(map, s)}{/if}
</div>

<style>
  .ph { position: relative; overflow: hidden; background: #0b0b0c; isolation: isolate; }
  .ph.rounded { border-radius: var(--r-xl); }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: ph-in 1.2s var(--ease-out) both; -webkit-user-select: none; user-select: none; }
  img.day { filter: saturate(.95) brightness(1.04); }
  @keyframes ph-in { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: none; } }
  .dim { position: absolute; inset: 0; background: #06070a; transition: opacity 1.6s var(--ease-light); pointer-events: none; }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; mix-blend-mode: screen; pointer-events: none; }
</style>
