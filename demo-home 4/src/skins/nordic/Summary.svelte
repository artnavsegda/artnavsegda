<script lang="ts">
  import Icon from '../../ui/Icon.svelte';
  import DeviceTile from '../../ui/DeviceTile.svelte';
  import Ic from './Icons.svelte';
  import { house } from '../../core/house';
  import { home, runScene } from '../../client/store.svelte';
  import { theme } from '../../client/theme.svelte';
  import { go } from '../../client/router.svelte';
  import { greeting, dateLine, roomLight, roomTemp, fmtT, lightsOn, occupied, sceneOrder, sceneIcon } from '../../client/derive.svelte';
  import { photoFor } from '../../client/rooms';
  import { activeRooms } from '../../client/nav.svelte';
  import { stats } from '../../client/domscene.svelte';

  // «Нордик» — сводка как утро на кухне: записка на льняной карточке, сцены — камешки,
  // комнаты — фотографии в мягких рамках, избранное — дубовые плитки. Никакой спешки.
  const sug = $derived(home.s?.suggestion);
  const x = $derived(stats());
  const rooms = $derived(activeRooms().slice(0, 4).map(a => ({ r: a.r, ph: house.photos[photoFor(a.r.id, !!home.s?.night)]?.src })));
</script>

<div class="n {theme.profile}">
  <header class="rise">
    <span class="dl">{dateLine()}</span>
    <h1>{greeting()}</h1>
    <div class="wx">
      <span class="w"><Icon name={home.s?.night ? 'moon' : 'sun'} size={18} />{fmtT(x.outside)}° снаружи</span>
      <span class="w"><Ic name="climate" size={18} />{fmtT(x.inside)}° дома</span>
      <button class="w" onclick={() => go('security')}><Ic name="security" size={18} />{x.secName}</button>
    </div>
  </header>

  {#if sug}
    <section class="note rise">
      <span class="leaf"><Icon name="leaf" size={20} /></span>
      <div><b>{sug.title}</b><p>{sug.text}</p></div>
      <button class="go" onclick={() => runScene(sug.action.scene)}>{sug.action.label}</button>
    </section>
  {/if}

  <section class="rise">
    <h2>Настроение</h2>
    <div class="pebbles">
      {#each sceneOrder() as s, i (s.id)}
        <button class="pb" class:on={home.s?.scene === s.id} aria-pressed={home.s?.scene === s.id} style="--r:{i}" onclick={() => runScene(s.id)}><span class="st"><Icon name={sceneIcon[s.id]} size={20} /></span>{s.name}</button>
      {/each}
    </div>
  </section>

  <section class="rise">
    <div class="hr"><h2>Сейчас дома</h2><button class="more" onclick={() => go('rooms')}>все комнаты</button></div>
    <div class="photos">
      {#each rooms as a (a.r.id)}
        <button class="ph" onclick={() => go('room', a.r.id)}>
          <span class="img">{#if a.ph}<img src={a.ph} alt="" />{/if}<i style="opacity:{roomLight(a.r.id) * .9}"></i>{#if occupied(a.r.id)}<em class="pr"></em>{/if}</span>
          <b>{a.r.name}</b><small>{roomTemp(a.r.id) !== undefined ? `${fmtT(roomTemp(a.r.id))}° · ` : ''}{lightsOn(a.r.id) ? `свет ${lightsOn(a.r.id)}` : 'свет выключен'}</small>
        </button>
      {/each}
    </div>
  </section>

  <section class="rise">
    <h2>Под рукой</h2>
    <div class="fav">{#each house.favorites.home as id, i}<DeviceTile {id} delay={i * .04} />{/each}</div>
  </section>
</div>

<style>
  .n { display: flex; flex-direction: column; gap: 26px; max-width: 760px; margin: 0 auto; padding: max(24px, env(safe-area-inset-top, 0px)) max(18px, env(safe-area-inset-right, 0px)) 30px max(18px, env(safe-area-inset-left, 0px)); }
  .n.tablet { padding: 36px 40px; }
  .dl { font-size: 13px; color: var(--muted); }
  .dl:first-letter { text-transform: uppercase; }
  h1 { margin: 4px 0 14px; font: 300 44px/1.05 var(--font-display); letter-spacing: -.02em; }
  .wx { display: flex; flex-wrap: wrap; gap: 8px; }
  .w { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; border: 0; border-radius: 19px; background: var(--surface); box-shadow: var(--shadow); color: var(--sub); font: 500 13.5px var(--font-ui); }
  .note { display: grid; grid-template-columns: auto 1fr; gap: 12px 14px; padding: 18px; border-radius: 24px; background-color: var(--surface); background-image: var(--bg-img); box-shadow: var(--shadow); }
  .leaf { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-text); }
  .note b { font: 400 20px/1.2 var(--font-display); } .note p { margin: 4px 0 0; color: var(--sub); font-size: 14px; line-height: 1.45; }
  .go { grid-column: 1 / -1; justify-self: start; height: 42px; padding: 0 20px; border: 0; border-radius: 21px; background: var(--accent); color: var(--on-accent); font: 600 14px var(--font-ui); }
  h2 { margin: 0 0 12px; font: 350 23px var(--font-display); }
  .hr { display: flex; justify-content: space-between; align-items: baseline; }
  .more { border: 0; background: none; color: var(--accent-text); font: 500 13.5px var(--font-ui); text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--accent-border); }
  .pebbles { display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none; margin: 0 -18px; padding: 4px 18px 6px; }
  .pb { flex: none; display: flex; flex-direction: column; align-items: center; gap: 7px; border: 0; background: none; color: var(--sub); font: 500 12.5px var(--font-ui); }
  .st { width: 58px; height: 52px; display: grid; place-items: center; color: var(--text); border-radius: calc(46% + var(--r) * 1%) calc(54% - var(--r) * 1%) 50% 48% / 55% 48% calc(52% + var(--r) * 1%) 46%;
    background: radial-gradient(circle at 35% 30%, color-mix(in srgb, #fff 55%, var(--stone)), var(--stone) 65%, color-mix(in srgb, #000 12%, var(--stone))); box-shadow: 0 5px 12px rgba(60,45,25,.18); transition: transform .4s var(--spring); }
  .pb.on { color: var(--text); } .pb.on .st { background: radial-gradient(circle at 35% 30%, #B4CBB1, var(--accent) 65%, #55735A); color: #fff; transform: translateY(-3px); }
  .photos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .tablet .photos { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .ph { display: flex; flex-direction: column; gap: 3px; border: 0; background: none; padding: 0; text-align: left; color: var(--text); font: inherit; }
  .img { position: relative; aspect-ratio: 4 / 5; border-radius: 22px; overflow: hidden; margin-bottom: 6px; background: var(--surface-2); box-shadow: var(--shadow); }
  .img img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.85) sepia(.06); }
  .img i { position: absolute; inset: 0; background: radial-gradient(60% 50% at 50% 35%, rgba(255,190,120,.55), transparent 70%); mix-blend-mode: soft-light; }
  .pr { position: absolute; top: 10px; right: 10px; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px rgba(255,255,255,.6); }
  .ph b { font-weight: 500; font-size: 15px; padding-left: 4px; } .ph small { font-size: 12.5px; color: var(--muted); padding-left: 4px; }
  .fav { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .tablet .fav { grid-template-columns: repeat(3, minmax(0, 1fr)); }
</style>
