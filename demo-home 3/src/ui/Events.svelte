<script lang="ts">
  import { home } from '../client/store.svelte';
  let { limit = 5, kind = '' }: { limit?: number; kind?: string } = $props();
  const list = $derived((home.s?.events ?? []).filter(e => !kind || e.kind === kind || (kind === 'security' && e.kind === 'warn')).slice(0, limit));
</script>

<ol class="ev">
  {#each list as e (e.id)}
    <li class="{e.kind}">
      <i></i>
      <div><b>{e.title}</b><span>{e.text}</span></div>
      <time class="num">{e.time}</time>
    </li>
  {/each}
</ol>

<style>
  .ev { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  li { display: grid; grid-template-columns: 10px 1fr auto; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--border); animation: rise .7s var(--ease-out) both; }
  li:last-child { border-bottom: 0; }
  i { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); }
  .scene i { background: var(--accent); }
  .security i { background: var(--ok); }
  .warn i { background: var(--danger); box-shadow: 0 0 0 4px var(--danger-soft); }
  div { min-width: 0; display: flex; flex-direction: column; }
  b { font-weight: 500; font-size: 14px; }
  span { font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  time { font-size: 12px; color: var(--muted); }
  :global([data-trend="minimal"]) i { border-radius: 0; width: 6px; height: 6px; }
</style>
