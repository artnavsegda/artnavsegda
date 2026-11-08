<script lang="ts">
  import DeviceTile from './DeviceTile.svelte';
  import Icon from './Icon.svelte';
  import { cmd, dev } from '../client/store.svelte';
  import { go } from '../client/router.svelte';
  import { groupsIn, isOn, type GroupId } from '../client/nav.svelte';
  import { fmtT } from '../client/derive.svelte';

  // Устройства комнаты по группам. Одинаково для гостиной на 15 устройств и холла на 2:
  // группа знает своё общее действие, большие группы сворачиваются.
  let { room, compact = false }: { room: string; compact?: boolean } = $props();
  const groups = $derived(groupsIn(room));
  let open = $state<Record<string, boolean>>({});
  const LIMIT = 6;

  function groupAction(id: GroupId, ids: string[], anyOn: boolean) {
    if (id === 'light') ids.forEach((t, i) => setTimeout(() => cmd({ cmd: 'light.set', target: t, on: !anyOn }), i * 60));
    if (id === 'shades') ids.forEach(t => cmd({ cmd: 'shade.set', target: t, position: anyOn ? 0 : 100 }));
  }
</script>

<div class="body" class:compact>
  {#each groups as g (g.id)}
    {@const on = g.devices.filter(isOn).length}
    {@const shown = open[g.id] || g.devices.length <= LIMIT + 1 ? g.devices : g.devices.slice(0, LIMIT)}
    <section class="grp" aria-label={g.name}>
      <header>
        <span class="gn"><Icon name={g.icon} size={16} />{g.name}<span class="num cnt">{on ? `${on} из ${g.devices.length}` : g.devices.length}</span></span>
        {#if g.id === 'light' && g.devices.length > 1}
          <button class="ga press" onclick={() => groupAction('light', g.devices.map(d => d.id), on > 0)}>{on ? 'Выключить все' : 'Включить все'}</button>
        {:else if g.id === 'shades' && g.devices.length > 1}
          <button class="ga press" onclick={() => groupAction('shades', g.devices.map(d => d.id), on > 0)}>{on ? 'Закрыть все' : 'Открыть все'}</button>
        {:else if g.id === 'media'}
          <button class="ga press" onclick={() => go('media', room)}>Пульт<Icon name="next" size={14} /></button>
        {:else if g.id === 'climate' && g.devices.some(d => d.caps.includes('climate'))}
          <button class="ga press" onclick={() => go('climate', room)}>{fmtT(dev(g.devices.find(d => d.caps.includes('climate'))!.id).current)}°<Icon name="next" size={14} /></button>
        {/if}
      </header>
      <div class="rows">
        {#each shown as d, i (d.id)}<DeviceTile id={d.id} delay={.04 * i} />{/each}
      </div>
      {#if shown.length < g.devices.length}
        <button class="more press" onclick={() => (open[g.id] = true)}>Ещё {g.devices.length - shown.length}<Icon name="down" size={14} /></button>
      {/if}
    </section>
  {:else}
    <p class="label">Управляемых устройств нет</p>
  {/each}
</div>

<style>
  .body { display: flex; flex-direction: column; gap: 18px; }
  .compact { gap: 14px; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; min-height: 30px; }
  .gn { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: var(--sub); }
  .cnt { font-weight: 400; color: var(--muted); font-size: 12px; }
  .ga { height: 30px; padding: 0 10px; border-radius: var(--r-pill); border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 12.5px; font-weight: 500;
    display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; }
  .rows { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr)); gap: 10px; }
  :global(.phone) .rows { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .more { margin-top: 6px; height: 34px; width: 100%; border-radius: var(--r-md); border: 1px dashed var(--border-strong); background: none; color: var(--sub); font-size: 13px;
    display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
  :global([data-trend="minimal"]) .gn { text-transform: uppercase; letter-spacing: .12em; font-size: 11px; color: var(--muted); }
  :global([data-trend="minimal"]) .ga, :global([data-trend="minimal"]) .more { border-radius: 0; }
</style>
