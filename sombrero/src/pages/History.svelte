<script lang="ts">
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Select from '../components/Select.svelte';
  import CopyButton from '../components/CopyButton.svelte';
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/state.svelte';
  import { dateTime } from '../lib/format';
  import { PAGE_SIZE } from '../lib/config';

  let q = $state('');
  let from = $state('');
  let to = $state('');
  let result = $state('all');
  let page = $state(1);

  const resultOptions = [
    { id: 'all', label: 'Все результаты' },
    { id: 'success', label: 'Успех' },
    { id: 'fail', label: 'Неудача' },
    { id: 'error', label: 'Ошибка' }
  ];

  const badge: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    success: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Успех' },
    fail: { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', label: 'Неудача' },
    error: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Ошибка' }
  };

  const filtered = $derived.by(() => {
    const needle = q.trim();
    const fromTs = from ? new Date(from + 'T00:00:00').getTime() : -Infinity;
    const toTs = to ? new Date(to + 'T23:59:59.999').getTime() : Infinity;
    return store.history.filter(
      (h) =>
        (result === 'all' || h.result === result) &&
        h.checkedAt >= fromTs &&
        h.checkedAt <= toTs &&
        (!needle || h.value.includes(needle))
    );
  });

  const pages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const slice = $derived(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
  const filtersActive = $derived(!!(q || from || to || result !== 'all'));

  $effect(() => {
    // любое изменение фильтров возвращает на первую страницу
    q;
    from;
    to;
    result;
    page = 1;
  });

  function resetFilters() {
    q = '';
    from = '';
    to = '';
    result = 'all';
  }
</script>

<div class="space-y-6">
  <div class="flex items-end justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-stone-900">История</h1>
      <p class="mt-1 text-sm text-stone-500">
        Итоги проверок за эту сессию — контракт не отдаёт список прошлых заявок, только статус по id.
      </p>
    </div>
    <CopyButton
      text={filtered.map((h) => h.value).join('\n')}
      label="Копировать все ({filtered.length})"
      class="ring-1 ring-stone-200"
    />
  </div>

  <Card>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div class="relative lg:col-span-2">
        <Icon name="search" class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
        <input class="input pl-9 font-mono" placeholder="Поиск по номеру" bind:value={q} />
      </div>
      <input type="date" class="input" aria-label="С даты" bind:value={from} />
      <input type="date" class="input" aria-label="По дату" bind:value={to} />
      <Select bind:value={result} options={resultOptions} />
    </div>
    {#if filtersActive}
      <div class="mt-3">
        <Button variant="ghost" size="sm" onclick={resetFilters}><Icon name="x" /> Сбросить фильтры</Button>
      </div>
    {/if}
  </Card>

  <Card surface="white" class="p-0! sm:p-0!">
    {#if filtered.length === 0}
      <p class="px-4 py-14 text-center text-sm text-stone-500">
        {store.history.length === 0 ? 'Пока нет ни одной проверки.' : 'По этим фильтрам ничего не найдено.'}
      </p>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full min-w-120">
          <thead class="border-b border-stone-200 bg-stone-50">
            <tr>
              <th class="th">Номер</th>
              <th class="th">Результат</th>
              <th class="th text-right">Проверено</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            {#each slice as h (h.id)}
              <tr class="transition hover:bg-stone-50">
                <td class="td">
                  <span class="inline-flex items-center gap-1">
                    <span class="font-mono text-stone-900">{h.value}</span>
                    <CopyButton text={h.value} title="Копировать номер" />
                  </span>
                </td>
                <td class="td">
                  <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium {badge[h.result].bg} {badge[h.result].text}" title={h.detail}>
                    <span class="size-1.5 rounded-full {badge[h.result].dot}"></span>{badge[h.result].label}
                  </span>
                </td>
                <td class="td text-right whitespace-nowrap text-stone-500">{dateTime(h.checkedAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if pages > 1}
        <div class="flex items-center justify-between border-t border-stone-200 px-4 py-3 text-sm text-stone-500">
          <span>Стр. {page} из {pages} · {filtered.length} записей</span>
          <div class="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onclick={() => (page -= 1)}>Назад</Button>
            <Button variant="secondary" size="sm" disabled={page >= pages} onclick={() => (page += 1)}>Вперёд</Button>
          </div>
        </div>
      {/if}
    {/if}
  </Card>
</div>
