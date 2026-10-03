/**
 * webgl.ts — WebGL2 renderer for the ambient background.
 * One fullscreen triangle, one fragment shader.
 * Renders at 0.5x resolution, CSS handles upscaling (soft gradients look fine).
 */

import { BlobState } from './blobs';
import { PaletteColour } from './palette';

const VERT_SRC = `#version 300 es
  in vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG_SRC = `#version 300 es
precision mediump float;

#define MAX_BLOBS 11

uniform vec2  u_res;
uniform float u_time;
uniform float u_cut;
uniform float u_soft;
uniform float u_beamAngle;
uniform float u_beamProgress;
uniform float u_beamOpacity;

// Blob uniforms (packed)
uniform vec2  u_bpos[MAX_BLOBS];
uniform float u_brad[MAX_BLOBS];
uniform vec3  u_bcol[MAX_BLOBS];

out vec4 fragColor;

// 1-bit blue-noise dither (bayer 4x4 approximation)
float dither(vec2 fc) {
  vec2 p = mod(fc, 4.0);
  float idx = p.x + p.y * 4.0;
  float t = mod(idx * 23.0 + 13.0, 16.0) / 16.0;
  return (t - 0.5) / 255.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;

  // Accumulate blob field
  float field = 0.0;
  vec3 colour = vec3(0.0);
  float totalW = 0.0;

  for (int i = 0; i < MAX_BLOBS; i++) {
    vec2 bp = u_bpos[i];
    bp.x *= aspect;
    vec2 sp = uv;
    sp.x *= aspect;
    float d = length(sp - bp);
    float r = u_brad[i] * min(1.0, u_res.y / 600.0);
    // Smooth metaball-like falloff
    float f = exp(-d * d / (r * r * 0.5));
    field += f;
    colour += u_bcol[i] * f;
    totalW += f;
  }

  // Normalise colour
  vec3 col = totalW > 0.001 ? colour / totalW : vec3(0.0);

  // Coverage gate: smoothstep maps field to [0,1]
  float mask = smoothstep(u_cut - u_soft, u_cut + u_soft, field);

  // Beam — thin diagonal streak
  if (u_beamOpacity > 0.0) {
    float ca = cos(u_beamAngle), sa = sin(u_beamAngle);
    // Rotate UV around centre
    vec2 c = uv - 0.5;
    float rotX = c.x * ca - c.y * sa;
    float beamPos = (u_beamProgress - 0.5) * 2.5; // sweeps from -1.25 to 1.25
    float beamDist = abs(rotX - beamPos);
    float beamMask = smoothstep(0.03, 0.0, beamDist);
    // Azure beam colour
    col = mix(col, vec3(0.28, 0.58, 1.0), beamMask * u_beamOpacity * 0.6);
    mask = max(mask, beamMask * u_beamOpacity * 0.4);
  }

  // Final: pure black outside mask, colour inside
  vec3 finalCol = col * mask;
  // Blue-noise dither to prevent banding
  finalCol += dither(gl_FragCoord.xy);

  fragColor = vec4(clamp(finalCol, 0.0, 1.0), 1.0);
}
`;

export interface WebGLRenderer {
  resize(w: number, h: number): void;
  render(state: BlobState, palette: PaletteColour[], focusPalette: PaletteColour[] | null, cut: number): void;
  destroy(): void;
  readonly gl: WebGL2RenderingContext;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(sh) ?? 'shader compile error');
  return sh;
}

export function createWebGLRenderer(canvas: HTMLCanvasElement): WebGLRenderer | null {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false });
  if (!gl) return null;

  const vert = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
  const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog) ?? 'program link error');

  // Fullscreen triangle
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Uniform locations
  const locs = {
    res: gl.getUniformLocation(prog, 'u_res'),
    time: gl.getUniformLocation(prog, 'u_time'),
    cut: gl.getUniformLocation(prog, 'u_cut'),
    soft: gl.getUniformLocation(prog, 'u_soft'),
    beamAngle: gl.getUniformLocation(prog, 'u_beamAngle'),
    beamProgress: gl.getUniformLocation(prog, 'u_beamProgress'),
    beamOpacity: gl.getUniformLocation(prog, 'u_beamOpacity'),
    bpos: gl.getUniformLocation(prog, 'u_bpos'),
    brad: gl.getUniformLocation(prog, 'u_brad'),
    bcol: gl.getUniformLocation(prog, 'u_bcol'),
  };

  let w = canvas.width;
  let h = canvas.height;

  return {
    gl,
    resize(nw: number, nh: number) {
      w = nw; h = nh;
      canvas.width = nw;
      canvas.height = nh;
      gl.viewport(0, 0, nw, nh);
    },
    render(state: BlobState, palette: PaletteColour[], focusPal: PaletteColour[] | null, cut: number) {
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.uniform2f(locs.res, w, h);
      gl.uniform1f(locs.time, state.time * 0.001);
      gl.uniform1f(locs.cut, cut);
      gl.uniform1f(locs.soft, 0.15);
      gl.uniform1f(locs.beamAngle, state.beam.angle);
      gl.uniform1f(locs.beamProgress, state.beam.progress);
      gl.uniform1f(locs.beamOpacity, state.beam.opacity);

      // Pack blob data
      const MAX = 11;
      const posArr = new Float32Array(MAX * 2);
      const radArr = new Float32Array(MAX);
      const colArr = new Float32Array(MAX * 3);

      const activePalette = (focusPal && focusPal.length > 0) ? focusPal : palette;

      for (let i = 0; i < MAX; i++) {
        const b = state.blobs[i] ?? { x: 0, y: 0, radius: 0, colourIdx: 0, colourBlend: 1, targetColourIdx: 0 };
        posArr[i * 2] = b.x;
        posArr[i * 2 + 1] = b.y;
        radArr[i] = b.radius;

        const ci = Math.floor(b.colourIdx) % activePalette.length;
        const tc = Math.floor(b.targetColourIdx) % activePalette.length;
        const sc = activePalette[ci];
        const dc = activePalette[tc];
        const t = b.colourBlend;
        colArr[i * 3] = sc.r * (1 - t) + dc.r * t;
        colArr[i * 3 + 1] = sc.g * (1 - t) + dc.g * t;
        colArr[i * 3 + 2] = sc.b * (1 - t) + dc.b * t;
      }

      gl.uniform2fv(locs.bpos, posArr);
      gl.uniform1fv(locs.brad, radArr);
      gl.uniform3fv(locs.bcol, colArr);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
    },
  };
}
