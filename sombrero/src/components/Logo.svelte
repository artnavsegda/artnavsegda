<script lang="ts">
  let { class: cls = 'size-8' }: { class?: string } = $props();
</script>

<!-- Точный лого из присланного дизайн-дока (обрезан из исходного файла, не перерисован). -->
<img src="/brand/logo-icon.png" alt="Sombrero" class="{cls} object-contain" />
