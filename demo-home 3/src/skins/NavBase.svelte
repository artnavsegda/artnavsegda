<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import type { Snippet } from 'svelte';
  import { theme } from '../client/theme.svelte';
  import { routes, go, type RouteName } from '../client/router.svelte';
  import { home } from '../client/store.svelte';
  let { current, rail = false, extra }: { current: RouteName; rail?: boolean; extra?: Snippet } = $props();
  // Планшетная навигация «по умолчанию»: колонка с иконками (rail) или верхняя строка. Тренды берут её как основу.
  const icons: Record<string, string> = { home: 'room', plan: 'plan', rooms: 'door', overview: 'grid', house: 'house', media: 'media', climate: 'climate', security: 'shield' };
  const items = $derived(routes.filter(r => theme.profile === 'tablet' ? r.tablet : r.phone));
  const armed = $derived(home.s?.security.mode !== 'disarmed');
  const active = (n: string) => n === current || routes.find(r => r.name === current)?.parent === n;
</script>

{#if rail}
  <nav class="rail" aria-label="Разделы">
    <div class="logo">Д</div>
    {#each items as r}
      <button class="press" class:on={active(r.name)} aria-label={r.title} aria-current={active(r.name) ? 'page' : undefined} onclick={() => go(r.name)}>
        <Icon name={icons[r.name]} size={24} />
        {#if r.name === 'security' && armed}<i class="badge"></i>{/if}
        <span>{r.title}</span>
      </button>
    {/each}
  </nav>
{:else}
  <nav class="top" aria-label="Разделы">
    <b class="mark">ДЕМО—ДОМ</b>
    <div class="links">
      {#each items as r, i}
        <button class:on={active(r.name)} aria-current={active(r.name) ? 'page' : undefined} onclick={() => go(r.name)}>
          <span class="num">0{i + 1}</span>{r.title}{#if r.name === 'security' && armed}<i class="badge"></i>{/if}
        </button>
      {/each}
    </div>
    {#if extra}<span class="sp"></span>{@render extra()}{/if}
  </nav>
{/if}

<style>
  .rail { flex: none; width: 92px; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: max(24px, env(safe-area-inset-top, 0px)) 0 24px max(0px, env(safe-area-inset-left, 0px));
    border-right: 1px solid var(--border); overflow-y: auto; scrollbar-width: none; }
  .logo { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(140deg, #F0B464, #B97A36); display: grid; place-items: center;
    font-family: var(--font-display); font-weight: 600; color: #1A1206; font-size: 19px; margin-bottom: 16px; flex: none; }
  .rail button { position: relative; flex: none; width: 66px; padding: 10px 0 8px; border: 0; border-radius: 18px; background: transparent; color: var(--muted);
    display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .rail button span { font-size: 11px; font-weight: 500; }
  .rail button.on { background: var(--accent-soft); color: var(--accent-text); }
  .badge { position: absolute; top: 8px; right: 16px; width: 8px; height: 8px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 0 3px var(--bg); }

  .top { flex: none; height: 64px; display: flex; align-items: center; gap: 32px; padding: 0 max(28px, env(safe-area-inset-right, 0px)) 0 max(28px, env(safe-area-inset-left, 0px)); border-bottom: 1px solid var(--border); }
  .mark { font-family: var(--font-num); font-size: 13px; letter-spacing: .14em; white-space: nowrap; }
  .sp { flex: 1; }
  .links { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
  .top button { position: relative; height: 64px; border: 0; background: none; padding: 0 12px; display: flex; align-items: center; gap: 8px; color: var(--muted);
    font-size: 12px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; border-bottom: 2px solid transparent; white-space: nowrap; transition: color var(--dur-s); }
  .top button .num { font-size: 11px; color: var(--muted); font-weight: 400; }
  .top button.on { color: var(--text); border-bottom-color: var(--accent); }
  .top .badge { position: static; width: 6px; height: 6px; border-radius: 0; box-shadow: none; background: var(--accent); }

</style>
