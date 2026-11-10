<script lang="ts">
  import Card from '../components/Card.svelte';
  import CopyButton from '../components/CopyButton.svelte';
  import { store } from '../lib/state.svelte';
  import { money } from '../lib/format';

  const coinColor: Record<string, string> = {
    USDT: 'bg-emerald-50 text-emerald-700',
    BTC: 'bg-amber-50 text-amber-700',
    ETH: 'bg-indigo-50 text-indigo-700'
  };
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold tracking-tight text-stone-900">Биллинг</h1>

  <div class="grid gap-6 lg:grid-cols-5">
    <Card class="lg:col-span-2">
      <div class="text-xs tracking-wide text-stone-500 uppercase">Баланс</div>
      <div class="mt-2 font-mono text-4xl font-semibold text-brand-purple">{money(store.balance)}</div>
      <div class="mt-4 text-xs text-stone-500">
        Цена за проверку: <span class="font-mono text-stone-700">{money(store.price)}</span>
      </div>
    </Card>

    <Card title="Кошельки" description="Адреса для пополнения баланса (из /account-info)" class="lg:col-span-3">
      {#if store.wallets.length === 0}
        <p class="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
          Кошельки для этого аккаунта ещё не выпущены на сервере.
        </p>
      {:else}
        <ul class="space-y-2">
          {#each store.wallets as w (w.address)}
            <li class="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3">
              <span class="w-14 shrink-0 rounded-md px-2 py-1 text-center text-xs font-semibold {coinColor[w.currency] ?? 'bg-stone-100 text-stone-600'}">
                {w.currency}
              </span>
              <div class="min-w-0 flex-1">
                <div class="text-xs text-stone-500">{w.network}{w.name ? ` · ${w.name}` : ''}</div>
                <div class="truncate font-mono text-sm text-stone-800" title={w.address}>{w.address}</div>
              </div>
              <CopyButton text={w.address} title="Копировать адрес" />
            </li>
          {/each}
        </ul>
      {/if}
    </Card>
  </div>

  <Card title="История операций">
    <p class="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
      В присланном контракте нет эндпоинта истории пополнений и трат — добавим здесь таблицу, когда он появится.
    </p>
  </Card>
</div>
