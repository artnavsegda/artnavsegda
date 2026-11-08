// node --experimental-strip-types model/media/check.ts — сценарии, которые обрабатывал сервер сценариев
import { MediaEngine } from './engine.ts';
import { sosnyMedia } from './sosny.ts';

const e = new MediaEngine(sosnyMedia);
const run = (s: number) => { for (let i = 0; i < s * 4; i++) e.tick(0.25); };
const show = (z: string) => {
  const st = e.zone[z]; const ses = st.session;
  return `${z}: ${ses ? ses.source + (ses.shared ? ' (вместе)' : '') : '—'}${st.plan ? ` · план ${st.plan.title} ${st.plan.total}с [${st.plan.steps.map(s => `${s.label}@${s.start}+${s.dur}`).join('; ')}]` : ''}${st.note ? ' · ' + st.note : ''}`;
};
console.log('возможности:'); for (const z of Object.keys(e.zone)) { const o = e.options(z); console.log(`  ${z}: смотреть ${o.watch.join(',') || '—'} | слушать ${o.listen.join(',') || '—'} | смарт-ТВ ${o.tv ?? '—'}`); }

console.log('\n1. Кухня: Apple TV'); console.log(e.request('kitchen', { activity: 'watch', kind: 'appletv' })); console.log(' ', show('kitchen'), e.zone.kitchen.session?.claims); run(10);
console.log('\n2. Спальня: Apple TV → свободный второй'); e.request('bed', { activity: 'watch', kind: 'appletv' }); console.log(' ', show('bed')); run(10);
console.log('\n3. Гостиная: Apple TV — оба заняты'); const r3 = e.request('living', { activity: 'watch', kind: 'appletv' }); console.log(JSON.stringify(r3, null, 1));
console.log('\n4. Гостиная: Kodi'); e.request('living', { activity: 'watch', kind: 'kodi' }); console.log(' ', show('living')); run(12);
console.log('\n5. Кинотеатр: тот же Kodi — передача из гостиной'); e.request('cinema', { activity: 'watch', source: e.zone.living.session?.source ?? 'kodi1' }); console.log(' ', show('cinema')); console.log(' ', show('living')); run(50);
console.log('\n6. Кинотеатр выключить, сразу включить снова — проектор остывает'); e.stop('cinema'); console.log(' ', show('cinema')); run(5); e.request('cinema', { activity: 'watch', kind: 'kodi' }); console.log(' ', show('cinema')); run(140);
console.log('\n7. Мультирум: радио в санузле, присоединить кухню и санузел спальни'); e.request('bath1', { activity: 'listen', kind: 'streamer', content: { kind: 'radio', id: 'r1', title: 'Волна джаза', art: 'r1' } }); run(3);
console.log(' присоединиться можно в кухне к:', e.joinable('kitchen')); e.join('bath2b', e.zone.bath1.session!.source); e.request('kitchen', { activity: 'listen', kind: 'streamer', content: { kind: 'radio', id: 'r2', title: 'Классика', art: 'r2' } }); run(3);
console.log(' ', show('bath1'), '|', show('bath2b'), '|', show('kitchen'));
console.log('\n8. Перезапуск зависшего Kodi'); e.restart('kodi1'); console.log(' ', e.src.kodi1.restarting?.steps.map(s => s.label + ' ' + s.dur + 'с').join(', '));
console.log('\nжурнал:\n  ' + e.log.slice(0, 14).reverse().map(l => `${l.t.toFixed(0).padStart(4)}с ${l.text}`).join('\n  '));
