<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Events from '../ui/Events.svelte';
  import { house, roomById, floors, floorOf } from '../core/house';
  import { photoFor } from '../client/rooms';
  import { home, cmd } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { clock } from '../client/derive.svelte';
  import type { SecurityMode } from '../core/types';

  let { arg = '' }: { arg?: string } = $props();
  const sec = $derived(home.s!.security);
  const modes: { id: SecurityMode; name: string; text: string; icon: string }[] = [
    { id: 'disarmed', name: 'Снята', text: 'датчики только пишут в журнал', icon: 'person' },
    { id: 'perimeter', name: 'Периметр', text: 'двери, окна, участок', icon: 'house' },
    { id: 'full', name: 'Полная', text: 'все зоны, включая дом', icon: 'lock' }
  ];
  const title = $derived(sec.mode === 'disarmed' ? 'Охрана снята' : sec.mode === 'perimeter' ? 'Периметр под охраной' : 'Дом под полной охраной');
  const alarm = $derived(Object.values(sec.zones).some(z => z === 'motion'));
  const zoneText = { ok: 'норма', open: 'открыто', motion: 'движение' };
  // ракурсы «камер»: кадры из фото дома (в продукте — RTSP→WebRTC поток с регистратора)
  const view: Record<string, { pos: string; zoom: number }> = {
    terrace: { pos: '42% 78%', zoom: 2.1 }, gate: { pos: '92% 80%', zoom: 2.6 }, entrance: { pos: '68% 52%', zoom: 2.9 }, garage: { pos: '8% 62%', zoom: 2.3 }
  };
  const src = $derived(home.s?.night ? './photos/house-dusk.jpg' : './photos/house-day.jpg');
  // внутренние камеры: кадр из рендера комнаты, если он есть; иначе — заглушка вместо потока
  const camSrc = (id: string) => view[id] ? src : roomById[id]?.photo ? house.photos[photoFor(id, !!home.s?.night)].src : '';
  const camView = (id: string) => view[id] ?? { pos: '50% 50%', zoom: 1.15 };
  let big = $state('');
  // Сначала улица и вход; внутренние камеры — по этажам, по запросу. Камера с движением показывается всегда.
  const outdoor = house.cameras.filter(c => !roomById[c.id]);
  const inside = house.cameras.filter(c => roomById[c.id]);
  let camFloor = $state(0);
  const shownCams = $derived([...outdoor, ...inside.filter(c => floorOf(c.id) === camFloor || home.s?.cameras[c.id])]);
  const insideFloors = floors.map(f => ({ ...f, n: inside.filter(c => floorOf(c.id) === f.id).length })).filter(f => f.n);
  let tick = $state(0);
  $effect(() => { const id = setInterval(() => tick++, 1000); return () => clearInterval(id); });
  const time = $derived((void tick, new Date().toLocaleTimeString('ru-RU')));
</script>

<div class="scr {theme.profile}">
  <section class="state card rise" class:armed={sec.mode !== 'disarmed'} class:alarm>
    <div class="shield"><Icon name="shield" size={34} /></div>
    <div class="st">
      <span class="label">с {sec.since}</span>
      <h1>{alarm ? 'Движение в зоне' : title}</h1>
      <span class="sub">{alarm ? 'камера записывает, уведомление отправлено' : Object.values(sec.zones).filter(z => z === 'open').length ? 'есть открытые окна — периметр с исключением' : 'все зоны в норме'}</span>
    </div>
  </section>

  <div class="modes rise" style="animation-delay:.06s" role="radiogroup" aria-label="Режим охраны">
    {#each modes as m}
      <button class="mode press" class:on={sec.mode === m.id} role="radio" aria-checked={sec.mode === m.id} onclick={() => cmd({ cmd: 'security.arm', mode: m.id })}>
        <Icon name={m.icon} size={22} /><b>{m.name}</b><span>{m.text}</span>
      </button>
    {/each}
  </div>

  <section class="cams rise" style="animation-delay:.12s" aria-label="Камеры">
    {#if inside.length}
      <div class="cf" role="group" aria-label="Внутренние камеры">
        <span class="label">Улица · {outdoor.length}</span>
        {#each insideFloors as f}
          <button class="chip press" class:on={camFloor === f.id} onclick={() => (camFloor = camFloor === f.id ? 0 : f.id)}>{f.name} · {f.n}</button>
        {/each}
      </div>
    {/if}
    {#each shownCams as c (c.id)}
      {@const hot = home.s?.cameras[c.id]}
      <button class="cam" class:hot class:night={home.s?.night} class:big={big === c.id} onclick={() => (big = big === c.id ? '' : c.id)} aria-label="Камера {c.name}">
        {#if camSrc(c.id)}
          <img src={camSrc(c.id)} alt="" style="object-position:{camView(c.id).pos}; transform: scale({camView(c.id).zoom}); transform-origin:{camView(c.id).pos}" draggable="false" />
        {:else}
          <span class="nofeed">поток с регистратора</span>
        {/if}
        <span class="scan"></span>
        {#if hot}<span class="box"><i>человек 92%</i></span>{/if}
        <span class="hud"><i class="rec"></i><b>{c.name}</b><span class="num">{time}</span></span>
        <span class="subl">{c.sub}</span>
      </button>
    {/each}
  </section>

  <section class="card zones rise" style="animation-delay:.18s">
    <h2 class="sh">Зоны</h2>
    <ul>
      {#each house.zones as z}
        {@const st = sec.zones[z.id]}
        <li class={st}><span>{z.name}</span><b>{zoneText[st]}</b></li>
      {/each}
    </ul>
  </section>

  <section class="card ev rise" style="animation-delay:.22s">
    <h2 class="sh">Журнал</h2>
    <Events limit={6} kind="security" />
  </section>
</div>

<style>
  .scr { display: grid; gap: 14px; padding: max(24px, env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) 80px 28px; align-content: start; }
  .tablet { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); grid-template-areas: 'state cams' 'modes cams' 'zones ev'; }
  .tablet .state { grid-area: state; } .tablet .modes { grid-area: modes; } .tablet .cams { grid-area: cams; } .tablet .zones { grid-area: zones; } .tablet .ev { grid-area: ev; }
  .phone { grid-template-columns: minmax(0, 1fr); padding: max(20px, env(safe-area-inset-top, 0px)) 16px 20px; }

  .state { display: flex; gap: 18px; align-items: center; padding: 22px; transition: background-color 1s, border-color 1s; }
  .shield { width: 72px; height: 72px; flex: none; border-radius: 24px; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); transition: background-color .8s, color .8s; }
  .armed .shield { background: color-mix(in srgb, var(--ok) 18%, transparent); color: var(--ok); }
  .alarm { border-color: var(--danger); background: var(--danger-soft); }
  .alarm .shield { background: var(--danger); color: #fff; animation: pop .6s var(--spring) both; }
  .st { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .st h1 { font-size: clamp(24px, 3vw, 32px); }
  .sub { color: var(--muted); font-size: 14px; }

  .modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .mode { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 14px; border-radius: var(--r-lg); border: 1px solid var(--border); background: var(--surface); text-align: left; color: var(--sub); min-width: 0; }
  .mode b { font-size: 16px; font-weight: 600; color: var(--text); }
  .mode span { font-size: 12px; color: var(--muted); }
  .mode.on { background: var(--inv-bg); border-color: var(--inv-bg); color: var(--inv-text); }
  .mode.on b, .mode.on span { color: var(--inv-text); }
  .mode.on span { opacity: .7; }

  .cams { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-content: start; }
  .cf { grid-column: 1 / -1; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .cf .label { margin-right: 4px; }
  .cf .chip { height: 34px; font-size: 13px; padding: 0 12px; }
  .cam { position: relative; aspect-ratio: 16 / 10; border-radius: var(--r-lg); overflow: hidden; border: 2px solid transparent; padding: 0; background: #000; transition: border-color .4s; }
  .cam.big { grid-column: 1 / -1; }
  .cam img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(.7) contrast(1.05); transition: transform 1.2s var(--ease-out); }
  .cam.night img { filter: grayscale(1) contrast(1.25) brightness(1.35); }
  .scan { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px); animation: flick 3s steps(3) infinite; pointer-events: none; }
  @keyframes flick { 50% { opacity: .6; } }
  .hud { position: absolute; left: 10px; top: 10px; right: 10px; display: flex; align-items: center; gap: 6px; color: #fff; font-size: 12px; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
  .hud .num { margin-left: auto; opacity: .85; }
  .rec { width: 7px; height: 7px; border-radius: 50%; background: #ff4b3a; animation: breathe 1.4s infinite; }
  .subl { position: absolute; left: 10px; bottom: 8px; color: rgba(255,255,255,.75); font-size: 11px; }
  .cam.hot { border-color: var(--danger); }
  .box { position: absolute; left: 40%; top: 34%; width: 16%; height: 46%; border: 2px solid #ff4b3a; animation: pop .5s var(--spring) both, drift 4s ease-in-out infinite; }
  .box i { position: absolute; left: -2px; top: -20px; background: #ff4b3a; color: #fff; font-size: 10px; font-style: normal; padding: 2px 5px; white-space: nowrap; }
  @keyframes drift { 50% { transform: translateX(14px); } }

  .zones, .ev { padding: 16px; }
  .sh { font-size: 15px; font-family: var(--font-ui); font-weight: 600; letter-spacing: 0; margin-bottom: 8px; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
  li:last-child { border-bottom: 0; }
  li b { font-weight: 500; color: var(--ok); }
  li.open b { color: var(--accent-text); }
  li.motion b { color: var(--danger); }
  :global([data-trend="minimal"]) .shield, :global([data-trend="minimal"]) .cam { border-radius: 0; }
  :global([data-trend="minimal"]) .sh { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: var(--muted); }
  :global([data-trend="minimal"]) .mode b { text-transform: uppercase; letter-spacing: .06em; font-size: 14px; }
  :global([data-trend="minimal"]) li b { font-family: var(--font-num); font-size: 12px; text-transform: uppercase; }
  .nofeed { position: absolute; inset: 0; display: grid; place-items: center; background: repeating-linear-gradient(135deg, #15161a 0 10px, #1b1c21 10px 20px); color: rgba(255,255,255,.45); font-size: 12px; }
</style>
