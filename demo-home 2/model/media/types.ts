// Медиа-подсистема: оборудование с портами, кабели, зоны потребления.
// Вся топология — данные. Пути, конфликты и планы переходов движок выводит сам (engine.ts).

export type SourceKind = 'appletv' | 'kodi' | 'sat' | 'streamer' | 'smarttv';

export interface Timing {
  /** Включение до готовности, с. */
  boot?: number;
  /** Переключение входа, с. */
  input?: number;
  /** Остывание после выключения, с: в это время включить нельзя. */
  cool?: number;
  /** Ход механики (лифт, экран), с. */
  travel?: number;
}

export type NodeRole = 'source' | 'matrix' | 'avr' | 'amp' | 'display' | 'projector' | 'screen';

export interface MediaNode {
  id: string;
  name: string;
  role: NodeRole;
  /** Для источника: вид (по нему пульт и медиатека) и что он выдаёт. */
  kind?: SourceKind;
  video?: boolean;
  audio?: boolean;
  /** Входы и выходы. У коммутатора каждый выход выбирает один вход. */
  ins?: string[];
  outs?: string[];
  /** Выход, на котором есть только звук (де-эмбеддер матрицы, аудиовыход ТВ). */
  audioOuts?: string[];
  timing?: Timing;
  /** Розетка PDU, через которую источник перезапускают. */
  outlet?: string;
  /** Как управляется — для подписи в техническом виде. */
  via?: string;
}

/** Кабель: выход узла → вход узла. */
export interface Link { from: [string, string]; to: [string, string] }

export interface MediaZone {
  id: string;
  name: string;
  /** Помещение из модели проекта. */
  space: string;
  floor: string;
  /** Экран зоны и вход, на котором он ждёт сигнал. */
  display?: string;
  /** Экран проектора: опускается при включении. */
  screen?: string;
  /** Звук зоны: узел и выход (колонки ресивера, зона усилителя) или колонки самого ТВ. */
  audio: [string, string];
  /** Зоны с общим оборудованием в одном помещении: включение одной переносит сессию из другой. */
  sharesWith?: string[];
  order?: number;
  /** Ширина ячейки в разрезе дома (доли этажа). */
  span?: number;
}

/** Разрез дома для выбора зоны: этажи сверху вниз и помещения без медиа — чтобы разрез оставался домом. */
export interface Section { floors: { id: string; name: string; others?: { name: string; span: number }[] }[] }

export interface MediaConfig { nodes: MediaNode[]; links: Link[]; zones: MediaZone[]; section?: Section }
