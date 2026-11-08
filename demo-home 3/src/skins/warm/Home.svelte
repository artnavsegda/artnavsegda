<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '../../ui/Icon.svelte';
  import { DomScene, layers, fl, info, value, summaryLine } from '../../client/domscene.svelte';
  import { theme } from '../../client/theme.svelte';
  import { go } from '../../client/router.svelte';
  import { greeting, dateLine, fmtT } from '../../client/derive.svelte';
  import { photoFor } from '../../client/rooms';
  import { house } from '../../core/house';
  import { home } from '../../client/store.svelte';

  // «Тёплый вечер» — окно в дом. Дом на весь экран, поверх него — стекло: приветствие, лифт этажей слева,
  // слои справа, внизу лента «живых» комнат. Свет в доме — главный герой.
  const S = new DomScene();
  let host: HTMLDivElement, canvas: HTMLCanvasElement;
  onMount(() => S.attach(host, canvas));
  const live = $derived(house.rooms.filter(r => value(r.id, 'all')).map(r => ({ r, v: value(r.id, 'all')!, i: info(r.id), ph: house.photos[photoFor(r.id, !!home.s?.night)]?.src })));
  const floorsTop = [...fl].reverse();
  const lift = $derived(S.focus === null ? 0 : floorsTop.findIndex(f => f.id === S.focus) + 1);
</script>

<div class="w {theme.profile}">
  <div class="stage" bind:this={host}>
    <canvas bind:this={canvas} onpointerdown={S.pd} onpointermove={S.pm} onpointerup={S.pu} aria-label="Дом в 3D: тап по этажу или комнате, потяните вбок — повернуть"></canvas>
    {#each S.labels as l (l.id)}
      <button class="lb {l.v?.k ?? ''}" class:here={l.here} style="left:{l.x}px; top:{l.y}px" onclick={() => go('room', l.r.id)}>
        <i class="dot"></i>{#if l.full || !l.v}<b>{l.r.name}</b>{/if}{#if l.v}<span>{l.v.t}</span>{/if}
      </button>
    {/each}
  </div>

  <header class="hd rise">
    <span class="dl">{dateLine()}</span>
    <h1>{greeting()}</h1>
    <p>{summaryLine()}</p>
  </header>

  {#if fl.length > 1}
    <div class="lift glass rise" role="tablist" aria-label="Этажи" style="--k:{lift}">
      <span class="car" aria-hidden="true"></span>
      <button role="tab" aria-selected={S.focus === null} aria-label="Весь дом" onclick={() => (S.focus = null)}><Icon name="house" size={17} /></button>
      {#each floorsTop as f (f.id)}<button role="tab" aria-selected={S.focus === f.id} aria-label={f.name} onclick={() => (S.focus = f.id)}>{f.id}</button>{/each}
    </div>
  {/if}

  <div class="lay glass rise" role="tablist" aria-label="Слои">
    {#each layers as l (l.id)}
      <button role="tab" aria-selected={S.layer === l.id} class:on={S.layer === l.id} aria-label={l.name} title={l.name} onclick={() => S.setLayer(l.id)}><Icon name={l.icon} size={18} /></button>
    {/each}
  </div>

  <div class="live" role="list" aria-label="Сейчас в доме">
    {#each live as x, i (x.r.id)}
      <button role="listitem" class="lc glass rise" style="animation-delay:{.1 + i * .05}s" onclick={() => go('room', x.r.id)}>
        <span class="ph">{#if x.ph}<img src={x.ph} alt="" />{/if}<i style="opacity:{x.i.light}"></i></span>
        <span class="tx"><b>{x.r.name}</b><em class={x.v.k}>{x.v.t}</em></span>
        {#if x.i.c?.current !== undefined}<span class="t num">{fmtT(x.i.c.current)}°</span>{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .w { position: relative; height: var(--screen-h); overflow: hidden; }
  .stage { position: absolute; inset: 0; touch-action: pan-y; }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: grab; }
  .hd { position: absolute; z-index: 2; top: max(18px, env(safe-area-inset-top, 0px)); left: max(18px, env(safe-area-inset-left, 0px)); right: 70px; pointer-events: none;
    text-shadow: 0 2px 20px color-mix(in srgb, var(--bg) 70%, transparent); }
  .tablet .hd { top: 28px; left: 36px; }
  .dl { font-size: 13px; color: var(--muted); }
  h1 { margin: 2px 0 0; font: 200 40px/1.05 var(--font-display); letter-spacing: -.03em; }
  .tablet h1 { font-size: 56px; }
  .hd p { margin: 6px 0 0; font-size: 13.5px; color: var(--sub); max-width: 34ch; }
  .glass { background: var(--glass); border: 1px solid var(--border-strong); -webkit-backdrop-filter: blur(22px) saturate(1.5); backdrop-filter: blur(22px) saturate(1.5); box-shadow: 0 14px 34px rgba(0,0,0,.25); }
  .lift { position: absolute; z-index: 3; left: max(12px, env(safe-area-inset-left, 0px)); top: 46%; transform: translateY(-50%); display: flex; flex-direction: column; padding: 5px; border-radius: 26px; }
  .lift button { position: relative; z-index: 1; width: 40px; height: 40px; border: 0; background: none; color: var(--sub); font: 500 15px var(--font-num); display: grid; place-items: center; transition: color .4s; }
  .lift button[aria-selected="true"] { color: var(--on-accent); }
  .car { position: absolute; left: 5px; top: 5px; width: 40px; height: 40px; border-radius: 20px; background: var(--accent); box-shadow: 0 0 22px color-mix(in srgb, var(--accent) 60%, transparent); transform: translateY(calc(var(--k) * 40px)); transition: transform .7s var(--spring); }
  .lay { position: absolute; z-index: 3; right: max(12px, env(safe-area-inset-right, 0px)); top: max(18px, env(safe-area-inset-top, 0px)); display: flex; flex-direction: column; gap: 2px; padding: 5px; border-radius: 24px; }
  .tablet .lay { top: 28px; right: 28px; }
  .lay button { width: 38px; height: 38px; border: 0; border-radius: 19px; background: none; color: var(--muted); display: grid; place-items: center; transition: background-color .4s, color .4s; }
  .lay button.on { background: var(--accent-soft); color: var(--accent-text); }
  .live { position: absolute; z-index: 3; left: 0; right: 0; bottom: calc(92px + env(safe-area-inset-bottom, 0px)); display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; padding: 4px max(14px, env(safe-area-inset-left, 0px)); scroll-padding-inline: 14px; scroll-snap-type: x proximity; }
  .tablet .live { bottom: 24px; padding-inline: 32px; }
  .lc { flex: none; scroll-snap-align: start; display: flex; align-items: center; gap: 10px; padding: 6px 14px 6px 6px; border-radius: 22px; color: var(--text); text-align: left; font: inherit; }
  .ph { position: relative; width: 44px; height: 44px; border-radius: 16px; overflow: hidden; background: var(--surface-2); flex: none; }
  .ph img { width: 100%; height: 100%; object-fit: cover; filter: brightness(.7); }
  .ph i { position: absolute; inset: 0; background: radial-gradient(circle at 50% 30%, rgba(255,190,110,.75), transparent 70%); mix-blend-mode: screen; }
  .tx { display: flex; flex-direction: column; } .tx b { font-weight: 500; font-size: 14px; white-space: nowrap; }
  .tx em { font-style: normal; font-size: 12px; color: var(--muted); white-space: nowrap; } .tx em.warm { color: var(--accent-text); } .tx em.cool { color: var(--cool-text); } .tx em.alert { color: var(--danger); }
  .t { font-size: 15px; color: var(--sub); margin-left: 4px; }
  .lb { position: absolute; z-index: 1; transform: translate(-50%, -100%); display: flex; align-items: center; gap: 6px; max-width: 170px; padding: 5px 10px 5px 8px; border-radius: 999px;
    background: var(--glass); border: 1px solid var(--border-strong); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); color: var(--text); font: 500 12px/1.2 var(--font-ui); white-space: nowrap; box-shadow: 0 6px 18px rgba(0,0,0,.25); }
  .lb b { font-weight: 500; overflow: hidden; text-overflow: ellipsis; } .lb span { color: var(--sub); overflow: hidden; text-overflow: ellipsis; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); flex: none; }
  .lb.warm .dot { background: var(--accent); box-shadow: 0 0 10px var(--accent); } .lb.cool .dot, .lb.here .dot { background: var(--cool); box-shadow: 0 0 10px var(--cool); }
  .lb.heat .dot { background: #E8803C; } .lb.media .dot { background: #C99CF0; box-shadow: 0 0 10px #C99CF0; } .lb.alert .dot { background: var(--danger); box-shadow: 0 0 10px var(--danger); }
  @media (prefers-reduced-motion: reduce) { .car { transition: none; } }
</style>
