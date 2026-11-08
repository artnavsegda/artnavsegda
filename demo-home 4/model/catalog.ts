import type { DeviceType } from './schema.ts';

// Каталог типов — общий для всех объектов. Тип описывается один раз:
// пульт телевизора, диммер, мотор шторы. В проекте объекта — только экземпляры.

const t = (x: DeviceType) => x;

export const catalog: DeviceType[] = [
  t({ id: 'light.dimmer', name: 'Диммер', traits: ['onoff', 'level'], commands: { toggle: {}, set: { level: '0..100' }, saveLevel: {} }, ui: { icon: 'bulb', widget: 'dimmer', function: 'light' } }),
  t({ id: 'light.switch', name: 'Выключатель', traits: ['onoff'], commands: { toggle: {} }, ui: { icon: 'bulb', widget: 'switch', function: 'light' } }),
  t({ id: 'shade.motor', name: 'Мотор шторы', traits: ['position'], commands: { open: {}, close: {}, stop: {}, set: { position: '0..100' } }, ui: { icon: 'shade', widget: 'shade', function: 'shades' } }),
  t({ id: 'av.screen', name: 'Экран проектора', traits: ['position', 'transition'], commands: { present: {}, hide: {} }, ui: { icon: 'shade', widget: 'none', function: 'media' } }),
  t({ id: 'av.tv', name: 'Телевизор (ИК)', traits: ['power', 'input', 'volume'], commands: { power: {}, input: { n: 'hdmi1..3' }, key: { key: 'профиль ИК' } }, ui: { icon: 'media', widget: 'mediaZone', function: 'media' } }),
  t({ id: 'av.projector', name: 'Проектор', traits: ['power', 'transition'], commands: { power: {} }, ui: { icon: 'media', widget: 'mediaZone', function: 'media' } }),
  t({ id: 'av.receiver', name: 'Ресивер', traits: ['power', 'input', 'volume', 'mute'], commands: { power: {}, input: { n: 'string' }, volume: { v: '0..100' } }, ui: { icon: 'speaker', widget: 'none', function: 'media' } }),
  t({ id: 'av.audiozone', name: 'Зона мультирума', traits: ['power', 'input', 'volume', 'mute', 'nowPlaying'], commands: { power: {}, source: { id: 'id' }, volume: { v: '0..100' } }, ui: { icon: 'speaker', widget: 'mediaZone', function: 'media' } }),
  t({ id: 'av.source', name: 'Источник', traits: ['power', 'playback', 'nowPlaying'], commands: { key: { key: 'up|down|left|right|ok|menu|play' } }, ui: { icon: 'play', widget: 'none', function: 'media' } }),
  t({ id: 'av.matrix', name: 'HDMI-матрица', traits: ['input'], commands: { route: { input: 'n', output: 'n' } }, ui: { icon: 'grid', widget: 'none', function: 'service' } }),
  t({ id: 'climate.floor', name: 'Тёплый пол', traits: ['onoff', 'temperature', 'setpoint'], commands: { set: { setpoint: '°C' }, toggle: {} }, ui: { icon: 'flame', widget: 'thermostat', function: 'climate' } }),
  t({ id: 'climate.radiator', name: 'Радиатор', traits: ['onoff', 'temperature', 'setpoint'], commands: { set: { setpoint: '°C' }, toggle: {} }, ui: { icon: 'climate', widget: 'thermostat', function: 'climate' } }),
  t({ id: 'climate.ac', name: 'Кондиционер', traits: ['onoff', 'temperature', 'setpoint', 'mode', 'fanSpeed'], commands: { set: { setpoint: '°C', mode: 'cool|heat|fan|dry|auto' }, toggle: {} }, ui: { icon: 'snow', widget: 'thermostat', function: 'climate' } }),
  t({ id: 'vent.unit', name: 'Приточная установка', traits: ['onoff', 'setpoint', 'temperature', 'fanSpeed'], commands: { toggle: {}, set: { setpoint: '°C', fanSpeed: '1..3' } }, ui: { icon: 'leaf', widget: 'thermostat', function: 'ventilation' } }),
  t({ id: 'vent.fan', name: 'Вытяжка', traits: ['onoff', 'level'], commands: { toggle: {}, set: { level: '0..100' } }, ui: { icon: 'leaf', widget: 'switch', function: 'ventilation' } }),
  t({ id: 'sensor.occupancy', name: 'Датчик присутствия', traits: ['occupancy'], commands: {}, ui: { icon: 'person', widget: 'sensor', function: 'security', statusOnly: true } }),
  t({ id: 'security.sensor', name: 'Датчик охраны', traits: ['contact', 'alarm', 'battery'], commands: { bypass: {} }, ui: { icon: 'shield', widget: 'sensor', function: 'security', statusOnly: true } }),
  t({ id: 'security.panel', name: 'Охранная панель', traits: ['armed', 'alarm'], commands: { arm: { partition: 'id' }, disarm: { partition: 'id' } }, ui: { icon: 'shield', widget: 'none', function: 'security' } }),
  t({ id: 'access.gate', name: 'Ворота', traits: ['contact'], commands: { open: {}, close: {} }, ui: { icon: 'lock', widget: 'action', function: 'access' } }),
  t({ id: 'keypad', name: 'Клавишная панель', traits: [], commands: {}, ui: { icon: 'grid', widget: 'none', function: 'service' } })
];

export const typeById = Object.fromEntries(catalog.map(x => [x.id, x]));
