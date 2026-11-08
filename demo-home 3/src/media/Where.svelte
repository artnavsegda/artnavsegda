<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Art from './Art.svelte';
  import MediaHouse from './MediaHouse.svelte';
  import { S, ui, engine, zoneLine } from './state.svelte';
  import { mc, zonesFor, startIn } from './mc.svelte';
  import { kindFor } from './catalog';

  // «Где смотреть?» — как выбор AirPlay: маленький дом, подходящие комнаты, их состояние.
  // Комната выбирается тапом по дому или по строке; занятость и конфликты решает движок.
  const w = $derived(mc.where!);
  const zones = $derived(zonesFor(w.c));
  const ids = $derived(zones.map(z => z.id));
  let sel = $state('');
  $effect(() => { if (!ids.includes(sel)) sel = ids.includes(ui.zone) ? ui.zone : ids.find(id => !S.zone[id].session) ?? ids[0] ?? ''; });
  const listen = $derived(kindFor(w.c) === 'streamer');
  const busy = (id: string) => { const s = S.zone[id].session; return s ? S.src[s.source].content?.title ?? engine.nodes[s.source].name : ''; };
</script>

<div class="scrim" role="presentation" onclick={() => (mc.where = null)}></div>
<div class="where" role="dialog" aria-modal="true" aria-label={listen ? 'Где слушать' : 'Где смотреть'}>
  <header>
    <Art art={w.c.art} kind={w.c.kind} title={w.c.title} size="s" />
    <div class="t"><span class="ey">{listen ? 'Где слушать' : 'Где смотреть'}</span><b>{w.c.title}</b></div>
    <button class="x press" aria-label="Закрыть" onclick={() => (mc.where = null)}><Icon name="x" size={18} /></button>
  </header>
  <MediaHouse onPick={(z) => (sel = z)} only={ids} selected={sel} height={230} caption={false} />
  <div class="zl" role="radiogroup" aria-label="Зона">
    {#each zones as z (z.id)}
      <button role="radio" aria-checked={sel === z.id} class:on={sel === z.id} onclick={() => (sel = z.id)}>
        <Icon name={z.display ? 'media' : 'speaker'} size={16} />
        <span><b>{z.name}</b><i>{busy(z.id) ? `сейчас: ${busy(z.id)}` : zoneLine(z.id)}</i></span>
      </button>
    {/each}
  </div>
  <button class="go press" disabled={!sel} onclick={() => startIn(sel, w.c, w.queue)}>
    <Icon name="play" size={18} />{listen ? 'Слушать' : 'Смотреть'} · {engine.zones[sel]?.name ?? ''}
  </button>
</div>

<style>
  .scrim { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.45); animation: fade .2s; }
  .where { position: fixed; z-index: 61; left: 50%; bottom: max(14px, env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); width: min(460px, calc(100% - 20px)); max-height: calc(100dvh - 40px); overflow: auto;
    display: flex; flex-direction: column; gap: 10px; padding: 14px; border-radius: 28px; color: var(--text);
    background: color-mix(in srgb, var(--surface-solid) 78%, transparent); backdrop-filter: blur(28px) saturate(1.4); -webkit-backdrop-filter: blur(28px) saturate(1.4);
    border: 1px solid var(--border-strong); box-shadow: 0 30px 80px rgba(0,0,0,.45); animation: up .32s var(--ease-out); }
  @keyframes up { from { transform: translate(-50%, 30px); opacity: 0; } }
  @keyframes fade { from { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .where, .scrim { animation: none; } }
  header { display: flex; align-items: center; gap: 12px; }
  .t { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .ey { font-size: 11.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .t b { font: 500 17px var(--font-display); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .x { width: 36px; height: 36px; border-radius: 50%; border: 0; background: var(--surface-2); color: var(--sub); display: grid; place-items: center; }
  .zl { display: flex; flex-direction: column; gap: 4px; }
  .zl button { display: flex; align-items: center; gap: 10px; min-height: 50px; padding: 6px 12px; border-radius: 16px; border: 1px solid transparent; background: none; color: var(--sub); text-align: left; font: inherit; }
  .zl button.on { background: var(--accent-soft); border-color: var(--accent-border); color: var(--text); }
  .zl span { display: flex; flex-direction: column; min-width: 0; }
  .zl b { font-weight: 500; font-size: 14.5px; color: var(--text); }
  .zl i { font-style: normal; font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .go { height: 52px; border-radius: 26px; border: 0; background: var(--text); color: var(--bg); font: 600 15px var(--font-ui); display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
  .go:disabled { opacity: .4; }
  :global([data-trend="minimal"]) .where, :global([data-trend="minimal"]) .zl button, :global([data-trend="minimal"]) .go { border-radius: 0; }
</style>
