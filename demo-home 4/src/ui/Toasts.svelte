<script lang="ts">
  import { home } from '../client/store.svelte';
  import { go } from '../client/router.svelte';
  import Icon from './Icon.svelte';
  // Всплывающие тревожные события: звонок, движение. Ведут на охрану.
  let shown = $state<{ id: number; title: string; text: string } | null>(null);
  let lastId = home.s?.events[0]?.id ?? 0;
  let timer = 0;
  $effect(() => {
    const e = home.s?.events[0];
    if (e && e.id > lastId) {
      lastId = e.id;
      if (e.kind === 'warn') { shown = e; clearTimeout(timer); timer = setTimeout(() => (shown = null), 7000) as unknown as number; }
    }
  });
</script>

{#if shown}
  {#key shown.id}
    <div class="toast" role="status">
      <span class="ic"><Icon name={shown.title.startsWith('Звонок') ? 'bell' : 'cam'} size={20} /></span>
      <div class="tx"><b>{shown.title}</b><span>{shown.text}</span></div>
      <button class="chip on press" onclick={() => { go('security'); shown = null; }}>Камера</button>
      <button class="x" aria-label="Закрыть" onclick={() => (shown = null)}><Icon name="x" size={18} /></button>
    </div>
  {/key}
{/if}

<style>
  .toast { position: fixed; z-index: 40; top: calc(14px + env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%); width: min(480px, calc(100% - 24px));
    display: flex; align-items: center; gap: 12px; padding: 10px 10px 10px 12px; border-radius: 22px; background: var(--glass); border: 1px solid var(--border-strong);
    -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px); box-shadow: 0 18px 50px rgba(0,0,0,.35); animation: drop .8s var(--spring) both; }
  @keyframes drop { from { transform: translate(-50%, -140%); } to { transform: translate(-50%, 0); } }
  .ic { width: 40px; height: 40px; flex: none; border-radius: 14px; display: grid; place-items: center; background: var(--danger-soft); color: var(--danger); }
  .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .tx b { font-weight: 600; }
  .tx span { font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .chip { height: 38px; padding: 0 14px; }
  .x { width: 36px; height: 36px; border: 0; background: none; color: var(--muted); display: grid; place-items: center; }
  :global([data-trend="minimal"]) .toast { border-radius: 2px; background: var(--surface); backdrop-filter: none; box-shadow: none; border-color: var(--text); }
  :global([data-trend="minimal"]) .ic { border-radius: 0; }
</style>
