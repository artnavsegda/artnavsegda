<script lang="ts">
  import { theme } from '../client/theme.svelte';
  import type { RouteName } from '../client/router.svelte';
  import NavBase from './NavBase.svelte';
  import WarmNav from './warm/Nav.svelte';
  import MinimalNav from './minimal/Nav.svelte';
  import NordicNav from './nordic/Nav.svelte';
  import BrutalNav from './brutal/Nav.svelte';
  import { hideOn } from './nav.svelte';
  // У каждого тренда своя навигация: свои значки, своя механика. «Минимализм» — базовая.
  let { current }: { current: RouteName } = $props();
  const id = $derived(theme.t.id);
</script>

{#if theme.profile === 'tablet'}
  {#if id === 'nordic'}<NordicNav {current} tablet />
  {:else if id === 'brutal'}<BrutalNav {current} tablet />
  {:else}<NavBase {current} rail={id === 'warm'} />{/if}
{:else if !hideOn(current)}
  {#if id === 'warm'}<WarmNav {current} />
  {:else if id === 'minimal'}<MinimalNav {current} />
  {:else if id === 'nordic'}<NordicNav {current} />
  {:else}<BrutalNav {current} />{/if}
{/if}
