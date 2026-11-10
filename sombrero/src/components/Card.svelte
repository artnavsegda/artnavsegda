<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title?: string;
    description?: string;
    actions?: Snippet;
    /** 'tint' — фирменный плоский серый блок (по умолчанию), 'white' — приподнятая белая поверхность (таблицы, панели фильтров). */
    surface?: 'tint' | 'white';
    class?: string;
    children: Snippet;
  };

  let { title, description, actions, surface = 'tint', class: cls = '', children }: Props = $props();

  const surfaces = {
    tint: 'bg-stone-50',
    white: 'bg-white border border-stone-200 shadow-sm shadow-stone-900/5'
  };
</script>

<section class="rounded-xl p-5 sm:p-6 {surfaces[surface]} {cls}">
  {#if title || actions}
    <header class="mb-4 flex items-start justify-between gap-4">
      <div>
        {#if title}<h2 class="text-base font-semibold tracking-tight text-stone-900">{title}</h2>{/if}
        {#if description}<p class="mt-1 text-sm text-stone-500">{description}</p>{/if}
      </div>
      {#if actions}<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>{/if}
    </header>
  {/if}
  {@render children()}
</section>
