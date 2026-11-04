<script lang="ts">
  import Photo from '../ui/Photo.svelte';
  import Hotspot from '../ui/Hotspot.svelte';
  import Slider from '../ui/Slider.svelte';
  import Icon from '../ui/Icon.svelte';
  import Swap from '../ui/Swap.svelte';
  import { house, roomById, deviceById } from '../core/house';
  import { home, dev, cmd, runScene } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { go, devArg } from '../client/router.svelte';
  import { roomLight, roomTemp, fmtT, people, lightsOn } from '../client/derive.svelte';
  import { photoRooms, photoFor, spotsOn, photoDim } from '../client/rooms';

  // Комната «как на рендере дизайнера»: фото интерьера, на нём — живой свет и точки управления.
  let { arg = '' }: { arg?: string } = $props();
  let room = $state(photoRooms.includes(arg) ? arg : 'living');
  let sel = $state('');
  const r = $derived(roomById[room]);
  const photo = $derived(photoFor(room, !!home.s?.night));
  const spots = $derived(spotsOn(photo));
  const lights = $derived(spots.filter(s => s.caps.includes('dimmer')));
  const dim = $derived(home.s ? photoDim(photo, roomLight(room), home.s) : 0);
  const selDev = $derived(sel ? deviceById[sel] : null);
  // гостиная-фото кадрировано так, чтобы главное было справа
  const ox = $derived(room === 'living' ? 0.62 : 0.5);

  const roomScenes = $derived(house.roomScenes[room] ?? [
    { id: 'bright', name: 'Ярко', set: {} }, { id: 'soft', name: 'Мягко', set: {} }, { id: 'off', name: 'Выкл.', set: {} }
  ]);
  function scene(id: string) {
    if (house.roomScenes[room]) return runScene(id, room);
    const lv = id === 'bright' ? 100 : id === 'soft' ? 30 : 0;
    house.devices.filter(d => d.room === room && d.caps.includes('dimmer')).forEach((d, i) => setTimeout(() => cmd({ cmd: 'light.set', target: d.id, level: lv }), i * 80));
  }
  function pick(id: string) { room = id; sel = ''; history.replaceState(null, '', '#room-' + id); }
  function tap(id: string) {
    const d = deviceById[id];
    sel = id;
    if (d.caps.includes('dimmer')) cmd({ cmd: 'light.set', target: id, on: !((dev(id).level ?? 0) > 0) });
    else if (d.caps.includes('shade')) cmd({ cmd: 'shade.set', target: id, position: (dev(id).position ?? 0) > 50 ? 0 : 100 });
    else if (d.caps.includes('media')) go('media');
  }
  const isOn = (id: string) => { const s = dev(id); const c = deviceById[id].caps; return c.includes('dimmer') ? (s.level ?? 0) > 0 : c.includes('shade') ? (s.position ?? 0) > 0 : !!s.on; };
  const sub = (id: string) => { const s = dev(id); const c = deviceById[id].caps; return c.includes('dimmer') ? ((s.level ?? 0) > 0 ? `${s.level}%` : 'выкл.') : c.includes('shade') ? `${s.position}%` : s.on ? 'вкл.' : 'выкл.'; };
</script>

<div class="scr {theme.profile}">
  <Swap key={room + photo} index={photoRooms.indexOf(room)} class="fill" onswipe={(d) => { const n = photoRooms.indexOf(room) + d; if (photoRooms[n]) pick(photoRooms[n]); }}>
  <Photo {photo} {ox} lights={lights} {dim} rounded={theme.profile === 'tablet'}>
    {#snippet children(map)}
      {#each spots as s (s.id)}
        {@const [x, y] = map(s.x, s.y)}
        <Hotspot {x} {y} on={isOn(s.id)} label={s.name} sub={sub(s.id)} open={sel === s.id || theme.profile === 'tablet' && !sel}
          onclick={() => tap(s.id)} onopen={() => (sel = s.id)} />
      {/each}
    {/snippet}
  </Photo>
  </Swap>

  <div class="top">
    {#if theme.profile === 'phone'}
      <button class="glass round press" aria-label="Назад" onclick={() => history.length > 1 ? history.back() : go('home')}><Icon name="back" /></button>
    {/if}
    <div class="glass title rise">
      <h1>{r.name}</h1>
      <span class="num">{fmtT(roomTemp(room))}° · {lightsOn(room)} свет{people(room) ? ` · ${people(room)} чел.` : ''}</span>
    </div>
    <div class="glass tabs scroll-x">
      {#each photoRooms as id}
        <button class="tab" class:on={id === room} onclick={() => pick(id)}>{roomById[id].name}</button>
      {/each}
    </div>
  </div>

  <div class="bottom glass rise" style="animation-delay:.15s">
    <div class="scenes scroll-x">
      {#each roomScenes as s}
        <button class="chip press" class:on={home.s?.roomScene[room] === s.id} onclick={() => scene(s.id)}>{s.name}</button>
      {/each}
      <button class="chip press" onclick={() => go('plan', room)}><Icon name="plan" size={18} />На плане</button>
    </div>
    {#if selDev && (selDev.caps.includes('dimmer') || selDev.caps.includes('shade'))}
      {#key sel}
        <div class="ctl">
          <div class="cn"><b>{selDev.name}</b>
            {#if selDev.assets?.model}<button class="link" onclick={() => go('lamp', devArg(sel))}>Подробнее<Icon name="next" size={16} /></button>{/if}
          </div>
          {#if selDev.caps.includes('dimmer')}
            <Slider label="Яркость" value={dev(sel).level ?? 0} onchange={(v) => cmd({ cmd: 'light.set', target: sel, level: v })} />
          {:else}
            <Slider label="Шторы" value={dev(sel).position ?? 0} step={5} onchange={(v) => cmd({ cmd: 'shade.set', target: sel, position: v })} />
          {/if}
        </div>
      {/key}
    {:else}
      <p class="hint">Нажмите на точку — свет включится или погаснет; потом можно подстроить яркость.</p>
    {/if}
  </div>
</div>

<style>
  .scr { position: relative; height: var(--screen-h); min-height: 520px; }
  .tablet { padding: max(20px, env(safe-area-inset-top, 0px)) max(20px, env(safe-area-inset-right, 0px)) 20px 20px; }
  .scr :global(.swap.fill) { position: absolute; inset: 0; }
  .tablet :global(.swap.fill) { inset: max(20px, env(safe-area-inset-top, 0px)) max(20px, env(safe-area-inset-right, 0px)) 20px 20px; border-radius: var(--r-xl); }
  .scr :global(.swap.fill .pane) { position: relative; height: 100%; }
  .scr :global(.ph) { position: absolute; inset: 0; }

  .glass { background: rgba(14,15,18,.5); color: #F4F1EC; border: 1px solid rgba(255,255,255,.14); -webkit-backdrop-filter: blur(22px) saturate(1.3); backdrop-filter: blur(22px) saturate(1.3); }
  .top { position: absolute; z-index: 3; left: 0; right: 0; top: 0; display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; pointer-events: none; }
  .top > * { pointer-events: auto; }
  .tablet .top { padding: 40px 40px 0 40px; }
  .phone .top { padding: max(16px, env(safe-area-inset-top, 0px)) 16px 0; }
  .round { width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; }
  .title { padding: 12px 18px; border-radius: 20px; display: flex; flex-direction: column; }
  .title h1 { font-size: 26px; font-weight: 400; }
  .title span { font-size: 13px; opacity: .75; }
  .tabs { margin-left: auto; padding: 4px; border-radius: 999px; max-width: 100%; }
  .phone .tabs { margin-left: 0; order: 3; }
  .tab { height: 38px; padding: 0 14px; border: 0; border-radius: 999px; background: none; color: rgba(255,255,255,.7); font-weight: 500; white-space: nowrap; transition: background-color var(--dur-m), color var(--dur-m); }
  .tab.on { background: rgba(255,255,255,.92); color: #111; }

  .bottom { position: absolute; z-index: 3; display: flex; flex-direction: column; gap: 12px; padding: 14px; border-radius: 24px; }
  .tablet .bottom { left: 40px; bottom: 40px; width: min(560px, calc(100% - 80px)); }
  .phone .bottom { left: 12px; right: 12px; bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
  .bottom .chip { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.14); color: #F4F1EC; height: 40px; }
  .bottom .chip.on { background: rgba(255,214,150,.22); border-color: rgba(255,214,150,.5); color: #FFE2B8; }
  .ctl { display: flex; flex-direction: column; gap: 10px; animation: rise .5s var(--ease-out) both; }
  .cn { display: flex; justify-content: space-between; align-items: center; }
  .cn b { font-weight: 600; }
  .link { border: 0; background: none; color: #FFE2B8; display: inline-flex; align-items: center; gap: 2px; font-size: 14px; }
  .hint { margin: 0; font-size: 13px; opacity: .7; }
  .ctl :global(.sl.s-fill .track) { background: rgba(255,255,255,.12); }

  :global([data-trend="minimal"]) .glass { background: rgba(13,13,13,.86); backdrop-filter: none; border-color: rgba(255,255,255,.12); border-radius: 2px; }
  :global([data-trend="minimal"]) .title h1 { font-weight: 600; text-transform: uppercase; letter-spacing: .02em; font-size: 22px; }
  :global([data-trend="minimal"]) .tab { border-radius: 0; text-transform: uppercase; font-size: 12px; letter-spacing: .1em; font-weight: 600; }
  :global([data-trend="minimal"]) .tab.on { background: #EDEDEA; }
  :global([data-trend="minimal"]) .bottom .chip { border-radius: 0; }
  :global([data-trend="minimal"]) .bottom .chip.on { background: var(--accent); border-color: var(--accent); color: #0D0D0D; }
  :global([data-trend="minimal"]) .round { border-radius: 0; }
  :global([data-trend="minimal"]) .ctl :global(.sl.s-hairline .track) { background: rgba(255,255,255,.3); }
  :global([data-trend="minimal"]) .ctl :global(.sl.s-hairline .fill) { background: #fff; }
</style>
