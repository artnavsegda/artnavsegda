<script lang="ts">
  import { Dialog } from 'bits-ui';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { TELEGRAM_POLL_MS } from '../lib/config';
  import type { TelegramRequest } from '../lib/api/auth';

  /**
   * Вход/привязка через Telegram по контракту openapi.json:
   * открыть ссылку на бота, затем опрашивать подтверждение каждые 2–3 с до expires_at.
   */
  type Props = {
    open?: boolean;
    title: string;
    description: string;
    start: () => Promise<TelegramRequest>;
    poll: (code: string) => Promise<boolean>;
    onsuccess?: () => void;
  };

  let { open = $bindable(false), title, description, start, poll, onsuccess }: Props = $props();

  let url = $state('');
  let error = $state('');
  let expiresAt = 0;
  let secondsLeft = $state(0);
  let busy = $state(true);
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let countdownTimer: ReturnType<typeof setInterval> | undefined;

  function stopTimers() {
    clearInterval(pollTimer);
    clearInterval(countdownTimer);
    pollTimer = undefined;
    countdownTimer = undefined;
  }

  async function tick(code: string) {
    try {
      const done = await poll(code);
      if (done) {
        stopTimers();
        open = false;
        onsuccess?.();
      }
    } catch (e) {
      stopTimers();
      error = e instanceof Error ? e.message : 'Запрос устарел, попробуйте снова';
    }
  }

  async function begin() {
    error = '';
    url = '';
    busy = true;
    stopTimers();
    try {
      const req = await start();
      url = req.url;
      expiresAt = new Date(req.expires_at).getTime();
      secondsLeft = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      busy = false;
      pollTimer = setInterval(() => tick(req.code), TELEGRAM_POLL_MS);
      countdownTimer = setInterval(() => {
        secondsLeft = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
        if (secondsLeft <= 0) {
          stopTimers();
          error = 'Время ожидания истекло. Попробуйте снова.';
        }
      }, 1000);
    } catch (e) {
      busy = false;
      error = e instanceof Error ? e.message : 'Не удалось начать вход через Telegram';
    }
  }

  $effect(() => {
    if (open) void begin();
    else stopTimers();
    return stopTimers;
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm" />
    <Dialog.Content
      class="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl shadow-stone-900/15 focus:outline-none"
    >
      <div class="mb-4 flex size-11 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
        <Icon name="telegram" class="size-5" />
      </div>
      <Dialog.Title class="text-lg font-semibold text-stone-900">{title}</Dialog.Title>
      <Dialog.Description class="mt-1 text-sm text-stone-500">{description}</Dialog.Description>

      <div class="mt-5 space-y-3">
        {#if busy}
          <div class="flex items-center justify-center rounded-xl border border-stone-200 bg-stone-50 py-8 text-sm text-stone-500">
            Готовим ссылку…
          </div>
        {:else if url}
          <Button href={url} variant="telegram" full size="lg">
            <Icon name="telegram" class="size-5" /> Открыть в Telegram
          </Button>
          <p class="text-center text-xs text-stone-500">
            Ждём подтверждения в боте{secondsLeft > 0 ? ` · ещё ${secondsLeft} с` : ''}…
          </p>
        {/if}

        {#if error}
          <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
          <Button variant="secondary" full onclick={begin}>Попробовать снова</Button>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
