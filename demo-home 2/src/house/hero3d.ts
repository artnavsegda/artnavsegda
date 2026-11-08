import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Tilt } from './tilt';
import { relief } from './relief';

// Библиотека предметов для крупного плана. Модели процедурные: в продукте их место займут GLB
// от 3D-художника под светильники и технику заказчика, интерфейс тот же — модель получает
// состояние устройства и сама решает, что светится, едет или дует.

export type HeroKind = 'lamp' | 'pendant' | 'chandelier' | 'sconce' | 'spots' | 'strip' | 'curtain' | 'ac' | 'radiator' | 'floorheat' | 'tv' | 'projector' | 'speaker' | 'gate';
export interface HeroState { level: number; pos: number; on: boolean; heat: number; hue: number; day: boolean }
interface Model { g: THREE.Group; cam: [number, number, number, number, number, number]; update: (s: HeroState, t: number) => void }

const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);
// фон сцены (стена, пол, окно) не участвует в кадрировании: в кадр берётся сам предмет
// alphaMap читает яркость, а не альфу: переводим нарисованную прозрачность в оттенки серого
function gray(c: HTMLCanvasElement) {
  const g = c.getContext('2d')!, d = g.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const v = a[i + 3]; a[i] = a[i + 1] = a[i + 2] = v; a[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c;
}
const bg = <T extends THREE.Object3D>(o: T) => { o.userData.bg = true; return o; };
// поверхность-подложка (стена, пол, окно): на плитке-постере её нет, предмет — вырезанный
const flat = <T extends THREE.Object3D>(o: T) => { o.userData.bg = o.userData.surface = true; return o; };
// стена или пол, растворяющиеся к краям в размытом фото комнаты
let fadeTex: THREE.Texture | null = null;
function fade() {
  if (fadeTex) return fadeTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(128, 128, 30, 128, 128, 128); gr.addColorStop(0, '#fff'); gr.addColorStop(.6, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return (fadeTex = new THREE.CanvasTexture(gray(c)));
}
const surface = (w: number, h: number, color: number, opacity = 1) => flat(new THREE.Mesh(new THREE.PlaneGeometry(w, h), relief(std({ color, roughness: .95, transparent: true, opacity, alphaMap: fade(), depthWrite: false }), color === 0xbf9468 ? 'wood' : 'plaster')));
const WARM = new THREE.Color(1, .64, .32);
const brass = () => relief(std({ color: 0xb8925a, metalness: 1, roughness: .28 }), 'brushed');
const oak = () => relief(std({ color: 0xc49a6c, roughness: .6 }), 'wood');
const dark = () => relief(std({ color: 0x1d1b19, metalness: .4, roughness: .45 }), 'brushed', 14);

// мягкий конус света: аддитивный, прозрачный к краю
function beam(r0: number, r1: number, h: number) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 128;
  const g = c.getContext('2d')!; const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
  const m = new THREE.MeshBasicMaterial({ color: WARM, transparent: true, opacity: 0, alphaMap: new THREE.CanvasTexture(gray(c)), blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const mesh = bg(new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 48, 1, true), m));
  return { mesh, m };
}
// текстура плетения для абажура
function weave() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) { g.fillStyle = `rgba(0,0,0,${.18 + (y / 8 % 2) * .12})`; g.fillRect(0, y, 256, 3); }
  for (let x = 0; x < 256; x += 16) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x, 0, 2, 256); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3); return t;
}

function lamp(): Model {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.LatheGeometry([0, .42, .46, .4, .3, .12, .1].map((r, i) => new THREE.Vector2(r, i * .09)), 48), relief(std({ color: 0xb7a58e, roughness: .7 }), 'ceramic'));
  base.position.y = -1.3; g.add(base);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.2, 12), brass()); stem.position.y = -.5; g.add(stem);
  const shadeM = relief(std({ color: 0xefe6d6, roughness: .9, emissive: 0xffa860, emissiveIntensity: 0, side: THREE.DoubleSide }), 'fabric', 40);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.45, .7, .7, 64, 1, true), shadeM); shade.position.y = .3; g.add(shade);
  const bulbM = std({ color: 0xffffff, emissive: 0xffd9a0, emissiveIntensity: 0 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.12, 24, 12), bulbM); bulb.position.y = .15; g.add(bulb);
  const dn = beam(.7, 1.4, .9); dn.mesh.position.y = -.5; g.add(dn.mesh);
  const light = new THREE.PointLight(0xffa860, 0, 4, 1.6); light.position.y = .2; g.add(light);
  return { g, cam: [1.2, .8, 6, 0, -.3, 0], update: (s) => {
    shadeM.emissiveIntensity = s.level * 1.3; bulbM.emissiveIntensity = .1 + s.level * 4; dn.m.opacity = s.level * (s.day ? .12 : .3); light.intensity = s.level * 3;
  } };
}

function pendant(): Model {
  const g = new THREE.Group();
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 30; i++) { const k = i / 30; prof.push(new THREE.Vector2(.25 + 1.35 * Math.pow(k, .8), 1.1 - k * 1.25)); }
  const geo = new THREE.LatheGeometry(prof, 96);
  const outer = std({ color: 0xd9c19a, roughness: .9, map: weave(), side: THREE.FrontSide, emissive: 0xffa860, emissiveIntensity: 0, emissiveMap: weave() });
  const inner = std({ color: 0xfff1dc, roughness: .8, emissive: 0xffa860, emissiveIntensity: 0, side: THREE.BackSide });
  g.add(new THREE.Mesh(geo, outer), new THREE.Mesh(geo, inner));
  const bulbM = std({ color: 0xffffff, emissive: 0xffd9a0, emissiveIntensity: 0 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.16, 32, 16), bulbM); bulb.position.y = .25; g.add(bulb);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .2, 24), brass()); cap.position.y = 1.18; g.add(cap);
  const cab = bg(new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 4, 8), dark())); cab.position.y = 3.2; g.add(cab);
  const light = new THREE.PointLight(0xffa860, 0, 8, 1.8); light.position.y = .1; g.add(light);
  const b = beam(1.3, 3.2, 3); b.mesh.position.y = -1.6; g.add(b.mesh);
  return { g, cam: [0, -.6, 8, 0, -.2, 0], update: (s) => {
    outer.emissiveIntensity = s.level * .55; inner.emissiveIntensity = s.level * 1.8; bulbM.emissiveIntensity = .1 + s.level * 5;
    light.intensity = s.level * 6; b.m.opacity = s.level * (s.day ? .08 : .22);
  } };
}

function chandelier(): Model {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, .035, 12, 120), brass()); ring.rotation.x = Math.PI / 2; g.add(ring);
  const glows: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, m = std({ color: 0xffffff, transparent: true, opacity: .9, roughness: .15, emissive: 0xffc890, emissiveIntensity: 0 });
    const s = new THREE.Mesh(new THREE.SphereGeometry(.16, 24, 12), m); s.position.set(Math.cos(a) * 1.5, -.12, Math.sin(a) * 1.5); g.add(s); glows.push(m);
  }
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2, rod = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, 2.4, 6), brass());
    rod.position.set(Math.cos(a) * .75, 1.05, Math.sin(a) * .75); rod.rotation.z = Math.cos(a) * .55; rod.rotation.x = -Math.sin(a) * .55; g.add(rod);
  }
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .06, 32), brass()); top.position.y = 2.1; g.add(top);
  const light = new THREE.PointLight(0xffb070, 0, 8, 1.8); g.add(light);
  return { g, cam: [0, .9, 7.5, 0, .3, 0], update: (s) => { glows.forEach(m => (m.emissiveIntensity = .05 + s.level * 3)); light.intensity = s.level * 6; } };
}

function sconce(): Model {
  const g = new THREE.Group();
  const wall = surface(7, 7, 0xe8e1d6, .35); wall.position.z = -.56; g.add(wall);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .05, 32), brass()); plate.rotation.x = Math.PI / 2; plate.position.z = -.53; g.add(plate);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .55, 12), brass()); arm.rotation.x = Math.PI / 2; arm.position.z = -.25; g.add(arm);
  const shadeM = relief(std({ color: 0xf2ece2, roughness: .9, emissive: 0xffa860, emissiveIntensity: 0, side: THREE.DoubleSide }), 'fabric', 40);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.2, .3, .44, 48, 1, true), shadeM); shade.position.z = .08; g.add(shade);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.3, .012, 8, 64), brass()); ring.rotation.x = Math.PI / 2; ring.position.set(0, -.22, .08); g.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(.2, .012, 8, 64), brass()); ring2.rotation.x = Math.PI / 2; ring2.position.set(0, .22, .08); g.add(ring2);
  const up = beam(.3, 1.3, 1.6); up.mesh.position.y = 1.05; up.mesh.rotation.z = Math.PI; g.add(up.mesh);
  const dn = beam(.3, 1.1, 1.4); dn.mesh.position.y = -.95; g.add(dn.mesh);
  // пятна света на стене
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!;
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const washM = new THREE.MeshBasicMaterial({ color: WARM, transparent: true, opacity: 0, alphaMap: new THREE.CanvasTexture(gray(c)), blending: THREE.AdditiveBlending, depthWrite: false });
  const wash = bg(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.2), washM)); wash.position.z = -.54; g.add(wash);
  const light = new THREE.PointLight(0xffa860, 0, 5, 1.6); g.add(light);
  return { g, cam: [1.4, .5, 5, 0, -.1, -.3], update: (s) => {
    shadeM.emissiveIntensity = s.level * 1.4; up.m.opacity = dn.m.opacity = s.level * (s.day ? .1 : .3); washM.opacity = s.level * (s.day ? .25 : .7); light.intensity = s.level * 3;
  } };
}

function spots(): Model {
  const g = new THREE.Group();
  const ceil = bg(new THREE.Mesh(new THREE.BoxGeometry(6, .12, 3), std({ color: 0xece6dc, roughness: .95 }))); ceil.position.y = 1.5; g.add(ceil);
  const fl = surface(10, 7, 0xbf9468); fl.rotation.x = -Math.PI / 2; fl.position.y = -2; fl.receiveShadow = true; g.add(fl);
  const cones: THREE.MeshBasicMaterial[] = [], lens: THREE.MeshStandardMaterial[] = [], lights: THREE.SpotLight[] = [];
  for (const x of [-1.8, 0, 1.8]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .06, 32), dark()); ring.position.set(x, 1.43, 0); g.add(ring);
    const lm = std({ color: 0xffffff, emissive: 0xffd2a0, emissiveIntensity: 0 }); lens.push(lm);
    const l = new THREE.Mesh(new THREE.CircleGeometry(.14, 32), lm); l.rotation.x = Math.PI / 2; l.position.set(x, 1.39, 0); g.add(l);
    const b = beam(.14, 1.3, 3.4); b.mesh.position.set(x, -.3, 0); g.add(b.mesh); cones.push(b.m);
    const sp = new THREE.SpotLight(0xffb070, 0, 8, .45, .7, 1.4); sp.position.set(x, 1.38, 0); sp.target.position.set(x, -2, 0); g.add(sp, sp.target); lights.push(sp);
  }
  return { g, cam: [0, -.2, 8.2, 0, -.2, 0], update: (s) => {
    lens.forEach(m => (m.emissiveIntensity = .1 + s.level * 5)); cones.forEach(m => (m.opacity = s.level * (s.day ? .08 : .2))); lights.forEach(l => (l.intensity = s.level * 40));
  } };
}

function strip(): Model {
  const g = new THREE.Group();
  for (const y of [-.9, .5]) {
    const shelf = new THREE.Mesh(new RoundedBoxGeometry(4.6, .12, 1, 3, .03), oak()); shelf.position.y = y; g.add(shelf);
  }
  const back = surface(8, 6, 0xe8e1d6); back.position.set(0, -.2, -.52); g.add(back);
  const vase = new THREE.Mesh(new THREE.LatheGeometry([0, .25, .32, .22, .12, .14].map((r, i) => new THREE.Vector2(r, i * .14)), 32), std({ color: 0xb9ab97, roughness: .85 }));
  vase.position.set(-1.1, -.84, 0); g.add(vase);
  const book = new THREE.Mesh(new THREE.BoxGeometry(.9, .55, .5), std({ color: 0x6d5a48, roughness: .8 })); book.position.set(1, -.56, 0); g.add(book);
  const ledM = std({ color: 0xffffff, emissive: 0xffb070, emissiveIntensity: 0 });
  const leds = [-.97, .43].map(y => { const m = new THREE.Mesh(new THREE.BoxGeometry(4.4, .02, .04), ledM); m.position.set(0, y, .42); g.add(m); return m; });
  const glows = [-.97, .43].map(y => { const b = beam(0, 0, 0); const p = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.3), b.m); p.position.set(0, y - .7, -.5); g.add(p); return b.m; });
  void leds;
  const light = new THREE.PointLight(0xffb070, 0, 4, 1.6); light.position.set(0, -.2, .4); g.add(light);
  return { g, cam: [1.2, .3, 6.6, 0, -.3, 0], update: (s) => { ledM.emissiveIntensity = .05 + s.level * 6; glows.forEach(m => (m.opacity = s.level * (s.day ? .25 : .6))); light.intensity = s.level * 3; } };
}

function curtain(): Model {
  const g = new THREE.Group();
  const win = flat(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.6), new THREE.MeshBasicMaterial({ color: 0x9fb6c8, transparent: true, opacity: .35 })));
  const wallC = surface(12, 9, 0xe8e1d6, .08); wallC.position.set(0, 0, -.45); g.add(wallC);
  const floorC = surface(12, 5, 0xbf9468, .2); floorC.rotation.x = -Math.PI / 2; floorC.position.set(0, -2.5, 1.5); g.add(floorC); win.position.z = -.4; g.add(win);
  const frameM = dark();
  for (const x of [-2.2, 0, 2.2]) { const f = new THREE.Mesh(new THREE.BoxGeometry(.08, 4.6, .08), frameM); f.position.set(x, 0, -.35); g.add(f); }
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 5.4, 12), brass()); rod.rotation.z = Math.PI / 2; rod.position.set(0, 2.45, 0); g.add(rod);
  const cloth = relief(std({ color: 0xe9e1d3, roughness: .95, side: THREE.DoubleSide, transparent: true, opacity: .96 }), 'fabric', 22);
  const panels = [-1, 1].map(side => {
    const geo = new THREE.PlaneGeometry(2.6, 4.8, 64, 1); const m = new THREE.Mesh(geo, cloth); m.castShadow = true; g.add(m);
    return { side, geo, base: Float32Array.from(geo.attributes.position.array as Float32Array) };
  });
  return { g, cam: [0, .1, 8.4, 0, 0, 0], update: (s) => {
    // pos 1 — открыто (полотна собраны у краёв), 0 — закрыто
    const open = s.pos;
    for (const p of panels) {
      const a = p.geo.attributes.position as THREE.BufferAttribute;
      const w = 2.6 * (1 - open * .78);
      for (let i = 0; i < a.count; i++) {
        const u = (p.base[i * 3] + 1.3) / 2.6;          // 0..1 по ширине полотна
        const edge = p.side < 0 ? -2.6 : 2.6;           // край, к которому собирается
        const x = p.side < 0 ? edge + u * w : edge - (1 - u) * w;
        const folds = Math.sin(u * Math.PI * 14) * (.08 + open * .14);
        a.setXYZ(i, x, p.base[i * 3 + 1] - .05, folds);
      }
      a.needsUpdate = true; p.geo.computeVertexNormals();
    }
    win.material.color.setHex(s.day ? 0xbfd2de : 0x1a2438);
  } };
}

function ac(): Model {
  const g = new THREE.Group();
  const wall = surface(10, 7, 0xe8e1d6, .1); wall.position.z = -.7; g.add(wall);
  const body = new THREE.Mesh(new RoundedBoxGeometry(3.6, 1.05, 1.1, 6, .22), relief(std({ color: 0xf4f3f0, roughness: .35 }), 'plastic')); body.position.y = .6; g.add(body);
  const flap = new THREE.Mesh(new RoundedBoxGeometry(3.2, .05, .4, 2, .02), relief(std({ color: 0xe6e4e0, roughness: .3 }), 'plastic'));
  const pivot = new THREE.Group(); pivot.position.set(0, .1, .5); flap.position.z = .2; pivot.add(flap); g.add(pivot);
  const dispM = std({ color: 0x111111, emissive: 0x7cc6ff, emissiveIntensity: 0 });
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(.36, .12), dispM); disp.position.set(1.2, .62, .56); g.add(disp);
  // поток воздуха: полупрозрачные ленты, ползут вниз
  const c = document.createElement('canvas'); c.width = 8; c.height = 256; const x = c.getContext('2d')!;
  for (let i = 0; i < 256; i += 32) { const gr = x.createLinearGradient(0, i, 0, i + 32); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, i, 8, 32); }
  const tex = new THREE.CanvasTexture(gray(c)); tex.wrapT = THREE.RepeatWrapping;
  const airM = new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0, alphaMap: tex, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const air = bg(new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.6, 1, 8), airM));
  const ap = air.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < ap.count; i++) { const y = ap.getY(i); ap.setZ(i, (1.3 - y) * .55); }
  air.position.set(0, -1.2, .6); g.add(air);
  return { g, cam: [1.6, .2, 7.2, 0, -.2, 0], update: (s, t) => {
    pivot.rotation.x += ((s.on ? .75 : 0) - pivot.rotation.x) * .08;
    dispM.emissiveIntensity = s.on ? 2 : 0;
    airM.opacity += ((s.on ? .32 : 0) - airM.opacity) * .06; tex.offset.y = -t * .6;
  } };
}

function radiator(): Model {
  const g = new THREE.Group();
  const wall = surface(9, 6, 0xe8e1d6, .15); wall.position.z = -.45; g.add(wall);
  const finM = relief(std({ color: 0xeeeeea, roughness: .4, metalness: .2, emissive: 0xff5a1e, emissiveIntensity: 0 }), 'plastic');
  for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new RoundedBoxGeometry(.24, 1.8, .55, 3, .08), finM); f.position.set(-1.65 + i * .3, -.4, 0); g.add(f); }
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .45, 32), std({ color: 0xf7f7f5, roughness: .3 })); valve.position.set(2.15, .25, 0); g.add(valve);
  const ringM = std({ color: 0x222222, emissive: 0xff8a3d, emissiveIntensity: 0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.18, .02, 8, 48), ringM); ring.rotation.x = Math.PI / 2; ring.position.set(2.15, .48, 0); g.add(ring);
  const heat = beam(1.8, 2.1, 1.6); heat.m.color.setHex(0xff7a3a); heat.mesh.position.set(0, 1.25, 0); heat.mesh.rotation.z = Math.PI; g.add(heat.mesh);
  return { g, cam: [1.4, .6, 7, .2, -.1, 0], update: (s, t) => {
    finM.emissiveIntensity = s.heat * .12; ringM.emissiveIntensity = s.heat * 2; heat.m.opacity = s.heat * (.12 + Math.sin(t * 2) * .03);
  } };
}

function floorheat(): Model {
  const g = new THREE.Group();
  const slab = bg(new THREE.Mesh(new THREE.BoxGeometry(5, .3, 3.4), relief(std({ color: 0x9a948b, roughness: .9 }), 'plaster', 5))); g.add(slab);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 9; i++) { const z = -1.4 + i * .35; pts.push(new THREE.Vector3(i % 2 ? 2.2 : -2.2, .16, z), new THREE.Vector3(i % 2 ? -2.2 : 2.2, .16, z)); }
  const pipeM = std({ color: 0xc2552a, emissive: 0xff5a1e, emissiveIntensity: 0, roughness: .5 });
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .15), 400, .05, 8), pipeM));
  // плитка поверх, наполовину — видно трубу
  const tileM = relief(std({ color: 0xd8d4cc, roughness: .5 }), 'ceramic');
  for (let x = 0; x < 4; x++) for (let z = 0; z < 2; z++) { const t = new THREE.Mesh(new RoundedBoxGeometry(.6, .06, .6, 2, .02), tileM); t.position.set(.4 + x * .62, .26, -1.2 + z * .62); g.add(t); }
  return { g, cam: [3.2, 4.2, 5.2, 0, -.2, 0], update: (s, t) => { pipeM.emissiveIntensity = s.heat * (1.2 + Math.sin(t * 1.5) * .2); } };
}

function tv(): Model {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new RoundedBoxGeometry(5.2, 3, .08, 3, .02), dark()); g.add(frame);
  const c = document.createElement('canvas'); c.width = 256; c.height = 144; const x = c.getContext('2d')!;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const scrM = std({ color: 0x050505, roughness: .15, metalness: .2, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(5.05, 2.85), scrM); scr.position.z = .045; g.add(scr);
  const cab = new THREE.Mesh(new RoundedBoxGeometry(5.6, .5, .9, 3, .05), oak()); cab.position.set(0, -2.2, .2); g.add(cab);
  let lastHue = -1;
  return { g, cam: [1.4, -.2, 8.4, 0, -.3, 0], update: (s) => {
    if (s.hue !== lastHue) {
      lastHue = s.hue; const gr = x.createLinearGradient(0, 0, 256, 144);
      gr.addColorStop(0, `hsl(${s.hue} 55% 42%)`); gr.addColorStop(1, `hsl(${s.hue + 50} 60% 14%)`); x.fillStyle = gr; x.fillRect(0, 0, 256, 144);
      x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(20, 108, 90, 6); x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(20, 120, 60, 4); tex.needsUpdate = true;
    }
    scrM.emissiveIntensity += ((s.on ? 1 : 0) - scrM.emissiveIntensity) * .1;
  } };
}

function projector(): Model {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.2, .7, 2, 4, .12), dark()); g.add(body);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(.3, .34, .3, 32), std({ color: 0x0a0a0a, metalness: .6, roughness: .1 })); lens.rotation.x = Math.PI / 2; lens.position.set(-.45, 0, 1.1); g.add(lens);
  const glassM = std({ color: 0x222233, emissive: 0xdde8ff, emissiveIntensity: 0, roughness: .05 });
  const glass = new THREE.Mesh(new THREE.CircleGeometry(.24, 32), glassM); glass.position.set(-.45, 0, 1.26); g.add(glass);
  const b = beam(.24, 2.4, 7); b.m.color.setHex(0xdde8ff); b.mesh.rotation.x = Math.PI / 2; b.mesh.position.set(-.45, 0, 4.76); g.add(b.mesh);
  return { g, cam: [4.2, 1.8, 5.2, 0, 0, 1], update: (s) => { glassM.emissiveIntensity += ((s.on ? 3 : 0) - glassM.emissiveIntensity) * .05; b.m.opacity += ((s.on ? .14 : 0) - b.m.opacity) * .05; } };
}

function speaker(): Model {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new RoundedBoxGeometry(1.8, 2.4, 1.8, 6, .5), relief(std({ color: 0xd9d5cd, roughness: .95 }), 'fabric', 30)));
  const ringM = std({ color: 0x222222, emissive: 0x7cc6d6, emissiveIntensity: 0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.5, .03, 12, 96), ringM); ring.rotation.x = Math.PI / 2; ring.position.y = 1.21; g.add(ring);
  return { g, cam: [0, 2.6, 6.4, 0, 0, 0], update: (s, t) => { ringM.emissiveIntensity = s.on ? 1.5 + Math.sin(t * 6) * .8 : 0; g.scale.y = 1 + (s.on ? Math.max(0, Math.sin(t * 9)) * .006 : 0); } };
}

function gate(): Model {
  const g = new THREE.Group();
  const post = (x: number) => { const p = new THREE.Mesh(new THREE.BoxGeometry(.4, 2.6, .4), std({ color: 0x3d3833, roughness: .8 })); p.position.set(x, 0, 0); g.add(p); };
  post(-3.2); post(3.2);
  const leaf = new THREE.Group(); g.add(leaf);
  for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.36, 2.2, .08), std({ color: 0x5a4434, roughness: .7 })); s.position.set(-2.8 + i * .43, -.1, 0); leaf.add(s); }
  const lampM = std({ color: 0x222222, emissive: 0xffb070, emissiveIntensity: 0 });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(.3, .12, .3), lampM); lamp.position.set(3.2, 1.36, 0); g.add(lamp);
  return { g, cam: [2.6, 1.2, 8.4, 0, -.2, 0], update: (s) => { leaf.position.x += (s.pos * 5.6 - leaf.position.x) * .04; lampM.emissiveIntensity = s.day ? 0 : 2; } };
}

const builders: Record<HeroKind, () => Model> = { lamp, pendant, chandelier, sconce, spots, strip, curtain, ac, radiator, floorheat, tv, projector, speaker, gate };

// Кадр по самому предмету: направление камеры из пресета модели, расстояние — чтобы предмет
// поместился по узкой стороне кадра. Подложки (стены, лучи) в расчёт не входят.
function fitCamera(cam: THREE.PerspectiveCamera, m: Model, fill = .9) {
  const box = new THREE.Box3();
  m.g.updateMatrixWorld(true);
  m.g.traverse(o => {
    let p: THREE.Object3D | null = o, skip = false; while (p) { if (p.userData.bg) { skip = true; break; } p = p.parent; }
    if (!skip && (o as THREE.Mesh).isMesh) box.expandByObject(o);
  });
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const [x, y, z, tx, ty, tz] = m.cam;
  const dir = new THREE.Vector3(x - tx, y - ty, z - tz).normalize();
  const vf = THREE.MathUtils.degToRad(cam.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
  const dist = sphere.radius / Math.sin(Math.min(vf, hf) / 2) / fill;
  const target = sphere.center.clone().lerp(new THREE.Vector3(tx, ty, tz), .3);
  cam.position.copy(target).addScaledVector(dir, dist); cam.lookAt(target);
  return sphere.center;
}

// ——— постеры для плиток: один общий рендерер, картинки в кэше ———
let baker: THREE.WebGLRenderer | null = null, bakeEnv: THREE.Texture | null = null;
const posters = new Map<string, string>();
export function heroPoster(kind: HeroKind, on: boolean, day: boolean): string {
  const key = `${kind}|${on}|${day}`;
  const hit = posters.get(key); if (hit) return hit;
  try {
    if (!baker) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 320;
      baker = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
      baker.outputColorSpace = THREE.SRGBColorSpace; baker.toneMapping = THREE.ACESFilmicToneMapping; baker.toneMappingExposure = 1.1;
      baker.setSize(320, 320, false);
      bakeEnv = new THREE.PMREMGenerator(baker).fromScene(new RoomEnvironment(), .04).texture;
    }
    const scene = new THREE.Scene(); scene.environment = bakeEnv; scene.environmentIntensity = day ? .8 : .45;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3530, day ? 1.2 : .55));
    const key1 = new THREE.DirectionalLight(0xffffff, 1.2); key1.position.set(3, 5, 5); scene.add(key1);
    const m = builders[kind]();
    m.g.traverse(o => { if (o.userData.surface) o.visible = false; });
    m.g.rotation.y = .35; scene.add(m.g);
    const st: HeroState = { level: on ? 1 : 0, pos: on ? 1 : .1, on, heat: on ? 1 : 0, hue: 28, day };
    for (let i = 0; i < 60; i++) m.update(st, 1.2);
    const cam = new THREE.PerspectiveCamera(30, 1, .1, 100); fitCamera(cam, m, .95);
    baker.render(scene, cam);
    const url = baker.domElement.toDataURL('image/png');
    posters.set(key, url);
    scene.traverse(o => { const g = (o as THREE.Mesh).geometry; if (g) g.dispose(); });
    return url;
  } catch { return ''; }
}

// ——— сцена крупного плана ———
export class HeroView {
  private r: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(30, 1, .1, 100);
  private m: Model; private hemi = new THREE.HemisphereLight(0xffffff, 0x3a3530, .6);
  private tilt: Tilt; private center = new THREE.Vector3();
  private raf = 0; private rot = 0; private rotV = 0; private drag = false; private lx = 0; private t0 = performance.now();
  state: HeroState = { level: 0, pos: 1, on: false, heat: 0, hue: 30, day: false };
  private shown: HeroState = { ...this.state };

  constructor(private canvas: HTMLCanvasElement, kind: HeroKind) {
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.r.outputColorSpace = THREE.SRGBColorSpace; this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.1;
    this.r.shadowMap.enabled = true;
    const pm = new THREE.PMREMGenerator(this.r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
    this.scene.environmentIntensity = .35;
    const key = new THREE.DirectionalLight(0xffffff, 1); key.position.set(3, 5, 5); this.scene.add(key, this.hemi);
    this.m = builders[kind](); this.scene.add(this.m.g);
    this.tilt = new Tilt(this.r, this.scene, this.cam);
    const [x, y, z, tx, ty, tz] = this.m.cam; this.cam.position.set(x, y, z); this.cam.lookAt(tx, ty, tz);
    canvas.addEventListener('pointerdown', this.down); addEventListener('pointermove', this.move); addEventListener('pointerup', this.up);
    this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
  }
  private fit() { this.center.copy(fitCamera(this.cam, this.m)); }
  private down = (e: PointerEvent) => { this.drag = true; this.lx = e.clientX; };
  private move = (e: PointerEvent) => { if (!this.drag) return; this.rotV = (e.clientX - this.lx) * .01; this.rot += this.rotV; this.lx = e.clientX; };
  private up = () => { this.drag = false; };

  private frame(now: number) {
    this.raf = requestAnimationFrame(this.frame);
    if (document.hidden) return;
    const c = this.canvas, w = c.clientWidth, h = c.clientHeight, pr = this.r.getPixelRatio();
    if (w && h && (c.width !== Math.round(w * pr) || c.height !== Math.round(h * pr))) {
      this.r.setSize(w, h, false); this.tilt.setSize(w, h, pr); this.cam.aspect = w / h; this.cam.fov = 30; this.cam.updateProjectionMatrix();
      this.fit();
    }
    const k = .12, s = this.shown, t = this.state;
    s.level += (t.level - s.level) * k; s.pos += (t.pos - s.pos) * .05; s.heat += (t.heat - s.heat) * .05;
    s.on = t.on; s.hue = t.hue; s.day = t.day;
    this.hemi.intensity = t.day ? 1.3 : .35; this.scene.environmentIntensity = t.day ? .7 : .2;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!this.drag) { this.rotV *= .92; this.rot += this.rotV; this.rot *= .985; }
    this.m.g.rotation.y = Math.max(-.9, Math.min(.9, this.rot));
    this.m.update(s, reduce ? 0 : (now - this.t0) / 1000);
    const p = this.center.clone().project(this.cam); this.tilt.set((p.y + 1) / 2, .22, 2.2);
    this.tilt.render();
  }
  destroy() {
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointerdown', this.down); removeEventListener('pointermove', this.move); removeEventListener('pointerup', this.up);
    this.tilt.dispose(); this.r.dispose(); this.r.forceContextLoss();
  }
}

// Какой предмет показывать: тип устройства из каталога плюс подсказка в имени
export function heroKind(type: string, name: string): HeroKind | null {
  const n = name.toLowerCase();
  if (type.startsWith('light.')) {
    if (/люстр/.test(n)) return 'chandelier';
    if (/бра|сова/.test(n)) return 'sconce';
    if (/столик|торшер|розетк|настол/.test(n)) return 'lamp';
    if (/спот|трек|колонн|витраж|зеркал/.test(n)) return 'spots';
    if (/лент|полк|ниш|стена/.test(n)) return 'strip';
    return 'pendant';
  }
  return ({ 'shade.motor': 'curtain', 'climate.ac': 'ac', 'climate.radiator': 'radiator', 'climate.floor': 'floorheat', 'av.tv': 'tv', 'av.projector': 'projector', 'av.audiozone': 'speaker', 'access.gate': 'gate' } as Record<string, HeroKind>)[type] ?? null;
}
