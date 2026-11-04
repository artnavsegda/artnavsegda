<script lang="ts">
  import { theme } from '../client/theme.svelte';
  // Слайдер уровня. Пока палец на слайдере, показываем локальное значение
  // и шлём команды не чаще 8 раз в секунду; после отпускания — финальное.
  let { value, onchange, min = 0, max = 100, step = 1, label = '', unit = '%', tall = false, color = '' }:
    { value: number; onchange: (v: number) => void; min?: number; max?: number; step?: number; label?: string; unit?: string; tall?: boolean; color?: string } = $props();

  let el: HTMLDivElement;
  let local = $state<number | null>(null);
  let lastSent = 0;
  const shown = $derived(local ?? value);
  const frac = $derived((shown - min) / (max - min));
  const skin = $derived(theme.t.skins.slider);

  function at(e: PointerEvent) {
    const r = el.getBoundingClientRect();
    const f = tall ? 1 - (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
    const v = min + Math.max(0, Math.min(1, f)) * (max - min);
    return Math.round(v / step) * step;
  }
  function down(e: PointerEvent) { el.setPointerCapture(e.pointerId); local = at(e); push(false); }
  function move(e: PointerEvent) { if (local === null) return; local = at(e); push(false); }
  function up() { if (local === null) return; push(true); const v = local; setTimeout(() => { if (local === v) local = null; }, 600); }
  function push(final: boolean) { const n = performance.now(); if (final || n - lastSent > 120) { lastSent = n; onchange(local!); } }
  function key(e: KeyboardEvent) {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? step * 5 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -step * 5 : 0;
    if (d) { e.preventDefault(); onchange(Math.max(min, Math.min(max, value + d))); }
  }
</script>

<div bind:this={el} class="sl s-{skin}" class:tall class:drag={local !== null} role="slider" tabindex="0" aria-label={label}
  aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.round(shown)}
  onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onkeydown={key}
  style="--f:{frac}; {color ? `--fill:${color}` : ''}">
  <div class="track"><div class="fill"></div></div>
  {#if skin === 'hairline'}<div class="knob"></div>{/if}
  <span class="val num">{Math.round(shown)}{unit}</span>
</div>

<style>
  .sl { position: relative; touch-action: none; cursor: pointer; -webkit-user-select: none; user-select: none; }
  .fill { position: absolute; inset: 0 auto 0 0; background: var(--fill); }
  .sl:not(.drag) .fill, .sl:not(.drag) .knob { transition: width var(--dur-l) var(--spring-soft), height var(--dur-l) var(--spring-soft), left var(--dur-l) var(--spring-soft), bottom var(--dur-l) var(--spring-soft); }

  .sl.s-fill { height: 52px; }
  .sl.s-fill .track { position: absolute; inset: 0; border-radius: var(--r-md); background: var(--track); overflow: hidden; }
  .sl.s-fill .fill { width: calc(var(--f) * 100%); border-radius: inherit; }
  .sl.s-fill .val { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 15px; font-weight: 500; mix-blend-mode: difference; color: #fff; }
  .sl.s-fill.drag .track { transform: scaleY(1.06); }
  .sl.s-fill .track { transition: transform var(--dur-m) var(--spring); }

  .sl.s-fill.tall { height: 100%; width: 100%; min-height: 220px; }
  .sl.s-fill.tall .track { border-radius: calc(var(--r-xl) + 4px); }
  .sl.s-fill.tall .fill { inset: auto 0 0 0; width: 100%; height: calc(var(--f) * 100%); border-radius: 0; background: var(--fill); }
  .sl.s-fill.tall .val { right: auto; left: 50%; top: 22px; transform: translateX(-50%); font-size: 20px; }

  .sl.s-hairline { height: 44px; }
  .sl.s-hairline .track { position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--border-strong); }
  .sl.s-hairline .fill { height: 3px; top: -1px; width: calc(var(--f) * 100%); background: var(--text); }
  .sl.s-hairline .knob { position: absolute; top: 50%; left: calc(var(--f) * 100%); width: 3px; height: 22px; margin: -11px 0 0 -1.5px; background: var(--accent); }
  .sl.s-hairline .val { position: absolute; right: 0; top: -6px; font-size: 12px; color: var(--muted); }
  .sl.s-hairline.tall { height: 100%; width: 100%; min-height: 220px; }
  .sl.s-hairline.tall .track { left: 50%; right: auto; top: 0; bottom: 0; width: 1px; height: auto; }
  .sl.s-hairline.tall .fill { inset: auto auto 0 -1px; width: 3px; height: calc(var(--f) * 100%); top: auto; }
  .sl.s-hairline.tall .knob { left: 50%; top: auto; bottom: calc(var(--f) * 100%); width: 44px; height: 3px; margin: 0 0 -1.5px -22px; }
  .sl.s-hairline.tall .val { top: 0; right: 0; font-size: 14px; }
</style>
