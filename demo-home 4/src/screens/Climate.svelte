<script lang="ts">
  import Gauge from '../ui/Gauge.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import Toggle from '../ui/Toggle.svelte';
  import Icon from '../ui/Icon.svelte';
  import Swap from '../ui/Swap.svelte';
  import { house, roomById, devicesIn, floors, floorOf } from '../core/house';
  import { climateRooms, multiFloor, hereRoom } from '../client/nav.svelte';
  import { dev, cmd } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { fmtT } from '../client/derive.svelte';

  let { arg = '' }: { arg?: string } = $props();
  // Комнаты по этажам; в комнате может быть несколько приборов (радиаторы + кондиционер).
  const rooms = climateRooms.map(r => ({ id: r.id, dev: devicesIn(r.id).find(d => d.caps.includes('climate'))!.id }));
  let room = $state(rooms.some(r => r.id === arg) ? arg : rooms.some(r => r.id === hereRoom()) ? hereRoom() : rooms[0].id);
  let floor = $state(floorOf(room));
  const onFloor = $derived(rooms.filter(r => floorOf(r.id) === floor));
  const devs = $derived(devicesIn(room).filter(d => d.caps.includes('climate')));
  let pickDev = $state('');
  const id = $derived(devs.find(d => d.id === pickDev)?.id ?? devs[0].id);
  const isAc = $derived(devs.find(d => d.id === id)?.kind === 'ac');
  function pickRoom(r: string) { room = r; pickDev = ''; floor = floorOf(r); history.replaceState(null, '', '#climate-' + r); }
  const floorsHeat = house.devices.filter(d => d.caps.includes('floorHeat'));
  const s = $derived(dev(id));
  const diff = $derived((s.target ?? 22) - (s.current ?? 22));
  const eta = $derived(`ещё ~${Math.ceil(Math.abs(diff) * 14)} мин`);
  const status = $derived(s.mode === 'off' ? (isAc ? 'сезон отопления: охлаждение заблокировано' : 'климат выключен') : Math.abs(diff) < 0.1 ? 'держу температуру'
    : diff > 0 ? (s.mode === 'cool' ? 'охлаждение не требуется' : `нагрев, ${eta}`)
    : (s.mode === 'heat' ? 'обогрев на паузе' : `охлаждение, ${eta}`));
  const ri = $derived(rooms.findIndex(r => r.id === room));
  const step = (d: 1 | -1) => { const n = ri + d; if (n >= 0 && n < rooms.length) pickRoom(rooms[n].id); };
  const set = (t: number) => cmd({ cmd: 'climate.set', target: id, target_c: Math.max(16, Math.min(28, t)) });

</script>

<div class="scr {theme.profile}">
  <header class="rise">
    <h1>Климат</h1>
    {#if multiFloor}
      <Segmented label="Этаж" value={String(floor)} options={floors.map(f => ({ id: String(f.id), name: f.name }))}
        onchange={(v) => { floor = Number(v); const f = rooms.find(r => floorOf(r.id) === floor); if (f) pickRoom(f.id); }} />
    {/if}
    <div class="tabs scroll-x">
      {#each onFloor as r}
        <button class="chip press" class:on={r.id === room} onclick={() => pickRoom(r.id)}>{roomById[r.id].name}</button>
      {/each}
    </div>
  </header>

  <section class="main card rise" style="animation-delay:.06s">
    <Swap key={room} index={ri} onswipe={step}>
      <div class="pane">
        <div class="rn">
          <h2>{roomById[room].name}</h2>
          <span class="label">{ri + 1} из {rooms.length}</span>
        </div>
        {#if devs.length > 1}
          <Segmented label="Прибор" value={id} options={devs.map(d => ({ id: d.id, name: d.kind === 'ac' ? 'Кондиционер' : 'Радиаторы' }))} onchange={(v) => (pickDev = v)} />
        {/if}
        <div class="dial">
          <Gauge value={s.current ?? 21} target={s.target ?? 22} size={theme.profile === 'tablet' ? 320 : 260}>
            <span class="label">сейчас</span>
            <span class="cur num">{fmtT(s.current)}°</span>
            <span class="tg">цель <b class="num">{fmtT(s.target)}°</b></span>
          </Gauge>
        </div>
        <div class="pm">
          <button class="big press" aria-label="Холоднее на полградуса" onclick={() => set((s.target ?? 22) - 0.5)}><Icon name="minus" size={26} /></button>
          <span class="st" class:heat={diff > 0.1 && (s.mode === 'heat' || s.mode === 'auto')} class:cool={diff < -0.1 && (s.mode === 'cool' || s.mode === 'auto')}>{status}</span>
          <button class="big press" aria-label="Теплее на полградуса" onclick={() => set((s.target ?? 22) + 0.5)}><Icon name="plus" size={26} /></button>
        </div>
        <Segmented label="Режим" value={s.mode ?? 'auto'} onchange={(v) => cmd({ cmd: 'climate.set', target: id, mode: v as any })}
          options={[{ id: 'heat', name: 'Обогрев' }, { id: 'cool', name: 'Охлаждение' }, { id: 'auto', name: 'Авто' }, { id: 'off', name: 'Выкл.' }]} />
      </div>
    </Swap>
  </section>

  <aside class="side">
    <div class="card info rise" style="animation-delay:.12s">
      <div><Icon name="drop" /><span><b class="num">{s.humidity ?? 42}%</b><i>влажность</i></span></div>
      <div><Icon name="leaf" /><span><b class="num">612</b><i>CO₂, ppm</i></span></div>
    </div>
    {#each floorsHeat as fd}
      {@const f = dev(fd.id)}
      <div class="card floor rise" style="animation-delay:.16s">
        <span class="fi"><Icon name="flame" /></span>
        <span class="ft"><b>Тёплый пол · {roomById[fd.room].name.toLowerCase()}</b><i class="num">{f.on ? `${f.target}° пола` : 'выключен'}</i></span>
        <Toggle on={!!f.on} label="Тёплый пол" onchange={() => cmd({ cmd: 'media.action', target: fd.id, action: 'power' })} />
      </div>
    {/each}
    <div class="card list rise" style="animation-delay:.2s">
      <h2 class="sh">Все комнаты</h2>
      {#each rooms as r, i}
        {@const d = dev(r.dev)}
        {#if multiFloor && (i === 0 || floorOf(rooms[i - 1].id) !== floorOf(r.id))}<div class="fh">{floors.find(f => f.id === floorOf(r.id))?.name}</div>{/if}
        <button class="rr" class:on={r.id === room} onclick={() => pickRoom(r.id)}>
          <span>{roomById[r.id].name}</span>
          <span class="num">{fmtT(d.current)}°<i> → {fmtT(d.target)}°</i></span>
        </button>
      {/each}
    </div>
  </aside>
</div>

<style>
  .scr { display: grid; gap: 16px; padding: max(24px, env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) 80px 28px; align-content: start; }
  .tablet { grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr); }
  .tablet header { grid-column: 1 / -1; }
  .phone { grid-template-columns: minmax(0, 1fr); padding: max(20px, env(safe-area-inset-top, 0px)) 16px 20px; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; min-width: 0; }
  .phone header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; }
  .phone .tabs { margin: 0 -16px; padding: 0 16px; }
  h1 { font-size: clamp(30px, 4vw, 44px); }
  .tabs .chip { height: 40px; }
  .main { padding: 20px 24px 24px; min-width: 0; }
  .pane { display: flex; flex-direction: column; align-items: stretch; gap: 18px; padding: 2px; }
  .rn { display: flex; justify-content: space-between; align-items: baseline; }
  .rn h2 { font-size: 22px; }
  .phone .main { padding: 16px; }
  .dial { display: grid; place-items: center; }
  .cur { font-size: 64px; letter-spacing: -.04em; line-height: 1; margin: 4px 0; font-weight: 300; }
  .phone .cur { font-size: 54px; }
  .tg { font-size: 15px; color: var(--sub); }
  .tg b { color: var(--text); font-weight: 500; }
  .pm { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .phone .big { width: 56px; height: 56px; }
  .big { width: 64px; height: 64px; flex: none; border-radius: 50%; border: 1px solid var(--border-strong); background: var(--surface); display: grid; place-items: center; }
  .st { text-align: center; font-size: 14px; color: var(--muted); }
  .st.heat { color: var(--accent-text); }
  .st.cool { color: var(--cool-text); }
  .side { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .info { display: grid; grid-template-columns: 1fr 1fr; padding: 16px; gap: 10px; }
  .info > div { display: flex; gap: 10px; align-items: center; color: var(--muted); }
  .info span, .ft { display: flex; flex-direction: column; }
  .info b { font-size: 22px; font-weight: 400; color: var(--text); }
  i { font-style: normal; font-size: 12px; color: var(--muted); }
  .floor { display: flex; align-items: center; gap: 12px; padding: 14px; }
  .fi { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-text); }
  .ft { flex: 1; min-width: 0; }
  .ft b { font-weight: 500; }
  .list { padding: 16px; }
  .sh { font-size: 15px; font-family: var(--font-ui); font-weight: 600; letter-spacing: 0; margin-bottom: 6px; }
  .rr { width: 100%; display: flex; justify-content: space-between; padding: 11px 0; border: 0; border-bottom: 1px solid var(--border); background: none; text-align: left; }
  .rr:last-child { border-bottom: 0; }
  .fh { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); padding: 14px 0 2px; }
  header :global(.seg) { width: auto; }
  .rr.on { color: var(--accent-text); }
  :global([data-trend="minimal"]) .big, :global([data-trend="minimal"]) .fi { border-radius: 0; }
  :global([data-trend="minimal"]) .sh { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: var(--muted); }
  :global([data-trend="minimal"]) .cur { font-weight: 400; }
</style>
