<script lang="ts">
  import { theme } from '../client/theme.svelte';
  // Круговая шкала температуры. Скин «arc» — дуга с анимируемым @property,
  // скин «ticks» — риски, как на приборе.
  let { value, target, min = 16, max = 28, size = 220, children }: { value: number; target: number; min?: number; max?: number; size?: number; children?: import('svelte').Snippet } = $props();
  const f = (v: number) => Math.max(0, Math.min(1, (v - min) / (max - min)));
  const skin = $derived(theme.t.skins.dial);
  const R = 42, C = 2 * Math.PI * R, SPAN = 0.75;
  const ticks = Array.from({ length: 49 }, (_, i) => i / 48);
  const ang = (t: number) => (135 + t * 270) * Math.PI / 180;
</script>

<div class="g {skin}" style="width:{size}px; height:{size}px; --t:{f(target)}; --v:{f(value)}">
  <svg viewBox="0 0 100 100" aria-hidden="true">
    {#if skin === 'arc'}
      <defs>
        <linearGradient id="garc" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7CC6D6" /><stop offset=".55" stop-color="#F0B464" /><stop offset="1" stop-color="#F07A4A" /></linearGradient>
      </defs>
      <circle class="track" cx="50" cy="50" r={R} stroke-dasharray="{C * SPAN} {C}" transform="rotate(135 50 50)" />
      <circle class="arc" cx="50" cy="50" r={R} style="stroke-dasharray: calc({C * SPAN} * var(--arc)) {C}" transform="rotate(135 50 50)" />
      <circle class="knob" cx={50 + R * Math.cos(ang(f(target)))} cy={50 + R * Math.sin(ang(f(target)))} r="3.6" />
    {:else}
      {#each ticks as t}
        {@const a = ang(t)}
        {@const long = Math.round(t * 48) % 4 === 0}
        <line x1={50 + 44 * Math.cos(a)} y1={50 + 44 * Math.sin(a)} x2={50 + (long ? 37 : 40) * Math.cos(a)} y2={50 + (long ? 37 : 40) * Math.sin(a)}
          class:lit={t <= f(target) + 0.001} class:cur={Math.abs(t - f(value)) < 0.011} />
      {/each}
    {/if}
  </svg>
  <div class="mid">{@render children?.()}</div>
</div>

<style>
  @property --arc { syntax: '<number>'; inherits: true; initial-value: 0; }
  .g { position: relative; --arc: var(--t); transition: --arc 1.2s var(--spring-soft); max-width: 100%; }
  svg { width: 100%; height: 100%; overflow: visible; }
  .track { fill: none; stroke: var(--track); stroke-width: 6; stroke-linecap: round; }
  .arc { fill: none; stroke: url(#garc); stroke-width: 6; stroke-linecap: round; filter: drop-shadow(0 0 4px rgba(240,170,90,.4)); }
  .knob { fill: #fff; stroke: rgba(0,0,0,.2); stroke-width: .6; transition: cx 1.2s var(--spring-soft), cy 1.2s var(--spring-soft); }
  line { stroke: var(--border-strong); stroke-width: .8; transition: stroke .3s; }
  line.lit { stroke: var(--text); }
  line.cur { stroke: var(--accent); stroke-width: 2; }
  .mid { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
</style>
