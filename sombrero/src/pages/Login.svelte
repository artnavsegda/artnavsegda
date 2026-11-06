<script lang="ts">
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Field from '../components/Field.svelte';
  import Icon from '../components/Icon.svelte';
  import TelegramDialog from '../components/TelegramDialog.svelte';
  import { store } from '../lib/state.svelte';
  import { go } from '../lib/router.svelte';

  let login = $state('');
  let password = $state('');
  let error = $state('');
  let busy = $state(false);
  let tgOpen = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    busy = true;
    const r = await store.login(login, password);
    busy = false;
    if (r.ok) go('/');
    else error = r.error;
  }

  async function tg(username: string) {
    const r = await store.loginWithTelegram(username);
    if (!r.ok) return r.error;
    go('/');
    return null;
  }
</script>

<div class="mx-auto max-w-md pt-6 sm:pt-12">
  <div class="mb-6 text-center">
    <h1 class="text-3xl font-bold tracking-tight text-stone-50">С возвращением</h1>
    <p class="mt-2 text-stone-400">Войдите, чтобы продолжить работу</p>
  </div>

  <Card>
    <form onsubmit={submit} class="space-y-4">
      <Field label="Логин" bind:value={login} autocomplete="username" required />
      <Field label="Пароль" type="password" bind:value={password} autocomplete="current-password" required />
      {#if error}<p class="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>{/if}
      <Button type="submit" full size="lg" disabled={busy}>Войти</Button>
    </form>

    <div class="my-5 flex items-center gap-3 text-xs text-stone-600">
      <span class="h-px flex-1 bg-stone-800"></span>или<span class="h-px flex-1 bg-stone-800"></span>
    </div>

    <Button variant="telegram" full size="lg" onclick={() => (tgOpen = true)}>
      <Icon name="telegram" class="size-5" /> Войти через Telegram
    </Button>
  </Card>

  <p class="mt-5 text-center text-sm text-stone-500">
    Нет аккаунта? <a href="#/register" class="text-amber-400 hover:text-amber-300">Зарегистрироваться</a>
  </p>
</div>

<TelegramDialog
  bind:open={tgOpen}
  title="Вход через Telegram"
  description="Укажите свой Telegram-username. Если аккаунта ещё нет, он будет создан."
  submitLabel="Продолжить"
  onsubmit={tg}
/>
