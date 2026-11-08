<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import { S, ui, engine, act } from './state.svelte';
  import { channels } from '../../model/media/library.ts';

  // Пульт строится по профилю источника, который сейчас в зоне. Для ИК-устройств — честная пометка:
  // команда ушла, но подтверждения нет.
  const zid = $derived(ui.zone);
  const ses = $derived(S.zone[zid].session);
  const node = $derived(ses ? engine.nodes[ses.source] : undefined);
  const kind = $derived(ses?.activity === 'tv' ? 'smarttv' : node?.kind);
  const ir = $derived(!!node?.via?.includes('ИК'));
  let flash = $state('');
  let timer: ReturnType<typeof setTimeout>;
  function key(k: string) {
    flash = k; clearTimeout(timer); timer = setTimeout(() => (flash = ''), 900);
    if (k === 'Пауза/Пуск') act(() => engine.toggle(zid));
    if (k === '«' || k === '»') act(() => engine.seek(zid, k === '«' ? -30 : 30));
    if (k === 'Канал +' || k === 'Канал −' || /^\d$/.test(k)) {
      const cur = S.src[ses!.source].content;
      const i = Math.max(0, channels.findIndex(c => c.id === cur?.id));
      const n = /^\d$/.test(k) ? (+k || 10) - 1 : (i + (k === 'Канал +' ? 1 : channels.length - 1)) % channels.length;
      act(() => engine.play(zid, channels[Math.min(n, channels.length - 1)]));
    }
  }
  let sx = 0, sy = 0;
  const down = (e: PointerEvent) => { sx = e.clientX; sy = e.clientY; };
  const up = (e: PointerEvent) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.hypot(dx, dy) < 12) return key('OK');
    key(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'Вправо' : 'Влево') : (dy > 0 ? 'Вниз' : 'Вверх'));
  };
</script>

<div class="rm">
  {#if !ses}
    <p class="label">Пульт появится, когда в зоне что-то включено.</p>
  {:else}
    <div class="hd">
      <b>{ses.activity === 'tv' ? 'Телевизор' : node?.name}</b>
      <span class="label">{ir ? 'ИК · без обратной связи' : node?.via ?? ''}</span>
    </div>
    <div class="flash" aria-live="polite">{flash ? `${ir ? 'ИК →' : '→'} ${flash}` : ' '}</div>

    {#if kind === 'appletv'}
      <div class="pad" role="button" tabindex="0" aria-label="Сенсорная панель: свайп — навигация, касание — выбор"
        onpointerdown={down} onpointerup={up} onkeydown={(e) => e.key === 'Enter' && key('OK')}>
        <span>свайп · касание</span>
      </div>
      <div class="row3">
        <button class="k press" onclick={() => key('Меню')}>Меню</button>
        <button class="k press" onclick={() => key('Домой')}><Icon name="media" size={18} /></button>
        <button class="k press" aria-label="Пауза или пуск" onclick={() => key('Пауза/Пуск')}><Icon name="play" size={18} /></button>
      </div>
    {:else if kind === 'streamer'}
      <div class="row3">
        <button class="k press" aria-label="Назад" onclick={() => key('«')}><Icon name="back" /></button>
        <button class="k big press" aria-label="Пауза или пуск" onclick={() => key('Пауза/Пуск')}><Icon name="play" /></button>
        <button class="k press" aria-label="Дальше" onclick={() => key('»')}><Icon name="next" /></button>
      </div>
    {:else}
      <div class="dpad">
        <button class="d up press" aria-label="Вверх" onclick={() => key('Вверх')}><Icon name="up" /></button>
        <button class="d left press" aria-label="Влево" onclick={() => key('Влево')}><Icon name="back" /></button>
        <button class="d ok press" onclick={() => key('OK')}>OK</button>
        <button class="d right press" aria-label="Вправо" onclick={() => key('Вправо')}><Icon name="next" /></button>
        <button class="d down press" aria-label="Вниз" onclick={() => key('Вниз')}><Icon name="down" /></button>
      </div>
      <div class="row3">
        <button class="k press" onclick={() => key('Назад')}>Назад</button>
        <button class="k press" onclick={() => key(kind === 'kodi' ? 'Инфо' : kind === 'sat' ? 'Программа' : 'Домой')}>{kind === 'kodi' ? 'Инфо' : kind === 'sat' ? 'Программа' : 'Домой'}</button>
        <button class="k press" onclick={() => key(kind === 'kodi' ? 'Меню' : 'Источник')}>{kind === 'kodi' ? 'Меню' : 'Источник'}</button>
      </div>
      {#if kind === 'kodi'}
        <div class="row3">
          <button class="k press" aria-label="Назад 30 секунд" onclick={() => key('«')}><Icon name="back" /></button>
          <button class="k press" aria-label="Пауза или пуск" onclick={() => key('Пауза/Пуск')}><Icon name="pause" /></button>
          <button class="k press" aria-label="Вперёд 30 секунд" onclick={() => key('»')}><Icon name="next" /></button>
        </div>
      {:else}
        <div class="row3">
          <button class="k press" onclick={() => key('Канал −')}>Канал −</button>
          <button class="k press" onclick={() => key('Пауза/Пуск')}>Пауза</button>
          <button class="k press" onclick={() => key('Канал +')}>Канал +</button>
        </div>
        {#if kind === 'sat'}
          <div class="nums">
            {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as n}<button class="k press num" onclick={() => key(n)}>{n}</button>{/each}
          </div>
        {/if}
      {/if}
    {/if}
  {/if}
</div>

<style>
  .rm { display: flex; flex-direction: column; gap: 12px; align-items: stretch; }
  .hd { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .flash { height: 18px; font-size: 13px; color: var(--accent-text); text-align: center; }
  .pad { height: 220px; border-radius: var(--r-xl); background: var(--surface-2); border: 1px solid var(--border); display: grid; place-items: center; color: var(--muted); font-size: 13px; touch-action: none; user-select: none; cursor: pointer; }
  .pad:active { background: var(--surface); }
  .row3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .k { height: 52px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--surface); color: var(--text); font: 500 14px var(--font-ui); display: grid; place-items: center; }
  .k.big { background: var(--text); color: var(--bg); }
  .dpad { position: relative; width: 220px; height: 220px; margin: 0 auto; border-radius: 50%; background: var(--surface-2); border: 1px solid var(--border); }
  .d { position: absolute; width: 64px; height: 64px; border: 0; background: none; color: var(--text); display: grid; place-items: center; border-radius: 50%; }
  .d:active { background: var(--surface); }
  .up { top: 6px; left: 78px; } .down { bottom: 6px; left: 78px; } .left { left: 6px; top: 78px; } .right { right: 6px; top: 78px; }
  .ok { left: 70px; top: 70px; width: 80px; height: 80px; background: var(--surface); border: 1px solid var(--border-strong); font: 600 16px var(--font-ui); }
  .nums { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .nums .k { height: 44px; }
  :global([data-trend="minimal"]) .k, :global([data-trend="minimal"]) .pad { border-radius: 0; }
</style>
