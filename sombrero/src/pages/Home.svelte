<script lang="ts">
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Select from '../components/Select.svelte';
  import CopyButton from '../components/CopyButton.svelte';
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/state.svelte';
  import { money } from '../lib/format';
  import { PRICE_PER_NUMBER } from '../lib/config';
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

  const total = $derived(result ? Math.round(result.ok.length * PRICE_PER_NUMBER * 100) / 100 : 0);
  const balance = $derived(store.user?.balance ?? 0);
  const enough = $derived(balance >= total);
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

  function enqueue() {
    if (!result) return;
    const r = store.enqueue(result.ok);
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
  <div class="grid grid-cols-3 gap-3">
    {#each [{ label: 'Проверено', value: store.stats.checked, hint: 'всего', tone: 'text-emerald-400' }, { label: 'В очереди', value: store.stats.queued, hint: 'ждут проверки', tone: 'text-amber-400' }, { label: 'Осталось', value: store.stats.affordable, hint: 'на текущий баланс', tone: 'text-stone-100' }] as s (s.label)}
      <div class="rounded-2xl border border-stone-800/90 bg-stone-900/50 px-4 py-3.5">
        <div class="text-xs tracking-wide text-stone-500 uppercase">{s.label}</div>
        <div class="mt-1 font-mono text-2xl font-semibold tabular-nums sm:text-3xl {s.tone}">{s.value}</div>
        <div class="mt-0.5 hidden text-xs text-stone-600 sm:block">{s.hint}</div>
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
          <span class="block text-sm font-medium text-stone-300">Разделитель полей</span>
          <Select bind:value={fieldId} options={FIELD_SEPARATORS} />
          {#if fieldId === 'custom'}
            <input class="input font-mono" placeholder="например  #" bind:value={fieldCustom} />
          {/if}
        </div>
        <div class="space-y-1.5">
          <span class="block text-sm font-medium text-stone-300">Перенос (разделитель записей)</span>
          <Select bind:value={recordId} options={RECORD_SEPARATORS} />
          {#if recordId === 'custom'}
            <input class="input font-mono" placeholder="например  ##" bind:value={recordCustom} />
          {/if}
        </div>
      </div>

      <p class="mt-3 text-xs text-stone-500">
        Формат записи: <span class="font-mono text-stone-400">11–13 цифр ● месяц (01–12) ● 2 цифры ● 3 цифры</span>.
        Подойдёт и <span class="font-mono text-stone-400">1234567890123|09|27|485</span>, и
        <span class="font-mono text-stone-400">123456789012-09-27-785</span>, и
        <span class="font-mono text-stone-400">12345678901|09|27|085;123456789012|07|31|829</span>.
      </p>

      {#if error}<p class="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>{/if}

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

    {#if error}<p class="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>{/if}

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Success -->
      <Card class="border-emerald-500/20">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Icon name="check" />
            </span>
            <h2 class="text-base font-semibold text-stone-50">Success</h2>
          </div>
          <span class="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-sm text-emerald-300">{result.ok.length}</span>
        </div>

        {#if result.ok.length === 0}
          <p class="rounded-xl border border-dashed border-stone-800 px-4 py-8 text-center text-sm text-stone-500">
            Не удалось распознать ни одного номера. Проверьте разделители.
          </p>
        {:else}
          <ul class="max-h-64 divide-y divide-stone-800/70 overflow-y-auto rounded-xl border border-stone-800 bg-stone-950/50 font-mono text-sm">
            {#each result.ok as p (p.value)}
              <li class="px-3.5 py-2 text-stone-300">{p.value}</li>
            {/each}
          </ul>

          <div class="mt-4 flex items-end justify-between gap-4">
            <div>
              <div class="text-xs tracking-wide text-stone-500 uppercase">Итого</div>
              <div class="font-mono text-2xl font-semibold text-amber-300">{money(total)}</div>
              <div class="text-xs text-stone-600">{result.ok.length} × {money(PRICE_PER_NUMBER)}</div>
            </div>
            {#if queued !== null}
              <span class="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
                <Icon name="check" /> В очереди: {queued}
              </span>
            {:else}
              <Button onclick={enqueue} disabled={!enough}>Добавить в очередь</Button>
            {/if}
          </div>
          {#if queued === null && !enough}
            <p class="mt-3 text-sm text-rose-300">
              Не хватает {money(total - balance)}. <a href="#/billing" class="underline underline-offset-2">Пополнить баланс</a>
            </p>
          {/if}
        {/if}
      </Card>

      <!-- Error -->
      <Card class="border-rose-500/20">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="flex size-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
              <Icon name="alert" />
            </span>
            <h2 class="text-base font-semibold text-stone-50">Error</h2>
          </div>
          <span class="rounded-full bg-rose-500/15 px-2.5 py-0.5 font-mono text-sm text-rose-300">{result.bad.length}</span>
        </div>

        {#if result.bad.length === 0}
          <p class="rounded-xl border border-dashed border-stone-800 px-4 py-8 text-center text-sm text-stone-500">
            Ошибок нет. Всё распознано.
          </p>
        {:else}
          <textarea readonly rows="10" value={badText} class="input resize-y font-mono leading-relaxed"></textarea>
          <div class="mt-3 flex items-center justify-between">
            <CopyButton text={badText} label="Скопировать" class="ring-1 ring-stone-800" />
          </div>
          <details class="mt-3 text-sm">
            <summary class="cursor-pointer text-stone-400 select-none hover:text-stone-200">Почему не прошли</summary>
            <ul class="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
              {#each result.bad.slice(0, 100) as b, i (i)}
                <li class="flex justify-between gap-3 text-xs">
                  <span class="truncate font-mono text-stone-400">{b.raw}</span>
                  <span class="shrink-0 text-rose-300/80">{b.reason}</span>
                </li>
              {/each}
            </ul>
          </details>
        {/if}
      </Card>
    </div>
  {/if}
</div>
