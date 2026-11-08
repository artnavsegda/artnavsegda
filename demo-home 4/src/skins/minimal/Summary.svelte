<script lang="ts">
  import DeviceTile from '../../ui/DeviceTile.svelte';
  import { house } from '../../core/house';
  import { home, runScene } from '../../client/store.svelte';
  import { theme } from '../../client/theme.svelte';
  import { go } from '../../client/router.svelte';
  import { greeting, dateLine, roomTemp, fmtT, lightsOn, occupied, sceneOrder } from '../../client/derive.svelte';
  import { activeRooms, floorName, multiFloor } from '../../client/nav.svelte';
  import { stats } from '../../client/domscene.svelte';

  // «Минимализм» — сводка как первая полоса технического журнала: крупный заголовок, примечание на полях,
  // сцены нумерованным списком, комнаты — таблицей. Только линии, текст и один акцент.
  const sug = $derived(home.s?.suggestion);
  const x = $derived(stats());
  const nn = (n: number) => String(n).padStart(2, '0');
  const rooms = $derived(activeRooms().slice(0, 8).map(a => a.r));
</script>

<div class="m {theme.profile}">
  <header class="rise">
    <span class="k">{dateLine()}</span>
    <h1>{greeting()}.</h1>
    <p class="lead">Дома {x.people ? `${x.people} чел.` : 'никого'}, свет в {x.lit} из {x.rooms}, снаружи {fmtT(x.outside)}°. Охрана — <button class="a" onclick={() => go('security')}>{x.secName}</button>.</p>
  </header>

  {#if sug}
    <aside class="note rise">
      <span class="k">Примечание</span>
      <b>{sug.title}</b><p>{sug.text}</p>
      <button class="act" onclick={() => runScene(sug.action.scene)}>{sug.action.label} →</button>
    </aside>
  {/if}

  <section class="rise">
    <h2 class="k">Сцены</h2>
    <ol class="scenes">
      {#each sceneOrder() as s, i (s.id)}
        <li><button class:on={home.s?.scene === s.id} aria-pressed={home.s?.scene === s.id} onclick={() => runScene(s.id)}><span class="num">{nn(i + 1)}</span>{s.name}</button></li>
      {/each}
    </ol>
  </section>

  <section class="rise">
    <div class="hr"><h2 class="k">Сейчас в доме</h2><button class="a" onclick={() => go('rooms')}>Все {house.rooms.length} →</button></div>
    <table>
      <tbody>
        {#each rooms as r (r.id)}
          <tr onclick={() => go('room', r.id)}>
            <td class="nm"><button onclick={() => go('room', r.id)}>{r.name}</button>{#if occupied(r.id)}<i class="p" title="кто-то есть"></i>{/if}</td>
            {#if multiFloor}<td class="fl">{floorName(r.id)}</td>{/if}
            <td class="num">{roomTemp(r.id) !== undefined ? fmtT(roomTemp(r.id)) + '°' : '—'}</td>
            <td class="num" class:acc={lightsOn(r.id) > 0}>{lightsOn(r.id) ? `${lightsOn(r.id)} св.` : '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section class="rise">
    <h2 class="k">Избранное</h2>
    <div class="fav">{#each house.favorites.home as id, i}<DeviceTile {id} delay={i * .03} />{/each}</div>
  </section>
</div>

<style>
  .m { display: flex; flex-direction: column; gap: 28px; max-width: 760px; margin: 0 auto; padding: max(24px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 28px max(16px, env(safe-area-inset-left, 0px)); }
  .m.tablet { padding: 36px 40px; }
  .k { display: block; margin: 0 0 10px; font: 600 11px var(--font-ui); letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
  .k:first-letter { text-transform: uppercase; }
  h1 { margin: 0; font: 500 64px/.92 var(--font-display); letter-spacing: -.055em; }
  .lead { margin: 16px 0 0; font-size: 17px; line-height: 1.45; color: var(--sub); max-width: 34ch; }
  .a { border: 0; background: none; padding: 0; color: var(--text); font: inherit; border-bottom: 1px solid var(--accent); }
  .note { border-left: 2px solid var(--accent); padding: 2px 0 2px 16px; }
  .note b { font: 500 22px/1.15 var(--font-display); letter-spacing: -.02em; }
  .note p { margin: 6px 0 10px; color: var(--sub); font-size: 14.5px; }
  .act { border: 0; background: none; padding: 0; color: var(--accent); font: 600 12px var(--font-ui); letter-spacing: .12em; text-transform: uppercase; }
  .scenes { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--text); }
  .scenes li { border-bottom: 1px solid var(--border); }
  .scenes li:nth-child(odd) { border-right: 1px solid var(--border); }
  .scenes button { width: 100%; display: flex; gap: 12px; align-items: baseline; padding: 14px 10px 14px 0; border: 0; background: none; color: var(--text); font: 500 18px var(--font-display); letter-spacing: -.02em; text-align: left; }
  .scenes li:nth-child(even) button { padding-left: 12px; }
  .scenes .num { font-size: 11px; color: var(--muted); letter-spacing: 0; }
  .scenes button.on, .scenes button.on .num { color: var(--accent); }
  .hr { display: flex; justify-content: space-between; align-items: baseline; }
  .hr .a { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; border-top: 1px solid var(--text); }
  tr { border-bottom: 1px solid var(--border); cursor: pointer; }
  td { padding: 12px 0; font-size: 14px; color: var(--sub); white-space: nowrap; }
  td + td { text-align: right; padding-left: 12px; }
  td.nm { width: 100%; position: relative; }
  td.nm button { border: 0; background: none; padding: 0; color: var(--text); font: 500 16px var(--font-ui); }
  .fl { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .acc { color: var(--accent); }
  .p { display: inline-block; width: 5px; height: 5px; margin-left: 8px; vertical-align: middle; background: var(--accent); }
  .fav { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .tablet .fav { grid-template-columns: repeat(3, minmax(0, 1fr)); }
</style>
