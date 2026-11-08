<script lang="ts">
  // Процедурная обложка: цвет — из ключа, композиция — по виду контента. Чужих постеров не храним.
  import { hash } from './state.svelte';
  let { art = '', kind = 'movie', title = '', size = 'm' }: { art?: string; kind?: string; title?: string; size?: 's' | 'm' | 'l' | 'fill' } = $props();
  const h = $derived(hash(art));
  const hue = $derived(h % 360);
  const hue2 = $derived((hue + 40 + (h >> 8) % 80) % 360);
  const shape = $derived((h >> 4) % 3);
  const short = $derived(title.replace(/^\d+ · /, ''));
</script>

<div class="art {size} {kind}" style="--h:{hue}; --h2:{hue2}" aria-hidden="true">
  {#if kind === 'channel'}
    <b class="num">{title.split(' · ')[0]}</b>
  {:else if kind === 'radio' || kind === 'track'}
    <span class="disc"></span>
  {:else if kind === 'app'}
    <span class="tile"></span>
  {:else}
    <span class="geo g{shape}"></span>
    {#if size !== 's'}<em>{short}</em>{/if}
  {/if}
</div>

<style>
  .art { position: relative; overflow: hidden; border-radius: var(--r-md); aspect-ratio: 2 / 3; flex: none;
    background: linear-gradient(160deg, hsl(var(--h) 45% 30%), hsl(var(--h2) 55% 14%)); color: #F4F1EC; }
  .art.radio, .art.track, .art.app, .art.channel { aspect-ratio: 1; }
  .s { width: 44px; border-radius: 10px; }
  .m { width: 120px; }
  .l { width: min(240px, 60vw); border-radius: var(--r-lg); box-shadow: 0 24px 60px rgba(0,0,0,.35); }
  .fill { width: 100%; }
  .geo { position: absolute; inset: 0; }
  .g0 { background: radial-gradient(circle at 70% 30%, hsl(var(--h2) 80% 70% / .55) 0 22%, transparent 23%); }
  .g1 { background: linear-gradient(180deg, transparent 55%, hsl(var(--h) 70% 65% / .35) 55% 62%, transparent 62%), radial-gradient(circle at 30% 40%, hsl(var(--h2) 70% 75% / .35) 0 14%, transparent 15%); }
  .g2 { background: repeating-linear-gradient(115deg, hsl(var(--h2) 60% 70% / .14) 0 8px, transparent 8px 22px); }
  em { position: absolute; left: 10%; right: 10%; bottom: 9%; font-style: normal; font-family: var(--font-display); font-weight: 500; line-height: 1.05;
    font-size: clamp(12px, 1.1em, 22px); text-wrap: balance; letter-spacing: -.01em; }
  .m em { font-size: 14px; }
  .l em, .fill em { font-size: 24px; }
  .disc { position: absolute; inset: 18%; border-radius: 50%; background: radial-gradient(circle, hsl(var(--h) 30% 12%) 0 14%, hsl(var(--h2) 70% 70% / .5) 15% 17%, transparent 18% 40%, hsl(var(--h2) 70% 70% / .3) 41% 42%, transparent 43%); border: 1px solid hsl(var(--h2) 70% 75% / .35); }
  .tile { position: absolute; inset: 28%; border-radius: 22%; background: hsl(var(--h2) 70% 75% / .35); }
  .num { position: absolute; inset: 0; display: grid; place-items: center; font-family: var(--font-display); font-weight: 400; font-size: 2.2em; }
  .s .num { font-size: 18px; }
  :global([data-trend="minimal"]) .art { border-radius: 0; }
</style>
