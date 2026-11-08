<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Art from './Art.svelte';
  import { S, ui, engine, zonesByFloor, zoneLine, openZone, act, setPref, profile } from './state.svelte';

  // Список зон: сверху «Сейчас» — что где играет, ниже все зоны по этажам.
  // activeOnly: под разрезом дома показываем только то, что играет
  let { activeOnly = false }: { activeOnly?: boolean } = $props();
  const floors = activeOnly ? [] : zonesByFloor();
  const active = $derived(Object.keys(S.zone).filter(id => S.zone[id].session || S.zone[id].plan));
  const iconOf = (id: string) => (engine.zones[id].display ? 'media' : 'speaker');
  const pick = (id: string) => (profile() === 'phone' ? openZone(id) : setPref('zone', id));
  const groupOf = (id: string) => {
    const ses = S.zone[id].session;
    if (!ses || ses.activity !== 'listen') return 0;
    return S.src[ses.source].zones.length;
  };
</script>

<div class="list">
  {#if active.length}
    <section aria-label="Сейчас играет">
      <h2 class="sh">Сейчас</h2>
      <div class="now">
        {#each active as id (id)}
          {@const z = S.zone[id]}
          {@const c = z.session && S.src[z.session.source].content}
          <div class="np" class:sel={ui.zone === id && profile() === 'tablet'}>
            <button class="npb" onclick={() => pick(id)}>
              {#if c}<Art art={c.art} kind={c.kind} title={c.title} size="s" />{:else}<span class="ph"><Icon name={iconOf(id)} size={20} /></span>{/if}
              <span class="t"><b>{engine.zones[id].name}</b><i>{zoneLine(id)}</i></span>
            </button>
            {#if z.session && !z.plan}
              <button class="mini press" aria-label={S.src[z.session.source].playing ? 'Пауза' : 'Играть'} onclick={() => act(() => engine.toggle(id))}><Icon name={S.src[z.session.source].playing ? 'pause' : 'play'} size={18} /></button>
            {/if}
            {#if z.plan}<span class="pr"><span style="width:{(z.plan.elapsed / z.plan.total) * 100}%"></span></span>{/if}
          </div>
        {/each}
      </div>
      <button class="alloff press" onclick={() => act(() => engine.stopAll())}><Icon name="power" size={16} />Выключить всё</button>
    </section>
  {/if}

  {#each floors as f}
    <section aria-label={f.name}>
      <h2 class="sh">{f.name}</h2>
      {#each f.zones as z (z.id)}
        {@const st = S.zone[z.id]}
        {@const on = !!st.session || !!st.plan}
        <button class="zr" class:sel={ui.zone === z.id && profile() === 'tablet'} class:on onclick={() => pick(z.id)}>
          <span class="zi"><Icon name={iconOf(z.id)} size={18} /></span>
          <span class="t"><b>{z.name}</b><i>{zoneLine(z.id)}</i></span>
          {#if groupOf(z.id) > 1}<span class="grp" title="Слушает группа зон">{groupOf(z.id)}</span>{/if}
          <Icon name="next" size={16} />
        </button>
      {/each}
    </section>
  {/each}
</div>

<style>
  .list { display: flex; flex-direction: column; gap: 18px; }
  section { display: flex; flex-direction: column; gap: 6px; }
  .sh { font-family: var(--font-ui); font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 0 0 2px 4px; }
  .now { display: flex; flex-direction: column; gap: 6px; }
  .np { position: relative; display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: var(--r-md); background: var(--surface-2); border: 1px solid var(--border); overflow: hidden; }
  .np.sel, .zr.sel { border-color: var(--accent-border); background: var(--accent-soft); }
  .npb { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; border: 0; background: none; color: inherit; text-align: left; padding: 0; font: inherit; }
  .ph { width: 44px; height: 44px; border-radius: 10px; display: grid; place-items: center; background: var(--surface); color: var(--muted); flex: none; }
  .t { display: flex; flex-direction: column; min-width: 0; flex: 1; }
  .t b { font-weight: 500; font-size: 15px; }
  .t i { font-style: normal; font-size: 12.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mini { width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--text); color: var(--bg); display: grid; place-items: center; flex: none; }
  .pr { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--border); }
  .pr span { display: block; height: 100%; background: var(--accent); transition: width .25s linear; }
  .alloff { align-self: flex-start; height: 34px; padding: 0 12px; border-radius: var(--r-pill); border: 1px solid var(--border-strong); background: none; color: var(--sub); font: 500 13px var(--font-ui); display: inline-flex; align-items: center; gap: 6px; }
  .zr { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 6px 10px 6px 8px; border-radius: var(--r-md); border: 1px solid transparent; background: none; color: var(--text); text-align: left; font: inherit; }
  .zr:hover { background: var(--surface); }
  .zi { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); flex: none; }
  .zr.on .zi { background: var(--accent-soft); color: var(--accent-text); }
  .grp { font-size: 11px; min-width: 22px; height: 22px; border-radius: 11px; display: grid; place-items: center; background: var(--cool-soft); color: var(--cool-text); font-weight: 600; }
  :global([data-trend="minimal"]) .np, :global([data-trend="minimal"]) .zr, :global([data-trend="minimal"]) .zi, :global([data-trend="minimal"]) .alloff { border-radius: 0; }
</style>
