<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import Home from './Home.svelte';
  import MiniPlayer from './MiniPlayer.svelte';
  import Overlays from './Overlays.svelte';
  import { ui, applyTheme, setPref, profile } from './state.svelte';

  // Медиацентр. Сначала контент, комната — в момент «Смотреть». Плеер — мини-плашка и полный экран.
  // embedded — внутри основного приложения: тему задаёт оно, мини-плеер и оверлеи оно же держит над всеми вкладками.
  let { embedded = false, device }: { embedded?: boolean; device?: 'phone' | 'tablet' } = $props();
  if (!embedded) applyTheme();
  $effect(() => { if (embedded && device) ui.frame = device; });
  const prof = $derived(embedded && device ? device : profile());
  const framed = $derived(!embedded && ui.frame === 'phone' && ui.width >= 600);
</script>

<div class="shell {prof}" class:framed class:embedded>
  <div class="device">
    <div class="topbar">
      <b class="brand">Медиа</b>
      <span class="sp"></span>
      <div class="prefs" role="group" aria-label="Настройки показа">
        <button class="pp press" title="Ускорить переходы для показа" class:on={ui.speed > 1} onclick={() => setPref('speed', ui.speed > 1 ? 1 : 5)}>×{ui.speed > 1 ? 5 : 1}</button>
        {#if !embedded}
          <button class="pp press" aria-label="Тренд" onclick={() => setPref('trend', { warm: 'minimal', minimal: 'nordic', nordic: 'brutal', brutal: 'warm' }[ui.trend as 'warm'])}>{({ warm: 'Тёплый', minimal: 'Минимал', nordic: 'Нордик', brutal: 'Брутал' } as Record<string, string>)[ui.trend]}</button>
          <button class="pp press" aria-label="День или ночь" onclick={() => setPref('mode', ui.mode === 'night' ? 'day' : 'night')}><Icon name={ui.mode === 'night' ? 'moon' : 'sun'} size={16} /></button>
          {#if ui.width >= 600}
            <button class="pp press" aria-label="Вид устройства" onclick={() => setPref('frame', ui.frame === 'phone' ? 'auto' : 'phone')}>{ui.frame === 'phone' ? 'iPad' : 'Телефон'}</button>
          {/if}
        {/if}
      </div>
    </div>
    <Home />
    {#if !embedded}
      <MiniPlayer />
      <Overlays />
    {/if}
  </div>
</div>

<style>
  :global(body) { margin: 0; background: var(--bg); background-image: var(--bg-img); color: var(--text); font-family: var(--font-ui); min-height: 100vh; }
  .shell { min-height: 100vh; }
  .embedded.shell, .embedded .device { min-height: 0; }
  .embedded .device { padding-top: max(18px, env(safe-area-inset-top, 0px)); }
  .embedded.tablet .device { padding-top: 28px; }
  .embedded .topbar .brand { font: var(--display-weight, 300) 32px/1.1 var(--font-display); letter-spacing: -.02em; }
  .device { position: relative; display: flex; flex-direction: column; min-height: 100vh; padding-block: max(12px, env(safe-area-inset-top, 0px)) 96px;
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); box-sizing: border-box; }
  .embedded .device { padding-bottom: 80px; }
  .tablet .device { padding-left: max(28px, env(safe-area-inset-left, 0px)); padding-right: max(28px, env(safe-area-inset-right, 0px)); }
  .framed { display: grid; place-items: start center; padding: 24px 0; }
  .framed .device { width: 390px; min-height: 844px; max-height: 844px; overflow: auto; border-radius: 44px; border: 1px solid var(--border-strong); background: var(--bg); background-image: var(--bg-img); box-shadow: 0 30px 80px rgba(0,0,0,.35); transform: translateZ(0); }
  .topbar { display: flex; align-items: center; gap: 8px; min-height: 48px; margin-bottom: 10px; }
  .brand { font-family: var(--font-display); font-weight: var(--display-weight); font-size: 28px; letter-spacing: var(--display-tracking); }
  .sp { flex: 1; }
  .prefs { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
  .pp { height: 32px; min-width: 32px; padding: 0 10px; border-radius: var(--r-pill); border: 1px solid var(--border); background: var(--surface); color: var(--sub); font: 500 12.5px var(--font-ui); display: grid; place-items: center; }
  .pp.on { color: var(--accent-text); border-color: var(--accent-border); }
</style>
