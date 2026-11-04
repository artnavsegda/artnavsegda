<script lang="ts">
  import { house } from '../core/house';
  import { home, dev, cmd } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { roomLight, people, roomTemp, fmtT } from '../client/derive.svelte';

  // Архитектурный план этажа: стены, проёмы, мебель — статика из редактора плана;
  // свечение комнат, присутствие и маркеры устройств — живые из состояния.
  let { selected = '', onselect, compact = false }: { selected?: string; onselect: (room: string) => void; compact?: boolean } = $props();

  const WALK = 'M262 392 L330 392 L496 392 Q512 392 512 376 L512 300 L470 266';
  let walkPath: SVGPathElement;
  let len = 0;
  const wpos = $derived.by(() => {
    const w = home.s?.walker;
    if (!w || !walkPath) return null;
    len ||= walkPath.getTotalLength();
    const p = walkPath.getPointAtLength(w.t * len);
    return { x: p.x, y: p.y };
  });
  const glow = $derived(theme.t.features.planGlow);
  const lights = house.devices.filter(d => d.plan && d.caps.includes('dimmer'));
  const others = house.devices.filter(d => d.plan && !d.caps.includes('dimmer'));
  const markerIcon = (caps: string[]) => caps.includes('shade') ? 'M-5 -5h10M-4 -5v8M4 -5v8' : caps.includes('climate') ? 'M0 -6v8M-3 4a3 3 0 106 0' : caps.includes('media') ? 'M-6 -4h12v7h-12zM-3 6h6'
    : caps.includes('vacuum') ? 'M0 -6a6 6 0 100 12a6 6 0 100-12M0 -2a2 2 0 100 4' : 'M-5 -3h10v6h-10z';
</script>

<div class="plan" class:compact class:min={!glow}>
  <svg viewBox="0 0 820 640" role="img" aria-label="План первого этажа">
    <defs>
      <radialGradient id="pg">
        <stop offset="0" style="stop-color: var(--glow); stop-opacity: var(--glow-a)" />
        <stop offset=".45" style="stop-color: var(--glow); stop-opacity: var(--glow-b)" />
        <stop offset="1" style="stop-color: var(--glow); stop-opacity: 0" />
      </radialGradient>
      <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="1.4" height="7" style="fill: var(--accent)" />
      </pattern>
      {#each house.rooms as r}
        <clipPath id="c-{r.id}"><rect x={r.rect[0]} y={r.rect[1]} width={r.rect[2]} height={r.rect[3]} /></clipPath>
      {/each}
    </defs>

    {#each house.rooms as r}
      <rect class="floor" x={r.rect[0]} y={r.rect[1]} width={r.rect[2]} height={r.rect[3]}
        style="fill: {people(r.id) || home.s?.walker?.room === r.id ? 'var(--presence-floor)' : 'var(--room-floor)'}" />
    {/each}

    {#if glow}
      <g class="glows">
        {#each house.rooms as r}
          {#if r.glowAt}
            <circle class="lvl" cx={r.glowAt[0]} cy={r.glowAt[1]} r={r.glowAt[2]} fill="url(#pg)" opacity={roomLight(r.id)} clip-path="url(#c-{r.id})" />
          {/if}
        {/each}
      </g>
    {:else}
      {#each house.rooms as r}
        <rect class="lvl" x={r.rect[0]} y={r.rect[1]} width={r.rect[2]} height={r.rect[3]} fill="url(#hatch)" opacity={roomLight(r.id) * .55} />
      {/each}
    {/if}

    <g class="furn">
      <rect x="200" y="32" width="180" height="14" rx="2" /><rect x="110" y="100" width="190" height="110" rx="4" fill="none" stroke-dasharray="4 4" />
      <rect x="150" y="130" width="110" height="50" rx="6" /><rect x="90" y="220" width="230" height="72" rx="10" /><rect x="90" y="274" width="230" height="18" rx="6" />
      <path d="M167 222v52M244 222v52" fill="none" /><rect x="350" y="120" width="56" height="60" rx="12" /><circle cx="380" cy="252" r="26" />
      <rect x="446" y="26" width="208" height="40" /><rect x="520" y="34" width="40" height="22" rx="4" />
      <circle cx="602" cy="40" r="6" /><circle cx="626" cy="40" r="6" /><circle cx="602" cy="56" r="6" /><circle cx="626" cy="56" r="6" />
      <rect x="490" y="150" width="130" height="60" rx="4" /><circle cx="515" cy="228" r="9" /><circle cx="555" cy="228" r="9" /><circle cx="595" cy="228" r="9" />
      <rect x="730" y="70" width="58" height="140" rx="3" /><circle cx="712" cy="140" r="14" /><rect x="666" y="232" width="128" height="16" />
      <rect x="600" y="330" width="90" height="18" rx="2" /><rect x="32" y="330" width="200" height="28" /><rect x="80" y="430" width="160" height="176" rx="6" />
      <rect x="92" y="574" width="64" height="24" rx="6" /><rect x="164" y="574" width="64" height="24" rx="6" /><path d="M80 520h160" fill="none" />
      <rect x="48" y="580" width="26" height="26" rx="3" /><rect x="246" y="580" width="26" height="26" rx="3" />
      <rect x="464" y="500" width="86" height="110" rx="6" /><rect x="472" y="584" width="70" height="18" rx="5" /><rect x="330" y="560" width="90" height="50" rx="3" />
      <circle cx="400" cy="512" r="34" fill="none" stroke-dasharray="4 4" /><rect x="690" y="530" width="100" height="80" rx="18" /><rect x="698" y="538" width="84" height="64" rx="14" />
      <rect x="575" y="455" width="70" height="34" rx="6" /><ellipse cx="610" cy="472" rx="18" ry="10" /><rect x="576" y="598" width="34" height="14" rx="3" /><ellipse cx="593" cy="578" rx="15" ry="19" />
    </g>
    <g class="walls">
      <rect x="14" y="14" width="792" height="12" /><rect x="14" y="614" width="792" height="12" /><rect x="14" y="14" width="12" height="612" /><rect x="794" y="14" width="12" height="612" />
      <rect x="437" y="20" width="6" height="100" /><rect x="437" y="260" width="6" height="60" /><rect x="657" y="20" width="6" height="220" /><rect x="657" y="290" width="6" height="30" />
      <rect x="20" y="317" width="330" height="6" /><rect x="410" y="317" width="70" height="6" /><rect x="540" y="317" width="160" height="6" /><rect x="750" y="317" width="50" height="6" />
      <rect x="317" y="320" width="6" height="40" /><rect x="317" y="410" width="6" height="210" /><rect x="320" y="437" width="180" height="6" /><rect x="550" y="437" width="90" height="6" />
      <rect x="690" y="437" width="110" height="6" /><rect x="557" y="440" width="6" height="180" />
    </g>
    <g class="glass">
      <rect x="80" y="14" width="120" height="12" /><rect x="260" y="14" width="120" height="12" /><rect x="490" y="14" width="120" height="12" /><rect x="690" y="14" width="80" height="12" />
      <rect x="14" y="90" width="12" height="160" /><rect x="14" y="380" width="12" height="180" /><rect x="370" y="614" width="80" height="12" /><rect x="610" y="614" width="60" height="12" />
      <rect x="794" y="80" width="12" height="180" /><rect x="794" y="480" width="12" height="80" /><rect x="794" y="355" width="12" height="50" />
    </g>
    <g class="glass-line"><path d="M80 20h120M260 20h120M490 20h120M690 20h80M370 620h80M610 620h60M20 90v160M20 380v180M800 80v180M800 480v80" /></g>
    <g class="doors">
      <path d="M350 320v60M410 320A60 60 0 0 1 350 380" /><path d="M480 320v60M540 320A60 60 0 0 1 480 380" /><path d="M700 320v50M750 320A50 50 0 0 1 700 370" />
      <path d="M320 360h-50M320 410A50 50 0 0 1 270 360" /><path d="M500 440v50M550 440A50 50 0 0 1 500 490" /><path d="M640 440v50M690 440A50 50 0 0 1 640 490" />
      <path d="M800 355h-50M800 405A50 50 0 0 1 750 355" stroke-width="2" />
    </g>

    {#each house.rooms as r}
      <rect class="hit" class:sel={selected === r.id} x={r.rect[0] + 3} y={r.rect[1] + 3} width={r.rect[2] - 6} height={r.rect[3] - 6}
        role="button" tabindex="0" aria-label={r.name} onclick={() => onselect(r.id)} onkeydown={(e) => e.key === 'Enter' && onselect(r.id)} />
    {/each}

    <path bind:this={walkPath} d={WALK} class="trail" class:on={!!home.s?.walker} />

    {#each others as d}
      <g class="mk other" transform="translate({d.plan![0]} {d.plan![1]})" aria-hidden="true">
        <circle r="11" /><path d={markerIcon(d.caps)} />
      </g>
    {/each}
    {#each lights as d}
      {@const on = (dev(d.id).level ?? 0) > 0}
      <g class="mk light" class:on transform="translate({d.plan![0]} {d.plan![1]})" role="button" tabindex="0" aria-label="{d.name}: {on ? 'выключить' : 'включить'}"
        onclick={(e) => { e.stopPropagation(); cmd({ cmd: 'light.set', target: d.id, on: !on }); }}
        onkeydown={(e) => e.key === 'Enter' && cmd({ cmd: 'light.set', target: d.id, on: !on })}>
        <circle class="halo" r="22" /><circle class="b" r="9" />
      </g>
    {/each}

    {#if wpos}
      <g class="walker" transform="translate({wpos.x} {wpos.y})"><circle class="wp" r="9" /><circle class="wc" r="6.5" /></g>
    {/if}
  </svg>

  {#each house.rooms as r}
    {@const t = roomTemp(r.id)}
    {@const n = people(r.id)}
    <button class="lab" class:sel={selected === r.id} style="left:{r.labelAt[0] / 8.2}%; top:{r.labelAt[1] / 6.4}%" onclick={() => onselect(r.id)}>
      <b>{r.name}</b>
      {#if !compact}<span class="num">{t !== undefined ? fmtT(t) + '°' : r.area + ' м²'}{n ? ` · ${n} чел.` : ''}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .plan { position: relative; width: 100%; aspect-ratio: 820 / 640; }
  svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .floor { transition: fill 1.2s var(--ease-light); }
  .lvl { transition: opacity 2.2s var(--ease-light); }
  .glows { animation: breathe 6s ease-in-out infinite; }
  .furn { fill: var(--furn-fill); stroke: var(--furn); stroke-width: 1.4; }
  .walls { fill: var(--wall); }
  .glass { fill: var(--paper); stroke: var(--furn); stroke-width: 1.2; }
  .glass-line { stroke: var(--furn); stroke-width: 1; fill: none; }
  .doors { stroke: var(--door); stroke-width: 1.4; fill: none; }
  .hit { fill: transparent; stroke: transparent; stroke-width: 2; cursor: pointer; rx: 6; transition: stroke var(--dur-m); outline: none; }
  .hit:hover { stroke: var(--border-strong); }
  .hit.sel, .hit:focus-visible { stroke: var(--accent); stroke-dasharray: 6 5; }
  .trail { fill: none; stroke: var(--cool); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 2 10; opacity: 0; transition: opacity 1s; animation: march 1.2s linear infinite; pointer-events: none; }
  .trail.on { opacity: .55; }
  @keyframes march { to { stroke-dashoffset: -24; } }
  .mk { cursor: pointer; outline: none; }
  .mk.other { cursor: default; pointer-events: none; }
  .mk.other circle { fill: var(--paper); stroke: var(--furn); }
  .mk.other path { fill: none; stroke: var(--muted); stroke-width: 1.4; }
  .mk .b { fill: var(--paper); stroke: var(--muted); stroke-width: 2; transition: fill .6s var(--ease-light), stroke .6s, r .6s var(--spring); }
  .mk .halo { fill: transparent; }
  .mk.on .b { fill: #FFD08A; stroke: #fff; }
  .mk.on .halo { fill: rgba(255,190,110,.18); }
  .mk:focus-visible .b { stroke: var(--accent); stroke-width: 3; }
  .walker .wc { fill: var(--cool); filter: drop-shadow(0 0 6px var(--cool)); }
  .walker .wp { fill: var(--cool-soft); transform-box: fill-box; transform-origin: center; animation: pulse 2.4s var(--ease-out) infinite; }

  .lab { position: absolute; transform: translateY(-2px); display: flex; flex-direction: column; align-items: flex-start; gap: 0; padding: 5px 9px; border: 0; border-radius: 10px;
    background: var(--label-bg); color: var(--text); text-align: left; font-size: clamp(11px, 1.3vw, 14px); line-height: 1.25; transition: box-shadow var(--dur-m); }
  .lab b { font-weight: 600; }
  .lab span { font-size: .86em; color: var(--muted); }
  .lab.sel { box-shadow: 0 0 0 1.5px var(--accent); }
  .compact .lab { padding: 3px 6px; font-size: 10px; }

  .min .mk .b { rx: 0; }
  .min .mk.on .b { fill: var(--accent); stroke: var(--accent); }
  .min .mk.on .halo { fill: transparent; }
  .min .lab { border-radius: 0; text-transform: uppercase; letter-spacing: .08em; font-size: clamp(9px, 1vw, 11px); background: transparent; padding: 2px 4px; }
  .min .lab b { font-weight: 700; }
  .min .lab span { font-family: var(--font-num); letter-spacing: 0; }
  .min .walls { fill: var(--wall); }
</style>
