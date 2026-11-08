<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import { S, type Room, type Layer, lightsOn, lightLevel, anyAlert, toggleRoomLights, hue } from './data.svelte';
  import { ui } from './ui.svelte';

  // Ячейка комнаты. Слой решает, что в ней главное; комнаты без функции слоя уходят в тень.
  let { room: r, layer, here = false, compact = false, narrow = false }: { room: Room; layer: Layer; here?: boolean; compact?: boolean; narrow?: boolean } = $props();

  const on = $derived(lightsOn(r));
  const lvl = $derived(lightLevel(r));
  const t = $derived(S.temp[r.id]);
  const m = $derived(S.media[r.id]);
  const sec = $derived(S.sec[r.id]);
  const alert = $derived(anyAlert(r));
  const people = $derived(S.people[r.id] ?? 0);
  const relevant = $derived(
    layer === 'all' ? true : layer === 'light' ? r.lights.length > 0 : layer === 'climate' ? !!t : layer === 'media' ? r.media.length > 0 || !!m : true
  );
  const glow = $derived(layer === 'light' || layer === 'all' ? lvl : 0);
  const delta = $derived(t ? t.cur - t.target : 0);
  const tone = $derived(layer === 'climate' && t ? (delta < -0.6 ? 'warm' : delta > 0.6 ? 'cool' : 'ok') : '');
  const fmt = (n: number) => n.toFixed(1).replace('.', ',');
</script>

<div class="cell" class:narrow class:dim={!relevant} class:alert={alert && (layer === 'security' || layer === 'all')} class:compact
  class:media={layer === 'media' && !!m} class:tone-warm={tone === 'warm'} class:tone-cool={tone === 'cool'}
  style="--glow:{glow.toFixed(2)}; --hue:{m ? hue(m.art) : 0}">
  <button class="hit" aria-label="{r.name}: открыть" onclick={() => (ui.room = r.id)}></button>
  <span class="top">
    <span class="nm">{r.name}</span>
    {#if here}<span class="here" title="Вы здесь"></span>{:else if people}<span class="ppl" title="Здесь кто-то есть"><Icon name="person" size={12} /></span>{/if}
  </span>

  <span class="body">
    {#if layer === 'all'}
      <span class="chips">
        {#if on}<span class="ch warm"><Icon name="bulb" size={13} />{on}</span>{/if}
        {#if t}<span class="ch num">{fmt(t.cur)}°</span>{/if}
        {#if m?.playing}<span class="ch eqc"><span class="eq"><i></i><i></i><i></i></span></span>{/if}
        {#if alert}<span class="ch red">окно</span>{/if}
      </span>
    {:else if layer === 'light'}
      {#if r.lights.length}<span class="big num">{on ? `${on} из ${r.lights.length}` : 'Выкл'}</span>{/if}
    {:else if layer === 'climate'}
      {#if t}
        <span class="big num">{fmt(t.cur)}°</span>
        {#if !compact && !narrow}<span class="sub">{tone === 'warm' ? `греет до ${t.target}°` : tone === 'cool' ? `выше ${t.target}°` : `держит ${t.target}°`}</span>{/if}
      {/if}
    {:else if layer === 'media'}
      {#if m}<span class="what">{m.title}</span>{#if !compact && !narrow}<span class="sub">{m.sub}</span>{/if}
      {:else if r.media.length}<span class="sub">тихо</span>{/if}
    {:else}
      {#if sec?.open}<span class="what">Окно открыто</span>
      {:else if sec?.motion}<span class="sub">движение</span>
      {:else}<span class="sub">закрыто</span>{/if}
    {/if}
  </span>

  {#if layer === 'light' && r.lights.length && !compact && !narrow}
    <button class="qa press" class:on={on > 0} aria-label={on ? `Выключить свет: ${r.name}` : `Включить свет: ${r.name}`} onclick={() => toggleRoomLights(r)}><Icon name="power" size={16} /></button>
  {:else if layer === 'media' && m && !compact && !narrow}
    <button class="qa press on" aria-label={m.playing ? 'Пауза' : 'Играть'} onclick={() => (m.playing = !m.playing)}><Icon name={m.playing ? 'pause' : 'play'} size={16} /></button>
  {/if}
</div>

<style>
  .cell { position: relative; min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: space-between; gap: 6px; padding: 10px 11px;
    border-radius: var(--r-md); border: 1px solid var(--border); color: var(--text); overflow: hidden; isolation: isolate;
    background: radial-gradient(120% 90% at 50% 0%, rgba(255, 196, 120, calc(var(--glow) * .55)), transparent 70%), var(--surface);
    transition: opacity .3s, background .4s, border-color .3s; }
  :global([data-mode="day"]) .cell { background: radial-gradient(120% 90% at 50% 0%, rgba(255, 178, 80, calc(var(--glow) * .35)), transparent 70%), var(--surface); }
  .cell.compact { padding: 7px 8px; gap: 2px; }
  .hit { position: absolute; inset: 0; z-index: 0; border: 0; background: none; cursor: pointer; border-radius: inherit; }
  .hit:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  .top, .body { position: relative; z-index: 1; pointer-events: none; display: flex; min-width: 0; }
  .top { align-items: center; gap: 6px; }
  .body { flex-direction: column; gap: 2px; }
  .nm { font: 500 13.5px/1.2 var(--font-ui); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .compact .nm { font-size: 12px; }
  .here { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); flex: none; }
  .ppl { color: var(--accent-text); display: grid; flex: none; }
  .chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .ch { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 7px; border-radius: var(--r-pill); background: var(--surface-2); font-size: 12px; color: var(--sub); }
  .ch.warm { color: #E0A15A; }
  .ch.red { color: var(--danger); background: var(--danger-soft); }
  .big { font: 300 22px/1 var(--font-display); letter-spacing: -.01em; }
  .compact .big, .narrow .big { font-size: 18px; }
  .sub { font-size: 12px; color: var(--muted); }
  .what { font-size: 13px; font-weight: 500; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .dim { opacity: .38; }
  .dim .body { visibility: hidden; }
  .alert { border-color: var(--danger); box-shadow: inset 0 0 0 1px var(--danger); }
  .alert .what { color: var(--danger); }
  .tone-warm { background: linear-gradient(0deg, rgba(232, 128, 60, .22), transparent 70%), var(--surface); }
  .tone-cool { background: linear-gradient(0deg, rgba(90, 150, 230, .22), transparent 70%), var(--surface); }
  .media { color: #F6F2EC; border-color: transparent; background: linear-gradient(150deg, hsl(var(--hue) 45% 34%), hsl(calc(var(--hue) + 50) 50% 16%)); }
  .media .sub { color: rgba(246, 242, 236, .7); }
  .qa { position: absolute; z-index: 2; right: 8px; bottom: 8px; width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border-strong); background: var(--surface-2); color: var(--muted); display: grid; place-items: center; }
  .qa.on { background: var(--text); color: var(--bg); border-color: transparent; }
  .media .qa { background: rgba(255,255,255,.9); color: #1b1712; }
  .eq { display: flex; gap: 2px; align-items: flex-end; height: 11px; }
  .eq i { width: 3px; background: currentColor; border-radius: 1px; animation: eq .9s ease-in-out infinite alternate; }
  .eq i:nth-child(2) { animation-delay: -.3s; } .eq i:nth-child(3) { animation-delay: -.6s; }
  @keyframes eq { from { height: 3px; } to { height: 11px; } }
  @media (prefers-reduced-motion: reduce) { .eq i { animation: none; height: 8px; } }
  :global([data-trend="minimal"]) .cell, :global([data-trend="minimal"]) .ch { border-radius: 0; }
</style>
