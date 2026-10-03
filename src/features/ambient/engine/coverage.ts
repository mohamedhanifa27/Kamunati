/**
 * coverage.ts — Closed-loop coverage controller.
 * Measures the fraction of pixels that are coloured (max(R,G,B) >= 26/255)
 * and adjusts the shader's u_cut uniform to maintain the 35/65 target.
 */

export const COVERAGE_TARGET = 0.35;
export const COVERAGE_TOLERANCE = 0.03;

interface PIState {
  integral: number;
  lastError: number;
}

const KP = 0.3;
const KI = 0.05;
const INTEGRAL_MAX = 0.5;

let piState: PIState = { integral: 0, lastError: 0 };
let cut = 0.55; // initial value that tends toward 35% coverage

/** PI controller step — call at ~4 Hz */
export function updateCoverage(measured: number): number {
  const error = COVERAGE_TARGET - measured;
  piState.integral = Math.max(
    -INTEGRAL_MAX,
    Math.min(INTEGRAL_MAX, piState.integral + error * 0.25),
  );
  const correction = KP * error + KI * piState.integral;
  cut = Math.max(0.2, Math.min(0.85, cut - correction * 0.1));
  piState.lastError = error;
  return cut;
}

/** Reset if palette swaps drastically */
export function resetCoverage(): void {
  piState = { integral: 0, lastError: 0 };
}

export function getCut(): number {
  return cut;
}

/**
 * Sample a 64×36 downscale of the canvas and compute the coverage ratio.
 * Returns a value in [0,1].
 */
export function measureCoverageFromCanvas(canvas: HTMLCanvasElement): number {
  const W = 64;
  const H = 36;
  const tmp = document.createElement('canvas');
  tmp.width = W;
  tmp.height = H;
  const ctx = tmp.getContext('2d', { willReadFrequently: true });
  if (!ctx) return COVERAGE_TARGET;
  ctx.drawImage(canvas, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);
  const THRESHOLD = 26;
  let coloured = 0;
  const total = W * H;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.max(data[i], data[i + 1], data[i + 2]) >= THRESHOLD) coloured++;
  }
  return coloured / total;
}

/** Estimate coverage from WebGL readback (call after render) */
export function measureCoverageFromGL(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
): number {
  const W = 64;
  const H = 36;
  const buf = new Uint8Array(W * H * 4);
  // Read a 64x36 region from bottom-left (GL origin)
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  const THRESHOLD = 26;
  let coloured = 0;
  for (let i = 0; i < buf.length; i += 4) {
    if (Math.max(buf[i], buf[i + 1], buf[i + 2]) >= THRESHOLD) coloured++;
  }
  return coloured / (W * H);
}
