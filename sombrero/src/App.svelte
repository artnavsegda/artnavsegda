<script lang="ts">
  import type { Component } from 'svelte';
  import Header from './components/Header.svelte';
  import Footer from './components/Footer.svelte';
  import Landing from './pages/Landing.svelte';
  import Home from './pages/Home.svelte';
  import History from './pages/History.svelte';
  import Billing from './pages/Billing.svelte';
  import Self from './pages/Self.svelte';
  import Login from './pages/Login.svelte';
  import Register from './pages/Register.svelte';
  import { router, go } from './lib/router.svelte';
  import { store } from './lib/state.svelte';

  type Route = { page: Component; access: 'auth' | 'guest' };

  // '/' — особый случай: для гостя это публичный лендинг, для вошедшего — проверка номеров.
  const routes: Record<string, Route> = {
    '/history': { page: History, access: 'auth' },
    '/billing': { page: Billing, access: 'auth' },
    '/self': { page: Self, access: 'auth' },
    '/login': { page: Login, access: 'guest' },
    '/register': { page: Register, access: 'guest' }
  };

  const isRoot = $derived(router.path === '/');
  const route = $derived(routes[router.path]);
  const allowed = $derived(isRoot || (!!route && (route.access === 'auth' ? !!store.user : !store.user)));
  const Page = $derived(isRoot ? (store.user ? Home : Landing) : route?.page);

  $effect(() => {
    if (store.booting) return; // ждём проверки сессии (GET /auth/session), чтобы не дёргать на /login уже вошедших
    const path = router.path;
    if (path === '/logout') {
      store.logout().then(() => go('/login'));
    } else if (isRoot) {
      return; // доступен и гостю, и вошедшему — ничего редиректить не нужно
    } else if (!route) {
      go(store.user ? '/' : '/login');
    } else if (route.access === 'auth' && !store.user) {
      go('/login');
    } else if (route.access === 'guest' && store.user) {
      go('/');
    }
  });
</script>

<div class="flex min-h-screen flex-col">
  <Header />
  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
    {#if store.booting}
      <div class="flex flex-col items-center gap-3 py-24 text-sm text-stone-500">
        <img src="/brand/logo-anim.png" alt="" class="size-16" />
        Загрузка…
      </div>
    {:else if allowed && Page}
      <Page />
    {/if}
  </main>
  <Footer />
</div>
