<script lang="ts">
  import Icon from './Icon.svelte';
  import { home, runScene } from '../client/store.svelte';
  import { sceneOrder, sceneIcon } from '../client/derive.svelte';
  // Сцены дома. Плитки в тёплом тренде, нумерованный список в минимализме.
  let { layout = 'grid', limit = 6 }: { layout?: 'grid' | 'row'; limit?: number } = $props();
  const list = $derived(sceneOrder().slice(0, limit));
</script>

<div class="scenes {layout}" role="group" aria-label="Сцены">
  {#each list as s, i}
    <button class="sc press" class:on={home.s?.scene === s.id} aria-pressed={home.s?.scene === s.id} onclick={() => runScene(s.id)}>
      <span class="ic"><Icon name={sceneIcon[s.id]} size={20} /></span>
      <span class="ix num">0{i + 1}</span>
      <b>{s.name}</b>
    </button>
  {/each}
</div>

<style>
  .scenes.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .scenes.row { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 0 16px; }
  .scenes.row::-webkit-scrollbar { display: none; }
  .sc { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 12px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--surface); text-align: left; min-width: 0; }
  .row .sc { flex: none; width: 104px; }
  .sc b { font-weight: 500; font-size: 14px; }
  .ic { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: var(--surface-2); color: var(--sub); transition: background-color var(--dur-m), color var(--dur-m); }
  .ix { display: none; }
  .sc.on { background: var(--accent-soft); border-color: var(--accent-border); }
  .sc.on .ic { background: var(--accent); color: var(--on-accent); }

  :global([data-trend="minimal"]) .scenes.grid { grid-template-columns: 1fr 1fr; gap: 0; border-top: 1px solid var(--border); }
  :global([data-trend="minimal"]) .sc { flex-direction: row; align-items: center; gap: 10px; border: 0; border-bottom: 1px solid var(--border); border-radius: 0; background: transparent; padding: 14px 4px; }
  :global([data-trend="minimal"]) .scenes.row .sc { width: auto; border: 1px solid var(--border-strong); padding: 0 14px; height: 44px; }
  :global([data-trend="minimal"]) .ic { display: none; }
  :global([data-trend="minimal"]) .ix { display: inline; font-size: 11px; color: var(--muted); }
  :global([data-trend="minimal"]) .sc b { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; font-weight: 600; }
  :global([data-trend="minimal"]) .sc.on { background: transparent; }
  :global([data-trend="minimal"]) .sc.on b, :global([data-trend="minimal"]) .sc.on .ix { color: var(--accent); }
  :global([data-trend="minimal"]) .scenes.row .sc.on { background: var(--inv-bg); border-color: var(--inv-bg); }
  :global([data-trend="minimal"]) .scenes.row .sc.on b { color: var(--inv-text); }
</style>
