<script lang="ts">
  import { go, type RouteName } from '../../client/router.svelte';
  import { navItems, isActive, armed, routeStatus } from '../nav.svelte';
  // «Брутализм»: никаких значков. Внизу — одна строка «[01] ДОМ ——— ОГЛАВЛЕНИЕ /05».
  // Оглавление — на весь экран, огромным рубленым капсом, у каждого раздела его состояние. Цифры 1–5 на клавиатуре — разделы.
  let { current, tablet = false }: { current: RouteName; tablet?: boolean } = $props();
  const items = $derived(navItems());
  const idx = $derived(Math.max(0, items.findIndex(r => isActive(current, r.name))));
  let open = $state(false);
  const pick = (n: RouteName) => { open = false; go(n); };
  const nn = (i: number) => String(i + 1).padStart(2, '0');
  function key(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
    const t = e.target as HTMLElement; if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
    const n = Number(e.key); if (n >= 1 && n <= items.length) pick(items[n - 1].name);
  }
</script>

<svelte:window onkeydown={key} />

<nav class="bar" class:tablet aria-label="Разделы">
  <button class="here" onclick={() => (open = !open)} aria-label="Текущий раздел — открыть оглавление">
    <span class="n">[{nn(idx)}]</span><b>{items[idx]?.title}</b><span class="dash" aria-hidden="true"></span>
  </button>
  <button class="idx" aria-expanded={open} onclick={() => (open = !open)}>{open ? '× ЗАКРЫТЬ' : 'ОГЛАВЛЕНИЕ'}<span>/{nn(items.length - 1)}</span></button>
</nav>

{#if open}
  <div class="toc" class:tablet role="dialog" aria-modal="true" aria-label="Оглавление">
    <ol>
      {#each items as r, i (r.name)}
        <li><button class:on={i === idx} onclick={() => pick(r.name)}>
          <span class="n">{nn(i)}</span><span class="t"><b>{r.title}{#if r.name === 'security' && armed()}<i class="bang">!</i>{/if}</b><em>{routeStatus(r.name)}</em></span><span class="go" aria-hidden="true">→</span>
        </button></li>
      {/each}
    </ol>
  </div>
{/if}

<style>
  .bar { position: fixed; z-index: 22; left: 0; right: 0; bottom: 0; display: flex; align-items: stretch; height: calc(52px + env(safe-area-inset-bottom, 0px)); padding: 0 0 env(safe-area-inset-bottom, 0px);
    background: var(--accent); color: var(--on-accent); border-top: 2px solid var(--border); }
  .bar.tablet { position: relative; flex: none; height: 52px; border-top: 0; border-bottom: 2px solid var(--border); }
  button { border: 0; background: none; color: inherit; font: 600 13px var(--font-ui); text-transform: uppercase; }
  .here { flex: 1; display: flex; align-items: center; gap: 10px; padding: 0 0 0 max(14px, env(safe-area-inset-left, 0px)); min-width: 0; }
  .here b { font: 900 20px/1 var(--font-display); letter-spacing: -.03em; white-space: nowrap; }
  .dash { flex: 1; height: 2px; background: currentColor; margin-right: 12px; }
  .idx { display: flex; align-items: center; gap: 4px; padding: 0 max(14px, env(safe-area-inset-right, 0px)) 0 14px; background: var(--inv-bg); color: var(--inv-text); }
  .idx span { font-weight: 400; }
  .toc { position: fixed; z-index: 21; inset: 0 0 calc(52px + env(safe-area-inset-bottom, 0px)) 0; overflow: auto; display: flex; flex-direction: column; justify-content: flex-end;
    background: var(--bg); background-image: var(--bg-img); padding: max(16px, env(safe-area-inset-top, 0px)) max(14px, env(safe-area-inset-right, 0px)) 14px max(14px, env(safe-area-inset-left, 0px)); animation: jolt .24s steps(3, end) both; }
  .toc.tablet { inset: 52px 0 0 0; justify-content: flex-start; }
  ol { list-style: none; margin: 0; padding: 0; border: 2px solid var(--border); box-shadow: var(--hard); background: var(--surface); }
  li + li { border-top: 2px solid var(--border); }
  ol button { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px; color: var(--text); text-align: left; }
  ol button:hover, ol button.on { background: var(--accent); color: var(--on-accent); }
  .n { font-weight: 600; flex: none; }
  .t { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .t b { font: 900 clamp(30px, 10vw, 64px)/.9 var(--font-display); letter-spacing: -.05em; overflow-wrap: anywhere; }
  .t em { font-style: normal; font-size: 11px; font-weight: 600; }
  .go { font: 900 28px var(--font-display); }
  .bang { color: var(--danger); font-style: normal; margin-left: 4px; }
</style>
