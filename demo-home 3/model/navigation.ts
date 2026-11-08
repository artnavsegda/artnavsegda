import type { Device, FunctionId, Id, Project, Zone } from './schema.ts';
import { typeById } from './catalog.ts';

// Навигация выводится из модели, а не пишется руками под объект.
//   «Где»: этаж → зона-комната → группы по функциям → устройства.
//   «Что»: функция → этаж → зона → устройства.
// Один и тот же вывод используют телефон, планшет и стенная панель.

export const functionNames: Record<FunctionId, string> = {
  light: 'Свет', shades: 'Шторы', media: 'Медиа', climate: 'Климат', ventilation: 'Вентиляция',
  security: 'Охрана', access: 'Ворота и замки', appliances: 'Техника', service: 'Служебное'
};
export const functionOrder: FunctionId[] = ['light', 'shades', 'media', 'climate', 'ventilation', 'security', 'access', 'appliances'];

export type Audience = 'resident' | 'service';

const visible = (d: Device, who: Audience) =>
  who === 'service' || (!d.flags?.hidden && !d.flags?.serviceOnly && typeById[d.type].ui.function !== 'service');

/** Зоны-комнаты: явно описанные + по одной на каждое помещение, которое ни в одну не вошло. */
export function roomZones(p: Project): Zone[] {
  const covered = new Set(p.zones.filter(z => z.kind === 'room').flatMap(z => z.spaces));
  const auto: Zone[] = p.spaces.filter(s => !covered.has(s.id) && !s.flags?.hidden)
    .map(s => ({ id: s.id, name: s.name, spaces: [s.id], kind: 'room' as const }));
  return [...p.zones.filter(z => z.kind === 'room'), ...auto];
}

export function zoneFloor(p: Project, z: Zone): Id {
  return z.floor ?? p.spaces.find(s => s.id === z.spaces[0])!.floor;
}

export function devicesOf(p: Project, z: Zone, who: Audience = 'resident'): Device[] {
  const ex = new Set(z.exclude ?? []);
  const inc = new Set(z.include ?? []);
  return p.devices
    .filter(d => (z.spaces.includes(d.space) && !ex.has(d.id) && d.scope !== 'house') || inc.has(d.id))
    .filter(d => visible(d, who))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export interface Group { fn: FunctionId; name: string; rows: Device[]; status: Device[] }

/** Страница зоны: группы по функциям; датчики уходят в строку статуса. */
export function zonePage(p: Project, z: Zone, who: Audience = 'resident'): Group[] {
  const list = devicesOf(p, z, who);
  return functionOrder.map(fn => {
    const ds = list.filter(d => typeById[d.type].ui.function === fn);
    return { fn, name: functionNames[fn], rows: ds.filter(d => !typeById[d.type].ui.statusOnly && typeById[d.type].ui.widget !== 'none'), status: ds.filter(d => typeById[d.type].ui.statusOnly) };
  }).filter(g => g.rows.length || g.status.length);
}

export interface WhereFloor { id: Id; name: string; zones: { zone: Zone; groups: Group[]; rows: number }[] }

export function whereTree(p: Project, who: Audience = 'resident'): WhereFloor[] {
  const zs = roomZones(p);
  return [...p.floors].sort((a, b) => a.level - b.level).map(f => ({
    id: f.id, name: f.name,
    zones: zs.filter(z => zoneFloor(p, z) === f.id).sort((a, b) => (a.order ?? 50) - (b.order ?? 50))
      .map(zone => { const groups = zonePage(p, zone, who); return { zone, groups, rows: groups.reduce((n, g) => n + g.rows.length, 0) }; })
      .filter(x => x.rows || x.groups.length)
  })).filter(f => f.zones.length);
}

export interface WhatFunction { fn: FunctionId; name: string; floors: { id: Id; name: string; zones: { zone: Zone; rows: Device[] }[] }[]; total: number }

export function whatTree(p: Project, who: Audience = 'resident'): WhatFunction[] {
  const where = whereTree(p, who);
  const house = p.devices.filter(d => d.scope === 'house' && visible(d, who));
  return functionOrder.map(fn => {
    const top = house.filter(d => typeById[d.type].ui.function === fn);
    const whole = top.length ? [{ id: 'house', name: 'Весь дом', zones: [{ zone: { id: 'house', name: 'Весь дом', spaces: [], kind: 'group' as const }, rows: top }] }] : [];
    const floors = [...whole, ...where.map(f => ({
      id: f.id, name: f.name,
      zones: f.zones.map(z => ({ zone: z.zone, rows: z.groups.find(g => g.fn === fn)?.rows ?? [] })).filter(z => z.rows.length)
    }))].filter(f => f.zones.length);
    return { fn, name: functionNames[fn], floors, total: floors.reduce((n, f) => n + f.zones.reduce((m, z) => m + z.rows.length, 0), 0) };
  }).filter(x => x.total);
}
