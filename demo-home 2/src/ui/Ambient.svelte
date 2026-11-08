<script lang="ts">
  import { theme } from '../client/theme.svelte';
  import { home } from '../client/store.svelte';
  import { house } from '../core/house';
  import { Fluid } from '../client/gl/fluid';
  // Живой фон из дизайн-концепта: палитра — настроение дома. Горит свет — теплеет и проступает сильнее,
  // все ушли — остывает. Под музыку (energy) фон чуть ярче.
  let { energy = 0, fixed = true }: { energy?: number; fixed?: boolean } = $props();
  let canvas: HTMLCanvasElement;
  let fl: Fluid | null = null;
  $effect(() => { fl = new Fluid(canvas, .5); return () => fl?.destroy(); });
  const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const mood = $derived.by(() => {
    const s = home.s; if (!s) return { away: false, warm: 0 };
    const away = s.security.mode === 'full' || Object.values(s.presence).every(n => !n) && !s.walker;
    const lit = new Set(house.devices.filter(d => d.caps.includes('dimmer') && (s.devices[d.id]?.level ?? 0) > 0).map(d => d.room)).size;
    return { away, warm: away ? 0 : lit / 4 };
  });
  $effect(() => {
    const day = theme.mode === 'day', { away, warm } = mood;
    const pal = day ? (away ? ['#E9EEF1', '#D8E4EA', '#F1F3F3', '#F4F1EC'] : ['#FFF1DC', '#F9D9AE', '#E3EFF4', '#F4F1EC'])
      : (away ? ['#0E1418', '#15232B', '#0D1114', '#0B0C0E'] : ['#1E1610', '#4A2E14', '#0F2128', '#0B0C0E']);
    fl?.setColors(rgb(pal[0]), rgb(pal[1]), rgb(pal[2]), rgb(pal[3]));
    fl?.setEnergy(Math.min(1, .55 + .45 * Math.min(1, warm + (day ? .5 : .2)) + energy * .15));
  });
</script>

<canvas bind:this={canvas} class:fixed aria-hidden="true"></canvas>

<style>
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; }
  canvas.fixed { position: fixed; }
</style>
