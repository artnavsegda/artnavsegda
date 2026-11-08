<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Art from './Art.svelte';
  import { S, engine, act, fmt, hash } from './state.svelte';
  import { mc, activeZones, sourceOf } from './mc.svelte';
  import { movies, series, channels, radio, playlists, appleApps, hits, smartLists, continueList, search, meta, reviews, type Item } from './catalog';
  import type { Content } from '../../model/media/engine.ts';

  // Медиа: сначала — что посмотреть и послушать, место выбирается в момент «Смотреть».
  // Страница фильма, сериала или плейлиста — как в медиатеке Kodi: рейтинги, актёры, серии, треки.
  let cat = $state<'all' | 'video' | 'music' | 'tv'>('all');
  const cats = [{ id: 'all', n: 'Всё' }, { id: 'video', n: 'Кино и сериалы' }, { id: 'music', n: 'Музыка' }, { id: 'tv', n: 'ТВ' }] as const;
  const want = (c: Content, queue?: Content[]) => (mc.where = { c, queue });
  const open = (it: Item) => { mc.page = it; scrollTo?.({ top: 0 }); };
  const found = $derived(search(mc.q));
  const cont = continueList();
  const now = $derived(activeZones().filter(z => S.zone[z].session).map(z => ({ z, src: sourceOf(z)! })).filter(x => x.src.content));
  const heroHue = $derived(now[0] ? hash(now[0].src.content!.art) % 360 : cont[0] ? hash(cont[0].c.art) % 360 : 30);
  const show = (k: 'video' | 'music' | 'tv') => cat === 'all' || cat === k;

  // страница
  const pg = $derived(mc.page);
  let season = $state(0);
  const pm = $derived(pg?.type === 'movie' ? meta(pg.m.id, pg.m.title) : pg?.type === 'series' ? meta(pg.s.id, pg.s.title) : null);
  const resumeEp = $derived(pg?.type === 'series' ? cont.find(x => x.item.type === 'series' && x.item.s.id === pg.s.id) : undefined);
  const shuffle = (a: Content[]) => [...a].sort((x, y) => hash(x.id + 'r') - hash(y.id + 'r'));
</script>

{#if pg}
  <article class="page rise" style="--hue:{pg.type === 'movie' ? hash(pg.m.art) % 360 : pg.type === 'series' ? hash(pg.s.art) % 360 : pg.type === 'playlist' ? hash(pg.p.art) % 360 : 30}">
    <button class="back press" onclick={() => (mc.page = null)}><Icon name="back" size={18} />Медиа</button>
    {#if pg.type === 'movie' || pg.type === 'series'}
      {@const t = pg.type === 'movie' ? pg.m : pg.s}
      <header class="hero-pg">
        <div class="poster"><Art art={t.art} kind="movie" title={t.title} size="fill" /></div>
        <div class="hx">
          <span class="eyebrow">{pg.type === 'movie' ? 'Фильм' : 'Сериал'} · {pm?.quality}</span>
          <h1>{t.title}</h1>
          <p class="metaL">{t.year} · {t.genre}{pg.type === 'movie' ? ` · ${Math.round((pg.m.dur ?? 0) / 60)} мин · ${pg.m.rating}` : ` · ${pg.s.seasons.length} сез.`}</p>
          <div class="rates">
            <span class="rt kp"><b class="num">{pm?.ratings.kp.toFixed(1)}</b>Кинопоиск</span>
            <span class="rt imdb"><b class="num">{pm?.ratings.imdb.toFixed(1)}</b>IMDb</span>
          </div>
          <div class="acts">
            {#if pg.type === 'movie'}
              {@const r = pm?.progress ?? 0}
              <button class="primary press" onclick={() => want(r ? { ...pg.m, pos: (pg.m.dur ?? 0) * r } : pg.m)}><Icon name="play" size={18} />{r ? `Продолжить с ${fmt((pg.m.dur ?? 0) * r)}` : 'Смотреть'}</button>
              {#if r}<button class="ghost press" onclick={() => want(pg.m)}>С начала</button>{/if}
            {:else}
              {@const first = resumeEp?.c ?? pg.s.seasons[0].episodes[0]}
              <button class="primary press" onclick={() => want(first, pg.s.seasons.flatMap(x => x.episodes))}><Icon name="play" size={18} />{resumeEp ? `Продолжить · ${first.sub}` : 'Смотреть с первой серии'}</button>
            {/if}
          </div>
        </div>
      </header>
      <p class="tag">«{pm?.tagline}»</p>
      {#if pg.type === 'movie'}<p class="about">{pg.m.about}</p>{/if}
      <dl class="people">
        <div><dt>Режиссёр</dt><dd>{pm?.director}</dd></div>
        <div><dt>В ролях</dt><dd>{pm?.cast.join(', ')}</dd></div>
        <div><dt>Звук</dt><dd>{pm?.audio.join(' · ')}</dd></div>
        <div><dt>Субтитры</dt><dd>{pm?.subs.length} дорожки найдено · выбор в плеере</dd></div>
      </dl>
      {#if pg.type === 'series'}
        <div class="seasons" role="tablist">{#each pg.s.seasons as s, i}<button role="tab" aria-selected={season === i} class:on={season === i} onclick={() => (season = i)}>Сезон {s.n}</button>{/each}</div>
        <ol class="eps">
          {#each pg.s.seasons[Math.min(season, pg.s.seasons.length - 1)].episodes as e, i (e.id)}
            {@const r = meta(e.id, e.title).progress}
            <li><button class="ep press" onclick={() => want(r ? { ...e, pos: (e.dur ?? 0) * r } : e, pg.s.seasons.flatMap(x => x.episodes))}>
              <span class="en num">{i + 1}</span><span class="et"><b>{e.title}</b><i>{Math.round((e.dur ?? 0) / 60)} мин{r ? ` · просмотрено ${Math.round(r * 100)}%` : ''}</i>{#if r}<span class="pbar"><span style="width:{r * 100}%"></span></span>{/if}</span><Icon name="play" size={16} />
            </button></li>
          {/each}
        </ol>
      {/if}
      <section class="links"><h2>Отзывы и оценки</h2><div class="lrow">{#each reviews(t.title) as l}<a href={l.url} target="_blank" rel="noopener" class="lk">{l.name}<Icon name="next" size={14} /></a>{/each}</div></section>
    {:else if pg.type === 'playlist'}
      <header class="hero-pg pl">
        <div class="poster sq"><Art art={pg.p.art} kind="track" title={pg.p.title} size="fill" /></div>
        <div class="hx">
          <span class="eyebrow">{'rule' in pg.p ? 'Умный плейлист' : 'Плейлист'} · {pg.p.tracks.length} треков</span>
          <h1>{pg.p.title}</h1><p class="metaL">{pg.p.sub}</p>
          <div class="acts">
            <button class="primary press" onclick={() => want(pg.p.tracks[0], pg.p.tracks)}><Icon name="play" size={18} />Слушать</button>
            <button class="ghost press" onclick={() => { const q = shuffle(pg.p.tracks); want(q[0], q); }}>Перемешать</button>
          </div>
        </div>
      </header>
      <ol class="tracks">
        {#each pg.p.tracks as t, i (t.id)}
          <li><button class="trk press" onclick={() => want(t, pg.p.tracks)}><span class="en num">{i + 1}</span><span class="et"><b>{t.title}</b><i>{t.sub}</i></span><span class="num dur">{fmt(t.dur)}</span></button></li>
        {/each}
      </ol>
    {/if}
  </article>
{:else}
  <div class="home">
    <label class="search"><Icon name="search" size={18} /><input type="search" placeholder="Фильм, сериал, артист, канал…" bind:value={mc.q} aria-label="Поиск по медиатеке" /></label>

    {#if mc.q.trim()}
      <section><h2>Найдено</h2>
        {#if found.length}
          <div class="grid">
            {#each found as it, i (i)}
              {@const c = it.type === 'movie' ? it.m : it.type === 'series' ? { ...it.s, kind: 'movie' } : it.type === 'playlist' ? { ...it.p, kind: 'track' } : it.c}
              <button class="pc press" onclick={() => (it.type === 'channel' || it.type === 'radio' ? want(it.c) : open(it))}>
                <Art art={c.art} kind={c.kind} title={c.title} size="fill" /><b>{c.title}</b>
              </button>
            {/each}
          </div>
        {:else}<p class="quiet">Ничего не нашлось</p>{/if}
      </section>
    {:else}
      <div class="cats" role="tablist">{#each cats as c}<button role="tab" aria-selected={cat === c.id} class:on={cat === c.id} onclick={() => (cat = c.id)}>{c.n}</button>{/each}</div>

      <!-- афиша: что играет сейчас или что было начато -->
      {#if now.length}
        {@const x = now[0]}
        <button class="hero press rise" style="--hue:{heroHue}" onclick={() => (mc.full = x.z)}>
          <div class="hbg"><Art art={x.src.content!.art} kind={x.src.content!.kind} title="" size="fill" /></div>
          <span class="eyebrow"><span class="live"></span>Сейчас · {x.src.zones.map(z => engine.zones[z].name).join(', ')}</span>
          <b class="ht">{x.src.content!.title}</b><i class="hs">{x.src.content!.sub}</i>
          {#if x.src.content!.dur}<span class="pbar big"><span style="width:{((x.src.content!.pos ?? 0) / x.src.content!.dur) * 100}%"></span></span>{/if}
          <span class="hcta">{x.src.playing ? 'Играет' : 'Пауза'} · открыть плеер<Icon name="next" size={16} /></span>
        </button>
      {:else if cont[0] && show('video')}
        {@const x = cont[0]}
        <button class="hero press rise" style="--hue:{heroHue}" onclick={() => want(x.c, x.item.type === 'series' ? x.item.s.seasons.flatMap(s => s.episodes) : undefined)}>
          <div class="hbg"><Art art={x.c.art} kind="movie" title="" size="fill" /></div>
          <span class="eyebrow">Продолжить просмотр</span>
          <b class="ht">{x.item.type === 'series' ? x.item.s.title : x.c.title}</b><i class="hs">{x.item.type === 'series' ? x.c.sub + ' · ' + x.c.title : x.c.sub}</i>
          <span class="pbar big"><span style="width:{x.p * 100}%"></span></span>
          <span class="hcta"><Icon name="play" size={16} />Продолжить с {fmt(x.c.pos)}</span>
        </button>
      {/if}

      {#if show('video')}
        {#if cont.length > 1}
          <section><h2>Продолжить</h2><div class="row">
            {#each cont as x (x.c.id)}
              <button class="wide press" onclick={() => want(x.c, x.item.type === 'series' ? x.item.s.seasons.flatMap(s => s.episodes) : undefined)}>
                <div class="wa"><Art art={x.c.art} kind="movie" title="" size="fill" /><span class="pbar"><span style="width:{x.p * 100}%"></span></span></div>
                <b>{x.item.type === 'series' ? x.item.s.title : x.c.title}</b><i>{x.item.type === 'series' ? x.c.sub : `осталось ${Math.round((x.c.dur ?? 0) * (1 - x.p) / 60)} мин`}</i>
              </button>
            {/each}
          </div></section>
        {/if}
        <section><h2>Фильмы <span class="cnt">{movies.length}</span></h2><div class="row">
          {#each movies as m (m.id)}
            <button class="pc press" onclick={() => open({ type: 'movie', m })}><Art art={m.art} kind="movie" title={m.title} size="fill" /><b>{m.title}</b><i>{m.year} · {meta(m.id, m.title).ratings.kp.toFixed(1)} ★</i></button>
          {/each}
        </div></section>
        <section><h2>Сериалы</h2><div class="row">
          {#each series as s (s.id)}
            <button class="pc press" onclick={() => open({ type: 'series', s })}><Art art={s.art} kind="movie" title={s.title} size="fill" /><b>{s.title}</b><i>{s.seasons.length} сез. · {s.genre}</i></button>
          {/each}
        </div></section>
      {/if}

      {#if show('music')}
        <section><h2>Хиты недели</h2>
          <ol class="hits">
            {#each hits.slice(0, 6) as t, i (t.id)}
              <li><button class="trk press" onclick={() => want(t, hits)}><span class="en num">{i + 1}</span><Art art={t.art} kind="track" size="s" /><span class="et"><b>{t.title}</b><i>{t.sub}</i></span><span class="num dur">{fmt(t.dur)}</span></button></li>
            {/each}
          </ol>
        </section>
        <section><h2>Умные плейлисты</h2><div class="row">
          {#each smartLists as p (p.id)}
            <button class="sq press" onclick={() => open({ type: 'playlist', p })}><Art art={p.art} kind="track" title={p.title} size="fill" /><b>{p.title}</b><i>{p.rule}</i></button>
          {/each}
        </div></section>
        <section><h2>Плейлисты</h2><div class="row">
          {#each playlists as p (p.id)}
            <button class="sq press" onclick={() => open({ type: 'playlist', p })}><Art art={p.art} kind="track" title={p.title} size="fill" /><b>{p.title}</b><i>{p.tracks.length} треков · {p.sub}</i></button>
          {/each}
        </div></section>
        <section><h2>Радио</h2><div class="row">
          {#each radio as r (r.id)}
            <button class="round press" onclick={() => want(r)}><Art art={r.art} kind="radio" title={r.title} size="fill" /><b>{r.title}</b><i>{r.sub}</i></button>
          {/each}
        </div></section>
      {/if}

      {#if show('tv')}
        <section><h2>Телеканалы</h2><div class="row">
          {#each channels as c (c.id)}
            <button class="sq press" onclick={() => want(c)}><Art art={c.art} kind="channel" title={c.title} size="fill" /><b>{c.title.replace(/^\d+ · /, '')}</b><i>{c.sub}</i></button>
          {/each}
        </div></section>
        <section><h2>Apple TV</h2><div class="row">
          {#each appleApps as c (c.id)}
            <button class="sq sm press" onclick={() => want(c)}><Art art={c.art} kind="app" title={c.title} size="fill" /><b>{c.title}</b></button>
          {/each}
        </div></section>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .home, .page { display: flex; flex-direction: column; gap: 22px; padding-bottom: 24px; }
  h2 { margin: 0 0 10px; font: 500 18px var(--font-display); letter-spacing: -.01em; display: flex; align-items: baseline; gap: 8px; }
  .cnt { font: 400 13px var(--font-ui); color: var(--muted); }
  .search { display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 14px; border-radius: var(--r-pill); background: var(--surface); border: 1px solid var(--border); color: var(--muted); backdrop-filter: blur(14px); }
  .search input { flex: 1; min-width: 0; border: 0; background: none; color: var(--text); font: 15px var(--font-ui); outline: none; }
  .cats { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin-top: -8px; }
  .cats button, .seasons button { flex: none; height: 34px; padding: 0 14px; border-radius: var(--r-pill); border: 1px solid var(--border); background: var(--surface); color: var(--sub); font: 500 13px var(--font-ui); }
  .cats button.on, .seasons button.on { background: var(--text); color: var(--bg); border-color: transparent; }
  .row { display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 0 16px 4px; scroll-padding-inline: 16px; scroll-snap-type: x proximity; }
  .row::after { content: ""; flex: none; width: 4px; }
  :global(.tablet) .row { margin: 0; padding: 0 0 4px; scroll-padding-inline: 0; }
  .pc, .sq, .round, .wide { flex: none; display: flex; flex-direction: column; gap: 4px; border: 0; background: none; padding: 0; color: var(--text); text-align: left; scroll-snap-align: start; font: inherit; }
  .pc { width: 128px; } .sq { width: 140px; } .sq.sm { width: 100px; } .round { width: 112px; } .wide { width: 232px; }
  .round :global(.art) { border-radius: 50%; }
  .pc b, .sq b, .round b, .wide b { font-size: 13.5px; font-weight: 500; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pc i, .sq i, .round i, .wide i { font-style: normal; font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .wa { position: relative; border-radius: var(--r-md); overflow: hidden; aspect-ratio: 16 / 9; }
  .wa :global(.art) { aspect-ratio: auto; height: 100%; }
  .wa .pbar { position: absolute; left: 10px; right: 10px; bottom: 8px; }
  .pbar { display: block; height: 4px; border-radius: 2px; background: rgba(255,255,255,.25); overflow: hidden; }
  .pbar span { display: block; height: 100%; background: var(--accent); border-radius: inherit; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; }
  .grid .pc { width: auto; }
  .quiet { color: var(--muted); margin: 0; }
  /* афиша */
  .hero { position: relative; display: flex; flex-direction: column; justify-content: flex-end; gap: 4px; min-height: 230px; padding: 20px; border-radius: var(--r-xl, 28px); overflow: hidden; border: 0; text-align: left; color: #F6F2EC; font: inherit; isolation: isolate;
    background: linear-gradient(160deg, hsl(var(--hue) 45% 28%), hsl(calc(var(--hue) + 40) 50% 10%)); box-shadow: 0 24px 60px hsl(var(--hue) 50% 10% / .45); }
  :global(.tablet) .hero { min-height: 300px; padding: 32px; }
  .hbg { position: absolute; inset: 0; z-index: -1; opacity: .55; }
  .hbg :global(.art) { aspect-ratio: auto; height: 100%; border-radius: 0; }
  .hero::after { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, transparent 20%, rgba(0,0,0,.65)); }
  .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; opacity: .85; }
  .live { width: 8px; height: 8px; border-radius: 50%; background: #7CC6D6; animation: pulse 2s infinite; }
  @keyframes pulse { 50% { box-shadow: 0 0 0 6px rgba(124,198,214,0); } 0%, 100% { box-shadow: 0 0 0 0 rgba(124,198,214,.6); } }
  .ht { font: var(--display-weight, 300) 32px/1.05 var(--font-display); letter-spacing: -.02em; }
  :global(.tablet) .ht { font-size: 44px; }
  .hs { font-style: normal; font-size: 14px; opacity: .8; }
  .pbar.big { margin-top: 10px; max-width: 320px; }
  .hcta { margin-top: 12px; align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 16px; border-radius: 19px; background: rgba(255,255,255,.92); color: #1b1712; font: 600 14px var(--font-ui); }
  /* хиты и треки */
  .hits, .tracks, .eps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  :global(.tablet) .hits { display: grid; grid-template-columns: 1fr 1fr; column-gap: 20px; }
  .trk, .ep { width: 100%; display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 6px 8px; border: 0; border-radius: var(--r-md); background: none; color: var(--text); text-align: left; font: inherit; }
  .trk:hover, .ep:hover { background: var(--surface); }
  .en { width: 22px; text-align: center; color: var(--muted); font-size: 14px; flex: none; }
  .et { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .et b { font-weight: 500; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .et i { font-style: normal; font-size: 12.5px; color: var(--muted); }
  .et .pbar { height: 3px; max-width: 200px; margin-top: 3px; background: var(--border-strong); }
  .dur { font-size: 12.5px; color: var(--muted); }
  /* страница */
  .back { align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; height: 36px; padding: 0 14px 0 8px; border-radius: 18px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font: 500 14px var(--font-ui); }
  .hero-pg { display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 18px; align-items: end; padding: 18px; border-radius: var(--r-xl, 28px); color: #F6F2EC;
    background: radial-gradient(120% 90% at 0% 0%, hsl(var(--hue) 50% 32%), hsl(calc(var(--hue) + 40) 50% 9%)); box-shadow: 0 24px 60px hsl(var(--hue) 50% 10% / .4); }
  :global(.tablet) .hero-pg { grid-template-columns: 220px minmax(0, 1fr); padding: 28px; gap: 28px; }
  .poster { border-radius: var(--r-md); overflow: hidden; box-shadow: 0 18px 40px rgba(0,0,0,.45); }
  .hx { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  h1 { margin: 0; font: var(--display-weight, 300) 30px/1.05 var(--font-display); letter-spacing: -.02em; text-wrap: balance; }
  :global(.tablet) h1 { font-size: 46px; }
  .metaL { margin: 0; font-size: 13.5px; opacity: .8; }
  .rates { display: flex; gap: 8px; flex-wrap: wrap; }
  .rt { display: inline-flex; align-items: baseline; gap: 6px; height: 30px; padding: 0 10px; border-radius: 15px; background: rgba(255,255,255,.12); font-size: 12px; align-items: center; }
  .rt b { font: 600 15px var(--font-ui); } .kp b { color: #FF8A3D; } .imdb b { color: #F5C518; }
  .acts { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
  .primary { display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 18px; border-radius: 22px; border: 0; background: #F6F2EC; color: #1b1712; font: 600 14.5px var(--font-ui); }
  .ghost { height: 44px; padding: 0 16px; border-radius: 22px; border: 1px solid rgba(255,255,255,.35); background: none; color: inherit; font: 500 14px var(--font-ui); }
  .tag { margin: 0; font: italic 400 17px/1.4 var(--font-display); color: var(--sub); }
  .about { margin: -10px 0 0; font-size: 15px; line-height: 1.55; color: var(--text); max-width: 64ch; }
  .people { margin: 0; display: grid; grid-template-columns: 1fr; gap: 10px; }
  :global(.tablet) .people { grid-template-columns: 1fr 1fr; }
  .people div { display: flex; flex-direction: column; gap: 2px; }
  dt { font-size: 12px; color: var(--muted); letter-spacing: .06em; text-transform: uppercase; }
  dd { margin: 0; font-size: 14.5px; }
  .seasons { display: flex; gap: 6px; }
  .links h2 { font-size: 15px; }
  .lrow { display: flex; gap: 8px; flex-wrap: wrap; }
  .lk { display: inline-flex; align-items: center; gap: 4px; height: 36px; padding: 0 14px; border-radius: 18px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font: 500 13.5px var(--font-ui); text-decoration: none; }
  .hero-pg.pl .poster.sq :global(.art) { aspect-ratio: 1; }
  :global([data-trend="minimal"]) .hero, :global([data-trend="minimal"]) .hero-pg, :global([data-trend="minimal"]) .search { border-radius: 0; }
</style>
