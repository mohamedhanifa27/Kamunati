/**
 * canvas2d.ts — Canvas 2D fallback renderer
 * Used when WebGL2 is unavailable. Radial gradients, composited.
 */
import { BlobState } from './blobs';
import { PaletteColour } from './palette';

export function renderCanvas2D(
  ctx: CanvasRenderingContext2D,
  state: BlobState,
  palette: PaletteColour[],
  focusPal: PaletteColour[] | null,
  _cut: number,
): void {
  const { width: w, height: h } = ctx.canvas;
  ctx.clearRect(0, 0, w, h);

  const activePal = (focusPal && focusPal.length > 0) ? focusPal : palette;

  ctx.globalCompositeOperation = 'lighter';

  for (const blob of state.blobs) {
    const cx = blob.x * w;
    const cy = blob.y * h;
    const r = blob.radius * Math.min(w, h);
    const ci = blob.colourIdx % activePal.length;
    const pc = activePal[ci];

    const hex = pc.hex;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grd.addColorStop(0, hex + 'cc');
    grd.addColorStop(0.4, hex + '55');
    grd.addColorStop(1, '#00000000');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Beam
  if (state.beam.active && state.beam.opacity > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(state.beam.angle);
    const bx = (state.beam.progress - 0.5) * 2.5 * w;
    const grd = ctx.createLinearGradient(bx - 20, 0, bx + 20, 0);
    grd.addColorStop(0, '#00000000');
    grd.addColorStop(0.5, `rgba(72, 149, 255, ${state.beam.opacity * 0.4})`);
    grd.addColorStop(1, '#00000000');
    ctx.fillStyle = grd;
    ctx.fillRect(bx - 20, -h, 40, h * 2);
    ctx.restore();
  }

  ctx.globalCompositeOperation = 'source-over';
}
