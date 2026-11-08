<script lang="ts">
  import Photo from '../ui/Photo.svelte';
  import Icon from '../ui/Icon.svelte';
  import { deviceById } from '../core/house';
  import { home, dev, cmd } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { go } from '../client/router.svelte';
  import { roomLight, roomTemp, fmtT, people } from '../client/derive.svelte';
  import { spotsOn, photoDim } from '../client/rooms';

  // AR-режим. В продукте — камера телефона + якоря ARKit/WebXR, привязанные к плану.
  // В демо камеру изображает фото гостиной с «дрожанием руки» и параллаксом.
  let { arg = '' }: { arg?: string } = $props();
  const photo = $derived(home.s?.night ? 'living-night' : 'living-day');
  const spots = $derived(spotsOn(photo));
  const lights = $derived(spots.filter(s => s.caps.includes('dimmer')));
  let scanning = $state(true);
  let px = $state(0), py = $state(0);
  $effect(() => { const t = setTimeout(() => (scanning = false), 1800); return () => clearTimeout(t); });
  function move(e: PointerEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width - .5) * -28;
    py = ((e.clientY - r.top) / r.height - .5) * -18;
  }
  const isOn = (id: string) => { const c = deviceById[id].caps, s = dev(id); return c.includes('dimmer') ? (s.level ?? 0) > 0 : c.includes('shade') ? (s.position ?? 0) > 0 : !!s.on; };
  const stateText = (id: string) => { const c = deviceById[id].caps, s = dev(id); return c.includes('dimmer') ? (isOn(id) ? `${s.level}%` : 'выкл.') : c.includes('shade') ? `открыты ${s.position}%` : c.includes('media') ? (s.on ? 'вкл. · ИК' : 'выкл. · ИК') : ''; };
  function tap(id: string) {
    const c = deviceById[id].caps;
    if (c.includes('dimmer')) cmd({ cmd: 'light.set', target: id, on: !isOn(id) });
    else if (c.includes('shade')) cmd({ cmd: 'shade.set', target: id, position: (dev(id).position ?? 0) > 50 ? 0 : 100 });
    else if (c.includes('media')) cmd({ cmd: 'media.action', target: id, action: 'power' });
  }
</script>

<div class="ar" onpointermove={move} role="application" aria-label="AR-просмотр гостиной">
  <div class="world" style="transform: translate({px}px, {py}px) scale(1.12)">
    <Photo {photo} ox={0.6} {lights} dim={home.s ? photoDim(photo, roomLight('living'), home.s) : 0} rounded={false}>
      {#snippet children(map)}
        {#if !scanning}
          {#each spots as s, i (s.id)}
            {@const [x, y] = map(s.x, s.y)}
            <div class="anchor" style="left:{x}px; top:{y}px; animation-delay:{i * 0.09}s">
              <span class="pin" class:on={isOn(s.id)}></span>
              <button class="tag" class:on={isOn(s.id)} class:up={i % 2 === 1} onclick={() => tap(s.id)}>
                <b>{s.name}</b><span class="num">{stateText(s.id)}</span>
              </button>
            </div>
          {/each}
        {/if}
      {/snippet}
    </Photo>
  </div>

  <div class="frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  {#if scanning}
    <div class="scan" aria-live="polite"><span class="line"></span><p>Ищу ориентиры комнаты…</p></div>
  {/if}

  <div class="top">
    <button class="round" aria-label="Закрыть AR" onclick={() => history.length > 1 ? history.back() : go('home')}><Icon name="x" /></button>
    <div class="pill"><Icon name="ar" size={18} />Гостиная · {fmtT(roomTemp('living'))}°{people('living') ? ` · ${people('living')} чел.` : ''}</div>
  </div>
  <div class="bottom">
    <p>Наведите телефон на устройство и коснитесь подписи.<br /><span>Демо: вместо камеры — фото комнаты, двигайте пальцем или мышью.</span></p>
  </div>
</div>

<style>
  .ar { position: relative; height: var(--screen-h); overflow: hidden; background: #000; touch-action: none; }
  .world { position: absolute; inset: 0; transition: transform 1.2s var(--ease-out); animation: sway 9s ease-in-out infinite; }
  @keyframes sway { 0%, 100% { translate: 0 0; rotate: 0deg; } 33% { translate: 6px -4px; rotate: .3deg; } 66% { translate: -5px 3px; rotate: -.25deg; } }
  .world :global(.ph) { position: absolute; inset: 0; }
  .anchor { position: absolute; width: 0; height: 0; animation: pop .7s var(--spring) both; }
  .pin { position: absolute; left: -7px; top: -7px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff; background: rgba(0,0,0,.35); box-shadow: 0 0 0 6px rgba(255,255,255,.15); }
  .pin.on { background: #FFD08A; box-shadow: 0 0 18px 6px rgba(255,190,110,.6); }
  .tag { position: absolute; left: 14px; top: -64px; display: flex; flex-direction: column; align-items: flex-start; padding: 8px 12px; border-radius: 14px; white-space: nowrap;
    background: rgba(255,255,255,.18); color: #fff; border: 1px solid rgba(255,255,255,.35); -webkit-backdrop-filter: blur(16px) saturate(1.5); backdrop-filter: blur(16px) saturate(1.5); text-align: left; transition: background-color .5s, transform .5s var(--spring); }
  .tag.up { top: 16px; }
  .tag::before { content: ''; position: absolute; left: -14px; top: 100%; width: 14px; height: 1px; background: rgba(255,255,255,.6); transform-origin: right; transform: rotate(-60deg) scaleX(1.6); }
  .tag.up::before { top: -1px; transform: rotate(60deg) scaleX(1.6); }
  .tag:active { transform: scale(.94); }
  .tag.on { background: rgba(255,214,150,.38); border-color: rgba(255,224,170,.7); }
  .tag b { font-weight: 600; font-size: 14px; }
  .tag span { font-size: 12px; opacity: .85; }
  .frame i { position: absolute; width: 34px; height: 34px; border: 3px solid rgba(255,255,255,.85); }
  .frame i:nth-child(1) { left: 22px; top: 22%; border-right: 0; border-bottom: 0; border-top-left-radius: 12px; }
  .frame i:nth-child(2) { right: 22px; top: 22%; border-left: 0; border-bottom: 0; border-top-right-radius: 12px; }
  .frame i:nth-child(3) { left: 22px; bottom: 22%; border-right: 0; border-top: 0; border-bottom-left-radius: 12px; }
  .frame i:nth-child(4) { right: 22px; bottom: 22%; border-left: 0; border-top: 0; border-bottom-right-radius: 12px; }
  .scan { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,.25); color: #fff; }
  .scan p { margin: 0; padding: 10px 16px; border-radius: 999px; background: rgba(0,0,0,.45); font-size: 14px; }
  .line { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #7CC6D6, transparent); box-shadow: 0 0 20px #7CC6D6; animation: sweep 1.6s var(--ease-light) infinite; }
  @keyframes sweep { from { top: 20%; } to { top: 80%; } }
  .top { position: absolute; top: 0; left: 0; right: 0; display: flex; gap: 10px; align-items: center; padding: max(16px, env(safe-area-inset-top, 0px)) 16px 0; }
  .round { width: 46px; height: 46px; border-radius: 50%; border: 0; display: grid; place-items: center; background: rgba(0,0,0,.45); color: #fff; -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); }
  .pill { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px; border-radius: 999px; background: rgba(0,0,0,.45); color: #fff; font-size: 14px; -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); }
  .bottom { position: absolute; left: 16px; right: 16px; bottom: calc(20px + env(safe-area-inset-bottom, 0px)); text-align: center; color: #fff; }
  .bottom p { margin: 0 auto; max-width: 420px; padding: 12px 16px; border-radius: 18px; background: rgba(0,0,0,.45); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); font-size: 14px; }
  .bottom span { font-size: 12px; opacity: .7; }
  :global([data-trend="minimal"]) .tag { border-radius: 0; background: rgba(13,13,13,.8); backdrop-filter: none; text-transform: uppercase; letter-spacing: .06em; }
  :global([data-trend="minimal"]) .tag.on { background: var(--accent); color: #0D0D0D; border-color: var(--accent); }
  :global([data-trend="minimal"]) .pin { border-radius: 0; }
  :global([data-trend="minimal"]) .frame i { border-radius: 0 !important; }
</style>
