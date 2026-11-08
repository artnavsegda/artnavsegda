<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import { S, type Room } from './data.svelte';
  import { ui } from './ui.svelte';
  import { heroKind, heroPoster, type HeroKind } from './hero3d';
  import { typeById } from '../../model/catalog.ts';
  import type { Device } from '../../model/schema.ts';

  // Плитки устройств: у каждой свой «портрет» — плоский рендер того же предмета, что на крупном плане.
  // Тап по портрету — крупный план, кнопка внизу — включить/выключить без перехода.
  let { rows, room }: { rows: Device[]; room: Room } = $props();
  const day = $derived(ui.mode === 'day');
  const t = $derived(S.temp[room.id]);
  const m = $derived(S.media[room.id]);
  const fmt = (n: number) => n.toFixed(1).replace('.', ',');
  const heat = $derived(t ? Math.max(0, Math.min(1, (t.target - t.cur) / 1.2)) : 0);

  function isOn(d: Device, k: HeroKind | null) {
    if (d.type.startsWith('light.')) return (S.light[d.id] ?? 0) > 0;
    const v = S.dev[d.id];
    if (k === 'curtain' || k === 'gate') return (v?.pos ?? 100) > 50;
    if (k === 'radiator' || k === 'floorheat') return heat > .05;
    if (k === 'speaker') return !!m?.playing;
    return !!v?.on;
  }
  function line(d: Device, k: HeroKind | null, on: boolean) {
    if (d.type.startsWith('light.')) { const v = S.light[d.id] ?? 0; return v ? (typeById[d.type].ui.widget === 'dimmer' ? `${v}%` : 'включён') : 'выключен'; }
    const v = S.dev[d.id];
    if (k === 'curtain') { const p = v?.pos ?? 100; return p >= 95 ? 'открыта' : p <= 5 ? 'закрыта' : `${p}%`; }
    if (k === 'gate') return on ? 'открыты' : 'закрыты';
    if (k === 'radiator' || k === 'floorheat') return t ? (on ? `греет до ${fmt(t.target)}°` : `держит ${fmt(t.target)}°`) : '';
    if (k === 'ac') return on ? `${fmt(t?.target ?? 22)}°` : 'выключен';
    if (k === 'speaker') return m ? (m.playing ? m.title : 'пауза') : 'тихо';
    return on ? 'включён' : 'выключен';
  }
  function flip(d: Device, k: HeroKind | null, on: boolean) {
    if (d.type.startsWith('light.')) { S.light[d.id] = on ? 0 : 80; return; }
    const v = S.dev[d.id]; if (!v) return;
    if (k === 'curtain' || k === 'gate') v.pos = on ? 0 : 100;
    else if (k === 'speaker' && m) m.playing = !m.playing;
    else v.on = !v.on;
  }
  const canFlip = (k: HeroKind | null) => k !== 'radiator' && k !== 'floorheat';
  const open = (d: Device, k: HeroKind | null) => { if (k) ui.device = d.id; };
  // как предмет «живёт» в плитке: подвесы свисают сверху, напольное стоит снизу
  const anchor = (k: HeroKind | null) => (k === 'pendant' || k === 'chandelier' || k === 'spots' ? 'top' : k === 'lamp' || k === 'radiator' || k === 'speaker' || k === 'tv' || k === 'gate' ? 'bottom' : 'center');
</script>

<div class="tiles">
  {#each rows as d (d.id)}
    {@const k = heroKind(d.type, d.name)}
    {@const on = isOn(d, k)}
    {@const img = k ? heroPoster(k, on, day) : ''}
    <article class="tile {anchor(k)}" class:on>
      <button class="hit" onclick={() => open(d, k)} aria-label="Крупный план: {d.name}"></button>
      {#if img}{#key img}<img class="art" src={img} alt="" draggable="false" />{/key}{:else}<span class="art ic"><Icon name={typeById[d.type].ui.icon} size={30} /></span>{/if}
      <span class="tx"><b>{d.name}</b><i class="num">{line(d, k, on)}</i></span>
      {#if canFlip(k)}
        <button class="sw" role="switch" aria-checked={on} aria-label={d.name} onclick={() => flip(d, k, on)}><span>{on ? 'Вкл' : 'Выкл'}</span><i></i></button>
      {/if}
    </article>
  {/each}
</div>

<style>
  .tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .tile { position: relative; height: 128px; border-radius: var(--r-lg); border: 1px solid var(--border); background: var(--surface); overflow: hidden; isolation: isolate;
    display: flex; flex-direction: column; justify-content: space-between; padding: 12px; transition: background .6s, border-color .6s; }
  .tile.on { border-color: var(--accent-border); background: radial-gradient(70% 90% at 85% 50%, rgba(255, 176, 96, .24), transparent 70%), var(--surface); }
  .hit { position: absolute; inset: 0; z-index: 0; border: 0; background: none; cursor: pointer; border-radius: inherit; }
  .hit:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  /* предмет — сбоку и частично за краем плитки, как у дизайнеров: текст слева, вещь справа */
  .art { position: absolute; z-index: 0; right: -22%; width: 78%; aspect-ratio: 1; object-fit: contain; pointer-events: none;
    filter: drop-shadow(0 10px 14px rgba(0,0,0,.3)); animation: fade .5s var(--ease-out) both; }
  .center .art { top: 50%; transform: translateY(-50%); }
  .top .art { top: -18%; }
  .bottom .art { bottom: -14%; }
  .art.ic { width: auto; right: 14px; top: 14px; color: var(--muted); filter: none; }
  @keyframes fade { from { opacity: 0; } }
  .tx { position: relative; z-index: 1; pointer-events: none; display: flex; flex-direction: column; gap: 2px; max-width: 62%; }
  .tx b { font-weight: 600; font-size: 14.5px; line-height: 1.15; }
  .tx i { font-style: normal; font-size: 12.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .on .tx i { color: var(--accent-text); }
  .sw { position: relative; z-index: 1; align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 4px 0 10px; border-radius: 15px;
    border: 1px solid var(--border); background: var(--surface-2); color: var(--sub); font: 500 12px var(--font-ui); cursor: pointer; }
  .sw i { width: 22px; height: 22px; border-radius: 50%; background: var(--border-strong); transition: background .3s; }
  .sw[aria-checked="true"] { background: #f4d6a8; color: #2a1d10; border-color: transparent; }
  .sw[aria-checked="true"] i { background: #2a1d10; }
  .sw[aria-checked="false"] { flex-direction: row-reverse; padding: 0 10px 0 4px; }
  @media (prefers-reduced-motion: reduce) { .art { animation: none; } }
  :global([data-trend="minimal"]) .tile, :global([data-trend="minimal"]) .sw { border-radius: 0; }
</style>
