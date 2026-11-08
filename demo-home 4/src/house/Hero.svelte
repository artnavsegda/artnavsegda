<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '../ui/Icon.svelte';
  import { S, deviceById, photoOf, lightLevel, hue } from './data.svelte';
  import { ui } from './ui.svelte';
  import { HeroView, heroKind, type HeroKind } from './hero3d';
  import { typeById } from '../../model/catalog.ts';

  // Крупный план устройства: предмет на две трети экрана поверх размытого фото комнаты,
  // управление — тонким слоем снизу. Состояние то же, что в листе комнаты.
  const found = deviceById(ui.device)!;
  const { d, r } = found;
  const kind = heroKind(d.type, d.name) as HeroKind;
  const ph = photoOf(r.id);
  let canvas: HTMLCanvasElement;
  let view: HeroView | undefined;

  const isLight = d.type.startsWith('light.');
  const dimmable = typeById[d.type].ui.widget === 'dimmer';
  const t = S.temp[r.id];
  const dev = S.dev[d.id] ?? { on: false, pos: 100 };
  const fmt = (n: number) => n.toFixed(1).replace('.', ',');
  const heat = $derived(t ? Math.max(0, Math.min(1, (t.target - t.cur) / 1.2)) : 0);
  const m = $derived(S.media[r.id]);

  const value = $derived.by(() => {
    if (isLight) { const v = S.light[d.id] ?? 0; return v ? (dimmable ? `${v}%` : 'Вкл') : 'Выкл'; }
    if (kind === 'curtain') { const p = dev.pos ?? 100; return p >= 95 ? 'Открыта' : p <= 5 ? 'Закрыта' : `${p}%`; }
    if (kind === 'gate') return (dev.pos ?? 0) > 50 ? 'Открыты' : 'Закрыты';
    if (kind === 'ac') return dev.on ? `${fmt(t?.target ?? 22)}°` : 'Выкл';
    if (kind === 'radiator' || kind === 'floorheat') return t ? `${fmt(t.cur)}°` : '';
    if (kind === 'tv' || kind === 'projector' || kind === 'speaker') return dev.on || (kind === 'speaker' && m?.playing) ? 'Вкл' : 'Выкл';
    return '';
  });
  const sub = $derived.by(() => {
    if (kind === 'radiator' || kind === 'floorheat') return t ? (heat > .05 ? `греет до ${fmt(t.target)}°` : `держит ${fmt(t.target)}°`) : '';
    if (kind === 'ac') return dev.on ? `охлаждает · в комнате ${fmt(t?.cur ?? 22)}°` : 'кондиционер выключен';
    if ((kind === 'tv' || kind === 'speaker') && m) return m.title;
    return r.name;
  });

  onMount(() => {
    if (kind === 'gate' && dev.pos === 100) dev.pos = 0;
    view = new HeroView(canvas, kind);
    return () => view?.destroy();
  });
  $effect(() => {
    if (!view) return;
    view.state = {
      level: isLight ? (S.light[d.id] ?? 0) / 100 : 0,
      pos: (dev.pos ?? 100) / 100, on: kind === 'speaker' ? !!m?.playing || !!dev.on : !!dev.on,
      heat, hue: m ? hue(m.art) : 30, day: ui.mode === 'day'
    };
  });
  const close = () => (ui.device = '');
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); close(); } };
  const setLevel = (v: number) => (S.light[d.id] = v);
</script>

<svelte:window onkeydown={onKey} />

<div class="hero" role="dialog" aria-modal="true" aria-label={d.name}>
  <div class="bg" aria-hidden="true">
    {#if ph}<img src={ph.eve ?? ph.day} alt="" style="opacity:{.35 + lightLevel(r) * .4}" />{/if}
  </div>
  <header>
    <button class="back press" onclick={close}><Icon name="back" size={18} />{r.name}</button>
  </header>
  <canvas bind:this={canvas} aria-label="Модель: {d.name}. Потяните, чтобы повернуть"></canvas>

  <div class="panel">
    <div class="ttl">
      <div><h2>{d.name}</h2><p>{sub}</p></div>
      <b class="val num">{value}</b>
    </div>

    {#if isLight}
      <div class="row">
        <button class="pw press" class:on={(S.light[d.id] ?? 0) > 0} aria-label={(S.light[d.id] ?? 0) ? 'Выключить' : 'Включить'} onclick={() => setLevel((S.light[d.id] ?? 0) ? 0 : 80)}><Icon name="power" size={22} /></button>
        {#if dimmable}
          <label class="track" style="--v:{(S.light[d.id] ?? 0) / 100}">
            <span class="fill"></span>
            <input type="range" min="0" max="100" step="1" value={S.light[d.id] ?? 0} aria-label="Яркость" oninput={(e) => setLevel(+e.currentTarget.value)} />
          </label>
        {/if}
      </div>
      {#if dimmable}<div class="presets">{#each [20, 50, 80, 100] as p}<button class="chip press" class:on={S.light[d.id] === p} onclick={() => setLevel(p)}>{p}%</button>{/each}</div>{/if}
    {:else if kind === 'curtain' || kind === 'gate'}
      <div class="row">
        <button class="big press" onclick={() => (dev.pos = 100)}><Icon name="up" size={18} />Открыть</button>
        <button class="big press" onclick={() => (dev.pos = 0)}><Icon name="down" size={18} />Закрыть</button>
      </div>
      {#if kind === 'curtain'}
        <label class="track thin" style="--v:{(dev.pos ?? 100) / 100}">
          <span class="fill"></span>
          <input type="range" min="0" max="100" step="5" value={dev.pos ?? 100} aria-label="Положение" oninput={(e) => (dev.pos = +e.currentTarget.value)} />
        </label>
      {/if}
    {:else if kind === 'ac' || kind === 'radiator' || kind === 'floorheat'}
      <div class="row">
        {#if kind === 'ac'}<button class="pw press" class:on={dev.on} aria-label={dev.on ? 'Выключить' : 'Включить'} onclick={() => (dev.on = !dev.on)}><Icon name="power" size={22} /></button>{/if}
        {#if t}
          <div class="set">
            <button class="press" aria-label="Холоднее" onclick={() => (t.target = +(t.target - .5).toFixed(1))}><Icon name="minus" size={20} /></button>
            <span><b class="num">{fmt(t.target)}°</b><i>уставка комнаты</i></span>
            <button class="press" aria-label="Теплее" onclick={() => (t.target = +(t.target + .5).toFixed(1))}><Icon name="plus" size={20} /></button>
          </div>
        {/if}
      </div>
    {:else}
      <div class="row">
        <button class="pw press" class:on={dev.on} aria-label={dev.on ? 'Выключить' : 'Включить'} onclick={() => (dev.on = !dev.on)}><Icon name="power" size={22} /></button>
        {#if m}<span class="np">{m.title}<i>{m.sub}</i></span>{/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .hero { position: absolute; inset: 0; z-index: 40; display: flex; flex-direction: column; background: #0d0b09; color: #f4efe8; animation: in .3s var(--ease-out); overflow: hidden; }
  :global([data-mode="day"]) .hero { background: #e9e3da; color: #1d1915; }
  :global(.tablet) .hero { left: auto; width: 520px; border-left: 1px solid var(--border-strong); }
  @keyframes in { from { opacity: 0; transform: scale(.98); } }
  @media (prefers-reduced-motion: reduce) { .hero { animation: none; } }
  .bg { position: absolute; inset: -40px; z-index: 0; }
  .bg img { width: 100%; height: 100%; object-fit: cover; filter: blur(22px) saturate(1.1); transition: opacity .6s; }
  .bg::after { content: ""; position: absolute; inset: 0; background: radial-gradient(80% 60% at 50% 35%, transparent, rgba(0,0,0,.55)); }
  :global([data-mode="day"]) .bg::after { background: radial-gradient(80% 60% at 50% 35%, transparent, rgba(255,250,240,.5)); }
  header { position: relative; z-index: 2; padding: max(14px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 0 max(16px, env(safe-area-inset-left, 0px)); }
  .back { display: inline-flex; align-items: center; gap: 4px; height: 36px; padding: 0 14px 0 8px; border-radius: 18px; border: 0; background: rgba(255,255,255,.14); color: inherit; font: 500 14px var(--font-ui); backdrop-filter: blur(10px); }
  :global([data-mode="day"]) .back { background: rgba(0,0,0,.08); }
  canvas { position: relative; z-index: 1; flex: 1; min-height: 0; width: 100%; display: block; cursor: grab; touch-action: pan-y; }
  .panel { position: relative; z-index: 2; display: flex; flex-direction: column; gap: 14px;
    padding: 18px max(20px, env(safe-area-inset-right, 0px)) max(26px, env(safe-area-inset-bottom, 0px)) max(20px, env(safe-area-inset-left, 0px));
    background: linear-gradient(180deg, transparent, rgba(0,0,0,.35) 30%); }
  :global([data-mode="day"]) .panel { background: linear-gradient(180deg, transparent, rgba(255,252,246,.6) 30%); }
  .ttl { display: flex; align-items: flex-end; gap: 12px; }
  .ttl > div { flex: 1; min-width: 0; }
  h2 { margin: 0; font: var(--display-weight, 400) 30px/1.05 var(--font-display); letter-spacing: -.01em; }
  .ttl p { margin: 4px 0 0; font-size: 14px; opacity: .7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .val { font: 300 44px/1 var(--font-display); letter-spacing: -.02em; }
  .row { display: flex; align-items: center; gap: 12px; }
  .pw { width: 56px; height: 56px; border-radius: 50%; border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.1); color: inherit; display: grid; place-items: center; flex: none; }
  .pw.on { background: #f4d6a8; color: #2a1d10; border-color: transparent; box-shadow: 0 0 30px rgba(255,180,100,.45); }
  :global([data-mode="day"]) .pw { border-color: rgba(0,0,0,.15); background: rgba(0,0,0,.05); }
  .track { position: relative; flex: 1; height: 56px; border-radius: 28px; background: rgba(255,255,255,.12); overflow: hidden; backdrop-filter: blur(8px); }
  :global([data-mode="day"]) .track { background: rgba(0,0,0,.08); }
  .track.thin { height: 14px; flex: none; }
  .fill { position: absolute; inset: 0 auto 0 0; width: calc(var(--v) * 100%); background: linear-gradient(90deg, #c98a4b, #f4d6a8); }
  .track input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; margin: 0; }
  .presets { display: flex; gap: 6px; }
  .chip { flex: 1; height: 36px; border-radius: 18px; border: 1px solid rgba(255,255,255,.2); background: none; color: inherit; font: 500 13px var(--font-ui); }
  .chip.on { background: rgba(255,255,255,.18); }
  :global([data-mode="day"]) .chip { border-color: rgba(0,0,0,.15); }
  .big { flex: 1; height: 52px; border-radius: 26px; border: 1px solid rgba(255,255,255,.22); background: rgba(255,255,255,.1); color: inherit; font: 500 15px var(--font-ui); display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  :global([data-mode="day"]) .big { border-color: rgba(0,0,0,.15); background: rgba(0,0,0,.05); }
  .set { flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 10px; height: 56px; padding: 0 6px; border-radius: 28px; background: rgba(255,255,255,.1); }
  :global([data-mode="day"]) .set { background: rgba(0,0,0,.06); }
  .set button { width: 44px; height: 44px; border-radius: 50%; border: 0; background: rgba(255,255,255,.14); color: inherit; display: grid; place-items: center; }
  .set span { text-align: center; } .set b { font: 400 22px/1 var(--font-display); display: block; } .set i { font-style: normal; font-size: 11.5px; opacity: .65; }
  .np { display: flex; flex-direction: column; font-size: 15px; font-weight: 500; min-width: 0; } .np i { font-style: normal; font-size: 12.5px; opacity: .65; }
  :global([data-trend="minimal"]) .hero .track, :global([data-trend="minimal"]) .hero .big, :global([data-trend="minimal"]) .hero .set, :global([data-trend="minimal"]) .hero .chip { border-radius: 0; }
</style>
