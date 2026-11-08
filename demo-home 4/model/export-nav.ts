// Собирает схему навигации из модели проекта в одну страницу.
// node --experimental-strip-types model/export-nav.ts model/objects/sosny.json model/nav-scheme/template.html > model/nav-scheme/nav.html
import { readFileSync } from 'node:fs';
import type { Device, Project } from './schema.ts';
import { typeById } from './catalog.ts';
import { validate } from './validate.ts';
import { whereTree, whatTree, type Audience } from './navigation.ts';

const [projPath, tplPath] = process.argv.slice(2);
const p: Project = JSON.parse(readFileSync(projPath, 'utf8'));
const errs = validate(p);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
const spaceName = Object.fromEntries(p.spaces.map(s => [s.id, s.name]));

const row = (d: Device, zoneSpaces: string[]) => ({
  n: d.name, t: typeById[d.type].name, i: typeById[d.type].ui.icon,
  ...(zoneSpaces.length && !zoneSpaces.includes(d.space) ? { from: spaceName[d.space] } : {}),
  ...(d.code ? { c: d.code } : {}),
  ...(d.flags ? { f: Object.values(d.flags)[0] } : {})
});

function pack(who: Audience) {
  const where = whereTree(p, who).map(f => ({
    id: f.id, name: f.name,
    rooms: f.zones.map(({ zone, groups, rows }) => ({
      id: zone.id, name: zone.name, rows,
      spaces: zone.spaces.map(s => spaceName[s]),
      groups: groups.map(g => ({ fn: g.fn, name: g.name, rows: g.rows.map(d => row(d, zone.spaces)), status: g.status.length,
        statusKinds: [...new Set(g.status.map(d => typeById[d.type].ui.statusOnly && (d.role ?? 'occupancy')))] }))
    }))
  }));
  const what = whatTree(p, who).map(x => ({
    fn: x.fn, name: x.name, total: x.total,
    floors: x.floors.map(f => ({ id: f.id, name: f.name, rooms: f.zones.map(z => ({ id: z.zone.id, name: z.zone.name, rows: z.rows.map(d => row(d, z.zone.spaces)) })) }))
  }));
  return { where, what };
}

const data = {
  site: p.site.name,
  counts: {
    floors: p.floors.length, spaces: p.spaces.length, devices: p.devices.length,
    byType: Object.entries(p.devices.reduce((m, d) => ((m[typeById[d.type].ui.function] = (m[typeById[d.type].ui.function] ?? 0) + 1), m), {} as Record<string, number>))
  },
  resident: pack('resident'),
  service: pack('service'),
  notes: p.notes ?? [],
  scenes: p.scenes.filter(s => !s.flags).map(s => s.name)
};

process.stdout.write(readFileSync(tplPath, 'utf8').replace('/*DATA*/null', JSON.stringify(data)));
