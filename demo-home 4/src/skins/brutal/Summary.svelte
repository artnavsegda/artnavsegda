<script lang="ts">
  import { house, deviceById } from '../../core/house';
  import { home, dev, cmd, runScene } from '../../client/store.svelte';
  import { theme } from '../../client/theme.svelte';
  import { go, devArg } from '../../client/router.svelte';
  import { roomTemp, fmtT, lightsOn, occupied, sceneOrder, clock } from '../../client/derive.svelte';
  import { photoFor } from '../../client/rooms';
  import { activeRooms } from '../../client/nav.svelte';
  import { stats } from '../../client/domscene.svelte';

  // «Брутализм» — сводка как самиздатовская газета: шапка «ВЕСТНИК», главная новость — подсказка дома
  // с кнопкой «ДА», сцены — резиновые штампы, комнаты — коллаж из наклеек на скотче (их можно двигать,
  // раскладка запоминается), приборы — голый список с ASCII-шкалами.
  const sug = $derived(home.s?.suggestion);
  const x = $derived(stats());
  const issue = $derived(Math.floor((+clock.now - +new Date(clock.now.getFullYear(), 0, 0)) / 864e5));
  const date = $derived(clock.now.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase());
  const hm = $derived(clock.now.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }));
  const hash = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

  // ——— коллаж ———
  const rooms = $derived(activeRooms().slice(0, 7).map(a => a.r));
  const KEY = 'br.collage';
  let pos = $state<Record<string, { x: number; y: number; z: number }>>((() => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; } })());
  let zTop = 10;
  const at = (id: string, i: number) => pos[id] ?? { x: (i % 2) * 48 + 3 + (hash(id) % 7), y: Math.floor(i / 2) * 150 + (i % 2) * 40 + 10, z: i };
  let drag: { id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null = null;
  let wall: HTMLDivElement;
  function down(e: PointerEvent, id: string, i: number) {
    const p = at(id, i); drag = { id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, moved: false };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!drag) return; const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return; drag.moved = true;
    const w = wall.clientWidth; pos[drag.id] = { x: Math.max(-5, Math.min(70, drag.ox + dx / w * 100)), y: Math.max(0, drag.oy + dy), z: ++zTop };
  }
  function up() {
    if (!drag) return; const d = drag; drag = null;
    if (!d.moved) go('room', d.id); else try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch { /* песочница */ }
  }
  const wallH = $derived(Math.max(480, Math.ceil(rooms.length / 2) * 150 + 160, ...rooms.map((r, i) => at(r.id, i).y + 210)));

  // ——— приборы ———
  const favs = $derived(house.favorites.home.map(id => deviceById[id]).filter(Boolean));
  const isOn = (id: string) => { const d = deviceById[id], s = dev(id); return d.caps.includes('dimmer') ? (s.level ?? 0) > 0 : d.caps.includes('speaker') ? !!s.playing : d.caps.includes('vacuum') ? s.status === 'cleaning' : !!s.on; };
  const bar = (k: number) => '■'.repeat(Math.round(k * 8)) + '□'.repeat(8 - Math.round(k * 8));
  const level = (id: string) => { const d = deviceById[id], s = dev(id); return d.caps.includes('dimmer') ? (s.level ?? 0) / 100 : d.caps.includes('speaker') ? (s.volume ?? 0) / 100 : isOn(id) ? 1 : 0; };
  function flip(id: string) {
    const d = deviceById[id], v = !isOn(id);
    if (d.caps.includes('dimmer')) cmd({ cmd: 'light.set', target: id, on: v });
    else if (d.caps.includes('speaker')) cmd({ cmd: 'media.action', target: id, action: 'toggle' });
    else if (d.caps.includes('vacuum')) cmd({ cmd: 'vacuum.action', target: id, action: v ? 'start' : 'dock' });
  }
</script>

<div class="z {theme.profile}">
  <header class="mast">
    <div class="row top"><span>№ {issue}</span><span>{hm}</span><span>ДЕШЕВЛЕ НЕ БЫВАЕТ: 0 ₽</span></div>
    <div class="title" role="heading" aria-level="1">ВЕСТНИК</div>
    <div class="row"><span>{date}</span><span>{house.name.toUpperCase()}</span></div>
  </header>

  <article class="lead">
    <span class="kick">{sug ? 'ГЛАВНОЕ' : 'СВОДКА'}</span>
    <h2>{sug ? sug.title : x.people ? `ДОМА ${x.people}. СВЕТ В ${x.lit}. ТИХО.` : 'ДОМ ПУСТ. ВСЁ ПОД КОНТРОЛЕМ.'}</h2>
    {#if sug}
      <p>{sug.text}</p>
      <button class="yes" onclick={() => runScene(sug.action.scene)}>[ ДА: {sug.action.label} ]</button>
    {/if}
    <aside class="side">
      <div><span>СНАРУЖИ</span><b class="num">{fmtT(x.outside)}°</b></div>
      <button onclick={() => go('security')}><span>ОХРАНА</span><b>{x.secName}</b></button>
    </aside>
  </article>

  <section>
    <h3>ШТАМПЫ / СЦЕНЫ</h3>
    <div class="stamps">
      {#each sceneOrder() as s, i (s.id)}
        <button class="stamp" class:on={home.s?.scene === s.id} aria-pressed={home.s?.scene === s.id} style="--a:{((hash(s.id) % 9) - 4) * .8}deg" onclick={() => runScene(s.id)}>
          <b>{s.name}</b>{#if home.s?.scene === s.id}<i>ПРИМЕНЕНО</i>{/if}
        </button>
      {/each}
    </div>
  </section>

  <section>
    <h3>КОЛЛАЖ / КОМНАТЫ <small>(ДВИГАЙ)</small></h3>
    <div class="wall" bind:this={wall} style="height:{wallH}px" onpointermove={move} onpointerup={up} onpointercancel={up}>
      {#each rooms as r, i (r.id)}
        {@const p = at(r.id, i)}
        {@const ph = house.photos[photoFor(r.id, !!home.s?.night)]?.src}
        <button class="stk" class:drag={drag?.id === r.id} style="left:{p.x}%; top:{p.y}px; z-index:{p.z}; --a:{((hash(r.id) % 11) - 5) * 1.1}deg"
          onpointerdown={(e) => down(e, r.id, i)} aria-label="{r.name}: открыть или перетащить">
          <span class="tape" aria-hidden="true"></span>
          {#if ph}<img src={ph} alt="" draggable="false" />{:else}<span class="ni">{r.name.slice(0, 2).toUpperCase()}</span>{/if}
          <span class="cap"><b>{r.name}</b><i>{roomTemp(r.id) !== undefined ? `${fmtT(roomTemp(r.id))}°` : ''}{lightsOn(r.id) ? ` · СВЕТ ${lightsOn(r.id)}` : ''}{occupied(r.id) ? ' · ЛЮДИ' : ''}</i></span>
        </button>
      {/each}
    </div>
  </section>

  <section>
    <h3>ПРИБОРЫ</h3>
    <ul class="dev">
      {#each favs as d (d.id)}
        <li>
          <button class="nm" onclick={() => (d.caps.includes('dimmer') ? go('lamp', devArg(d.id)) : flip(d.id))}>{d.name}</button>
          <span class="bar num" aria-hidden="true">{bar(level(d.id))}</span>
          <button class="sw" class:on={isOn(d.id)} role="switch" aria-checked={isOn(d.id)} aria-label={d.name} onclick={() => flip(d.id)}>[{isOn(d.id) ? 'ВКЛ' : 'ВЫКЛ'}]</button>
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .z { display: flex; flex-direction: column; gap: 22px; padding: 12px max(12px, env(safe-area-inset-right, 0px)) 30px max(12px, env(safe-area-inset-left, 0px)); max-width: 820px; margin: 0 auto; }
  .z.tablet { padding: 24px 32px; }
  .mast { border-top: 6px solid var(--text); border-bottom: 6px double var(--text); }
  .row { display: flex; justify-content: space-between; gap: 8px; padding: 4px 0; font: 600 10.5px var(--font-ui); text-transform: uppercase; white-space: nowrap; overflow: hidden; }
  .row.top { border-bottom: 2px solid var(--text); }
  .title { margin: 0; font: 900 min(calc(var(--app-w) * .142), 116px)/.85 var(--font-display); letter-spacing: -.06em; text-align: center; padding: 8px 0 4px; border-bottom: 2px solid var(--text); overflow: hidden; }
  .lead { position: relative; display: flex; flex-direction: column; gap: 10px; padding-right: 0; }
  .kick { align-self: flex-start; background: var(--danger); color: #fff; font: 600 11px var(--font-ui); padding: 3px 8px; }
  .lead h2 { margin: 0; font: 900 40px/.92 var(--font-display); letter-spacing: -.05em; text-transform: uppercase; overflow-wrap: anywhere; }
  .tablet .lead h2 { font-size: 64px; max-width: 70%; }
  .lead p { margin: 0; font: 400 14px/1.45 var(--font-ui); columns: 2; column-gap: 16px; column-rule: 2px solid var(--text); }
  .yes { align-self: stretch; height: 64px; border: 2px solid var(--border); background: var(--accent); color: var(--on-accent); font: 900 20px var(--font-display); letter-spacing: -.03em; text-transform: uppercase; box-shadow: 6px 6px 0 var(--border); }
  .yes:active { transform: translate(6px, 6px); box-shadow: none; }
  .side { display: grid; grid-template-columns: 1fr 1fr; border: 2px solid var(--border); }
  .tablet .side { position: absolute; right: 0; top: 0; width: 26%; grid-template-columns: 1fr; }
  .side > * { display: flex; flex-direction: column; gap: 2px; padding: 8px; border: 0; background: var(--surface); color: var(--text); text-align: left; font: inherit; }
  .side > * + * { border-left: 2px solid var(--border); }
  .tablet .side > * + * { border-left: 0; border-top: 2px solid var(--border); }
  .side span { font: 600 10.5px var(--font-ui); } .side b { font: 900 30px/1 var(--font-display); letter-spacing: -.05em; text-transform: uppercase; }
  .side button b { font-size: 18px; }
  h3 { margin: 0 0 10px; padding-bottom: 4px; border-bottom: 2px solid var(--text); font: 900 18px var(--font-display); letter-spacing: -.02em; }
  h3 small { font: 600 10px var(--font-ui); }
  .stamps { display: flex; flex-wrap: wrap; gap: 14px 12px; padding: 4px 2px; }
  .stamp { position: relative; padding: 10px 14px; border: 3px double var(--text); background: transparent; color: var(--text); transform: rotate(var(--a)); font: 900 17px var(--font-display); text-transform: uppercase; letter-spacing: -.02em; }
  .stamp.on { background: var(--accent); color: var(--on-accent); border-color: var(--on-accent); }
  .stamp i { position: absolute; right: -14px; top: -12px; transform: rotate(14deg); padding: 1px 6px; border: 2px solid var(--danger); color: var(--danger); font: 600 10px var(--font-ui); font-style: normal; white-space: nowrap; background: color-mix(in srgb, var(--accent) 60%, transparent); }
  .wall { position: relative; touch-action: pan-y; background: repeating-linear-gradient(-45deg, transparent 0 14px, var(--grid) 14px 15px); border: 2px dashed var(--border); overflow: hidden; }
  .stk { position: absolute; width: 50%; max-width: 230px; padding: 8px 8px 0; border: 2px solid var(--border); background: var(--surface); color: var(--text); text-align: left; transform: rotate(var(--a)); box-shadow: 5px 5px 0 var(--border); cursor: grab; touch-action: none; font: inherit; }
  .stk.drag { cursor: grabbing; box-shadow: 10px 10px 0 var(--border); transform: rotate(0deg) scale(1.04); }
  .tape { position: absolute; left: 50%; top: -12px; width: 70px; height: 22px; margin-left: -35px; background: color-mix(in srgb, var(--accent) 70%, transparent); transform: rotate(calc(var(--a) * -2)); border: 1px solid rgba(0,0,0,.15); }
  .stk img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; filter: grayscale(1) contrast(1.35); border: 2px solid var(--border); pointer-events: none; }
  .ni { display: grid; place-items: center; aspect-ratio: 4 / 3; background: var(--text); color: var(--bg); font: 900 48px var(--font-display); }
  .cap { display: flex; flex-direction: column; padding: 6px 0 8px; }
  .cap b { font: 900 16px/1 var(--font-display); text-transform: uppercase; letter-spacing: -.03em; }
  .cap i { font: 600 10.5px var(--font-ui); font-style: normal; text-transform: uppercase; margin-top: 3px; }
  .dev { list-style: none; margin: 0; padding: 0; }
  .dev li { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 2px solid var(--border); }
  .dev .nm { flex: 1; min-width: 0; border: 0; background: none; padding: 0; color: var(--link); text-align: left; font: 600 13px var(--font-ui); text-transform: uppercase; text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar { font-size: 12px; letter-spacing: -.05em; white-space: nowrap; }
  .sw { flex: none; width: 74px; height: 34px; border: 2px solid var(--border); background: var(--surface); color: var(--text); font: 600 12px var(--font-ui); }
  .sw.on { background: var(--accent); color: var(--on-accent); }
</style>
