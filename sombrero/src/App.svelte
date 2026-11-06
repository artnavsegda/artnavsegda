<script lang="ts">
  import type { Component } from 'svelte';
  import Header from './components/Header.svelte';
  import Footer from './components/Footer.svelte';
  import Home from './pages/Home.svelte';
  import History from './pages/History.svelte';
  import Billing from './pages/Billing.svelte';
  import Self from './pages/Self.svelte';
  import Login from './pages/Login.svelte';
  import Register from './pages/Register.svelte';
  import { router, go } from './lib/router.svelte';
  import { store } from './lib/state.svelte';

  type Route = { page: Component; access: 'auth' | 'guest' };

  const routes: Record<string, Route> = {
    '/': { page: Home, access: 'auth' },
    '/history': { page: History, access: 'auth' },
    '/billing': { page: Billing, access: 'auth' },
    '/self': { page: Self, access: 'auth' },
    '/login': { page: Login, access: 'guest' },
    '/register': { page: Register, access: 'guest' }
  };

  const route = $derived(routes[router.path]);
  const allowed = $derived(!!route && (route.access === 'auth' ? !!store.user : !store.user));
  const Page = $derived(route?.page);

  $effect(() => {
    const path = router.path;
    if (path === '/logout') {
      store.logout();
      go('/login');
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
    {#if allowed && Page}
      <Page />
    {/if}
  </main>
  <Footer />
</div>
