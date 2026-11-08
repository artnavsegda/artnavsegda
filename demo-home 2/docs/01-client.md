# 01. Клиент: устройство прототипа

Прототип — это не набросок, а заготовка будущего клиента. Дом симулируется в браузере, а
симулятор говорит тем же протоколом, что будет у ядра на контроллере.

## Стек

Svelte 5 (runes), TypeScript, Vite 6, three.js. WebGL-шейдеры написаны руками
(`src/client/gl/`). UI-библиотек нет.

## Слои

| Слой | Файлы | Суть |
|---|---|---|
| Протокол | `src/core/types.ts` | `Capability`, `DeviceDef`, `RoomDef`, `HouseDef`, `HomeState`, `DeviceState`, `Command`, `Delta`, `Transport` |
| Объекты | `src/core/houses/*.ts`, `src/core/house.ts` | конфигурации демо и типового дома; выбор объекта, индексы `roomById` / `deviceById` / `devicesIn` / `floorOf` |
| Симулятор | `src/core/sim.ts` | `HouseSim`: snapshot, дельты, команды, плавные переходы, присутствие, охрана, мощность |
| Состояние | `src/client/store.svelte.ts` | `home = $state({ s, connected })`, `cmd()`, `dev()`, `runScene()`; `setPath` понимает `\|` и `.` |
| Производные | `src/client/derive.svelte.ts` | свет в комнате, температура, присутствие, иконки сцен, форматирование |
| Навигация | `src/client/nav.svelte.ts`, `router.svelte.ts` | группы устройств, этажи, «где я», поиск, зоны; маршруты |
| Темы | `src/client/theme.svelte.ts`, `src/themes.css` | тренды × день/ночь, профиль телефон/планшет, рамка устройства |
| Графика | `src/client/gl/relight.ts`, `fluid.ts`, `src/client/three/models.ts` | живой свет на фото, жидкий фон, 3D-модели и постеры |
| UI | `src/ui/*` | Icon, Toggle, Slider, Segmented, Swap, DeviceRow, DeviceCard, RoomBody, PlanSvg, Scenes, Nav, DemoConsole… |
| Экраны | `src/screens/*` | см. ниже |

## Протокол

- Клиент получает **snapshot** `HomeState`, потом **дельты** `{ path, value }`.
- Пути в дельтах: `devices|<id>|<key>` для устройств (в id есть точка), остальное — через точку
  (`security.mode`, `presence.kitchen`).
- Команды: `light.set`, `shade.set`, `climate.set`, `media.action`, `vacuum.action`, `scene.run`,
  `security.arm`, `device.set` (общая: `on` / `locked` / `level`), служебные `demo.*`.
- `Transport` — интерфейс. Сейчас его реализует `HouseSim`; на объекте будет WebSocket к ядру.
  В `store.svelte.ts` это одна строка.

## Конфигурация объекта (`HouseDef`)

- Комнаты: `floor`, `area`, прямоугольник на плане, подпись, свечение, фото (день/ночь).
- Устройства:
  - `caps` — capabilities: dimmer, colorTemp, shade, climate, media, speaker, vacuum, pool,
    floorHeat, fireplace, glass, lock, doorbell, appliance, occupancy, fan;
  - `kind` — уточнение типа;
  - `readonly`, `init`, `glow`;
  - `plan` — координаты на плане, `spots` — точки на фото, `assets` — 3D-модель.
- Сцены дома и комнат, камеры, зоны охраны.
- `floors` (с лестницами и кровлей на плане), `planStyle` (`demo` — нарисованный план с мебелью,
  `generic` — стены из прямоугольников комнат).
- `favorites`, `presence`, `walker`.

## Экраны и маршруты

Hash-роутинг `#name-arg`. Повторное нажатие на вкладку прокручивает экран наверх. Позиция
прокрутки запоминается для каждого экрана.

| Маршрут | Экран | Профиль |
|---|---|---|
| `home` | Главная: приветствие, сцены, активные комнаты, избранное | телефон |
| `plan` | Дом: план по этажам + панель комнаты | планшет |
| `rooms` | Комнаты по этажам, поиск, вид «план» | оба |
| `room-<id>` | Страница комнаты: шапка (фото или план этажа), сцены, группы устройств | оба |
| `photo-<id>` | Фото комнаты с живым светом и хотспотами | оба, полноэкранный |
| `media-<zone>` | Медиа по зонам: экраны, пульт, путь сигнала, мультирум | оба |
| `climate-<room>` | Климат по этажам, несколько приборов в комнате, тёплые полы | оба |
| `security` | Охрана: режимы, камеры (улица / этажи), зоны, журнал | оба |
| `overview` | Обзор: фото-герой и карточки | планшет |
| `house` | Участок: фасад, бассейн, окна | планшет |
| `lamp-<id>` | Устройство в 3D | оба |
| `ar` | AR-демо поверх фото | оба |

## Тренды

`trends` в `theme.svelte.ts`:
- **features:** `ambient`, `relight`, `posters`, `planGlow`;
- **skins:** toggle (pill / rocker), slider (fill / hairline), nav (rail / topbar),
  tabbar (floating / flat), dial (arc / ticks);
- **layout.overview:** side / stacked.

Токены — в `themes.css` для `[data-trend]` × `[data-mode=day|night]`. Режим ночи берётся из
`home.s.night`, то есть из дома, а не из часов устройства.

Новый тренд:
1. Блок токенов в `themes.css` для двух режимов.
2. Запись в `trends`: возможности, скины, раскладка.
3. Проверить экраны в minimal-переопределениях (радиусы, типографика).

## Переход виджета между устройствами

Решение после разбора с автором: когда пользователь переключает устройство или комнату, не
анимировать состояние одного общего виджета (ползунки «перетекают» от значения одного устройства
к другому). Вместо этого **сам виджет уезжает или растворяется**, а на его место приходит новый —
компонент `Swap.svelte`:
- `{#key}` + `in:` / `out:`, направление по индексу;
- в тренде warm — сдвиг, масштаб и размытие, в minimal — прозрачность;
- свайп через pointer events.

Используется в климате, на странице комнаты, на плане и в обзоре.
