<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import Logo from './Logo.svelte';
  import Icon from './Icon.svelte';
  import Button from './Button.svelte';
  import { store } from '../lib/state.svelte';
  import { router, go } from '../lib/router.svelte';
  import { money } from '../lib/format';

  const nav = [
    { href: '/', label: 'Проверка' },
    { href: '/history', label: 'История' },
    { href: '/billing', label: 'Биллинг' }
  ];

  const item =
    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-300 select-none data-highlighted:bg-stone-800 data-highlighted:text-white';
</script>

<header class="sticky top-0 z-30 border-b border-stone-800/80 bg-stone-950/75 backdrop-blur-lg">
  <div class="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
    <a href="#/" class="flex items-center gap-2.5">
      <Logo class="size-8" />
      <span class="text-lg font-bold tracking-tight text-stone-50">Sombrero</span>
    </a>

    {#if store.user}
      <nav class="ml-4 hidden gap-1 md:flex">
        {#each nav as n (n.href)}
          <a
            href="#{n.href}"
            class="rounded-lg px-3 py-1.5 text-sm transition {router.path === n.href
              ? 'bg-stone-800 text-white'
              : 'text-stone-400 hover:text-stone-100'}"
          >
            {n.label}
          </a>
        {/each}
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <a
          href="#/billing"
          class="rounded-lg bg-stone-900 px-3 py-1.5 font-mono text-sm text-amber-300 ring-1 ring-stone-800 transition hover:ring-amber-500/40"
        >
          {money(store.user.balance)}
        </a>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-stone-200 transition hover:bg-stone-800/70"
          >
            <span class="flex size-6 items-center justify-center rounded-full bg-linear-to-b from-amber-400 to-orange-500 text-xs font-bold text-stone-950">
              {store.user.login.slice(0, 1).toUpperCase()}
            </span>
            <span class="hidden max-w-32 truncate sm:inline">{store.user.login}</span>
            <Icon name="chevron" class="size-3.5 text-stone-500" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={8}
              align="end"
              class="z-50 w-52 rounded-xl border border-stone-700 bg-stone-900 p-1 shadow-2xl shadow-black/60"
            >
              <DropdownMenu.Item class={item} onSelect={() => go('/self')}>
                <Icon name="user" /> Профиль
              </DropdownMenu.Item>
              <DropdownMenu.Item class={item} onSelect={() => go('/billing')}>
                <Icon name="wallet" /> Биллинг
              </DropdownMenu.Item>
              <DropdownMenu.Item class={item} onSelect={() => go('/history')}>
                <Icon name="clock" /> История
              </DropdownMenu.Item>
              <div class="my-1 h-px bg-stone-800"></div>
              <DropdownMenu.Item class="{item} text-rose-300 data-highlighted:text-rose-200" onSelect={() => go('/logout')}>
                <Icon name="logout" /> Выйти
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    {:else}
      <div class="ml-auto flex items-center gap-2">
        <Button href="#/login" variant="ghost" size="sm">Войти</Button>
        <Button href="#/register" size="sm">Регистрация</Button>
      </div>
    {/if}
  </div>

  {#if store.user}
    <nav class="flex gap-1 overflow-x-auto border-t border-stone-800/60 px-4 py-2 md:hidden">
      {#each nav as n (n.href)}
        <a
          href="#{n.href}"
          class="rounded-lg px-3 py-1.5 text-sm whitespace-nowrap {router.path === n.href
            ? 'bg-stone-800 text-white'
            : 'text-stone-400'}"
        >
          {n.label}
        </a>
      {/each}
    </nav>
  {/if}
</header>
