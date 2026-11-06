<script lang="ts">
  import { copyText } from '../lib/format';
  import Icon from './Icon.svelte';

  type Props = { text: string; label?: string; title?: string; class?: string };
  let { text, label = '', title = 'Копировать', class: cls = '' }: Props = $props();

  let done = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    if (await copyText(text)) {
      done = true;
      clearTimeout(timer);
      timer = setTimeout(() => (done = false), 1400);
    }
  }
</script>

<button
  type="button"
  onclick={copy}
  aria-label={title}
  {title}
  class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition hover:bg-stone-800 {done
    ? 'text-emerald-400'
    : 'text-stone-400 hover:text-stone-100'} {cls}"
>
  <Icon name={done ? 'check' : 'copy'} class="size-3.5" />
  {#if label}<span>{done ? 'Скопировано' : label}</span>{/if}
</button>
