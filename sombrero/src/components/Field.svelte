<script lang="ts">
  type Props = {
    label: string;
    value?: string;
    type?: string;
    hint?: string;
    placeholder?: string;
    autocomplete?: AutoFill;
    required?: boolean;
    mono?: boolean;
  };

  let {
    label,
    value = $bindable(''),
    type = 'text',
    hint,
    placeholder,
    autocomplete,
    required = false,
    mono = false
  }: Props = $props();

  const uid = $props.id();
</script>

<div class="space-y-1.5">
  <label for={uid} class="block text-sm font-medium text-stone-700">{label}</label>
  <input
    id={uid}
    {type}
    {placeholder}
    {autocomplete}
    {required}
    bind:value
    class="input {mono ? 'font-mono' : ''}"
  />
  {#if hint}<p class="text-xs leading-relaxed text-stone-500">{hint}</p>{/if}
</div>
