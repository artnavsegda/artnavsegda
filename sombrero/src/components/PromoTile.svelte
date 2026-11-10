<script lang="ts">
  // Плоская плашка 1-в-1 с ценовой таблицей дизайн-дока: без иконок, просто подпись + значение.
  type Props = { label: string; value: string; hint?: string };
  let { label, value, hint }: Props = $props();
</script>

<div class="rounded-2xl bg-stone-100 p-5 sm:p-6">
  <div class="text-base font-bold text-stone-900">{label}</div>
  <div class="mt-2 text-lg font-semibold text-brand-purple">{value}</div>
  {#if hint}<div class="mt-1 text-sm text-stone-500">{hint}</div>{/if}
</div>
