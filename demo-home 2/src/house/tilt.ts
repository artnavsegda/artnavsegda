import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Tilt-shift: резкая горизонтальная полоса, выше и ниже — нарастающее размытие.
// Два прохода по 9 выборок — дёшево даже на телефоне, а кадр всё равно рисуется только при изменениях.
const blur = (dir: [number, number]) => ({
  uniforms: { tDiffuse: { value: null }, px: { value: new THREE.Vector2(1 / 512, 1 / 512) }, focus: { value: .5 }, band: { value: .12 }, amount: { value: 3 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 px; uniform float focus, band, amount; varying vec2 vUv;
    void main(){
      float k = smoothstep(band, band + .28, abs(vUv.y - focus)) * amount;
      vec2 d = vec2(${dir[0].toFixed(1)}, ${dir[1].toFixed(1)}) * px * k;
      vec4 s = texture2D(tDiffuse, vUv) * .1633;
      s += (texture2D(tDiffuse, vUv - d) + texture2D(tDiffuse, vUv + d)) * .1531;
      s += (texture2D(tDiffuse, vUv - 2.0 * d) + texture2D(tDiffuse, vUv + 2.0 * d)) * .12245;
      s += (texture2D(tDiffuse, vUv - 3.0 * d) + texture2D(tDiffuse, vUv + 3.0 * d)) * .0918;
      s += (texture2D(tDiffuse, vUv - 4.0 * d) + texture2D(tDiffuse, vUv + 4.0 * d)) * .051;
      gl_FragColor = s;
    }`
});

export class Tilt {
  composer: EffectComposer;
  private h: ShaderPass; private v: ShaderPass;
  constructor(r: THREE.WebGLRenderer, scene: THREE.Scene, cam: THREE.Camera) {
    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(scene, cam));
    this.h = new ShaderPass(blur([1, 0])); this.v = new ShaderPass(blur([0, 1]));
    this.composer.addPass(this.h); this.composer.addPass(this.v); this.composer.addPass(new OutputPass());
  }
  setSize(w: number, h: number, pr: number) {
    this.composer.setPixelRatio(pr); this.composer.setSize(w, h);
    for (const p of [this.h, this.v]) p.uniforms.px.value.set(1 / w, 1 / h); // смещения в CSS-пикселях: размытие одинаковое при любой плотности экрана
  }
  // focus — центр резкой полосы по высоте (0 — низ, 1 — верх), band — её полуширина, amount — сила размытия
  set(focus: number, band: number, amount: number) {
    for (const p of [this.h, this.v]) { p.uniforms.focus.value = focus; p.uniforms.band.value = band; p.uniforms.amount.value = amount; }
  }
  render() { this.composer.render(); }
  dispose() { this.composer.dispose(); }
}
