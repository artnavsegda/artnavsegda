<script lang="ts">
  import Photo from '../ui/Photo.svelte';
  import Hotspot from '../ui/Hotspot.svelte';
  import Scenes from '../ui/Scenes.svelte';
  import Icon from '../ui/Icon.svelte';
  import { home, dev, cmd } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { go } from '../client/router.svelte';
  import { roomLight, lightsOn, dateLine } from '../client/derive.svelte';

  // Дом снаружи: фото архитектора, окна светятся по реальному состоянию света в комнатах.
  let { arg = '' }: { arg?: string } = $props();
  const photo = $derived(home.s?.night ? 'house-night' : 'house-day');
  // маски окон и отражения в пикселях исходника 1376×768
  const windows = [
    { x: 470, y: 285, w: 400, h: 230, room: 'living' },
    { x: 515, y: 155, w: 125, h: 40, room: 'bedroom' },
    { x: 995, y: 160, w: 40, h: 86, room: 'kids' }
  ];
  const pool = $derived(!!dev('outdoor.pool').on);
  const secName = { disarmed: 'Снята', perimeter: 'Периметр', full: 'Полная' };
</script>

<div class="scr {theme.profile}">
  <div class="ph-wrap">
    <Photo {photo} oy={0.5} rounded={theme.profile === 'tablet'} dim={0}>
      {#snippet children(map, s)}
        {#each windows as w}
          {@const [x, y] = map(w.x, w.y)}
          {#if w.room === 'living'}<div class="win-dark" style="left:{x}px; top:{y}px; width:{w.w * s}px; height:{w.h * s}px; opacity:{home.s?.night ? (1 - roomLight(w.room)) * 0.8 : 0}"></div>{/if}
          <div class="win" style="left:{x}px; top:{y}px; width:{w.w * s}px; height:{w.h * s}px; opacity:{roomLight(w.room) * (home.s?.night ? 0.55 : 0.12)}"></div>
        {/each}
        {@const [px, py] = map(520, 600)}
        <div class="pool" class:on={pool} style="left:{px}px; top:{py}px; width:{380 * s}px; height:{100 * s}px"></div>
        {@const [hx, hy] = map(710, 640)}
        <Hotspot x={hx} y={hy} on={pool} label="Подсветка бассейна" sub="{dev('outdoor.pool').temp}° вода" open={theme.profile === 'tablet'}
          onclick={() => cmd({ cmd: 'media.action', target: 'outdoor.pool', action: 'power' })} />
        {@const [lx, ly] = map(670, 400)}
        <Hotspot x={lx} y={ly} on={roomLight('living') > 0} label="Гостиная" sub="{lightsOn('living')} свет" open={false} onclick={() => go('room', 'living')} />
      {/snippet}
    </Photo>
  </div>

  <div class="over">
    <header class="glass rise">
      <span class="lbl">{dateLine()}</span>
      <h1>Дом и участок</h1>
    </header>

    <div class="cards">
      <button class="glass stat press rise" style="animation-delay:.1s" onclick={() => go('security')}>
        <Icon name="shield" /><span><b>Охрана</b><i>{secName[home.s?.security.mode ?? 'disarmed']}</i></span>
      </button>
      <div class="glass stat rise" style="animation-delay:.14s">
        <Icon name={home.s?.night ? 'moon' : 'sun'} /><span><b class="num">{home.s?.outside}°</b><i>на улице</i></span>
      </div>
      <div class="glass stat rise" style="animation-delay:.18s">
        <Icon name="drop" /><span><b class="num">{dev('outdoor.pool').temp}°</b><i>бассейн</i></span>
      </div>
      <button class="glass stat press rise" style="animation-delay:.22s" onclick={() => go('security')}>
        <Icon name="cam" /><span><b>4 камеры</b><i>смотреть</i></span>
      </button>
    </div>

    <div class="glass scenes rise" style="animation-delay:.26s">
      <Scenes layout="row" limit={6} />
    </div>
  </div>
</div>

<style>
  .scr { position: relative; height: var(--screen-h); min-height: 560px; }
  .ph-wrap { position: absolute; inset: 0; }
  .tablet .ph-wrap { inset: max(20px, env(safe-area-inset-top, 0px)) max(20px, env(safe-area-inset-right, 0px)) 20px 20px; }
  .ph-wrap :global(.ph) { position: absolute; inset: 0; }
  .win { position: absolute; pointer-events: none; mix-blend-mode: screen; border-radius: 4px;
    background: radial-gradient(70% 80% at 50% 60%, rgba(255,196,120,.95), rgba(255,170,90,.45) 55%, transparent 100%); filter: blur(6px); transition: opacity 1.8s var(--ease-light); }
  .win-dark { position: absolute; pointer-events: none; background: #0b0e16; mix-blend-mode: multiply; filter: blur(3px); transition: opacity 1.8s var(--ease-light); }
  .pool { position: absolute; pointer-events: none; mix-blend-mode: screen; border-radius: 50%; opacity: 0; filter: blur(14px);
    background: radial-gradient(50% 50% at 50% 50%, rgba(90,200,230,.8), rgba(60,150,200,.3) 60%, transparent); transition: opacity 1.6s var(--ease-light); }
  .pool.on { opacity: .85; animation: shimmer 4s ease-in-out infinite; }
  @keyframes shimmer { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(1.04) translateY(2px); } }

  .over { position: absolute; inset: 0; pointer-events: none; display: grid; grid-template-rows: auto 1fr auto; gap: 12px; }
  .over > * { pointer-events: auto; }
  .tablet .over { padding: 40px; grid-template-columns: 1fr auto; }
  .tablet .over header { grid-column: 1; align-self: start; justify-self: start; }
  .tablet .cards { grid-column: 2; grid-row: 1 / 3; display: flex; flex-direction: column; gap: 8px; align-self: start; width: 210px; }
  .tablet .scenes { grid-column: 1 / -1; grid-row: 3; justify-self: start; max-width: 100%; }
  .phone .over { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto 1fr auto auto; padding: max(16px, env(safe-area-inset-top, 0px)) 16px calc(96px + env(safe-area-inset-bottom, 0px)); }
  .phone .cards { grid-row: 3; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .phone .scenes { grid-row: 4; }

  .glass { background: rgba(14,15,18,.5); color: #F4F1EC; border: 1px solid rgba(255,255,255,.14); -webkit-backdrop-filter: blur(22px) saturate(1.3); backdrop-filter: blur(22px) saturate(1.3); border-radius: 22px; }
  header { padding: 14px 18px; display: flex; flex-direction: column; gap: 4px; }
  header h1 { font-size: 28px; font-weight: 400; }
  .lbl { font-size: 12px; opacity: .7; }
  .lbl:first-letter { text-transform: uppercase; }
  .stat { display: flex; align-items: center; gap: 12px; padding: 12px 14px; text-align: left; }
  .stat span { display: flex; flex-direction: column; }
  .stat b { font-weight: 600; font-size: 16px; }
  .stat i { font-style: normal; font-size: 12px; opacity: .7; }
  .scenes { padding: 10px 16px; }
  .scenes :global(.sc) { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.14); color: #F4F1EC; }
  .scenes :global(.sc.on) { background: rgba(255,214,150,.22); border-color: rgba(255,214,150,.5); }
  .scenes :global(.ic) { background: rgba(255,255,255,.1); color: #F4F1EC; }
  :global([data-trend="minimal"]) .glass { border-radius: 0; background: rgba(13,13,13,.86); backdrop-filter: none; }
  :global([data-trend="minimal"]) header h1 { font-weight: 600; text-transform: uppercase; font-size: 22px; }
</style>
