<script lang="ts">
  import PlanSvg from '../ui/PlanSvg.svelte';
  import Scenes from '../ui/Scenes.svelte';
  import Events from '../ui/Events.svelte';
  import DeviceRow from '../ui/DeviceRow.svelte';
  import Icon from '../ui/Icon.svelte';
  import Swap from '../ui/Swap.svelte';
  import { house, roomById, devicesIn } from '../core/house';
  import { home } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { go } from '../client/router.svelte';
  import { greeting, dateLine, lightsOn, people, roomTemp, fmtT, pluralPeople } from '../client/derive.svelte';

  let { arg = '' }: { arg?: string } = $props();
  let room = $state(arg && roomById[arg] ? arg : 'living');
  const r = $derived(roomById[room]);
  const devs = $derived(devicesIn(room));
  const total = $derived(Object.values(home.s?.presence ?? {}).reduce((a, b) => a + b, 0));
  const secName = { disarmed: 'Охрана снята', perimeter: 'Периметр под охраной', full: 'Полная охрана' };
</script>

<div class="scr {theme.profile}">
  <header class="rise">
    <div>
      <div class="label">{dateLine()}</div>
      <h1>{greeting()}</h1>
    </div>
    <div class="facts">
      <span class="fact"><Icon name="person" size={18} />{total ? pluralPeople(total) + ' дома' : 'Дома никого'}</span>
      <span class="fact"><Icon name="bulb" size={18} /><span class="num">{lightsOn()}</span> светильников</span>
      <span class="fact"><Icon name="bolt" size={18} /><span class="num">{((home.s?.power ?? 0) / 1000).toFixed(1).replace('.', ',')}</span> кВт</span>
      <button class="fact press" onclick={() => go('security')}><Icon name="shield" size={18} />{secName[home.s?.security.mode ?? 'disarmed']}</button>
    </div>
  </header>

  <section class="card plancard rise" style="animation-delay:.08s" aria-label="План дома">
    <div class="floors">
      <span class="chip on">1 этаж</span><span class="chip dis" title="В демо только первый этаж">2 этаж</span><span class="chip dis">Участок</span>
    </div>
    <div class="planwrap"><PlanSvg selected={room} onselect={(id) => (room = id)} compact={theme.profile === 'phone'} /></div>
    <div class="legend">
      <span><i class="lg light"></i>свет</span><span><i class="lg pres"></i>присутствие</span><span><i class="lg walk"></i>движение по дому</span>
    </div>
  </section>

  <aside class="side">
    <section class="rise" style="animation-delay:.14s">
      <h2 class="sh">Сцены</h2>
      <Scenes layout={theme.profile === 'phone' ? 'row' : 'grid'} />
    </section>

    <section class="card roomcard rise" style="animation-delay:.2s">
      <Swap key={room} index={house.rooms.findIndex(x => x.id === room)}>
        <div class="rh">
          <div>
            <h2>{r.name}</h2>
            <span class="label num">{r.area} м²{roomTemp(room) !== undefined ? ` · ${fmtT(roomTemp(room))}°` : ''}{people(room) ? ` · ${pluralPeople(people(room))}` : ''}</span>
          </div>
          {#if r.photo}
            <button class="chip press" onclick={() => go('room', room)}>Фото<Icon name="next" size={16} /></button>
          {/if}
        </div>
        <div class="devs">
          {#each devs as d, i (d.id)}
            <DeviceRow id={d.id} />
          {:else}
            <p class="label">Устройств нет</p>
          {/each}
        </div>
      </Swap>
    </section>

    {#if theme.profile === 'tablet'}
      <section class="card evcard rise" style="animation-delay:.26s">
        <h2 class="sh">Лента</h2>
        <Events limit={4} />
      </section>
    {/if}
  </aside>
</div>

<style>
  .scr { display: grid; gap: 20px; padding: max(24px, env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) 28px 28px; }
  .tablet { grid-template-columns: minmax(0, 1fr) minmax(300px, 360px); grid-template-rows: auto minmax(0, 1fr); height: var(--screen-h); min-height: 600px; }
  .tablet header { grid-column: 1 / -1; }
  .phone { grid-template-columns: minmax(0, 1fr); padding: max(20px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 20px max(16px, env(safe-area-inset-left, 0px)); gap: 18px; }
  header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  h1 { font-size: clamp(30px, 4vw, 44px); margin-top: 6px; }
  .label:first-letter { text-transform: uppercase; }
  .facts { display: flex; gap: 8px; flex-wrap: wrap; }
  .fact { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px; border-radius: var(--r-pill); background: var(--surface-2); border: 0; color: var(--sub); font-size: 14px; }
  .phone .facts { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
  .phone .fact { font-size: 13px; padding: 0 12px; min-width: 0; white-space: nowrap; overflow: hidden; }

  .plancard { position: relative; padding: 18px; overflow: hidden; background: var(--paper); }
  .tablet .plancard { min-height: 0; height: 100%; display: flex; flex-direction: column; }
  .floors { display: flex; gap: 6px; margin-bottom: 8px; }
  .floors .chip { height: 34px; font-size: 13px; padding: 0 14px; }
  .chip.dis { opacity: .45; }
  .planwrap { flex: 1; min-height: 0; display: grid; place-items: center; }
  .tablet .planwrap { container-type: size; }
  .tablet .planwrap :global(.plan) { width: min(100cqw, 128.125cqh); }
  .legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--muted); margin-top: 8px; }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .lg { width: 10px; height: 10px; border-radius: 50%; }
  .lg.light { background: #FFD08A; box-shadow: 0 0 8px #FFB45E; }
  .lg.pres { background: var(--presence-floor); border: 1px solid var(--cool); }
  .lg.walk { background: var(--cool); }

  .side { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
  .tablet .side { min-height: 0; overflow-y: auto; scrollbar-width: none; padding-bottom: 60px; }
  .sh { font-size: 15px; font-family: var(--font-ui); font-weight: 600; letter-spacing: 0; margin-bottom: 10px; }
  .roomcard { padding: 16px; }
  .rh { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
  .rh h2 { font-size: 24px; }
  .rh .chip { height: 36px; padding: 0 10px 0 14px; font-size: 13px; }
  .devs { display: flex; flex-direction: column; gap: 6px; }
  .evcard { padding: 16px; }
  :global([data-trend="minimal"]) .sh { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: var(--muted); font-weight: 600; }
  :global([data-trend="minimal"]) .fact { background: transparent; border: 1px solid var(--border); border-radius: 2px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
  :global([data-trend="minimal"]) .lg { border-radius: 0; }
</style>
