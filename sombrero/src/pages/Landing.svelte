<script lang="ts">
  import Button from '../components/Button.svelte';
  import PromoTile from '../components/PromoTile.svelte';
  import CornerBlocks from '../components/CornerBlocks.svelte';
  import Icon from '../components/Icon.svelte';
</script>

<div class="space-y-16">
  <!-- Hero -->
  <section class="relative overflow-hidden rounded-2xl bg-stone-50 px-6 py-16 text-center sm:py-20">
    <CornerBlocks />
    <div class="relative mx-auto max-w-xl">
      <img src="/brand/logo-icon.png" alt="" class="mx-auto size-20 object-contain sm:size-24" />
      <h1 class="mt-5 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">Sombrero</h1>
      <p class="mt-1 text-lg font-semibold text-brand-purple">Card Checker</p>
      <p class="mt-5 text-base text-stone-600 sm:text-lg">
        Массовая проверка номеров за секунды: вставьте список, выберите разделители — остальное сделает очередь
        на сервере.
      </p>
      <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button href="#/register" size="lg">Создать аккаунт</Button>
        <Button href="#/login" variant="secondary" size="lg">У меня уже есть аккаунт</Button>
      </div>
    </div>
  </section>

  <!-- Промо-плашки -->
  <section>
    <h2 class="mb-5 text-center text-sm font-semibold tracking-wide text-stone-500 uppercase">Условия</h2>
    <div class="grid gap-4 sm:grid-cols-3">
      <PromoTile label="Цена проверки" value="от $0.15" hint="за один номер" />
      <PromoTile label="Скидки на объём" value="чем больше пачка" hint="тем ниже цена за штуку" />
      <PromoTile label="API для магазинов" value="подключите по ключу" hint="проверка прямо из вашей кассы" />
    </div>
    <p class="mt-4 text-center text-xs text-stone-400">
      Цены ориентировочные — актуальные условия видно на странице биллинга после входа.
    </p>
  </section>

  <!-- Как это работает -->
  <section class="grid gap-4 sm:grid-cols-3">
    {#each [{ icon: 'scan', title: 'Вставьте номера', text: 'Любой разделитель полей и переносов — распознаем и проверим формат.' }, { icon: 'clock', title: 'Поставьте в очередь', text: 'Заявки обрабатываются на сервере, статус обновляется автоматически.' }, { icon: 'shield', title: 'Получите результат', text: 'Success и Error разложены отдельно, историю можно отфильтровать и скопировать.' }] as s (s.title)}
      <div class="rounded-2xl bg-stone-50 p-6">
        <span class="flex size-10 items-center justify-center rounded-lg bg-white text-brand-purple">
          <Icon name={s.icon} class="size-5" />
        </span>
        <h3 class="mt-4 font-semibold text-stone-900">{s.title}</h3>
        <p class="mt-1.5 text-sm text-stone-500">{s.text}</p>
      </div>
    {/each}
  </section>
</div>
