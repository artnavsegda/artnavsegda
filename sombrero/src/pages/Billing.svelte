<script lang="ts">
  import { Tabs } from 'bits-ui';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import CopyButton from '../components/CopyButton.svelte';
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/state.svelte';
  import { money, dateTime } from '../lib/format';

  let tab = $state('all');
  let q = $state('');

  const rows = $derived(
    store.transactions.filter(
      (t) => (tab === 'all' || t.type === tab) && (!q.trim() || t.note.toLowerCase().includes(q.trim().toLowerCase()))
    )
  );

  const tabCls =
    'cursor-pointer rounded-lg px-3.5 py-1.5 text-sm text-stone-400 transition hover:text-stone-100 data-[state=active]:bg-stone-800 data-[state=active]:text-white';

  const coinColor: Record<string, string> = {
    USDT: 'bg-emerald-500/15 text-emerald-300',
    BTC: 'bg-amber-500/15 text-amber-300',
    ETH: 'bg-indigo-500/15 text-indigo-300'
  };
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold tracking-tight text-stone-50">Биллинг</h1>

  <div class="grid gap-6 lg:grid-cols-5">
    <Card class="lg:col-span-2">
      <div class="text-xs tracking-wide text-stone-500 uppercase">Баланс</div>
      <div class="mt-2 font-mono text-4xl font-semibold text-amber-300">{money(store.user?.balance ?? 0)}</div>
      <div class="mt-5">
        <Button variant="secondary" size="sm" onclick={() => store.demoTopUp(5)}>
          <Icon name="plus" /> Тестовое пополнение +$5
        </Button>
      </div>
    </Card>

    <Card title="Кошельки" description="Адреса для пополнения баланса" class="lg:col-span-3">
      {#if store.wallets.length === 0}
        <div class="flex flex-col items-center gap-4 rounded-xl border border-dashed border-stone-800 px-4 py-8 text-center">
          <span class="flex size-12 items-center justify-center rounded-xl bg-stone-800 text-stone-400">
            <Icon name="wallet" class="size-6" />
          </span>
          <p class="text-sm text-stone-400">Кошельков пока нет. Получите адреса для пополнения.</p>
          <Button onclick={() => store.claimWallets()}>Получить кошельки</Button>
        </div>
      {:else}
        <ul class="space-y-2">
          {#each store.wallets as w (w.id)}
            <li class="flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-950/50 px-3.5 py-3">
              <span class="w-14 shrink-0 rounded-md px-2 py-1 text-center text-xs font-semibold {coinColor[w.currency] ?? 'bg-stone-800 text-stone-300'}">
                {w.currency}
              </span>
              <div class="min-w-0 flex-1">
                <div class="text-xs text-stone-500">{w.network}</div>
                <div class="truncate font-mono text-sm text-stone-200" title={w.address}>{w.address}</div>
              </div>
              <CopyButton text={w.address} title="Копировать адрес" />
            </li>
          {/each}
        </ul>
      {/if}
    </Card>
  </div>

  <Card title="История операций">
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs.Root bind:value={tab}>
        <Tabs.List class="inline-flex gap-1 rounded-xl bg-stone-950/70 p-1 ring-1 ring-stone-800">
          <Tabs.Trigger value="all" class={tabCls}>Все</Tabs.Trigger>
          <Tabs.Trigger value="in" class={tabCls}>Поступления</Tabs.Trigger>
          <Tabs.Trigger value="out" class={tabCls}>Траты</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      <div class="relative sm:w-64">
        <Icon name="search" class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-500" />
        <input class="input pl-9" placeholder="Поиск по описанию" bind:value={q} />
      </div>
    </div>

    {#if rows.length === 0}
      <p class="rounded-xl border border-dashed border-stone-800 px-4 py-10 text-center text-sm text-stone-500">
        Операций не найдено.
      </p>
    {:else}
      <div class="overflow-x-auto rounded-xl border border-stone-800">
        <table class="w-full min-w-120">
          <thead class="bg-stone-950/60">
            <tr>
              <th class="th">Дата</th>
              <th class="th">Описание</th>
              <th class="th text-right">Сумма</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-800/70">
            {#each rows as t (t.id)}
              <tr class="transition hover:bg-stone-800/30">
                <td class="td whitespace-nowrap text-stone-400">{dateTime(t.createdAt)}</td>
                <td class="td">
                  <span class="inline-flex items-center gap-2 text-stone-200">
                    <span class="flex size-6 items-center justify-center rounded-md {t.type === 'in' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}">
                      <Icon name={t.type} class="size-3.5" />
                    </span>
                    {t.note}
                  </span>
                </td>
                <td class="td text-right font-mono tabular-nums {t.type === 'in' ? 'text-emerald-400' : 'text-rose-300'}">
                  {t.type === 'in' ? '+' : '−'}{money(t.amount)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </Card>
</div>
