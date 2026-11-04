<script lang="ts">
  import { theme, tokenRGB } from '../client/theme.svelte';
  import { Fluid } from '../client/gl/fluid';
  // Живой фон тренда. Если тренд его не предусматривает — просто не монтируем.
  let { energy = 0, fixed = true }: { energy?: number; fixed?: boolean } = $props();
  let canvas: HTMLCanvasElement;
  let fl: Fluid | null = null;
  $effect(() => { fl = new Fluid(canvas); return () => fl?.destroy(); });
  $effect(() => {
    void theme.mode; void theme.t.id;
    // токены уже применены к корню к моменту следующего кадра
    requestAnimationFrame(() => fl?.setColors(tokenRGB('--fluid-a'), tokenRGB('--fluid-b'), tokenRGB('--fluid-c'), tokenRGB('--fluid-glow')));
  });
  $effect(() => { fl?.setEnergy(energy); });
</script>

<canvas bind:this={canvas} class:fixed aria-hidden="true"></canvas>

<style>
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; }
  canvas.fixed { position: fixed; }
</style>
