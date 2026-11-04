<script lang="ts">
  import { theme } from '../client/theme.svelte';
  // Один контрол — два скина. Тёплый вечер: мягкая «таблетка» с пружиной.
  // Минимализм: клавиша-рокер, подписи I/O моноширинным.
  let { on, onchange, label = '', big = false }: { on: boolean; onchange: (v: boolean) => void; label?: string; big?: boolean } = $props();
  const skin = $derived(theme.t.skins.toggle);
</script>

<button class="tg {skin}" class:on class:big role="switch" aria-checked={on} aria-label={label}
  onclick={(e) => { e.stopPropagation(); onchange(!on); }}>
  {#if skin === 'rocker'}
    <span class="num">{on ? 'ON' : 'OFF'}</span>
  {/if}
  <i></i>
</button>

<style>
  .tg { position: relative; flex: none; border: 0; padding: 0; }
  .pill { width: 52px; height: 32px; border-radius: 999px; background: var(--track); transition: background-color var(--dur-m) var(--ease-light); }
  .pill i { position: absolute; left: 3px; top: 3px; width: 26px; height: 26px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.25);
    transition: transform var(--dur-m) var(--spring), width var(--dur-s) var(--ease-out); }
  .pill:active i { width: 32px; }
  .pill.on { background: var(--accent); }
  .pill.on i { transform: translateX(20px); }
  .pill.on:active i { transform: translateX(14px); }
  .pill.big { width: 64px; height: 38px; }
  .pill.big i { width: 32px; height: 32px; }
  .pill.big.on i { transform: translateX(26px); }

  .rocker { display: flex; align-items: center; justify-content: flex-end; gap: 0; width: 64px; height: 30px; border: 1px solid var(--border-strong); border-radius: var(--r-sm); background: transparent; padding: 0 8px; }
  .rocker span { position: absolute; left: 8px; font-size: 11px; letter-spacing: .06em; color: var(--muted); transition: color var(--dur-s); }
  .rocker i { width: 10px; height: 10px; border-radius: 1px; background: var(--border-strong); transition: background-color var(--dur-s) var(--ease-out); }
  .rocker.on { border-color: var(--text); }
  .rocker.on span { color: var(--text); }
  .rocker.on i { background: var(--accent); }
  .rocker.big { width: 76px; height: 36px; }
</style>
