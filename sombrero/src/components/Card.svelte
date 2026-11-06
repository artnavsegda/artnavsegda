<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title?: string;
    description?: string;
    actions?: Snippet;
    class?: string;
    children: Snippet;
  };

  let { title, description, actions, class: cls = '', children }: Props = $props();
</script>

<section class="rounded-2xl border border-stone-800/90 bg-stone-900/50 p-5 shadow-xl shadow-black/20 backdrop-blur sm:p-6 {cls}">
  {#if title || actions}
    <header class="mb-4 flex items-start justify-between gap-4">
      <div>
        {#if title}<h2 class="text-base font-semibold tracking-tight text-stone-50">{title}</h2>{/if}
        {#if description}<p class="mt-1 text-sm text-stone-400">{description}</p>{/if}
      </div>
      {#if actions}<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>{/if}
    </header>
  {/if}
  {@render children()}
</section>
