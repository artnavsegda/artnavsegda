import * as THREE from 'three';
import { Tilt } from './tilt';
import { relief, type Relief } from './relief';
// Раскладка дома для диорамы: этажи снизу вверх, помещения — прямоугольники в метрах.
// Откуда она берётся — дело вызывающего: из редактора плана, из модели объекта или из плана прототипа.
export interface Box { x: number; z: number; w: number; d: number }
export interface LayoutRoom extends Box { zone: string; kind: string; label?: boolean }
export interface Layout { W: number; D: number; ground: number; floors: { id: string; rooms: LayoutRoom[] }[]; entrance?: Box; roof?: boolean }
type Rect = LayoutRoom;

// Дом-диорама. Этажи разнесены по высоте, стены срезаны на уровне подоконника, задние наружные
// стены — в полную высоту. Свет — главный материал: в каждой комнате своя лампа, окна светятся.
// Кадр рисуется только при изменениях: на телефоне сцена не греет батарею.

export interface ZoneStyle { glow: number; tint: number | null; tintK: number; dim: boolean; alert: boolean }
export interface Anchor { id: string; zone: string; floor: string; pos: THREE.Vector3 }

const H = 2.7, CUT = 0.9, T = 0.12, GAP = 6.6;
const kindColor: Record<string, number> = {
  living: 0xc69a6c, bedroom: 0xc29670, kids: 0xc9a27a, office: 0xb98d63, workshop: 0xb7b0a6, kitchen: 0xd7c8b2,
  bath: 0xd3dad8, hall: 0xc7a47f, hallway: 0xc7a47f, garage: 0xaeaaa4, boiler: 0xaeaaa4, tech: 0xaeaaa4, balcony: 0xb8b3aa, stairs: 0xbf9f7e
};

// Фактуры пола: доска, плитка, бетон. Одна картинка на тип, повтор — по размеру комнаты.
const texCache: Record<string, HTMLCanvasElement> = {};
function floorCanvas(t: 'wood' | 'tile' | 'concrete') {
  if (texCache[t]) return texCache[t];
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256);
  if (t === 'wood') for (let y = 0; y < 256; y += 32) {
    for (let x = (y / 32 % 2) * 64 - 64; x < 256; x += 128) { g.fillStyle = `rgba(80,50,20,${.04 + ((x * 7 + y) % 5) * .015})`; g.fillRect(x, y, 128, 32); }
    g.fillStyle = 'rgba(60,35,15,.25)'; g.fillRect(0, y, 256, 1.5);
  } else if (t === 'tile') { g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 256; i += 64) { g.fillRect(i, 0, 2, 256); g.fillRect(0, i, 256, 2); } }
  else for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .05})`; g.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); }
  return (texCache[t] = c);
}
function floorTex(kind: string, w: number, d: number) {
  const t = kind === 'bath' || kind === 'kitchen' ? 'tile' : kind === 'garage' || kind === 'boiler' || kind === 'tech' || kind === 'workshop' || kind === 'balcony' ? 'concrete' : 'wood';
  const tex = new THREE.CanvasTexture(floorCanvas(t)); tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; const k = t === 'tile' ? 1.2 : 2.4; tex.repeat.set(w / k, d / k);
  return tex;
}

type FloorParts = { group: THREE.Group; mats: THREE.Material[]; base: number };

export class Diorama {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  cam = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
  floors: Record<string, FloorParts> = {};
  rooms: { zone: string; floor: string; mat: THREE.MeshStandardMaterial; base: THREE.Color; light: THREE.PointLight; win: THREE.MeshStandardMaterial[]; mesh: THREE.Mesh; lamp: THREE.MeshStandardMaterial }[] = [];
  anchors: Anchor[] = [];
  extras: THREE.Object3D[] = [];
  hemi = new THREE.HemisphereLight(0xfff4e6, 0x6d6255, 1.1);
  sun = new THREE.DirectionalLight(0xfff1dd, 1.6);
  az = 0; el = .46; roofG = new THREE.Group(); pickable: THREE.Mesh[] = []; target = new THREE.Vector3(); half = new THREE.Vector2(10, 10);
  focus: string | null = null; night = true; isClay = false;
  onFrame: () => void = () => {};
  private anim = 0; private w = 1; private h = 1; private tilt: Tilt;

  L: Layout; ground: string; top: string;
  constructor(canvas: HTMLCanvasElement, L: Layout, opts: { look?: 'clay' } = {}) {
    this.L = L; const { W, D } = L; this.ground = L.floors[L.ground].id; this.top = L.floors[L.floors.length - 1].id;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.15;
    this.tilt = new Tilt(this.renderer, this.scene, this.cam);
    addEventListener('fx-change', this.onFx);
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 });
    this.sun.position.set(W / 2 - 14, 34, D / 2 + 18); this.sun.target.position.set(W / 2, 6, D / 2);

    L.floors.forEach(({ id: f, rooms: rects }, i) => {
      const group = new THREE.Group(); const base = (i - L.ground) * GAP;
      group.position.y = base; this.scene.add(group);
      const parts: FloorParts = { group, mats: [], base };
      this.floors[f] = parts;
      const wallM = this.mat({ color: 0xece5da, roughness: .9 }, parts, 'plaster', 3);
      const capM = this.mat({ color: 0x3b332c, roughness: .8 }, parts);
      const furnM = this.mat({ color: 0xe6ddd0, roughness: .85 }, parts, 'fabric', 10);
      const darkM = this.mat({ color: 0x6b5d50, roughness: .7 }, parts, 'wood', 1.5);
      for (const r of rects) {
        const { kind, zone } = r;
        const base = new THREE.Color(kindColor[kind] ?? 0xc7a47f);
        const mat = this.mat({ color: base.clone(), roughness: .75, map: floorTex(kind, r.w, r.d) }, parts, 'plaster', 6) as THREE.MeshStandardMaterial;
        const slab = this.box(r.w - .02, .18, r.d - .02, r.x + r.w / 2, -.09, r.z + r.d / 2, mat, group);
        slab.userData = { zone, floor: f }; this.pickable.push(slab);
        // стены: внутрь от границы, задние наружные — в полную высоту, остальные срезаны
        const win: THREE.MeshStandardMaterial[] = [];
        const edges: [number, number, number, number, boolean][] = [
          [r.x, r.z, r.x + r.w, r.z, r.z === 0], [r.x, r.z, r.x, r.z + r.d, r.x === 0],
          [r.x + r.w, r.z, r.x + r.w, r.z + r.d, false], [r.x, r.z + r.d, r.x + r.w, r.z + r.d, false]
        ];
        if (kind !== 'balcony') for (const [x1, z1, x2, z2, full] of edges) {
          const along = x1 === x2 ? 'z' : 'x'; const len = along === 'x' ? x2 - x1 : z2 - z1;
          const inX = along === 'z' ? (x1 === r.x ? T / 2 : -T / 2) : 0, inZ = along === 'x' ? (z1 === r.z ? T / 2 : -T / 2) : 0;
          const hh = full ? H : CUT;
          const cx = (x1 + x2) / 2 + inX, cz = (z1 + z2) / 2 + inZ;
          // проём двери во внутренней стене: стена из двух кусков с промежутком
          const exterior = full || (x1 === W && x2 === W) || (z1 === D && z2 === D);
          const door = !exterior && len > 1.8 && kind !== 'stairs' ? .9 : 0;
          const segs: [number, number][] = door ? [[0, len * .35 - door / 2], [len * .35 + door / 2, len]] : [[0, len]];
          for (const [a0, a1] of segs) {
            const sl = a1 - a0, mid = a0 + sl / 2 - len / 2;
            const sx = cx + (along === 'x' ? mid : 0), sz = cz + (along === 'z' ? mid : 0);
            this.box(along === 'x' ? sl : T, hh, along === 'z' ? sl : T, sx, hh / 2, sz, wallM, group, true);
            if (hh === CUT) this.box(along === 'x' ? sl : T + .02, .04, along === 'z' ? sl : T + .02, sx, CUT + .02, sz, capM, group);
          }
          if (full && i >= L.ground && kind !== 'stairs') {
            // окно в наружной стене: светится, когда в комнате горит свет
            const wm = new THREE.MeshStandardMaterial({ color: 0x36424a, emissive: 0xffc27a, emissiveIntensity: 0, roughness: .2 });
            parts.mats.push(wm); win.push(wm);
            const ww = Math.min(1.6, len * .45);
            const pane = new THREE.Mesh(new THREE.BoxGeometry(along === 'x' ? ww : T + .03, 1.3, along === 'z' ? ww : T + .03), wm);
            pane.position.set(cx, 1.55, cz); group.add(pane);
          }
        }
        if (kind === 'balcony') {
          this.box(r.w, .9, .05, r.x + r.w / 2, .45, r.z + r.d - .03, capM, group);
          this.box(.05, .9, r.d, r.x + r.w - .03, .45, r.z + r.d / 2, capM, group);
        }
        this.furnish(kind, r, group, furnM, darkM);
        const lampM = new THREE.MeshStandardMaterial({ color: 0xf6efe4, emissive: 0xffb56b, emissiveIntensity: 0, transparent: true }); parts.mats.push(lampM);
        if (kind !== 'stairs' && kind !== 'balcony') { const lamp = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 12), lampM); lamp.position.set(r.x + r.w / 2, 2.25, r.z + r.d / 2); group.add(lamp); }
        const light = new THREE.PointLight(0xffb56b, 0, Math.max(r.w, r.d) * 1.6, 1.6);
        light.position.set(r.x + r.w / 2, 2.1, r.z + r.d / 2); group.add(light);
        this.rooms.push({ zone, floor: f, mat, base, light, win, mesh: slab, lamp: lampM });
        if (r.label !== false) this.anchors.push({ id: `${f}:${zone}:${r.x}`, zone, floor: f, pos: new THREE.Vector3(r.x + r.w / 2, .2, r.z + r.d / 2) });
      }
      if (i === L.ground) this.site(group);
      if (f === this.top && L.roof !== false) this.roof(group);
    });
    if (opts.look === 'clay') { this.isClay = true; this.clay(); }
  }

  // «Макет из белого картона»: без текстур и цвета, тонкие рёбра. Свет ламп и окон остаётся живым.
  private clay() {
    const keep = new Set<THREE.Material>(); for (const r of this.rooms) { keep.add(r.lamp); r.win.forEach(w => keep.add(w)); }
    const edge = new THREE.LineBasicMaterial({ color: 0x1c1c1c, transparent: true, opacity: .5 });
    const meshes: THREE.Mesh[] = [];
    this.scene.traverse(o => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
    for (const m of meshes) {
      const mat = m.material as THREE.MeshStandardMaterial;
      if (!keep.has(mat) && mat.isMeshStandardMaterial) { mat.map = null; mat.color.set(mat.opacity < .5 ? 0xd8d6d0 : 0xf2f0eb); mat.roughness = 1; mat.needsUpdate = true; }
      if (mat.opacity < .5 || m.geometry.attributes.position.count > 400) continue;
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), edge));
    }
    for (const r of this.rooms) r.base.set(0xf4f2ee);
  }

  private mat(o: THREE.MeshStandardMaterialParameters, parts: FloorParts, rel?: Relief, scale?: number) {
    const m = new THREE.MeshStandardMaterial({ ...o, transparent: true });
    if (rel) relief(m, rel, scale);
    parts.mats.push(m); return m;
  }
  private box(w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, g: THREE.Object3D, cast = false) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; g.add(b); return b;
  }

  // Мебель — намёки, чтобы комната читалась с первого взгляда
  private furnish(kind: string, r: Rect, g: THREE.Group, m: THREE.Material, dark: THREE.Material) {
    const X = (k: number) => r.x + r.w * k, Z = (k: number) => r.z + r.d * k;
    const b = (w: number, h: number, d: number, x: number, z: number, mm = m) => this.box(w, h, d, x, h / 2, z, mm, g, true);
    if (kind === 'living') { b(2.6, .45, .95, X(.5), Z(.62)); b(.95, .45, 1.6, X(.18), Z(.45)); b(1.2, .3, .7, X(.55), Z(.42), dark); b(.3, 1.1, 2.2, X(.06), Z(.82), dark); b(2, .5, .4, X(.5), Z(.06)); }
    else if (kind === 'bedroom') { b(1.8, .5, 2.1, X(.5), Z(.3)); b(1.8, .9, .15, X(.5), Z(.05), dark); b(.5, .45, .45, X(.18), Z(.1)); b(.5, .45, .45, X(.82), Z(.1)); }
    else if (kind === 'kids') { b(.95, .45, 2, X(.2), Z(.32)); b(1.2, .75, .6, X(.75), Z(.12)); b(1.3, .05, 1.3, X(.62), Z(.65), dark); }
    else if (kind === 'kitchen') { b(r.w - .4, .9, .62, X(.5), Z(.08)); b(.62, .9, 2.2, X(.06), Z(.42)); b(1.8, .75, .9, X(.55), Z(.62), dark); }
    else if (kind === 'bath') { b(1.7, .55, .78, X(.3), Z(.18)); b(.9, .85, .5, X(.78), Z(.12)); }
    else if (kind === 'office') { b(1.6, .75, .75, X(.55), Z(.2), dark); b(.4, 2, 2, X(.06), Z(.55)); b(1.1, .45, .9, X(.6), Z(.75)); }
    else if (kind === 'workshop') { b(2.4, .9, .8, X(.45), Z(.1), dark); b(.5, 1.8, 1.6, X(.92), Z(.5)); }
    else if (kind === 'garage') { b(1.9, 1.3, 4.3, X(.5), Z(.55), dark); }
    else if (kind === 'boiler') { b(.7, 1.6, .7, X(.25), Z(.2), dark); b(.7, 1.9, .7, X(.5), Z(.2)); }
    else if (kind === 'stairs') { for (let i = 0; i < 9; i++) this.box(1.1, .3 * (i + 1), .36, r.x + .65, .15 * (i + 1), r.z + r.d - .3 - i * .36, m, g, true); }
  }

  private site(g: THREE.Group) {
    const lawnM = new THREE.MeshStandardMaterial({ color: 0x8d9d6e, roughness: 1, transparent: true });
    const pathM = new THREE.MeshStandardMaterial({ color: 0xcfc6b8, roughness: 1, transparent: true });
    this.floors[this.ground].mats.push(lawnM, pathM);
    const { W, D } = this.L, entrance = this.L.entrance;
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(W + 7, .3, D + 7), lawnM);
    lawn.position.set(W / 2, -.34, D / 2 + .8); lawn.receiveShadow = true; g.add(lawn); this.extras.push(lawn);
    if (entrance) {
    const path = this.box(entrance.w, .06, entrance.d, entrance.x + entrance.w / 2, -.17, entrance.z + entrance.d / 2, pathM, g);
    path.userData = { zone: 'entrance', floor: this.ground }; this.pickable.push(path);
    this.anchors.push({ id: 'site:entrance', zone: 'entrance', floor: 'site', pos: new THREE.Vector3(entrance.x + entrance.w / 2, 0, entrance.z + entrance.d - .6) });
    }
    const leaf = new THREE.MeshStandardMaterial({ color: 0x5f7350, roughness: 1, transparent: true });
    const trunk = new THREE.MeshStandardMaterial({ color: 0x6a5240, transparent: true });
    this.floors[this.ground].mats.push(leaf, trunk);
    for (const [x, z, s] of [[-2.2, 2, 1.1], [-2, 7.5, .8], [13.8, 1, 1], [14, 10.5, .7], [3, 11.6, .6]]) {
      const t = new THREE.Group();
      const c = new THREE.Mesh(new THREE.ConeGeometry(.9 * s, 2.6 * s, 7), leaf); c.position.y = 1.9 * s; c.castShadow = true;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, .8 * s, 6), trunk); tr.position.y = .4 * s;
      t.add(c, tr); t.position.set(x, -.2, z); g.add(t);
    }
  }
  private roof(g: THREE.Group) {
    const m = new THREE.MeshStandardMaterial({ color: 0x8a7a70, roughness: .9, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide });
    g.add(this.roofG);
    const { W, D } = this.L;
    const rise = 2.4, run = D / 2 + .5, len = Math.hypot(rise, run);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(W + 1, .14, len), m);
      p.position.set(W / 2, H + 2.6 + rise / 2, D / 2 + s * run / 2);
      p.rotation.x = s * Math.atan2(rise, run); this.roofG.add(p);
    }
  }

  // ——— состояние ———
  apply(style: Record<string, ZoneStyle>, night: boolean) {
    this.night = night;
    // белый макет и ночью остаётся белым: свет — только лампы и окна
    this.hemi.intensity = this.isClay ? (night ? 1.05 : 1.3) : night ? .62 : 1.15;
    this.hemi.color.set(this.isClay ? 0xffffff : night ? 0x9aa6c4 : 0xfff4e6);
    this.sun.intensity = night ? .12 : 1.7;
    this.sun.color.set(night ? 0x9fb3ff : 0xfff1dd);
    for (const r of this.rooms) {
      const s = style[r.zone] ?? { glow: 0, tint: null, tintK: 0, dim: false, alert: false };
      const c = r.base.clone();
      if (s.tint !== null) c.lerp(new THREE.Color(s.tint), s.tintK);
      if (s.dim) c.lerp(new THREE.Color(night ? 0x3a3631 : 0xcfcac2), .55);
      r.mat.color.copy(c);
      r.mat.emissive.set(s.alert ? 0xff3b30 : s.tint !== null && s.tintK > .5 ? s.tint : 0xffa860);
      r.mat.emissiveIntensity = s.alert ? .55 : s.tint !== null && s.tintK > .5 ? (night ? .35 : .12) : s.glow * (night ? .18 : .04);
      r.light.intensity = s.glow * (night ? 9 : 2.5);
      r.lamp.emissiveIntensity = s.glow * (night ? 5 : 1.5);
      for (const w of r.win) w.emissiveIntensity = s.glow > 0 ? (night ? 1.6 : .4) * (.4 + s.glow) : 0;
    }
    this.render();
  }

  // ——— камера: изометрия на рельсах ———
  private basis() {
    const a = Math.PI / 4 + this.az, el = this.el;
    const dir = new THREE.Vector3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el));
    return dir;
  }
  private frame(focus: string | null) {
    const el0 = this.el; this.el = focus ? .95 : .46;
    const box = new THREE.Box3();
    const { W, D } = this.L, g = this.ground;
    if (focus) { const b = this.floors[focus].base; box.set(new THREE.Vector3(-.3, b, -.3), new THREE.Vector3(W + .3, b + (focus === g ? 1.4 : 1.2), D + (focus === 'f1' ? 3.6 : .3))); }
    else box.set(new THREE.Vector3(-1.5, this.floors[this.L.floors[0].id].base - .3, -1.5), new THREE.Vector3(W + 1.5, this.floors[this.top].base + H + (this.L.roof !== false ? 4.2 : .5), D + 3.8));
    const dir = this.basis(); const cen = box.getCenter(new THREE.Vector3());
    const m = new THREE.Matrix4().lookAt(dir, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
    const right = new THREE.Vector3().setFromMatrixColumn(m, 0), up = new THREE.Vector3().setFromMatrixColumn(m, 1);
    let hx = 0, hy = 0;
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(cen);
      hx = Math.max(hx, Math.abs(p.dot(right))); hy = Math.max(hy, Math.abs(p.dot(up)));
    }
    const asp = this.w / this.h;
    if (hx / hy > asp) hy = hx / asp; else hx = hy * asp;
    this.el = el0;
    return { cen, half: new THREE.Vector2(hx * 1.06, hy * 1.06), el: focus ? .95 : .46 };
  }
  private place() {
    const dir = this.basis();
    this.cam.position.copy(this.target).addScaledVector(dir, 120);
    this.cam.lookAt(this.target);
    Object.assign(this.cam, { left: -this.half.x, right: this.half.x, top: this.half.y, bottom: -this.half.y });
    this.cam.updateProjectionMatrix();
  }
  resize(w: number, h: number) {
    this.w = w; this.h = h; this.renderer.setSize(w, h, false); this.tilt.setSize(w, h, this.renderer.getPixelRatio());
    const f = this.frame(this.focus); this.target.copy(f.cen); this.half.copy(f.half); this.el = f.el; this.place(); this.render();
  }
  setFocus(f: string | null) {
    this.focus = f;
    const to = this.frame(f), fromT = this.target.clone(), fromH = this.half.clone(), fromEl = this.el;
    const order = this.L.floors.map(x => x.id);
    const op0 = Object.fromEntries(order.map(k => [k, (this.floors[k].mats[0] as THREE.MeshStandardMaterial).opacity]));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now(), dur = reduce ? 1 : 520;
    cancelAnimationFrame(this.anim);
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      this.target.lerpVectors(fromT, to.cen, e); this.half.lerpVectors(fromH, to.half, e); this.el = fromEl + (to.el - fromEl) * e;
      for (const fl of order) {
        const want = !f || fl === f ? 1 : 0, o = op0[fl] + (want - op0[fl]) * e;
        for (const m of this.floors[fl].mats) m.opacity = o;
        this.floors[fl].group.visible = o > .02;
      }
      this.roofG.visible = !f || e < .3 ? !f : false;
      this.place(); this.render();
      if (k < 1) this.anim = requestAnimationFrame(step);
    };
    step();
  }
  rotate(dAz: number) { this.az = Math.max(-.55, Math.min(.55, this.az + dAz)); this.place(); this.render(); }
  settle() { const f = this.frame(this.focus); this.half.copy(f.half); this.target.copy(f.cen); this.el = f.el; this.place(); this.render(); }

  render() {
    this.sun.shadow.needsUpdate = true;
    // резкая полоса — на этаже в фокусе; в обзоре — посередине дома
    if (this.focus) {
      const b = this.floors[this.focus].base, p = new THREE.Vector3(this.L.W / 2, b + .6, this.L.D / 2).project(this.cam);
      this.tilt.set((p.y + 1) / 2, .2, 4);
    } else this.tilt.set(.47, .2, 3);
    this.tilt.render();
    this.onFrame();
  }
  project(p: THREE.Vector3, floor: string) {
    const v = p.clone(); v.y += floor === 'site' ? this.floors[this.ground].base : this.floors[floor].base;
    v.project(this.cam);
    return { x: (v.x + 1) / 2 * this.w, y: (1 - v.y) / 2 * this.h };
  }
  pick(x: number, y: number): { zone: string; floor: string } | null {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(x / this.w * 2 - 1, -(y / this.h) * 2 + 1), this.cam);
    const hit = ray.intersectObjects(this.pickable.filter(m => m.parent!.visible), false)[0];
    return hit ? (hit.object.userData as { zone: string; floor: string }) : null;
  }
  private onFx = () => this.render();
  dispose() { removeEventListener('fx-change', this.onFx); cancelAnimationFrame(this.anim); this.tilt.dispose(); this.renderer.dispose(); }
}
