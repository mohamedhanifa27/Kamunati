/**
 * AmbientEngine.ts — Orchestrates the render loop, resize, pause/resume, and context loss.
 * Zero React dependencies — this is pure TS.
 */

import { createBlobState, stepBlobs, setPointer, addScrollVelocity, BlobState } from './blobs';
import { BASE_PALETTE, PaletteColour, blendColour } from './palette';
import { createWebGLRenderer, WebGLRenderer } from './webgl';
import { renderCanvas2D } from './canvas2d';
import { getCut, measureCoverageFromGL, measureCoverageFromCanvas, updateCoverage } from './coverage';
import { recordFrameTime, checkQuality, setMode, onContextLoss, RenderMode } from './quality';

export type AmbientMode = 'live' | 'calm' | 'static' | 'off';

interface FocusEntry {
  id: string;
  palette: PaletteColour[];
  blendT: number;  // 0=just started, 1=fully blended
}

export class AmbientEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderer | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private blobState: BlobState;
  private focusEntry: FocusEntry | null = null;
  private releaseTimer: ReturnType<typeof setTimeout> | null = null;
  private rafId = 0;
  private lastTs = 0;
  private coverageInterval: ReturnType<typeof setInterval> | null = null;
  private paused = false;
  private _mode: AmbientMode = 'live';
  private cut = 0.55;
  private pixelRatio = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.blobState = createBlobState();
    this.initRenderer();
    this.bindEvents();
    this.resize();
    this.startCoverageLoop();
    this.startRenderLoop();
  }

  get mode(): AmbientMode { return this._mode; }

  setMode(m: AmbientMode): void {
    this._mode = m;
    if (m === 'off' || m === 'static') {
      this.stopRenderLoop();
      if (m === 'off') {
        const ctx = this.canvas.getContext('2d');
        if (ctx) { ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
      }
    } else {
      this.startRenderLoop();
    }
  }

  pause(): void {
    this.paused = true;
    this.stopRenderLoop();
  }

  resume(): void {
    if (this.paused && this._mode !== 'off' && this._mode !== 'static') {
      this.paused = false;
      this.lastTs = 0;
      this.startRenderLoop();
    }
  }

  /** Focus the ambient palette toward a card palette */
  focus(id: string, palette: PaletteColour[]): void {
    if (this.releaseTimer) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }
    const fromPalette = this.focusEntry
      ? this.focusEntry.palette.map((c, i) => blendColour(c, BASE_PALETTE[i % BASE_PALETTE.length], 1 - this.focusEntry!.blendT))
      : [...BASE_PALETTE];
    this.focusEntry = { id, palette: fromPalette, blendT: 0 };
    void palette; // target is stored; blend happens in render
    this._focusTarget = palette;
  }
  private _focusTarget: PaletteColour[] = BASE_PALETTE;

  /** Release focus, return to base palette after delay */
  release(id: string): void {
    if (this.focusEntry?.id !== id) return;
    this.releaseTimer = setTimeout(() => {
      this._focusTarget = BASE_PALETTE;
      this.focusEntry = this.focusEntry
        ? { ...this.focusEntry, blendT: this.focusEntry.blendT }
        : null;
    }, 900);
  }

  releaseAll(): void {
    if (this.releaseTimer) clearTimeout(this.releaseTimer);
    this._focusTarget = BASE_PALETTE;
  }

  onPointerMove(x: number, y: number): void {
    this.blobState = setPointer(this.blobState, x, y);
  }

  onScroll(dy: number): void {
    this.blobState = addScrollVelocity(this.blobState, dy);
  }

  // ──────────────────────────────────────────────────────────────────────────

  private initRenderer(): void {
    const mode = checkQuality();
    if (mode === 'webgl2') {
      try {
        this.gl = createWebGLRenderer(this.canvas);
        if (!this.gl) {
          setMode('canvas2d');
          this.init2D();
        } else {
          // Handle context loss
          this.canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            onContextLoss();
            this.gl = null;
            const newMode = checkQuality();
            if (newMode !== 'webgl2') this.init2D();
          });
          this.canvas.addEventListener('webglcontextrestored', () => {
            this.gl = createWebGLRenderer(this.canvas);
          });
        }
      } catch {
        setMode('canvas2d');
        this.init2D();
      }
    } else {
      this.init2D();
    }
  }

  private init2D(): void {
    this.ctx2d = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.pixelRatio = dpr * 0.5; // render at half resolution
    const w = Math.floor(window.innerWidth * this.pixelRatio);
    const h = Math.floor(window.innerHeight * this.pixelRatio);
    this.canvas.width = w;
    this.canvas.height = h;
    if (this.gl) this.gl.resize(w, h);
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.resize(), { passive: true });

    // Pointer
    window.addEventListener('pointermove', (e) => {
      this.onPointerMove(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    }, { passive: true });

    // Scroll
    window.addEventListener('scroll', (e) => {
      const t = e.target as Element | null;
      if (t) this.onScroll((t as any).scrollTop ?? 0);
    }, { passive: true, capture: true });

    // Tab visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stopRenderLoop();
      else if (!this.paused && this._mode !== 'off' && this._mode !== 'static') {
        this.lastTs = 0;
        this.startRenderLoop();
      }
    });
  }

  private startRenderLoop(): void {
    if (this.rafId) return;
    const loop = (ts: number) => {
      if (!this.lastTs) this.lastTs = ts;
      const dt = ts - this.lastTs;
      this.lastTs = ts;
      const t0 = performance.now();
      this.tick(dt);
      recordFrameTime(performance.now() - t0);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopRenderLoop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private startCoverageLoop(): void {
    this.coverageInterval = setInterval(() => {
      let measured: number;
      if (this.gl) {
        measured = measureCoverageFromGL(this.gl.gl, this.canvas.width, this.canvas.height);
      } else {
        measured = measureCoverageFromCanvas(this.canvas);
      }
      this.cut = updateCoverage(measured);
    }, 250);
  }

  private tick(dt: number): void {
    if (this._mode === 'off') return;

    // Step blobs
    this.blobState = stepBlobs(this.blobState, dt, this._mode);

    // Blend focus palette
    const activePalette = this.buildActivePalette(dt);

    // Render
    const cut = getCut();
    if (this.gl) {
      this.gl.render(this.blobState, BASE_PALETTE, activePalette, cut);
    } else if (this.ctx2d) {
      renderCanvas2D(this.ctx2d, this.blobState, BASE_PALETTE, activePalette, cut);
    }
  }

  private buildActivePalette(dt: number): PaletteColour[] | null {
    if (!this.focusEntry && this._focusTarget === BASE_PALETTE) return null;

    if (this.focusEntry) {
      // Advance blend toward target
      const speed = 0.0014 * dt; // ~700ms full transition
      this.focusEntry.blendT = Math.min(1, this.focusEntry.blendT + speed);

      if (this.focusEntry.blendT >= 1 && this._focusTarget === BASE_PALETTE) {
        this.focusEntry = null;
        return null;
      }

      // Blend current entry toward _focusTarget
      return this._focusTarget.slice(0, 3).map((tc, i) => {
        const fc = this.focusEntry!.palette[i] ?? BASE_PALETTE[i];
        return blendColour(fc, tc, this.focusEntry!.blendT);
      });
    }
    return null;
  }

  destroy(): void {
    this.stopRenderLoop();
    if (this.coverageInterval) clearInterval(this.coverageInterval);
    if (this.releaseTimer) clearTimeout(this.releaseTimer);
    window.removeEventListener('pointermove', this.onPointerMove as any);
    window.removeEventListener('scroll', this.onScroll as any);
    this.gl?.destroy();
  }
}
