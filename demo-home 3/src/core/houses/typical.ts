import type { Capability, DeviceDef, DeviceState, HouseDef, RoomDef, SceneDef } from '../types';

// «Псевдо-боевой» объект: типовой загородный дом на три этажа, как на реальных
// инсталляциях. Нужен, чтобы проверить интерфейс на настоящем количестве
// устройств, а не на семи красивых комнатах демо.

const P = (n: string) => `./photos/${n}.jpg`;

type R4 = [number, number, number, number];
const room = (id: string, name: string, floor: number, area: number, rect: R4, photo?: RoomDef['photo']): RoomDef => ({
  id, name, floor, area, rect, photo,
  labelAt: [rect[0] + 12, rect[1] + 14],
  glowAt: [rect[0] + rect[2] / 2, rect[1] + rect[3] / 2 + 10, Math.min(rect[2], rect[3]) * 0.62]
});

const rooms: RoomDef[] = [
  // 1 этаж
  room('living', 'Гостиная', 1, 52, [20, 20, 470, 600], { night: 'living-night', day: 'living-day' }),
  room('kitchen', 'Кухня', 1, 24, [490, 20, 310, 240], { night: 'kitchen' }),
  room('entry', 'Прихожая', 1, 14, [490, 260, 310, 200]),
  room('bath1', 'Ванная', 1, 9, [590, 460, 210, 160]),
  // 2 этаж
  room('bed1', 'Спальня 1', 2, 22, [20, 20, 400, 250], { night: 'bedroom' }),
  room('office', 'Кабинет', 2, 18, [420, 20, 380, 250], { night: 'office' }),
  room('bed2', 'Спальня 2', 2, 17, [20, 270, 300, 350]),
  room('hall2', 'Холл 2 этажа', 2, 10, [320, 270, 480, 100]),
  room('kids', 'Детская', 2, 16, [520, 370, 280, 250]),
  // 3 этаж
  room('guest', 'Гостевая', 3, 24, [20, 20, 420, 360]),
  room('laundry', 'Постирочная', 3, 8, [440, 20, 180, 220]),
  room('tech', 'Техпомещение', 3, 7, [620, 20, 180, 220]),
  room('hall3', 'Холл 3 этажа', 3, 9, [440, 240, 360, 140])
];

type Spec = [key: string, name: string, caps: Capability[], extra?: Partial<DeviceDef>];
const L = (k: string, name: string, kind: string, extra: Partial<DeviceDef> = {}): Spec => [k, name, ['dimmer'], { kind, ...extra }];
const motion: Spec = ['motion', 'Датчик присутствия', ['occupancy'], { readonly: true }];
const radiator: Spec = ['climate', 'Радиатор', ['climate'], { kind: 'radiator' }];
const mr = (_room: string): Spec => ['speaker', 'Музыка', ['speaker']];
const shade = (k: string, name: string, kind: 'roller' | 'curtain' | 'venetian' | 'shutter', extra: Partial<DeviceDef> = {}): Spec => [k, name, ['shade'], { kind, ...extra }];
const appl = (k: string, name: string, kind: string, init: Partial<DeviceState>, readonly = true): Spec => [k, name, ['appliance'], { kind, init, readonly }];

const specs: Record<string, Spec[]> = {
  entry: [
    L('sconces', 'Бра', 'sconce'), L('mood', 'LED-подсветка', 'mood'), mr('прихожая'), motion, radiator,
    shade('blinds', 'Рулонная штора', 'roller'),
    ['doorbell', 'Звонок', ['doorbell'], { readonly: true }],
    ['lock', 'Замок', ['lock'], { init: { locked: true } }],
    ['vacuum', 'Робот-пылесос', ['vacuum'], { assets: { model: 'vacuum' } }]
  ],
  bath1: [
    L('main', 'Основной свет', 'main'), L('accent', 'Подсветка', 'accent'), L('mirror', 'Зеркало с подсветкой', 'mirror'),
    ['fan', 'Вентиляция', ['fan'], { init: { on: false } }], mr('ванная'), motion, radiator,
    ['floor', 'Тёплый пол', ['floorHeat']], shade('blinds', 'Жалюзи', 'venetian')
  ],
  kitchen: [
    L('main', 'Основной свет', 'main', { spots: { kitchen: [680, 262] }, glow: 320 }),
    L('worktop', 'Над столешницей', 'accent', { spots: { kitchen: [1120, 385] }, glow: 260 }),
    L('mood', 'LED-подсветка', 'mood'), motion, radiator, shade('roller', 'Рулонная штора', 'roller'),
    appl('oven', 'Духовой шкаф', 'oven', { on: true, temp: 164, target: 180, phase: 'разогрев до 180° · 6 мин' }, false),
    appl('fridge', 'Холодильник', 'fridge', { on: true, temp: 4, phase: '+4° · морозилка −18° · дверь закрыта' }),
    appl('dishwasher', 'Посудомоечная машина', 'dishwasher', { on: true, phase: 'мойка · осталось 38 мин' }),
    appl('hood', 'Вытяжка', 'hood', { on: false, phase: 'выкл.' }, false)
  ],
  living: [
    ['pendant', 'Люстра', ['dimmer', 'colorTemp'], { kind: 'chandelier', spots: { 'living-night': [690, 268], 'living-day': [690, 268] }, assets: { model: 'dome' }, glow: 300 }],
    L('cove', 'Карнизная подсветка', 'accent', { spots: { 'living-night': [1015, 290], 'living-day': [1015, 290] }, glow: 170 }),
    L('mood', 'Подсветка', 'mood'),
    L('floor', 'Торшер у дивана', 'floor', { spots: { 'living-night': [918, 340], 'living-day': [918, 340] }, assets: { model: 'floor' }, glow: 210 }),
    L('floor2', 'Торшер у камина', 'floor'),
    ['tv', 'Телевизор', ['media'], { spots: { 'living-night': [1290, 345], 'living-day': [1290, 345] }, init: { assumed: true } }],
    ['projector', 'Проектор и экран', ['media'], { kind: 'projector', init: { on: false, playing: false } }],
    ['speaker', 'Мультирум · гостиная', ['speaker'], { assets: { model: 'speaker' } }],
    ['climate', 'Радиаторы', ['climate'], { kind: 'radiator' }],
    ['ac', 'Кондиционер', ['climate'], { kind: 'ac', init: { mode: 'off', target: 23 } }],
    ['fireplace', 'Камин', ['fireplace'], { init: { on: false, level: 60 } }],
    shade('podium', 'Подиум камина', 'lift' as any, { init: { position: 0 } }),
    motion,
    shade('shades', 'Шторы', 'curtain', { spots: { 'living-night': [505, 300], 'living-day': [505, 300] } }),
    shade('shutters', 'Ставни', 'shutter')
  ],
  bed1: [
    L('main', 'Общий свет', 'main'), L('sconceL', 'Бра слева', 'sconce', { spots: { bedroom: [190, 340] }, glow: 220 }), L('sconceR', 'Бра справа', 'sconce'),
    L('mood', 'Подсветка', 'mood'), ['tv', 'Телевизор', ['media'], { init: { on: false, playing: false, assumed: true } }], mr('спальня 1'), motion, radiator,
    shade('roller', 'Рулонные шторы', 'roller', { spots: { bedroom: [960, 300] } })
  ],
  bed2: [
    L('main', 'Общий свет', 'main'), L('sconceL', 'Бра слева', 'sconce'), L('sconceR', 'Бра справа', 'sconce'), L('mood', 'Подсветка', 'mood'),
    ['tv', 'Телевизор', ['media'], { init: { on: false, playing: false, assumed: true } }], mr('спальня 2'), motion, radiator,
    shade('curtains', 'Блэкаут', 'curtain')
  ],
  office: [
    L('main', 'Общий свет', 'main'), L('floor', 'Торшер', 'floor', { spots: { office: [560, 335] }, glow: 230 }), L('mood', 'Подсветка', 'mood'),
    ['glass', 'Стеклянная перегородка', ['glass'], { init: { on: false } }],
    ['tv', 'Телевизор', ['media'], { init: { on: false, playing: false } }], mr('кабинет'), motion, radiator, shade('blinds', 'Жалюзи', 'venetian')
  ],
  kids: [
    L('main', 'Общий свет', 'main'), L('mood', 'Подсветка', 'mood'),
    ['tv', 'Телевизор', ['media'], { init: { on: false, playing: false, assumed: true } }],
    ['console', 'Игровая консоль', ['media'], { kind: 'console', init: { on: false, playing: false, title: 'Консоль', source: 'PlayStation 5' } }],
    motion, radiator, shade('roller', 'Рулонная штора', 'roller')
  ],
  hall2: [L('main', 'Свет холла', 'main'), L('mood', 'Подсветка лестницы', 'mood'), motion],
  guest: [
    L('main', 'Общий свет', 'main'), L('sconces', 'Бра', 'sconce'), L('mood', 'Подсветка', 'mood'),
    ['tv', 'Телевизор', ['media'], { init: { on: false, playing: false, assumed: true } }], motion, radiator, shade('roller', 'Мансардные шторы', 'roller')
  ],
  laundry: [
    L('main', 'Свет', 'main'),
    appl('washer', 'Стиральная машина', 'washer', { on: true, phase: 'отжим · 12 мин' }),
    appl('dryer', 'Сушильная машина', 'dryer', { on: false, phase: 'готово · 40 мин назад' }), motion, radiator
  ],
  tech: [
    L('main', 'Свет', 'main'),
    appl('matrix', 'Видеоматрица', 'av', { on: true, phase: '3 из 8 выходов заняты' }),
    appl('atv1', 'Apple TV 1', 'av', { on: true, phase: 'гостиная · фильм' }),
    appl('atv2', 'Apple TV 2', 'av', { on: false, phase: 'свободен' }),
    appl('kodi', 'Kodi', 'av', { on: false, phase: 'свободен' }),
    appl('mrc', 'Усилитель', 'av', { on: true, phase: '2 из 8 зон играют' }),
    appl('ups', 'ИБП', 'ups', { on: true, phase: 'сеть · нагрузка 38 %' })
  ],
  hall3: [L('main', 'Свет холла', 'main'), motion]
};

// Маркеры на плане раскладываются сеткой внутри комнаты: свет сверху, остальное ниже.
const devices: DeviceDef[] = [];
for (const r of rooms) {
  const list = specs[r.id] ?? [];
  const [x, y, w] = r.rect;
  const cols = Math.max(1, Math.floor((w - 40) / 40));
  list.forEach(([k, name, caps, extra], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    devices.push({ id: `${r.id}.${k}`, room: r.id, name, caps, plan: [x + 32 + col * 40, y + 62 + row * 40], ...extra });
  });
}

// живые различия между комнатами: свои уставки, играет не весь мультирум
const climateInit: Record<string, [number, number]> = {
  living: [21.4, 22], kitchen: [22.1, 21.5], entry: [20.2, 20], bath1: [23.6, 24], bed1: [20.4, 20], bed2: [20.8, 20.5],
  office: [21.2, 21.5], kids: [21.9, 21.5], guest: [17.5, 18], laundry: [19.4, 19]
};
for (const d of devices) {
  const c = climateInit[d.room];
  if (d.caps.includes('climate') && d.kind === 'radiator' && c) d.init = { ...d.init, current: c[0], target: c[1] };
  if (d.caps.includes('speaker') && d.room !== 'living') d.init = { ...d.init, playing: d.room === 'kitchen' || d.room === 'bath1' };
}

// участок: фото фасада общее с демо, бассейн на нём есть
devices.push({ id: 'outdoor.pool', room: 'outdoor', name: 'Бассейн', caps: ['pool'] });

// ——— сцены: собираются по типам светильников, как это делает программист на объекте ———
const lights = devices.filter(d => d.caps.includes('dimmer'));
const shades = devices.filter(d => d.caps.includes('shade') && d.kind !== 'lift' && d.kind !== 'shutter');
const floorOf = (id: string) => rooms.find(r => r.id === devices.find(d => d.id === id)!.room)!.floor;
const lv = (level: number, ct = 2700) => ({ on: level > 0, level, ct });
type Set = SceneDef['set'];
const all = (f: (d: DeviceDef) => Partial<DeviceState> | undefined, list = lights): Set =>
  Object.fromEntries(list.map(d => [d.id, f(d)]).filter(([, v]) => v)) as Set;
const tvsOff: Set = Object.fromEntries(devices.filter(d => d.caps.includes('media')).map(d => [d.id, { on: false, playing: false }]));

const eveningLevel: Record<string, number> = { chandelier: 70, main: 55, accent: 50, mood: 35, sconce: 30, floor: 60, mirror: 0 };
const evening: Set = {
  ...all(d => lv(floorOf(d.id) === 1 || d.room === 'hall2' ? eveningLevel[d.kind ?? 'main'] ?? 40 : d.kind === 'mood' ? 20 : 0)),
  ...all(() => ({ position: 0 }), shades)
};

const scenes: SceneDef[] = [
  { id: 'day', name: 'День', set: { ...all(d => lv(d.id === 'bath1.accent' ? 30 : 0)), ...all(() => ({ position: 100 }), shades), 'living.shutters': { position: 100 } } },
  { id: 'evening', name: 'Вечер', set: evening },
  { id: 'cinema', name: 'Кино', set: { ...evening,
    ...all(d => d.room === 'living' ? lv(d.kind === 'mood' ? 15 : d.id === 'living.floor' ? 10 : 0) : undefined),
    'living.shades': { position: 0 }, 'living.tv': { on: false, playing: false }, 'living.projector': { on: true, playing: true } } },
  { id: 'guests', name: 'Гости', set: { ...all(d => floorOf(d.id) === 1 ? lv(d.kind === 'mood' ? 60 : d.kind === 'mirror' ? 40 : 100) : undefined), 'living.fireplace': { on: true } } },
  { id: 'night', name: 'Ночь', arm: 'perimeter', set: {
    ...all(d => lv(d.id === 'kids.mood' ? 8 : d.id === 'entry.mood' || d.id === 'hall2.mood' ? 5 : 0)),
    ...all(() => ({ position: 0 }), shades), ...tvsOff, 'living.fireplace': { on: false } } },
  { id: 'away', name: 'Уходим', arm: 'full', set: {
    ...all(() => lv(0)), ...tvsOff, 'living.speaker': { playing: false }, 'living.fireplace': { on: false }, 'living.shutters': { position: 0 } } }
];

const livingIds = lights.filter(d => d.room === 'living');
const roomScenes: Record<string, SceneDef[]> = {
  living: [
    { id: 'living-evening', name: 'Вечер', set: { ...Object.fromEntries(livingIds.map(d => [d.id, lv(eveningLevel[d.kind ?? 'main'] ?? 40)])), 'living.shades': { position: 30 } } },
    { id: 'living-cinema', name: 'Кино', set: { ...Object.fromEntries(livingIds.map(d => [d.id, lv(d.kind === 'mood' ? 15 : 0)])), 'living.shades': { position: 0 }, 'living.projector': { on: true, playing: true } } },
    { id: 'living-fire', name: 'У камина', set: { ...Object.fromEntries(livingIds.map(d => [d.id, lv(d.id === 'living.floor2' ? 40 : d.kind === 'mood' ? 25 : 0)])), 'living.fireplace': { on: true }, 'living.podium': { position: 100 } } },
    { id: 'living-bright', name: 'Всё вкл.', set: Object.fromEntries(livingIds.map(d => [d.id, lv(100, 4000)])) },
    { id: 'living-off', name: 'Выкл.', set: Object.fromEntries(livingIds.map(d => [d.id, lv(0)])) }
  ]
};

export const typical: HouseDef = {
  name: 'Дом на Липовой',
  planStyle: 'generic',
  floors: [
    { id: 1, name: '1 этаж', extras: [{ kind: 'stairs', rect: [490, 460, 100, 160], label: 'лестница' }] },
    { id: 2, name: '2 этаж', extras: [{ kind: 'stairs', rect: [320, 370, 200, 250], label: 'лестница · второй свет' }] },
    { id: 3, name: '3 этаж', extras: [{ kind: 'roof', rect: [20, 380, 780, 240], label: 'кровля' }, { kind: 'stairs', rect: [440, 240, 90, 140] }] }
  ],
  favorites: { home: ['living.pendant', 'living.speaker'], overview: ['living.pendant', 'living.floor', 'living.speaker', 'entry.vacuum'] },
  presence: { night: { living: 2, kids: 1, bed1: 1 }, day: { kitchen: 1, office: 1 } },
  photos: {
    'living-night': { src: P('living-evening'), w: 1376, h: 768 },
    'living-day': { src: P('living-day'), w: 1376, h: 768 },
    kitchen: { src: P('kitchen-evening'), w: 1376, h: 768 },
    bedroom: { src: P('bedroom-evening'), w: 1376, h: 768 },
    office: { src: P('office-evening'), w: 1376, h: 768 },
    'house-night': { src: P('house-dusk'), w: 1376, h: 768 },
    'house-day': { src: P('house-day'), w: 1376, h: 768 }
  },
  rooms, devices, scenes, roomScenes,
  cameras: [
    { id: 'entrance', name: 'Входная дверь', sub: 'звонок · двусторонняя связь' },
    { id: 'gate', name: 'Въезд', sub: 'распознавание номеров' },
    { id: 'terrace', name: 'Терраса', sub: '4K · ночное видение' },
    { id: 'living', name: 'Гостиная', sub: 'выкл., когда дома' },
    { id: 'kitchen', name: 'Кухня', sub: 'выкл., когда дома' },
    { id: 'entry', name: 'Прихожая', sub: 'внутренняя' },
    { id: 'bed1', name: 'Спальня 1', sub: 'шторка объектива' },
    { id: 'bed2', name: 'Спальня 2', sub: 'шторка объектива' },
    { id: 'office', name: 'Кабинет', sub: 'внутренняя' },
    { id: 'kids', name: 'Детская', sub: 'видеоняня' },
    { id: 'hall2', name: 'Холл 2 этажа', sub: 'внутренняя' },
    { id: 'guest', name: 'Гостевая', sub: 'шторка объектива' },
    { id: 'laundry', name: 'Постирочная', sub: 'внутренняя' },
    { id: 'tech', name: 'Техпомещение', sub: 'стойка и щиты' },
    { id: 'hall3', name: 'Холл 3 этажа', sub: 'внутренняя' }
  ],
  zones: [
    { id: 'perimeter', name: 'Периметр участка' }, { id: 'gate', name: 'Въездные ворота' }, { id: 'door', name: 'Входная дверь' },
    { id: 'terrace', name: 'Терраса' }, { id: 'windows1', name: 'Окна 1 этажа' }, { id: 'windows2', name: 'Окна 2 этажа' }, { id: 'windows3', name: 'Мансардные окна' },
    { id: 'inside1', name: 'Движение · 1 этаж' }, { id: 'inside2', name: 'Движение · 2 этаж' }, { id: 'inside3', name: 'Движение · 3 этаж' },
    { id: 'leak', name: 'Протечка · ванная, кухня, постирочная' }, { id: 'smoke', name: 'Дым · все этажи' }
  ]
};
