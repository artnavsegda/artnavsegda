<script lang="ts">
  import Icon from '../../ui/Icon.svelte';
  import { go, type RouteName } from '../../client/router.svelte';
  import { navItems, isActive, armed, navIcons } from '../nav.svelte';
  // «Тёплый вечер» — тяжёлый люкс: тёмная стеклянная панель с латунной кромкой, активная вкладка — тёплый отсвет снизу.
  let { current }: { current: RouteName } = $props();
  const items = $derived(navItems());
</script>

<nav class="dock" aria-label="Разделы">
  {#each items as r (r.name)}
    {@const on = isActive(current, r.name)}
    <button class:on aria-current={on ? 'page' : undefined} onclick={() => go(r.name)}>
      <Icon name={navIcons[r.name]} size={22} />
      <span>{r.title}</span>
      {#if r.name === 'security' && armed()}<i class="badge"></i>{/if}
    </button>
  {/each}
</nav>

<style>
  .dock { position: fixed; z-index: 20; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); height: 68px; padding: 6px; display: flex; gap: 2px; border-radius: 26px;
    background: color-mix(in srgb, var(--glass) 92%, #000); border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
    -webkit-backdrop-filter: blur(26px) saturate(1.5); backdrop-filter: blur(26px) saturate(1.5); box-shadow: 0 18px 44px rgba(0,0,0,.4), inset 0 1px 0 color-mix(in srgb, var(--accent) 18%, transparent); }
  button { position: relative; flex: 1; min-width: 0; border: 0; border-radius: 20px; background: none; color: var(--muted); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    font: 500 11px var(--font-ui); transition: color .4s, background-color .4s; }
  button.on { color: var(--accent-text); background: radial-gradient(90% 90% at 50% 120%, color-mix(in srgb, var(--accent) 34%, transparent), color-mix(in srgb, var(--accent) 6%, transparent) 70%); }
  button.on::after { content: ""; position: absolute; left: 32%; right: 32%; bottom: 3px; height: 2px; border-radius: 1px; background: var(--accent); box-shadow: 0 0 10px var(--accent); }
  span { white-space: nowrap; }
  .badge { position: absolute; top: 8px; right: calc(50% - 18px); width: 7px; height: 7px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 0 2px var(--bg); }
</style>
