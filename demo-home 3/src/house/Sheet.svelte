<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import { S, P, roomById, lightsOn, lightLevel, hue, photoOf, type Layer } from './data.svelte';
  import { heroKind } from './hero3d';
  import Tiles from './Tiles.svelte';
  import { ui } from './ui.svelte';
  import { typeById } from '../../model/catalog.ts';
  import type { Device } from '../../model/schema.ts';

  // Лист комнаты поверх дома. Группы — из модели; группа текущего слоя идёт первой.
  let { layer }: { layer: Layer } = $props();
  const r = $derived(roomById[ui.room]);
  const fnOf: Record<Layer, string> = { all: '', light: 'light', climate: 'climate', media: 'media', security: 'security' };
  const groups = $derived(r ? [...r.groups].sort((a, b) => (b.fn === fnOf[layer] ? 1 : 0) - (a.fn === fnOf[layer] ? 1 : 0)) : []);
  const floorName = $derived(r ? P.floors.find(f => f.id === r.floor)?.name : '');
  const t = $derived(r && S.temp[r.id]);
  const m = $derived(r && S.media[r.id]);
  const sec = $derived(r && S.sec[r.id]);
  const fmt = (n: number) => n.toFixed(1).replace('.', ',');
  const dim = (d: Device) => typeById[d.type].ui.widget === 'dimmer';
  const dev = (d: Device) => S.dev[d.id];
  const close = () => (ui.room = '');
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !ui.device) close(); };
  const ph = $derived(r ? photoOf(r.id) : null);
  const eve = $derived(r ? Math.min(1, lightLevel(r) * 1.6 + (ui.mode === 'night' ? .55 : 0)) : 0);
  const can = (d: Device) => !!heroKind(d.type, d.name);
  const open = (d: Device) => { if (can(d)) ui.device = d.id; };
  const shadeLabel = (p: number) => (p >= 95 ? 'открыта' : p <= 5 ? 'закрыта' : `${p}%`);
</script>

<svelte:window onkeydown={onKey} />

{#if r}
  <div class="scrim" role="presentation" onclick={close}></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label={r.name}>
    <div class="grab" aria-hidden="true"></div>
    {#if ph}
      <div class="photo" aria-hidden="true">
        {#if ph.day}<img src={ph.day} alt="" />{/if}
        {#if ph.eve}<img src={ph.eve} alt="" style="opacity:{ph.day ? eve : 1}" />{/if}
      </div>
    {/if}
    <header class:onphoto={!!ph}>
      <div class="h">
        <span class="fl">{floorName}</span>
        <h2>{r.name}</h2>
        <p class="st">
          {#if t}<span class="num">{fmt(t.cur)}°</span>{/if}
          {#if lightsOn(r)}<span>свет {lightsOn(r)} из {r.lights.length}</span>{/if}
          {#if S.people[r.id]}<span>здесь {S.people[r.id]}</span>{/if}
          {#if sec?.open}<span class="red">окно открыто</span>{/if}
        </p>
      </div>
      <button class="x press" aria-label="Закрыть" onclick={close}><Icon name="x" size={20} /></button>
    </header>

    {#each groups as g (g.fn)}
      <section class:first={g.fn === fnOf[layer]}>
        <div class="gh">
          <h3>{g.name}</h3>
          {#if g.fn === 'light'}
            {@const n = lightsOn(r)}
            <span class="cnt">{n ? `${n} из ${g.rows.length}` : 'выключен'}</span>
            <button class="gb press" onclick={() => g.rows.forEach((d, i) => (S.light[d.id] = n ? 0 : i === 0 ? 80 : 40))}>{n ? 'Выключить' : 'Включить'}</button>
          {:else if g.fn === 'security'}
            <span class="cnt">{g.status.length} датч.</span>
          {/if}
        </div>

        {#if g.fn === 'light' || g.fn === 'shades'}
          <Tiles rows={g.rows} room={r} />
        {:else if g.fn === 'climate' && t}
          <div class="clim">
            <span class="cur"><b class="num">{fmt(t.cur)}°</b><i>сейчас</i></span>
            <span class="set">
              <button class="press" aria-label="Холоднее" onclick={() => (t.target = +(t.target - 0.5).toFixed(1))}><Icon name="minus" size={18} /></button>
              <span><b class="num">{fmt(t.target)}°</b><i>уставка</i></span>
              <button class="press" aria-label="Теплее" onclick={() => (t.target = +(t.target + 0.5).toFixed(1))}><Icon name="plus" size={18} /></button>
            </span>
          </div>
          <Tiles rows={g.rows} room={r} />
        {:else if g.fn === 'media'}
          {#if m}
            <div class="np" style="--hue:{hue(m.art)}">
              <span class="t"><b>{m.title}</b><i>{m.sub}</i></span>
              <button class="pl press" aria-label={m.playing ? 'Пауза' : 'Играть'} onclick={() => (m.playing = !m.playing)}><Icon name={m.playing ? 'pause' : 'play'} size={20} /></button>
            </div>
          {:else}
            <p class="note">Тихо.</p>
          {/if}
          <Tiles rows={g.rows} room={r} />
          <a class="link" href="https://claude.ai/artifact/FAYEGadJDQVeh8mjG3TFkh" target="_blank" rel="noopener">Пульт и медиатека — в медиацентре <Icon name="next" size={14} /></a>
        {:else if g.fn === 'security'}
          <p class="note" class:red={sec?.open}>{sec?.open ? 'Открыто окно' : 'Окна и двери закрыты'}{sec?.motion ? ' · движение сейчас' : ''}</p>
        {:else}
          <Tiles rows={g.rows} room={r} />
        {/if}
      </section>
    {/each}
  </div>
{/if}

<style>
  .scrim { position: absolute; inset: 0; z-index: 20; background: rgba(0,0,0,.4); animation: fade .2s; }
  .sheet { position: absolute; z-index: 21; left: 0; right: 0; bottom: 0; max-height: 78%; overflow: auto; overscroll-behavior: contain;
    padding: 8px max(16px, env(safe-area-inset-right, 0px)) max(24px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
    background: var(--surface-solid); border-radius: var(--r-xl) var(--r-xl) 0 0; border-top: 1px solid var(--border-strong); box-shadow: 0 -20px 60px rgba(0,0,0,.35);
    display: flex; flex-direction: column; gap: 18px; animation: up .28s var(--ease-out); }
  :global(.tablet) .sheet { left: auto; top: 0; width: 420px; max-height: none; border-radius: 0; border-top: 0; border-left: 1px solid var(--border-strong); padding-top: 20px; animation: side .28s var(--ease-out); }
  :global(.tablet) .grab { display: none; }
  @keyframes up { from { transform: translateY(40px); opacity: 0; } }
  @keyframes side { from { transform: translateX(40px); opacity: 0; } }
  @keyframes fade { from { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .sheet, .scrim { animation: none; } }
  .grab { width: 40px; height: 5px; border-radius: 3px; background: var(--border-strong); align-self: center; flex: none; }
  header { display: flex; align-items: flex-start; gap: 10px; }
  .h { flex: 1; min-width: 0; }
  .fl { font-size: 12px; color: var(--muted); letter-spacing: .06em; text-transform: uppercase; }
  h2 { margin: 2px 0 4px; font: var(--display-weight, 400) 28px/1.1 var(--font-display); letter-spacing: var(--display-tracking, -.01em); }
  .st { margin: 0; display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 13.5px; color: var(--sub); }
  .red { color: var(--danger) !important; }
  .x { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--sub); display: grid; place-items: center; flex: none; }
  section { display: flex; flex-direction: column; gap: 8px; }
  .gh { display: flex; align-items: center; gap: 8px; }
  h3 { margin: 0; font: 600 12px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  section.first h3 { color: var(--accent-text); }
  .cnt { font-size: 12.5px; color: var(--muted); flex: 1; }
  .gb { height: 32px; padding: 0 12px; border-radius: var(--r-pill); border: 1px solid var(--border-strong); background: none; color: var(--sub); font: 500 13px var(--font-ui); flex: none; }
  .rows { display: flex; flex-direction: column; border-radius: var(--r-md); background: var(--surface); border: 1px solid var(--border); overflow: hidden; }
  .row { display: flex; align-items: center; gap: 10px; min-height: 54px; padding: 6px 12px; }
  .row + .row { border-top: 1px solid var(--border); }
  .photo { position: relative; margin: -8px calc(-1 * max(16px, env(safe-area-inset-right, 0px))) -96px calc(-1 * max(16px, env(safe-area-inset-left, 0px))); height: 230px; flex: none; overflow: hidden; border-radius: var(--r-xl) var(--r-xl) 0 0; }
  :global(.tablet) .photo { margin-top: -20px; border-radius: 0; height: 260px; }
  .photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity .6s; }
  .photo::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.05) 30%, var(--surface-solid) 100%); }
  header.onphoto { position: relative; z-index: 1; }
  header.onphoto h2 { text-shadow: 0 1px 12px rgba(0,0,0,.35); }
  .nm { all: unset; cursor: pointer; font-weight: 500; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nm:focus-visible { outline: 2px solid var(--accent); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { height: 34px; padding: 0 12px; border-radius: var(--r-pill); border: 1px solid var(--border); background: var(--surface); color: var(--text); font: 500 13px var(--font-ui); }
  .chip:disabled { color: var(--muted); }
  button.ic { border: 0; cursor: pointer; }
  .ic { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); flex: none; }
  .row.on .ic { color: #E0A15A; background: rgba(255, 190, 110, calc(.12 + var(--lv) * .25)); }
  .t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .t b { font-weight: 500; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .t i { font-style: normal; font-size: 12.5px; color: var(--muted); }
  .t input { width: 100%; max-width: 220px; accent-color: #E0A15A; margin: 2px 0 0; }
  .v { font-size: 13px; color: var(--sub); min-width: 36px; text-align: right; }
  .sw { width: 46px; height: 28px; border-radius: 14px; border: 0; background: var(--track, var(--surface-2)); position: relative; flex: none; padding: 0; }
  .sw i { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: var(--surface-solid); box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .2s var(--ease-out); }
  .sw[aria-checked="true"] { background: #E0A15A; }
  .sw[aria-checked="true"] i { transform: translateX(18px); }
  .seg { display: flex; gap: 4px; }
  .seg button, .set button { width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--border-strong); background: var(--surface-2); color: var(--text); display: grid; place-items: center; }
  .clim { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: var(--r-md); background: var(--surface); border: 1px solid var(--border); }
  .clim b { font: 300 30px/1 var(--font-display); display: block; }
  .clim i { font-style: normal; font-size: 12px; color: var(--muted); }
  .set { display: flex; align-items: center; gap: 12px; text-align: center; }
  .note { margin: 0; font-size: 13px; color: var(--muted); line-height: 1.4; }
  .np { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: var(--r-md); color: #F6F2EC; background: linear-gradient(150deg, hsl(var(--hue) 45% 34%), hsl(calc(var(--hue) + 50) 50% 16%)); }
  .np .t i { color: rgba(246,242,236,.75); }
  .pl { width: 44px; height: 44px; border-radius: 50%; border: 0; background: rgba(255,255,255,.92); color: #1b1712; display: grid; place-items: center; flex: none; }
  .link { align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--accent-text); text-decoration: none; }
  :global([data-trend="minimal"]) .sheet, :global([data-trend="minimal"]) .rows, :global([data-trend="minimal"]) .clim, :global([data-trend="minimal"]) .np, :global([data-trend="minimal"]) .gb { border-radius: 0; }
</style>
