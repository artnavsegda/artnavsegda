<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Cell from './Cell.svelte';
  import Mini from './Mini.svelte';
  import Sheet from './Sheet.svelte';
  import Diorama from './Diorama.svelte';
  import Hero from './Hero.svelte';
  import { S, P, layers, floors, stairs, rooms, roomById, summary, lightsOn, anyAlert, type Room } from './data.svelte';
  import { ui, profile, setPref, applyTheme } from './ui.svelte';

  // Главный экран — дом в разрезе. Функции — слои поверх него, комната — лист поверх дома.
  applyTheme();
  const prof = $derived(profile());
  const framed = $derived(ui.frame === 'phone' && ui.width >= 600);
  const here = 'z-living';
  const floor = $derived(floors.find(f => f.id === ui.floor)!);
  const idx = $derived(floors.findIndex(f => f.id === ui.floor));

  // Этаж на телефоне: комнаты укладываются в ряды по весу (крупные — шире), без прокрутки вбок
  function pack(rs: Room[]) {
    const rows: { rooms: Room[]; w: number }[] = [];
    for (const r of [...rs].sort((a, b) => b.weight - a.weight)) {
      const row = rows.find(x => x.w + r.weight <= 4.3);
      if (row) { row.rooms.push(r); row.w += r.weight; } else rows.push({ rooms: [r], w: r.weight });
    }
    return rows.map(x => ({ ...x, h: 92 + Math.max(...x.rooms.map(r => r.weight)) * 14 }));
  }
  const packed = $derived(pack(floor.rooms));

  // «Сейчас»: что происходит по текущему слою во всём доме
  const floorShort = (id: string) => ({ f0: 'цоколь', f1: '1 эт.', f2: '2 эт.', f3: '3 эт.', site: 'участок' } as Record<string, string>)[id];
  const active = $derived.by(() => {
    const L = ui.layer;
    const pick = (fn: (r: Room) => string | false) => rooms.flatMap(r => { const v = fn(r); return v ? [{ r, v }] : []; });
    if (L === 'light') return pick(r => lightsOn(r) > 0 && `${lightsOn(r)} из ${r.lights.length}`);
    if (L === 'climate') return pick(r => { const t = S.temp[r.id]; return !!t && Math.abs(t.cur - t.target) > 0.6 && `${t.cur.toFixed(1).replace('.', ',')}° → ${t.target}°`; });
    if (L === 'media') return pick(r => !!S.media[r.id] && S.media[r.id]!.title);
    if (L === 'security') return pick(r => (anyAlert(r) ? 'окно открыто' : !!S.sec[r.id]?.motion && 'движение'));
    return pick(r => (anyAlert(r) ? 'окно открыто' : S.media[r.id] ? S.media[r.id]!.title : !!S.people[r.id] && `здесь ${S.people[r.id]}`));
  });
  function open(r: Room) { if (prof === 'phone' && r.kind !== 'stairs') ui.floor = r.floor; ui.room = r.id; }
  function allOff() {
    if (ui.layer === 'light') for (const k in S.light) S.light[k] = 0;
    if (ui.layer === 'media') for (const k in S.media) S.media[k] = null;
  }
  const armNames = { off: 'Снята', perimeter: 'Периметр', full: 'Полная' } as const;
  const now = new Date();
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const aboveCount = floors.filter(f => f.id !== 'f0' && f.id !== 'site').length;
</script>

{#snippet nowList()}
  <section class="now" aria-label="Сейчас в доме">
    <h2 class="sh">{ui.layer === 'security' ? 'Охрана' : 'Сейчас в доме'}</h2>
    {#if ui.layer === 'security'}
      <div class="arm" role="radiogroup" aria-label="Режим охраны">
        {#each Object.entries(armNames) as [k, n]}
          <button role="radio" aria-checked={S.armed === k} class:on={S.armed === k} onclick={() => (S.armed = k as typeof S.armed)}>{n}</button>
        {/each}
      </div>
    {/if}
    {#if active.length}
      <div class="chips">
        {#each active as a (a.r.id)}
          <button class="chip press" class:red={a.v === 'окно открыто'} onclick={() => open(a.r)}>
            <b>{a.r.name}</b><i>{floorShort(a.r.floor)} · {a.v}</i>
          </button>
        {/each}
      </div>
    {:else}
      <p class="quiet">{ui.layer === 'light' ? 'Свет везде выключен' : ui.layer === 'media' ? 'Нигде не играет' : ui.layer === 'climate' ? 'Все комнаты держат уставку' : 'Тихо'}</p>
    {/if}
    {#if (ui.layer === 'light' || ui.layer === 'media') && active.length}
      <button class="alloff press" onclick={allOff}><Icon name="power" size={16} />{ui.layer === 'light' ? 'Выключить весь свет' : 'Выключить всю музыку'}</button>
    {/if}
  </section>
{/snippet}

{#snippet focusBar()}
  <div class="fbar" role="tablist" aria-label="Этажи">
    <button role="tab" aria-selected={!ui.focus} class:on={!ui.focus} onclick={() => (ui.focus = null)}>Весь дом</button>
    {#each [['f3', '3'], ['f2', '2'], ['f1', '1'], ['f0', 'Ц']] as [id, n]}
      <button role="tab" aria-selected={ui.focus === id} class:on={ui.focus === id} aria-label={id === 'f0' ? 'Цоколь' : `${n} этаж`} onclick={() => (ui.focus = id)}>{n}</button>
    {/each}
    <span class="hint">{ui.focus ? 'тап по комнате — открыть' : 'тап по этажу · потяните вбок — повернуть'}</span>
  </div>
{/snippet}

{#snippet layerBar()}
  <nav class="layers" aria-label="Слои">
    {#each layers as l (l.id)}
      <button class:on={ui.layer === l.id} aria-pressed={ui.layer === l.id} onclick={() => setPref('layer', l.id)}>
        <Icon name={l.icon} size={20} /><span>{l.name}</span>
      </button>
    {/each}
  </nav>
{/snippet}

<div class="shell {prof}" class:framed>
  <div class="device">
    <div class="scroll">
      <header class="top">
        <div class="tt">
          <span class="clock num">{clock}</span>
          <h1>Дом на Липовой</h1>
          <p class="sum">{summary(ui.layer)}</p>
        </div>
        <div class="prefs" role="group" aria-label="Настройки показа">
          <button class="pp press" onclick={() => setPref('view', ui.view === '3d' ? 'scheme' : '3d')}>{ui.view === '3d' ? 'Схема' : '3D'}</button>
          <button class="pp press" onclick={() => setPref('trend', ui.trend === 'warm' ? 'minimal' : 'warm')}>{ui.trend === 'warm' ? 'Тёплый' : 'Минимал'}</button>
          <button class="pp press" aria-label="День или ночь" onclick={() => setPref('mode', ui.mode === 'night' ? 'day' : 'night')}><Icon name={ui.mode === 'night' ? 'moon' : 'sun'} size={16} /></button>
          {#if ui.width >= 600}<button class="pp press" onclick={() => setPref('frame', ui.frame === 'phone' ? 'auto' : 'phone')}>{ui.frame === 'phone' ? 'iPad' : 'Телефон'}</button>{/if}
        </div>
      </header>

      {#if prof === 'phone' && ui.view === '3d'}
        {@render focusBar()}
        <div class="d3"><Diorama layer={ui.layer} /></div>
        {@render nowList()}
      {:else if prof === 'phone'}
        <div class="fhead">
          <div class="fname">
            <h2>{floor.name}</h2><span class="fsub">{floor.rooms.length} {floor.rooms.length === 1 ? 'помещение' : floor.rooms.length < 5 ? 'помещения' : 'помещений'}{floor.id === 'f1' ? ' · вы здесь' : ''}</span>
            <span class="arrs">
              <button class="arr press" aria-label="Этаж выше" disabled={idx <= 0} onclick={() => (ui.floor = floors[idx - 1].id)}><Icon name="up" size={18} /></button>
              <button class="arr press" aria-label="Этаж ниже" disabled={idx >= floors.length - 1} onclick={() => (ui.floor = floors[idx + 1].id)}><Icon name="down" size={18} /></button>
            </span>
          </div>
          <Mini layer={ui.layer} />
        </div>
        <div class="plan" class:under={floor.id === 'f0'}>
          {#each packed as row}
            <div class="prow" style="height:{row.h}px; grid-template-columns:{row.rooms.map(r => `${r.weight}fr`).join(' ')}">
              {#each row.rooms as r (r.id)}<Cell room={r} layer={ui.layer} here={r.id === here} narrow={r.weight < 1.5} />{/each}
            </div>
          {/each}
          {#if stairs && ['f1', 'f2', 'f3'].includes(floor.id)}
            <button class="stairs press" onclick={() => (ui.room = stairs!.id)}><span class="steps" aria-hidden="true"></span>Лестница · общая для трёх этажей</button>
          {/if}
        </div>
        {@render nowList()}
      {:else}
        <div class="tab">
          {@render layerBar()}
          <div class="tcols">
            {#if ui.view === '3d'}
              <div class="d3t">{@render focusBar()}<div class="d3"><Diorama layer={ui.layer} /></div></div>
            {:else}
            <div class="section" style="--above:{aboveCount}">
              <svg class="roof" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 10 L50 0.6 L100 10" /></svg>
              <div class="storeys">
                <div class="fl-col">
                  {#each floors.filter(f => f.id !== 'f0' && f.id !== 'site') as f (f.id)}
                    <div class="srow"><span class="flab num">{f.name.replace(' этаж', '')}</span>
                      <div class="cells" style="grid-template-columns:{f.rooms.map(r => `${r.weight}fr`).join(' ')}">
                        {#each f.rooms as r (r.id)}<Cell room={r} layer={ui.layer} here={r.id === here} />{/each}
                      </div>
                    </div>
                  {/each}
                </div>
                {#if stairs}<div class="scol"><Cell room={stairs} layer={ui.layer} /></div>{/if}
              </div>
              <div class="ground" aria-hidden="true"></div>
              {#each floors.filter(f => f.id === 'f0' || f.id === 'site') as f (f.id)}
                <div class="srow low" class:site={f.id === 'site'}><span class="flab">{f.id === 'site' ? 'Уч.' : 'Ц'}</span>
                  <div class="cells" style="grid-template-columns:{f.rooms.map(r => `${r.weight}fr`).join(' ')} {f.id === 'site' ? '2fr' : ''}">
                    {#each f.rooms as r (r.id)}<Cell room={r} layer={ui.layer} />{/each}
                  </div>
                </div>
              {/each}
            </div>
            {/if}
            <aside class="side">{@render nowList()}</aside>
          </div>
        </div>
      {/if}
    </div>
    {#if prof === 'phone'}{@render layerBar()}{/if}
    <Sheet layer={ui.layer} />
    {#key ui.device}{#if ui.device}<Hero />{/if}{/key}
  </div>
</div>

<style>
  :global(body) { margin: 0; background: var(--bg); background-image: var(--bg-img); color: var(--text); font-family: var(--font-ui); }
  .shell { min-height: 100vh; }
  .device { position: relative; display: flex; flex-direction: column; height: 100vh; height: 100dvh; overflow: hidden; }
  .scroll { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 14px;
    padding: max(12px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 20px max(16px, env(safe-area-inset-left, 0px)); }
  .tablet .scroll { padding-left: max(28px, env(safe-area-inset-left, 0px)); padding-right: max(28px, env(safe-area-inset-right, 0px)); }
  .framed { display: grid; place-items: start center; padding: 24px 0; }
  .framed .device { width: 390px; height: 844px; border-radius: 44px; border: 1px solid var(--border-strong); background: var(--bg); background-image: var(--bg-img); box-shadow: 0 30px 80px rgba(0,0,0,.35); }

  .top { display: flex; align-items: flex-start; gap: 10px; }
  .tt { flex: 1; min-width: 0; }
  .clock { font-size: 13px; color: var(--muted); }
  h1 { margin: 0; font: var(--display-weight, 400) 30px/1.1 var(--font-display); letter-spacing: var(--display-tracking, -.01em); }
  .sum { margin: 4px 0 0; font-size: 13.5px; color: var(--sub); text-wrap: balance; }
  .prefs { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
  .pp { height: 30px; min-width: 30px; padding: 0 10px; border-radius: var(--r-pill); border: 1px solid var(--border); background: var(--surface); color: var(--sub); font: 500 12px var(--font-ui); display: grid; place-items: center; }

  .fbar { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .fbar button { height: 32px; min-width: 34px; padding: 0 11px; border-radius: var(--r-pill); border: 1px solid var(--border); background: var(--surface); color: var(--sub); font: 500 13px var(--font-ui); }
  .fbar button.on { background: var(--text); color: var(--bg); border-color: transparent; }
  .hint { font-size: 11.5px; color: var(--muted); margin-left: 6px; flex: 1 1 100%; }
  .d3 { height: min(70vh, 640px); flex: none; margin: 0 -16px; }
  .framed .d3 { height: 500px; }
  .d3t { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
  .d3t .d3 { flex: 1; height: auto; min-height: 640px; margin: 0; }
  .fhead { display: flex; align-items: flex-end; gap: 12px; }
  .fname { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
  .arrs { display: flex; gap: 6px; margin-top: 8px; }
  .fname h2 { margin: 0; font: var(--display-weight, 400) 26px/1.1 var(--font-display); }
  .fsub { font-size: 12.5px; color: var(--muted); }
  .arr { width: 34px; height: 30px; border-radius: var(--r-pill); border: 1px solid var(--border); background: var(--surface); color: var(--sub); display: grid; place-items: center; }
  .arr:disabled { opacity: .3; }
  .plan { display: flex; flex-direction: column; gap: 6px; padding: 6px; border-radius: var(--r-lg); border: 2px solid var(--border-strong); border-top-width: 1px; }
  .plan.under { border-style: dashed; }
  .prow { display: grid; gap: 6px; }
  .stairs { display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; border-radius: var(--r-md); border: 1px dashed var(--border-strong); background: none; color: var(--sub); font: 500 13px var(--font-ui); text-align: left; }
  .steps { width: 22px; height: 18px; flex: none; background: linear-gradient(var(--border-strong), var(--border-strong)) 0 100% / 8px 6px no-repeat, linear-gradient(var(--border-strong), var(--border-strong)) 7px 100% / 8px 12px no-repeat, linear-gradient(var(--border-strong), var(--border-strong)) 14px 100% / 8px 18px no-repeat; }

  .now { display: flex; flex-direction: column; gap: 8px; }
  .sh { font: 600 12px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 4px 0 0 2px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; padding: 8px 12px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--surface); color: var(--text); font: inherit; text-align: left; max-width: 100%; }
  .chip b { font-weight: 500; font-size: 14px; }
  .chip i { font-style: normal; font-size: 12px; color: var(--muted); }
  .chip.red { border-color: var(--danger); } .chip.red i { color: var(--danger); }
  .quiet { margin: 0; font-size: 13px; color: var(--muted); }
  .alloff { align-self: flex-start; height: 34px; padding: 0 12px; border-radius: var(--r-pill); border: 1px solid var(--border-strong); background: none; color: var(--sub); font: 500 13px var(--font-ui); display: inline-flex; align-items: center; gap: 6px; }
  .arm { display: flex; gap: 4px; padding: 3px; border-radius: var(--r-pill); background: var(--surface); border: 1px solid var(--border); align-self: flex-start; }
  .arm button { height: 34px; padding: 0 14px; border-radius: var(--r-pill); border: 0; background: none; color: var(--sub); font: 500 13px var(--font-ui); }
  .arm button.on { background: var(--text); color: var(--bg); }

  .layers { display: flex; justify-content: space-around; gap: 2px; flex: none; padding: 6px max(8px, env(safe-area-inset-right, 0px)) max(10px, env(safe-area-inset-bottom, 0px)) max(8px, env(safe-area-inset-left, 0px));
    border-top: 1px solid var(--border); background: var(--surface-solid); }
  .layers button { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 0; border: 0; background: none; color: var(--muted); font: 500 11.5px var(--font-ui); border-radius: var(--r-md); }
  .layers button.on { color: var(--accent-text); background: var(--accent-soft); }
  .framed .layers { border-radius: 0 0 44px 44px; padding-bottom: 18px; }

  .tab { display: flex; flex-direction: column; gap: 16px; flex: 1; min-height: 0; }
  .tab .layers { border: 1px solid var(--border); border-radius: var(--r-pill); padding: 4px; align-self: flex-start; background: var(--surface); }
  .tab .layers button { flex-direction: row; gap: 6px; padding: 0 16px; height: 40px; font-size: 14px; border-radius: var(--r-pill); }
  .tcols { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 24px; }
  .section { display: flex; flex-direction: column; gap: 6px; min-height: 0; }
  .roof { display: block; width: calc(100% - 36px - 120px - 8px); margin-left: 36px; height: 60px; }
  .roof path { fill: var(--surface-2); stroke: var(--border-strong); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
  .storeys { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: 8px; }
  .fl-col { display: flex; flex-direction: column; gap: 6px; }
  .srow { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 8px; height: 150px; }
  .flab { align-self: center; text-align: center; font-size: 13px; color: var(--muted); }
  .cells { display: grid; gap: 6px; padding: 6px; border-left: 2px solid var(--border-strong); border-right: 2px solid var(--border-strong); border-top: 1px solid var(--border); }
  .scol { display: flex; padding: 6px; border: 1px dashed var(--border-strong); border-radius: var(--r-md); }
  .scol :global(.cell) { flex: 1; }
  .ground { height: 6px; margin: 4px 0 2px 36px; border-radius: 3px; background: var(--border-strong); }
  .srow.low { height: 104px; }
  .srow.low .cells { border-style: dashed; border-top: 0; border-bottom: 0; background: repeating-linear-gradient(135deg, transparent 0 10px, var(--surface) 10px 11px); }
  .srow.site { height: 84px; }
  .srow.site .cells { border: 0; background: none; padding-left: 0; }
  .side { min-width: 0; overflow: auto; padding-top: 4px; }
  :global([data-trend="minimal"]) .plan, :global([data-trend="minimal"]) .chip, :global([data-trend="minimal"]) .stairs, :global([data-trend="minimal"]) .layers button, :global([data-trend="minimal"]) .tab .layers, :global([data-trend="minimal"]) .scol { border-radius: 0; }
</style>
