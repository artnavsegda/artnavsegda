import type { DeviceDef } from '../core/types';
import type { HeroKind } from '../house/hero3d';

// Какой предмет из библиотеки показывает устройство прототипа: по возможностям, виду и имени.
export function heroOf(d: DeviceDef): HeroKind | null {
  const k = d.kind ?? '', c = d.caps, n = d.name.toLowerCase();
  if (c.includes('dimmer') || (c.includes('switch') && /свет|ламп|бра/.test(n))) {
    if (k === 'sconce' || /бра/.test(n)) return 'sconce';
    if (k === 'chandelier' || /люстр/.test(n)) return 'chandelier';
    if (k === 'pendant' || /подвес|над столом|над островом/.test(n)) return 'pendant';
    if (k === 'floor' || k === 'table' || /торшер|лампа|ночник/.test(n)) return 'lamp';
    if (k === 'mood' || k === 'accent' || k === 'mirror' || k === 'strip' || /лента|подсвет|зеркал/.test(n)) return 'strip';
    return 'spots';
  }
  if (c.includes('shade')) return 'curtain';
  if (c.includes('floorHeat')) return 'floorheat';
  if (c.includes('climate')) return k === 'ac' || /кондиц/.test(n) ? 'ac' : 'radiator';
  if (c.includes('speaker')) return 'speaker';
  if (c.includes('media')) return k === 'projector' || /проектор/.test(n) ? 'projector' : 'tv';
  if (k === 'gate' || /ворот/.test(n)) return 'gate';
  return null;
}

/** Значок устройства, когда своего предмета в библиотеке нет. */
export function iconOf(d: DeviceDef): string {
  const c = d.caps, k = d.kind ?? '';
  return c.includes('dimmer') ? 'bulb' : c.includes('shade') ? 'shade' : c.includes('climate') ? (k === 'ac' ? 'snow' : 'climate') : c.includes('media') ? (k === 'console' ? 'play' : 'media')
    : c.includes('speaker') ? 'speaker' : c.includes('vacuum') ? 'vacuum' : c.includes('floorHeat') || c.includes('fireplace') ? 'flame'
    : c.includes('lock') ? 'lock' : c.includes('doorbell') ? 'bell' : c.includes('occupancy') ? 'person' : c.includes('fan') ? 'leaf' : c.includes('glass') ? 'grid'
    : c.includes('appliance') ? (k === 'fridge' ? 'snow' : k === 'oven' ? 'flame' : k === 'av' ? 'media' : 'bolt') : 'bolt';
}
