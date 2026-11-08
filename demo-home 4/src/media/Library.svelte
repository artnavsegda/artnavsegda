<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Art from './Art.svelte';
  import { S, ui, engine, ask, act, fmt } from './state.svelte';
  import { movies, series, channels, radio, playlists, appleApps } from '../../model/media/library.ts';
  import type { Content } from '../../model/media/engine.ts';

  // Медиатека зоны: показываем только то, что в этой зоне можно включить.
  type Cat = 'movies' | 'series' | 'channels' | 'radio' | 'playlists' | 'apps';
  const names: Record<Cat, string> = { movies: 'Фильмы', series: 'Сериалы', channels: 'ТВ-каналы', radio: 'Радио', playlists: 'Плейлисты', apps: 'Приложения' };
  const zid = $derived(ui.zone);
  const opts = $derived.by(() => { void S.now; return engine.options(zid); });
  const has = (k: string) => opts.watch.some(id => engine.nodes[id].kind === k);
  const cats = $derived((['movies', 'series', 'channels', 'apps', 'radio', 'playlists'] as Cat[]).filter(c =>
    c === 'movies' || c === 'series' ? has('kodi') : c === 'channels' ? has('sat') : c === 'apps' ? has('appletv') : opts.listen.length > 0));
  const ses = $derived(S.zone[zid].session);
  const curKind = $derived(ses ? engine.nodes[ses.source].kind : undefined);
  const natural = $derived<Cat>(curKind === 'sat' ? 'channels' : curKind === 'streamer' ? 'radio' : curKind === 'appletv' ? 'apps' : cats[0]);
  let pick = $state<Cat | ''>('');
  let lastZone = '';
  $effect(() => { if (zid !== lastZone) { lastZone = zid; pick = ''; openSeries = ''; } });
  const cat = $derived(pick && cats.includes(pick) ? pick : natural);
  let openSeries = $state('');
  const curId = $derived(ses ? S.src[ses.source].content?.id : '');

  function play(c: Content) {
    const kind = c.kind === 'channel' ? 'sat' : c.kind === 'radio' || c.kind === 'track' ? 'streamer' : c.kind === 'app' ? 'appletv' : 'kodi';
    const sameKind = ses && engine.nodes[ses.source].kind === kind;
    if (sameKind) act(() => engine.play(zid, c));
    else ask(zid, { activity: kind === 'streamer' ? 'listen' : 'watch', kind, content: c });
    if (kind === 'appletv') ui.panel = 'remote';
  }
</script>

<div class="lib">
  <div class="tabs scroll-x" role="tablist" aria-label="Разделы медиатеки">
    {#each cats as c}
      <button class="chip press" role="tab" aria-selected={cat === c} class:on={cat === c} onclick={() => { pick = c; openSeries = ''; }}>{names[c]}</button>
    {/each}
  </div>

  {#if !cats.length}
    <p class="label">В этой зоне нет источников с медиатекой.</p>
  {:else if cat === 'movies'}
    <div class="grid">
      {#each movies as m (m.id)}
        <button class="card-m press" class:cur={curId === m.id} onclick={() => play(m)}>
          <Art art={m.art} kind="movie" title={m.title} size="fill" />
          <b>{m.title}</b><span>{m.year} · {m.genre} · {Math.round((m.dur ?? 0) / 60)} мин</span>
        </button>
      {/each}
    </div>
  {:else if cat === 'series'}
    {#if !openSeries}
      <div class="grid">
        {#each series as s (s.id)}
          <button class="card-m press" onclick={() => (openSeries = s.id)}>
            <Art art={s.art} kind="movie" title={s.title} size="fill" />
            <b>{s.title}</b><span>{s.year} · {s.genre} · {s.seasons.length} сез.</span>
          </button>
        {/each}
      </div>
    {:else}
      {@const s = series.find(x => x.id === openSeries)!}
      <button class="back press" onclick={() => (openSeries = '')}><Icon name="back" size={16} />{s.title}</button>
      {#each s.seasons as season}
        <h3 class="sh">Сезон {season.n}</h3>
        <div class="rows">
          {#each season.episodes as e, i (e.id)}
            <button class="row press" class:cur={curId === e.id} onclick={() => play({ ...e, title: `${s.title}: ${e.title}` })}>
              <span class="n num">{i + 1}</span><span class="t"><b>{e.title}</b><i>{Math.round((e.dur ?? 0) / 60)} мин</i></span><Icon name="play" size={16} />
            </button>
          {/each}
        </div>
      {/each}
    {/if}
  {:else if cat === 'channels' || cat === 'radio' || cat === 'apps'}
    {@const list = cat === 'channels' ? channels : cat === 'radio' ? radio : appleApps}
    <div class="rows">
      {#each list as c (c.id)}
        <button class="row press" class:cur={curId === c.id} onclick={() => play(c)}>
          <Art art={c.art} kind={c.kind} title={c.title} size="s" />
          <span class="t"><b>{c.title}</b><i>{c.sub}</i></span>
          {#if curId === c.id}<span class="live">в эфире</span>{:else}<Icon name="play" size={16} />{/if}
        </button>
      {/each}
    </div>
  {:else if cat === 'playlists'}
    {#each playlists as p (p.id)}
      <div class="pl">
        <Art art={p.art} kind="track" title={p.title} size="s" />
        <span class="t"><b>{p.title}</b><i>{p.sub} · {p.tracks.length} трека</i></span>
        <button class="row-btn press" onclick={() => play({ ...p.tracks[0], sub: `${p.title} · ${p.tracks[0].sub}` })}><Icon name="play" size={16} />Играть</button>
      </div>
      <div class="rows inner">
        {#each p.tracks as t (t.id)}
          <button class="row slim press" class:cur={curId === t.id} onclick={() => play({ ...t, sub: `${p.title} · ${t.sub}` })}>
            <span class="t"><b>{t.title}</b><i>{t.sub}</i></span><span class="num dur">{fmt(t.dur)}</span>
          </button>
        {/each}
      </div>
    {/each}
  {/if}
</div>

<style>
  .lib { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .tabs { display: flex; gap: 6px; }
  .tabs .chip { height: 36px; flex: none; font-size: 13.5px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 14px 10px; }
  .card-m { display: flex; flex-direction: column; gap: 4px; border: 0; background: none; color: var(--text); text-align: left; padding: 0; font: inherit; min-width: 0; }
  .card-m b { font-weight: 500; font-size: 13.5px; margin-top: 4px; }
  .card-m span { font-size: 11.5px; color: var(--muted); }
  .card-m.cur :global(.art) { outline: 2px solid var(--accent); outline-offset: 2px; }
  .rows { display: flex; flex-direction: column; gap: 4px; }
  .rows.inner { margin: -4px 0 14px 54px; }
  .row { display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 4px 8px; border-radius: var(--r-md); border: 1px solid transparent; background: none; color: var(--text); text-align: left; font: inherit; }
  .row:hover { background: var(--surface); }
  .row.slim { min-height: 40px; }
  .row.cur { border-color: var(--accent-border); background: var(--accent-soft); }
  .t { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .t b { font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .t i { font-style: normal; font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .n { width: 26px; text-align: center; color: var(--muted); }
  .dur { font-size: 12px; color: var(--muted); }
  .live { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: var(--accent); color: var(--on-accent); }
  .pl { display: flex; align-items: center; gap: 10px; padding: 6px 8px; }
  .row-btn, .back { height: 34px; padding: 0 12px; border-radius: var(--r-pill); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); font: 500 13px var(--font-ui); display: inline-flex; align-items: center; gap: 6px; }
  .back { align-self: flex-start; }
  .sh { font: 600 12px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 6px 0 0 8px; }
  :global([data-trend="minimal"]) .row, :global([data-trend="minimal"]) .row-btn, :global([data-trend="minimal"]) .back { border-radius: 0; }
</style>
