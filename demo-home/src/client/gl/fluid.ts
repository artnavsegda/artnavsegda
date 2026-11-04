import { program, reducedMotion, spring } from './gl';

// Живой фон: медленно текущий градиент на domain-warped шуме.
// Рендерится в низком разрешении (свет мягкий, деталей нет) — дёшево даже на старом iPad.
// energy — насколько фон «дышит» (у медиа-экрана сильнее, под музыку).

const FRAG = `precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform float uEnergy;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uG;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(h(i), h(i+vec2(1,0)), u.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * n(p); p *= 2.03; a *= .5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 p = uv * vec2(uRes.x / uRes.y, 1.) * 1.6;
  float t = uTime * .035;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3. * q + vec2(1.7, 9.2) + t * 1.3), fbm(p + 3. * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 2.5 * r);
  vec3 col = mix(uC, uA, smoothstep(.25, .85, f));
  col = mix(col, uB, smoothstep(.3, .9, r.x) * .8);
  float g = smoothstep(.55, 1., f + .25 * q.y) * (.35 + .4 * uEnergy);
  col = mix(col, uG, g * .55);
  float vig = smoothstep(1.25, .35, length(uv - vec2(.35, .3)));
  col *= mix(.85, 1., vig);
  col += (h(gl_FragCoord.xy) - .5) / 255.;
  gl_FragColor = vec4(col, 1.);
}`;

type RGB = [number, number, number];

export class Fluid {
  private gl: WebGLRenderingContext | null;
  private u: (n: string) => WebGLUniformLocation | null = () => null;
  private raf = 0;
  private t0 = performance.now() - 40000;
  private colors: RGB[] = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
  private target: RGB[] = this.colors;
  private energy = 0; private energyT = 0; private ev = 0; private last = 0;

  constructor(private canvas: HTMLCanvasElement, private scale = 0.3) {
    this.gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!this.gl) return;
    this.u = program(this.gl, FRAG).u;
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  setColors(a: RGB, b: RGB, c: RGB, g: RGB) {
    const first = this.colors[0].every(v => v === 0) && this.colors[2].every(v => v === 0);
    this.target = [a, b, c, g];
    if (first) this.colors = this.target.map(x => [...x] as RGB);
  }
  setEnergy(e: number) { this.energyT = e; }

  private loop(now: number) {
    this.raf = requestAnimationFrame(this.loop);
    if (document.hidden) return;
    const gl = this.gl!, c = this.canvas;
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now;
    const w = Math.max(1, Math.round(c.clientWidth * this.scale)), h = Math.max(1, Math.round(c.clientHeight * this.scale));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
    // плавная смена палитры при переключении дня/ночи и тренда
    const k = 1 - Math.exp(-dt * 2.2);
    this.colors = this.colors.map((col, i) => col.map((v, j) => v + (this.target[i][j] - v) * k) as RGB);
    [this.energy, this.ev] = spring(this.energy, this.ev, this.energyT, dt, 3);
    const t = reducedMotion() ? 40 : (now - this.t0) / 1000;
    gl.uniform2f(this.u('uRes'), w, h);
    gl.uniform1f(this.u('uTime'), t);
    gl.uniform1f(this.u('uEnergy'), this.energy);
    (['uA', 'uB', 'uC', 'uG'] as const).forEach((n, i) => gl.uniform3fv(this.u(n), this.colors[i]));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() { cancelAnimationFrame(this.raf); this.gl?.getExtension('WEBGL_lose_context')?.loseContext(); }
}
