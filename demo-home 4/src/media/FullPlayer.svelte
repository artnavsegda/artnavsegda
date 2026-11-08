<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Art from './Art.svelte';
  import Remote from './Remote.svelte';
  import Path from './Path.svelte';
  import { S, ui, engine, act, fmt, hash } from './state.svelte';
  import { mc, activeZones, step } from './mc.svelte';
  import { meta, channels, series } from './catalog';
  import { sosnyMedia } from '../../model/media/sosny.ts';

  // Полноэкранный плеер зоны: обложка, транспорт, громкость-крутилка и всё, чего ждут от плеера:
  // субтитры (поиск и загрузка), звуковые дорожки, серии, очередь, мультирум, пульт, путь сигнала.
  const zid = $derived(mc.full);
  $effect(() => { if (zid) ui.zone = zid; });
  const st = $derived(S.zone[zid]);
  const ses = $derived(st?.session);
  const src = $derived(ses ? S.src[ses.source] : undefined);
  const c = $derived(src?.content);
  const node = $derived(ses ? engine.nodes[ses.source] : undefined);
  const kind = $derived(ses?.activity === 'tv' ? 'smarttv' : node?.kind);
  const hue = $derived(c ? hash(c.art) % 360 : 30);
  const music = $derived(c?.kind === 'track' || c?.kind === 'radio');
  const video = $derived(c?.kind === 'movie' || c?.kind === 'episode');
  const m = $derived(c && video ? meta(c.kind === 'episode' ? c.id.replace(/s\d+e\d+$/, '') : c.id, c.title) : null);
  const eps = $derived(c?.kind === 'episode' ? series.find(s => c.id.startsWith(s.id))?.seasons.flatMap(x => x.episodes) ?? [] : []);
  const tabs = $derived<string[]>(video ? ['Субтитры', 'Звук', ...(eps.length ? ['Серии'] : []), 'Пульт', 'Путь'] : music ? ['Очередь', 'Зоны', 'Путь'] : kind === 'sat' ? ['Каналы', 'Пульт', 'Путь'] : ['Пульт', 'Путь']);
  const tab = $derived(tabs.includes(mc.tab) ? mc.tab : tabs[0]);
  const zones = $derived(activeZones());
  const where = $derived(src ? src.zones.map(z => engine.zones[z].name).join(' · ') : engine.zones[zid]?.name);

  // громкость: крутилка, тянуть по кругу
  const VMAX = 80;
  let knob: SVGSVGElement;
  function turn(e: PointerEvent) {
    const r = knob.getBoundingClientRect(), a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2)));
    const k = Math.max(0, Math.min(1, (a + Math.PI * .75) / (Math.PI * 1.5)));
    act(() => engine.setVolume(zid, Math.round(k * VMAX)));
  }
  const arc = (k: number) => { const a0 = -Math.PI * .75, a1 = a0 + Math.PI * 1.5 * k, R = 44; const p = (a: number) => `${50 + R * Math.sin(a)} ${50 - R * Math.cos(a)}`; return `M ${p(a0)} A ${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`; };
  // мультирум
  const audioZones = sosnyMedia.zones.filter(z => engine.options(z.id).listen.length);
  const member = (z: string) => !!src?.zones.includes(z);
  const toggleMember = (z: string) => ses && act(() => (member(z) ? engine.stop(z, 'вышла из группы') : engine.join(z, ses.source)));
  // субтитры
  const subSel = $derived(mc.subs[zid] ?? 'off');
  const close = () => (mc.full = '');
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && close()} />

<div class="fp" role="dialog" aria-modal="true" aria-label="Плеер · {engine.zones[zid]?.name}" style="--hue:{hue}">
  <div class="bg" aria-hidden="true">{#if c}<Art art={c.art} kind={c.kind} title="" size="fill" />{/if}</div>
  <header>
    <button class="ic press" aria-label="Свернуть" onclick={close}><Icon name="down" size={22} /></button>
    <button class="zn press" onclick={() => { const i = zones.indexOf(zid); if (zones.length > 1) mc.full = zones[(i + 1) % zones.length]; }}>
      <span class="ey">{zones.length > 1 ? `Зона ${zones.indexOf(zid) + 1} из ${zones.length}` : 'Играет'}</span><b>{where}</b>
    </button>
    <button class="ic press" aria-label="Выключить зону" onclick={() => { act(() => engine.stop(zid)); close(); }}><Icon name="power" size={20} /></button>
  </header>

  <div class="main">
    <div class="left">
      {#if st?.plan}
        <div class="plan">
          <b>{st.plan.title}</b>
          <span class="pbar"><span style="width:{(st.plan.elapsed / st.plan.total) * 100}%"></span></span>
          <ol>{#each st.plan.steps as s (s.id)}<li class:done={s.done} class:cur={!s.done && st.plan.elapsed >= s.start}>{s.label}</li>{/each}</ol>
          {#if st.plan.kind === 'start'}<button class="ghost press" onclick={() => act(() => engine.cancel(zid))}>Отменить</button>{/if}
        </div>
      {:else if c}
        <div class="cover" class:sq={music || c.kind === 'channel' || c.kind === 'app'}><Art art={c.art} kind={c.kind} title={c.title} size="fill" /></div>
      {/if}
      {#if c}
        <div class="ttl"><b>{c.title}</b><i>{c.sub}{node ? ` · ${node.name}` : ''}</i></div>
        {#if c.dur}
          <div class="time"><span class="num">{fmt(c.pos)}</span>
            <input class="seek" type="range" min="0" max={c.dur} value={c.pos ?? 0} aria-label="Позиция" onchange={(e) => act(() => engine.seek(zid, +e.currentTarget.value - (c.pos ?? 0)))} style="--p:{((c.pos ?? 0) / c.dur) * 100}%" />
            <span class="num">−{fmt(c.dur - (c.pos ?? 0))}</span></div>
        {/if}
        <div class="transport">
          <button class="tb press" aria-label="Предыдущий" onclick={() => step(zid, -1)}><Icon name="back" size={22} /></button>
          <button class="tb press" aria-label="Назад 30 секунд" onclick={() => act(() => engine.seek(zid, -30))}><span class="num">−30</span></button>
          <button class="tb big press" aria-label={src?.playing ? 'Пауза' : 'Играть'} onclick={() => act(() => engine.toggle(zid))}><Icon name={src?.playing ? 'pause' : 'play'} size={30} /></button>
          <button class="tb press" aria-label="Вперёд 30 секунд" onclick={() => act(() => engine.seek(zid, 30))}><span class="num">+30</span></button>
          <button class="tb press" aria-label="Следующий" onclick={() => step(zid, 1)}><Icon name="next" size={22} /></button>
        </div>
      {/if}
      <div class="vol">
        <button class="mute press" class:on={st?.muted} aria-label={st?.muted ? 'Включить звук' : 'Выключить звук'} onclick={() => act(() => engine.mute(zid))}><Icon name="vol" size={18} /></button>
        <svg bind:this={knob} viewBox="0 0 100 100" class="knob" role="slider" aria-label="Громкость" aria-valuemin="0" aria-valuemax={VMAX} aria-valuenow={st?.volume} tabindex="0"
          onpointerdown={(e) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); turn(e); }} onpointermove={(e) => e.buttons && turn(e)}
          onkeydown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowRight') act(() => engine.setVolume(zid, Math.min(VMAX, (st?.volume ?? 0) + 2))); if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') act(() => engine.setVolume(zid, Math.max(0, (st?.volume ?? 0) - 2))); }}>
          <path d={arc(1)} class="trk" /><path d={arc((st?.volume ?? 0) / VMAX)} class="val" />
          <circle cx="50" cy="50" r="31" class="cap" />
          <line x1="50" y1="50" x2="50" y2="27" class="ptr" style="transform: rotate({-135 + 270 * (st?.volume ?? 0) / VMAX}deg); transform-origin: 50px 50px" />
        </svg>
        <span class="vv"><b class="num">{st?.volume ?? 0}</b><i>громкость{src && src.zones.length > 1 ? ' зоны' : ''}</i></span>
      </div>
    </div>

    <div class="right">
      <div class="tabs" role="tablist">{#each tabs as t}<button role="tab" aria-selected={tab === t} class:on={tab === t} onclick={() => (mc.tab = t)}>{t}</button>{/each}</div>
      <div class="tp">
        {#if tab === 'Субтитры' && m}
          <div class="opts">
            <button class="opt" class:on={subSel === 'off'} onclick={() => (mc.subs[zid] = 'off')}><b>Без субтитров</b></button>
            {#each m.subs as s (s.id)}
              {@const got = mc.got[c!.id + s.id]}
              <div class="opt" class:on={subSel === s.id}>
                <span><b>{s.lang}</b><i>{s.source} · {s.downloads.toLocaleString('ru')} загрузок</i></span>
                {#if got}<button class="sm press" onclick={() => (mc.subs[zid] = s.id)}>{subSel === s.id ? 'Включены' : 'Включить'}</button>
                {:else}<button class="sm press" onclick={() => { mc.got[c!.id + s.id] = true; mc.subs[zid] = s.id; }}>Скачать</button>{/if}
              </div>
            {/each}
            <p class="note">Поиск по названию и хешу файла — через дополнение Kodi. Найденное сохраняется рядом с фильмом.</p>
          </div>
        {:else if tab === 'Звук' && m}
          <div class="opts">{#each m.audio as a, i}<button class="opt" class:on={(mc.audio[zid] ?? 0) === i} onclick={() => (mc.audio[zid] = i)}><b>{a}</b></button>{/each}</div>
        {:else if tab === 'Серии'}
          <div class="opts">{#each eps as e (e.id)}<button class="opt" class:on={e.id === c?.id} onclick={() => act(() => engine.play(zid, e))}><span><b>{e.title}</b><i>{e.sub}</i></span></button>{/each}</div>
        {:else if tab === 'Очередь'}
          <div class="opts">
            {#each mc.queue[zid] ?? (c ? [c] : []) as t (t.id)}
              <button class="opt" class:on={t.id === c?.id} onclick={() => act(() => engine.play(zid, t))}><span><b>{t.title}</b><i>{t.sub}</i></span>{#if t.dur}<span class="num dur">{fmt(t.dur)}</span>{/if}</button>
            {/each}
          </div>
        {:else if tab === 'Зоны'}
          <div class="opts">
            {#each audioZones as z (z.id)}
              {@const busy = !member(z.id) && !!S.zone[z.id].session}
              <label class="opt chk"><input type="checkbox" checked={member(z.id)} onchange={() => toggleMember(z.id)} />
                <span><b>{z.name}</b><i>{member(z.id) ? 'играет вместе' : busy ? 'сейчас занята — переключится' : 'выключена'}</i></span></label>
            {/each}
          </div>
        {:else if tab === 'Каналы'}
          <div class="chs">{#each channels as ch (ch.id)}<button class="ch press" class:on={ch.id === c?.id} onclick={() => act(() => engine.play(zid, ch))}><Art art={ch.art} kind="channel" title={ch.title} size="fill" /><i>{ch.sub}</i></button>{/each}</div>
        {:else if tab === 'Пульт'}
          <Remote />
        {:else if tab === 'Путь'}
          <Path />
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .fp { position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column; color: #F6F2EC; overflow: hidden; animation: up .35s var(--ease-out);
    background: radial-gradient(120% 80% at 50% 0%, hsl(var(--hue) 45% 26%), hsl(calc(var(--hue) + 40) 45% 7%) 70%); }
  @keyframes up { from { transform: translateY(40px); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .fp { animation: none; } }
  .bg { position: absolute; inset: -60px; z-index: 0; opacity: .5; filter: blur(50px) saturate(1.3); }
  .bg :global(.art) { aspect-ratio: auto; height: 100%; border-radius: 0; }
  header { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; padding: max(12px, env(safe-area-inset-top, 0px)) max(14px, env(safe-area-inset-right, 0px)) 6px max(14px, env(safe-area-inset-left, 0px)); }
  .ic { width: 42px; height: 42px; border-radius: 50%; border: 0; background: rgba(255,255,255,.12); color: inherit; display: grid; place-items: center; flex: none; }
  .zn { flex: 1; min-width: 0; border: 0; background: none; color: inherit; display: flex; flex-direction: column; align-items: center; font: inherit; }
  .ey { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; opacity: .65; }
  .zn b { font-weight: 600; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .main { position: relative; z-index: 1; flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 18px;
    padding: 8px max(20px, env(safe-area-inset-right, 0px)) max(24px, env(safe-area-inset-bottom, 0px)) max(20px, env(safe-area-inset-left, 0px)); }
  @media (min-width: 860px) { .main { flex-direction: row; gap: 40px; padding: 12px 48px 32px; } .left { flex: 1; justify-content: center; } .right { width: 420px; flex: none; } }
  .left { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .cover { width: min(calc(var(--app-w) * .78), 360px); border-radius: 18px; overflow: hidden; box-shadow: 0 30px 70px rgba(0,0,0,.5); }
  .cover:not(.sq) { width: min(calc(var(--app-w) * .56), 260px); }
  .cover.sq :global(.art) { aspect-ratio: 1; }
  .ttl { align-self: stretch; display: flex; flex-direction: column; gap: 3px; text-align: center; }
  .ttl b { font: var(--display-weight, 300) 26px/1.1 var(--font-display); letter-spacing: -.01em; }
  .ttl i { font-style: normal; font-size: 14px; opacity: .7; }
  .time { align-self: center; width: min(100%, 440px); display: flex; align-items: center; gap: 10px; font-size: 12px; opacity: .85; }
  .seek { flex: 1; appearance: none; -webkit-appearance: none; height: 4px; border-radius: 2px; background: linear-gradient(90deg, #F6F2EC var(--p), rgba(255,255,255,.22) var(--p)); }
  .seek::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #fff; }
  .seek::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: #fff; }
  .transport { display: flex; align-items: center; gap: 10px; }
  .tb { width: 50px; height: 50px; border-radius: 50%; border: 0; background: none; color: inherit; display: grid; place-items: center; font: 600 13px var(--font-ui); }
  .tb.big { width: 74px; height: 74px; background: #F6F2EC; color: #15110d; box-shadow: 0 12px 30px rgba(0,0,0,.35); }
  .vol { display: flex; align-items: center; gap: 14px; }
  .mute { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,.25); background: none; color: inherit; display: grid; place-items: center; }
  .mute.on { background: rgba(255,255,255,.2); }
  .knob { width: 108px; height: 108px; touch-action: none; cursor: grab; }
  .knob .trk { fill: none; stroke: rgba(255,255,255,.16); stroke-width: 6; stroke-linecap: round; }
  .knob .val { fill: none; stroke: #F4D6A8; stroke-width: 6; stroke-linecap: round; }
  .knob .cap { fill: rgba(255,255,255,.1); stroke: rgba(255,255,255,.25); stroke-width: 1; }
  .knob .ptr { stroke: #F6F2EC; stroke-width: 3; stroke-linecap: round; transition: transform .15s; }
  .vv { display: flex; flex-direction: column; } .vv b { font: 300 28px/1 var(--font-display); } .vv i { font-style: normal; font-size: 12px; opacity: .65; }
  .plan { width: min(100%, 380px); display: flex; flex-direction: column; gap: 10px; padding: 18px; border-radius: 20px; background: rgba(0,0,0,.25); }
  .plan b { font-size: 16px; }
  .plan ol { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 4px; font-size: 13.5px; opacity: .8; }
  .plan li.done { opacity: .45; text-decoration: line-through; } .plan li.cur { opacity: 1; font-weight: 600; }
  .pbar { display: block; height: 4px; border-radius: 2px; background: rgba(255,255,255,.2); overflow: hidden; } .pbar span { display: block; height: 100%; background: #F4D6A8; transition: width .25s linear; }
  .ghost { align-self: flex-start; height: 38px; padding: 0 14px; border-radius: 19px; border: 1px solid rgba(255,255,255,.3); background: none; color: inherit; font: 500 13px var(--font-ui); }
  .right { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .tabs { display: flex; gap: 4px; padding: 3px; border-radius: 22px; background: rgba(0,0,0,.25); overflow-x: auto; scrollbar-width: none; }
  .tabs button { flex: 1 0 auto; height: 36px; padding: 0 12px; border: 0; border-radius: 18px; background: none; color: rgba(246,242,236,.7); font: 500 13px var(--font-ui); }
  .tabs button.on { background: rgba(255,255,255,.16); color: #fff; }
  .tp { min-height: 200px; color: #F6F2EC; --text: #F6F2EC; --sub: rgba(246,242,236,.8); --muted: rgba(246,242,236,.6); --surface: rgba(255,255,255,.07); --surface-2: rgba(255,255,255,.1); --border: rgba(255,255,255,.12); --border-strong: rgba(255,255,255,.22); }
  .opts { display: flex; flex-direction: column; gap: 4px; }
  .opt { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 50px; padding: 8px 12px; border-radius: 14px; border: 1px solid transparent; background: rgba(255,255,255,.06); color: inherit; text-align: left; font: inherit; }
  .opt.on { border-color: rgba(244,214,168,.6); background: rgba(244,214,168,.12); }
  .opt span { display: flex; flex-direction: column; min-width: 0; } .opt b { font-weight: 500; font-size: 14px; } .opt i { font-style: normal; font-size: 12px; opacity: .65; }
  .opt.chk { justify-content: flex-start; } .opt.chk input { width: 20px; height: 20px; accent-color: #F4D6A8; }
  .sm { height: 32px; padding: 0 12px; border-radius: 16px; border: 1px solid rgba(255,255,255,.3); background: none; color: inherit; font: 500 12.5px var(--font-ui); flex: none; }
  .dur { font-size: 12.5px; opacity: .65; }
  .note { margin: 6px 2px 0; font-size: 12px; opacity: .6; line-height: 1.4; }
  .chs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .ch { border: 0; background: none; padding: 0; color: inherit; display: flex; flex-direction: column; gap: 4px; font: inherit; text-align: left; }
  .ch :global(.art) { aspect-ratio: 1; } .ch.on :global(.art) { outline: 2px solid #F4D6A8; outline-offset: 2px; }
  .ch i { font-style: normal; font-size: 11.5px; opacity: .7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  :global([data-trend="minimal"]) .fp .cover, :global([data-trend="minimal"]) .fp .opt, :global([data-trend="minimal"]) .fp .tabs, :global([data-trend="minimal"]) .fp .tabs button { border-radius: 0; }
</style>
