// Модель проекта объекта — основа под всеми слоями (docs/12-foundation.md).
// Один и тот же проект читают ядро, драйверы, приложение жильца и сервисная панель.
// Правило: каждая сущность существует один раз; ссылки — только по id; validate.ts их проверяет.

export type Id = string;

/** Почему что-то скрыто или выключено — всегда с причиной, а не переименованием в «(не работают)». */
export interface Flags {
  /** Не показывать жильцу (есть в доме, но не нужно в интерфейсе). */
  hidden?: string;
  /** Временно не работает: показывать серым с причиной, команды не слать. */
  disabled?: string;
  /** Видно только в сервисной панели (клавишные панели, служебные контуры). */
  serviceOnly?: string;
}

export interface Site { id: Id; name: string; address?: string }

export interface Floor {
  id: Id;
  name: string;
  /** Порядок сверху вниз: 0 — цоколь, 1, 2, 3; участок — 99. */
  level: number;
  outdoor?: boolean;
}

export type SpaceKind =
  | 'living' | 'kitchen' | 'dining' | 'bedroom' | 'kids' | 'office' | 'workshop' | 'bath' | 'hall' | 'hallway'
  | 'stairs' | 'tech' | 'boiler' | 'garage' | 'balcony' | 'outdoor' | 'other';

/** Помещение по проекту — как на планах и в электропроекте. */
export interface Space {
  id: Id;
  floor: Id;
  name: string;
  kind: SpaceKind;
  /** Код по электропроекту: L3, L6… Им подписаны контуры (L6-1, S6-2). */
  code?: string;
  /** Как ещё называют: для поиска и для импорта старых проектов. */
  aliases?: string[];
  area?: number;
  flags?: Flags;
}

/**
 * Зона — то, как дом видит жилец. По умолчанию каждое помещение — своя зона (ядро создаёт их
 * само); явно описываются только отличия: открытая планировка, общие зоны, группы помещений.
 */
export interface Zone {
  id: Id;
  name: string;
  /** Помещения, все устройства которых входят в зону. */
  spaces: Id[];
  /** Отдельные устройства из других помещений (светильник холла, который светит в гостиную). */
  include?: Id[];
  /** Устройства этих помещений, которые в зону не входят. */
  exclude?: Id[];
  /** room — зона-комната (заменяет зоны своих помещений); group — дополнительная группа («Все ванные»). */
  kind: 'room' | 'group';
  /** На каком этаже показывать зону-комнату, если помещения на разных этажах. */
  floor?: Id;
  order?: number;
}

export type TypeId = string;

/** Свойства состояния. Тип устройства — набор свойств + команды + подсказки интерфейсу. */
export type Trait =
  | 'onoff' | 'level' | 'colorTemp' | 'position' | 'tilt'
  | 'temperature' | 'setpoint' | 'mode' | 'fanSpeed' | 'humidity' | 'co2'
  | 'power' | 'input' | 'volume' | 'mute' | 'playback' | 'nowPlaying' | 'transition'
  | 'occupancy' | 'contact' | 'alarm' | 'battery' | 'locked' | 'armed';

/** Что-ось: раздел приложения и группа на странице зоны. */
export type FunctionId = 'light' | 'shades' | 'media' | 'climate' | 'ventilation' | 'security' | 'access' | 'appliances' | 'service';

export interface DeviceType {
  id: TypeId;
  name: string;
  traits: Trait[];
  commands: Record<string, Record<string, string>>;
  ui: {
    icon: string;
    /** Виджет по умолчанию: строка с переключателем, диммер, штора, климат, медиа-зона, датчик… */
    widget: 'switch' | 'dimmer' | 'shade' | 'thermostat' | 'mediaZone' | 'source' | 'sensor' | 'action' | 'none';
    function: FunctionId;
    /** Датчики не занимают строки: их состояние идёт в строку статуса зоны. */
    statusOnly?: boolean;
  };
}

/** Привязка к шине. Единственное место, где живут joins Crestron, группы KNX, регистры Modbus. */
export interface Binding {
  driver: string;
  [key: string]: unknown;
}

export interface Device {
  id: Id;
  type: TypeId;
  /** Где устройство стоит физически. Показывается в зоне этого помещения и в зонах, которые его включают. */
  space: Id;
  name: string;
  /** Роль внутри функции: main, accent, sconce, mood, mirror, outlet… — для сцен, сортировки, иконок. */
  role?: string;
  /** Код контура по электропроекту: L6-1, S6-2. */
  code?: string;
  order?: number;
  /** house — оборудование на весь дом (приточка, котёл): в разделе функции и в обзоре дома, но не на странице помещения. */
  scope?: 'house';
  bind?: Binding;
  flags?: Flags;
  /** Для импорта: откуда взялась запись. */
  legacy?: string[];
}

// ——— подсистемы ———

export interface MediaZone {
  id: Id;
  name: string;
  space: Id;
  /** Экраны и звук зоны: телевизор, проектор, ресивер, зона мультирума. */
  sinks: Id[];
  /** Какие источники доступны (через матрицу или локальные). */
  sources: Id[];
}
export interface MediaModel { matrix?: Id; sources: Id[]; zones: MediaZone[] }

export interface SecurityPartition { id: Id; name: string }
export interface SecurityModel {
  partitions: SecurityPartition[];
  /** Датчик → разделы. Датчики сами — обычные устройства с помещением. */
  sensors: Record<Id, Id[]>;
}

export interface Scene {
  id: Id;
  name: string;
  /** house — сцена всего дома; иначе id зоны. */
  scope: 'house' | Id;
  flags?: Flags;
  bind?: Binding;
  icon?: string;
}

export interface Project {
  schema: 1;
  site: Site;
  floors: Floor[];
  spaces: Space[];
  zones: Zone[];
  devices: Device[];
  media?: MediaModel;
  security?: SecurityModel;
  scenes: Scene[];
  /** Отчёт импорта: что не перенеслось и почему. */
  notes?: string[];
}
