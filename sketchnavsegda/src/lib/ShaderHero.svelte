<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  let host: HTMLDivElement;
  let canvas: HTMLCanvasElement;

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uRes;
    uniform vec2 uMouse;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.03;
        a *= 0.5;
      }
      return v;
    }

    mat2 rot(float a) {
      float c = cos(a);
      float s = sin(a);
      return mat2(c, -s, s, c);
    }

    float sdBox(vec2 p, vec2 b) {
      vec2 d = abs(p) - b;
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    }

    float smin(float a, float b, float k) {
      float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
      return mix(b, a, h) - k * h * (1.0 - h);
    }

    float ign(vec2 p) {
      return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
    }

    float slab(vec2 p, float t) {
      vec2 a = rot(-0.28 + sin(t * 0.25) * 0.05) * (p - vec2(-0.34, 0.22));
      return sdBox(a, vec2(0.42, 0.42)) - 0.02;
    }

    float bar(vec2 p) {
      vec2 b = rot(0.12) * (p - vec2(-0.18, -0.58));
      return sdBox(b, vec2(0.58, 0.09)) - 0.02;
    }

    void main() {
      float aspect = uRes.x / max(uRes.y, 1.0);
      vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 2.0;
      float t = uTime;
      vec2 m = (uMouse - 0.5) * vec2(0.25, 0.18);

      vec3 paper = vec3(0.949, 0.941, 0.914);
      vec3 ink = vec3(0.067, 0.067, 0.067);
      vec3 acid = vec3(1.0, 0.902, 0.0);

      vec3 col = paper;

      vec2 gp = abs(fract(p * 2.5) - 0.5);
      float grid = smoothstep(0.015, 0.0, min(gp.x, gp.y));
      col = mix(col, ink, grid * 0.12);

      vec2 q = rot(0.35) * (p + m * 0.5);
      vec2 cell = fract(q * 9.0) - 0.5;
      float dots = smoothstep(0.24, 0.19, length(cell));
      float fn = fbm(p * 1.6 + vec2(t * 0.05, -t * 0.04));
      col = mix(col, ink, dots * 0.07 * smoothstep(0.30, 0.80, fn));

      vec2 pc = p - vec2(0.58, 0.50) - m * 0.4;
      float disc = length(pc) - 0.60;
      disc = max(disc, -(p.y - 0.02));
      col = mix(col, acid, smoothstep(0.006, -0.006, disc));

      vec2 g = p - m * 0.6;
      float band = floor(g.y * 12.0 + t * 1.2);
      float gl = step(0.82, fract(sin(band * 127.1) * 43758.5453));
      g.x += gl * 0.06 * sin(t * 2.5 + band * 1.7);
      g.x += sin(g.y * 5.0 + t * 1.1) * 0.012;

      float n = ign(gl_FragCoord.xy + t * 40.0);
      vec2 off = vec2(0.05, -0.045);
      float dInk = min(slab(g, t), bar(g)) + (n - 0.5) * 0.02;
      float dMis = min(slab(g + off, t), bar(g + off)) + (n - 0.5) * 0.02;

      col = mix(col, acid, smoothstep(0.006, -0.006, dMis));
      float fill = smoothstep(0.006, -0.006, dInk);
      col = mix(col, ink, fill);

      vec2 wc = rot(-0.28 + sin(t * 0.25) * 0.05) * (g - vec2(-0.34, 0.22));
      float win = sdBox(wc, vec2(0.16, 0.16));
      col = mix(col, acid, smoothstep(0.004, -0.004, win) * fill);

      col += (hash21(gl_FragCoord.xy + fract(t * 0.7) * 100.0) - 0.5) * 0.05;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  onMount(() => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let mx = 0.5;
    let my = 0.5;
    let tmx = 0.5;
    let tmy = 0.5;

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      tmx = (e.clientX - r.left) / r.width;
      tmy = 1 - (e.clientY - r.top) / r.height;
    };
    host.addEventListener('pointermove', onMove);

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      mx += (tmx - mx) * 0.06;
      my += (tmy - my) * 0.06;
      uniforms.uMouse.value.set(mx, my);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    };
  });
</script>

<div bind:this={host} class="h-full w-full">
  <canvas bind:this={canvas} class="block h-full w-full"></canvas>
</div>
