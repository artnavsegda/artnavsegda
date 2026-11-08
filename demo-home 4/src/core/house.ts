import type { HouseDef } from './types';
import { demo } from './houses/demo';
import { typical } from './houses/typical';

// Конфигурация объекта. На реальном объекте она собирается из проекта ETS /
// конфигурации Wiren Board и редактора плана; здесь — два готовых проекта:
// красивое демо и «псевдо-боевой» трёхэтажный дом для проверки на объёме.

export type ProjectId = 'demo' | 'typical';
export const projects: { id: ProjectId; name: string; floors: number }[] = [
  { id: 'typical', name: 'Дом на Липовой', floors: 3 },
  { id: 'demo', name: 'Демо-дом', floors: 1 }
];

const KEY = 'dd.project';
function readProject(): ProjectId {
  if (typeof window === 'undefined') return 'demo';
  try { const v = localStorage.getItem(KEY); if (v === 'demo' || v === 'typical') return v; } catch { /* нет хранилища */ }
  return window.name === 'dd.project=demo' ? 'demo' : 'typical';
}

export const projectId: ProjectId = readProject();

/** Сменить объект: клиент перезапускается с другой конфигурацией, как при переподключении к другому дому. */
export function switchProject(id: ProjectId) {
  try { localStorage.setItem(KEY, id); } catch { /* нет хранилища */ }
  window.name = 'dd.project=' + id;
  location.hash = '';
  location.reload();
}

export const house: HouseDef = projectId === 'typical' ? typical : demo;

export const floors = house.floors ?? [{ id: 1, name: '1 этаж' }];
export const roomById = Object.fromEntries(house.rooms.map(r => [r.id, r]));
export const deviceById = Object.fromEntries(house.devices.map(d => [d.id, d]));
export const devicesIn = (room: string) => house.devices.filter(d => d.room === room);
export const floorOf = (room: string) => roomById[room]?.floor ?? 1;
export const firstRoom = house.rooms[0].id;
