import type { Project } from './schema.ts';
import { typeById } from './catalog.ts';

// Проверка проекта: уникальность id и целостность ссылок. Проект с ошибками ядро не примет —
// так опечатки вроде `Kids_toom` и коллизии вроде трёх `Hall` невозможны в принципе.

export function validate(p: Project): string[] {
  const errs: string[] = [];
  const seen = new Map<string, string>();
  const reg = (kind: string, id: string) => {
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(id)) errs.push(`${kind} «${id}»: id только из латиницы, цифр, точки, дефиса`);
    if (seen.has(id)) errs.push(`id «${id}» повторяется: ${seen.get(id)} и ${kind}`);
    seen.set(id, kind);
  };
  p.floors.forEach(f => reg('этаж', f.id));
  p.spaces.forEach(s => reg('помещение', s.id));
  p.zones.forEach(z => reg('зона', z.id));
  p.devices.forEach(d => reg('устройство', d.id));
  p.scenes.forEach(s => reg('сцена', s.id));
  p.media?.zones.forEach(z => reg('медиазона', z.id));
  p.security?.partitions.forEach(x => reg('раздел охраны', x.id));

  const floors = new Set(p.floors.map(f => f.id));
  const spaces = new Set(p.spaces.map(s => s.id));
  const devices = new Set(p.devices.map(d => d.id));
  const zones = new Set(p.zones.map(z => z.id));
  const need = (ok: boolean, msg: string) => { if (!ok) errs.push(msg); };

  for (const s of p.spaces) need(floors.has(s.floor), `помещение ${s.id}: нет этажа ${s.floor}`);
  const names = new Map<string, string>();
  for (const s of p.spaces) {
    const key = `${s.floor}|${s.name.toLowerCase()}`;
    need(!names.has(key), `помещения ${names.get(key)} и ${s.id} называются одинаково на одном этаже: «${s.name}»`);
    names.set(key, s.id);
  }
  for (const z of p.zones) {
    z.spaces.forEach(s => need(spaces.has(s), `зона ${z.id}: нет помещения ${s}`));
    z.include?.forEach(d => need(devices.has(d), `зона ${z.id}: нет устройства ${d}`));
    z.exclude?.forEach(d => need(devices.has(d), `зона ${z.id}: нет устройства ${d}`));
    if (z.floor) need(floors.has(z.floor), `зона ${z.id}: нет этажа ${z.floor}`);
  }
  const inRoomZone = new Map<string, string>();
  for (const z of p.zones.filter(z => z.kind === 'room')) for (const s of z.spaces) {
    need(!inRoomZone.has(s), `помещение ${s} входит в две зоны-комнаты: ${inRoomZone.get(s)} и ${z.id}`);
    inRoomZone.set(s, z.id);
  }
  for (const d of p.devices) {
    need(spaces.has(d.space), `устройство ${d.id}: нет помещения ${d.space}`);
    need(!!typeById[d.type], `устройство ${d.id}: нет типа ${d.type} в каталоге`);
  }
  for (const s of p.scenes) need(s.scope === 'house' || zones.has(s.scope) || spaces.has(s.scope), `сцена ${s.id}: нет зоны ${s.scope}`);
  if (p.media) {
    if (p.media.matrix) need(devices.has(p.media.matrix), `медиа: нет матрицы ${p.media.matrix}`);
    p.media.sources.forEach(d => need(devices.has(d), `медиа: нет источника ${d}`));
    for (const z of p.media.zones) {
      need(spaces.has(z.space), `медиазона ${z.id}: нет помещения ${z.space}`);
      [...z.sinks, ...z.sources].forEach(d => need(devices.has(d), `медиазона ${z.id}: нет устройства ${d}`));
    }
  }
  if (p.security) {
    const parts = new Set(p.security.partitions.map(x => x.id));
    for (const [d, ps] of Object.entries(p.security.sensors)) {
      need(devices.has(d), `охрана: нет датчика ${d}`);
      ps.forEach(x => need(parts.has(x), `охрана: датчик ${d} — нет раздела ${x}`));
    }
  }
  return errs;
}
