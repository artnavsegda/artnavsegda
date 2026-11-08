import project from '../../model/objects/sosny.json';
import type { Device, Project, Zone } from '../../model/schema.ts';
import { roomZones, zoneFloor, zonePage, type Group } from '../../model/navigation.ts';
import { typeById } from '../../model/catalog.ts';

// Концепт главного экрана: дом в разрезе, функции — слои. Комнаты, этажи и группы
// выведены из модели реального дома; состояние — симуляция для оценки.

export const P = project as unknown as Project;
export type Layer = 'all' | 'light' | 'climate' | 'media' | 'security';
export const layers: { id: Layer; name: string; icon: string }[] = [
  { id: 'all', name: 'Всё', icon: 'house' }, { id: 'light', name: 'Свет', icon: 'bulb' }, { id: 'climate', name: 'Климат', icon: 'climate' },
  { id: 'media', name: 'Медиа', icon: 'media' }, { id: 'security', name: 'Охрана', icon: 'shield' }
];

const kindWeight: Record<string, number> = { living: 3, kitchen: 2, bedroom: 2.2, kids: 2, office: 2, workshop: 2.4, bath: 1, hall: 1.2, hallway: 1, garage: 3, outdoor: 3 };

export interface Room { id: string; name: string; floor: string; weight: number; kind: string; groups: Group[]; lights: Device[]; climate: Device[]; media: Device[]; zone: Zone }

const zones = roomZones(P);
export const rooms: Room[] = zones.map(z => {
  const sp = P.spaces.find(s => s.id === z.spaces[0])!;
  const groups = zonePage(P, z, 'resident');
  const rows = groups.flatMap(g => g.rows);
  return {
    id: z.id, name: z.name, floor: zoneFloor(P, z), kind: z.spaces.length > 1 && sp.kind !== 'workshop' ? 'garage' : sp.kind,
    weight: z.spaces.length > 1 && sp.kind !== 'workshop' ? 3 : kindWeight[sp.kind] ?? 1.4, groups, zone: z,
    lights: rows.filter(d => typeById[d.type].ui.function === 'light'),
    climate: rows.filter(d => typeById[d.type].ui.function === 'climate'),
    media: rows.filter(d => typeById[d.type].ui.function === 'media')
  };
});
export const roomById = Object.fromEntries(rooms.map(r => [r.id, r]));
const lv = (l: number) => (l === 99 ? -1 : l);
export const floors = [...P.floors].sort((a, b) => lv(b.level) - lv(a.level))
  .filter(f => rooms.some(r => r.floor === f.id)).map(f => ({ ...f, rooms: rooms.filter(r => r.floor === f.id && r.kind !== 'stairs') }));
export const stairs = rooms.find(r => r.kind === 'stairs');

// ——— симуляция состояния ———
const seed = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967295; };
const lit: Record<string, number[]> = { 'z-living': [70, 40, 30], 'kitchen': [80, 50], 'hall1': [30], 'bed': [0, 0, 20], 'z-stairs': [15, 15], 'hallway': [40] };
const light: Record<string, number> = {};
for (const r of rooms) r.lights.forEach((d, i) => (light[d.id] = Math.max(light[d.id] ?? 0, lit[r.id]?.[i] ?? 0)));

const temp: Record<string, { cur: number; target: number; ac: boolean; floorHeat: boolean }> = {};
for (const r of rooms) {
  if (!r.climate.length) continue;
  const bath = r.kind === 'bath';
  const target = bath ? 24 : r.kind === 'bedroom' || r.kind === 'kids' ? 21 : 22;
  const off: Record<string, number> = { bed: -0.9, cabinet: 1.3, bath2b: -1.1 };
  temp[r.id] = { cur: +(target - 0.5 + seed(r.id) + (off[r.id] ?? 0)).toFixed(1), target, ac: r.climate.some(d => d.type === 'climate.ac') && r.id === 'cabinet', floorHeat: r.climate.some(d => d.type === 'climate.floor') };
}
const media: Record<string, { title: string; sub: string; art: string; playing: boolean } | null> = {
  'z-living': { title: 'Северный свет', sub: 'Кинотеатр · Kodi 1', art: 'm01', playing: true },
  kitchen: { title: 'Утро', sub: 'Радио · Стример 1', art: 'r6', playing: true },
  'bath2b': { title: 'Утро', sub: 'Радио · вместе с кухней', art: 'r6', playing: true }
};
const sec: Record<string, { open: number; motion: boolean; leak: boolean }> = {
  kids: { open: 1, motion: false, leak: false }, kitchen: { open: 0, motion: true, leak: false }, 'z-living': { open: 0, motion: true, leak: false }
};

const dev: Record<string, { on?: boolean; pos?: number }> = {};
for (const r of rooms) for (const g of r.groups) for (const d of g.rows) if (g.fn !== 'light') dev[d.id] = { on: false, pos: g.fn === 'shades' && r.id === 'bed' ? 0 : 100 };
export const S = $state({ dev, light, temp, media, sec, armed: 'off' as 'off' | 'perimeter' | 'full', people: { 'z-living': 2, kitchen: 1 } as Record<string, number> });

// ——— производные для ячеек ———
export const lightsOn = (r: Room) => r.lights.filter(d => S.light[d.id] > 0).length;
export const lightLevel = (r: Room) => (r.lights.length ? r.lights.reduce((a, d) => a + S.light[d.id], 0) / r.lights.length / 100 : 0);
export const anyAlert = (r: Room) => !!S.sec[r.id] && (S.sec[r.id].open > 0 || S.sec[r.id].leak);
export function toggleRoomLights(r: Room) {
  const on = lightsOn(r) > 0;
  r.lights.forEach((d, i) => (S.light[d.id] = on ? 0 : i === 0 ? 80 : 40));
}
export function summary(l: Layer) {
  const withLight = rooms.filter(r => lightsOn(r));
  if (l === 'light') return `Свет горит в ${withLight.length} комнатах`;
  if (l === 'climate') { const t = Object.values(S.temp); return `В среднем ${(t.reduce((a, x) => a + x.cur, 0) / t.length).toFixed(1).replace('.', ',')}° · отопление · кондиционеры заблокированы`; }
  if (l === 'media') return `Играет в ${Object.values(S.media).filter(Boolean).length} зонах`;
  if (l === 'security') { const open = Object.entries(S.sec).filter(([, v]) => v.open).map(([k]) => roomById[k].name); return `${S.armed === 'off' ? 'Охрана снята' : 'Под охраной'}${open.length ? ` · открыто окно: ${open.join(', ')}` : ''}`; }
  return `${Object.values(S.people).reduce((a, b) => a + b, 0)} человека дома · свет в ${withLight.length} комнатах · музыка в ${Object.values(S.media).filter(Boolean).length} зонах`;
}
export const hue = (s: string) => Math.floor(seed(s) * 360);

// Фото комнат. Пара «день / вечер» — для живого света; есть не у всех: остальным хватает листа.
const photos: Record<string, { day?: string; eve?: string }> = {
  'z-living': { day: 'photos/lipovaya/living-day.jpg', eve: 'photos/lipovaya/living-evening.jpg' },
  kitchen: { eve: 'photos/kitchen-evening.jpg' },
  bed: { eve: 'photos/bedroom-evening.jpg' },
  cabinet: { eve: 'photos/office-evening.jpg' },
  hall1: { eve: 'photos/dining-evening.jpg' },
  entrance: { day: 'photos/house-day.jpg', eve: 'photos/house-dusk.jpg' }
};
export const photoOf = (zone: string) => photos[zone] ?? null;
export function deviceById(id: string) {
  for (const r of rooms) for (const g of r.groups) for (const d of g.rows) if (d.id === id) return { d, r, g };
  return null;
}
