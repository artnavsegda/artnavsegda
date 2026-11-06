# Sombrero

Svelte 5 · TypeScript · Tailwind CSS 4 · bits-ui

```bash
npm install
npm run dev      # разработка
npm run build    # сборка в dist/
npm run check    # svelte-check
```

## Структура

- `src/lib/parser.ts` — разбор и валидация номеров (разделители, перенос, формат `11–13 цифр | месяц 01–12 | 2 цифры | 3 цифры`, дубликаты)
- `src/lib/state.svelte.ts` — **вся «серверная» логика на localStorage**: пользователи, сессия, кошельки, транзакции, очередь, история
- `src/lib/config.ts` — цена за номер, бот Telegram, интервал воркера, размер страницы
- `src/pages/` — Login, Register, Home, Billing, Self, History
- `src/components/` — Header, Footer, Button, Card, Field, Select, CopyButton, TelegramDialog, Icon, Logo

## Что заменить при подключении бэкенда

Всё, что помечено заглушкой, живёт в `state.svelte.ts`; страницы вызывают только методы `store`.

- `register / login / logout` — на реальную авторизацию (сейчас SHA-256 в localStorage, для продакшена не годится)
- `loginWithTelegram / linkTelegram` — на Telegram Login Widget с проверкой подписи на сервере
- `claimWallets` — выдача реальных адресов
- `demoTopUp` — **удалить**, это тестовая кнопка на странице биллинга
- `tick()` + `startWorker()` — имитация воркера (70% «успех»); заменить на опрос статусов с сервера

## Маршруты

`#/` проверка · `#/history` · `#/billing` · `#/self` · `#/login` · `#/register` · `#/logout`
