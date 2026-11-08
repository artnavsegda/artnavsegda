<script lang="ts">
  import { theme } from '../client/theme.svelte';
  import WarmSummary from '../skins/warm/Summary.svelte';
  import MinimalSummary from '../skins/minimal/Summary.svelte';
  import NordicSummary from '../skins/nordic/Summary.svelte';
  import BrutalSummary from '../skins/brutal/Summary.svelte';
  // «Сводка» — первая страница приложения. У каждого тренда своя; данные общие (derive, nav, store).
  const id = $derived(theme.t.id);
</script>

{#key id}
  {#if id === 'warm'}<WarmSummary />{:else if id === 'minimal'}<MinimalSummary />{:else if id === 'nordic'}<NordicSummary />{:else}<BrutalSummary />{/if}
{/key}
