// Генерация фото комнат «Дома на Липовой» через Gemini API.
// Дневной кадр — генерация по промпту; вечерний — ПРАВКА дневного (тот же ракурс и мебель),
// иначе пары для живого света не совпадут.
//
//   (за прокси: NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt)
//   GEMINI_API_KEY=… node scripts/gen-rooms.mjs day [room…]
//   GEMINI_API_KEY=… node scripts/gen-rooms.mjs evening [room…]
//   node scripts/gen-rooms.mjs models          — какие модели с картинками доступны ключу
//
// Ключ можно положить в .gemini-key (в .gitignore). Результат: public/photos/lipovaya/<room>-<day|evening>.jpg
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';

const KEY = process.env.GEMINI_API_KEY || (existsSync('.gemini-key') && readFileSync('.gemini-key', 'utf8').trim());
const OUT = 'public/photos/lipovaya';
const API = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = process.env.GEMINI_MODEL; // иначе выбирается автоматически

const STYLE = `Photorealistic architectural interior photograph for high-end real estate. Eye-level wide shot, 16:9, 24mm lens, straight verticals.
A modern Scandinavian three-storey private house in a pine forest near the sea. Materials across the whole house: warm off-white lime plaster walls, light natural oak floors and joinery, dark bronze metal details, linen textiles, stoneware ceramics, dried branches. Calm, quiet, uncluttered, no people, no text, no logos.`;
const DAY = 'Daytime, soft overcast daylight through the windows, ALL artificial lights switched off.';

// Комнаты и светильники — те же, что в модели объекта: на вечернем кадре включаются именно они,
// чтобы точки на фото совпали с устройствами.
const rooms = {
  living: { scene: 'Large living room with floor-to-ceiling windows to the forest, deep low sofa, round travertine coffee table, wool rug, oak media wall with TV, built-in shelves with hidden LED, ceiling-recessed projector screen slot, linen curtains on both sides of the windows, a large sculptural pendant chandelier.', lights: 'the pendant chandelier, recessed ceiling spots, warm LED strip in the shelves, wall washer light on the plaster wall, column uplights' },
  kitchen: { scene: 'Kitchen with a long oak island, matte stone worktop, handle-less oak cabinets, a niche with open shelves, TV on the side wall, three linen roller blinds on the windows, two pendant lights over the island.', lights: 'the pendant lights over the island, recessed spots, LED strip under the wall cabinets, the lit shelf niche' },
  hallway: { scene: 'Entrance hallway with tall built-in oak wardrobe, low bench with cushions, round mirror, dark oak front door with narrow glass sidelight, console with ceramic vase.', lights: 'recessed ceiling downlights and the wall sconce by the mirror' },
  hall1: { scene: 'Central ground-floor hall connecting rooms, oak floor, a large mirror, a tall stained-glass (vitrage) panel with soft amber and green glass, two plaster columns, view to the staircase.', lights: 'recessed spots, the backlit stained-glass panel, uplights on the columns, mirror light' },
  bath1: { scene: 'Small guest bathroom, microcement walls, oak vanity with stone basin, round mirror, a small wall sconce, a compact ceiling pendant.', lights: 'the wall sconce and the ceiling pendant' },
  'z-stairs': { scene: 'Open oak staircase rising through three floors, plaster walls, slim bronze handrail, a tall window on the landing, wall sconces along the stairs on each floor.', lights: 'all wall sconces along the staircase and the spots on the upper landing' },
  bed: { scene: 'Master bedroom, low oak bed with linen bedding, upholstered headboard wall, two bedside tables with lamps, wall sconces left and right of the bed, a small writing table, a stained-glass transom, TV on the opposite wall, floor-length linen curtains.', lights: 'the ceiling chandelier, LED strip behind the headboard, left and right wall sconces, the desk lamp, the backlit stained-glass transom' },
  kids: { scene: 'Children’s room for a 10-year-old: single oak bed, desk by the window, open shelves with books and toys in a lit niche, a soft rug, ceiling lights, wall sconces either side of the bed, light linen curtains.', lights: 'the ceiling lights, recessed spots, the desk lamp, the lit niche, both wall sconces' },
  bath2b: { scene: 'Master en-suite bathroom, freestanding stone bathtub, walk-in shower behind glass, double oak vanity, large backlit mirror, ceiling chandelier, small window.', lights: 'the ceiling chandelier and the backlit mirror' },
  'z-bath2k': { scene: 'Children’s bathroom, playful sage-green tiles, oak vanity, round backlit mirror, ceiling light.', lights: 'the ceiling light and the backlit mirror' },
  hall2: { scene: 'First-floor landing hall, oak floor, a bench, framed prints, doors to bedrooms, staircase railing.', lights: 'wall sconces and recessed spots' },
  cabinet: { scene: 'Home office under a sloped attic ceiling, large oak desk facing a window, leather chair, wall of bookshelves, reading armchair with a wall sconce, roller blind, wall-mounted air conditioner.', lights: 'the ceiling chandelier, spots, the reading wall sconce, LED strip along the bookshelves' },
  hall3: { scene: 'Small attic landing, sloped ceiling, skylight, one wall sconce, stair railing.', lights: 'the wall sconce' },
  bath3: { scene: 'Attic bathroom under a sloped ceiling with a skylight, walk-in shower, oak vanity, backlit mirror, LED strip in a shelf niche.', lights: 'recessed spots, the backlit mirror, the niche LED strip' },
  'z-workshop': { scene: 'Attic workshop and hobby studio: long workbench, pegboard with tools, track lights, two industrial pendants, an owl-shaped lamp on a shelf, glass door to a wooden balcony with forest view, wall-mounted air conditioner.', lights: 'the track lights, the two pendants, the owl lamp, the wall sconce, the balcony light outside' },
  'z-basement': { scene: 'Basement garage with a dark car, polished concrete floor, oak storage cabinets, door to a corridor with a boiler room, clean technical look.', lights: 'linear ceiling lights in the garage and the corridor' },
  entrance: { scene: 'Exterior: front facade of the house at the entrance — dark timber cladding, oak front door under a canopy, gravel path with stepping stones, low pines, a sliding gate in a timber fence.', lights: 'facade downlights, the canopy light, path bollards, the gate light', exterior: true }
};

async function call(model, parts) {
  const r = await fetch(`${API}/models/${model}:generateContent`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } } })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j.error ?? j).slice(0, 300)}`);
  const img = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData || p.inline_data);
  if (!img) throw new Error('нет картинки в ответе: ' + JSON.stringify(j).slice(0, 300));
  return Buffer.from((img.inlineData ?? img.inline_data).data, 'base64');
}
async function models() {
  const j = await fetch(`${API}/models?pageSize=200`, { headers: { 'x-goog-api-key': KEY } }).then(r => r.json());
  return (j.models ?? []).map(m => m.name.replace('models/', '')).filter(n => /image/.test(n) && !/imagen/.test(n));
}
function save(buf, file) {
  const png = file.replace(/\.jpg$/, '.png');
  writeFileSync(png, buf);
  try { execFileSync('convert', [png, '-resize', '1920x1920>', '-quality', '86', file]); execFileSync('rm', [png]); } catch { /* оставим png */ }
}

const [mode = 'day', ...only] = process.argv.slice(2);
if (!KEY) { console.error('нужен GEMINI_API_KEY или файл .gemini-key'); process.exit(1); }
mkdirSync(OUT, { recursive: true });
const list = await models();
if (mode === 'models') { console.log(list.join('\n')); process.exit(0); }
const model = MODEL ?? list.find(n => /^gemini-3.*flash.*image/.test(n)) ?? list.find(n => /flash.*image/.test(n)) ?? list[0];
console.log('модель:', model);

const ids = only.length ? only : Object.keys(rooms);
let i = 0;
async function worker() {
  while (i < ids.length) {
    const id = ids[i++], r = rooms[id];
    const day = `${OUT}/${id}-day.jpg`, eve = `${OUT}/${id}-evening.jpg`;
    try {
      if (mode === 'day') {
        save(await call(model, [{ text: `${STYLE}\n${r.scene}\n${DAY}` }]), day);
      } else {
        if (!existsSync(day)) throw new Error('сначала дневной кадр');
        const data = readFileSync(day).toString('base64');
        save(await call(model, [
          { inlineData: { mimeType: 'image/jpeg', data } },
          { text: `Edit this exact photograph. Keep the camera, composition, room, furniture and every object exactly the same — do not add, remove or move anything. Change only the time and lighting: ${r.exterior ? 'late blue-hour dusk' : 'evening, deep blue dusk outside the windows'}, and switch on ${r.lights}, warm 2700K light with soft realistic falloff and glow. Same photographic style.` }
        ]), eve);
      }
      console.log('готово', id, mode);
    } catch (e) { console.log('ошибка', id, e.message); }
  }
}
await Promise.all([worker(), worker(), worker()]);
