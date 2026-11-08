<script lang="ts">
  import { floors, stairs, S, lightLevel, anyAlert, hue, type Layer, type Room } from './data.svelte';
  import { ui } from './ui.svelte';

  // Мини-разрез: весь дом в ладони. Показывает слой по всем этажам сразу и переключает этаж.
  let { layer }: { layer: Layer } = $props();
  const fill = (r: Room) => {
    if (layer === 'media') { const m = S.media[r.id]; return m ? `hsl(${hue(m.art)} 45% 42%)` : ''; }
    if (layer === 'security') return anyAlert(r) ? 'var(--danger)' : '';
    if (layer === 'climate') { const t = S.temp[r.id]; if (!t) return ''; const d = t.cur - t.target; return d < -0.6 ? 'rgba(232,128,60,.75)' : d > 0.6 ? 'rgba(90,150,230,.75)' : ''; }
    const l = lightLevel(r); return l ? `rgba(255,190,110,${(0.25 + l * 0.75).toFixed(2)})` : '';
  };
  const above = floors.filter(f => f.id !== 'site' && f.id !== 'f0');
</script>

<div class="mini" role="group" aria-label="Этажи дома">
  <svg class="roof" viewBox="0 0 100 18" preserveAspectRatio="none" aria-hidden="true"><path d="M0 18 L50 1 L100 18" /></svg>
  <div class="body">
    <div class="fls">
      {#each floors as f (f.id)}
        <button class="fl" class:sel={ui.floor === f.id} class:under={f.id === 'f0'} class:site={f.id === 'site'} aria-label={f.name} aria-pressed={ui.floor === f.id} onclick={() => (ui.floor = f.id)}>
          {#each f.rooms as r (r.id)}<span style="flex:{r.weight}; {fill(r) ? `background:${fill(r)}` : ''}"></span>{/each}
        </button>
      {/each}
    </div>
    {#if stairs}
      <button class="st" style="height:calc({above.length} * 25px - 3px)" class:lit={layer === 'light' && lightLevel(stairs) > 0} aria-label="Лестница" onclick={() => (ui.room = stairs!.id)}></button>
    {/if}
  </div>
</div>

<style>
  .mini { width: 132px; flex: none; }
  .roof { display: block; width: calc(100% - 12px); height: 14px; }
  .roof path { fill: var(--surface-2); stroke: var(--border-strong); stroke-width: 1; vector-effect: non-scaling-stroke; }
  .body { display: flex; gap: 3px; align-items: flex-start; }
  .fls { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .fl { height: 22px; display: flex; gap: 2px; padding: 2px; border-radius: 5px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; }
  .fl span { min-width: 0; border-radius: 2px; background: var(--surface-2); transition: background .3s; }
  .fl.sel { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); }
  .fl.under { margin-top: 3px; border-style: dashed; }
  .fl.site { height: 14px; margin-top: 3px; background: none; }
  .st { width: 9px; flex: none; border-radius: 4px; border: 1px solid var(--border); background: repeating-linear-gradient(180deg, var(--surface-2) 0 3px, var(--surface) 3px 5px); padding: 0; margin-top: 0; }
  .st.lit { background: repeating-linear-gradient(180deg, rgba(255,190,110,.7) 0 3px, var(--surface) 3px 5px); }
  :global([data-trend="minimal"]) .fl, :global([data-trend="minimal"]) .fl span, :global([data-trend="minimal"]) .st { border-radius: 0; }
</style>
