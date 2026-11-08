<script lang="ts">
  import Ic from './Icons.svelte';
  import { go, type RouteName } from '../../client/router.svelte';
  import { house } from '../../core/house';
  import { navItems, isActive, armed } from '../nav.svelte';
  // «Нордик»: полка внизу экрана — льняная планка во всю ширину с дубовой кромкой.
  // Под активным значком — шалфейный «камешек», подписи у всех. На планшете — такая же колонка слева.
  let { current, tablet = false }: { current: RouteName; tablet?: boolean } = $props();
  const items = $derived(navItems());
</script>

<nav class="shelf" class:tablet aria-label="Разделы">
  {#if tablet}<div class="mark" aria-hidden="true">{house.name.replace(/^Дом на /, '').slice(0, 1)}</div>{/if}
  {#each items as r (r.name)}
    {@const on = isActive(current, r.name)}
    <button class:on aria-current={on ? 'page' : undefined} onclick={() => go(r.name)}>
      <span class="pb"><Ic name={r.name} size={tablet ? 24 : 23} />{#if r.name === 'security' && armed()}<i class="badge"></i>{/if}</span>
      <span class="lb">{r.title}</span>
    </button>
  {/each}
</nav>

<style>
  .shelf { position: fixed; z-index: 20; left: 0; right: 0; bottom: 0; display: flex; padding: 8px max(6px, env(safe-area-inset-right, 0px)) calc(8px + env(safe-area-inset-bottom, 0px)) max(6px, env(safe-area-inset-left, 0px));
    background-color: var(--surface); background-image: var(--bg-img); border-radius: 26px 26px 0 0; box-shadow: 0 -10px 30px rgba(60,45,25,.12), inset 0 3px 0 -1px var(--wood); }
  .shelf.tablet { position: relative; flex: none; flex-direction: column; align-items: center; gap: 4px; width: 96px; padding: 24px 0; border-radius: 0 28px 28px 0; box-shadow: 10px 0 30px rgba(60,45,25,.1), inset -3px 0 0 -1px var(--wood); }
  .mark { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; margin-bottom: 18px; background-color: var(--wood); background-image: var(--oak); color: #2A2118; font: 400 22px var(--font-display); box-shadow: var(--shadow); }
  button { flex: 1; min-width: 0; border: 0; background: none; color: var(--sub); display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 2px 0; }
  .tablet button { flex: none; width: 84px; padding: 6px 0; }
  .pb { position: relative; width: 60px; height: 32px; border-radius: 16px; display: grid; place-items: center; transition: background-color .5s var(--ease-out), color .5s; }
  .on .pb { background: var(--accent-soft); color: var(--accent-text); }
  .lb { font: 500 11.5px var(--font-ui); white-space: nowrap; }
  .on .lb { color: var(--text); font-weight: 600; }
  .badge { position: absolute; top: 4px; right: 14px; width: 7px; height: 7px; border-radius: 50%; background: var(--clay); box-shadow: 0 0 0 2px var(--surface); }
</style>
