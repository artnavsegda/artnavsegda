// Протокол между ядром дома и клиентом.
// Сейчас его обслуживает симулятор в браузере (InProcTransport),
// в продукте — WebSocket к серверу на объекте. Клиент не знает разницы.

export type Capability =
  | 'switch' | 'dimmer' | 'colorTemp' | 'shade' | 'climate'
  | 'media' | 'speaker' | 'vacuum' | 'camera' | 'pool' | 'floorHeat';

/** Ассеты устройства: что скин может показать. */
export interface DeviceAssets {
  model?: 'dome' | 'floor' | 'speaker' | 'vacuum';
  /** Фото устройства, вкл/выкл; в прототипе постеры рендерятся из модели при старте. */
  poster?: { off?: string; on?: string };
}

export interface DeviceDef {
  id: string;
  room: string;
  name: string;
  caps: Capability[];
  /** Координаты на плане этажа (система координат плана 820×640). */
  plan?: [number, number];
  /** Хотспоты на фото комнаты: id фото → координаты в пикселях исходника. */
  spots?: Record<string, [number, number]>;
  assets?: DeviceAssets;
}

export interface PhotoDef { src: string; w: number; h: number; }

export interface RoomDef {
  id: string;
  name: string;
  area: number;
  /** Прямоугольник на плане. */
  rect: [number, number, number, number];
  labelAt: [number, number];
  glowAt?: [number, number, number];
  photo?: { night: string; day?: string };
}

export interface SceneDef { id: string; name: string; set: Record<string, Partial<DeviceState>>; arm?: SecurityMode }

export interface HouseDef {
  name: string;
  rooms: RoomDef[];
  devices: DeviceDef[];
  photos: Record<string, PhotoDef>;
  scenes: SceneDef[];
  roomScenes: Record<string, SceneDef[]>;
  cameras: { id: string; name: string; sub: string }[];
  zones: { id: string; name: string }[];
}

export interface DeviceState {
  on?: boolean;
  level?: number;          // 0..100
  ct?: number;             // K
  position?: number;       // штора, открыта на %
  current?: number;        // °C
  target?: number;         // °C
  mode?: 'heat' | 'cool' | 'auto' | 'off';
  humidity?: number;
  playing?: boolean;
  volume?: number;
  title?: string;
  source?: string;
  progress?: number;       // 0..1
  status?: 'docked' | 'cleaning' | 'returning';
  battery?: number;
  cleaned?: number;        // м²
  motion?: boolean;
  temp?: number;
  /** Значение не подтверждено обратной связью (ИК и т.п.). */
  assumed?: boolean;
}

export type SecurityMode = 'disarmed' | 'perimeter' | 'full';

export interface HomeEvent { id: number; time: string; title: string; text: string; kind: 'info' | 'warn' | 'scene' | 'security' }

export interface Suggestion { id: string; title: string; text: string; action: { label: string; scene: string } }

export interface HomeState {
  devices: Record<string, DeviceState>;
  presence: Record<string, number>;
  walker: { room: string; t: number } | null;
  security: { mode: SecurityMode; since: string; zones: Record<string, 'ok' | 'open' | 'motion'> };
  events: HomeEvent[];
  scene: string;
  roomScene: Record<string, string>;
  power: number;
  outside: number;
  suggestion: Suggestion | null;
  /** камера → сейчас видит движение */
  cameras: Record<string, boolean>;
  /** Тёмное время суток на объекте: от него зависит тема и набор сцен. */
  night: boolean;
}

export type ServerMsg =
  | { type: 'snapshot'; state: HomeState }
  | { type: 'delta'; changes: [string, unknown][] }
  | { type: 'ack'; id: number; ok: boolean; error?: string };

export type Command =
  | { cmd: 'light.set'; target: string; on?: boolean; level?: number; ct?: number }
  | { cmd: 'shade.set'; target: string; position: number }
  | { cmd: 'climate.set'; target: string; target_c?: number; mode?: DeviceState['mode'] }
  | { cmd: 'media.action'; target: string; action: 'toggle' | 'play' | 'pause' | 'power' | 'vol' ; delta?: number }
  | { cmd: 'vacuum.action'; target: string; action: 'start' | 'dock' }
  | { cmd: 'scene.run'; scene: string; room?: string }
  | { cmd: 'security.arm'; mode: SecurityMode }
  | { cmd: 'demo.event'; kind: 'doorbell' | 'motion' | 'leak-test' }
  | { cmd: 'demo.time'; night: boolean };

export interface Transport {
  send(c: Command): Promise<void>;
  subscribe(fn: (m: ServerMsg) => void): () => void;
}
