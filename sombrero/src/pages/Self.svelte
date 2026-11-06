<script lang="ts">
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Icon from '../components/Icon.svelte';
  import TelegramDialog from '../components/TelegramDialog.svelte';
  import { store } from '../lib/state.svelte';
  import { go } from '../lib/router.svelte';
  import { dateTime } from '../lib/format';

  let tgOpen = $state(false);

  function link(username: string) {
    const r = store.linkTelegram(username);
    return r.ok ? null : r.error;
  }
</script>

{#if store.user}
  <div class="mx-auto max-w-2xl space-y-6">
    <div class="flex items-center gap-4">
      <span class="flex size-16 items-center justify-center rounded-2xl bg-linear-to-b from-amber-400 to-orange-500 text-2xl font-bold text-stone-950 shadow-lg shadow-orange-500/20">
        {store.user.login.slice(0, 1).toUpperCase()}
      </span>
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-stone-50">{store.user.login}</h1>
        <p class="text-sm text-stone-500">В Sombrero с {dateTime(store.user.createdAt)}</p>
      </div>
    </div>

    <Card title="Аккаунт">
      <dl class="divide-y divide-stone-800/70 text-sm">
        <div class="flex items-center justify-between gap-4 py-3">
          <dt class="text-stone-400">Имя пользователя</dt>
          <dd class="font-mono text-stone-100">{store.user.login}</dd>
        </div>
        <div class="flex items-center justify-between gap-4 py-3">
          <dt class="text-stone-400">Секретная фраза</dt>
          <dd>
            {#if store.user.secret}
              <span class="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-300">Указана</span>
            {:else}
              <span class="rounded-full bg-stone-800 px-2.5 py-0.5 text-xs text-stone-400">Не указана</span>
            {/if}
          </dd>
        </div>
        <div class="flex items-center justify-between gap-4 py-3">
          <dt class="text-stone-400">Telegram</dt>
          <dd class="flex items-center gap-3">
            {#if store.user.telegram}
              <span class="flex items-center gap-1.5 font-mono text-sky-300">
                <Icon name="telegram" class="size-4" />@{store.user.telegram}
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

  <TelegramDialog
    bind:open={tgOpen}
    title="Привязать Telegram"
    description="После привязки вы сможете входить в Sombrero одной кнопкой."
    submitLabel="Привязать"
    onsubmit={link}
  />
{/if}
