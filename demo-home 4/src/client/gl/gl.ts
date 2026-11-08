// Минимальная обвязка WebGL1: компиляция, полноэкранный треугольник, цикл кадров.

export function program(gl: WebGLRenderingContext, frag: string) {
  const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
    return s;
  };
  const pr = gl.createProgram()!;
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(pr);
  gl.useProgram(pr);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(pr, n);
  return { pr, u };
}

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Критически демпфированная пружина: плавно догоняет цель без перелёта. */
export function spring(v: number, vel: number, target: number, dt: number, omega = 7) {
  const x = v - target;
  const e = Math.exp(-omega * dt);
  const nx = (x + (vel + omega * x) * dt) * e;
  const nv = (vel - omega * (vel + omega * x) * dt) * e;
  return [target + nx, nv] as const;
}
