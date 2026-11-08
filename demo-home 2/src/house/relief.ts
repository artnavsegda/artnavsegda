import type * as THREE from 'three';

// Рельеф поверхностей без текстур: процедурная высота в координатах объекта,
// нормаль возмущается через производные в пикселе (как bump map, только карта — формула).
// Узор приклеен к предмету: при повороте модели он не «плывёт». Один вызов на материал.

export type Relief = 'plaster' | 'plastic' | 'fabric' | 'brushed' | 'wood' | 'ceramic';

const heights: Record<Relief, string> = {
  plaster: 'return rNoise(p) * .6 + rNoise(p * 2.7) * .4;',
  plastic: 'return rNoise(p) * .7 + rNoise(p * 3.1) * .3;',
  ceramic: 'return rNoise(p * .5) * .8 + rNoise(p * 4.0) * .2;',
  fabric: 'return (sin(p.x * 6.2832) * sin(p.y * 6.2832) + sin(p.z * 6.2832) * sin(p.y * 6.2832)) * .25 + .5 + rNoise(p * .4) * .35;',
  brushed: 'return rNoise(p * vec3(1.0, 28.0, 1.0)) * .7 + rNoise(p * 9.0) * .3;',
  wood: 'float n = rNoise(p * vec3(.6, .6, 4.0)); return fract((p.x * .25 + n * 2.2) * 3.0) * .7 + rNoise(p * vec3(2.0, 2.0, 18.0)) * .3;'
};
const presets: Record<Relief, { scale: number; k: number; rough: number }> = {
  plaster: { scale: 9, k: .9, rough: .18 },
  plastic: { scale: 26, k: .12, rough: .08 },
  ceramic: { scale: 6, k: .5, rough: .2 },
  fabric: { scale: 34, k: .8, rough: .15 },
  brushed: { scale: 8, k: .45, rough: .3 },
  wood: { scale: 3, k: .7, rough: .25 }
};

export function relief<M extends THREE.MeshStandardMaterial>(m: M, kind: Relief, scale = presets[kind].scale, k = presets[kind].k): M {
  const rough = presets[kind].rough;
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRelief;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvRelief = transformed * ${scale.toFixed(2)};`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vRelief;
float rHash(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float rNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(rHash(i), rHash(i + vec3(1,0,0)), f.x), mix(rHash(i + vec3(0,1,0)), rHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(rHash(i + vec3(0,0,1)), rHash(i + vec3(1,0,1)), f.x), mix(rHash(i + vec3(0,1,1)), rHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float rHeight(vec3 p) { ${heights[kind]} }
vec3 rPerturb(vec3 pos, vec3 n, vec2 dH, float face) {
  vec3 sx = normalize(dFdx(pos)), sy = normalize(dFdy(pos));
  vec3 r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1) * face;
  return normalize(abs(det) * n - sign(det) * (dH.x * r1 + dH.y * r2));
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
float rH = rHeight(vRelief);
roughnessFactor = clamp(roughnessFactor + (rH - .5) * ${rough.toFixed(2)}, .04, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
normal = rPerturb(-vViewPosition, normal, vec2(dFdx(rH), dFdy(rH)) * ${k.toFixed(3)}, faceDirection);`);
  };
  m.customProgramCacheKey = () => `relief-${kind}-${scale}-${k}`;
  return m;
}
