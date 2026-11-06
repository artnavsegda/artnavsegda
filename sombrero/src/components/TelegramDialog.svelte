<script lang="ts">
  import { Dialog } from 'bits-ui';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { TG_BOT_USERNAME } from '../lib/config';

  type Props = {
    open?: boolean;
    title: string;
    description: string;
    submitLabel: string;
    onsubmit: (username: string) => Promise<string | null> | string | null;
  };

  let { open = $bindable(false), title, description, submitLabel, onsubmit }: Props = $props();

  let username = $state('');
  let error = $state('');
  let busy = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    busy = true;
    const err = await onsubmit(username);
    busy = false;
    if (err) {
      error = err;
    } else {
      open = false;
      username = '';
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
    <Dialog.Content
      class="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stone-700 bg-stone-900 p-6 shadow-2xl shadow-black/60 focus:outline-none"
    >
      <div class="mb-4 flex size-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
        <Icon name="telegram" class="size-5" />
      </div>
      <Dialog.Title class="text-lg font-semibold text-stone-50">{title}</Dialog.Title>
      <Dialog.Description class="mt-1 text-sm text-stone-400">{description}</Dialog.Description>

      <form onsubmit={submit} class="mt-5 space-y-3">
        <div class="relative">
          <span class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-stone-500">@</span>
          <input class="input pl-8" placeholder="username" bind:value={username} autocomplete="off" />
        </div>
        {#if error}<p class="text-sm text-rose-400">{error}</p>{/if}
        <div class="flex gap-2">
          <Button type="submit" variant="telegram" full disabled={busy}>{submitLabel}</Button>
          <Dialog.Close>
            {#snippet child({ props })}
              <button {...props} type="button" class="h-10 cursor-pointer rounded-xl px-4 text-sm text-stone-400 hover:bg-stone-800 hover:text-white">
                Отмена
              </button>
            {/snippet}
          </Dialog.Close>
        </div>
      </form>

      <p class="mt-4 text-xs leading-relaxed text-stone-500">
        Сейчас работает упрощённый вход по @username. Для боевого режима подключается Telegram Login Widget
        бота @{TG_BOT_USERNAME} с проверкой подписи на сервере.
      </p>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
