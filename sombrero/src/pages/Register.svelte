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
  let repeat = $state('');
  let secret = $state('');
  let error = $state('');
  let busy = $state(false);
  let tgOpen = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    busy = true;
    const r = await store.register(login, password, repeat, secret);
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
    <h1 class="text-3xl font-bold tracking-tight text-stone-50">Создать аккаунт</h1>
    <p class="mt-2 text-stone-400">Почту мы не спрашиваем. Только логин и пароль.</p>
  </div>

  <Card>
    <Button variant="telegram" full size="lg" onclick={() => (tgOpen = true)}>
      <Icon name="telegram" class="size-5" /> Войти через Telegram
    </Button>

    <div class="my-5 flex items-center gap-3 text-xs text-stone-600">
      <span class="h-px flex-1 bg-stone-800"></span>или с паролем<span class="h-px flex-1 bg-stone-800"></span>
    </div>

    <form onsubmit={submit} class="space-y-4">
      <Field label="Логин" bind:value={login} autocomplete="username" hint="3–24 символа: латиница, цифры, _" required />
      <Field label="Пароль" type="password" bind:value={password} autocomplete="new-password" hint="Не короче 8 символов" required />
      <Field label="Повторите пароль" type="password" bind:value={repeat} autocomplete="new-password" required />
      <Field
        label="Секретная фраза (необязательно)"
        bind:value={secret}
        autocomplete="off"
        hint="Лучше заполнить: если потеряете доступ, мы охотнее поможем вам его восстановить."
      />
      {#if error}<p class="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>{/if}
      <Button type="submit" full size="lg" disabled={busy}>Зарегистрироваться</Button>
    </form>
  </Card>

  <p class="mt-5 text-center text-sm text-stone-500">
    Уже есть аккаунт? <a href="#/login" class="text-amber-400 hover:text-amber-300">Войти</a>
  </p>
</div>

<TelegramDialog
  bind:open={tgOpen}
  title="Вход через Telegram"
  description="Укажите свой Telegram-username. Если аккаунта ещё нет, он будет создан."
  submitLabel="Продолжить"
  onsubmit={tg}
/>
