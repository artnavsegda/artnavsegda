import { house, devicesIn } from '../core/house';
import { home, dev } from './store.svelte';

// Производные величины для экранов: всё считается из состояния, ничего не хранится.

export const isLight = (id: string) => house.devices.find(d => d.id === id)?.caps.includes('dimmer') ?? false;

/** Средняя «освещённость» комнаты 0..1 по светильникам. */
export function roomLight(room: string) {
  const ls = devicesIn(room).filter(d => d.caps.includes('dimmer'));
  if (!ls.length) return 0;
  const sum = ls.reduce((a, d) => a + (dev(d.id).level ?? 0), 0);
  return Math.min(1, sum / (ls.length * 100) * 1.5);
}

export const lightsOn = (room?: string) =>
  house.devices.filter(d => d.caps.includes('dimmer') && (!room || d.room === room) && (dev(d.id).level ?? 0) > 0).length;

export function roomTemp(room: string) {
  const c = house.devices.find(d => d.room === room && d.caps.includes('climate'));
  return c ? dev(c.id).current : undefined;
}

export const people = (room: string) => home.s?.presence[room] ?? 0;
export const walkerIn = (room: string) => home.s?.walker?.room === room;
export const occupied = (room: string) => people(room) > 0 || walkerIn(room);

export const fmtT = (v?: number) => v === undefined ? '—' : v.toFixed(1).replace('.', ',');

export const sceneIcon: Record<string, string> = { day: 'sun', evening: 'bulb', cinema: 'media', guests: 'person', night: 'moon', away: 'lock' };

/** Сцены, уместные сейчас: днём «Вечер» не первый, вечером «День» уходит в конец. */
export function sceneOrder() {
  const night = home.s?.night;
  const order = night ? ['evening', 'cinema', 'guests', 'night', 'away', 'day'] : ['day', 'guests', 'cinema', 'away', 'evening', 'night'];
  return order.map(id => house.scenes.find(s => s.id === id)!);
}

// часы для заголовков
export const clock = $state({ now: new Date() });
if (typeof window !== 'undefined') setInterval(() => (clock.now = new Date()), 15000);

export function greeting() {
  const h = clock.now.getHours();
  if (!home.s?.night) return h < 12 ? 'Доброе утро' : 'Добрый день';
  return h >= 5 && h < 18 ? 'Добрый вечер' : h < 5 ? 'Доброй ночи' : 'Добрый вечер';
}

export function dateLine() {
  const d = clock.now;
  const wd = d.toLocaleDateString('ru-RU', { weekday: 'long' });
  const dm = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const hm = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${wd}, ${dm} · ${hm}`;
}

export const pluralPeople = (n: number) => n === 1 ? '1 человек' : n >= 2 && n <= 4 ? `${n} человека` : `${n} человек`;
