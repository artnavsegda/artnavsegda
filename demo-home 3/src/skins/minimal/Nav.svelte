<script lang="ts">
  import { go, type RouteName } from '../../client/router.svelte';
  import { navItems, isActive, armed } from '../nav.svelte';
  // «Минимализм» — базовая навигация: плоская полоса, подписи капителью, активная — линия акцента сверху.
  let { current }: { current: RouteName } = $props();
  const items = $derived(navItems());
</script>

<nav class="tabs" aria-label="Разделы">
  {#each items as r (r.name)}
    {@const on = isActive(current, r.name)}
    <button class:on aria-current={on ? 'page' : undefined} onclick={() => go(r.name)}>
      <span>{r.title}</span>{#if r.name === 'security' && armed()}<i class="badge"></i>{/if}
    </button>
  {/each}
</nav>

<style>
  .tabs { position: fixed; z-index: 20; left: 0; right: 0; bottom: 0; display: flex; height: calc(56px + env(safe-area-inset-bottom, 0px)); padding: 0 env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
    background: var(--bg); border-top: 1px solid var(--border-strong); }
  button { position: relative; flex: 1; border: 0; border-top: 2px solid transparent; margin-top: -1px; background: none; color: var(--muted); font: 600 11px var(--font-ui); letter-spacing: .1em; text-transform: uppercase; transition: color var(--dur-s); }
  button.on { color: var(--text); border-top-color: var(--accent); }
  .badge { position: absolute; top: 12px; right: 14%; width: 5px; height: 5px; background: var(--accent); }
</style>
