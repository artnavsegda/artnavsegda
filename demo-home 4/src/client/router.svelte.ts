// Маршруты — простые #имена (адрес можно отправить заказчику: #security, #room-kitchen).
// Аргумент идёт через первый дефис: room-kitchen, lamp-living-dining.

export type RouteName = 'plan' | 'rooms' | 'room' | 'photo' | 'overview' | 'house' | 'security' | 'home' | 'climate' | 'media' | 'lamp' | 'ar';

// Вкладки: «где» (Дом/Комнаты) и «что» (Медиа, Климат, Охрана). Страница комнаты,
// фото и устройство — уровни глубже, своей вкладки у них нет: подсвечивается родитель.
export const routes: { name: RouteName; title: string; tablet: boolean; phone: boolean; parent?: RouteName }[] = [
  { name: 'home', title: 'Сводка', tablet: true, phone: true },
  { name: 'plan', title: 'Дом', tablet: true, phone: true },
  { name: 'rooms', title: 'Комнаты', tablet: true, phone: false },
  { name: 'media', title: 'Медиа', tablet: true, phone: true },
  { name: 'climate', title: 'Климат', tablet: true, phone: true },
  { name: 'security', title: 'Охрана', tablet: true, phone: true },
  { name: 'overview', title: 'Обзор', tablet: true, phone: false },
  { name: 'house', title: 'Участок', tablet: true, phone: false },
  { name: 'room', title: 'Комната', tablet: false, phone: false, parent: 'plan' },
  { name: 'photo', title: 'Фото комнаты', tablet: false, phone: false, parent: 'plan' },
  { name: 'lamp', title: 'Устройство', tablet: false, phone: false, parent: 'plan' },
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


/** откуда пришли на экран: 'go' — переход вперёд (новый экран открывается сверху), 'back' — «назад» (позиция восстанавливается) */
export const nav = { kind: 'back' as 'go' | 'back' };
let pending = false;
if (typeof window !== 'undefined') addEventListener('hashchange', () => { nav.kind = pending ? 'go' : 'back'; pending = false; Object.assign(route, parse(location.hash)); });

export function go(name: RouteName, arg = '') {
  const h = '#' + name + (arg ? '-' + arg : '');
  if (location.hash === h) { dispatchEvent(new Event('tab-reselect')); return; }
  pending = true;
  location.hash = h;
}

/** id устройства ⇄ аргумент маршрута (точка недопустима в #имени) */
export const devArg = (id: string) => id.replace('.', '-');
export const argDev = (a: string) => a.replace('-', '.');
