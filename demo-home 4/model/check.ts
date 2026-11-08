// node --experimental-strip-types model/check.ts model/objects/sosny.json
import { readFileSync } from 'node:fs';
import type { Project } from './schema.ts';
import { validate } from './validate.ts';
import { whereTree, whatTree } from './navigation.ts';

const p: Project = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const errs = validate(p);
console.log(errs.length ? `ОШИБКИ (${errs.length}):\n  ` + errs.join('\n  ') : 'проект корректен');
for (const who of ['resident', 'service'] as const) {
  const where = whereTree(p, who), what = whatTree(p, who);
  const zones = where.flatMap(f => f.zones);
  console.log(`\n${who}: этажей ${where.length}, комнат ${zones.length}, строк ${zones.reduce((n, z) => n + z.rows, 0)}, max строк в комнате ${Math.max(...zones.map(z => z.rows))}`);
  for (const f of where) console.log(`  ${f.name}: ` + f.zones.map(z => `${z.zone.name}(${z.groups.map(g => g.name[0] + g.rows.length + (g.status.length ? '+' + g.status.length : '')).join(' ')})`).join(', '));
  console.log('  функции: ' + what.map(x => `${x.name} ${x.total}`).join(', '));
}
