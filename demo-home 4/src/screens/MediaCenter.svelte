<script lang="ts">
  import MediaApp from '../media/App.svelte';
  import { theme } from '../client/theme.svelte';
  // Вкладка «Медиа» — настоящий медиацентр: зоны дома в разрезе, плеер, медиатека, пульт, путь сигнала.
</script>

<MediaApp embedded device={theme.profile} />
