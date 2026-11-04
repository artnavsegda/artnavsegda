import type { HouseDef, SceneDef } from './types';

// Конфигурация демо-дома. На реальном объекте этот файл собирается
// из проекта ETS / конфигурации Wiren Board и редактора плана.

const P = (n: string) => `./photos/${n}.jpg`;

const L = (level: number, ct = 2700) => ({ on: level > 0, level, ct });

const evening: SceneDef['set'] = {
  'living.pendant': L(80), 'living.floor': L(100), 'living.niche': L(45), 'living.dining': L(60),
  'living.shades': { position: 30 }, 'kitchen.pendants': L(40), 'kitchen.strip': L(30),
  'hall.light': L(15), 'kids.nightlight': L(10), 'office.desk': L(0), 'bedroom.sconces': L(0),
  'bath.light': L(0), 'bedroom.shades': { position: 0 }
};

export const house: HouseDef = {
  name: 'Демо-дом',
  photos: {
    'living-night': { src: P('living-evening'), w: 1376, h: 768 },
    'living-day': { src: P('living-day'), w: 1376, h: 768 },
    dining: { src: P('dining-evening'), w: 848, h: 1264 },
    kitchen: { src: P('kitchen-evening'), w: 1376, h: 768 },
    bedroom: { src: P('bedroom-evening'), w: 1376, h: 768 },
    office: { src: P('office-evening'), w: 1376, h: 768 },
    'house-night': { src: P('house-dusk'), w: 1376, h: 768 },
    'house-day': { src: P('house-day'), w: 1376, h: 768 }
  },
  rooms: [
    { id: 'living', name: 'Гостиная', area: 38, rect: [20, 20, 420, 300], labelAt: [34, 52], glowAt: [210, 170, 230], photo: { night: 'living-night', day: 'living-day' } },
    { id: 'kitchen', name: 'Кухня', area: 19, rect: [440, 20, 220, 300], labelAt: [452, 80], glowAt: [550, 90, 160], photo: { night: 'kitchen' } },
    { id: 'office', name: 'Кабинет', area: 12, rect: [660, 20, 140, 300], labelAt: [670, 32], glowAt: [720, 160, 110], photo: { night: 'office' } },
    { id: 'hall', name: 'Холл', area: 16, rect: [320, 320, 480, 120], labelAt: [560, 372], glowAt: [560, 380, 150] },
    { id: 'bedroom', name: 'Спальня', area: 25, rect: [20, 320, 300, 300], labelAt: [34, 368], glowAt: [160, 470, 170], photo: { night: 'bedroom' } },
    { id: 'kids', name: 'Детская', area: 13, rect: [320, 440, 240, 180], labelAt: [332, 452], glowAt: [452, 590, 110] },
    { id: 'bath', name: 'Ванная', area: 12, rect: [560, 440, 240, 180], labelAt: [572, 500], glowAt: [680, 520, 140] }
  ],
  devices: [
    { id: 'living.pendant', room: 'living', name: 'Подвес', caps: ['dimmer', 'colorTemp'], plan: [205, 155], spots: { 'living-night': [690, 268], 'living-day': [690, 268] }, assets: { model: 'dome' } },
    { id: 'living.floor', room: 'living', name: 'Торшер', caps: ['dimmer'], plan: [336, 226], spots: { 'living-night': [918, 340], 'living-day': [918, 340] }, assets: { model: 'floor' } },
    { id: 'living.niche', room: 'living', name: 'Подсветка ниши', caps: ['dimmer'], plan: [60, 64], spots: { 'living-night': [1015, 290], 'living-day': [1015, 290] } },
    { id: 'living.dining', room: 'living', name: 'Подвес над столом', caps: ['dimmer', 'colorTemp'], plan: [380, 252], spots: { dining: [424, 445] }, assets: { model: 'dome' } },
    { id: 'living.shades', room: 'living', name: 'Шторы', caps: ['shade'], plan: [20, 170], spots: { 'living-night': [505, 300], 'living-day': [505, 300] } },
    { id: 'living.tv', room: 'living', name: 'Телевизор', caps: ['media'], plan: [290, 39], spots: { 'living-night': [1290, 345], 'living-day': [1290, 345] } },
    { id: 'living.speaker', room: 'living', name: 'Колонка', caps: ['speaker'], assets: { model: 'speaker' } },
    { id: 'living.climate', room: 'living', name: 'Климат', caps: ['climate'] },
    { id: 'kitchen.pendants', room: 'kitchen', name: 'Подвесы над островом', caps: ['dimmer'], plan: [555, 150], spots: { kitchen: [680, 262] } },
    { id: 'kitchen.strip', room: 'kitchen', name: 'Подсветка столешницы', caps: ['dimmer'], plan: [560, 46], spots: { kitchen: [1120, 385] } },
    { id: 'kitchen.climate', room: 'kitchen', name: 'Климат', caps: ['climate'], plan: [636, 286] },
    { id: 'office.desk', room: 'office', name: 'Настольная лампа', caps: ['dimmer'], plan: [700, 200], spots: { office: [560, 335] } },
    { id: 'office.climate', room: 'office', name: 'Климат', caps: ['climate'] },
    { id: 'hall.light', room: 'hall', name: 'Свет холла', caps: ['dimmer'], plan: [470, 400] },
    { id: 'hall.vacuum', room: 'hall', name: 'Робот-пылесос', caps: ['vacuum'], plan: [610, 405], assets: { model: 'vacuum' } },
    { id: 'bedroom.sconces', room: 'bedroom', name: 'Бра у кровати', caps: ['dimmer'], plan: [160, 470], spots: { bedroom: [190, 340] } },
    { id: 'bedroom.shades', room: 'bedroom', name: 'Шторы', caps: ['shade'], plan: [20, 470], spots: { bedroom: [960, 300] } },
    { id: 'bedroom.climate', room: 'bedroom', name: 'Климат', caps: ['climate'] },
    { id: 'kids.nightlight', room: 'kids', name: 'Ночник', caps: ['dimmer'], plan: [452, 590] },
    { id: 'kids.climate', room: 'kids', name: 'Климат', caps: ['climate'] },
    { id: 'bath.light', room: 'bath', name: 'Свет ванной', caps: ['dimmer'], plan: [700, 470] },
    { id: 'bath.floor', room: 'bath', name: 'Тёплый пол', caps: ['floorHeat'], plan: [650, 590] },
    { id: 'outdoor.pool', room: 'outdoor', name: 'Бассейн', caps: ['pool'] }
  ],
  scenes: [
    { id: 'day', name: 'День', set: {
      'living.pendant': L(0), 'living.floor': L(0), 'living.niche': L(20), 'living.dining': L(0), 'living.shades': { position: 100 },
      'kitchen.pendants': L(0), 'kitchen.strip': L(40), 'hall.light': L(0), 'kids.nightlight': L(0), 'office.desk': L(0),
      'bedroom.sconces': L(0), 'bath.light': L(70), 'bedroom.shades': { position: 100 } } },
    { id: 'evening', name: 'Вечер', set: evening },
    { id: 'cinema', name: 'Кино', set: { ...evening,
      'living.pendant': L(0), 'living.floor': L(10), 'living.niche': L(25), 'living.dining': L(0), 'living.shades': { position: 0 },
      'kitchen.pendants': L(0), 'kitchen.strip': L(10), 'hall.light': L(5), 'living.tv': { on: true, playing: true } } },
    { id: 'guests', name: 'Гости', set: {
      'living.pendant': L(100), 'living.floor': L(100), 'living.niche': L(70), 'living.dining': L(85), 'living.shades': { position: 30 },
      'kitchen.pendants': L(100), 'kitchen.strip': L(70), 'hall.light': L(80), 'office.desk': L(40), 'bath.light': L(50), 'kids.nightlight': L(10) } },
    { id: 'night', name: 'Ночь', arm: 'perimeter', set: {
      'living.pendant': L(0), 'living.floor': L(0), 'living.niche': L(0), 'living.dining': L(0), 'living.shades': { position: 0 },
      'kitchen.pendants': L(0), 'kitchen.strip': L(0), 'hall.light': L(5), 'kids.nightlight': L(8), 'office.desk': L(0),
      'bedroom.sconces': L(0), 'bath.light': L(0), 'living.tv': { on: false, playing: false }, 'bedroom.shades': { position: 0 } } },
    { id: 'away', name: 'Уходим', arm: 'full', set: {
      'living.pendant': L(0), 'living.floor': L(0), 'living.niche': L(0), 'living.dining': L(0), 'living.shades': { position: 0 },
      'kitchen.pendants': L(0), 'kitchen.strip': L(0), 'hall.light': L(0), 'kids.nightlight': L(0), 'office.desk': L(0),
      'bedroom.sconces': L(0), 'bath.light': L(0), 'living.tv': { on: false, playing: false }, 'living.speaker': { playing: false } } }
  ],
  roomScenes: {
    living: [
      { id: 'living-evening', name: 'Вечер', set: { 'living.pendant': L(80), 'living.floor': L(100), 'living.niche': L(45), 'living.dining': L(60), 'living.shades': { position: 30 } } },
      { id: 'living-cinema', name: 'Кино', set: { 'living.pendant': L(0), 'living.floor': L(10), 'living.niche': L(25), 'living.dining': L(0), 'living.shades': { position: 0 }, 'living.tv': { on: true, playing: true } } },
      { id: 'living-bright', name: 'Всё вкл.', set: { 'living.pendant': L(100, 4000), 'living.floor': L(100), 'living.niche': L(100), 'living.dining': L(100, 4000) } },
      { id: 'living-off', name: 'Выкл.', set: { 'living.pendant': L(0), 'living.floor': L(0), 'living.niche': L(0), 'living.dining': L(0) } }
    ]
  },
  cameras: [
    { id: 'terrace', name: 'Терраса', sub: '4K · ночное видение' },
    { id: 'gate', name: 'Въезд', sub: 'распознавание номеров' },
    { id: 'entrance', name: 'Входная группа', sub: 'дверной звонок' },
    { id: 'garage', name: 'Гараж', sub: '2 машиноместа' }
  ],
  zones: [
    { id: 'perimeter', name: 'Периметр участка' }, { id: 'gate', name: 'Въездные ворота' },
    { id: 'door', name: 'Входная дверь' }, { id: 'windows', name: 'Окна 1 этажа' },
    { id: 'terrace', name: 'Терраса' }, { id: 'inside', name: 'Внутренние зоны' }, { id: 'leak', name: 'Протечка, дым' }
  ]
};

export const roomById = Object.fromEntries(house.rooms.map(r => [r.id, r]));
export const deviceById = Object.fromEntries(house.devices.map(d => [d.id, d]));
export const devicesIn = (room: string) => house.devices.filter(d => d.room === room);
