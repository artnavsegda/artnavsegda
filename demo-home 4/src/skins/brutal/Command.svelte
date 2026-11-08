<script lang="ts">
  import { go, type RouteName } from '../../client/router.svelte';
  import { house } from '../../core/house';
  import { navItems, isActive, armed } from '../nav.svelte';
  import NavBase from '../NavBase.svelte';
  // Командная строка (пока не используется — гиммик «на потом»). Внизу «> куда?» и ряд ссылок в квадратных скобках с номерами.
  // Пишешь «гост» — предлагает Гостиную, Enter — переход. Цифра 1–5 на клавиатуре — раздел.
  let { current, tablet = false }: { current: RouteName; tablet?: boolean } = $props();
  const items = $derived(navItems());
  let q = $state(''), focused = $state(false);
  type Hit = { label: string; kind: string; run: () => void };
  const hits = $derived.by((): Hit[] => {
    const s = q.trim().toLowerCase(); if (!s) return [];
    const r = items.filter(x => x.title.toLowerCase().includes(s)).map(x => ({ label: x.title, kind: 'раздел', run: () => go(x.name) }));
    const rooms = house.rooms.filter(x => x.name.toLowerCase().includes(s)).map(x => ({ label: x.name, kind: 'комната', run: () => go('room', x.id) }));
    return [...r, ...rooms].slice(0, 6);
  });
  const run = (h?: Hit) => { if (!h) return; h.run(); q = ''; (document.activeElement as HTMLElement)?.blur(); };
  function key(e: KeyboardEvent) {
    const t = e.target as HTMLElement; if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
    const n = Number(e.key); if (n >= 1 && n <= items.length) go(items[n - 1].name);
  }
</script>

<svelte:window onkeydown={key} />

{#snippet cmd()}
  <form class="cmd" class:tab={tablet} onsubmit={(e) => { e.preventDefault(); run(hits[0]); }}>
    <span class="p" aria-hidden="true">&gt;</span>
    <input bind:value={q} onfocus={() => (focused = true)} onblur={() => setTimeout(() => (focused = false), 150)} placeholder="куда? дом, медиа, гостиная…" aria-label="Перейти: раздел или комната" enterkeyhint="go" autocomplete="off" spellcheck="false" />
    {#if !q}<span class="cur" aria-hidden="true"></span>{/if}
    {#if focused && hits.length}
      <ul class="hits">{#each hits as h}<li><button type="button" onclick={() => run(h)}><b>{h.label}</b><i>{h.kind}</i></button></li>{/each}</ul>
    {/if}
  </form>
{/snippet}

{#if tablet}
  <NavBase {current} extra={cmd} />
{:else}
  <nav class="term" aria-label="Разделы">
    {@render cmd()}
    <div class="links">
      {#each items as r, i (r.name)}
        {@const on = isActive(current, r.name)}
        <button class:on aria-current={on ? 'page' : undefined} onclick={() => go(r.name)}>[{i + 1}]&nbsp;{r.title}{#if r.name === 'security' && armed()}<b class="bang">!</b>{/if}</button>
      {/each}
    </div>
  </nav>
{/if}

<style>
  .term { position: fixed; z-index: 22; left: 0; right: 0; bottom: 0; padding-bottom: env(safe-area-inset-bottom, 0px); background: var(--inv-bg); color: var(--inv-text); border-top: 2px solid var(--border); }
  .cmd { position: relative; display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; background: var(--accent); color: var(--on-accent); border-bottom: 2px solid var(--ink, #000); font: 600 14px var(--font-ui); }
  .cmd.tab { width: 340px; height: 36px; border: 2px solid var(--border); }
  .p { font-weight: 700; }
  input { flex: 1; min-width: 0; border: 0; background: none; color: inherit; font: inherit; text-transform: uppercase; outline: none; padding: 0; }
  input::placeholder { color: color-mix(in srgb, var(--on-accent) 55%, transparent); }
  .cur { position: absolute; left: 30px; width: 9px; height: 17px; background: var(--on-accent); animation: blink 1s steps(1) infinite; pointer-events: none; }
  input:focus + .cur { display: none; }
  @keyframes blink { 50% { opacity: 0; } }
  .hits { position: absolute; left: -2px; right: -2px; bottom: calc(100% + 2px); list-style: none; margin: 0; padding: 0; background: var(--surface); border: 2px solid var(--border); box-shadow: 4px 4px 0 var(--border); }
  .cmd.tab .hits { top: calc(100% + 4px); bottom: auto; z-index: 30; }
  .hits button { width: 100%; display: flex; justify-content: space-between; gap: 8px; padding: 10px 12px; border: 0; border-bottom: 2px solid var(--border); background: none; color: var(--text); font: 600 13px var(--font-ui); text-transform: uppercase; text-align: left; }
  .hits li:last-child button { border-bottom: 0; }
  .hits button:hover, .hits li:first-child button { background: var(--accent); color: var(--on-accent); }
  .hits i { font-style: normal; font-weight: 400; }
  .links { display: flex; overflow-x: auto; scrollbar-width: none; height: 44px; }
  .links button { flex: none; border: 0; border-right: 2px solid color-mix(in srgb, var(--inv-text) 25%, transparent); background: none; color: var(--inv-text); padding: 0 12px; font: 600 12px var(--font-ui); text-transform: uppercase; white-space: nowrap; }
  .links button.on { background: var(--inv-text); color: var(--inv-bg); text-decoration: underline; text-underline-offset: 3px; }
  .bang { color: var(--danger); margin-left: 3px; }
  @media (prefers-reduced-motion: reduce) { .cur { animation: none; } }
</style>
