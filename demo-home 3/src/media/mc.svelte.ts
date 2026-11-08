import { S, ui, engine, ask, act } from './state.svelte';
import { kindFor, type Item } from './catalog';
import type { Content } from '../../model/media/engine.ts';

// Навигация и намерения медиацентра поверх движка: что открыто, где играть, что дальше в очереди.
// Логика переключения — целиком в движке; здесь только «что хочет человек».
export const mc = $state({
  page: null as Item | null,
  where: null as null | { c: Content; queue?: Content[] },
  full: '' as string,
  tab: '' as string,
  q: '',
  queue: {} as Record<string, Content[]>,
  subs: {} as Record<string, string>,
  audio: {} as Record<string, number>,
  got: {} as Record<string, boolean>
});

/** Зоны, где этот контент вообще можно включить: путь до источника нужного вида существует. */
export function zonesFor(c: Content) {
  const k = kindFor(c), video = k !== 'streamer';
  return engine.cfg.zones.filter(z => {
    const o = engine.options(z.id);
    return (video ? o.watch : o.listen).some(id => engine.nodes[id].kind === k);
  });
}
export const activeZones = () => Object.keys(S.zone).filter(id => S.zone[id].session || S.zone[id].plan);
export const sourceOf = (zone: string) => { const s = S.zone[zone]?.session; return s ? S.src[s.source] : undefined; };

/** Включить в зоне: тот же источник — просто сменить контент, иначе — запрос к движку (с конфликтами). */
export function startIn(zone: string, c: Content, queue?: Content[]) {
  const k = kindFor(c);
  const ses = S.zone[zone].session;
  if (ses && engine.nodes[ses.source].kind === k) act(() => engine.play(zone, c));
  else ask(zone, { activity: k === 'streamer' ? 'listen' : 'watch', kind: k, content: c });
  if (queue) mc.queue[zone] = queue;
  ui.zone = zone; mc.where = null;
  if (!ui.conflict) { mc.full = zone; mc.tab = ''; }
}
export function step(zone: string, d: 1 | -1) {
  const q = mc.queue[zone], cur = sourceOf(zone)?.content;
  if (q?.length && cur) {
    const i = q.findIndex(t => t.id === cur.id), n = q[(i + d + q.length) % q.length];
    act(() => engine.play(zone, n));
  } else act(() => engine.seek(zone, d * 30));
}
