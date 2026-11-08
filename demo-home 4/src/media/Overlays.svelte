<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Art from './Art.svelte';
  import Where from './Where.svelte';
  import FullPlayer from './FullPlayer.svelte';
  import { S, ui, engine, act } from './state.svelte';
  import { mc } from './mc.svelte';

  // Всё, что всплывает поверх любой вкладки: выбор комнаты, полноэкранный плеер, конфликт источника, сообщения движка.
  let { toasts = true }: { toasts?: boolean } = $props();
  let toastTimer: ReturnType<typeof setTimeout>;
  $effect(() => { if (ui.toast) { clearTimeout(toastTimer); toastTimer = setTimeout(() => (ui.toast = ''), 3200); } });
  const busyWith = (src: string) => S.src[src]?.content;
  function pick(o: NonNullable<typeof ui.conflict>['options'][number]) {
    const c = ui.conflict!;
    act(() => engine.resolve(c, o, c.activity));
    if (c.content && o.type !== 'share') act(() => engine.play(c.zone, c.content!));
    ui.conflict = null; mc.full = c.zone; mc.tab = '';
  }
</script>

{#if mc.where}<Where />{/if}
{#if mc.full && (S.zone[mc.full]?.session || S.zone[mc.full]?.plan)}<FullPlayer />{/if}

{#if ui.conflict}
  {@const c = ui.conflict}
  {@const other = c.options.find(o => o.type === 'takeover' || o.type === 'share')}
  {@const now = other ? busyWith(other.source) : undefined}
  <div class="scrim" role="presentation" onclick={() => (ui.conflict = null)}></div>
  <div class="cf" role="dialog" aria-modal="true" aria-label="Источник занят">
    <div class="vs">
      {#if c.content}<div class="a"><Art art={c.content.art} kind={c.content.kind} title={c.content.title} size="fill" /><i>вы хотите</i></div>{/if}
      {#if now}<div class="a b"><Art art={now.art} kind={now.kind} title={now.title} size="fill" /><i>сейчас идёт</i></div>{/if}
    </div>
    <b class="t">{c.message}</b>
    <p class="s">{engine.zones[c.zone].name}{now ? ` · сейчас «${now.title}»` : ''}</p>
    <div class="opts">
      {#each c.options as o}
        <button class="opt press" class:danger={o.type === 'takeover'} onclick={() => pick(o)}>
          <span class="oi"><Icon name={o.type === 'takeover' ? 'power' : o.type === 'share' ? 'person' : 'play'} size={18} /></span>
          <span><b>{o.label}</b><i>{o.type === 'share' ? 'один источник, одна картинка в двух комнатах' : o.type === 'other' ? 'свободный проигрыватель, никому не мешаем' : 'там выключится — предупредим'}</i></span>
        </button>
      {/each}
      <button class="cancel press" onclick={() => (ui.conflict = null)}>Отмена</button>
    </div>
  </div>
{/if}

{#if toasts && ui.toast}<div class="toast" role="status">{ui.toast}</div>{/if}

<style>
  .scrim { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.45); animation: fade .2s; }
  .cf { position: fixed; z-index: 61; left: 50%; bottom: max(14px, env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); width: min(440px, calc(100% - 20px)); max-height: calc(100dvh - 40px); overflow: auto;
    display: flex; flex-direction: column; gap: 6px; padding: 18px; border-radius: 28px; color: var(--text);
    background: color-mix(in srgb, var(--surface-solid) 82%, transparent); backdrop-filter: blur(28px) saturate(1.4); -webkit-backdrop-filter: blur(28px) saturate(1.4);
    border: 1px solid var(--border-strong); box-shadow: 0 30px 80px rgba(0,0,0,.45); animation: up .32s var(--ease-out); }
  @keyframes up { from { transform: translate(-50%, 30px); opacity: 0; } }
  @keyframes fade { from { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .cf, .scrim { animation: none; } }
  .vs { display: flex; justify-content: center; gap: 0; margin-bottom: 8px; }
  .a { width: 96px; display: flex; flex-direction: column; align-items: center; gap: 6px; transform: rotate(-4deg); }
  .a.b { transform: rotate(5deg) translateY(6px); margin-left: -14px; }
  .a :global(.art) { aspect-ratio: 2 / 3; border-radius: 12px; box-shadow: 0 12px 30px rgba(0,0,0,.4); }
  .a i { font-style: normal; font-size: 11px; color: var(--muted); }
  .t { font: 500 19px/1.2 var(--font-display); text-align: center; }
  .s { margin: 0 0 6px; font-size: 13px; color: var(--muted); text-align: center; }
  .opts { display: flex; flex-direction: column; gap: 6px; }
  .opt { display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 8px 14px 8px 8px; border-radius: 18px; border: 1px solid var(--border); background: var(--surface); color: var(--text); text-align: left; font: inherit; }
  .oi { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-text); flex: none; }
  .opt.danger .oi { background: color-mix(in srgb, var(--danger) 16%, transparent); color: var(--danger); }
  .opt span:last-child { display: flex; flex-direction: column; min-width: 0; }
  .opt b { font-weight: 500; font-size: 14.5px; } .opt i { font-style: normal; font-size: 12px; color: var(--muted); }
  .cancel { height: 46px; border: 0; background: none; color: var(--sub); font: 500 14px var(--font-ui); }
  .toast { position: fixed; z-index: 70; left: 50%; transform: translateX(-50%); top: max(14px, env(safe-area-inset-top, 0px)); max-width: calc(100% - 32px); pointer-events: none;
    padding: 10px 16px; border-radius: var(--r-pill); background: var(--inv-bg); color: var(--inv-text); font-size: 13.5px; box-shadow: 0 10px 30px rgba(0,0,0,.3); }
  :global([data-trend="minimal"]) .cf, :global([data-trend="minimal"]) .opt, :global([data-trend="minimal"]) .toast { border-radius: 0; }
</style>
