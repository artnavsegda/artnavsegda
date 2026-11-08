<script lang="ts">
  import { theme } from '../client/theme.svelte';
  import WarmHome from '../skins/warm/Home.svelte';
  import MinimalHome from '../skins/minimal/Home.svelte';
  import NordicHome from '../skins/nordic/Home.svelte';
  import BrutalHome from '../skins/brutal/Home.svelte';
  // «Дом» — у каждого тренда своя первая страница. Механика общая: src/client/domscene.svelte.ts.
  const id = $derived(theme.t.id);
</script>

{#key id}
  {#if id === 'warm'}<WarmHome />{:else if id === 'minimal'}<MinimalHome />{:else if id === 'nordic'}<NordicHome />{:else}<BrutalHome />{/if}
{/key}
