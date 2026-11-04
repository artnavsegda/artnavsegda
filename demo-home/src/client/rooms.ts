import { house } from '../core/house';
import type { HomeState } from '../core/types';

// Радиусы «пятен света» на фото (в пикселях исходника) — подбираются
// при адаптации дизайна объекта вместе с хотспотами.
export const glowR: Record<string, number> = {
  'living.pendant': 300, 'living.floor': 210, 'living.niche': 170, 'living.dining': 260,
  'kitchen.pendants': 320, 'kitchen.strip': 260, 'office.desk': 230, 'bedroom.sconces': 220
};

export const photoRooms = house.rooms.filter(r => r.photo).map(r => r.id);

export function photoFor(room: string, night: boolean) {
  const r = house.rooms.find(x => x.id === room);
  if (!r?.photo) return '';
  return !night && r.photo.day ? r.photo.day : r.photo.night;
}

/** Хотспоты устройства на конкретном фото. */
export function spotsOn(photo: string) {
  return house.devices.filter(d => d.spots?.[photo]).map(d => ({ id: d.id, x: d.spots![photo][0], y: d.spots![photo][1], r: glowR[d.id] ?? 200, caps: d.caps, name: d.name }));
}

/** Затемнение фото: вечерний снимок «гасим», если свет в комнате выключен. */
export function photoDim(photo: string, light: number, s: HomeState) {
  const dayPhoto = photo.endsWith('-day');
  if (dayPhoto) return 0;
  const base = s.night ? 0.62 : 0.22;
  return base * (1 - light);
}
