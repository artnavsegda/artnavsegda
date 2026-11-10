<script lang="ts">
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Field from '../components/Field.svelte';
  import Icon from '../components/Icon.svelte';
  import TelegramFlow from '../components/TelegramFlow.svelte';
  import { store } from '../lib/state.svelte';
  import { go } from '../lib/router.svelte';
  import { dateTime } from '../lib/format';

  let tgOpen = $state(false);

  let newLogin = $state('');
  let newPassword = $state('');
  let newRepeat = $state('');
  let credError = $state('');
  let credBusy = $state(false);

  async function saveCredentials(e: SubmitEvent) {
    e.preventDefault();
    credError = '';
    if (newPassword !== newRepeat) {
      credError = 'Пароли не совпадают';
      return;
    }
    credBusy = true;
    const r = await store.setCredentials(newLogin, newPassword);
    credBusy = false;
    if (!r.ok) credError = r.error;
  }

  const initial = $derived((store.user?.login ?? store.user?.telegram?.username ?? '?').slice(0, 1).toUpperCase());
  const title = $derived(store.user?.login ?? (store.user?.telegram ? `@${store.user.telegram.username}` : 'Без логина'));
</script>

{#if store.user}
  <div class="mx-auto max-w-2xl space-y-6">
    <div class="flex items-center gap-4">
      <span class="flex size-16 items-center justify-center rounded-xl bg-brand-lime text-2xl font-bold text-brand-ink">
        {initial}
      </span>
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
        <p class="text-sm text-stone-500">В Sombrero с {dateTime(new Date(store.user.created_at).getTime())}</p>
      </div>
    </div>

    {#if store.user.login === null}
      <Card
        title="Создайте логин и пароль"
        description="Сейчас вход только через Telegram. Задайте логин и пароль, чтобы заходить и без бота."
      >
        <form onsubmit={saveCredentials} class="space-y-4">
          <Field label="Логин" bind:value={newLogin} autocomplete="username" required />
          <Field label="Пароль" type="password" bind:value={newPassword} autocomplete="new-password" hint="Не короче 8 символов" required />
          <Field label="Повторите пароль" type="password" bind:value={newRepeat} autocomplete="new-password" required />
          {#if credError}<p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{credError}</p>{/if}
          <Button type="submit" disabled={credBusy}>Сохранить</Button>
        </form>
      </Card>
    {/if}

    <Card title="Аккаунт">
      <dl class="divide-y divide-stone-200 text-sm">
        <div class="flex items-center justify-between gap-4 py-3">
          <dt class="text-stone-500">Имя пользователя</dt>
          <dd class="font-mono text-stone-900">{store.user.login ?? '—'}</dd>
        </div>
        <div class="flex items-center justify-between gap-4 py-3">
          <dt class="text-stone-500">Telegram</dt>
          <dd class="flex items-center gap-3">
            {#if store.user.telegram}
              <span class="flex items-center gap-1.5 font-mono text-sky-600">
                <Icon name="telegram" class="size-4" />@{store.user.telegram.username}
              </span>
              <Button variant="danger" size="sm" onclick={() => store.unlinkTelegram()}>Отвязать</Button>
            {:else}
              <Button variant="telegram" size="sm" onclick={() => (tgOpen = true)}>
                <Icon name="telegram" /> Привязать Telegram
              </Button>
            {/if}
          </dd>
        </div>
      </dl>
    </Card>

    <Button variant="secondary" onclick={() => go('/logout')}><Icon name="logout" /> Выйти из аккаунта</Button>
  </div>

  <TelegramFlow
    bind:open={tgOpen}
    title="Привязать Telegram"
    description="После привязки вы сможете входить в Sombrero одной кнопкой."
    start={() => store.startTelegramLink()}
    poll={(code) => store.pollTelegram(code)}
  />
{/if}
