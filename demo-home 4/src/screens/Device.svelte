<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '../ui/Icon.svelte';
  import { deviceById, roomById, house } from '../core/house';
  import { floorName, multiFloor } from '../client/nav.svelte';
  import { dev, cmd, home } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { go, argDev } from '../client/router.svelte';
  import { fmtT, roomLight } from '../client/derive.svelte';
  import { photoFor } from '../client/rooms';
  import { HeroView, type HeroKind } from '../house/hero3d';
  import { heroOf } from '../client/hero';

  // Карточка предмета-героя. Образец — «Control Smart Lamp» Виктории Ткачук (Dribbble, экран «Aqara LED»):
  // предмет висит из-под верхнего края по центру, под ним — помещение и крупное имя, широкая «шторка»
  // включения со стрелками (тянешь кружок — включаешь), плитки режимов и большая дуга внизу
  // с процентом в центре. Теплоту света добавили тонкой линией с «пилюлей» (как у RonDesignLab).
  let { arg = '' }: { arg?: string } = $props();
  const id = deviceById[argDev(arg)] ? argDev(arg) : house.favorites.overview[0];
  const d = deviceById[id];
  const r = roomById[d.room];
  const kind = (heroOf(d) ?? 'spots') as HeroKind;
  const c = d.caps;
  const isLight = c.includes('dimmer'), isShade = c.includes('shade'), isClimate = c.includes('climate'), isSound = c.includes('speaker') || c.includes('media');
  const s = $derived(dev(id));
  const photo = $derived.by(() => { const ph = photoFor(d.room, !!home.s?.night); return ph ? house.photos?.[ph]?.src ?? '' : ''; });
  let canvas: HTMLCanvasElement;
  let view: HeroView | undefined;

  const on = $derived(isLight ? (s.level ?? 0) > 0 : isShade ? (s.position ?? 0) > 0 : isClimate ? s.mode !== 'off' : c.includes('speaker') ? !!s.playing : !!s.on);
  const heat = $derived(s.current !== undefined && s.target !== undefined && on ? Math.max(0, Math.min(1, (s.target - s.current) / 1.2)) : 0);
  const hue = $derived.by(() => { let h = 0; for (const ch of s.title ?? d.name) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; });
  const ct = $derived(s.ct ?? 2700);
  onMount(() => { view = new HeroView(canvas, kind); return () => view?.destroy(); });
  $effect(() => {
    if (!view) return;
    view.state = { level: isLight ? (s.level ?? 0) / 100 : 0, pos: (s.position ?? (isShade ? 0 : 100)) / 100, on, heat: kind === 'ac' ? 0 : heat, hue, day: !home.s?.night, ct: isLight ? ct : undefined };
  });
  const ctCss = (kv: number) => { const q = Math.max(0, Math.min(1, (kv - 2200) / 4300)); return `rgb(255, ${Math.round(255 * (.62 + q * .36))}, ${Math.round(255 * (.32 + Math.pow(q, .8) * .66))})`; };

  // ——— включение: «шторка» с кружком ———
  const power = (v: boolean) => isLight ? cmd({ cmd: 'light.set', target: id, on: v }) : isClimate ? cmd({ cmd: 'climate.set', target: id, mode: v ? 'auto' : 'off' })
    : c.includes('speaker') ? cmd({ cmd: 'media.action', target: id, action: v ? 'play' : 'pause' }) : c.includes('media') ? cmd({ cmd: 'media.action', target: id, action: 'power' })
    : isShade ? cmd({ cmd: 'shade.set', target: id, position: v ? 100 : 0 }) : cmd({ cmd: 'device.set', target: id, on: v });
  let sw: HTMLDivElement; let swX = $state<number | null>(null); let sx0 = 0;
  const swDown = (e: PointerEvent) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); sx0 = e.clientX; swX = 0; };
  const swMove = (e: PointerEvent) => { if (swX === null) return; const max = sw.clientWidth - 60; swX = Math.max(-max, Math.min(max, e.clientX - sx0)); };
  const swUp = () => { if (swX === null) return; const dx = swX; swX = null; if (Math.abs(dx) < 6) power(!on); else if ((dx > 40 && !on) || (dx < -40 && on)) power(!on); };
  const swLabel = $derived(isLight ? (on ? `Вкл · ${s.level}%` : 'Выкл') : isShade ? (on ? `Открыто · ${s.position}%` : 'Закрыто')
    : isClimate ? (on ? `Работает · ${s.mode === 'heat' ? 'тепло' : s.mode === 'cool' ? 'холод' : 'авто'}` : 'Выкл') : isSound ? (s.playing ? 'Играет' : 'Пауза') : on ? 'Вкл' : 'Выкл');

  // ——— дуга главной величины ———
  type Main = { v: number; min: number; max: number; step: number; text: string; lo: string; hi: string; set: (v: number) => void };
  const main = $derived.by((): Main | null => {
    if (isLight) return { v: s.level ?? 0, min: 0, max: 100, step: 1, text: `${s.level ?? 0}%`, lo: 'moon', hi: 'sun', set: v => cmd({ cmd: 'light.set', target: id, level: v }) };
    if (isShade) return { v: s.position ?? 0, min: 0, max: 100, step: 5, text: `${s.position ?? 0}%`, lo: 'down', hi: 'up', set: v => cmd({ cmd: 'shade.set', target: id, position: v }) };
    if (isClimate) return { v: s.target ?? 22, min: 16, max: 28, step: .5, text: `${fmtT(s.target)}°`, lo: 'snow', hi: 'flame', set: v => cmd({ cmd: 'climate.set', target: id, target_c: v }) };
    if (c.includes('speaker')) return { v: s.volume ?? 30, min: 0, max: 80, step: 1, text: String(s.volume ?? 30), lo: 'minus', hi: 'plus', set: v => cmd({ cmd: 'media.action', target: id, action: 'vol', delta: v - (s.volume ?? 30) }) };
    return null;
  });
  let drag = $state<number | null>(null);
  const val = $derived(drag ?? main?.v ?? 0);
  const k = $derived(main ? (val - main.min) / (main.max - main.min) : 0);
  const R = 120, CX = 150, CY = 140;
  const pt = (q: number) => { const a = Math.PI * (1 - q); return [CX + R * Math.cos(a), CY - R * Math.sin(a)]; };
  const arcD = (q: number) => { const [x, y] = pt(Math.max(.0001, q)); return `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`; };
  const ticks = Array.from({ length: 25 }, (_, i) => { const a = Math.PI * (1 - i / 24); return { q: i / 24, x1: CX + (R - 22) * Math.cos(a), y1: CY - (R - 22) * Math.sin(a), x2: CX + (R - 29) * Math.cos(a), y2: CY - (R - 29) * Math.sin(a) }; });
  let arcEl: SVGSVGElement; let tm: ReturnType<typeof setTimeout>;
  function arcAt(e: PointerEvent) {
    if (!main) return; const b = arcEl.getBoundingClientRect(); const sc = b.width / 300;
    const x = (e.clientX - b.left) / sc - CX, y = CY - (e.clientY - b.top) / sc;
    const q = 1 - Math.atan2(Math.max(0, y), x) / Math.PI;
    const v = Math.round((main.min + Math.max(0, Math.min(1, q)) * (main.max - main.min)) / main.step) * main.step;
    drag = v; clearTimeout(tm); tm = setTimeout(() => main.set(v), 60);
  }
  const arcKey = (e: KeyboardEvent) => { if (!main) return; const dv = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0; if (dv) { e.preventDefault(); main.set(Math.max(main.min, Math.min(main.max, main.v + dv * main.step * (isLight || isShade ? 5 : 1)))); } };
  const shownText = $derived(drag === null ? main?.text : isClimate ? `${fmtT(val)}°` : isLight || isShade ? `${val}%` : String(val));

  // ——— теплота: тонкая линия с пилюлей ———
  let ctEl: HTMLDivElement; let ctDrag = $state<number | null>(null); let tc: ReturnType<typeof setTimeout>;
  const ctShown = $derived(ctDrag ?? ct);
  function ctAt(e: PointerEvent) {
    const b = ctEl.getBoundingClientRect(); const q = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width));
    const v = Math.round((5000 - q * 2800) / 100) * 100; ctDrag = v; clearTimeout(tc); tc = setTimeout(() => cmd({ cmd: 'light.set', target: id, ct: v }), 60);
  }
  const ctQ = $derived((5000 - ctShown) / 2800);

  // ——— плитки режимов ———
  type Mode = { n: string; sub: string; icon: string; on: boolean; run: () => void };
  const modes = $derived.by((): Mode[] => {
    if (isLight) return [
      { n: 'Вечер', sub: '45% · 2700 K', icon: 'sofa', on: s.level === 45 && ct === 2700, run: () => cmd({ cmd: 'light.set', target: id, level: 45, ct: 2700 }) },
      { n: 'Ночник', sub: '8% · 2200 K', icon: 'moon', on: s.level === 8 && ct === 2200, run: () => cmd({ cmd: 'light.set', target: id, level: 8, ct: 2200 }) },
      { n: 'Чтение', sub: '100% · 4000 K', icon: 'book', on: s.level === 100 && ct === 4000, run: () => cmd({ cmd: 'light.set', target: id, level: 100, ct: 4000 }) }];
    if (isShade) return [
      { n: 'Полутень', sub: '50%', icon: 'sun', on: s.position === 50, run: () => cmd({ cmd: 'shade.set', target: id, position: 50 }) },
      { n: 'Приватно', sub: '25%', icon: 'eye', on: s.position === 25, run: () => cmd({ cmd: 'shade.set', target: id, position: 25 }) },
      { n: 'По солнцу', sub: 'день — открыто', icon: 'clock', on: false, run: () => cmd({ cmd: 'shade.set', target: id, position: home.s?.night ? 0 : 100 }) }];
    if (isClimate) return [
      { n: 'Авто', sub: 'сам решает', icon: 'climate', on: s.mode === 'auto', run: () => cmd({ cmd: 'climate.set', target: id, mode: 'auto' }) },
      { n: 'Тепло', sub: 'обогрев', icon: 'flame', on: s.mode === 'heat', run: () => cmd({ cmd: 'climate.set', target: id, mode: 'heat' }) },
      { n: 'Холод', sub: 'охлаждение', icon: 'snow', on: s.mode === 'cool', run: () => cmd({ cmd: 'climate.set', target: id, mode: 'cool' }) }];
    if (isSound) return [
      { n: 'Медиатека', sub: 'обложки, плейлисты', icon: 'media', on: false, run: () => go('media') },
      { n: 'Тише', sub: '−5', icon: 'minus', on: false, run: () => cmd({ cmd: 'media.action', target: id, action: 'vol', delta: -5 }) }];
    return [];
  });
  const back = () => (history.length > 1 ? history.back() : go('room', d.room));
</script>

<div class="dv {theme.profile}" class:on class:hang={kind === 'pendant' || kind === 'chandelier'} style="--ct:{ctCss(ctShown)}">
  <div class="bg" aria-hidden="true">{#if photo}<img src={photo} alt="" style="opacity:{.18 + roomLight(d.room) * .3}" />{/if}<i class="cone"></i></div>
  <canvas bind:this={canvas} aria-label="{d.name}: потяните, чтобы повернуть"></canvas>

  <header>
    <button class="rb press" aria-label="Назад, {r?.name}" onclick={back}><Icon name="back" size={20} /></button>
    <button class="rb press" aria-label="Все устройства комнаты" onclick={() => go('room', d.room)}><Icon name="sliders" size={18} /></button>
  </header>

  <div class="col">
    <div class="ttl">
      <span class="room">{r?.name}{multiFloor ? ` · ${floorName(d.room)}` : ''}</span>
      <h1>{d.name}</h1>
    </div>

    <div class="sw" class:on bind:this={sw} role="switch" tabindex="0" aria-checked={on} aria-label="{d.name}: {on ? 'выключить' : 'включить'}"
      onpointerdown={swDown} onpointermove={swMove} onpointerup={swUp} onpointercancel={() => (swX = null)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); power(!on); } }}>
      <span class="chev" aria-hidden="true">{#each [0, 1, 2] as i}<i style="animation-delay:{i * .15}s">{on ? '‹' : '›'}</i>{/each}</span>
      <b>{swLabel}</b>
      <span class="knob" style="transform: translateX({swX ?? 0}px)"><Icon name="power" size={20} /></span>
    </div>

    {#if modes.length}
      <div class="tiles" style="--n:{modes.length}">
        {#each modes as m}
          <button class="tile press" class:on={m.on} aria-pressed={m.on} onclick={m.run}>
            <span class="ti"><Icon name={m.icon} size={18} /></span><b>{m.n}</b><i>{m.sub}</i>
          </button>
        {/each}
      </div>
    {/if}

    {#if isLight && c.includes('colorTemp')}
      <div class="ct">
        <div class="ctl"><span>Теплота</span><b class="num">{ctShown} K</b></div>
        <div class="line" bind:this={ctEl} role="slider" tabindex="0" aria-label="Теплота света" aria-valuemin={2200} aria-valuemax={5000} aria-valuenow={ctShown}
          onpointerdown={(e) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); ctAt(e); }} onpointermove={(e) => e.buttons && ctAt(e)} onpointerup={() => setTimeout(() => (ctDrag = null), 400)}
          onkeydown={(e) => { const dv = e.key === 'ArrowRight' ? 100 : e.key === 'ArrowLeft' ? -100 : 0; if (dv) { e.preventDefault(); cmd({ cmd: 'light.set', target: id, ct: Math.max(2200, Math.min(5000, ct - dv)) }); } }}>
          <span class="pil" style="left:{ctQ * 100}%">•••</span>
        </div>
        <div class="ends"><span>Холодный</span><span>Тёплый</span></div>
      </div>
    {/if}

    {#if main}
      <div class="arc">
        <svg bind:this={arcEl} viewBox="0 0 300 160" role="slider" tabindex="0" aria-label={isLight ? 'Яркость' : isShade ? 'Положение' : isClimate ? 'Уставка' : 'Громкость'} aria-valuemin={main.min} aria-valuemax={main.max} aria-valuenow={val}
          onpointerdown={(e) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); arcAt(e); }} onpointermove={(e) => e.buttons && arcAt(e)} onpointerup={() => setTimeout(() => (drag = null), 400)} onkeydown={arcKey}>
          <defs><linearGradient id="arcg" x1="0" x2="1"><stop offset="0" stop-color="#7a5532" /><stop offset="1" stop-color={ctCss(ctShown)} /></linearGradient></defs>
          <path class="trk" d={arcD(1)} />
          <path class="val" d={arcD(k)} />
          {#each ticks as t}<line class="tick" class:lit={t.q <= k} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />{/each}
          <circle class="th" cx={pt(k)[0]} cy={pt(k)[1]} r="11" />
        </svg>
        <div class="mid"><b class="num">{shownText}</b><i>{isLight ? 'яркость' : isShade ? 'открыто' : isClimate ? (s.current !== undefined ? `сейчас ${fmtT(s.current)}°` : 'уставка') : 'громкость'}</i></div>
        <span class="lo"><Icon name={main.lo} size={16} /></span><span class="hi"><Icon name={main.hi} size={16} /></span>
      </div>
    {/if}
  </div>
</div>

<style>
  .dv { position: relative; height: var(--screen-h); overflow: hidden; background: var(--bg); color: var(--text); display: flex; flex-direction: column; }
  .bg { position: absolute; inset: -40px; z-index: 0; pointer-events: none; }
  .bg img { width: 100%; height: 100%; object-fit: cover; filter: blur(30px) saturate(1.1); transition: opacity .6s; }
  .bg::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, color-mix(in srgb, var(--bg) 40%, transparent), var(--bg) 62%); }
  /* луч от предмета вниз — как свет, падающий на стол */
  .cone { position: absolute; z-index: 1; left: 50%; top: 18%; width: 130%; height: 70%; transform: translateX(-50%); opacity: 0; transition: opacity 1s, background 1s;
    background: radial-gradient(42% 60% at 50% 0%, color-mix(in srgb, var(--ct) 34%, transparent), transparent 75%); }
  .on .cone { opacity: 1; }
  canvas { position: absolute; z-index: 1; left: 0; right: 0; top: 64px; width: 100%; height: calc(40% - 64px); cursor: grab; touch-action: pan-y; }
  .hang canvas { top: 0; height: 40%; }
  header { position: relative; z-index: 3; display: flex; justify-content: space-between; padding: max(14px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 0 max(16px, env(safe-area-inset-left, 0px)); pointer-events: none; }
  .rb { pointer-events: auto; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text); display: grid; place-items: center; }
  .col { position: relative; z-index: 2; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; justify-content: flex-end;
    padding: 0 max(18px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(18px, env(safe-area-inset-left, 0px)); max-width: 520px; width: 100%; box-sizing: border-box; margin: 0 auto; }
  .ttl { text-align: center; }
  .room { font-size: 12.5px; color: var(--muted); }
  h1 { margin: 2px 0 0; font: var(--display-weight, 300) 34px/1.05 var(--font-display); letter-spacing: var(--display-tracking, -.01em); }
  /* шторка включения */
  .sw { position: relative; flex: none; height: 60px; border-radius: 30px; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; touch-action: none; cursor: pointer; user-select: none; }
  .sw b { font: 500 15px var(--font-ui); color: var(--sub); }
  .sw.on b { color: var(--text); }
  .chev { position: absolute; left: 22px; display: flex; gap: 2px; color: var(--muted); font: 400 20px/1 var(--font-ui); }
  .chev i { font-style: normal; animation: chev 1.6s infinite; opacity: .25; }
  @keyframes chev { 30% { opacity: 1; } 60% { opacity: .25; } }
  .knob { position: absolute; right: 6px; width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; transition: background-color .5s, color .5s; }
  .sw:not(.on) .knob { right: auto; left: 6px; background: var(--surface-2); color: var(--muted); }
  .sw:not(.on) .chev { left: auto; right: 22px; }
  .sw.on .knob { background: var(--ct); color: #2a1d10; box-shadow: 0 0 26px color-mix(in srgb, var(--ct) 55%, transparent); }
  .sw:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  /* плитки режимов */
  .tiles { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 10px; flex: none; }
  .tile { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-height: 96px; padding: 12px; border-radius: 22px; border: 1px solid var(--border); background: var(--surface); color: var(--text); text-align: left; font: inherit; transition: background-color .4s, color .4s; }
  .ti { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-2); color: var(--sub); margin-bottom: auto; }
  .tile b { font-weight: 500; font-size: 14px; margin-top: 10px; } .tile i { font-style: normal; font-size: 11.5px; color: var(--muted); }
  .tile.on { background: var(--text); color: var(--bg); } .tile.on i { color: color-mix(in srgb, var(--bg) 70%, transparent); } .tile.on .ti { background: var(--ct); color: #2a1d10; }
  /* теплота */
  .ct { display: flex; flex-direction: column; gap: 6px; padding: 2px 4px; flex: none; }
  .ctl { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--muted); } .ctl b { font-weight: 500; color: var(--text); font-style: italic; }
  .line { position: relative; height: 28px; touch-action: none; cursor: ew-resize; }
  .line::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 2px; margin-top: -1px; border-radius: 1px; background: linear-gradient(90deg, rgb(235,245,255), rgb(255,226,190), rgb(255,158,82)); opacity: .8; }
  .pil { position: absolute; top: 50%; transform: translate(-50%, -50%); padding: 3px 12px 7px; border-radius: 14px; background: var(--surface-solid); border: 1px solid var(--border-strong); color: var(--sub); font: 700 12px/1 var(--font-ui); letter-spacing: .1em; box-shadow: 0 2px 8px rgba(0,0,0,.25); }
  .ends { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--muted); }
  /* дуга */
  .arc { position: relative; align-self: center; width: min(100%, 300px); flex: none; }
  .arc svg { display: block; width: 100%; touch-action: none; cursor: pointer; }
  .arc svg:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 12px; }
  .trk { fill: none; stroke: var(--surface-2); stroke-width: 28; stroke-linecap: round; }
  .val { fill: none; stroke: url(#arcg); stroke-width: 28; stroke-linecap: round; }
  .dv:not(.on) .val { stroke: var(--border-strong); }
  .tick { stroke: var(--border-strong); stroke-width: 1.5; stroke-linecap: round; } .tick.lit { stroke: var(--sub); }
  .th { fill: #fff; stroke: rgba(0,0,0,.15); stroke-width: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,.35)); }
  .mid { position: absolute; left: 0; right: 0; bottom: 4px; display: flex; flex-direction: column; align-items: center; pointer-events: none; }
  .mid b { font: var(--display-weight, 300) 44px/1 var(--font-display); letter-spacing: -.03em; } .mid i { font-style: normal; font-size: 12px; color: var(--muted); }
  .lo, .hi { position: absolute; bottom: -4px; color: var(--muted); } .lo { left: 4%; } .hi { right: 4%; }
  /* планшет: предмет слева на всю высоту, управление колонкой справа */
  .tablet canvas { width: calc(100% - 440px); top: 80px; height: calc(100% - 120px); }
  .tablet.hang canvas { top: 0; height: 100%; }
  .tablet .cone { left: calc((100% - 440px) / 2 + 40px); width: 70%; }
  .tablet header { position: absolute; left: 0; right: 0; top: 0; }
  .tablet .col { position: absolute; right: 0; top: 0; bottom: 0; width: 440px; max-width: none; justify-content: center; padding: 80px 32px 32px; }
  :global([data-trend="minimal"]) .dv .sw, :global([data-trend="minimal"]) .dv .tile, :global([data-trend="minimal"]) .dv .knob, :global([data-trend="minimal"]) .dv .rb, :global([data-trend="minimal"]) .dv .ti { border-radius: 0; }
  @media (prefers-reduced-motion: reduce) { .chev i { animation: none; opacity: .6; } }
</style>
