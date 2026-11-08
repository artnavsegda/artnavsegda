import { house, floors } from '../core/house';
import type { Layout, LayoutRoom } from '../house/scene';

// Раскладка дома для диорамы из плана прототипа: 800×640 px → метры.
// В продукте прямоугольники придут из редактора плана, интерфейс тот же.
const S = 12 / 780;
const kindOf = (id: string) => /living/.test(id) ? 'living' : /kitchen|dining/.test(id) ? 'kitchen' : /entry|hallway/.test(id) ? 'hallway' : /bath|laundry/.test(id) ? 'bath'
  : /kids/.test(id) ? 'kids' : /bed|guest/.test(id) ? 'bedroom' : /office/.test(id) ? 'office' : /tech|boiler/.test(id) ? 'tech' : 'hall';
const box = (r: [number, number, number, number]) => ({ x: (r[0] - 20) * S, z: (r[1] - 20) * S, w: r[2] * S, d: r[3] * S });
const fl = [...floors].sort((a, b) => a.id - b.id);

export const houseLayout: Layout = {
  W: 12, D: Math.max(...house.rooms.map(r => (r.rect[1] + r.rect[3] - 20) * S)), ground: Math.max(0, fl.findIndex(f => f.id === 1)), roof: fl.length > 1,
  floors: fl.map(f => ({ id: String(f.id), rooms: [
    ...house.rooms.filter(r => (r.floor ?? 1) === f.id).map(r => ({ ...box(r.rect), zone: r.id, kind: kindOf(r.id) }) as LayoutRoom),
    ...(f.extras ?? []).map(e => ({ ...box(e.rect), zone: '', kind: e.kind === 'stairs' ? 'stairs' : 'balcony', label: false }) as LayoutRoom)
  ] }))
};
