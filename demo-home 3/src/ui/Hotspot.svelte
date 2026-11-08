<script lang="ts">
  import { theme } from '../client/theme.svelte';
  // Точка устройства на фото/плане. Тап — вкл/выкл, удержание или второй тап по подписи — подробнее.
  let { x, y, on, label, sub = '', onclick, onopen, kind = 'light', open = false }:
    { x: number; y: number; on: boolean; label: string; sub?: string; onclick: () => void; onopen?: () => void; kind?: string; open?: boolean } = $props();
  let hover = $state(false);
</script>

<div class="hs" class:on class:min={theme.t.id === 'minimal'} style="left:{x}px; top:{y}px">
  <button class="dot press" aria-label="{label}: {on ? 'выключить' : 'включить'}" aria-pressed={on}
    onclick={onclick} onpointerenter={() => (hover = true)} onpointerleave={() => (hover = false)}>
    {#if on && theme.t.id !== 'minimal' && theme.t.id !== 'brutal'}<span class="ring"></span>{/if}
    <span class="core"></span>
  </button>
  {#if open || hover}
    <button class="tag" onclick={onopen ?? onclick}>
      <b>{label}</b>{#if sub}<span class="num">{sub}</span>{/if}
    </button>
  {/if}
</div>

<style>
  .hs { position: absolute; z-index: 2; transform: translate(-50%, -50%); }
  .dot { position: relative; width: 44px; height: 44px; border: 0; background: none; padding: 0; display: grid; place-items: center; }
  .core { width: 18px; height: 18px; border-radius: 50%; background: rgba(20,20,22,.55); border: 2px solid rgba(255,255,255,.85);
    -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); transition: background-color var(--dur-m) var(--ease-light), transform var(--dur-m) var(--spring), box-shadow var(--dur-m); }
  .on .core { background: #FFD08A; border-color: #fff; box-shadow: 0 0 18px 4px rgba(255,190,110,.65); transform: scale(1.1); }
  .ring { position: absolute; inset: 11px; border-radius: 50%; border: 1.5px solid rgba(255,214,150,.9); animation: pulse 2.6s var(--ease-out) infinite; }
  .tag { position: absolute; left: 50%; bottom: 44px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 1px;
    white-space: nowrap; padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,.18); background: rgba(16,17,20,.72); color: #F2EFEA;
    -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); font-size: 13px; animation: rise .5s var(--ease-out) both; }
  .tag b { font-weight: 600; }
  .tag span { font-size: 12px; opacity: .7; }

  .min .core { width: 14px; height: 14px; border-radius: 0; background: rgba(13,13,13,.6); border: 1.5px solid #fff; backdrop-filter: none; }
  .min.on .core { background: var(--accent); border-color: var(--accent); box-shadow: none; transform: rotate(45deg); }
  .min .tag { border-radius: 2px; background: #0D0D0D; border-color: #0D0D0D; backdrop-filter: none; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
</style>
