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
    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-700 select-none data-highlighted:bg-stone-100 data-highlighted:text-stone-900';

  const name = $derived(store.user?.login ?? store.user?.telegram?.username ?? '?');
</script>

<header class="sticky top-0 z-30 border-b border-stone-200 bg-white/85 backdrop-blur-lg">
  <div class="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4 sm:gap-4">
    <a href="#/" class="flex items-center gap-2.5">
      <Logo class="size-8" />
      <span class="hidden text-lg font-bold tracking-tight text-stone-900 sm:inline">Sombrero</span>
    </a>

    {#if store.user}
      <nav class="ml-4 hidden gap-1 md:flex">
        {#each nav as n (n.href)}
          <a
            href="#{n.href}"
            class="rounded-lg px-3 py-1.5 text-sm transition {router.path === n.href
              ? 'bg-stone-100 text-stone-900'
              : 'text-stone-500 hover:text-stone-900'}"
          >
            {n.label}
          </a>
        {/each}
      </nav>

      <div class="ml-auto flex items-center gap-1.5 sm:gap-2">
        <a
          href="#/billing"
          class="rounded-lg bg-stone-50 px-2.5 py-1.5 font-mono text-xs text-brand-purple ring-1 ring-stone-200 transition hover:ring-brand-purple/40 sm:px-3 sm:text-sm"
        >
          {money(store.balance)}
        </a>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-stone-800 transition hover:bg-stone-100"
          >
            <span class="flex size-6 items-center justify-center rounded-md bg-brand-lime text-xs font-bold text-brand-ink">
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span class="hidden max-w-32 truncate sm:inline">{name}</span>
            <Icon name="chevron" class="size-3.5 text-stone-400" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={8}
              align="end"
              class="z-50 w-52 rounded-xl border border-stone-200 bg-white p-1 shadow-xl shadow-stone-900/10"
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
              <div class="my-1 h-px bg-stone-200"></div>
              <DropdownMenu.Item class="{item} text-rose-600 data-highlighted:text-rose-700" onSelect={() => go('/logout')}>
                <Icon name="logout" /> Выйти
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    {:else}
      <div class="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Button href="#/login" variant="ghost" size="sm">Войти</Button>
        <Button href="#/register" size="sm">Регистрация</Button>
      </div>
    {/if}
  </div>

  {#if store.user}
    <nav class="flex gap-1 overflow-x-auto border-t border-stone-200 px-4 py-2 md:hidden">
      {#each nav as n (n.href)}
        <a
          href="#{n.href}"
          class="rounded-lg px-3 py-1.5 text-sm whitespace-nowrap {router.path === n.href
            ? 'bg-stone-100 text-stone-900'
            : 'text-stone-500'}"
        >
          {n.label}
        </a>
      {/each}
    </nav>
  {/if}
</header>
