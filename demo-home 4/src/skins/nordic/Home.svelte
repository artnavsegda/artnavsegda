<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '../../ui/Icon.svelte';
  import { DomScene, layers, fl, value, info, stats } from '../../client/domscene.svelte';
  import { theme } from '../../client/theme.svelte';
  import { go } from '../../client/router.svelte';
  import { greeting, dateLine, fmtT, pluralPeople } from '../../client/derive.svelte';
  import { photoFor } from '../../client/rooms';
  import { house } from '../../core/house';
  import { home } from '../../client/store.svelte';

  // «Нордик» — дом как деревянная модель на дубовом подносе. Этажи — камешки, слои — плитки-«баночки»,
  // ниже — комнаты карточками с фото, как в журнале про интерьер. Тихо, светло, много воздуха.
  const S = new DomScene();
  let host: HTMLDivElement, canvas: HTMLCanvasElement;
  onMount(() => S.attach(host, canvas));
  const x = $derived(stats());
  const rooms = $derived(house.rooms.map(r => ({ r, v: value(r.id, S.layer), i: info(r.id), ph: house.photos[photoFor(r.id, !!home.s?.night)]?.src }))
    .filter(a => S.focus === null || (a.r.floor ?? 1) === S.focus).sort((a, b) => Number(!!b.v) - Number(!!a.v)).slice(0, theme.profile === 'tablet' ? 6 : 6));
  const line = $derived([x.people ? `дома ${pluralPeople(x.people)}` : 'дома тихо', x.inside !== undefined ? `внутри ${fmtT(x.inside)}°` : '', x.outside !== undefined ? `снаружи ${fmtT(x.outside)}°` : ''].filter(Boolean).join(' · '));
</script>

<div class="n {theme.profile}">
  <header class="hd rise">
    <span class="dl">{dateLine()}</span>
    <h1>{greeting()}</h1>
    <p>{line}</p>
  </header>

  <section class="model rise" style="animation-delay:.05s">
    <div class="tray" aria-hidden="true"></div>
    <div class="stage" bind:this={host}>
      <canvas bind:this={canvas} onpointerdown={S.pd} onpointermove={S.pm} onpointerup={S.pu} aria-label="Модель дома: тап по этажу или комнате, потяните вбок — повернуть"></canvas>
      {#each S.labels as l (l.id)}
        <button class="lb {l.v?.k ?? ''}" style="left:{l.x}px; top:{l.y}px" onclick={() => go('room', l.r.id)}>{#if l.full || !l.v}<b>{l.r.name}</b>{/if}{#if l.v}<span>{l.v.t}</span>{/if}</button>
      {/each}
    </div>
    {#if fl.length > 1}
      <div class="pebbles" role="tablist" aria-label="Этажи">
        <button role="tab" class="pb" aria-selected={S.focus === null} class:on={S.focus === null} aria-label="Весь дом" onclick={() => (S.focus = null)}><Icon name="house" size={16} /></button>
        {#each [...fl].reverse() as f (f.id)}<button role="tab" class="pb" aria-selected={S.focus === f.id} class:on={S.focus === f.id} aria-label={f.name} onclick={() => (S.focus = f.id)}>{f.id}</button>{/each}
      </div>
    {/if}
  </section>

  <div class="jars" role="tablist" aria-label="Что показать">
    {#each layers as l (l.id)}
      <button role="tab" aria-selected={S.layer === l.id} class:on={S.layer === l.id} onclick={() => S.setLayer(l.id)}><span class="jar"><Icon name={l.icon} size={20} /></span>{l.name}</button>
    {/each}
  </div>

  <section class="rooms">
    <h2>{S.focus === null ? 'Комнаты' : `${S.focus} этаж`}</h2>
    <div class="grid">
      {#each rooms as a, i (a.r.id)}
        <button class="rc rise" style="animation-delay:{.08 + i * .04}s" onclick={() => go('room', a.r.id)}>
          <span class="ph">{#if a.ph}<img src={a.ph} alt="" />{/if}<i class="candle" style="opacity:{a.i.light * .9}"></i></span>
          <span class="tx"><b>{a.r.name}</b><em class={a.v?.k ?? ''}>{a.v?.t ?? (a.i.c?.current !== undefined ? `${fmtT(a.i.c.current)}°` : 'тихо')}</em></span>
        </button>
      {/each}
    </div>
  </section>
</div>

<style>
  .n { display: flex; flex-direction: column; gap: 18px; padding: max(22px, env(safe-area-inset-top, 0px)) max(18px, env(safe-area-inset-right, 0px)) 28px max(18px, env(safe-area-inset-left, 0px)); }
  .n.tablet { display: grid; grid-template-columns: 380px minmax(0, 1fr); grid-template-rows: auto auto 1fr; gap: 22px 36px; padding: 34px 40px; height: var(--screen-h); box-sizing: border-box; overflow: hidden; }
  .tablet .hd { grid-column: 1; } .tablet .jars { grid-column: 1; } .tablet .rooms { grid-column: 1; min-height: 0; overflow: auto; }
  .tablet .model { grid-column: 2; grid-row: 1 / 4; height: 100%; }
  .dl { font-size: 13px; color: var(--muted); }
  h1 { margin: 4px 0 0; font: 300 42px/1.05 var(--font-display); letter-spacing: -.02em; }
  .tablet h1 { font-size: 52px; }
  .hd p { margin: 8px 0 0; font-size: 14px; color: var(--sub); }
  .model { position: relative; display: flex; flex-direction: column; }
  .tray { position: absolute; left: 4%; right: 4%; bottom: 58px; height: 34%; border-radius: 50%; background-color: var(--wood); background-image: var(--oak); background-size: 400px 240px;
    box-shadow: inset 0 -10px 18px rgba(60,40,20,.25), inset 0 6px 10px rgba(255,255,255,.25), 0 24px 40px rgba(60,45,25,.22); }
  .stage { position: relative; height: 400px; touch-action: pan-y; }
  .tablet .stage { flex: 1; height: auto; }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: grab; }
  .lb { position: absolute; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; padding: 5px 10px; border: 0; border-radius: 14px; background: var(--surface); color: var(--text); font: 500 11.5px/1.2 var(--font-ui); white-space: nowrap; box-shadow: var(--shadow); }
  .lb span { color: var(--muted); } .lb.warm span { color: var(--clay); } .lb.cool span { color: var(--cool-text); } .lb.alert span { color: var(--danger); } .lb.media span { color: var(--accent-text); }
  .pebbles { position: relative; z-index: 1; align-self: center; display: flex; gap: 10px; margin-top: 6px; }
  .pb { width: 46px; height: 40px; border: 0; border-radius: 50% 48% 52% 46% / 56% 50% 50% 44%; color: var(--text); font: 500 15px var(--font-ui); display: grid; place-items: center;
    background: radial-gradient(circle at 35% 30%, color-mix(in srgb, #fff 55%, var(--stone)), var(--stone) 65%, color-mix(in srgb, #000 12%, var(--stone))); box-shadow: 0 4px 10px rgba(60,45,25,.2), inset 0 -2px 3px rgba(0,0,0,.08); transition: transform .4s var(--spring); }
  .pb:nth-child(2) { border-radius: 46% 54% 48% 52% / 50% 46% 54% 50%; } .pb:nth-child(3) { border-radius: 52% 48% 56% 44% / 48% 54% 46% 52%; }
  .pb.on { background: radial-gradient(circle at 35% 30%, #A9C3A7, var(--accent) 65%, #55735A); color: #fff; transform: translateY(-3px); }
  .jars { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .jars button { display: flex; flex-direction: column; align-items: center; gap: 6px; border: 0; background: none; padding: 0; color: var(--sub); font: 500 12px var(--font-ui); }
  .jar { width: 100%; aspect-ratio: 1; max-width: 58px; border-radius: 18px; display: grid; place-items: center; background: var(--surface); box-shadow: var(--shadow); color: var(--sub); transition: background-color .5s, color .5s; }
  .jars button.on { color: var(--text); }
  .jars button.on .jar { background: var(--accent); color: var(--on-accent); }
  h2 { margin: 6px 0 10px; font: 350 24px var(--font-display); }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .rc { display: flex; flex-direction: column; gap: 8px; border: 0; background: none; padding: 0; color: var(--text); text-align: left; font: inherit; }
  .ph { position: relative; aspect-ratio: 4 / 3; border-radius: 20px; overflow: hidden; background: var(--surface-2); box-shadow: var(--shadow); }
  .ph img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.85) sepia(.06); }
  .candle { position: absolute; inset: 0; background: radial-gradient(60% 60% at 50% 40%, rgba(255,190,120,.55), transparent 70%); mix-blend-mode: soft-light; }
  .tx { display: flex; flex-direction: column; padding: 0 4px; } .tx b { font-weight: 500; font-size: 14.5px; }
  .tx em { font-style: normal; font-size: 12.5px; color: var(--muted); } .tx em.warm { color: var(--clay); } .tx em.cool { color: var(--cool-text); } .tx em.alert { color: var(--danger); } .tx em.media { color: var(--accent-text); }
</style>
