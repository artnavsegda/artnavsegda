<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import { S, ui, engine, openZone, setPref, profile, hash } from './state.svelte';
  import type { MediaZone } from '../../model/media/types.ts';

  // Дом в разрезе: этажи сверху вниз, помещения — ячейки. Где что играет, видно сразу:
  // ячейка окрашена обложкой, зоны одной музыки обведены одним цветом. Тап — открыть зону.
  const section = engine.cfg.section!;
  const zonesOn = (f: string) => engine.cfg.zones.filter(z => z.floor === f).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  type Cell = { kind: 'room'; space: string; zones: MediaZone[]; span: number } | { kind: 'other'; name: string; span: number };
  const rows = section.floors.map(f => {
    const cells: Cell[] = [];
    for (const z of zonesOn(f.id)) {
      const c = cells.find(c => c.kind === 'room' && c.space === z.space) as Extract<Cell, { kind: 'room' }> | undefined;
      if (c) { c.zones.push(z); c.span += z.span ?? 1; } else cells.push({ kind: 'room', space: z.space, zones: [z], span: z.span ?? 1 });
    }
    for (const o of f.others ?? []) cells.push({ kind: 'other', name: o.name, span: o.span });
    return { ...f, cells, cols: cells.map(c => `${c.span}fr`).join(' ') };
  });
  const roomName: Record<string, string> = { living: 'Гостиная' };

  const pick = (id: string) => (profile() === 'phone' ? openZone(id) : setPref('zone', id));
  const view = (id: string) => {
    const st = S.zone[id];
    const ses = st.session;
    const src = ses ? S.src[ses.source] : undefined;
    const group = src && src.zones.length > 1 ? hash(ses!.source) % 360 : null;
    return { st, ses, src, c: src?.content, group, hue: src?.content ? hash(src.content.art) % 360 : 0 };
  };
  const playingCount = $derived(Object.values(S.zone).filter(z => z.session).length);
</script>

<div class="sec" aria-label="Дом в разрезе: выберите зону">
  <svg class="roof" viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true"><path d="M2 14 L50 1 L98 14" /></svg>
  {#each rows as f (f.id)}
    <div class="floor">
      <span class="fl num" aria-hidden="true">{f.name}</span>
      <div class="cells" style="grid-template-columns:{f.cols}">
        {#each f.cells as cell}
          {#if cell.kind === 'other'}
            <div class="cell other"><span class="nm">{cell.name}</span></div>
          {:else}
            <div class="room" class:split={cell.zones.length > 1}>
              {#if cell.zones.length > 1}<span class="rn">{roomName[cell.space] ?? ''}</span>{/if}
              <div class="zs">
                {#each cell.zones as z (z.id)}
                  {@const v = view(z.id)}
                  <button class="cell" class:on={!!v.ses} class:busy={!!v.st.plan} class:sel={ui.zone === z.id && profile() === 'tablet'}
                    style="--hue:{v.hue}; {v.group !== null ? `--ring:hsl(${v.group} 75% 62%)` : ''}" class:ring={v.group !== null}
                    aria-label="{z.name}: {v.st.plan ? 'включается' : v.c ? v.c.title : 'выключено'}" onclick={() => pick(z.id)}>
                    <span class="top">
                      <Icon name={z.display ? (z.display === 'pj' ? 'ar' : 'media') : 'speaker'} size={14} />
                      <span class="nm">{z.name}</span>
                    </span>
                    {#if v.st.plan}
                      <span class="what num">{Math.max(0, Math.ceil(v.st.plan.total - v.st.plan.elapsed))} с</span>
                      <span class="pr"><span style="width:{(v.st.plan.elapsed / v.st.plan.total) * 100}%"></span></span>
                    {:else if v.c}
                      <span class="what">{v.c.title}</span>
                      {#if v.src?.playing}<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>{/if}
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/each}
  <div class="ground" aria-hidden="true"></div>
  <p class="cap">{playingCount ? `Играет в ${playingCount} ${playingCount === 1 ? 'зоне' : 'зонах'} · одна рамка — одна музыка на несколько зон` : 'Всё выключено. Нажмите на комнату'}</p>
</div>

<style>
  .sec { display: flex; flex-direction: column; gap: 0; }
  .roof { width: calc(100% - 26px); margin-left: 26px; height: 34px; display: block; }
  .roof path { fill: var(--surface); stroke: var(--border-strong); stroke-width: .6; vector-effect: non-scaling-stroke; }
  .floor { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 4px; align-items: stretch; }
  .fl { align-self: center; font-size: 12px; color: var(--muted); text-align: center; }
  .cells { display: grid; gap: 4px; padding: 4px; border-left: 2px solid var(--border-strong); border-right: 2px solid var(--border-strong); border-top: 1px solid var(--border); min-height: 92px; }
  .room { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .room.split { border: 1px dashed var(--border-strong); border-radius: var(--r-sm); padding: 3px; }
  .rn { font-size: 10.5px; color: var(--muted); padding: 0 4px; }
  .zs { flex: 1; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 3px; }
  .cell { position: relative; min-width: 0; min-height: 84px; display: flex; flex-direction: column; justify-content: space-between; gap: 4px; padding: 8px; border-radius: var(--r-sm);
    border: 1px solid var(--border); background: var(--surface); color: var(--sub); text-align: left; font: inherit; overflow: hidden; }
  .split .cell { min-height: 70px; }
  .cell.other { background: repeating-linear-gradient(135deg, transparent 0 6px, var(--surface) 6px 7px); color: var(--muted); border-style: dashed; justify-content: flex-end; }
  button.cell { cursor: pointer; }
  button.cell:hover { border-color: var(--border-strong); }
  .cell.on { color: #F6F2EC; border-color: transparent; background: linear-gradient(150deg, hsl(var(--hue) 45% 34%), hsl(calc(var(--hue) + 50) 50% 16%)); }
  .cell.busy { color: var(--text); border-color: var(--accent-border); background: var(--accent-soft); }
  .cell.ring { box-shadow: inset 0 0 0 2px var(--ring); }
  .cell.sel { outline: 2px solid var(--accent); outline-offset: 2px; }
  .top { display: flex; align-items: center; gap: 5px; min-width: 0; }
  .nm { font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .what { font-size: 12px; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pr { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--border); }
  .pr span { display: block; height: 100%; background: var(--accent); transition: width .25s linear; }
  .eq { position: absolute; right: 8px; bottom: 9px; display: flex; gap: 2px; align-items: flex-end; height: 12px; }
  .eq i { width: 3px; background: currentColor; border-radius: 1px; animation: eq .9s ease-in-out infinite alternate; }
  .eq i:nth-child(2) { animation-delay: -.3s; } .eq i:nth-child(3) { animation-delay: -.6s; }
  @keyframes eq { from { height: 3px; } to { height: 12px; } }
  @media (prefers-reduced-motion: reduce) { .eq i { animation: none; height: 8px; } }
  .ground { height: 6px; margin-left: 26px; border-radius: 3px; background: var(--border-strong); }
  .cap { margin: 10px 0 0 26px; font-size: 12.5px; color: var(--muted); }
  :global([data-trend="minimal"]) .cell, :global([data-trend="minimal"]) .room.split { border-radius: 0; }
</style>
