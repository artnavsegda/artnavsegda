<script lang="ts">
  // Сегментный переключатель. Подложка меряет реальную кнопку:
  // подписи разной длины («Авто» / «Охлаждение») не ломают вёрстку.
  let { options, value, onchange, label = '' }: { options: { id: string; name: string }[]; value: string; onchange: (v: string) => void; label?: string } = $props();
  let root: HTMLDivElement;
  let btns: HTMLButtonElement[] = $state([]);
  let thumb = $state({ x: 0, w: 0 });
  let ready = $state(false);
  const idx = $derived(options.findIndex(o => o.id === value));

  function measure() {
    const b = btns[idx];
    if (!b) return;
    thumb = { x: b.offsetLeft, w: b.offsetWidth };
    // активный пункт всегда виден, если пунктов больше, чем места
    if (b.offsetLeft < root.scrollLeft || b.offsetLeft + b.offsetWidth > root.scrollLeft + root.clientWidth)
      root.scrollTo({ left: b.offsetLeft - 8, behavior: ready ? 'smooth' : 'auto' });
    if (!ready) requestAnimationFrame(() => (ready = true));
  }
  $effect(() => { void idx; void options.length; measure(); });
  $effect(() => {
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  });
</script>

<div class="seg" bind:this={root} role="radiogroup" aria-label={label}>
  <span class="thumb" class:ready class:none={idx < 0} style="width:{thumb.w}px; transform: translateX({thumb.x}px)"></span>
  {#each options as o, i}
    <button bind:this={btns[i]} role="radio" aria-checked={o.id === value} class:on={o.id === value} onclick={() => onchange(o.id)}>{o.name}</button>
  {/each}
</div>

<style>
  .seg { position: relative; display: flex; gap: 2px; padding: 4px; border-radius: var(--r-pill); background: var(--surface-2); min-width: 0; overflow-x: auto; scrollbar-width: none; }
  .seg::-webkit-scrollbar { display: none; }
  .thumb { position: absolute; top: 4px; bottom: 4px; left: 0; border-radius: var(--r-pill); background: var(--inv-bg); }
  .thumb.ready { transition: transform var(--dur-m) var(--spring), width var(--dur-m) var(--spring); }
  .thumb.none { opacity: 0; }
  button { position: relative; flex: 1 0 auto; border: 0; background: none; height: 38px; padding: 0 12px; border-radius: var(--r-pill); color: var(--sub); font-weight: 500; font-size: 14px; white-space: nowrap; transition: color var(--dur-m) var(--ease-out); }
  button.on { color: var(--inv-text); }
  :global([data-trend="minimal"]) .seg { background: transparent; border: 1px solid var(--border-strong); padding: 0; gap: 0; }
  :global([data-trend="minimal"]) .thumb { top: 0; bottom: 0; }
  :global([data-trend="minimal"]) button { padding: 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; font-weight: 600; }
</style>
