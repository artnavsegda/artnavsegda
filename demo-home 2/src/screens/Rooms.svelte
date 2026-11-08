<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import PlanSvg from '../ui/PlanSvg.svelte';
  import DeviceRow from '../ui/DeviceRow.svelte';
  import { house, floors, roomById, floorOf } from '../core/house';
  import { theme } from '../client/theme.svelte';
  import { go } from '../client/router.svelte';
  import { fmtT, pluralPeople } from '../client/derive.svelte';
  import { roomsOnFloor, roomStatus, hereRoom, search, multiFloor, floorName } from '../client/nav.svelte';

  // «Где»: все помещения объекта по этажам. Поиск — самый короткий путь в большом доме:
  // «детская телевизор» находит устройство за два нажатия.
  let { arg = '' }: { arg?: string } = $props();
  let q = $state('');
  let view = $state<'list' | 'plan'>('list');
  let floor = $state(floorOf(hereRoom()));
  const res = $derived(search(q));
  const here = $derived(hereRoom());
  const read = (k: string) => { try { return sessionStorage.getItem(k) ?? ''; } catch { return ''; } };
  q = read('rooms.q');
  $effect(() => { try { sessionStorage.setItem('rooms.q', q); } catch { /* нет хранилища */ } });
</script>

<div class="scr {theme.profile}">
  <header class="rise">
    <div class="ht">
      <h1>Комнаты</h1>
      <span class="label">{house.rooms.length} помещений{multiFloor ? ` · ${floors.length} этажа` : ''}</span>
    </div>
    <label class="search">
      <Icon name="search" size={20} />
      <input type="search" placeholder="Комната или устройство: «детская телевизор»" bind:value={q} aria-label="Поиск по дому" />
      {#if q}<button class="clr" aria-label="Очистить" onclick={() => (q = '')}><Icon name="x" size={16} /></button>{/if}
    </label>
  </header>

  {#if q.trim()}
    <section class="results rise" aria-live="polite">
      {#if res.rooms.length}
        <h2 class="sh">Комнаты</h2>
        <div class="list">
          {#each res.rooms as r}
            <button class="rr press" onclick={() => go('room', r.id)}><b>{r.name}</b><span class="label">{floorName(r.id)}</span><Icon name="next" size={18} /></button>
          {/each}
        </div>
      {/if}
      {#if res.devices.length}
        <h2 class="sh">Устройства</h2>
        <div class="devs">
          {#each res.devices as d (d.id)}
            <div class="hit">
              <button class="where" onclick={() => go('room', d.room)}>{roomById[d.room].name}{multiFloor ? ` · ${floorName(d.room)}` : ''}<Icon name="next" size={12} /></button>
              <DeviceRow id={d.id} />
            </div>
          {/each}
        </div>
      {/if}
      {#if !res.rooms.length && !res.devices.length}<p class="label">Ничего не нашлось. Попробуйте «свет», «шторы», название комнаты.</p>{/if}
    </section>
  {:else}
    <div class="tools rise" style="animation-delay:.04s">
      <Segmented label="Вид" value={view} options={[{ id: 'list', name: 'Список' }, { id: 'plan', name: 'План' }]} onchange={(v) => (view = v as typeof view)} />
    </div>

    {#if view === 'plan'}
      <section class="card plancard rise" style="animation-delay:.06s">
        {#if multiFloor}
          <div class="floors">
            {#each floors as f}<button class="chip press" class:on={f.id === floor} onclick={() => (floor = f.id)}>{f.name}</button>{/each}
          </div>
        {/if}
        <PlanSvg {floor} selected={here} onselect={(id) => go('room', id)} compact={theme.profile === 'phone'} />
        <p class="label">Нажмите на комнату, чтобы открыть её.</p>
      </section>
    {:else}
      {#each floors as f, fi}
        <section class="floor rise" style="animation-delay:{0.06 + fi * 0.04}s" aria-label={f.name}>
          {#if multiFloor}<h2 class="sh">{f.name}<span class="num">&nbsp;· {roomsOnFloor(f.id).length}</span></h2>{/if}
          <div class="list">
            {#each roomsOnFloor(f.id) as r (r.id)}
              {@const s = roomStatus(r.id)}
              <button class="rr press" class:here={r.id === here} onclick={() => go('room', r.id)}>
                <span class="nm">
                  <b>{r.name}</b>
                  {#if r.id === here}<span class="tag">вы здесь</span>{/if}
                </span>
                <span class="st num">
                  {#if s.temp !== undefined}<span>{fmtT(s.temp)}°</span>{/if}
                  {#if s.lights}<span class="lit"><Icon name="bulb" size={14} />{s.lights}</span>{/if}
                  {#if s.media}<span class="med"><Icon name={s.media.caps.includes('speaker') ? 'speaker' : 'media'} size={14} /></span>{/if}
                  {#if s.people}<span class="pp" title={pluralPeople(s.people)}><i></i>{s.people}</span>{:else if s.here}<span class="pp"><i></i></span>{/if}
                </span>
                <Icon name="next" size={18} />
              </button>
            {/each}
          </div>
        </section>
      {/each}
    {/if}
  {/if}
</div>

<style>
  .scr { display: flex; flex-direction: column; gap: 18px; padding: max(24px, env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) 80px 28px; max-width: 1100px; }
  .phone { padding: max(20px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 24px max(16px, env(safe-area-inset-left, 0px)); gap: 16px; }
  header { display: flex; flex-direction: column; gap: 14px; }
  .ht { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  h1 { font-size: clamp(30px, 4vw, 44px); }
  .search { display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 14px; border-radius: var(--r-pill); background: var(--surface); border: 1px solid var(--border-strong); color: var(--muted); }
  .search input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; font-size: 16px; color: var(--text); outline: none; }
  .search input::-webkit-search-cancel-button { display: none; }
  .clr { border: 0; background: var(--surface-2); width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; color: var(--sub); }
  .tools { display: flex; }
  .tools :global(.seg) { width: 240px; }
  .sh { font-size: 15px; font-family: var(--font-ui); font-weight: 600; letter-spacing: 0; margin-bottom: 10px; }
  .sh .num { color: var(--muted); font-weight: 400; }
  .floor { display: flex; flex-direction: column; }
  .list { display: grid; gap: 8px; }
  .tablet .list { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  .rr { display: flex; align-items: center; gap: 10px; min-height: 60px; padding: 0 12px 0 16px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--surface); text-align: left; color: var(--text); }
  .rr.here { border-color: var(--accent-border); background: var(--accent-soft); }
  .nm { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0; }
  .nm b { font-weight: 500; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tag { font-size: 11px; padding: 2px 7px; border-radius: 999px; background: var(--accent); color: var(--on-accent); white-space: nowrap; }
  .st { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--muted); }
  .st > span { display: inline-flex; align-items: center; gap: 3px; }
  .lit { color: var(--accent-text); }
  .med { color: var(--cool-text); }
  .pp i { width: 8px; height: 8px; border-radius: 50%; background: var(--cool); display: inline-block; }
  .results { display: flex; flex-direction: column; gap: 8px; }
  .devs { display: grid; gap: 12px; }
  .tablet .devs { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
  .hit { display: flex; flex-direction: column; gap: 4px; }
  .where { align-self: flex-start; border: 0; background: none; padding: 0 2px; font-size: 12px; color: var(--muted); display: inline-flex; align-items: center; gap: 2px; }
  .rr .label { margin-left: auto; }
  .plancard { padding: 16px; display: flex; flex-direction: column; gap: 10px; background: var(--paper); }
  .floors { display: flex; gap: 6px; flex-wrap: wrap; }
  .floors .chip { height: 36px; font-size: 13px; }
  :global([data-trend="minimal"]) .search, :global([data-trend="minimal"]) .rr, :global([data-trend="minimal"]) .tag { border-radius: 0; }
  :global([data-trend="minimal"]) .sh { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: var(--muted); }
</style>
