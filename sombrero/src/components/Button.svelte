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
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400';

  const variants = {
    primary:
      'bg-linear-to-b from-amber-400 to-orange-500 text-stone-950 shadow-lg shadow-orange-500/20 hover:from-amber-300 hover:to-orange-400 active:translate-y-px',
    secondary: 'bg-stone-800/70 text-stone-100 ring-1 ring-inset ring-stone-700 hover:bg-stone-800',
    ghost: 'text-stone-300 hover:bg-stone-800/60 hover:text-white',
    danger: 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/30 hover:bg-rose-500/20',
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
