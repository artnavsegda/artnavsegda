<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '../ui/Icon.svelte';
  import { deviceById, roomById, house } from '../core/house';
  import { dev, cmd, home } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { go, argDev } from '../client/router.svelte';
  import { fmtT, roomLight } from '../client/derive.svelte';
  import { photoFor } from '../client/rooms';
  import { HeroView, type HeroKind } from '../house/hero3d';
  import { heroOf } from '../client/hero';

  // Крупный план устройства: предмет на две трети экрана поверх размытого фото комнаты,
  // управление — тонким слоем снизу. Предмет живёт по состоянию устройства.
  let { arg = '' }: { arg?: string } = $props();
  const id = deviceById[argDev(arg)] ? argDev(arg) : house.favorites.overview[0];
  const d = deviceById[id];
  const r = roomById[d.room];
  const kind = (heroOf(d) ?? 'spots') as HeroKind;
  const c = d.caps;
  const s = $derived(dev(id));
  const photo = $derived.by(() => { const ph = photoFor(d.room, !!home.s?.night); return ph ? house.photos?.[ph]?.src ?? '' : ''; });
  let canvas: HTMLCanvasElement;
  let view: HeroView | undefined;

  const on = $derived(c.includes('dimmer') ? (s.level ?? 0) > 0 : c.includes('shade') ? (s.position ?? 0) > 0 : c.includes('climate') ? s.mode !== 'off' : c.includes('speaker') ? !!s.playing : !!s.on);
  const heat = $derived(s.current !== undefined && s.target !== undefined && on ? Math.max(0, Math.min(1, (s.target - s.current) / 1.2)) : 0);
  const hue = $derived.by(() => { let h = 0; for (const ch of s.title ?? d.name) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; });
  onMount(() => { view = new HeroView(canvas, kind); return () => view?.destroy(); });
  $effect(() => {
    if (!view) return;
    view.state = { level: c.includes('dimmer') ? (s.level ?? 0) / 100 : 0, pos: (s.position ?? (c.includes('shade') ? 0 : 100)) / 100, on, heat: kind === 'ac' ? 0 : heat, hue, day: !home.s?.night };
  });

  const value = $derived(c.includes('dimmer') ? (on ? `${s.level}%` : 'Выкл') : c.includes('shade') ? (s.position ? `${s.position}%` : 'Закрыто')
    : s.current !== undefined ? `${fmtT(s.current)}°` : on ? 'Вкл' : 'Выкл');
  const sub = $derived(c.includes('climate') || c.includes('floorHeat') ? (on ? `держит ${fmtT(s.target)}°` : 'выключен') : c.includes('speaker') || c.includes('media') ? (s.title ?? r?.name ?? '') : r?.name ?? '');
  let lvl = $state(0);
  $effect(() => { lvl = s.level ?? 0; });
  const setLevel = (v: number) => { lvl = v; cmd({ cmd: 'light.set', target: id, level: v }); };
  const back = () => (history.length > 1 ? history.back() : go('room', d.room));
</script>

<div class="dv {theme.profile}">
  <div class="bg" aria-hidden="true">{#if photo}<img src={photo} alt="" style="opacity:{.3 + roomLight(d.room) * .45}" />{/if}</div>
  <header><button class="back press" onclick={back}><Icon name="back" size={18} />{r?.name ?? 'Назад'}</button></header>
  <canvas bind:this={canvas} aria-label="{d.name}: потяните, чтобы повернуть"></canvas>
  <div class="panel">
    <div class="ttl"><div><h1>{d.name}</h1><p>{sub}</p></div><b class="val num">{value}</b></div>
    {#if c.includes('dimmer')}
      <div class="row">
        <button class="pw press" class:on aria-label={on ? 'Выключить' : 'Включить'} onclick={() => cmd({ cmd: 'light.set', target: id, on: !on })}><Icon name="power" size={22} /></button>
        <label class="track" style="--v:{lvl / 100}"><span class="fill"></span><input type="range" min="0" max="100" step="1" value={lvl} aria-label="Яркость" oninput={(e) => setLevel(+e.currentTarget.value)} /></label>
      </div>
      <div class="presets">{#each [20, 50, 80, 100] as p}<button class="chip press" class:on={s.level === p} onclick={() => setLevel(p)}>{p}%</button>{/each}</div>
    {:else if c.includes('shade')}
      <div class="row">
        <button class="big press" onclick={() => cmd({ cmd: 'shade.set', target: id, position: 100 })}><Icon name="up" size={18} />Открыть</button>
        <button class="big press" onclick={() => cmd({ cmd: 'shade.set', target: id, position: 0 })}><Icon name="down" size={18} />Закрыть</button>
      </div>
      <label class="track thin" style="--v:{(s.position ?? 0) / 100}"><span class="fill"></span><input type="range" min="0" max="100" step="5" value={s.position ?? 0} aria-label="Положение" onchange={(e) => cmd({ cmd: 'shade.set', target: id, position: +e.currentTarget.value })} /></label>
    {:else if c.includes('climate')}
      <div class="row">
        <button class="pw press" class:on aria-label={on ? 'Выключить' : 'Включить'} onclick={() => cmd({ cmd: 'climate.set', target: id, mode: on ? 'off' : 'auto' })}><Icon name="power" size={22} /></button>
        <div class="set">
          <button class="press" aria-label="Холоднее" onclick={() => cmd({ cmd: 'climate.set', target: id, target_c: (s.target ?? 22) - .5 })}><Icon name="minus" size={20} /></button>
          <span><b class="num">{fmtT(s.target)}°</b><i>уставка</i></span>
          <button class="press" aria-label="Теплее" onclick={() => cmd({ cmd: 'climate.set', target: id, target_c: (s.target ?? 22) + .5 })}><Icon name="plus" size={20} /></button>
        </div>
      </div>
    {:else}
      <div class="row">
        <button class="pw press" class:on aria-label={on ? 'Выключить' : 'Включить'} onclick={() => c.includes('speaker') ? cmd({ cmd: 'media.action', target: id, action: 'toggle' }) : c.includes('media') ? cmd({ cmd: 'media.action', target: id, action: 'power' }) : cmd({ cmd: 'device.set', target: id, on: !on })}><Icon name={c.includes('speaker') ? (on ? 'pause' : 'play') : 'power'} size={22} /></button>
        {#if c.includes('speaker') || c.includes('media')}<button class="big press" onclick={() => go('media')}>Пульт и медиатека<Icon name="next" size={16} /></button>{/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .dv { position: relative; display: flex; flex-direction: column; height: var(--screen-h); overflow: hidden; background: #0d0b09; color: #f4efe8; }
  :global([data-mode="day"]) .dv { background: #e9e3da; color: #1d1915; }
  .bg { position: absolute; inset: -40px; z-index: 0; }
  .bg img { width: 100%; height: 100%; object-fit: cover; filter: blur(22px) saturate(1.1); transition: opacity .6s; }
  .bg::after { content: ""; position: absolute; inset: 0; background: radial-gradient(80% 60% at 50% 35%, transparent, rgba(0,0,0,.55)); }
  :global([data-mode="day"]) .bg::after { background: radial-gradient(80% 60% at 50% 35%, transparent, rgba(255,250,240,.5)); }
  header { position: relative; z-index: 2; padding: max(14px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 0 max(16px, env(safe-area-inset-left, 0px)); }
  .back { display: inline-flex; align-items: center; gap: 4px; height: 36px; padding: 0 14px 0 8px; border-radius: 18px; border: 0; background: rgba(255,255,255,.14); color: inherit; font: 500 14px var(--font-ui); backdrop-filter: blur(10px); }
  :global([data-mode="day"]) .back { background: rgba(0,0,0,.08); }
  canvas { position: relative; z-index: 1; flex: 1; min-height: 0; width: 100%; display: block; cursor: grab; touch-action: pan-y; }
  .panel { position: relative; z-index: 2; display: flex; flex-direction: column; gap: 14px; max-width: 560px; width: 100%; box-sizing: border-box; align-self: center;
    padding: 18px max(20px, env(safe-area-inset-right, 0px)) calc(110px + env(safe-area-inset-bottom, 0px)) max(20px, env(safe-area-inset-left, 0px)); }
  .tablet .panel { padding-bottom: 32px; }
  .ttl { display: flex; align-items: flex-end; gap: 12px; } .ttl > div { flex: 1; min-width: 0; }
  h1 { margin: 0; font: var(--display-weight, 300) 30px/1.05 var(--font-display); letter-spacing: -.01em; }
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
  :global([data-trend="minimal"]) .dv .track, :global([data-trend="minimal"]) .dv .big, :global([data-trend="minimal"]) .dv .set, :global([data-trend="minimal"]) .dv .chip { border-radius: 0; }
</style>
