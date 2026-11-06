<script lang="ts">
  let { class: cls = 'size-8' }: { class?: string } = $props();
</script>

<svg class={cls} viewBox="0 0 32 32" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="sb-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbbf24" />
      <stop offset="1" stop-color="#ea580c" />
    </linearGradient>
  </defs>
  <ellipse cx="16" cy="22" rx="14.5" ry="5" fill="url(#sb-g)" />
  <path d="M8.5 21C8.5 12 11.5 6 16 6s7.5 6 7.5 15c-4.5 2-10.5 2-15 0Z" fill="url(#sb-g)" />
  <path d="M9 18.5c4.5 1.7 9.5 1.7 14 0" stroke="#0c0a09" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round" />
</svg>
