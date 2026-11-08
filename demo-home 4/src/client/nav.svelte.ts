import { house, roomById, floors, floorOf, devicesIn } from '../core/house';
import type { DeviceDef, RoomDef } from '../core/types';
import { home, dev } from './store.svelte';

// Навигация по большому дому строится на двух осях:
//   «где» — этаж → комната (страница комнаты одинакова для любой комнаты),
//   «что» — свет, шторы, медиа, климат… (группы внутри комнаты и разделы приложения).
// Всё выводится из конфигурации объекта: программист не рисует меню руками.

export type GroupId = 'light' | 'shades' | 'media' | 'climate' | 'interior' | 'access' | 'appliances';

export const groupDefs: { id: GroupId; name: string; icon: string }[] = [
  { id: 'light', name: 'Свет', icon: 'bulb' },
  { id: 'shades', name: 'Шторы', icon: 'shade' },
  { id: 'media', name: 'Медиа', icon: 'media' },
  { id: 'climate', name: 'Климат', icon: 'climate' },
  { id: 'interior', name: 'Камин и интерьер', icon: 'flame' },
  { id: 'access', name: 'Вход', icon: 'lock' },
  { id: 'appliances', name: 'Техника', icon: 'bolt' }
];

export function groupOf(d: DeviceDef): GroupId | null {
  const c = d.caps;
  if (c.includes('occupancy')) return null; // датчики — в строке состояния, не в списке
  if (c.includes('dimmer')) return 'light';
  if (c.includes('shade')) return d.kind === 'lift' ? 'interior' : 'shades';
  if (c.includes('media') || c.includes('speaker')) return 'media';
  if (c.includes('climate') || c.includes('floorHeat') || c.includes('fan')) return 'climate';
  if (c.includes('fireplace') || c.includes('glass')) return 'interior';
  if (c.includes('lock') || c.includes('doorbell')) return 'access';
  return 'appliances';
}

export function groupsIn(room: string) {
  const list = devicesIn(room);
  return groupDefs
    .map(g => ({ ...g, devices: list.filter(d => groupOf(d) === g.id) }))
    .filter(g => g.devices.length);
}

export const multiFloor = floors.length > 1;
export const floorName = (room: string) => floors.find(f => f.id === floorOf(room))?.name ?? '';
export const roomsOnFloor = (f: number) => house.rooms.filter(r => (r.floor ?? 1) === f);

/** Соседние комнаты того же этажа — для свайпа на странице комнаты. */
export function siblings(room: string) {
  const list = roomsOnFloor(floorOf(room));
  const i = list.findIndex(r => r.id === room);
  return { list, i, prev: list[i - 1]?.id, next: list[i + 1]?.id };
}

export const isOn = (d: DeviceDef) => {
  const s = dev(d.id);
  const c = d.caps;
  return c.includes('dimmer') ? (s.level ?? 0) > 0 : c.includes('shade') ? (s.position ?? 0) > 0 : c.includes('speaker') ? !!s.playing
    : c.includes('climate') ? s.mode !== 'off' : c.includes('lock') ? !!s.locked : !!s.on;
};

/** Что происходит в комнате — для строк списка и карточек. */
export function roomStatus(room: string) {
  const list = devicesIn(room);
  const lights = list.filter(d => d.caps.includes('dimmer') && (dev(d.id).level ?? 0) > 0).length;
  const media = list.find(d => (d.caps.includes('media') && dev(d.id).on) || (d.caps.includes('speaker') && dev(d.id).playing));
  const clim = list.find(d => d.caps.includes('climate'));
  const people = (home.s?.presence[room] ?? 0) + (home.s?.walker?.room === room ? 1 : 0);
  const motion = list.some(d => d.caps.includes('occupancy') && dev(d.id).motion);
  return { lights, media, temp: clim ? dev(clim.id).current : undefined, people, here: people > 0 || motion, count: list.filter(d => groupOf(d)).length };
}

/** Комната «где я»: на стенной панели — её комната из конфигурации, на телефоне — по присутствию. */
export function hereRoom(): string {
  const w = home.s?.walker?.room;
  if (w && roomById[w]) return w;
  const pres = Object.entries(home.s?.presence ?? {}).filter(([r, n]) => n > 0 && roomById[r]).sort((a, b) => b[1] - a[1]);
  return pres[0]?.[0] ?? house.rooms[0].id;
}

/** Комнаты, где что-то происходит, — сначала «где я». */
export function activeRooms() {
  const here = hereRoom();
  return house.rooms
    .map(r => ({ r, s: roomStatus(r.id) }))
    .filter(x => x.r.id === here || x.s.lights || x.s.media || x.s.here)
    .sort((a, b) => (a.r.id === here ? -1 : b.r.id === here ? 1 : (b.s.lights + (b.s.media ? 2 : 0)) - (a.s.lights + (a.s.media ? 2 : 0))));
}

// ——— поиск: «детская телевизор», «свет 2 этаж», «камин» ———
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/[·,.]/g, ' ');
const syn: Record<string, string> = { тв: 'телевизор', телек: 'телевизор', люстру: 'люстра', шторы: 'штор', жалюзи: 'жалюзи', кондей: 'кондиционер', пол: 'пол' };
const groupWords: Record<GroupId, string> = {
  light: 'свет освещение лампа', shades: 'шторы штора жалюзи ставни', media: 'медиа музыка кино', climate: 'климат тепло температура отопление',
  interior: 'интерьер', access: 'дверь вход', appliances: 'техника кухня'
};

export function search(q: string): { rooms: RoomDef[]; devices: DeviceDef[] } {
  const tokens = norm(q).split(/\s+/).filter(Boolean).map(t => syn[t] ?? t);
  if (!tokens.length) return { rooms: [], devices: [] };
  const hit = (hay: string) => tokens.every(t => hay.includes(t) || hay.split(' ').some(w => w.startsWith(t.slice(0, Math.max(4, t.length - 2)))));
  const roomHay = (r: RoomDef) => norm(`${r.name} ${floorName(r.id)}`);
  const rooms = house.rooms.filter(r => hit(roomHay(r)));
  const devices = house.devices.filter(d => {
    const g = groupOf(d);
    const r = roomById[d.room];
    return g && r && hit(norm(`${d.name} ${r.name} ${floorName(r.id)} ${groupWords[g]}`));
  });
  return { rooms, devices: devices.slice(0, 30) };
}

/** Зоны медиа: комнаты, где есть экран или мультирум. */
export const mediaZones = house.rooms.filter(r => devicesIn(r.id).some(d => d.caps.includes('media') || d.caps.includes('speaker')));
/** Климатические комнаты. */
export const climateRooms = house.rooms.filter(r => devicesIn(r.id).some(d => d.caps.includes('climate')));
