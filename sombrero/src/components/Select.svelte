<script lang="ts">
  import { Select } from 'bits-ui';
  import Icon from './Icon.svelte';

  type Option = { id: string; label: string };
  type Props = {
    value: string;
    options: Option[];
    placeholder?: string;
    class?: string;
  };

  let { value = $bindable(), options, placeholder = 'Выбрать', class: cls = '' }: Props = $props();

  const items = $derived(options.map((o) => ({ value: o.id, label: o.label })));
  const current = $derived(options.find((o) => o.id === value));
</script>

<Select.Root type="single" bind:value {items}>
  <Select.Trigger class="input flex cursor-pointer items-center justify-between gap-2 text-left {cls}">
    <span class="truncate">{current?.label ?? placeholder}</span>
    <Icon name="chevron" class="size-4 shrink-0 text-stone-400" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content
      sideOffset={6}
      class="z-50 max-h-72 min-w-(--bits-select-anchor-width) overflow-hidden rounded-xl border border-stone-200 bg-white p-1 shadow-xl shadow-stone-900/10"
    >
      <Select.Viewport>
        {#each items as item (item.value)}
          <Select.Item
            value={item.value}
            label={item.label}
            class="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-stone-700 select-none data-highlighted:bg-stone-100 data-highlighted:text-stone-900"
          >
            {#snippet children({ selected })}
              <span class="whitespace-pre">{item.label}</span>
              {#if selected}<Icon name="check" class="size-4 text-brand-purple" />{/if}
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
