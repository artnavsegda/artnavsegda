<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'telegram';
    size?: 'sm' | 'md' | 'lg';
    href?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    full?: boolean;
    onclick?: (e: MouseEvent) => void;
    class?: string;
    children: Snippet;
  };

  let {
    variant = 'primary',
    size = 'md',
    href,
    type = 'button',
    disabled = false,
    full = false,
    onclick,
    class: cls = '',
    children
  }: Props = $props();

  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple';

  const variants = {
    primary: 'bg-brand-purple text-white shadow-sm hover:brightness-110 active:translate-y-px',
    secondary: 'bg-stone-100 text-stone-800 ring-1 ring-inset ring-stone-200 hover:bg-stone-200',
    ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
    danger: 'bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-100',
    telegram: 'bg-sky-500 text-white hover:bg-sky-400'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  const classes = $derived(`${base} ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${cls}`);
</script>

{#if href}
  <a {href} class={classes}>{@render children()}</a>
{:else}
  <button {type} {disabled} {onclick} class={classes}>{@render children()}</button>
{/if}
