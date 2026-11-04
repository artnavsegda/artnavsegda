<script lang="ts">
  import Icon from './Icon.svelte';
  import Toggle from './Toggle.svelte';
  import Slider from './Slider.svelte';
  import { deviceById } from '../core/house';
  import { dev, cmd } from '../client/store.svelte';
  import { go, devArg } from '../client/router.svelte';
  import { fmtT } from '../client/derive.svelte';

  // Строка устройства. Что показать, решают capabilities, а не тип устройства:
  // любой диммер получит слайдер, любая штора — положение.
  let { id, open = false }: { id: string; open?: boolean } = $props();
  const d = $derived(deviceById[id]);
  const s = $derived(dev(id));
  const caps = $derived(d.caps);
  let expanded = $state(open);

  const icon = $derived(caps.includes('dimmer') ? 'bulb' : caps.includes('shade') ? 'shade' : caps.includes('climate') ? 'climate' : caps.includes('media') ? 'media'
    : caps.includes('speaker') ? 'speaker' : caps.includes('vacuum') ? 'vacuum' : caps.includes('floorHeat') ? 'flame' : 'bolt');
  const active = $derived(caps.includes('dimmer') ? (s.level ?? 0) > 0 : caps.includes('shade') ? (s.position ?? 0) > 0 : caps.includes('climate') ? s.mode !== 'off'
    : caps.includes('media') ? !!s.on : caps.includes('speaker') ? !!s.playing : caps.includes('vacuum') ? s.status === 'cleaning' : !!s.on);
  const stateText = $derived(caps.includes('dimmer') ? ((s.level ?? 0) > 0 ? `${s.level}%` : 'выкл.')
    : caps.includes('shade') ? ((s.position ?? 0) === 0 ? 'закрыты' : (s.position ?? 0) >= 100 ? 'открыты' : `открыты на ${s.position}%`)
    : caps.includes('climate') ? `${fmtT(s.current)}° → ${fmtT(s.target)}°`
    : caps.includes('media') ? (s.on ? (s.playing ? 'идёт фильм' : 'пауза') : 'выкл.') + (s.assumed ? ' · ИК' : '')
    : caps.includes('speaker') ? (s.playing ? s.title ?? 'играет' : 'тишина')
    : caps.includes('vacuum') ? (s.status === 'cleaning' ? `убирает · ${s.cleaned} м²` : s.status === 'returning' ? 'едет на базу' : `на базе · ${Math.round(s.battery ?? 0)}%`)
    : caps.includes('floorHeat') ? (s.on ? `${s.target}°` : 'выкл.') : '');

  function flip(v: boolean) {
    if (caps.includes('dimmer')) cmd({ cmd: 'light.set', target: id, on: v });
    else if (caps.includes('shade')) cmd({ cmd: 'shade.set', target: id, position: v ? 100 : 0 });
    else if (caps.includes('climate')) cmd({ cmd: 'climate.set', target: id, mode: v ? 'auto' : 'off' });
    else if (caps.includes('media')) cmd({ cmd: 'media.action', target: id, action: 'power' });
    else if (caps.includes('speaker')) cmd({ cmd: 'media.action', target: id, action: 'toggle' });
    else if (caps.includes('vacuum')) cmd({ cmd: 'vacuum.action', target: id, action: v ? 'start' : 'dock' });
  }
  const expandable = $derived(caps.includes('dimmer') || caps.includes('shade'));
</script>

<div class="row" class:active class:expanded>
  <button class="main" onclick={() => { if (caps.includes('dimmer') && d.assets?.model === 'dome') go('lamp', devArg(id)); else if (caps.includes('media')) go('media'); else if (caps.includes('climate')) go('climate', d.room); else if (expandable) expanded = !expanded; }}>
    <span class="ic"><Icon name={icon} size={20} /></span>
    <span class="tx"><b>{d.name}</b><span class="num">{stateText}</span></span>
  </button>
  {#if !caps.includes('floorHeat')}<Toggle on={active} label={d.name} onchange={flip} />{/if}
  {#if expanded && caps.includes('dimmer')}
    <div class="ex"><Slider label="Яркость {d.name}" value={s.level ?? 0} onchange={(v) => cmd({ cmd: 'light.set', target: id, level: v })} /></div>
  {:else if expanded && caps.includes('shade')}
    <div class="ex"><Slider label="Положение {d.name}" value={s.position ?? 0} step={5} onchange={(v) => cmd({ cmd: 'shade.set', target: id, position: v })} /></div>
  {/if}
</div>

<style>
  .row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px 12px; padding: 10px 12px 10px 10px; border-radius: var(--r-md);
    background: var(--surface); border: 1px solid var(--border); transition: background-color var(--dur-l) var(--ease-light), border-color var(--dur-l) var(--ease-light); }
  .row.active { background: var(--accent-soft); border-color: var(--accent-border); }
  .main { display: flex; align-items: center; gap: 12px; min-width: 0; border: 0; background: none; padding: 0; text-align: left; }
  .ic { width: 40px; height: 40px; flex: none; border-radius: var(--r-sm); display: grid; place-items: center; background: var(--surface-2); color: var(--muted); transition: color var(--dur-m), background-color var(--dur-m); }
  .active .ic { background: var(--accent); color: var(--on-accent); }
  .tx { display: flex; flex-direction: column; min-width: 0; }
  .tx b { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tx span { font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .active .tx span { color: var(--accent-text); }
  .ex { grid-column: 1 / -1; animation: rise .5s var(--ease-out) both; }
  :global([data-trend="minimal"]) .row.active { background: var(--surface); border-color: var(--border); border-left: 2px solid var(--accent); }
  :global([data-trend="minimal"]) .active .ic { background: transparent; color: var(--accent); }
  :global([data-trend="minimal"]) .ic { background: transparent; }
</style>
