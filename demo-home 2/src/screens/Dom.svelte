<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { Vector3 } from 'three';
  import Icon from '../ui/Icon.svelte';
  import { Diorama, type ZoneStyle } from '../house/scene';
  import { houseLayout } from '../client/layout';
  import { house, floors, roomById, devicesIn } from '../core/house';
  import { home, dev } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { go } from '../client/router.svelte';
  import { roomLight, fmtT, greeting, dateLine, pluralPeople } from '../client/derive.svelte';
  import { roomStatus, hereRoom } from '../client/nav.svelte';

  // «Дом» — главная навигация: дом-диорама из плана объекта. Этажи разнесены, свет горит там,
  // где горит на самом деле, функции — слои. Тап по этажу — этаж крупно, по комнате — её страница.
  type Layer = 'all' | 'light' | 'climate' | 'media' | 'security';
  const layers: { id: Layer; name: string; icon: string }[] = [
    { id: 'all', name: 'Всё', icon: 'house' }, { id: 'light', name: 'Свет', icon: 'bulb' }, { id: 'climate', name: 'Климат', icon: 'climate' },
    { id: 'media', name: 'Медиа', icon: 'media' }, { id: 'security', name: 'Охрана', icon: 'shield' }
  ];
  const read = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
  let layer = $state<Layer>(read('dom.layer', 'all') as Layer);
  let focus = $state<number | null>(null);
  const setLayer = (l: Layer) => { layer = l; try { localStorage.setItem('dom.layer', l); } catch { /* песочница */ } };

  const fl = [...floors].sort((a, b) => a.id - b.id);
  const layout = houseLayout;

  // ——— состояние комнат по слою ———
  const hueOf = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  function info(room: string) {
    const list = devicesIn(room), st = roomStatus(room);
    const clim = list.find(d => d.caps.includes('climate')); const c = clim ? dev(clim.id) : undefined;
    const lock = list.find(d => d.caps.includes('lock'));
    const media = st.media ? dev(st.media.id) : undefined;
    return { st, c, media, mediaTitle: media?.title ?? st.media?.name, unlocked: !!lock && !dev(lock.id).locked, light: roomLight(room) };
  }
  function value(room: string, L: Layer): { t: string; k: string } | null {
    const i = info(room), on = i.st.lights;
    if (L === 'light') return devicesIn(room).some(d => d.caps.includes('dimmer')) ? { t: on ? `свет · ${on}` : 'выкл', k: on ? 'warm' : '' } : null;
    if (L === 'climate') return i.c?.current !== undefined ? { t: `${fmtT(i.c.current)}°`, k: (i.c.target ?? 0) - i.c.current > .6 ? 'heat' : i.c.current - (i.c.target ?? 99) > .6 ? 'cool' : '' } : null;
    if (L === 'media') return i.st.media ? { t: i.mediaTitle ?? 'играет', k: 'media' } : null;
    if (L === 'security') return i.unlocked ? { t: 'дверь открыта', k: 'alert' } : i.st.here ? { t: 'движение', k: 'cool' } : null;
    if (i.unlocked) return { t: 'дверь открыта', k: 'alert' };
    if (i.st.media) return { t: i.mediaTitle ?? 'играет', k: 'media' };
    if (i.st.people) return { t: pluralPeople(i.st.people), k: 'cool' };
    return on ? { t: i.c?.current !== undefined ? `${fmtT(i.c.current)}°` : 'свет', k: 'warm' } : null;
  }
  function styles(L: Layer): Record<string, ZoneStyle> {
    const out: Record<string, ZoneStyle> = {};
    for (const r of house.rooms) {
      const i = info(r.id), list = devicesIn(r.id);
      const relevant = L === 'all' || L === 'security' ? true : L === 'light' ? list.some(d => d.caps.includes('dimmer')) : L === 'climate' ? !!i.c : list.some(d => d.caps.includes('media') || d.caps.includes('speaker'));
      let tint: number | null = null, tintK = 0;
      if (L === 'climate' && i.c?.current !== undefined && i.c.target !== undefined) { const dd = i.c.current - i.c.target; if (dd < -.6) { tint = 0xe8803c; tintK = .7; } else if (dd > .6) { tint = 0x5a96e6; tintK = .7; } }
      if (L === 'media' && i.st.media) { tint = hsl(hueOf(i.mediaTitle ?? r.id)); tintK = .8; }
      out[r.id] = { glow: i.light, tint, tintK, dim: !relevant, alert: (L === 'security' || L === 'all') && i.unlocked };
    }
    return out;
  }
  function hsl(h: number) { const c = document.createElement('canvas').getContext('2d')!; c.fillStyle = `hsl(${h}, 55%, 50%)`; return parseInt(c.fillStyle.slice(1), 16); }

  let host: HTMLDivElement, canvas: HTMLCanvasElement;
  let d: Diorama | undefined;
  let tick = $state(0);
  onMount(() => {
    d = new Diorama(canvas, layout);
    d.onFrame = () => untrack(() => tick++);
    const ro = new ResizeObserver(() => d!.resize(host.clientWidth, host.clientHeight));
    ro.observe(host);
    return () => { ro.disconnect(); d?.dispose(); };
  });
  $effect(() => { const st = styles(layer); const night = !!home.s?.night; d?.apply(st, night); });
  $effect(() => { const f = focus; d?.setFocus(f === null ? null : String(f)); });

  // жесты: тап — этаж или комната, протяжка вбок — поворот на рельсах
  let down: { x: number; y: number; moved: boolean } | null = null;
  function pd(e: PointerEvent) { down = { x: e.clientX, y: e.clientY, moved: false }; (e.target as Element).setPointerCapture(e.pointerId); }
  function pm(e: PointerEvent) { if (!down || !d) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 6) down.moved = true; if (down.moved) { d.rotate(-dx * .004); down.x = e.clientX; } }
  function pu(e: PointerEvent) {
    if (!down || !d) return;
    const moved = down.moved; down = null;
    if (moved) return snap();
    const r = host.getBoundingClientRect(), hit = d.pick(e.clientX - r.left, e.clientY - r.top);
    if (!hit || !hit.zone) { focus = null; return; }
    if (focus === null && theme.profile === 'phone' && fl.length > 1) focus = Number(hit.floor);
    else if (roomById[hit.zone]) go('room', hit.zone);
  }
  function snap() {
    const start = d!.az, t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 400); d!.az = start * Math.pow(1 - k, 3); d!.settle(); if (k < 1) requestAnimationFrame(step); };
    step();
  }

  const here = $derived(hereRoom());
  const labels = $derived.by(() => {
    tick; if (!d) return [];
    const seen = new Set<string>();
    return d.anchors.flatMap(a => {
      if (!a.zone || seen.has(a.zone)) return []; seen.add(a.zone);
      const r = roomById[a.zone]; if (!r) return [];
      if (focus !== null && a.floor !== String(focus)) return [];
      const v = value(a.zone, layer);
      if (focus === null && !v && a.zone !== here) return [];
      return [{ id: a.id, r, v, ...d!.project(a.pos, a.floor), full: focus !== null || theme.profile === 'tablet', here: a.zone === here }];
    });
  });
  const floorLabels = $derived.by(() => {
    tick; if (!d || focus !== null || fl.length < 2) return [];
    return [...fl].reverse().map(f => ({ id: f.id, name: f.name, n: house.rooms.filter(r => (r.floor ?? 1) === f.id && value(r.id, layer)).length, ...d!.project(new Vector3(-.4, .5, layout.D), String(f.id)) }));
  });
  const summary = $derived.by(() => {
    if (!home.s) return '';
    const lit = house.rooms.filter(r => roomStatus(r.id).lights).length;
    const ppl = Object.values(home.s.presence).reduce((a, b) => a + b, 0);
    return [ppl ? `дома ${pluralPeople(ppl)}` : 'дома никого', lit ? `свет в ${lit} комн.` : 'свет выключен', `${fmtT(home.s.outside)}° снаружи`].join(' · ');
  });
</script>

<div class="dom {theme.profile}">
  <header class="top rise">
    <div class="tt">
      <span class="dl">{dateLine()}</span>
      <h1>{greeting()}</h1>
      <p class="sum">{summary}</p>
    </div>
  </header>

  <div class="bar rise" style="animation-delay:.06s">
    <div class="layers" role="tablist" aria-label="Слои">
      {#each layers as l (l.id)}
        <button role="tab" aria-selected={layer === l.id} class:on={layer === l.id} onclick={() => setLayer(l.id)}><Icon name={l.icon} size={16} /><span>{l.name}</span></button>
      {/each}
    </div>
    {#if fl.length > 1}
      <div class="floors" role="tablist" aria-label="Этажи">
        <button role="tab" aria-selected={focus === null} class:on={focus === null} onclick={() => (focus = null)}>Весь дом</button>
        {#each [...fl].reverse() as f (f.id)}<button role="tab" aria-selected={focus === f.id} class:on={focus === f.id} aria-label={f.name} onclick={() => (focus = f.id)}>{f.id}</button>{/each}
      </div>
    {/if}
  </div>

  <div class="stage" bind:this={host}>
    <canvas bind:this={canvas} onpointerdown={pd} onpointermove={pm} onpointerup={pu} aria-label="Дом в 3D: тап по этажу или комнате, потяните вбок — повернуть"></canvas>
    {#each floorLabels as f (f.id)}
      <button class="fl" style="left:{f.x}px; top:{f.y}px" onclick={() => (focus = f.id)}><b>{f.name}</b>{#if f.n}<i>{f.n}</i>{/if}</button>
    {/each}
    {#each labels as l (l.id)}
      <button class="lb {l.v?.k ?? ''}" class:full={l.full} class:here={l.here} style="left:{l.x}px; top:{l.y}px" onclick={() => go('room', l.r.id)}>
        {#if l.full || !l.v}<b>{l.r.name}</b>{/if}{#if l.v}<span>{l.v.t}</span>{/if}
      </button>
    {/each}
    <p class="hint">{focus !== null ? 'Тап по комнате — открыть · тап мимо — весь дом' : fl.length > 1 ? 'Тап по этажу — крупно · потяните вбок — повернуть' : 'Тап по комнате — открыть'}</p>
  </div>
</div>

<style>
  .dom { display: flex; flex-direction: column; gap: 12px; min-height: var(--screen-h); padding: max(18px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 0 max(16px, env(safe-area-inset-left, 0px)); box-sizing: border-box; }
  .dom.tablet { padding: 28px 32px 24px; height: var(--screen-h); }
  .dl { font-size: 13px; color: var(--muted); }
  h1 { margin: 4px 0 0; font: var(--display-weight, 300) 32px/1.1 var(--font-display); letter-spacing: var(--display-tracking, -.02em); }
  .sum { margin: 6px 0 0; font-size: 13.5px; color: var(--sub); }
  .bar { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; justify-content: space-between; }
  .layers, .floors { display: flex; gap: 4px; padding: 3px; border-radius: var(--r-pill); background: var(--surface); border: 1px solid var(--border); backdrop-filter: blur(14px); max-width: 100%; overflow-x: auto; scrollbar-width: none; }
  .layers button, .floors button { flex: none; display: inline-flex; align-items: center; gap: 5px; height: 32px; padding: 0 11px; border: 0; border-radius: var(--r-pill); background: none; color: var(--sub); font: 500 13px var(--font-ui); }
  .layers button.on { background: var(--accent-soft); color: var(--accent-text); }
  .floors button { min-width: 32px; justify-content: center; padding: 0 10px; }
  .floors button.on { background: var(--text); color: var(--bg); }
  .phone .layers button span { display: none; }
  .phone .layers button.on span { display: inline; }
  .stage { position: relative; flex: 1; min-height: 520px; margin: 0 -16px; overflow: hidden; touch-action: pan-y; }
  .tablet .stage { margin: 0; min-height: 0; }
  canvas { display: block; width: 100%; height: 100%; position: absolute; inset: 0; cursor: grab; }
  .fl { position: absolute; transform: translate(-100%, -50%); display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: var(--r-pill);
    border: 1px solid var(--border); background: var(--surface-solid); color: var(--text); font: 500 12.5px var(--font-ui); white-space: nowrap; }
  .fl i { font-style: normal; min-width: 18px; height: 18px; border-radius: 9px; background: var(--accent-soft); color: var(--accent-text); display: grid; place-items: center; font-size: 11px; }
  .lb { position: absolute; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; max-width: 140px; padding: 4px 9px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface-solid); color: var(--text); font: 500 12px/1.2 var(--font-ui); white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
  .lb b { font-weight: 500; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .lb span { font-size: 11.5px; color: var(--sub); overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .lb.warm span { color: #E0A15A; } .lb.heat span { color: #E8803C; } .lb.cool span { color: var(--cool-text); }
  .lb.alert { border-color: var(--danger); } .lb.alert span { color: var(--danger); }
  .lb.media { border-color: var(--accent-border); }
  .lb.here::after { content: ""; position: absolute; top: -4px; right: -4px; width: 9px; height: 9px; border-radius: 50%; background: var(--cool); box-shadow: 0 0 0 3px var(--cool-soft); }
  .hint { position: absolute; left: 16px; right: 16px; bottom: 8px; margin: 0; text-align: center; font-size: 11.5px; color: var(--muted); pointer-events: none; }
  :global([data-trend="minimal"]) .lb, :global([data-trend="minimal"]) .fl, :global([data-trend="minimal"]) .layers, :global([data-trend="minimal"]) .floors,
  :global([data-trend="minimal"]) .layers button, :global([data-trend="minimal"]) .floors button { border-radius: 0; }
</style>
