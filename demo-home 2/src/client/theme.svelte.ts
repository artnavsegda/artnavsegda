import { home } from './store.svelte';

// Тренд — это не только палитра: флаги возможностей (шейдеры, стекло, 3D),
// скины контролов и варианты раскладки. Компоненты спрашивают тренд,
// а не проверяют его имя, поэтому новый тренд не требует правки экранов.

export interface Trend {
  id: 'warm' | 'minimal';
  name: string;
  tagline: string;
  features: {
    /** живой шейдерный фон */
    ambient: boolean;
    /** шейдерные пятна света поверх фото */
    relight: boolean;
    /** 3D-рендер устройства на карточке */
    posters: boolean;
    /** свечение комнат на плане (иначе — заливка штриховкой) */
    planGlow: boolean;
  };
  skins: {
    toggle: 'pill' | 'rocker';
    slider: 'fill' | 'hairline';
    nav: 'rail' | 'topbar';
    tabbar: 'floating' | 'flat';
    dial: 'arc' | 'ticks';
  };
  layout: {
    /** Обзор: фото слева и сетка справа, или полоса фото сверху */
    overview: 'side' | 'stacked';
  };
}

export const trends: Trend[] = [
  {
    id: 'warm', name: 'Тёплый вечер', tagline: 'стекло, свет, мягкое движение',
    features: { ambient: true, relight: true, posters: true, planGlow: true },
    skins: { toggle: 'pill', slider: 'fill', nav: 'rail', tabbar: 'floating', dial: 'arc' },
    layout: { overview: 'side' }
  },
  {
    id: 'minimal', name: 'Минимализм', tagline: 'типографика, тонкие линии, один акцент',
    features: { ambient: false, relight: false, posters: false, planGlow: false },
    skins: { toggle: 'rocker', slider: 'hairline', nav: 'topbar', tabbar: 'flat', dial: 'ticks' },
    layout: { overview: 'stacked' }
  }
];

const read = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* приватный режим */ } };

export const ui = $state({
  trendId: read('demo.trend', 'warm') as Trend['id'],
  profile: read('demo.profile', 'auto') as 'auto' | 'tablet' | 'phone',
  width: typeof window !== 'undefined' ? window.innerWidth : 1200,
  consoleOpen: false
});

export const theme = {
  get t(): Trend { return trends.find(x => x.id === ui.trendId) ?? trends[0]; },
  get mode(): 'day' | 'night' { return home.s?.night === false ? 'day' : 'night'; },
  get night() { return this.mode === 'night'; },
  /** профиль раскладки: iPad на стене/столе или телефон жителя */
  get profile(): 'tablet' | 'phone' {
    if (ui.profile !== 'auto') return ui.profile;
    return ui.width >= 860 ? 'tablet' : 'phone';
  },
  /** телефон в рамке на широком экране — для показа заказчику с ноутбука */
  get framed() { return this.profile === 'phone' && ui.width >= 600; }
};

export function setTrend(id: Trend['id']) { ui.trendId = id; write('demo.trend', id); }
export function setProfile(p: typeof ui.profile) { ui.profile = p; write('demo.profile', p); }

if (typeof window !== 'undefined') addEventListener('resize', () => { ui.width = innerWidth; });

/** Применяет тренд и режим к корню документа. */
export function applyTheme() {
  $effect(() => {
    const r = document.documentElement;
    r.dataset.trend = theme.t.id;
    r.dataset.mode = theme.mode;
  });
}

/** Читает токен цвета как [r,g,b] 0..1 — для шейдеров. */
export function tokenRGB(name: string): [number, number, number] {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) { const n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  const r = v.match(/rgba?\(([^)]+)\)/);
  if (r) { const [a, b, c] = r[1].split(',').map(parseFloat); return [a / 255, b / 255, c / 255]; }
  return [0, 0, 0];
}
