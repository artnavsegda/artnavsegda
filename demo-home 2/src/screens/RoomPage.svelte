<script lang="ts">
  import RoomBody from '../ui/RoomBody.svelte';
  import Icon from '../ui/Icon.svelte';
  import Swap from '../ui/Swap.svelte';
  import PlanSvg from '../ui/PlanSvg.svelte';
  import { floorOf } from '../core/house';
  import { house, roomById, devicesIn } from '../core/house';
  import { home, cmd, runScene } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { go } from '../client/router.svelte';
  import { roomLight, fmtT, pluralPeople } from '../client/derive.svelte';
  import { photoFor, photoDim } from '../client/rooms';
  import { siblings, roomStatus, floorName, multiFloor, hereRoom } from '../client/nav.svelte';

  // Страница комнаты: одна и та же для любой комнаты объекта. Фото интерьера, если
  // дизайнер его сделал, — шапка страницы; без фото страница остаётся полноценной.
  let { arg = '' }: { arg?: string } = $props();
  let room = $state(roomById[arg] ? arg : hereRoom());
  const r = $derived(roomById[room]);
  const sib = $derived(siblings(room));
  const st = $derived(roomStatus(room));
  const photo = $derived(photoFor(room, !!home.s?.night));
  const dim = $derived(home.s && photo ? photoDim(photo, roomLight(room), home.s) : 0);

  const scenes = $derived(house.roomScenes[room] ?? [
    { id: 'bright', name: 'Ярко', set: {} }, { id: 'soft', name: 'Мягко', set: {} }, { id: 'off', name: 'Выкл.', set: {} }
  ]);
  function scene(id: string) {
    if (house.roomScenes[room]) return runScene(id, room);
    const lv = id === 'bright' ? 100 : id === 'soft' ? 30 : 0;
    devicesIn(room).filter(d => d.caps.includes('dimmer')).forEach((d, i) => setTimeout(() => cmd({ cmd: 'light.set', target: d.id, level: d.kind === 'mood' && id === 'soft' ? 50 : lv }), i * 70));
  }
  function pick(id: string | undefined) { if (!id) return; room = id; history.replaceState(null, '', '#room-' + id); }
  const back = () => (history.length > 1 ? history.back() : go('rooms'));
  const statusLine = $derived([
    st.temp !== undefined ? `${fmtT(st.temp)}°` : '',
    st.people ? pluralPeople(st.people) : st.here ? 'есть движение' : 'никого',
    st.lights ? `свет: ${st.lights}` : 'свет выкл.',
    st.media ? (st.media.caps.includes('speaker') ? 'играет музыка' : `${st.media.name.toLowerCase()} вкл.`) : ''
  ].filter(Boolean).join(' · '));
</script>

<div class="scr {theme.profile}">
  <nav class="bar rise" aria-label="Навигация по комнатам">
    <button class="icon press" aria-label="Назад к списку комнат" onclick={back}><Icon name="back" /></button>
    <button class="crumb" onclick={() => go('rooms')}>{multiFloor ? floorName(room) : 'Комнаты'}<span class="num">&nbsp;· {sib.i + 1} из {sib.list.length}</span></button>
    <span class="sp"></span>
    <button class="icon press" aria-label="Предыдущая комната" disabled={!sib.prev} onclick={() => pick(sib.prev)}><Icon name="back" size={18} /></button>
    <button class="icon press" aria-label="Следующая комната" disabled={!sib.next} onclick={() => pick(sib.next)}><Icon name="next" size={18} /></button>
  </nav>

  <Swap key={room} index={sib.i} onswipe={(d) => pick(d > 0 ? sib.next : sib.prev)}>
    <div class="grid">
      <div class="lead">
        {#if photo}
          <button class="hero photo" onclick={() => go('photo', room)} aria-label="Фото комнаты с живым светом">
            <img src={house.photos[photo].src} alt="" draggable="false" />
            <span class="dim" style="opacity:{dim}"></span>
            <span class="ph"><Icon name="room" size={16} />Фото с живым светом<Icon name="next" size={14} /></span>
          </button>
        {:else}
          <!-- рендера нет — шапкой служит план этажа: видно, где комната и горит ли свет -->
          <div class="hero mini"><PlanSvg floor={floorOf(room)} selected={room} onselect={(id) => pick(id)} compact /></div>
        {/if}
        <div class="title">
          <h1>{r.name}</h1>
          <span class="label num">{statusLine}</span>
        </div>
        <div class="scenes scroll-x" role="group" aria-label="Сцены комнаты">
          {#each scenes as s}
            <button class="chip press" class:on={home.s?.roomScene[room] === s.id} onclick={() => scene(s.id)}>{s.name}</button>
          {/each}
        </div>
      </div>
      <div class="devs"><RoomBody {room} /></div>
    </div>
  </Swap>
</div>

<style>
  .scr { display: flex; flex-direction: column; gap: 14px; padding: max(18px, env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) 80px 28px; }
  .phone { padding: max(12px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 24px max(16px, env(safe-area-inset-left, 0px)); }
  .bar { display: flex; align-items: center; gap: 6px; }
  .icon { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); display: grid; place-items: center; color: var(--text); flex: none; }
  .icon:disabled { opacity: .3; }
  .crumb { border: 0; background: none; font-size: 14px; color: var(--sub); padding: 0 6px; height: 44px; }
  .crumb .num { color: var(--muted); }
  .sp { flex: 1; }
  .grid { display: grid; gap: 18px; align-items: start; }
  .tablet .grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: 24px; }
  .lead { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
  .tablet .lead { position: sticky; top: 0; }
  .hero { position: relative; width: 100%; border-radius: var(--r-xl); overflow: hidden; border: 0; padding: 0; aspect-ratio: 16 / 9; background: var(--surface-2); }
  .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hero .dim { position: absolute; inset: 0; background: #000; transition: opacity 1.6s var(--ease-light); }
  .ph { position: absolute; left: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 999px;
    background: rgba(14,15,18,.55); color: #F4F1EC; font-size: 13px; -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); }
  .hero.mini { aspect-ratio: auto; padding: 12px; background: var(--paper); border: 1px solid var(--border); }
  .title { display: flex; flex-direction: column; gap: 4px; }
  h1 { font-size: clamp(30px, 4vw, 40px); }
  .scenes { display: flex; gap: 8px; }
  .scenes .chip { height: 40px; flex: none; }
  .devs { min-width: 0; }
  :global([data-trend="minimal"]) .hero, :global([data-trend="minimal"]) .icon, :global([data-trend="minimal"]) .ph { border-radius: 0; }
  :global([data-trend="minimal"]) h1 { text-transform: uppercase; font-weight: 600; letter-spacing: .01em; }
</style>
