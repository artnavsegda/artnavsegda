import { theme } from '../client/theme.svelte';
import { routes, type RouteName } from '../client/router.svelte';
import { home } from '../client/store.svelte';
import { fmtT, pluralPeople } from '../client/derive.svelte';
import { stats } from '../client/domscene.svelte';

// Общее для всех навигаций: какие разделы, какой активен, что про каждый сказать одной строкой.
export const navItems = () => routes.filter(r => (theme.profile === 'tablet' ? r.tablet : r.phone));
export const isActive = (current: string, n: string) => n === current || routes.find(r => r.name === current)?.parent === n;
export const armed = () => home.s?.security.mode !== 'disarmed';
export const hideOn = (current: string) => current === 'ar' || current === 'lamp' || current === 'photo';
export const roman = (n: number) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] ?? String(n);
export const navIcons: Record<string, string> = { home: 'room', plan: 'plan', rooms: 'door', overview: 'grid', house: 'house', media: 'media', climate: 'climate', security: 'shield' };

/** одна строка о состоянии раздела — для оглавлений «Минимализма» и «Галереи» */
export function routeStatus(name: RouteName): string {
  const s = home.s; if (!s) return '';
  const x = stats();
  switch (name) {
    case 'plan': return [x.people ? `дома ${pluralPeople(x.people)}` : 'дома никого', `свет в ${x.lit} комн.`].join(' · ');
    case 'home': return 'сцены, подсказки, избранное';
    case 'rooms': return `${x.rooms} помещений`;
    case 'media': return x.playing ? `играет в ${x.playing} комн.` : 'тишина';
    case 'climate': return x.inside !== undefined ? `внутри ${fmtT(x.inside)}°, снаружи ${fmtT(s.outside)}°` : '';
    case 'security': return x.sec === 'disarmed' ? 'охрана снята' : `охрана: ${x.secName}`;
    case 'overview': return 'все комнаты разом';
    case 'house': return 'фасад, участок, ворота';
    default: return '';
  }
}
