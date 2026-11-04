<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Slider from '../ui/Slider.svelte';
  import { dev, cmd } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';

  // Медиа: «сейчас играет», пульт и цепочка коммутации.
  // Телевизор управляется по ИК без обратной связи — состояние помечено как предполагаемое.
  let { arg = '' }: { arg?: string } = $props();
  const tv = $derived(dev('living.tv'));
  const sp = $derived(dev('living.speaker'));
  let source = $state('Apple TV');
  let last = $state('');
  let pressed = $state('');
  let lastT = $state(0);
  function key(k: string, label: string) {
    pressed = k; last = label; lastT = Date.now();
    setTimeout(() => { if (pressed === k) pressed = ''; }, 180);
    setTimeout(() => { if (Date.now() - lastT >= 1900) last = ''; }, 2000);
  }
  const mins = $derived(Math.round((tv.progress ?? 0) * 128));
  const sources = ['Apple TV', 'PlayStation 5', 'Кабельное ТВ'];
  const hdmi: Record<string, string> = { 'Apple TV': 'HDMI 1', 'PlayStation 5': 'HDMI 2', 'Кабельное ТВ': 'HDMI 3' };
</script>

<div class="scr {theme.profile}">
  <header class="rise"><h1>Медиа</h1><span class="label">гостиная</span></header>

  <section class="now card rise" class:off={!tv.on} style="animation-delay:.05s">
    <div class="art" class:playing={tv.on && tv.playing}><span>{tv.title}</span></div>
    <div class="meta">
      <span class="label">{tv.on ? (tv.playing ? 'сейчас идёт' : 'пауза') : 'телевизор выключен'}{tv.assumed ? ' · состояние по ИК' : ''}</span>
      <h2>{tv.title}</h2>
      <span class="src">{source} · {hdmi[source]} · Dolby Atmos</span>
      <div class="prog"><i style="width:{(tv.progress ?? 0) * 100}%"></i></div>
      <div class="times num"><span>{Math.floor(mins / 60)}:{String(mins % 60).padStart(2, '0')}</span><span>2:08</span></div>
      <div class="transport">
        <button class="tb press" aria-label="Назад 10 секунд" onclick={() => key('rew', '−10 с')}><Icon name="back" /></button>
        <button class="tb play press" aria-label={tv.playing ? 'Пауза' : 'Воспроизвести'} onclick={() => cmd({ cmd: 'media.action', target: 'living.tv', action: 'toggle' })}>
          <Icon name={tv.playing ? 'pause' : 'play'} size={28} />
        </button>
        <button class="tb press" aria-label="Вперёд 10 секунд" onclick={() => key('ff', '+10 с')}><Icon name="next" /></button>
        <button class="tb pw press" class:on={tv.on} aria-label="Питание" onclick={() => cmd({ cmd: 'media.action', target: 'living.tv', action: 'power' })}><Icon name="power" /></button>
      </div>
      <div class="vol">
        <Icon name="vol" size={20} />
        <div class="vs"><Slider label="Громкость" value={tv.volume ?? 40} max={80} unit="" onchange={(v) => cmd({ cmd: 'media.action', target: 'living.tv', action: 'vol', delta: v - (tv.volume ?? 40) })} /></div>
      </div>
    </div>
  </section>

  <section class="remote card rise" style="animation-delay:.1s">
    <div class="dpad" role="group" aria-label="Навигация">
      <button class="d up" class:p={pressed === 'up'} aria-label="Вверх" onclick={() => key('up', '▲')}><Icon name="up" /></button>
      <button class="d left" class:p={pressed === 'left'} aria-label="Влево" onclick={() => key('left', '◀')}><Icon name="back" /></button>
      <button class="ok" class:p={pressed === 'ok'} onclick={() => key('ok', 'OK')}>OK</button>
      <button class="d right" class:p={pressed === 'right'} aria-label="Вправо" onclick={() => key('right', '▶')}><Icon name="next" /></button>
      <button class="d down" class:p={pressed === 'down'} aria-label="Вниз" onclick={() => key('down', '▼')}><Icon name="down" /></button>
    </div>
    <div class="keys">
      <button class="k press" onclick={() => key('back', 'Назад')}>Назад</button>
      <button class="k press" onclick={() => key('home', 'Домой')}>Домой</button>
      <button class="k press" onclick={() => key('menu', 'Меню')}>Меню</button>
    </div>
    <div class="srcs">
      {#each sources as s}
        <button class="chip press" class:on={s === source} onclick={() => { source = s; key('src', hdmi[s]); }}>{s}</button>
      {/each}
    </div>
  </section>

  <section class="chain card rise" style="animation-delay:.15s" aria-label="Цепочка сигнала">
    <h2 class="sh">Путь сигнала</h2>
    <div class="nodes">
      <span class="node on">{source}</span><i class="wire" class:live={tv.on}></i>
      <span class="node on">Матрица · {hdmi[source]}</span><i class="wire" class:live={tv.on}></i>
      <span class="node on">Ресивер Denon</span><i class="wire" class:live={tv.on}></i>
      <span class="node" class:on={tv.on}>Телевизор <em>ИК</em></span>
    </div>
    <p class="last">{#if last}{#key last + lastT}<span class="pop">отправлено: {last}</span>{/key}{:else}&nbsp;{/if}</p>
  </section>

  <section class="speaker card rise" style="animation-delay:.2s">
    <span class="si" class:on={sp.playing}><Icon name="speaker" /></span>
    <div class="st"><b>Колонка · кухня-гостиная</b><span>{sp.playing ? sp.title : 'пауза'}</span></div>
    <button class="tb press" aria-label={sp.playing ? 'Пауза' : 'Играть'} onclick={() => cmd({ cmd: 'media.action', target: 'living.speaker', action: 'toggle' })}><Icon name={sp.playing ? 'pause' : 'play'} /></button>
  </section>
</div>

<style>
  .scr { display: grid; gap: 14px; padding: max(24px, env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) 80px 28px; align-content: start; }
  .tablet { grid-template-columns: minmax(0, 1.3fr) minmax(300px, 1fr); grid-template-areas: 'h h' 'now remote' 'chain remote' 'speaker remote'; }
  .tablet header { grid-area: h; } .tablet .now { grid-area: now; } .tablet .remote { grid-area: remote; } .tablet .chain { grid-area: chain; } .tablet .speaker { grid-area: speaker; }
  .phone { grid-template-columns: minmax(0, 1fr); padding: max(20px, env(safe-area-inset-top, 0px)) 16px 20px; }
  header { display: flex; align-items: baseline; gap: 12px; }
  h1 { font-size: clamp(30px, 4vw, 44px); }

  .now { display: grid; grid-template-columns: minmax(120px, 220px) 1fr; gap: 20px; padding: 18px; }
  .phone .now { grid-template-columns: 1fr; }
  .art { aspect-ratio: 2 / 3; border-radius: var(--r-md); position: relative; overflow: hidden; display: flex; align-items: flex-end; padding: 14px;
    background: radial-gradient(80% 60% at 30% 20%, #F0A050, transparent), radial-gradient(70% 70% at 80% 80%, #2A6F86, transparent), #15161A; color: #fff; transition: filter 1s; }
  .phone .art { aspect-ratio: 16 / 9; }
  .art span { font-family: var(--font-display); font-size: 22px; font-weight: 300; line-height: 1.1; }
  .art::after { content: ''; position: absolute; inset: -50%; background: conic-gradient(from 0deg, transparent, rgba(255,255,255,.08), transparent 30%); animation: spin 14s linear infinite; animation-play-state: paused; }
  .art.playing::after { animation-play-state: running; }
  @keyframes spin { to { transform: rotate(1turn); } }
  .off .art { filter: grayscale(1) brightness(.5); }
  .meta { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .meta h2 { font-size: 28px; }
  .src { color: var(--muted); font-size: 14px; }
  .prog { height: 4px; border-radius: 4px; background: var(--track); overflow: hidden; margin-top: 8px; }
  .prog i { display: block; height: 100%; background: var(--accent); transition: width 1s linear; }
  .times { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); }
  .transport { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
  .tb { width: 52px; height: 52px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface-2); display: grid; place-items: center; flex: none; }
  .tb.play { width: 64px; height: 64px; background: var(--inv-bg); color: var(--inv-text); border: 0; }
  .tb.pw { margin-left: auto; }
  .tb.pw.on { color: var(--accent-text); border-color: var(--accent-border); }
  .vol { display: flex; align-items: center; gap: 12px; color: var(--muted); }
  .vs { flex: 1; }

  .remote { display: flex; flex-direction: column; align-items: center; gap: 22px; padding: 24px 18px; }
  .dpad { position: relative; width: 240px; height: 240px; border-radius: 50%; background: var(--surface-2); border: 1px solid var(--border); }
  .d, .ok { position: absolute; border: 0; background: none; display: grid; place-items: center; color: var(--sub); transition: transform .5s var(--spring), color .2s; }
  .d { width: 72px; height: 72px; border-radius: 50%; }
  .up { top: 4px; left: 84px; } .down { bottom: 4px; left: 84px; } .left { left: 4px; top: 84px; } .right { right: 4px; top: 84px; }
  .d.p { transform: scale(.85); color: var(--accent-text); }
  .ok { left: 70px; top: 70px; width: 100px; height: 100px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border-strong); font-weight: 600; font-size: 18px; color: var(--text); box-shadow: var(--shadow); }
  .ok.p { transform: scale(.92); background: var(--accent-soft); }
  .keys { display: flex; gap: 8px; }
  .k { height: 44px; padding: 0 16px; border-radius: var(--r-pill); border: 1px solid var(--border); background: var(--surface); }
  .srcs { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
  .srcs .chip { height: 38px; padding: 0 12px; font-size: 13px; }

  .chain { padding: 16px; }
  .sh { font-size: 15px; font-family: var(--font-ui); font-weight: 600; letter-spacing: 0; margin-bottom: 12px; }
  .nodes { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 0; }
  .node { padding: 8px 12px; border-radius: var(--r-sm); border: 1px solid var(--border); font-size: 13px; color: var(--muted); white-space: nowrap; }
  .node.on { color: var(--text); border-color: var(--border-strong); }
  .node em { font-style: normal; font-size: 10px; padding: 1px 4px; border-radius: 4px; background: var(--accent-soft); color: var(--accent-text); margin-left: 4px; }
  .wire { width: 22px; height: 2px; background: var(--border-strong); position: relative; overflow: hidden; }
  .wire.live::after { content: ''; position: absolute; inset: 0; width: 8px; background: var(--accent); animation: flow 1.2s linear infinite; }
  @keyframes flow { from { transform: translateX(-8px); } to { transform: translateX(24px); } }
  .last { margin: 10px 0 0; font-size: 13px; color: var(--accent-text); min-height: 18px; }
  .pop { display: inline-block; animation: rise .4s var(--ease-out) both; }

  .speaker { display: flex; align-items: center; gap: 12px; padding: 14px; }
  .si { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); }
  .si.on { background: var(--cool-soft); color: var(--cool-text); }
  .st { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .st b { font-weight: 500; }
  .st span { font-size: 13px; color: var(--muted); }

  :global([data-trend="minimal"]) .dpad { border-radius: 0; background: transparent; border-color: var(--border-strong); }
  :global([data-trend="minimal"]) .ok { border-radius: 0; box-shadow: none; }
  :global([data-trend="minimal"]) .d { border-radius: 0; }
  :global([data-trend="minimal"]) .tb, :global([data-trend="minimal"]) .k, :global([data-trend="minimal"]) .si { border-radius: 0; }
  :global([data-trend="minimal"]) .art { border-radius: 0; background: #1A1A1A; }
  :global([data-trend="minimal"]) .art span { font-family: var(--font-num); font-size: 14px; text-transform: uppercase; }
  :global([data-trend="minimal"]) .sh { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: var(--muted); }
  :global([data-trend="minimal"]) .prog { border-radius: 0; height: 2px; }
</style>
