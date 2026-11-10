<script lang="ts">
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Select from '../components/Select.svelte';
  import CopyButton from '../components/CopyButton.svelte';
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/state.svelte';
  import { money } from '../lib/format';
  import {
    FIELD_SEPARATORS,
    RECORD_SEPARATORS,
    makeSplitter,
    separatorConflict,
    parseNumbers,
    type ParseResult
  } from '../lib/parser';

  let text = $state('');
  let fieldId = $state('|');
  let fieldCustom = $state('');
  let recordId = $state('newline');
  let recordCustom = $state('');
  let result = $state<ParseResult | null>(null);
  let error = $state('');
  let queued = $state<number | null>(null);
  let busy = $state(false);

  const total = $derived(result ? Math.round(result.ok.length * store.price * 100) / 100 : 0);
  const enough = $derived(store.balance >= total);
  const badText = $derived(result ? result.bad.map((b) => b.raw).join('\n') : '');

  function recognize() {
    error = '';
    if (!text.trim()) {
      error = 'Вставьте номера в поле выше.';
      return;
    }
    const conflict = separatorConflict(fieldId, fieldCustom, recordId, recordCustom);
    if (conflict) {
      error = conflict;
      return;
    }
    const field = makeSplitter(fieldId, fieldCustom, 'field');
    const record = makeSplitter(recordId, recordCustom, 'record');
    if (!field || !record) {
      error = 'Укажите свой разделитель.';
      return;
    }
    result = parseNumbers(text, field, record);
    queued = null;
  }

  async function enqueue() {
    if (!result) return;
    busy = true;
    const r = await store.enqueue(result.ok);
    busy = false;
    if (!r.ok) {
      error = r.error;
      return;
    }
    error = '';
    queued = result.ok.length;
  }

  function reset() {
    result = null;
    queued = null;
    text = '';
    error = '';
  }
</script>

<div class="space-y-6">
  <!-- статистика -->
  <div class="grid grid-cols-3 gap-2 sm:gap-3">
    {#each [{ label: 'Проверено', value: store.stats.checked, hint: 'за эту сессию', tone: 'text-emerald-600' }, { label: 'В очереди', value: store.stats.queued, hint: 'по данным /get-limit', tone: 'text-amber-600' }, { label: 'Осталось', value: store.stats.affordable, hint: 'на текущий баланс', tone: 'text-stone-900' }] as s (s.label)}
      <div class="rounded-2xl border border-stone-200 bg-white px-2.5 py-3 shadow-sm shadow-stone-900/5 sm:px-4 sm:py-3.5">
        <div class="text-xs tracking-wide text-stone-500 uppercase">{s.label}</div>
        <div class="mt-1 font-mono text-2xl font-semibold tabular-nums sm:text-3xl {s.tone}">{s.value}</div>
        <div class="mt-0.5 hidden text-xs text-stone-400 sm:block">{s.hint}</div>
      </div>
    {/each}
  </div>

  {#if !result}
    <Card title="Проверка номеров" description="Вставьте список, выберите разделители и нажмите «Распознать».">
      <textarea
        bind:value={text}
        rows="10"
        spellcheck="false"
        placeholder={'1234567890123|09|27|485\n12345678901|07|31|329\n123456789012|11|08|148'}
        class="input resize-y font-mono leading-relaxed"
      ></textarea>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div class="space-y-1.5">
          <span class="block text-sm font-medium text-stone-700">Разделитель полей</span>
          <Select bind:value={fieldId} options={FIELD_SEPARATORS} />
          {#if fieldId === 'custom'}
            <input class="input font-mono" placeholder="например  #" bind:value={fieldCustom} />
          {/if}
        </div>
        <div class="space-y-1.5">
          <span class="block text-sm font-medium text-stone-700">Перенос (разделитель записей)</span>
          <Select bind:value={recordId} options={RECORD_SEPARATORS} />
          {#if recordId === 'custom'}
            <input class="input font-mono" placeholder="например  ##" bind:value={recordCustom} />
          {/if}
        </div>
      </div>

      <p class="mt-3 text-xs text-stone-500">
        Формат записи: <span class="font-mono text-stone-600">11–13 цифр ● месяц (01–12) ● 2 цифры ● 3 цифры</span>.
        Третий и четвёртый блок при отправке в <span class="font-mono text-stone-600">/check-code</span> склеиваются
        в <span class="font-mono text-stone-600">last_code</span>. Подойдёт и
        <span class="font-mono text-stone-600">1234567890123|09|27|485</span>, и
        <span class="font-mono text-stone-600">123456789012-09-27-785</span>, и
        <span class="font-mono text-stone-600">12345678901|09|27|085;123456789012|07|31|829</span>.
      </p>

      {#if error}<p class="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>{/if}

      <div class="mt-5">
        <Button size="lg" onclick={recognize} disabled={!text.trim()}>
          <Icon name="scan" class="size-5" /> Распознать
        </Button>
      </div>
    </Card>
  {:else}
    <div class="flex items-center justify-between">
      <Button variant="ghost" size="sm" onclick={reset}><Icon name="arrowLeft" /> Новая проверка</Button>
      <span class="text-sm text-stone-500">Распознано записей: {result.ok.length + result.bad.length}</span>
    </div>

    {#if error}<p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>{/if}

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Success -->
      <Card surface="white" class="ring-1 ring-emerald-200">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Icon name="check" />
            </span>
            <h2 class="text-base font-semibold text-stone-900">Success</h2>
          </div>
          <span class="rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-sm text-emerald-700">{result.ok.length}</span>
        </div>

        {#if result.ok.length === 0}
          <p class="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
            Не удалось распознать ни одного номера. Проверьте разделители.
          </p>
        {:else}
          <ul class="max-h-64 divide-y divide-stone-200 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 font-mono text-sm">
            {#each result.ok as p (p.value)}
              <li class="px-3.5 py-2 text-stone-700">{p.value}</li>
            {/each}
          </ul>

          <div class="mt-4 flex items-end justify-between gap-4">
            <div>
              <div class="text-xs tracking-wide text-stone-500 uppercase">Итого</div>
              <div class="font-mono text-2xl font-semibold text-brand-purple">{money(total)}</div>
              <div class="text-xs text-stone-400">{result.ok.length} × {money(store.price)}</div>
            </div>
            {#if queued !== null}
              <span class="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                <Icon name="check" /> Отправлено: {queued}
              </span>
            {:else}
              <Button onclick={enqueue} disabled={!enough || busy}>
                {busy ? 'Отправляем…' : 'Добавить в очередь'}
              </Button>
            {/if}
          </div>
          {#if queued === null && !enough}
            <p class="mt-3 text-sm text-rose-600">
              Не хватает {money(total - store.balance)}. <a href="#/billing" class="underline underline-offset-2">Пополнить баланс</a>
            </p>
          {/if}
        {/if}
      </Card>

      <!-- Error -->
      <Card surface="white" class="ring-1 ring-rose-200">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Icon name="alert" />
            </span>
            <h2 class="text-base font-semibold text-stone-900">Error</h2>
          </div>
          <span class="rounded-full bg-rose-50 px-2.5 py-0.5 font-mono text-sm text-rose-700">{result.bad.length}</span>
        </div>

        {#if result.bad.length === 0}
          <p class="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
            Ошибок нет. Всё распознано.
          </p>
        {:else}
          <textarea readonly rows="10" value={badText} class="input resize-y font-mono leading-relaxed"></textarea>
          <div class="mt-3 flex items-center justify-between">
            <CopyButton text={badText} label="Скопировать" class="ring-1 ring-stone-200" />
          </div>
          <details class="mt-3 text-sm">
            <summary class="cursor-pointer text-stone-500 select-none hover:text-stone-900">Почему не прошли</summary>
            <ul class="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
              {#each result.bad.slice(0, 100) as b, i (i)}
                <li class="flex justify-between gap-3 text-xs">
                  <span class="truncate font-mono text-stone-500">{b.raw}</span>
                  <span class="shrink-0 text-rose-500">{b.reason}</span>
                </li>
              {/each}
            </ul>
          </details>
        {/if}
      </Card>
    </div>
  {/if}
</div>
