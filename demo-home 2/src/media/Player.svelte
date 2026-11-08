<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Art from './Art.svelte';
  import { S, ui, engine, ask, act, kindLabel, fmt, profile, floorNames, hash } from './state.svelte';
  import type { SourceKind } from '../../model/media/types.ts';

  // Плеер зоны: что играет, переход с планом шагов, громкость, выбор занятия.
  const zid = $derived(ui.zone);
  const z = $derived(engine.zones[zid]);
  const st = $derived(S.zone[zid]);
  const ses = $derived(st.session);
  const src = $derived(ses ? S.src[ses.source] : undefined);
  const node = $derived(ses ? engine.nodes[ses.source] : undefined);
  const c = $derived(src?.content);
  const opts = $derived.by(() => { void S.now; return engine.options(zid); });
  const watchKinds = $derived([...new Set(opts.watch.map(id => engine.nodes[id].kind!))] as SourceKind[]);
  const joinable = $derived.by(() => { void S.now; return engine.joinable(zid); });
  const plan = $derived(st.plan);
  const left = $derived(plan ? Math.max(0, Math.ceil(plan.total - plan.elapsed)) : 0);
  const stepState = (s: { start: number; dur: number; done?: boolean }) => (s.done ? 'done' : plan && plan.elapsed >= s.start ? 'run' : 'wait');
  const ir = $derived(!!node?.via?.includes('ИК') || (ses?.activity !== 'listen' && !!z.display && engine.nodes[z.display].via === 'ИК'));
  const busyKind = (k: SourceKind) => opts.watch.filter(id => engine.nodes[id].kind === k).every(id => S.src[id].zones.length && !S.src[id].zones.includes(zid));
  const startKind = (k: SourceKind) => { ui.panel = k === 'appletv' ? 'remote' : 'library'; ask(zid, { activity: 'watch', kind: k }); };
  const listen = () => { ui.panel = 'library'; };
</script>

<div class="pl {profile()}">
  <header>
    <div class="ht">
      <span class="label">{floorNames[z.floor]}{z.sharesWith?.length ? ` · общее оборудование с зоной «${engine.zones[z.sharesWith[0]].name}»` : ''}</span>
      <h1>{z.name}</h1>
    </div>
    {#if ses || plan?.kind === 'start'}
      <button class="off press" onclick={() => act(() => engine.stop(zid))}><Icon name="power" size={18} />Выключить</button>
    {/if}
  </header>

  {#if plan}
    <section class="plan card" aria-live="polite">
      <div class="ph">
        <b>{plan.kind === 'stop' ? plan.title : `Включаем: ${plan.title}`}</b>
        <span class="num">{left} с</span>
      </div>
      <div class="bar"><span style="width:{Math.min(100, (plan.elapsed / plan.total) * 100)}%"></span></div>
      <ol>
        {#each plan.steps as s (s.id)}
          <li class={stepState(s)}><i></i><span>{s.label}</span><em class="num">{s.dur} с</em></li>
        {/each}
      </ol>
      {#if plan.kind === 'start'}<button class="ghost press" onclick={() => act(() => engine.cancel(zid))}>Отменить</button>{/if}
    </section>
  {/if}

  {#if ses && c}
    <section class="hero">
      <div class="bg" style="--h:{hash(c.art) % 360}"></div>
      <Art art={c.art} kind={c.kind} title={c.title} size="l" />
      <div class="meta">
        <span class="chip src">{ses.activity === 'tv' ? 'Смарт-ТВ' : node?.name}{ir ? ' · ИК' : ''}{st.note ? ` · ${st.note}` : ''}</span>
        <h2>{c.title}</h2>
        {#if c.sub}<p class="sub">{c.sub}</p>{/if}
        {#if c.dur}
          <div class="time num"><span>{fmt(c.pos)}</span><div class="tl"><span style="width:{((c.pos ?? 0) / c.dur) * 100}%"></span></div><span>−{fmt(c.dur - (c.pos ?? 0))}</span></div>
        {/if}
        <div class="tr">
          <button class="tb press" aria-label="Назад 30 секунд" onclick={() => act(() => engine.seek(zid, -30))}><Icon name="back" /></button>
          <button class="tb main press" aria-label={src?.playing ? 'Пауза' : 'Играть'} onclick={() => act(() => engine.toggle(zid))}><Icon name={src?.playing ? 'pause' : 'play'} size={26} /></button>
          <button class="tb press" aria-label="Вперёд 30 секунд" onclick={() => act(() => engine.seek(zid, 30))}><Icon name="next" /></button>
        </div>
        <label class="vol">
          <button class="mute press" aria-label={st.muted ? 'Включить звук' : 'Выключить звук'} onclick={() => act(() => engine.mute(zid))}><Icon name="vol" size={18} /></button>
          <input type="range" min="0" max="80" value={st.volume} aria-label="Громкость" oninput={(e) => act(() => engine.setVolume(zid, +(e.currentTarget as HTMLInputElement).value))} />
          <span class="num">{st.muted ? '—' : st.volume}</span>
        </label>
        {#if src?.restarting}
          <p class="warn">Перезапуск источника: {Math.max(0, Math.ceil(src.restarting.total - src.restarting.elapsed))} с</p>
        {/if}
      </div>
    </section>
  {:else if !plan}
    <section class="idle">
      <p class="label">Зона выключена{st.note ? ` · ${st.note}` : ''}. Что включить?</p>
    </section>
  {/if}

  <section class="acts" aria-label="Что включить">
    {#if watchKinds.length || opts.tv}
      <div class="ag">
        <span class="label">Смотреть</span>
        <div class="chips">
          {#each watchKinds as k}
            <button class="chip press" class:on={ses?.activity === 'watch' && node?.kind === k} onclick={() => startKind(k)}>{kindLabel[k]}{busyKind(k) ? ' · занято' : ''}</button>
          {/each}
          {#if opts.tv}<button class="chip press" class:on={ses?.activity === 'tv'} onclick={() => { ui.panel = 'remote'; ask(zid, { activity: 'tv' }); }}>Смарт-ТВ</button>{/if}
        </div>
      </div>
    {/if}
    {#if opts.listen.length}
      <div class="ag">
        <span class="label">Слушать</span>
        <div class="chips">
          <button class="chip press" class:on={ses?.activity === 'listen'} onclick={listen}>Радио и плейлисты</button>
          {#each joinable as id}
            <button class="chip press" onclick={() => act(() => engine.join(zid, id))}>Присоединиться · {S.src[id].content?.title} ({S.src[id].zones.map(x => engine.zones[x].name).join(', ')})</button>
          {/each}
          {#if ses?.activity === 'listen'}<button class="chip press" onclick={() => (ui.group = true)}>Мультирум…</button>{/if}
        </div>
      </div>
    {/if}
  </section>
</div>

<style>
  .pl { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
  header { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
  .ht { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  h1 { font-size: clamp(30px, 4vw, 44px); margin: 0; }
  .off { height: 40px; padding: 0 14px; border-radius: var(--r-pill); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); font: 500 14px var(--font-ui); display: inline-flex; align-items: center; gap: 6px; flex: none; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 16px; }
  .plan { display: flex; flex-direction: column; gap: 10px; }
  .ph { display: flex; justify-content: space-between; gap: 10px; font-size: 15px; }
  .ph .num { color: var(--accent-text); font-weight: 600; }
  .bar { height: 6px; border-radius: 3px; background: var(--border); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--accent); transition: width .25s linear; }
  ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; }
  li { display: grid; grid-template-columns: 14px minmax(0, 1fr) auto; gap: 8px; align-items: center; color: var(--muted); }
  li i { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid var(--border-strong); }
  li.run { color: var(--text); } li.run i { border-color: var(--accent); background: var(--accent-soft); animation: pulse 1s infinite alternate; }
  li.done { color: var(--sub); } li.done i { background: var(--accent); border-color: var(--accent); }
  li em { font-style: normal; font-size: 12px; }
  @keyframes pulse { to { box-shadow: 0 0 0 4px var(--accent-soft); } }
  @media (prefers-reduced-motion: reduce) { li.run i { animation: none; } }
  .ghost { align-self: flex-start; height: 34px; padding: 0 14px; border-radius: var(--r-pill); border: 1px solid var(--border-strong); background: none; color: var(--text); font: 500 13px var(--font-ui); }
  .hero { position: relative; display: flex; gap: 22px; align-items: flex-end; padding: 22px; border-radius: var(--r-xl); overflow: hidden; border: 1px solid var(--border); }
  .phone .hero { flex-direction: column; align-items: center; text-align: center; padding: 22px 16px; }
  .bg { position: absolute; inset: 0; background: radial-gradient(90% 120% at 20% 10%, hsl(var(--h) 50% 40% / .55), transparent 70%), var(--surface); z-index: -1; }
  .meta { display: flex; flex-direction: column; gap: 10px; min-width: 0; flex: 1; width: 100%; }
  .phone .meta { align-items: center; }
  .src { align-self: flex-start; height: 28px; font-size: 12.5px; padding: 0 10px; background: var(--glass); }
  .phone .src { align-self: center; }
  h2 { font-family: var(--font-display); font-weight: var(--display-weight); font-size: clamp(24px, 3vw, 34px); margin: 0; letter-spacing: var(--display-tracking); text-wrap: balance; }
  .sub { margin: -4px 0 0; color: var(--sub); }
  .time { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: center; font-size: 12px; color: var(--muted); width: 100%; }
  .tl { height: 4px; border-radius: 2px; background: var(--border-strong); overflow: hidden; }
  .tl span { display: block; height: 100%; background: var(--text); }
  .tr { display: flex; gap: 14px; align-items: center; }
  .tb { width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); display: grid; place-items: center; }
  .tb.main { width: 64px; height: 64px; background: var(--text); color: var(--bg); border: 0; }
  .vol { display: grid; grid-template-columns: auto minmax(0, 1fr) 30px; gap: 10px; align-items: center; width: 100%; max-width: 420px; }
  .mute { width: 36px; height: 36px; border-radius: 50%; border: 0; background: var(--surface-2); color: var(--text); display: grid; place-items: center; }
  input[type=range] { accent-color: var(--accent); width: 100%; }
  .vol .num { font-size: 13px; color: var(--muted); text-align: right; }
  .warn { color: var(--danger); font-size: 13px; margin: 0; }
  .idle { padding: 8px 2px; }
  .acts { display: flex; flex-direction: column; gap: 12px; }
  .ag { display: flex; flex-direction: column; gap: 8px; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chips .chip { height: 40px; }
  :global([data-trend="minimal"]) .hero, :global([data-trend="minimal"]) .card, :global([data-trend="minimal"]) .off, :global([data-trend="minimal"]) .ghost { border-radius: 0; }
</style>
