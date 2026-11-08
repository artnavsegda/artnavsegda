<script lang="ts">
  import Photo from '../ui/Photo.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import Slider from '../ui/Slider.svelte';
  import Toggle from '../ui/Toggle.svelte';
  import Icon from '../ui/Icon.svelte';
  import { deviceById, roomById, house } from '../core/house';
  import { dev, cmd, ctCss } from '../client/store.svelte';
  import { theme } from '../client/theme.svelte';
  import { go, argDev } from '../client/router.svelte';
  import { LampView } from '../client/three/models';
  import { glowR } from '../client/rooms';

  // Экран устройства: тот же светильник — на фото интерьера или как 3D-модель.
  let { arg = '' }: { arg?: string } = $props();
  const id = deviceById[argDev(arg)] ? argDev(arg) : house.favorites.overview[0];
  const d = deviceById[id];
  const s = $derived(dev(id));
  const on = $derived((s.level ?? 0) > 0);
  const photoId = Object.keys(d.spots ?? {}).find(p => !p.endsWith('-day')) ?? '';
  const spot = d.spots?.[photoId];
  let view = $state<'photo' | '3d'>(photoId ? 'photo' : '3d');

  let canvas: HTMLCanvasElement = $state()!;
  let lv = $state<LampView | null>(null);
  $effect(() => {
    if (view !== '3d' || !canvas) return;
    lv = new LampView(canvas);
    return () => { lv?.destroy(); lv = null; };
  });
  $effect(() => { lv?.set((s.level ?? 0) / 100, s.ct ?? 2700, !theme.night); });

  const cts = [{ id: '2700', name: '2700 K' }, { id: '4000', name: '4000 K' }, { id: '6500', name: '6500 K' }];
  const ctName: Record<number, string> = { 2700: 'тёплый', 4000: 'нейтральный', 6500: 'дневной' };
</script>

<div class="scr {theme.profile}" style="--lamp:{ctCss(s.ct, .9)}">
  <div class="visual rise">
    {#if view === 'photo' && spot}
      <Photo photo={photoId} ox={0.5} oy={0.45} lights={[{ id, x: spot[0], y: spot[1], r: glowR[id] ?? 260 }]}
        dim={(theme.night ? 0.6 : 0.25) * (1 - Math.min(1, (s.level ?? 0) / 70))} />
    {:else}
      <div class="stage3d" class:lit={on}>
        <canvas bind:this={canvas} aria-label="3D-модель светильника, можно вращать"></canvas>
        <span class="hint">потяните, чтобы повернуть</span>
      </div>
    {/if}
    <div class="topbar">
      <button class="round press" aria-label="Назад" onclick={() => history.length > 1 ? history.back() : go(theme.profile === 'tablet' ? 'overview' : 'home')}><Icon name="back" /></button>
      {#if photoId}
        <div class="vt">
          <button class:on={view === 'photo'} onclick={() => (view = 'photo')}>Фото</button>
          <button class:on={view === '3d'} onclick={() => (view = '3d')}>3D</button>
        </div>
      {/if}
    </div>
  </div>

  <section class="ctl">
    <div class="head rise" style="animation-delay:.06s">
      <div>
        <span class="label">{roomById[d.room].name}</span>
        <h1>{d.name}</h1>
        <span class="state num">{on ? `${s.level}% · ${ctName[s.ct ?? 2700] ?? ''}` : 'выключен'}</span>
      </div>
      <Toggle big {on} label={d.name} onchange={(v) => cmd({ cmd: 'light.set', target: id, on: v })} />
    </div>

    <div class="lvl rise" style="animation-delay:.1s">
      <Slider tall={theme.profile === 'tablet'} label="Яркость" value={s.level ?? 0} color={theme.t.skins.slider === 'fill' ? `linear-gradient(0deg, ${ctCss(s.ct, .35)}, ${ctCss(s.ct, 1)})` : ''}
        onchange={(v) => cmd({ cmd: 'light.set', target: id, level: v })} />
    </div>

    {#if d.caps.includes('colorTemp')}
      <div class="rise" style="animation-delay:.14s">
        <div class="label sl">Цветовая температура</div>
        <Segmented label="Цветовая температура" value={String(s.ct ?? 2700)} options={cts} onchange={(v) => cmd({ cmd: 'light.set', target: id, ct: Number(v) })} />
      </div>
    {/if}

    <div class="spec rise" style="animation-delay:.18s">
      <div><span class="label">Модель</span><b>Купол Ø 60 · латунь</b></div>
      <div><span class="label">Драйвер</span><b>DALI DT8</b></div>
      <div><span class="label">Мощность</span><b class="num">{Math.round((s.level ?? 0) * 0.32)} Вт</b></div>
    </div>
  </section>
</div>

<style>
  .scr { display: grid; min-height: var(--screen-h); }
  .tablet { grid-template-columns: minmax(0, 1.25fr) minmax(320px, 400px); gap: 20px; padding: max(20px, env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) 20px 20px; height: var(--screen-h); }
  .phone { grid-template-rows: 54vh auto; }
  :global(.framed) .phone { grid-template-rows: 440px auto; }
  .visual { position: relative; min-height: 0; }
  .visual :global(.ph) { position: absolute; inset: 0; }
  .phone .visual :global(.ph) { border-radius: 0 0 var(--r-xl) var(--r-xl); }
  .stage3d { position: absolute; inset: 0; border-radius: var(--r-xl); overflow: hidden; background: radial-gradient(60% 50% at 50% 70%, color-mix(in srgb, var(--lamp) 0%, transparent), transparent), var(--surface-2); transition: background 1.2s; }
  .phone .stage3d { border-radius: 0 0 var(--r-xl) var(--r-xl); }
  .stage3d.lit { background: radial-gradient(60% 45% at 50% 78%, color-mix(in srgb, var(--lamp) 30%, transparent), transparent 70%), var(--surface-2); }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: none; cursor: grab; }
  .hint { position: absolute; bottom: 14px; left: 0; right: 0; text-align: center; font-size: 12px; color: var(--muted); pointer-events: none; }
  .topbar { position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 16px; }
  .phone .topbar { padding-top: max(16px, env(safe-area-inset-top, 0px)); }
  .round { width: 46px; height: 46px; border-radius: 50%; border: 1px solid rgba(255,255,255,.18); display: grid; place-items: center; background: rgba(14,15,18,.5); color: #fff; -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); }
  .vt { display: flex; padding: 4px; border-radius: 999px; background: rgba(14,15,18,.5); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,.14); }
  .vt button { height: 36px; padding: 0 16px; border: 0; border-radius: 999px; background: none; color: rgba(255,255,255,.75); font-weight: 500; }
  .vt button.on { background: #fff; color: #111; }

  .ctl { display: flex; flex-direction: column; gap: 20px; min-height: 0; }
  .phone .ctl { padding: 20px 16px calc(28px + env(safe-area-inset-bottom, 0px)); }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  h1 { font-size: 30px; margin: 4px 0; }
  .state { color: var(--muted); font-size: 14px; }
  .tablet .lvl { flex: 1; min-height: 200px; display: flex; }
  .tablet .lvl :global(.sl) { flex: 1; }
  .sl { margin-bottom: 8px; }
  .spec { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 14px; border-top: 1px solid var(--border); }
  .spec div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .spec b { font-weight: 500; font-size: 13px; }
  :global([data-trend="minimal"]) .round, :global([data-trend="minimal"]) .vt, :global([data-trend="minimal"]) .vt button { border-radius: 0; backdrop-filter: none; }
  :global([data-trend="minimal"]) .stage3d { border-radius: 0; }
  :global([data-trend="minimal"]) h1 { font-weight: 600; }
</style>
