import { movies, series, channels, radio, playlists, appleApps, type Movie, type Series, type Playlist } from '../../model/media/library.ts';
import type { Content } from '../../model/media/engine.ts';
import { hash } from './state.svelte';

// Каталог медиацентра: то, что на объекте приходит из Kodi (JSON-RPC: медиатека, обложки,
// рейтинги, актёры, дорожки, поиск субтитров) и из стримера (плейлисты, хиты, радио).
// В прототипе метаданные выводятся из ключа детерминированно — чтобы экраны были полными.

const pick = <T>(arr: T[], seed: number, n = 1) => Array.from({ length: n }, (_, i) => arr[(seed >> (i * 3)) % arr.length]).filter((v, i, a) => a.indexOf(v) === i);
const directors = ['Анна Мельникова', 'Игорь Савин', 'Олег Ракитин', 'Вера Гордеева', 'Пётр Лаптев', 'Дина Ахмерова', 'Никита Орлов'];
const actors = ['Максим Белов', 'Ольга Зорина', 'Сергей Ветров', 'Алиса Нагорная', 'Тимур Каримов', 'Юлия Ланская', 'Артём Шубин', 'Мария Котова', 'Глеб Рощин', 'Нина Арсеньева', 'Лев Ковальский', 'Ева Чернова'];

export interface Sub { id: string; lang: string; name: string; source: string; downloads: number; sdh?: boolean }
export interface Meta {
  ratings: { kp: number; imdb: number }; director: string; cast: string[]; tagline: string;
  quality: string; audio: string[]; subs: Sub[]; progress: number; backdropHue: number
}

const taglines = ['Иногда дорога домой длиннее, чем кажется', 'Каждый ход что-то значит', 'Тишина говорит громче слов', 'Связь потеряна. Сигнал — нет', 'Самое интересное начинается после титров'];
const resume: Record<string, number> = { m02: .37, m07: .64, tv1s1e3: .58, tv2s1e2: .21 };

export function meta(id: string, title: string): Meta {
  const h = hash(id);
  const r = (a: number, b: number, k: number) => +(a + ((h >> k) % 100) / 100 * (b - a)).toFixed(1);
  return {
    ratings: { kp: r(6.2, 8.4, 3), imdb: r(6.0, 8.6, 9) },
    director: directors[h % directors.length], cast: pick(actors, h, 5).slice(0, 4), tagline: taglines[(h >> 5) % taglines.length],
    quality: ['4K HDR', '1080p', '4K Dolby Vision'][(h >> 7) % 3],
    audio: ['Русский · Dolby Digital 5.1', 'Оригинал · DTS-HD MA 7.1', 'Русский · стерео (тифлокомментарий)'].slice(0, 2 + ((h >> 11) % 2)),
    subs: [
      { id: 'ru', lang: 'Русские', name: `${title}.ru.srt`, source: 'OpenSubtitles', downloads: 1200 + (h % 9000) },
      { id: 'ru-sdh', lang: 'Русские · для слабослышащих', name: `${title}.ru.sdh.srt`, source: 'Podnapisi', downloads: 300 + (h % 900), sdh: true },
      { id: 'en', lang: 'Английские', name: `${title}.en.srt`, source: 'OpenSubtitles', downloads: 4000 + (h % 20000) },
      { id: 'de', lang: 'Немецкие', name: `${title}.de.srt`, source: 'Addic7ed', downloads: 200 + (h % 700) }
    ],
    progress: resume[id] ?? 0, backdropHue: h % 360
  };
}
export const reviews = (title: string) => [
  { name: 'Кинопоиск', url: `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(title)}` },
  { name: 'IMDb', url: `https://www.imdb.com/find/?q=${encodeURIComponent(title)}` },
  { name: 'Letterboxd', url: `https://letterboxd.com/search/${encodeURIComponent(title)}/` }
];

// ——— музыка ———
const tr = (id: string, title: string, artist: string, dur: number, art = id): Content => ({ kind: 'track', id, title, sub: artist, art, dur });
export const hits: Content[] = [
  ['Огни большого города', 'Северное сияние', 214], ['Ветер с залива', 'Ясно', 198], ['Не спи', 'Квадрат', 187], ['Бумажный самолёт', 'Анна Ветрова', 231],
  ['Плёнка', 'Городские птицы', 205], ['Восемь утра', 'Ясно', 176], ['Морская', 'Трио Кольцова', 243], ['Последний трамвай', 'Северное сияние', 222],
  ['Солнечная сторона', 'Квартет «Сентябрь»', 199], ['Танцуй со мной', 'Квадрат', 208]
].map(([t, a, d], i) => tr(`hit${i + 1}`, t as string, a as string, d as number));

export interface Smart extends Playlist { rule: string }
const smart = (id: string, title: string, rule: string, tracks: Content[]): Smart => ({ id, title, sub: rule, rule, art: id, tracks });
const allTracks = [...playlists.flatMap(p => p.tracks), ...hits];
export const smartLists: Smart[] = [
  smart('sm1', 'Часто слушаете', 'больше 10 прослушиваний за месяц', [hits[0], hits[3], playlists[0].tracks[0], hits[6], playlists[1].tracks[1]]),
  smart('sm2', 'Новое в медиатеке', 'добавлено за 30 дней', hits.slice(4, 9)),
  smart('sm3', 'Тихий вечер', 'темп до 90 уд/мин · без слов', [...playlists[5].tracks, playlists[0].tracks[1], playlists[0].tracks[2]]),
  smart('sm4', 'Любимое на кухне', 'чаще всего играло на кухне', [...playlists[1].tracks, hits[1], hits[5]])
];
export const artists = [...new Set(allTracks.map(t => t.sub!))].slice(0, 8);

// ——— всё вместе ———
export type Item =
  | { type: 'movie'; m: Movie } | { type: 'series'; s: Series } | { type: 'playlist'; p: Playlist | Smart }
  | { type: 'channel'; c: Content } | { type: 'radio'; c: Content } | { type: 'app'; c: Content };
export const continueList = () => [
  ...movies.filter(m => resume[m.id]).map(m => ({ c: { ...m, pos: (m.dur ?? 0) * resume[m.id] }, item: { type: 'movie', m } as Item, p: resume[m.id] })),
  ...series.flatMap(s => s.seasons.flatMap(x => x.episodes).filter(e => resume[e.id]).map(e => ({ c: { ...e, pos: (e.dur ?? 0) * resume[e.id] }, item: { type: 'series', s } as Item, p: resume[e.id] })))
];
export function search(q: string) {
  const k = q.trim().toLowerCase(); if (!k) return [];
  const has = (s?: string) => !!s && s.toLowerCase().includes(k);
  return [
    ...movies.filter(m => has(m.title) || has(m.genre)).map(m => ({ type: 'movie', m }) as Item),
    ...series.filter(s => has(s.title) || has(s.genre)).map(s => ({ type: 'series', s }) as Item),
    ...[...playlists, ...smartLists].filter(p => has(p.title) || p.tracks.some(t => has(t.title) || has(t.sub))).map(p => ({ type: 'playlist', p }) as Item),
    ...channels.filter(c => has(c.title) || has(c.sub)).map(c => ({ type: 'channel', c }) as Item),
    ...radio.filter(c => has(c.title) || has(c.sub)).map(c => ({ type: 'radio', c }) as Item)
  ].slice(0, 24);
}
/** Источник по виду контента: фильмы и сериалы — Kodi, каналы — спутник, музыка — стример, приложения — Apple TV. */
export const kindFor = (c: Content) => (c.kind === 'channel' ? 'sat' : c.kind === 'radio' || c.kind === 'track' ? 'streamer' : c.kind === 'app' ? 'appletv' : 'kodi') as 'sat' | 'streamer' | 'appletv' | 'kodi';
export { movies, series, channels, radio, playlists, appleApps };
