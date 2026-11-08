<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import { S, ui, engine, act } from './state.svelte';

  // Путь сигнала зоны — тот же, что видит техник: какой выход матрицы, какой вход ресивера,
  // в каком состоянии каждое устройство. Источник с розеткой PDU можно перезапустить отсюда.
  const zid = $derived(ui.zone);
  const ses = $derived(S.zone[zid].session);
  const power: Record<string, string> = { on: 'включено', booting: 'включается', cooling: 'остывает', off: 'выключено' };
  const rows = $derived.by(() => {
    if (!ses) return [];
    return ses.devices.map(id => {
      const n = engine.nodes[id];
      const picks = Object.entries(ses.claims).filter(([k]) => k.startsWith(id + ':')).map(([k, v]) => {
        const port = k.split(':')[1];
        const from = engine.cfg.links.find(l => l.to[0] === id && l.to[1] === v);
        const src = from ? engine.nodes[from.from[0]]?.name : '';
        return port === 'in' ? `вход ${v === 'tv' ? 'ТВ' : v.toUpperCase()}${src ? ` ← ${src}` : ''}` : `${port} ← ${v}${src ? ` (${src})` : ''}`;
      });
      const d = S.dev[id];
      const state = n.role === 'screen' ? ((d.pos ?? 0) >= 100 ? 'опущен' : 'поднят') : power[d.power];
      return { id, n, picks, state, on: n.role === 'screen' ? (d.pos ?? 0) >= 100 : d.power === 'on' };
    });
  });
</script>

<div class="path">
  {#if !ses}
    <p class="label">Зона выключена — сигнала нет.</p>
  {:else}
    <ol>
      {#each rows as r (r.id)}
        <li>
          <span class="dot" class:on={r.on}></span>
          <span class="t"><b>{r.n.name}</b><i>{[...r.picks, r.n.via ? `управление: ${r.n.via}` : ''].filter(Boolean).join(' · ')}</i></span>
          <span class="st">{r.state}</span>
        </li>
      {/each}
    </ol>
    {#if engine.nodes[ses.source].outlet}
      <button class="rs press" disabled={!!S.src[ses.source].restarting} onclick={() => act(() => engine.restart(ses.source))}>
        <Icon name="power" size={16} />Перезапустить {engine.nodes[ses.source].name} через розетку {engine.nodes[ses.source].outlet}
      </button>
    {/if}
  {/if}
</div>

<style>
  .path { display: flex; flex-direction: column; gap: 14px; }
  ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  li { display: grid; grid-template-columns: 12px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px 4px; border-top: 1px solid var(--border); }
  li:first-child { border-top: 0; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border-strong); }
  .dot.on { background: var(--ok); }
  .t { display: flex; flex-direction: column; min-width: 0; }
  .t b { font-weight: 500; font-size: 14px; }
  .t i { font-style: normal; font-size: 12px; color: var(--muted); }
  .st { font-size: 12px; color: var(--sub); }
  .rs { align-self: flex-start; min-height: 38px; padding: 6px 14px; border-radius: var(--r-pill); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); font: 500 13px var(--font-ui); display: inline-flex; align-items: center; gap: 6px; text-align: left; }
  .rs:disabled { opacity: .5; }
</style>
