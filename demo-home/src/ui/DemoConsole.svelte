<script lang="ts">
  import Icon from './Icon.svelte';
  import Segmented from './Segmented.svelte';
  import { theme, trends, ui, setTrend, setProfile } from '../client/theme.svelte';
  import { home, cmd } from '../client/store.svelte';
  import { routes, go, type RouteName } from '../client/router.svelte';
  // Пульт демонстратора: не часть продукта. Переключает тренд, время суток,
  // профиль устройства и подбрасывает события, чтобы показать реакцию интерфейса.
  let { current }: { current: RouteName } = $props();
  const screens = routes;
</script>

<button class="fab press" class:open={ui.consoleOpen} class:phone={theme.profile === 'phone' && !theme.framed} aria-expanded={ui.consoleOpen}
  aria-label="Пульт демонстрации" onclick={() => (ui.consoleOpen = !ui.consoleOpen)}>
  <Icon name={ui.consoleOpen ? 'x' : 'sliders'} size={20} />
  {#if !(theme.profile === 'phone' && !theme.framed)}<span>Демо</span>{/if}
</button>

{#if ui.consoleOpen}
  <div class="scrim" onclick={() => (ui.consoleOpen = false)} role="presentation"></div>
  <aside class="panel" class:phone={theme.profile === 'phone' && !theme.framed} aria-label="Пульт демонстрации">
    <header><h3>Пульт демонстрации</h3><span class="label">не входит в продукт</span></header>

    <section>
      <div class="label">Тренд</div>
      <div class="trends">
        {#each trends as t}
          <button class="trend press" class:on={theme.t.id === t.id} onclick={() => setTrend(t.id)}>
            <b>{t.name}</b><span>{t.tagline}</span>
          </button>
        {/each}
      </div>
    </section>

    <section>
      <div class="label">Время на объекте</div>
      <Segmented label="Время суток" value={home.s?.night ? 'night' : 'day'}
        options={[{ id: 'day', name: 'День' }, { id: 'night', name: 'Вечер' }]}
        onchange={(v) => cmd({ cmd: 'demo.time', night: v === 'night' })} />
    </section>

    <section>
      <div class="label">Профиль устройства</div>
      <Segmented label="Профиль" value={ui.profile}
        options={[{ id: 'auto', name: 'Авто' }, { id: 'tablet', name: 'iPad' }, { id: 'phone', name: 'Телефон' }]}
        onchange={(v) => setProfile(v as typeof ui.profile)} />
    </section>

    <section>
      <div class="label">События</div>
      <div class="row">
        <button class="chip press" onclick={() => cmd({ cmd: 'demo.event', kind: 'doorbell' })}><Icon name="bell" size={18} />Звонок</button>
        <button class="chip press" onclick={() => cmd({ cmd: 'demo.event', kind: 'motion' })}><Icon name="cam" size={18} />Движение</button>
        <button class="chip press" onclick={() => cmd({ cmd: 'demo.event', kind: 'leak-test' })}><Icon name="drop" size={18} />Протечка</button>
      </div>
    </section>

    <section>
      <div class="label">Экраны</div>
      <div class="row">
        {#each screens as r}
          <button class="chip press" class:on={current === r.name} onclick={() => { go(r.name); ui.consoleOpen = false; }}>{r.title}</button>
        {/each}
      </div>
    </section>
  </aside>
{/if}

<style>
  .fab { position: fixed; z-index: 60; right: max(16px, env(safe-area-inset-right, 0px)); bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    height: 44px; padding: 0 16px 0 12px; display: flex; align-items: center; gap: 8px; border-radius: 999px; border: 1px solid var(--border-strong);
    background: var(--glass); color: var(--text); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); font-weight: 600; font-size: 13px; box-shadow: 0 10px 30px rgba(0,0,0,.2); }
  .fab.phone { bottom: calc(92px + env(safe-area-inset-bottom, 0px)); width: 40px; height: 40px; padding: 0; justify-content: center; opacity: .8; }
  .fab.open { background: var(--inv-bg); color: var(--inv-text); }
  .scrim { position: fixed; inset: 0; z-index: 58; background: rgba(0,0,0,.25); animation: fade .3s both; }
  .panel { position: fixed; z-index: 59; right: max(16px, env(safe-area-inset-right, 0px)); bottom: calc(72px + env(safe-area-inset-bottom, 0px));
    width: min(380px, calc(100vw - 32px)); max-height: calc(100dvh - 110px); overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 18px;
    border-radius: 26px; background: var(--surface-solid); border: 1px solid var(--border-strong); box-shadow: 0 30px 80px rgba(0,0,0,.4);
    font-family: 'Onest', system-ui, sans-serif; animation: rise .6s var(--ease-out) both; }
  .panel.phone { bottom: calc(148px + env(safe-area-inset-bottom, 0px)); max-height: calc(100dvh - 190px); }
  header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  h3 { font-size: 18px; font-weight: 500; }
  section { display: flex; flex-direction: column; gap: 10px; }
  .trends { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .trend { text-align: left; padding: 12px; border-radius: 16px; border: 1px solid var(--border); background: var(--surface-2); display: flex; flex-direction: column; gap: 4px; }
  .trend b { font-weight: 600; font-size: 14px; }
  .trend span { font-size: 12px; color: var(--muted); }
  .trend.on { border-color: var(--accent-border); background: var(--accent-soft); }
  .row { display: flex; flex-wrap: wrap; gap: 8px; }
  .row .chip { height: 38px; padding: 0 14px; font-size: 13px; }
  :global([data-trend="minimal"]) .panel { border-radius: 4px; box-shadow: none; }
  :global([data-trend="minimal"]) .fab { border-radius: 2px; backdrop-filter: none; background: var(--surface); box-shadow: none; }
  :global([data-trend="minimal"]) .trend { border-radius: 2px; }
</style>
