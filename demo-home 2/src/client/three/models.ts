import * as THREE from 'three';
import { spring, reducedMotion } from '../gl/gl';

// Процедурные модели устройств. В продукте здесь будут GLB от 3D-художника
// (по одной на модель светильника заказчика); интерфейс тот же:
// модель + материалы, которые светятся по уровню и цветовой температуре.

export type ModelKind = 'dome' | 'floor' | 'speaker' | 'vacuum';

const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);

interface Built { g: THREE.Group; cam: number[]; glow: THREE.MeshStandardMaterial[]; glowK: number[]; light?: THREE.PointLight; outer?: THREE.MeshStandardMaterial }

function dome(day: boolean): Built {
  const g = new THREE.Group();
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * .5; prof.push(new THREE.Vector2(.06 + 1.25 * Math.sin(a), .62 * Math.cos(a))); }
  prof.push(new THREE.Vector2(1.33, -.02));
  const geo = new THREE.LatheGeometry(prof, 96);
  const outer = std(day ? { color: 0xe9e4dc, roughness: .6, metalness: .1 } : { color: 0x2a2018, metalness: .85, roughness: .32 });
  const inner = std({ color: 0xffffff, roughness: .5, emissive: 0xffb25e, emissiveIntensity: 0, side: THREE.BackSide });
  g.add(new THREE.Mesh(geo, outer), new THREE.Mesh(geo, inner));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.31, .025, 12, 96), std({ color: 0xc9a46a, metalness: 1, roughness: .25 }));
  rim.rotation.x = Math.PI / 2; g.add(rim);
  const bulbM = std({ color: 0xffffff, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: .2 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.2, 32, 16), bulbM); bulb.position.y = .08; g.add(bulb);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .28, 24), std({ color: 0xc9a46a, metalness: 1, roughness: .3 })); neck.position.y = .7; g.add(neck);
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 3, 8), std({ color: 0x111111 })); cab.position.y = 2.3; g.add(cab);
  const light = new THREE.PointLight(0xffb25e, 0, 5, 2); light.position.y = .05; g.add(light);
  return { g, cam: [0, -1.2, 6.2, 0, .1, 0], glow: [inner, bulbM], glowK: [2.2, 6], light, outer };
}

function floor(day: boolean): Built {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.5, .56, .08, 48), std({ color: 0x1e1c1a, metalness: .7, roughness: .35 })));
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 3.1, 12), std({ color: 0xc9a46a, metalness: 1, roughness: .3 })); pole.position.y = 1.55; g.add(pole);
  const sg = new THREE.CylinderGeometry(.55, .78, .85, 64, 1, true);
  const so = std({ color: day ? 0xefe7da : 0xd8cbb4, roughness: .95, emissive: 0xffb25e, emissiveIntensity: 0 });
  const si = std({ color: 0xffffff, roughness: .8, emissive: 0xffb25e, emissiveIntensity: 0, side: THREE.BackSide });
  const a = new THREE.Mesh(sg, so), b = new THREE.Mesh(sg, si); a.position.y = b.position.y = 3.2; g.add(a, b);
  const light = new THREE.PointLight(0xffb25e, 0, 5, 2); light.position.y = 3.1; g.add(light);
  return { g, cam: [0, 1.4, 10.5, 0, 1.75, 0], glow: [so, si], glowK: [.35, 2], light };
}

function speaker(day: boolean): Built {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.9, .95, 2.2, 64), std({ color: day ? 0xd9d5cd : 0x3a3a3e, roughness: .95 })));
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.88, .88, .06, 64), std({ color: 0x1b1b1d, roughness: .3, metalness: .4 })); top.position.y = 1.13; g.add(top);
  const ringM = std({ color: 0x222222, emissive: 0x7cc6d6, emissiveIntensity: 0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.6, .035, 12, 96), ringM); ring.rotation.x = Math.PI / 2; ring.position.y = 1.17; g.add(ring);
  return { g, cam: [0, 2.3, 6.6, 0, .1, 0], glow: [ringM], glowK: [3] };
}

function vacuum(day: boolean): Built {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.42, .36, 72), std({ color: day ? 0xf4f2ee : 0xdedbd6, roughness: .35, metalness: .05 })));
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, .02, 72), std({ color: 0x1f1f23, roughness: .15, metalness: .3 })); lid.position.y = .19; g.add(lid);
  const tur = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .18, 48), std({ color: 0xe8e6e2, roughness: .4 })); tur.position.set(0, .3, -.45); g.add(tur);
  const ledM = std({ color: 0x111111, emissive: 0x5fd18a, emissiveIntensity: 0 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(.06, 16, 8), ledM); led.position.set(0, .21, .75); g.add(led);
  return { g, cam: [0, 3.4, 5.4, 0, -.1, 0], glow: [ledM], glowK: [4] };
}

const builders: Record<ModelKind, (day: boolean) => Built> = { dome, floor, speaker, vacuum };

function setGlow(m: Built, level: number, color?: THREE.Color) {
  m.glow.forEach((mat, i) => { if (color) mat.emissive.copy(color); mat.emissiveIntensity = level * m.glowK[i]; });
  if (m.light && color) { m.light.color.copy(color); m.light.intensity = level * 3.5; }
}

const ctThree = (ct: number) => new THREE.Color().setRGB(...(ct <= 3000 ? [1, .66, .34] : ct <= 4500 ? [1, .85, .66] : [.85, .92, 1]) as [number, number, number]);

// ——— постеры: один общий рендерер, картинки в кэше ———
const cache = new Map<string, string>();
let baker: THREE.WebGLRenderer | null = null;

export function poster(kind: ModelKind, on: boolean, day: boolean, size = 360): string {
  const key = `${kind}|${on}|${day}`;
  const hit = cache.get(key); if (hit) return hit;
  try {
    if (!baker) {
      const cv = document.createElement('canvas'); cv.width = cv.height = size;
      baker = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
      baker.outputColorSpace = THREE.SRGBColorSpace; baker.toneMapping = THREE.ACESFilmicToneMapping; baker.toneMappingExposure = 1.05;
      baker.setSize(size, size, false);
    }
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3530, day ? 1.2 : .7));
    const key1 = new THREE.DirectionalLight(0xffffff, 1.7); key1.position.set(3, 5, 4); scene.add(key1);
    const rim = new THREE.DirectionalLight(0xffe6c4, 1.1); rim.position.set(-4, 3, -3); scene.add(rim);
    const m = builders[kind](day); m.g.rotation.y = .5; scene.add(m.g);
    setGlow(m, on ? 1 : 0, kind === 'dome' || kind === 'floor' ? ctThree(2700) : undefined);
    const cam = new THREE.PerspectiveCamera(30, 1, .1, 60); cam.position.set(m.cam[0], m.cam[1], m.cam[2]); cam.lookAt(m.cam[3], m.cam[4], m.cam[5]);
    baker.render(scene, cam);
    const url = baker.domElement.toDataURL('image/png');
    cache.set(key, url);
    scene.traverse(o => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
    return url;
  } catch { return ''; }
}

// ——— живая модель светильника для экрана устройства ———
export class LampView {
  private r: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam: THREE.PerspectiveCamera;
  private m: Built;
  private spot: THREE.SpotLight;
  private hemi: THREE.HemisphereLight;
  private table: THREE.MeshStandardMaterial;
  private raf = 0; private last = 0;
  private lvl = 0; private lv = 0; private col = new THREE.Color(1, .66, .34);
  private target = { level: 0, ct: 2700, day: false };
  private rot = .5; private rotV = 0; private dragging = false; private lastX = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.r.outputColorSpace = THREE.SRGBColorSpace; this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.05;
    this.cam = new THREE.PerspectiveCamera(32, 1, .1, 100);
    this.cam.position.set(0, -.2, 9.6); this.cam.lookAt(0, -.6, 0);
    this.m = dome(false); this.m.g.position.y = .4; this.scene.add(this.m.g);
    this.spot = new THREE.SpotLight(0xffb25e, 0, 14, .95, .85, 1.6);
    this.spot.position.set(0, .3, 0); this.spot.target.position.set(0, -4, 0); this.scene.add(this.spot, this.spot.target);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x222222, .3); this.scene.add(this.hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 4, 5); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe6c4, .8); rim.position.set(-4, 2, -3); this.scene.add(rim);
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d')!; const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, '#fff'); gr.addColorStop(.55, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    this.table = std({ color: 0x3a2a1e, roughness: .55, metalness: .05, transparent: true, alphaMap: new THREE.CanvasTexture(c) });
    const t = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), this.table); t.rotation.x = -Math.PI / 2; t.position.y = -2.2; this.scene.add(t);
    canvas.addEventListener('pointerdown', this.down); addEventListener('pointermove', this.move); addEventListener('pointerup', this.up);
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
  }

  private down = (e: PointerEvent) => { this.dragging = true; this.lastX = e.clientX; };
  private move = (e: PointerEvent) => { if (!this.dragging) return; this.rotV = (e.clientX - this.lastX) * .012; this.rot += this.rotV; this.lastX = e.clientX; };
  private up = () => { this.dragging = false; };

  set(level: number, ct: number, day: boolean) {
    this.target = { level, ct, day };
    const o = this.m.outer!;
    if (day) { o.color.setHex(0xe9e4dc); o.metalness = .1; o.roughness = .6; this.table.color.setHex(0xcbb79c); this.hemi.intensity = 1.3; }
    else { o.color.setHex(0x2a2018); o.metalness = .85; o.roughness = .32; this.table.color.setHex(0x3a2a1e); this.hemi.intensity = .25; }
  }

  private frame(now: number) {
    this.raf = requestAnimationFrame(this.frame);
    if (document.hidden) return;
    const dt = Math.min(.05, (now - (this.last || now)) / 1000); this.last = now;
    const c = this.canvas, w = c.clientWidth, h = c.clientHeight;
    if (w && h && (c.width !== Math.round(w * this.r.getPixelRatio()) || c.height !== Math.round(h * this.r.getPixelRatio()))) {
      this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
      this.cam.position.z = w / h < .8 ? 11 : 9.6;
    }
    [this.lvl, this.lv] = reducedMotion() ? [this.target.level, 0] : spring(this.lvl, this.lv, this.target.level, dt, 6);
    this.col.lerp(ctThree(this.target.ct), 1 - Math.exp(-dt * 3));
    const L = Math.max(0, this.lvl);
    this.m.glow[0].emissive.copy(this.col); this.m.glow[0].emissiveIntensity = L * 2.2;
    this.m.glow[1].emissive.copy(this.col); this.m.glow[1].emissiveIntensity = .2 + L * 6;
    this.m.light!.color.copy(this.col); this.m.light!.intensity = L * 4;
    this.spot.color.copy(this.col); this.spot.intensity = L * 70;
    if (!this.dragging) { this.rotV *= Math.exp(-dt * 3); this.rot += this.rotV + (reducedMotion() ? 0 : dt * .12); }
    this.m.g.rotation.y = this.rot;
    this.m.g.rotation.z = Math.sin(now / 2400) * .015;
    this.r.render(this.scene, this.cam);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointerdown', this.down); removeEventListener('pointermove', this.move); removeEventListener('pointerup', this.up);
    this.r.dispose(); this.r.forceContextLoss();
  }
}
