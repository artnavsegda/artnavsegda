# Sombrero

Svelte 5 · TypeScript · Tailwind CSS 4 · bits-ui

```bash
cp .env.example .env   # поправить при необходимости
npm install
npm run dev      # разработка
npm run build    # сборка в dist/
npm run check    # svelte-check
```

## Два контракта, две базы

Это первая версия приложения, привязанная к присланным спецификациям:

- **`swagger.json` → Code Verification API** (базовый путь `/api`) — основной контракт приложения:
  приём номеров и статус проверки, лимит, баланс/цена/кошельки.
  → `src/lib/api/order.ts`
- **`openapi.json` → VPS Panel REST API** (базовый путь `/api/v1`) — в Code Verification API нет точек
  авторизации (программист не успел), поэтому вход/регистрация/Telegram **взяты из прошлого проекта**
  по вашему указанию.
  → `src/lib/api/auth.ts`

Базовые пути переопределяются переменными окружения `VITE_AUTH_API_BASE` / `VITE_ORDER_API_BASE`
(см. `.env.example`). Если в деве два разных хоста — тем же файлом настраивается dev-proxy Vite
(`VITE_AUTH_PROXY_TARGET` / `VITE_ORDER_PROXY_TARGET`); в проде это обычно решает общий reverse-proxy.

Универсальный клиент с обработкой ошибок — `src/lib/api/http.ts`. Auth-контракт работает через
HttpOnly cookie (`credentials: 'include'`), Code Verification API — через API-ключ в заголовке
`Authorization: Bearer <key>`. Поскольку Code Verification API сам ключей не выдаёт, после
входа/регистрации приложение один раз получает ключ через `POST /tokens` (эндпоинт auth-контракта)
и дальше использует его для всех запросов к order-API — это единственное место, где два контракта
намеренно сшиты вместе; если на бэкенде ключи для Code Verification API выдаются иначе — поменять
только `afterAuth()` в `src/lib/state.svelte.ts`.

## Формат номера

Четыре поля: `number(11–13 цифр) | month(01–12) | code(2 цифры) | tail(3 цифры)`. Разбор —
`src/lib/parser.ts`. В теле `POST /check-code` по свагеру только три поля (`code_number`,
`month`, `last_code`), поэтому `code` и `tail` склеиваются в `last_code` в одном месте —
`orderApi.checkCode()` в `src/lib/api/order.ts`. Если на бэкенде это должно быть отдельным
полем — меняется только там.

## Что из ТЗ не покрыто присланными контрактами

- **История пополнений/трат на странице биллинга** — ни в одном из файлов нет эндпоинта со списком
  операций; баланс и кошельки целиком берутся из `/account-info`. Раздел на странице оставлен
  пустым с пояснением, таблицу добавить, когда появится эндпоинт.
- **Секретная фраза при регистрации** — в `RegisterRequest` (openapi.json) такого поля нет, убрал
  из формы. Если фраза всё же нужна на бэкенде — подскажите, в каком запросе её передавать.
- **История проверок** — у Code Verification API нет списка заявок, только
  `GET /check-status/{order_id}` по конкретному id. Страница «История» показывает то, что сама
  опросила за эту сессию (кэш в localStorage), а не список с сервера.
- **Вход через Telegram по @username** (как было в первой демо-версии) — заменён на флоу из
  openapi.json: кнопка открывает ссылку на бота, подтверждение опрашивается
  (`POST /auth/telegram` → `POST /auth/telegram/check`). Аккаунт из Telegram может быть без
  логина/пароля — экран их создания показан на странице профиля (`PUT /me/credentials`).

## Структура

- `src/lib/api/http.ts` — общий fetch-клиент, ошибки, API-ключ
- `src/lib/api/auth.ts` — регистрация/вход/сессия/Telegram (openapi.json)
- `src/lib/api/order.ts` — check-code/check-status/get-limit/account-info (swagger.json)
- `src/lib/state.svelte.ts` — реактивный стор поверх этих двух клиентов
- `src/lib/parser.ts` — разбор и валидация номеров
- `src/pages/` — Login, Register, Home, Billing, Self, History
- `src/components/` — Header, Footer, Button, Card, Field, Select, CopyButton, TelegramFlow, Icon, Logo

## Маршруты

`#/` проверка · `#/history` · `#/billing` · `#/self` · `#/login` · `#/register` · `#/logout`
