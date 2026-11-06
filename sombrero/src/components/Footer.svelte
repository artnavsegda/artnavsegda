<script lang="ts">
  import Logo from './Logo.svelte';
  import { store } from '../lib/state.svelte';

  const year = new Date().getFullYear();
</script>

<footer class="mt-16 border-t border-stone-800/80">
  <div class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-stone-500 sm:flex-row">
    <div class="flex items-center gap-2.5">
      <Logo class="size-6 opacity-80" />
      <span>© {year} Sombrero. Быстро, чисто, без лишних вопросов.</span>
    </div>
    {#if store.user}
      <nav class="flex gap-5">
        <a href="#/" class="transition hover:text-stone-200">Проверка</a>
        <a href="#/history" class="transition hover:text-stone-200">История</a>
        <a href="#/billing" class="transition hover:text-stone-200">Биллинг</a>
        <a href="#/self" class="transition hover:text-stone-200">Профиль</a>
      </nav>
    {/if}
  </div>
</footer>
