<script lang="ts">
  import Icon from './Icon.svelte';
  import { theme } from '../client/theme.svelte';
  import { routes, go, type RouteName } from '../client/router.svelte';
  import { home } from '../client/store.svelte';
  let { current }: { current: RouteName } = $props();
  const icons: Record<string, string> = { home: 'room', plan: 'plan', rooms: 'door', overview: 'grid', house: 'house', media: 'media', climate: 'climate', security: 'shield' };
  const items = $derived(routes.filter(r => theme.profile === 'tablet' ? r.tablet : r.phone));
  const armed = $derived(home.s?.security.mode !== 'disarmed');
  const active = (n: string) => n === current || routes.find(r => r.name === current)?.parent === n;
</script>

{#if theme.profile === 'tablet' && theme.t.skins.nav === 'rail'}
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
{:else if theme.profile === 'tablet'}
  <nav class="top" aria-label="Разделы">
    <b class="mark">ДЕМО—ДОМ</b>
    <div class="links">
      {#each items as r, i}
        <button class:on={active(r.name)} aria-current={active(r.name) ? 'page' : undefined} onclick={() => go(r.name)}>
          <span class="num">0{i + 1}</span>{r.title}{#if r.name === 'security' && armed}<i class="badge"></i>{/if}
        </button>
      {/each}
    </div>
  </nav>
{:else if current !== 'ar' && current !== 'lamp' && current !== 'photo'}
  <nav class="tabs {theme.t.skins.tabbar}" aria-label="Разделы">
    {#each items as r}
      <button class="press" class:on={active(r.name)} aria-current={active(r.name) ? 'page' : undefined} onclick={() => go(r.name)}>
        {#if theme.t.skins.tabbar === 'floating'}<Icon name={icons[r.name]} size={22} />{/if}
        <span>{r.title}</span>
        {#if r.name === 'security' && armed}<i class="badge"></i>{/if}
      </button>
    {/each}
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
  .links { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
  .top button { position: relative; height: 64px; border: 0; background: none; padding: 0 12px; display: flex; align-items: center; gap: 8px; color: var(--muted);
    font-size: 12px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; border-bottom: 2px solid transparent; white-space: nowrap; transition: color var(--dur-s); }
  .top button .num { font-size: 11px; color: var(--muted); font-weight: 400; }
  .top button.on { color: var(--text); border-bottom-color: var(--accent); }
  .top .badge { position: static; width: 6px; height: 6px; border-radius: 0; box-shadow: none; background: var(--accent); }

  .tabs { position: fixed; z-index: 20; left: 0; right: 0; bottom: 0; display: flex; }
  .tabs button { position: relative; flex: 1; border: 0; background: none; color: var(--muted); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
  .tabs.floating { left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); height: 68px; padding: 6px; border-radius: 26px;
    background: var(--glass); border: 1px solid var(--border); -webkit-backdrop-filter: blur(24px) saturate(1.4); backdrop-filter: blur(24px) saturate(1.4); box-shadow: 0 16px 40px rgba(0,0,0,.25); }
  .tabs.floating button { border-radius: 20px; font-size: 11px; font-weight: 500; }
  .tabs.floating button.on { color: var(--accent-text); background: var(--accent-soft); }
  .tabs.floating .badge { top: 8px; right: calc(50% - 18px); }
  .tabs.flat { height: calc(56px + env(safe-area-inset-bottom, 0px)); padding-bottom: env(safe-area-inset-bottom, 0px); background: var(--bg); border-top: 1px solid var(--border-strong); }
  .tabs.flat button { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; border-top: 2px solid transparent; margin-top: -1px; }
  .tabs.flat button.on { color: var(--text); border-top-color: var(--accent); }
  .tabs.flat .badge { top: 12px; right: 14%; width: 5px; height: 5px; border-radius: 0; box-shadow: none; background: var(--accent); }
</style>
