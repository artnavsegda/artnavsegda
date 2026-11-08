<script lang="ts">
  import { onMount } from 'svelte';
  import { DomScene, layers, fl, value, stats } from '../../client/domscene.svelte';
  import { theme } from '../../client/theme.svelte';
  import { go } from '../../client/router.svelte';
  import { fmtT } from '../../client/derive.svelte';
  import { house } from '../../core/house';
  import { home } from '../../client/store.svelte';

  // «Минимализм» — лист спецификации. Время крупно, дом — белый макет из картона с выносками,
  // этажи — пронумерованный указатель, цифры дома — таблица. Один акцент на всю страницу.
  const S = new DomScene({ look: 'clay' });
  S.zoomFirst = false;
  let host: HTMLDivElement, canvas: HTMLCanvasElement;
  onMount(() => S.attach(host, canvas));
  let now = $state(new Date());
  onMount(() => { const t = setInterval(() => (now = new Date()), 15000); return () => clearInterval(t); });
  const hh = $derived(String(now.getHours()).padStart(2, '0')), mm = $derived(String(now.getMinutes()).padStart(2, '0'));
  const date = $derived(now.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' }));
  const x = $derived(stats());
  const nn = (n: number) => String(n).padStart(2, '0');
  const floorsTop = [...fl].reverse();
  const perFloor = (id: number) => house.rooms.filter(r => (r.floor ?? 1) === id);
</script>

<div class="m {theme.profile}">
  <section class="txt">
    <header class="rise">
      <div class="clock num" aria-label="Время {hh}:{mm}">{hh}<span class="col">:</span>{mm}</div>
      <span class="date">{date} · {house.name}</span>
    </header>

    <dl class="spec rise">
      <div><dt>Люди</dt><dd class="num">{nn(x.people)}</dd></div>
      <div><dt>Свет, комн.</dt><dd class="num">{nn(x.lit)}<small>/{x.rooms}</small></dd></div>
      <div><dt>Внутри</dt><dd class="num">{x.inside !== undefined ? fmtT(x.inside) : '—'}°</dd></div>
      <div><dt>Снаружи</dt><dd class="num">{x.outside !== undefined ? fmtT(x.outside) : '—'}°</dd></div>
      <div class="wide"><dt>Охрана</dt><dd class="w" class:acc={x.sec !== 'disarmed'}>{x.secName}</dd></div>
    </dl>

    <nav class="lays" aria-label="Слои">
      {#each layers as l, i (l.id)}<button class:on={S.layer === l.id} aria-pressed={S.layer === l.id} onclick={() => S.setLayer(l.id)}><span class="num">{i + 1}</span>{l.name}</button>{/each}
    </nav>
  </section>

  <figure class="fig">
    <div class="stage" bind:this={host}>
      <canvas bind:this={canvas} onpointerdown={S.pd} onpointermove={S.pm} onpointerup={S.pu} aria-label="Макет дома: тап по комнате — открыть, потяните вбок — повернуть"></canvas>
      {#each S.labels as l (l.id)}
        <button class="co {l.v?.k ?? ''}" style="left:{l.x}px; top:{l.y}px" onclick={() => go('room', l.r.id)}>
          <span class="ln" aria-hidden="true"></span><b>{l.r.name}</b>{#if l.v}<i>{l.v.t}</i>{/if}
        </button>
      {/each}
    </div>
    <figcaption><span>Рис. 1</span>{S.focus === null ? 'Дом целиком, аксонометрия' : `${S.focus} этаж, план сверху`}</figcaption>
  </figure>

  {#if fl.length > 1}
    <ol class="index">
      <li><button class:on={S.focus === null} onclick={() => (S.focus = null)}><span class="num">00</span><b>Весь дом</b><i>{x.rooms} помещ.</i></button></li>
      {#each floorsTop as f (f.id)}
        {@const rs = perFloor(f.id)}
        {@const act = rs.filter(r => value(r.id, S.layer)).length}
        <li><button class:on={S.focus === f.id} onclick={() => (S.focus = S.focus === f.id ? null : f.id)}>
          <span class="num">{nn(f.id)}</span><b>{f.name}</b><i>{act ? `${act} из ${rs.length}` : `${rs.length} помещ.`}</i>
        </button></li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .m { display: flex; flex-direction: column; gap: 22px; padding: max(22px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 24px max(16px, env(safe-area-inset-left, 0px)); }
  .m.tablet { display: grid; grid-template-columns: 340px minmax(0, 1fr); grid-template-rows: auto 1fr; gap: 28px 40px; padding: 32px 40px; height: var(--screen-h); box-sizing: border-box; }
  .tablet .txt { grid-column: 1; grid-row: 1; display: flex; flex-direction: column; gap: 28px; }
  .tablet .fig { grid-column: 2; grid-row: 1 / 3; min-height: 0; }
  .tablet .index { grid-column: 1; grid-row: 2; align-self: end; }
  .txt { display: flex; flex-direction: column; gap: 22px; }
  .clock { font: 500 112px/.85 var(--font-display); letter-spacing: -.07em; }
  .tablet .clock { font-size: 132px; }
  .col { color: var(--accent); animation: tick 2s steps(1) infinite; }
  @keyframes tick { 50% { opacity: .2; } }
  .date { display: block; margin-top: 10px; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .spec { margin: 0; display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--text); }
  .spec div { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .spec div:nth-child(odd):not(.wide) { padding-right: 14px; border-right: 1px solid var(--border); }
  .spec div:nth-child(even) { padding-left: 14px; }
  .spec .wide { grid-column: 1 / -1; padding-left: 0 !important; }
  dt { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  dd { margin: 0; font-size: 20px; } dd small { font-size: 12px; color: var(--muted); } dd.w { font: 600 12px var(--font-ui); letter-spacing: .12em; text-transform: uppercase; } dd.acc { color: var(--accent); }
  .lays { display: flex; flex-wrap: wrap; gap: 4px 18px; }
  .lays button { border: 0; background: none; padding: 6px 0; color: var(--muted); font: 600 12px var(--font-ui); letter-spacing: .12em; text-transform: uppercase; border-bottom: 1px solid transparent; display: flex; gap: 6px; }
  .lays .num { font-weight: 400; }
  .lays button.on { color: var(--text); border-bottom-color: var(--accent); }
  .fig { margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .stage { position: relative; height: 380px; margin: 0 -16px; overflow: hidden; touch-action: pan-y; }
  .tablet .stage { flex: 1; height: auto; margin: 0; border: 1px solid var(--border); }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: grab; }
  figcaption { display: flex; gap: 12px; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); border-top: 1px solid var(--border); padding-top: 8px; }
  figcaption span { color: var(--text); }
  /* выноска: точка на комнате, тонкая линия вверх, подпись капителью */
  .co { position: absolute; transform: translate(-1px, calc(-100% - 2px)); display: flex; flex-direction: column; align-items: flex-start; padding: 0 0 26px 8px; border: 0; background: none; color: var(--text); text-align: left; white-space: nowrap; }
  .co::after { content: ""; position: absolute; left: -2px; bottom: -3px; width: 5px; height: 5px; background: var(--text); }
  .ln { position: absolute; left: 0; bottom: 0; width: 1px; height: calc(100% - 4px); background: var(--text); opacity: .7; }
  .co b { font: 600 10.5px var(--font-ui); letter-spacing: .1em; text-transform: uppercase; }
  .co i { font: 400 11px var(--font-num); font-style: normal; color: var(--muted); }
  .co.warm::after, .co.alert::after, .co.media::after { background: var(--accent); } .co.warm i, .co.alert i { color: var(--accent); }
  .index { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--text); }
  .index li { border-bottom: 1px solid var(--border); }
  .index button { width: 100%; display: grid; grid-template-columns: 34px 1fr auto; align-items: baseline; gap: 10px; padding: 12px 0; border: 0; background: none; color: var(--text); text-align: left; }
  .index .num { font-size: 12px; color: var(--muted); }
  .index b { font: 500 22px/1 var(--font-display); letter-spacing: -.03em; }
  .index i { font-style: normal; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
  .index button.on b, .index button.on .num { color: var(--accent); }
  @media (prefers-reduced-motion: reduce) { .col { animation: none; } }
</style>
