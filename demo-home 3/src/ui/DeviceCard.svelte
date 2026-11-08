<script lang="ts">
  import Toggle from './Toggle.svelte';
  import Icon from './Icon.svelte';
  import { deviceById } from '../core/house';
  import { dev, cmd } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { go, devArg } from '../client/router.svelte';
  import { poster } from '../client/three/models';

  // Карточка устройства с его «портретом». В тёплом тренде — 3D-рендер модели,
  // который меняется вместе с состоянием; в минимализме — крупная цифра.
  let { id, delay = 0 }: { id: string; delay?: number } = $props();
  const d = $derived(deviceById[id]);
  const s = $derived(dev(id));
  const on = $derived(d.caps.includes('dimmer') ? (s.level ?? 0) > 0 : d.caps.includes('speaker') ? !!s.playing : d.caps.includes('vacuum') ? s.status === 'cleaning' : !!s.on);
  const img = $derived(theme.t.features.posters && d.assets?.model ? poster(d.assets.model, on, !theme.night) : '');
  const big = $derived(d.caps.includes('dimmer') ? (on ? `${s.level}%` : 'OFF') : d.caps.includes('speaker') ? (on ? `${s.volume}` : '—') : d.caps.includes('vacuum') ? `${s.cleaned ?? 0}м²` : '');
  const line = $derived(d.caps.includes('dimmer') ? (on ? `${s.level}% · ${s.ct ?? 2700} K` : 'выключен') : d.caps.includes('speaker') ? (on ? s.title : 'пауза')
    : d.caps.includes('vacuum') ? (s.status === 'cleaning' ? `убирает · ${s.cleaned} из 42 м²` : s.status === 'returning' ? 'едет на базу' : `на базе · ${Math.round(s.battery ?? 0)}%`) : '');
  function flip(v: boolean) {
    if (d.caps.includes('dimmer')) cmd({ cmd: 'light.set', target: id, on: v });
    else if (d.caps.includes('speaker')) cmd({ cmd: 'media.action', target: id, action: 'toggle' });
    else if (d.caps.includes('vacuum')) cmd({ cmd: 'vacuum.action', target: id, action: v ? 'start' : 'dock' });
  }
  const open = () => d.caps.includes('dimmer') ? go('lamp', devArg(id)) : d.caps.includes('speaker') ? go('media') : flip(!on);
</script>

<article class="dc card rise" class:on style="animation-delay:{delay}s">
  <button class="body" onclick={open} aria-label="{d.name}: подробнее">
    {#if img}
      {#key img}<img src={img} alt="" class="poster" draggable="false" />{/key}
    {:else}
      <span class="big num">{big}</span>
    {/if}
  </button>
  <footer>
    <div class="tx"><b>{d.name}</b><span>{line}</span></div>
    <Toggle {on} label={d.name} onchange={flip} />
  </footer>
  {#if d.caps.includes('dimmer')}<span class="go"><Icon name="next" size={16} /></span>{/if}
</article>

<style>
  .dc { position: relative; display: flex; flex-direction: column; overflow: hidden; min-height: 200px; transition: background-color 1.2s var(--ease-light), border-color 1.2s; }
  .dc.on { background: var(--hero-card); border-color: var(--accent-border); }
  .body { flex: 1; border: 0; background: none; padding: 0; display: grid; place-items: center; min-height: 110px; }
  .poster { width: 100%; max-width: 190px; aspect-ratio: 1; object-fit: contain; animation: fade .8s var(--ease-out) both; filter: drop-shadow(0 18px 24px rgba(0,0,0,.25)); }
  .big { font-size: clamp(34px, 4vw, 52px); letter-spacing: -.04em; color: var(--muted); transition: color var(--dur-m); }
  .on .big { color: var(--text); }
  footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; padding: 0 14px 14px; }
  .tx { display: flex; flex-direction: column; min-width: 0; }
  .tx b { font-weight: 600; font-size: 15px; }
  .tx span { font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .go { position: absolute; top: 12px; right: 12px; color: var(--muted); }
  :global([data-trend="minimal"]) .dc.on { background: var(--surface); border-color: var(--border); }
  :global([data-trend="minimal"]) .dc.on .big { color: var(--accent); }
  :global([data-trend="minimal"]) .body { place-items: end start; padding: 16px 14px 6px; }
</style>
