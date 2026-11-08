<script lang="ts">
  import Icon from './Icon.svelte';
  import { deviceById } from '../core/house';
  import { dev, cmd, home } from '../client/store.svelte';
  import { go, devArg } from '../client/router.svelte';
  import { fmtT } from '../client/derive.svelte';
  import { heroPoster } from '../house/hero3d';
  import { heroOf, iconOf } from '../client/hero';

  // Плитка устройства. Анатомия — из первого дизайна (имя и переключатель сверху, крупное значение
  // снизу, за предметом тёплое свечение, предмет медленно «дышит»), композиция — как у дизайнеров:
  // предмет сбоку и уходит за край. Портрет — плоский рендер того же предмета, что на крупном плане.
  let { id, delay = 0 }: { id: string; delay?: number } = $props();
  const d = $derived(deviceById[id]);
  const s = $derived(dev(id));
  const k = $derived(heroOf(d));
  const c = $derived(d.caps);
  const on = $derived(c.includes('dimmer') ? (s.level ?? 0) > 0 : c.includes('shade') ? (s.position ?? 0) > 0 : c.includes('climate') ? s.mode !== 'off'
    : c.includes('speaker') ? !!s.playing : c.includes('vacuum') ? s.status === 'cleaning' : c.includes('lock') ? !s.locked : !!s.on);
  const day = $derived(!home.s?.night);
  const imgOff = $derived(k ? heroPoster(k, false, day) : '');
  const imgOn = $derived(k ? heroPoster(k, true, day) : '');
  const value = $derived(
    c.includes('dimmer') ? (on ? `${s.level}%` : 'Выкл') : c.includes('shade') ? (s.position ? `${s.position}%` : 'Закрыто')
    : c.includes('climate') || c.includes('floorHeat') ? (s.current !== undefined ? `${fmtT(s.current)}°` : on ? 'Вкл' : 'Выкл')
    : c.includes('speaker') ? (on ? `${s.volume ?? 0}` : '—') : c.includes('lock') ? (on ? 'Открыт' : 'Закрыт') : c.includes('vacuum') ? `${Math.round(s.battery ?? 0)}%` : on ? 'Вкл' : 'Выкл');
  const sub = $derived(
    c.includes('dimmer') ? (on ? `${s.ct ?? 2700} K` : 'выключен') : c.includes('shade') ? (on ? 'открыта' : 'закрыта')
    : c.includes('climate') ? (s.mode === 'off' ? 'выключен' : `держит ${fmtT(s.target)}°`) : c.includes('floorHeat') ? (on ? `до ${fmtT(s.target)}°` : 'выключен')
    : c.includes('speaker') ? (on ? s.title ?? 'играет' : 'пауза') : c.includes('media') ? (on ? s.source ?? 'включён' : 'выключен')
    : c.includes('vacuum') ? (s.status === 'cleaning' ? 'убирает' : s.status === 'returning' ? 'едет на базу' : 'на базе') : c.includes('lock') ? (on ? 'не заперт' : 'заперт') : on ? 'работает' : 'выключен');
  const can = $derived(!d.readonly && (c.includes('dimmer') || c.includes('shade') || c.includes('climate') || c.includes('speaker') || c.includes('media') || c.includes('vacuum') || c.includes('lock') || c.includes('floorHeat') || c.includes('switch') || c.includes('fan') || c.includes('fireplace') || c.includes('glass')));
  function flip(e: Event) {
    e.stopPropagation();
    if (c.includes('dimmer')) cmd({ cmd: 'light.set', target: id, on: !on });
    else if (c.includes('shade')) cmd({ cmd: 'shade.set', target: id, position: on ? 0 : 100 });
    else if (c.includes('climate')) cmd({ cmd: 'climate.set', target: id, mode: on ? 'off' : 'auto' });
    else if (c.includes('speaker')) cmd({ cmd: 'media.action', target: id, action: 'toggle' });
    else if (c.includes('media')) cmd({ cmd: 'media.action', target: id, action: 'power' });
    else if (c.includes('vacuum')) cmd({ cmd: 'vacuum.action', target: id, action: on ? 'dock' : 'start' });
    else if (c.includes('lock')) cmd({ cmd: 'device.set', target: id, locked: on });
    else cmd({ cmd: 'device.set', target: id, on: !on });
  }
  const open = () => (k ? go('lamp', devArg(id)) : can ? flip(new Event('x')) : undefined);
  // как предмет «живёт» в плитке: подвесы свисают сверху, напольное стоит снизу
  const anchor = $derived(k === 'pendant' || k === 'chandelier' || k === 'spots' ? 'top' : k === 'lamp' || k === 'radiator' || k === 'speaker' || k === 'tv' || k === 'gate' ? 'bottom' : 'mid');
</script>

<article class="tile card rise {anchor}" class:on style="animation-delay:{delay}s">
  <button class="hit" onclick={open} aria-label="{d.name}: {k ? 'крупный план' : 'переключить'}"></button>
  <div class="glow" aria-hidden="true"></div>
  {#if k}
    <div class="art float" aria-hidden="true" style="animation-delay:{-delay * 7}s">
      <img src={imgOff} alt="" draggable="false" />
      <img class="lit" src={imgOn} alt="" draggable="false" />
    </div>
  {:else}
    <span class="art ic" aria-hidden="true"><Icon name={iconOf(d)} size={34} /></span>
  {/if}
  <div class="head">
    <span class="tx"><b>{d.name}</b><i>{sub}</i></span>
    {#if can}
      <button class="tg" role="switch" aria-checked={on} aria-label={d.name} onclick={flip}><span class="knob"></span></button>
    {/if}
  </div>
  <div class="val num">{value}</div>
</article>

<style>
  .tile { position: relative; height: 150px; border-radius: var(--r-xl, 26px); border: 1px solid var(--border); background: var(--surface); overflow: hidden; isolation: isolate;
    transition: border-color 1s var(--ease-light), background-color 1s var(--ease-light); }
  .tile.on { border-color: var(--accent-border); }
  .hit { position: absolute; inset: 0; z-index: 2; border: 0; background: none; cursor: pointer; border-radius: inherit; }
  .hit:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  .glow { position: absolute; z-index: 0; right: -18%; top: 50%; width: 80%; aspect-ratio: 1; transform: translateY(-50%); border-radius: 50%;
    background: radial-gradient(closest-side, rgba(240, 176, 100, .45), transparent 72%); opacity: 0; transition: opacity 1.6s var(--ease-light); pointer-events: none; }
  .on .glow { opacity: 1; }
  .art { position: absolute; z-index: 1; right: -16%; width: 68%; aspect-ratio: 1; pointer-events: none; }
  .mid .art { top: 50%; margin-top: -34%; }
  .top .art { top: -16%; }
  .bottom .art { bottom: -12%; }
  .art img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 12px 16px rgba(0,0,0,.28)); transition: opacity 1.2s var(--ease-light); }
  .art .lit { opacity: 0; }
  .on .art .lit { opacity: 1; }
  .art.ic { width: auto; aspect-ratio: auto; right: 16px; top: auto; bottom: 14px; margin: 0; color: var(--muted); transition: color 1s; }
  .on .art.ic { color: var(--accent-text); }
  .head { position: relative; z-index: 3; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 14px 14px 0; pointer-events: none; }
  .tx { display: flex; flex-direction: column; gap: 2px; min-width: 0; max-width: 64%; }
  .tx b { font-weight: 600; font-size: 14.5px; line-height: 1.2; }
  .tx i { font-style: normal; font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tg { pointer-events: auto; position: relative; flex: none; width: 46px; height: 28px; border-radius: 14px; border: 0; padding: 0; background: var(--border-strong); cursor: pointer; transition: background-color .5s var(--ease-out); }
  .tg .knob { position: absolute; left: 3px; top: 3px; width: 22px; height: 22px; border-radius: 11px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.25); transition: transform .7s var(--spring, cubic-bezier(.3,1.5,.5,1)); }
  .on .tg { background: var(--accent); }
  .on .tg .knob { transform: translateX(18px); }
  .val { position: absolute; z-index: 3; left: 14px; bottom: 12px; font: var(--display-weight, 300) 24px/1 var(--font-display); letter-spacing: -.01em; color: var(--muted); transition: color 1s; pointer-events: none; }
  .on .val { color: var(--text); }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .float { animation: float 6s cubic-bezier(.45, 0, .55, 1) infinite; }
  @media (prefers-reduced-motion: reduce) { .float { animation: none; } }
  :global([data-trend="minimal"]) .tile { border-radius: 0; }
  :global([data-trend="minimal"]) .glow { display: none; }
</style>
