<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { home } from './client/store.svelte';
  import { theme, applyTheme } from './client/theme.svelte';
  import { route } from './client/router.svelte';
  import Ambient from './ui/Ambient.svelte';
  import Nav from './ui/Nav.svelte';
  import DemoConsole from './ui/DemoConsole.svelte';
  import Toasts from './ui/Toasts.svelte';
  import Dom from './screens/Dom.svelte';
  import RoomPhoto from './screens/RoomPhoto.svelte';
  import RoomPage from './screens/RoomPage.svelte';
  import Rooms from './screens/Rooms.svelte';
  import Overview from './screens/Overview.svelte';
  import House from './screens/House.svelte';
  import Security from './screens/Security.svelte';
  import Home from './screens/Home.svelte';
  import Climate from './screens/Climate.svelte';
  import MediaCenter from './screens/MediaCenter.svelte';
  import Device from './screens/Device.svelte';
  import AR from './screens/AR.svelte';
  import MiniPlayer from './media/MiniPlayer.svelte';
  import MediaOverlays from './media/Overlays.svelte';

  applyTheme();

  const screens = { plan: Dom, rooms: Rooms, room: RoomPage, photo: RoomPhoto, overview: Overview, house: House, security: Security, home: Home, climate: Climate, media: MediaCenter, lamp: Device, ar: AR };
  const name = $derived(route.name || (theme.profile === 'tablet' ? 'plan' : 'home'));
  const Screen = $derived(screens[name]);
  // экраны с фото на весь экран сами рисуют фон
  const immersive = $derived(name === 'photo' || name === 'ar' || name === 'house' || name === 'lamp');
  const energy = $derived(name === 'media' && home.s?.devices['living.tv']?.playing ? 1 : 0);

  // Своя позиция прокрутки у каждого экрана, как у вкладок в нативном приложении.
  // Прокручивается main (iPad и телефон в рамке) или сам документ (телефон).
  let mainEl: HTMLElement = $state()!;
  const scroller = () => (theme.profile === 'tablet' || theme.framed ? mainEl : document.scrollingElement as HTMLElement | null);
  const saved: Record<string, number> = {};
  let prevKey = '';
  $effect.pre(() => {
    const key = name + '|' + route.arg;
    untrack(() => {
      const el = scroller();
      if (prevKey && prevKey !== key && el) saved[prevKey] = el.scrollTop;
      prevKey = key;
      tick().then(() => { const e = scroller(); if (e) e.scrollTop = saved[key] ?? 0; });
    });
  });
  // повторный тап по активной вкладке — наверх
  $effect(() => {
    const top = () => scroller()?.scrollTo({ top: 0, behavior: 'smooth' });
    addEventListener('tab-reselect', top);
    return () => removeEventListener('tab-reselect', top);
  });

</script>

{#if home.s}
  <div class="stage" class:framed={theme.framed}>
    <div class="app {theme.profile} nav-{theme.t.skins.nav}" class:immersive>
      {#if theme.t.features.ambient && !immersive}<Ambient fixed={!theme.framed} {energy} />{/if}
      <Nav current={name} />
      <main bind:this={mainEl}>
        {#key name + route.arg}
          <Screen arg={route.arg} />
        {/key}
      </main>
      <Toasts />
      {#if !immersive}<MiniPlayer bottom={theme.profile === 'phone' ? 'calc(92px + env(safe-area-inset-bottom, 0px))' : 18} left={theme.profile === 'tablet' && theme.t.skins.nav === 'rail' ? 110 : 16} />{/if}
      <MediaOverlays />
    </div>
  </div>
  <DemoConsole current={name} />
{:else}
  <div class="boot">Подключение к дому…</div>
{/if}

<style>
  .stage { min-height: 100dvh; }
  .app { position: relative; isolation: isolate; min-height: 100dvh; --screen-h: 100dvh; }
  .app.tablet.nav-topbar { --screen-h: calc(100dvh - 64px); }
  .app.tablet { display: flex; height: 100dvh; }
  .app.tablet.nav-topbar { flex-direction: column; }
  main { position: relative; flex: 1; min-width: 0; min-height: 0; }
  .tablet main { overflow-y: auto; overflow-x: hidden; }
  .phone main { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
  .phone.immersive main { padding-bottom: 0; }

  /* телефон в рамке — для показа с ноутбука или iPad */
  .stage.framed { display: grid; place-items: center; height: 100dvh; padding: 24px; overflow: hidden; }
  .framed .app { width: 390px; height: min(844px, calc(100dvh - 48px)); min-height: 0; border-radius: 48px; overflow: hidden;
    box-shadow: 0 0 0 10px #0a0a0b, 0 0 0 11px rgba(255,255,255,.12), 0 40px 90px rgba(0,0,0,.45); background: var(--bg); background-image: var(--bg-img);
    transform: translateZ(0); --screen-h: min(844px, calc(100dvh - 48px)); }
  .framed main { height: 100%; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
  .framed main::-webkit-scrollbar { display: none; }
  .boot { display: grid; place-items: center; height: 100dvh; color: var(--muted); font-family: var(--font-ui); }
</style>
