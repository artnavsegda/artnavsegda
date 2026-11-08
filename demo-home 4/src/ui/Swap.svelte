<script lang="ts">
  import type { Snippet } from 'svelte';
  import { theme } from '../client/theme.svelte';

  // Смена объекта внутри виджета: другая комната, другое устройство.
  // Состояние не «перетекает» из одного объекта в другой — меняется сам виджет:
  // старый уезжает, новый въезжает со стороны, куда листаем (как страницы карусели).
  // Тренд задаёт характер: тёплый — сдвиг с размытием, минимализм — короткая смена.
  let { key, index, children, onswipe, class: cls = '' }:
    { key: string; index: number; children: Snippet; onswipe?: (dir: 1 | -1) => void; class?: string } = $props();

  let dir = 1;
  let prev = index;
  $effect.pre(() => { if (index !== prev) { dir = index > prev ? 1 : -1; prev = index; } });

  const expoOut = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const easeIn = (t: number) => t * t * t;

  function enter(_: Element) {
    const d = dir;
    if ((theme.t.id === 'minimal' || theme.t.id === 'brutal')) return { duration: 220, css: (t: number) => `opacity:${t}` };
    return { duration: 640, easing: expoOut, css: (t: number, u: number) => `transform: translateX(${d * u * 34}%) scale(${0.97 + 0.03 * t}); opacity:${t}; filter: blur(${u * 8}px)` };
  }
  function leave(_: Element) {
    const d = dir;
    if ((theme.t.id === 'minimal' || theme.t.id === 'brutal')) return { duration: 140, css: (t: number) => `opacity:${t}` };
    return { duration: 300, easing: easeIn, css: (t: number, u: number) => `transform: translateX(${-d * u * 28}%) scale(${0.97 + 0.03 * t}); opacity:${t}; filter: blur(${u * 6}px)` };
  }

  // свайп по виджету — листать объекты
  let sx = 0, sy = 0, tracking = false;
  const down = (e: PointerEvent) => { if (!onswipe) return; sx = e.clientX; sy = e.clientY; tracking = true; };
  const up = (e: PointerEvent) => {
    if (!tracking) return; tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) onswipe!(dx < 0 ? 1 : -1);
  };
</script>

<div class="swap {cls}" class:swipe={!!onswipe} onpointerdown={down} onpointerup={up} onpointercancel={() => (tracking = false)} role="presentation">
  {#key key}
    <div class="pane" in:enter out:leave>{@render children()}</div>
  {/key}
</div>

<style>
  .swap { display: grid; overflow: hidden; min-width: 0; }
  .swap.swipe { touch-action: pan-y; }
  .pane { grid-area: 1 / 1; min-width: 0; will-change: transform, opacity; }
</style>
