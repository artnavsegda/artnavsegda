<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Art from './Art.svelte';
  import { S, ui, engine, act } from './state.svelte';
  import { mc, activeZones, step } from './mc.svelte';

  // Мини-плеер над нижней панелью: виден на любой вкладке, пока где-то что-то играет.
  // Тап — полноэкранный плеер; несколько зон — переключатель «+N».
  let { bottom = 16, left = 16 }: { bottom?: number | string; left?: number | string } = $props();
  const zones = $derived(activeZones());
  const zid = $derived(zones.includes(ui.zone) ? ui.zone : zones[0]);
  const st = $derived(zid ? S.zone[zid] : undefined);
  const src = $derived(st?.session ? S.src[st.session.source] : undefined);
  const c = $derived(src?.content);
  const where = $derived(src ? src.zones.map(z => engine.zones[z].name).join(' · ') : zid ? engine.zones[zid].name : '');
  const pct = $derived(st?.plan ? st.plan.elapsed / st.plan.total : c?.dur ? (c.pos ?? 0) / c.dur : 0);
  const cycle = () => { const i = zones.indexOf(zid); ui.zone = zones[(i + 1) % zones.length]; };
  const css = (v: number | string) => (typeof v === 'number' ? v + 'px' : v);
</script>

{#if zid && !mc.full}
  <div class="mini rise" style="bottom:{css(bottom)}; left:{css(left)}">
    <button class="body" onclick={() => (mc.full = zid)} aria-label="Открыть плеер">
      {#if c}<Art art={c.art} kind={c.kind} title={c.title} size="s" />{:else}<span class="ph"><Icon name={engine.zones[zid].display ? 'media' : 'speaker'} size={18} /></span>{/if}
      <span class="t">
        <b>{st?.plan ? (st.plan.kind === 'stop' ? 'Выключается…' : st.plan.title) : c?.title ?? engine.nodes[st!.session!.source].name}</b>
        <i>{st?.plan ? `${Math.max(0, Math.ceil(st.plan.total - st.plan.elapsed))} с · ${engine.zones[zid].name}` : where}</i>
      </span>
    </button>
    {#if zones.length > 1}<button class="more press" aria-label="Другая зона" onclick={cycle}>+{zones.length - 1}</button>{/if}
    {#if st?.session && !st.plan}
      {#if mc.queue[zid]?.length}<button class="ic press" aria-label="Следующий" onclick={() => step(zid, 1)}><Icon name="next" size={18} /></button>{/if}
      <button class="pp press" aria-label={src?.playing ? 'Пауза' : 'Играть'} onclick={() => act(() => engine.toggle(zid))}><Icon name={src?.playing ? 'pause' : 'play'} size={20} /></button>
    {/if}
    <span class="pr"><span style="width:{pct * 100}%"></span></span>
  </div>
{/if}

<style>
  .mini { position: fixed; z-index: 30; right: max(16px, env(safe-area-inset-right, 0px)); max-width: 560px; margin-left: auto; display: flex; align-items: center; gap: 6px; height: 62px; padding: 0 8px 0 7px; border-radius: 22px; overflow: hidden;
    background: color-mix(in srgb, var(--surface-solid) 82%, transparent); backdrop-filter: blur(24px) saturate(1.4); -webkit-backdrop-filter: blur(24px) saturate(1.4);
    border: 1px solid var(--border-strong); box-shadow: 0 14px 40px rgba(0,0,0,.35); }
  .body { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; border: 0; background: none; color: var(--text); text-align: left; padding: 0; font: inherit; height: 100%; }
  .ph { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); flex: none; }
  .t { display: flex; flex-direction: column; min-width: 0; }
  .t b { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .t i { font-style: normal; font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .more { height: 28px; min-width: 34px; padding: 0 8px; border-radius: 14px; border: 1px solid var(--border-strong); background: none; color: var(--sub); font: 600 12px var(--font-ui); }
  .ic { width: 40px; height: 40px; border: 0; border-radius: 50%; background: none; color: var(--text); display: grid; place-items: center; }
  .pp { width: 44px; height: 44px; border: 0; border-radius: 50%; background: var(--text); color: var(--bg); display: grid; place-items: center; flex: none; }
  .pr { position: absolute; left: 14px; right: 14px; bottom: 0; height: 2px; background: var(--border); }
  .pr span { display: block; height: 100%; background: var(--accent); transition: width .25s linear; }
  :global([data-trend="minimal"]) .mini { border-radius: 0; }
</style>
