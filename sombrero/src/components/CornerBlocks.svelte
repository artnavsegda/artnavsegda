<script lang="ts">
  // Точная копия углового мотива с дизайн-дока (вырезан из присланного скрина, не перерисован).
  // Левый — оригинал, правый — он же зеркально. Ставятся вплотную в верхние углы контейнера.
  type Props = { class?: string };
  let { class: cls = '' }: Props = $props();
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden {cls}" aria-hidden="true">
  <img src="/brand/corner.png" alt="" class="absolute top-0 left-0 w-20 sm:w-40 lg:w-52" />
  <img src="/brand/corner.png" alt="" class="absolute top-0 right-0 w-20 scale-x-[-1] sm:w-40 lg:w-52" />
</div>
