import { program, spring, reducedMotion } from './gl';

// Пятна света поверх фотографии интерьера. Канвас лежит на фото
// с mix-blend-mode: screen, поэтому чёрный — «ничего не добавлять».
// Уровни догоняют состояние устройства пружиной: свет не щёлкает, а разгорается.

export interface Light { x: number; y: number; r: number; color: [number, number, number]; level: number }

const MAX = 8;
const FRAG = `precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform int uN;
uniform vec3 uL[${MAX}]; uniform vec4 uC[${MAX}];
void main(){
  vec2 p = gl_FragCoord.xy; vec3 col = vec3(0.);
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uN) break;
    vec2 d = (p - uL[i].xy) / uL[i].z; d.y *= 1.2;
    float x = dot(d, d);
    float pool = exp(-x * 3.0);
    float core = exp(-x * 46.0) * .7;
    float br = .95 + .05 * sin(uTime * .8 + float(i) * 1.9);
    col += uC[i].rgb * uC[i].a * (pool * .6 + core) * br;
  }
  float n = fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453) / 255.;
  gl_FragColor = vec4(col + n, 1.);
}`;

export class Relight {
  private gl: WebGLRenderingContext | null;
  private u: (n: string) => WebGLUniformLocation | null = () => null;
  private lights: Light[] = [];
  private cur: number[] = [];
  private vel: number[] = [];
  private raf = 0;
  private last = 0;
  private t0 = performance.now();
  private scale = 0.5;

  constructor(private canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!this.gl) return;
    this.u = program(this.gl, FRAG).u;
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  set(lights: Light[]) {
    this.lights = lights.slice(0, MAX);
    while (this.cur.length < this.lights.length) { this.cur.push(0); this.vel.push(0); }
  }

  private loop(now: number) {
    this.raf = requestAnimationFrame(this.loop);
    const gl = this.gl!;
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now;
    const c = this.canvas;
    const w = Math.max(1, Math.round(c.clientWidth * devicePixelRatio * this.scale));
    const h = Math.max(1, Math.round(c.clientHeight * devicePixelRatio * this.scale));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
    const k = w / Math.max(1, c.clientWidth);
    const L = new Float32Array(MAX * 3), C = new Float32Array(MAX * 4);
    this.lights.forEach((l, i) => {
      [this.cur[i], this.vel[i]] = reducedMotion() ? [l.level, 0] : spring(this.cur[i], this.vel[i], l.level, dt, 5);
      L.set([l.x * k, h - l.y * k, l.r * k], i * 3);
      C.set([...l.color, Math.max(0, this.cur[i])], i * 4);
    });
    gl.uniform2f(this.u('uRes'), w, h);
    gl.uniform1f(this.u('uTime'), (now - this.t0) / 1000);
    gl.uniform1i(this.u('uN'), this.lights.length);
    gl.uniform3fv(this.u('uL'), L);
    gl.uniform4fv(this.u('uC'), C);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() { cancelAnimationFrame(this.raf); this.gl?.getExtension('WEBGL_lose_context')?.loseContext(); }
}
