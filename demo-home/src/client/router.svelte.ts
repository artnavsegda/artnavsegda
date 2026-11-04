// Маршруты — простые #имена (адрес можно отправить заказчику: #security, #room-kitchen).
// Аргумент идёт через первый дефис: room-kitchen, lamp-living-dining.

export type RouteName = 'plan' | 'room' | 'overview' | 'house' | 'security' | 'home' | 'climate' | 'media' | 'lamp' | 'ar';

export const routes: { name: RouteName; title: string; tablet: boolean; phone: boolean }[] = [
  { name: 'home', title: 'Главная', tablet: false, phone: true },
  { name: 'plan', title: 'План', tablet: true, phone: true },
  { name: 'room', title: 'Комната', tablet: true, phone: false },
  { name: 'overview', title: 'Обзор', tablet: true, phone: false },
  { name: 'house', title: 'Участок', tablet: true, phone: false },
  { name: 'media', title: 'Медиа', tablet: true, phone: true },
  { name: 'climate', title: 'Климат', tablet: true, phone: true },
  { name: 'security', title: 'Охрана', tablet: true, phone: true },
  { name: 'lamp', title: 'Устройство', tablet: false, phone: false },
  { name: 'ar', title: 'AR', tablet: false, phone: false }
];

function parse(h: string): { name: RouteName | ''; arg: string } {
  const s = h.replace(/^#/, '');
  const i = s.indexOf('-');
  const name = (i < 0 ? s : s.slice(0, i)) as RouteName;
  if (!routes.some(r => r.name === name)) return { name: '', arg: '' };
  return { name, arg: i < 0 ? '' : s.slice(i + 1) };
}

export const route = $state(parse(typeof location !== 'undefined' ? location.hash : ''));

if (typeof window !== 'undefined') addEventListener('hashchange', () => Object.assign(route, parse(location.hash)));

export function go(name: RouteName, arg = '') {
  const h = '#' + name + (arg ? '-' + arg : '');
  if (location.hash === h) { dispatchEvent(new Event('tab-reselect')); return; }
  location.hash = h;
}

/** id устройства ⇄ аргумент маршрута (точка недопустима в #имени) */
export const devArg = (id: string) => id.replace('.', '-');
export const argDev = (a: string) => a.replace('-', '.');
