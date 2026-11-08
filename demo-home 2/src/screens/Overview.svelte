<script lang="ts">
  import Photo from '../ui/Photo.svelte';
  import DeviceCard from '../ui/DeviceCard.svelte';
  import Gauge from '../ui/Gauge.svelte';
  import Events from '../ui/Events.svelte';
  import Scenes from '../ui/Scenes.svelte';
  import Icon from '../ui/Icon.svelte';
  import Swap from '../ui/Swap.svelte';
  import { roomById, house } from '../core/house';
  import { home, dev, cmd } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { go } from '../client/router.svelte';
  import { roomLight, roomTemp, fmtT, lightsOn, greeting, dateLine } from '../client/derive.svelte';
  import { photoRooms, photoFor, spotsOn, photoDim } from '../client/rooms';

  // Обзор «бенто»: фото комнаты как герой, вокруг — карточки устройств с их портретами.
  let { arg = '' }: { arg?: string } = $props();
  let room = $state('living');
  const photo = $derived(photoFor(room, !!home.s?.night));
  const lights = $derived(spotsOn(photo).filter(s => s.caps.includes('dimmer')));
  const dim = $derived(home.s ? photoDim(photo, roomLight(room), home.s) : 0);
  const clim = $derived(dev('living.climate'));
  const layout = $derived(theme.t.layout.overview);

  // мощность: скользящее окно для спарклайна
  let series = $state<number[]>([]);
  $effect(() => {
    const id = setInterval(() => { series = [...series.slice(-39), home.s?.power ?? 0]; }, 1000);
    series = Array.from({ length: 40 }, (_, i) => (home.s?.power ?? 600) * (0.85 + 0.15 * Math.sin(i / 4)));
    return () => clearInterval(id);
  });
  const spark = $derived.by(() => {
    if (series.length < 2) return '';
    const mx = Math.max(...series) * 1.1, mn = Math.min(...series) * 0.8;
    return series.map((v, i) => `${i ? 'L' : 'M'}${(i / (series.length - 1)) * 100} ${30 - ((v - mn) / (mx - mn || 1)) * 28}`).join(' ');
  });
</script>

<div class="scr {theme.profile} {layout}">
  <header class="rise">
    <div><div class="label">{dateLine()}</div><h1>{greeting()}</h1></div>
    <div class="out"><Icon name={home.s?.night ? 'moon' : 'sun'} /><span class="num">{home.s?.outside}°</span><span class="label">на улице</span></div>
  </header>

  <section class="hero rise" style="animation-delay:.05s">
    <Swap key={photo} index={photoRooms.indexOf(room)} class="fill" onswipe={(d) => { const n = photoRooms.indexOf(room) + d; if (photoRooms[n]) room = photoRooms[n]; }}>
      <Photo {photo} ox={room === 'living' ? 0.6 : 0.5} {lights} {dim} />
    </Swap>
    <div class="cap">
      <div class="tabs">
        {#each photoRooms as id}
          <button class:on={id === room} onclick={() => (room = id)}>{roomById[id].name}</button>
        {/each}
      </div>
      <div class="meta">
        <div class="mt">{#key room}<h2 class="pop-in">{roomById[room].name}</h2>{/key}<span class="num">{fmtT(roomTemp(room))}° · {lightsOn(room)} светильника</span></div>
        <button class="open press" onclick={() => go('photo', room)} aria-label="Открыть комнату"><Icon name="next" /></button>
      </div>
    </div>
  </section>

  <div class="grid">
    <DeviceCard id={house.favorites.overview[0]} delay={0.1} />
    <DeviceCard id={house.favorites.overview[1]} delay={0.14} />

    <article class="card clim rise" style="animation-delay:.18s">
      <div class="ch"><b>Климат · гостиная</b><button class="mini press" onclick={() => go('climate', 'living')} aria-label="Климат"><Icon name="next" size={16} /></button></div>
      <div class="gw">
        <Gauge value={clim.current ?? 21} target={clim.target ?? 22} size={150}>
          <span class="t num">{fmtT(clim.current)}°</span><span class="label">цель {fmtT(clim.target)}°</span>
        </Gauge>
      </div>
      <div class="pm">
        <button class="mini press" aria-label="Холоднее" onclick={() => cmd({ cmd: 'climate.set', target: 'living.climate', target_c: (clim.target ?? 22) - 0.5 })}><Icon name="minus" size={18} /></button>
        <span class="num hum"><Icon name="drop" size={14} />{clim.humidity}%</span>
        <button class="mini press" aria-label="Теплее" onclick={() => cmd({ cmd: 'climate.set', target: 'living.climate', target_c: (clim.target ?? 22) + 0.5 })}><Icon name="plus" size={18} /></button>
      </div>
    </article>

    <DeviceCard id={house.favorites.overview[2]} delay={0.22} />
    <DeviceCard id={house.favorites.overview[3]} delay={0.26} />

    <article class="card power rise" style="animation-delay:.3s">
      <b>Потребление</b>
      <div class="pw"><span class="num">{((home.s?.power ?? 0) / 1000).toFixed(2).replace('.', ',')}</span><span class="label">кВт сейчас</span></div>
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><path d={spark} /></svg>
    </article>

    <article class="card feed rise" style="animation-delay:.34s">
      <b>Лента дома</b>
      <Events limit={4} />
    </article>

    <article class="card sc rise" style="animation-delay:.38s">
      <b>Сцены</b>
      <Scenes limit={6} />
    </article>
  </div>
</div>

<style>
  .scr { display: grid; gap: 16px; padding: max(24px, env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) 80px 28px; }
  .tablet.side { grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); grid-template-rows: auto 1fr; }
  .tablet.side header { grid-column: 1 / -1; }
  .tablet.side .hero { min-height: 560px; position: sticky; top: 24px; height: calc(var(--screen-h) - 140px); }
  .stacked .hero { height: 340px; }
  .phone { grid-template-columns: minmax(0, 1fr); padding: max(20px, env(safe-area-inset-top, 0px)) 16px 20px; }
  .phone .hero { height: 380px; }
  header { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
  h1 { font-size: clamp(30px, 4vw, 44px); margin-top: 6px; }
  .label:first-letter { text-transform: uppercase; }
  .out { display: flex; align-items: center; gap: 8px; color: var(--sub); }
  .out .num { font-size: 26px; font-family: var(--font-num); color: var(--text); }

  .hero { position: relative; min-width: 0; }
  .hero :global(.swap.fill) { position: absolute; inset: 0; border-radius: var(--r-xl); }
  .hero :global(.swap.fill .pane) { position: relative; height: 100%; }
  .hero :global(.ph) { position: absolute; inset: 0; }
  .cap { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 16px; pointer-events: none; color: #F4F1EC; }
  .cap > * { pointer-events: auto; }
  .tabs { align-self: flex-start; display: flex; gap: 2px; padding: 4px; border-radius: 999px; background: rgba(14,15,18,.45); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); max-width: 100%; overflow-x: auto; scrollbar-width: none; }
  .tabs button { height: 34px; padding: 0 12px; border: 0; border-radius: 999px; background: none; color: rgba(255,255,255,.72); font-size: 13px; font-weight: 500; white-space: nowrap; transition: background-color var(--dur-m), color var(--dur-m); }
  .tabs button.on { background: rgba(255,255,255,.92); color: #111; }
  .meta { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; padding: 14px 14px 14px 18px; border-radius: 22px; background: rgba(14,15,18,.45); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); }
  .meta h2 { font-size: 26px; font-weight: 400; }
  .pop-in { animation: rise .6s var(--ease-out) both; }
  .meta span { font-size: 13px; opacity: .75; }
  .open { width: 48px; height: 48px; border-radius: 50%; border: 0; background: #fff; color: #111; display: grid; place-items: center; flex: none; }

  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-content: start; min-width: 0; }
  .stacked .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .phone .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid > .card { padding: 14px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .grid b { font-weight: 600; font-size: 15px; }
  .ch { display: flex; justify-content: space-between; align-items: center; }
  .mini { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface-2); display: grid; place-items: center; color: var(--sub); }
  .gw { display: grid; place-items: center; }
  .t { font-size: 32px; letter-spacing: -.03em; }
  .pm { display: flex; justify-content: space-between; align-items: center; }
  .hum { display: inline-flex; align-items: center; gap: 4px; color: var(--muted); font-size: 13px; }
  .pw { display: flex; align-items: baseline; gap: 8px; }
  .pw .num { font-size: 34px; letter-spacing: -.03em; }
  .power svg { width: 100%; height: 56px; margin-top: auto; }
  .power path { fill: none; stroke: var(--accent); stroke-width: 1.6; vector-effect: non-scaling-stroke; }
  .feed, .sc { grid-column: span 2; }
  .stacked .feed { grid-column: span 2; }
  .stacked .sc { grid-column: span 4; }
  .phone .sc, .phone .feed { grid-column: 1 / -1; }

  :global([data-trend="minimal"]) .tabs, :global([data-trend="minimal"]) .meta { border-radius: 0; background: rgba(13,13,13,.86); backdrop-filter: none; }
  :global([data-trend="minimal"]) .tabs button { border-radius: 0; text-transform: uppercase; letter-spacing: .1em; font-size: 11px; font-weight: 600; }
  :global([data-trend="minimal"]) .open, :global([data-trend="minimal"]) .mini { border-radius: 0; }
  :global([data-trend="minimal"]) .meta h2 { font-weight: 600; text-transform: uppercase; font-size: 20px; }
  :global([data-trend="minimal"]) .grid b { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); }
</style>
