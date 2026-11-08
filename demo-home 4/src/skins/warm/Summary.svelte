<script lang="ts">
  import Scenes from '../../ui/Scenes.svelte';
  import DeviceTile from '../../ui/DeviceTile.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { house } from '../../core/house';
  import { home, runScene } from '../../client/store.svelte';
  import { theme } from '../../client/theme.svelte';
  import { go } from '../../client/router.svelte';
  import { greeting, dateLine, roomLight, roomTemp, fmtT, lightsOn, occupied } from '../../client/derive.svelte';
  import { photoFor, photoDim } from '../../client/rooms';
  import { activeRooms, hereRoom, floorName, multiFloor } from '../../client/nav.svelte';

  // Главный экран жителя: что происходит дома и что дом предлагает сделать.
  let { arg = '' }: { arg?: string } = $props();
  const sug = $derived(home.s?.suggestion);
  const secName = { disarmed: 'Охрана снята', perimeter: 'Периметр', full: 'Под охраной' };
</script>

<div class="scr">
  <header class="rise">
    <div class="label">{dateLine()}</div>
    <h1>{greeting()}</h1>
    <div class="facts">
      <span><Icon name={home.s?.night ? 'moon' : 'sun'} size={16} /><b class="num">{home.s?.outside}°</b></span>
      <span><Icon name="bulb" size={16} /><b class="num">{lightsOn()}</b></span>
      <button onclick={() => go('security')}><Icon name="shield" size={16} />{secName[home.s?.security.mode ?? 'disarmed']}</button>
    </div>
  </header>

  {#if sug}
    {#key sug.id}
      <section class="sug card rise" style="animation-delay:.06s">
        <span class="spark"><Icon name="leaf" size={20} /></span>
        <div><b>{sug.title}</b><p>{sug.text}</p></div>
        <button class="chip on press" onclick={() => runScene(sug.action.scene)}>{sug.action.label}</button>
      </section>
    {/key}
  {/if}

  <section class="rise" style="animation-delay:.1s">
    <h2 class="sh">Сцены</h2>
    <Scenes layout="row" />
  </section>

  <section class="rise" style="animation-delay:.14s">
    <div class="shr"><h2 class="sh">Сейчас в доме</h2><button class="lnk" onclick={() => go('rooms')}>Все {house.rooms.length}<Icon name="next" size={16} /></button></div>
    <div class="rooms scroll-x">
      {#each activeRooms().slice(0, 6).map(x => x.r) as r, i (r.id)}
        {@const ph = photoFor(r.id, !!home.s?.night)}
        <button class="room press" class:photo={!!ph} onclick={() => go('room', r.id)} style="animation-delay:{0.16 + i * 0.04}s">
          {#if r.id === hereRoom()}<span class="here">вы здесь</span>{/if}
          {#if ph}
            <img src={house.photos[ph].src} alt="" draggable="false" />
            <span class="dim" style="opacity:{home.s ? photoDim(ph, roomLight(r.id), home.s) : 0}"></span>
          {:else}
            <span class="glow" style="opacity:{roomLight(r.id)}"></span>
          {/if}
          <span class="rt">
            {#if occupied(r.id)}<i class="pres"></i>{/if}
            <b>{r.name}</b>
            {#if multiFloor}<span>{floorName(r.id)}</span>{/if}
            <span class="num">{roomTemp(r.id) !== undefined ? fmtT(roomTemp(r.id)) + '° · ' : ''}{lightsOn(r.id) ? `${lightsOn(r.id)} свет` : 'свет выкл.'}</span>
          </span>
        </button>
      {/each}
      <button class="room all press" onclick={() => go('rooms')}><span class="rt"><Icon name="door" /><b>Все комнаты</b><span>{house.rooms.length} помещений · поиск</span></span></button>
    </div>
  </section>

  <section class="rise" style="animation-delay:.2s">
    <h2 class="sh">Избранное</h2>
    <div class="fav">
      {#each house.favorites.home as id, i}<DeviceTile {id} delay={0.22 + i * 0.04} />{/each}
    </div>
  </section>

  <section class="links rise" style="animation-delay:.26s">
    <button class="lk card press" onclick={() => go('ar')}><Icon name="ar" /><b>AR-режим</b><span>управление через камеру</span></button>
    <button class="lk card press" onclick={() => go('house')}><Icon name="house" /><b>Участок</b><span>фасад, бассейн, ворота</span></button>
    <button class="lk card press" onclick={() => go('overview')}><Icon name="grid" /><b>Обзор</b><span>вид для iPad</span></button>
    <button class="lk card press" onclick={() => go('photo', 'living')}><Icon name="room" /><b>Гостиная</b><span>фото и живой свет</span></button>
  </section>
</div>

<style>
  .scr { display: flex; flex-direction: column; gap: 22px; padding: max(20px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 24px max(16px, env(safe-area-inset-left, 0px)); max-width: 720px; margin: 0 auto; }
  h1 { font-size: 34px; margin: 6px 0 12px; }
  .label:first-letter { text-transform: uppercase; }
  .facts { display: flex; gap: 6px; flex-wrap: wrap; }
  .facts > * { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: var(--r-pill); background: var(--surface-2); border: 0; color: var(--sub); font-size: 13px; }
  .facts b { font-weight: 500; color: var(--text); }
  .sh { font-size: 15px; font-family: var(--font-ui); font-weight: 600; letter-spacing: 0; margin-bottom: 10px; }
  .shr { display: flex; justify-content: space-between; align-items: baseline; }
  .lnk { border: 0; background: none; color: var(--accent-text); display: inline-flex; align-items: center; font-size: 14px; }

  .sug { display: grid; grid-template-columns: auto 1fr; gap: 12px 14px; padding: 16px; background: var(--hero-card); border-color: var(--accent-border); }
  .spark { width: 40px; height: 40px; border-radius: 14px; display: grid; place-items: center; background: var(--accent); color: var(--on-accent); }
  .sug b { font-weight: 600; font-size: 16px; }
  .sug p { margin: 4px 0 0; font-size: 14px; color: var(--sub); }
  .sug .chip { grid-column: 1 / -1; justify-self: start; }

  .rooms { margin: 0 -16px; padding: 0 16px 4px; gap: 10px; }
  .room { position: relative; flex: none; width: 168px; height: 196px; border-radius: var(--r-lg); overflow: hidden; border: 1px solid var(--border); background: var(--surface); padding: 0; text-align: left; isolation: isolate; animation: rise .9s var(--ease-out) both; }
  .room img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; }
  .room .dim { position: absolute; inset: 0; background: #06070a; z-index: -1; transition: opacity 1.6s var(--ease-light); }
  .room.photo::after { content: ''; position: absolute; inset: 40% 0 0; background: linear-gradient(transparent, rgba(0,0,0,.65)); z-index: -1; }
  .glow { position: absolute; left: -30%; top: -30%; width: 160%; height: 120%; background: radial-gradient(closest-side, rgba(255,180,100,.45), transparent); transition: opacity 1.6s var(--ease-light); z-index: -1; }
  .rt { position: absolute; left: 12px; right: 12px; bottom: 12px; display: flex; flex-direction: column; }
  .photo .rt { color: #fff; }
  .rt b { font-weight: 600; font-size: 16px; }
  .rt span { font-size: 12px; opacity: .8; }
  .here { position: absolute; top: 10px; left: 10px; font-size: 11px; padding: 3px 8px; border-radius: 999px; background: var(--accent); color: var(--on-accent); }
  .room.all { width: 140px; background: var(--surface-2); }
  .room.all .rt { gap: 4px; color: var(--sub); }
  .pres { position: absolute; top: -130px; right: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--cool); box-shadow: 0 0 0 4px var(--cool-soft); }
  .photo .pres { background: #7CC6D6; box-shadow: 0 0 0 4px rgba(124,198,214,.35); }

  .fav { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .links { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .lk { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 14px; text-align: left; color: var(--text); }
  .lk b { font-weight: 600; margin-top: 8px; }
  .lk span { font-size: 12px; color: var(--muted); }
  :global([data-trend="minimal"]) .sh { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: var(--muted); }
  :global([data-trend="minimal"]) .facts > * { border-radius: 0; background: transparent; border: 1px solid var(--border); }
  :global([data-trend="minimal"]) .spark { border-radius: 0; }
  :global([data-trend="minimal"]) .room { border-radius: 2px; }
  :global([data-trend="minimal"]) .pres { border-radius: 0; box-shadow: none; }
  :global([data-trend="minimal"]) h1 { font-size: 40px; }
</style>
