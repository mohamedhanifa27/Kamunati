/**
 * quality.ts — Frame-time monitor and adaptive quality controller.
 * Switches between WebGL2, Canvas2D, and CSS fallback based on performance.
 */

export type RenderMode = 'webgl2' | 'canvas2d' | 'css';

interface QualityState {
  mode: RenderMode;
  frameTimes: number[];
  contextLossCount: number;
}

const state: QualityState = {
  mode: 'webgl2',
  frameTimes: [],
  contextLossCount: 0,
};

const WINDOW = 30; // frames to average
const SLOW_THRESHOLD_MS = 33; // below 30fps average → degrade

export function recordFrameTime(ms: number): void {
  state.frameTimes.push(ms);
  if (state.frameTimes.length > WINDOW) state.frameTimes.shift();
}

export function getAverageFrameTime(): number {
  if (state.frameTimes.length === 0) return 16;
  return state.frameTimes.reduce((a, b) => a + b, 0) / state.frameTimes.length;
}

export function getMode(): RenderMode {
  return state.mode;
}

export function setMode(m: RenderMode): void {
  state.mode = m;
}

export function onContextLoss(): void {
  state.contextLossCount++;
  if (state.contextLossCount >= 2) {
    state.mode = 'canvas2d';
  }
}

/** Called each frame — may downgrade mode if performance is consistently poor */
export function checkQuality(): RenderMode {
  if (state.mode === 'webgl2' && getAverageFrameTime() > SLOW_THRESHOLD_MS) {
    state.mode = 'canvas2d';
  }
  return state.mode;
}
