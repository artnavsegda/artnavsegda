<script lang="ts">
  import { onMount } from 'svelte';
  import { DomScene, layers, fl, value, stats } from '../../client/domscene.svelte';
  import { theme } from '../../client/theme.svelte';
  import { go } from '../../client/router.svelte';
  import { greeting, fmtT } from '../../client/derive.svelte';
  import { house } from '../../core/house';

  // «Брутализм» — плакат. Цифры дома — огромные в клетках, дом — «РИС. 1» в рамке с линейками и растром,
  // этажи — квадратные кнопки, слои — ссылки в скобках, живые комнаты — сырой список ссылок.
  const S = new DomScene();
  let host: HTMLDivElement, canvas: HTMLCanvasElement;
  onMount(() => S.attach(host, canvas));
  const x = $derived(stats());
  const live = $derived(house.rooms.map(r => ({ r, v: value(r.id, S.layer) })).filter(a => a.v));
  const nn = (n: number) => String(n).padStart(2, '0');
</script>

<div class="b {theme.profile}">
  <h1 class="rise">{greeting()}</h1>

  <div class="stats">
    <div class="st"><span>Люди</span><b class="num">{x.people}</b></div>
    <div class="st hl"><span>Свет</span><b class="num">{x.lit}</b><i>/{x.rooms}</i></div>
    <div class="st"><span>Снаружи</span><b class="num">{x.outside !== undefined ? fmtT(x.outside) : '—'}°</b></div>
    <button class="st" class:alarm={x.sec !== 'disarmed'} onclick={() => go('security')}><span>Охрана →</span><b class="wd">{x.secName}</b></button>
  </div>

  <figure class="fig">
    <div class="cap"><b>РИС. 1</b><span>{S.focus === null ? 'ДОМ, РАЗРЕЗ' : `ЭТАЖ ${S.focus}`} / {house.name.toUpperCase()}</span></div>
    <div class="stage" bind:this={host}>
      <canvas bind:this={canvas} onpointerdown={S.pd} onpointermove={S.pm} onpointerup={S.pu} aria-label="Дом: тап по этажу или комнате, потяните вбок — повернуть"></canvas>
      {#each S.labels as l (l.id)}
        <button class="lb {l.v?.k ?? ''}" style="left:{l.x}px; top:{l.y}px" onclick={() => go('room', l.r.id)}>{l.r.name}{#if l.v}<i>{l.v.t}</i>{/if}</button>
      {/each}
      <span class="rul x" aria-hidden="true"></span><span class="rul y" aria-hidden="true"></span>
    </div>
    <div class="ctl">
      {#if fl.length > 1}
        <div class="fls" role="tablist" aria-label="Этажи">
          <button role="tab" aria-selected={S.focus === null} class:on={S.focus === null} onclick={() => (S.focus = null)}>ВСЁ</button>
          {#each [...fl].reverse() as f (f.id)}<button role="tab" aria-selected={S.focus === f.id} class:on={S.focus === f.id} aria-label={f.name} onclick={() => (S.focus = f.id)}>{f.id}</button>{/each}
        </div>
      {/if}
    </div>
  </figure>

  <nav class="lays" aria-label="Слои">
    {#each layers as l (l.id)}<button class:on={S.layer === l.id} aria-pressed={S.layer === l.id} onclick={() => S.setLayer(l.id)}>[{S.layer === l.id ? 'x' : ' '}] {l.name}</button>{/each}
  </nav>

  <section class="list">
    <h2>{nn(live.length)} / ЖИВЫЕ КОМНАТЫ</h2>
    <ul>
      {#each live as a (a.r.id)}
        <li><a href="#room-{a.r.id}" onclick={(e) => { e.preventDefault(); go('room', a.r.id); }}><span class="nm">→ {a.r.name}</span><span class="fill" aria-hidden="true"></span><span class="v {a.v!.k}">{a.v!.t}</span></a></li>
      {:else}<li class="none">ПУСТО. ДОМ СПИТ.</li>{/each}
    </ul>
  </section>
</div>

<style>
  .b { display: flex; flex-direction: column; gap: 16px; padding: 16px max(14px, env(safe-area-inset-right, 0px)) 28px max(14px, env(safe-area-inset-left, 0px)); }
  .b.tablet { display: grid; grid-template-columns: 360px minmax(0, 1fr); grid-template-rows: auto auto auto 1fr; gap: 18px 24px; padding: 24px 28px; height: calc(var(--screen-h) - 30px); box-sizing: border-box; overflow: hidden; }
  .tablet h1 { grid-column: 1 / -1; }
  .tablet .stats { grid-column: 1; }
  .tablet .fig { grid-column: 2; grid-row: 2 / 5; min-height: 0; }
  .tablet .lays { grid-column: 1; } .tablet .list { grid-column: 1; overflow: auto; min-height: 0; }
  h1 { margin: 0; }
  .stats { display: grid; grid-template-columns: 1fr 1fr; border: 2px solid var(--border); box-shadow: var(--hard); background: var(--surface); }
  .st { position: relative; display: flex; flex-direction: column; justify-content: space-between; min-height: 112px; padding: 8px 10px; border: 0; border-right: 2px solid var(--border); border-bottom: 2px solid var(--border); background: none; color: var(--text); text-align: left; font: inherit; }
  .st:nth-child(2n) { border-right: 0; } .st:nth-child(n+3) { border-bottom: 0; }
  .st span { font: 600 11px var(--font-ui); text-transform: uppercase; }
  .st b { font: 900 58px/.9 var(--font-display); letter-spacing: -.06em; }
  .st b.wd { font-size: 22px; letter-spacing: -.03em; text-transform: uppercase; }
  .st i { position: absolute; right: 10px; bottom: 10px; font: 600 13px var(--font-ui); font-style: normal; }
  .st.hl { background: var(--accent); color: var(--on-accent); }
  .st.alarm { background: var(--inv-bg); color: var(--inv-text); }
  .fig { margin: 0; display: flex; flex-direction: column; border: 2px solid var(--border); box-shadow: var(--hard); background: var(--surface); }
  .cap { display: flex; gap: 10px; align-items: center; height: 30px; padding: 0 8px; border-bottom: 2px solid var(--border); font: 600 11px var(--font-ui); text-transform: uppercase; white-space: nowrap; overflow: hidden; }
  .cap b { background: var(--text); color: var(--bg); padding: 2px 6px; }
  .stage { position: relative; height: 400px; overflow: hidden; touch-action: pan-y; }
  .tablet .stage { flex: 1; height: auto; }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: crosshair; }
  .rul { position: absolute; pointer-events: none; opacity: .6; }
  .rul.x { left: 0; right: 0; top: 0; height: 10px; background: repeating-linear-gradient(90deg, var(--text) 0 1px, transparent 1px 10px), repeating-linear-gradient(90deg, var(--text) 0 2px, transparent 2px 50px); background-size: auto 6px, auto 10px; background-repeat: repeat-x; }
  .rul.y { top: 0; bottom: 0; left: 0; width: 10px; background: repeating-linear-gradient(0deg, var(--text) 0 1px, transparent 1px 10px), repeating-linear-gradient(0deg, var(--text) 0 2px, transparent 2px 50px); background-size: 6px auto, 10px auto; background-repeat: repeat-y; }
  .lb { position: absolute; transform: translate(-50%, -100%); display: flex; flex-direction: column; padding: 2px 6px; border: 2px solid var(--border); background: var(--surface); color: var(--text); font: 600 10.5px/1.2 var(--font-ui); text-transform: uppercase; white-space: nowrap; box-shadow: 2px 2px 0 var(--border); }
  .lb i { font-style: normal; font-weight: 400; }
  .lb.warm, .lb.media { background: var(--accent); color: var(--on-accent); } .lb.alert { background: var(--danger); color: #fff; }
  .ctl { border-top: 2px solid var(--border); }
  .fls { display: flex; }
  .fls button { flex: 1; height: 54px; border: 0; border-right: 2px solid var(--border); background: none; color: var(--text); font: 900 22px var(--font-display); }
  .fls button:last-child { border-right: 0; }
  .fls button.on { background: var(--text); color: var(--bg); }
  .lays { display: flex; flex-wrap: wrap; gap: 4px 14px; }
  .lays button { border: 0; background: none; padding: 4px 0; color: var(--text); font: 600 13px var(--font-ui); text-transform: uppercase; white-space: pre; }
  .lays button.on { background: var(--accent); color: var(--on-accent); }
  .list h2 { margin: 0 0 6px; font-size: 20px; }
  .list ul { list-style: none; margin: 0; padding: 0; border-top: 2px solid var(--border); }
  .list li { border-bottom: 2px solid var(--border); }
  .list a { display: flex; align-items: baseline; gap: 8px; padding: 10px 0; color: var(--text); text-decoration: none; font: 600 14px var(--font-ui); text-transform: uppercase; }
  .list a:hover .nm { text-decoration: underline; background: var(--accent); color: var(--on-accent); }
  .nm { color: var(--link); text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; }
  .fill { flex: 1; border-bottom: 2px dotted var(--muted); transform: translateY(-4px); }
  .v { font-weight: 400; white-space: nowrap; } .v.alert { color: var(--danger); font-weight: 600; }
  .none { padding: 12px 0; font: 600 14px var(--font-ui); }
</style>
