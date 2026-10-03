/**
 * blobs.ts — Blob simulation: positions, drift, springs, pointer forces
 * All math runs in plain typed arrays. React never touches this per-frame.
 */

import { PaletteColour, BASE_PALETTE } from './palette';

export interface Blob {
  x: number;     // [0..1] normalised viewport
  y: number;
  vx: number;
  vy: number;
  radius: number;       // [0..1] of viewport min dimension
  colourIdx: number;    // index into palette
  phaseX: number;       // Lissajous phase
  phaseY: number;
  freqX: number;        // drift frequency (rad/s)
  freqY: number;
  ox: number;           // orbit centre x
  oy: number;           // orbit centre y
  targetColourIdx: number;
  colourBlend: number;  // 0=current, 1=target
}

export interface Beam {
  active: boolean;
  progress: number;    // 0..1
  angle: number;
  opacity: number;
  startAt: number;     // epoch ms
  duration: number;    // ms
}

export interface BlobState {
  blobs: Blob[];
  beam: Beam;
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
  pointerIdleMs: number;
  scrollVel: number;
  time: number;
}

const BLOB_COUNT = 8;
const PLANET_COUNT = 3;
const BEAM_MIN_INTERVAL = 25000;
const BEAM_MAX_INTERVAL = 40000;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function createBlobState(): BlobState {
  const blobs: Blob[] = [];

  for (let i = 0; i < BLOB_COUNT + PLANET_COUNT; i++) {
    const isPlanet = i >= BLOB_COUNT;
    blobs.push({
      x: rand(0.05, 0.95),
      y: rand(0.05, 0.95),
      vx: 0,
      vy: 0,
      radius: isPlanet ? rand(0.08, 0.14) : rand(0.12, 0.28),
      colourIdx: i % BASE_PALETTE.length,
      phaseX: rand(0, Math.PI * 2),
      phaseY: rand(0, Math.PI * 2),
      freqX: rand(0.0002, 0.0005),
      freqY: rand(0.0002, 0.0005),
      ox: rand(0.2, 0.8),
      oy: rand(0.2, 0.8),
      targetColourIdx: i % BASE_PALETTE.length,
      colourBlend: 1,
    });
  }

  return {
    blobs,
    beam: { active: false, progress: 0, angle: rand(-0.4, 0.4), opacity: 0, startAt: 0, duration: 12000 },
    pointerX: 0.5,
    pointerY: 0.5,
    pointerActive: false,
    pointerIdleMs: 0,
    scrollVel: 0,
    time: 0,
  };
}

let nextBeamAt = Date.now() + rand(BEAM_MIN_INTERVAL, BEAM_MAX_INTERVAL);

export function stepBlobs(state: BlobState, dtMs: number, mode: string): BlobState {
  if (dtMs > 200) dtMs = 200; // clamp huge deltas after tab switches
  const dt = dtMs * (mode === 'calm' ? 0.5 : 1.0);
  const now = state.time + dtMs;

  const blobs = state.blobs.map((b, _i) => {
    // Lissajous drift
    const lx = b.ox + 0.35 * Math.sin(b.freqX * now + b.phaseX);
    const ly = b.oy + 0.35 * Math.cos(b.freqY * now + b.phaseY);

    // Spring toward Lissajous target
    const stiffness = 0.00004;
    const damping = 0.92;
    const ax = (lx - b.x) * stiffness * dt;
    const ay = (ly - b.y) * stiffness * dt;

    let vx = b.vx * damping + ax;
    let vy = b.vy * damping + ay;

    // Pointer attraction (desktop)
    if (state.pointerActive && state.pointerIdleMs < 3000 && mode !== 'static' && mode !== 'off') {
      const dx = state.pointerX - b.x;
      const dy = state.pointerY - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
      const influence = Math.max(0, 1 - dist / 0.5) * 0.00002 * dt;
      const fadeout = Math.max(0, 1 - state.pointerIdleMs / 3000);
      vx += (dx / dist) * influence * fadeout;
      vy += (dy / dist) * influence * fadeout;
    }

    // Scroll velocity adds to drift
    vx += state.scrollVel * 0.0001 * dt;

    // Soft boundary repulsion
    const margin = 0.05;
    if (b.x < margin) vx += (margin - b.x) * 0.001 * dt;
    if (b.x > 1 - margin) vx -= (b.x - (1 - margin)) * 0.001 * dt;
    if (b.y < margin) vy += (margin - b.y) * 0.001 * dt;
    if (b.y > 1 - margin) vy -= (b.y - (1 - margin)) * 0.001 * dt;

    const clamp = 0.001;
    vx = Math.max(-clamp, Math.min(clamp, vx));
    vy = Math.max(-clamp, Math.min(clamp, vy));

    const colourBlend = Math.min(1, b.colourBlend + 0.002 * dt);

    return { ...b, x: b.x + vx, y: b.y + vy, vx, vy, colourBlend };
  });

  // Beam (skip in calm mode)
  let beam = state.beam;
  if (mode !== 'calm' && mode !== 'static' && mode !== 'off') {
    const nowMs = Date.now();
    if (!beam.active && nowMs >= nextBeamAt) {
      beam = {
        active: true,
        progress: 0,
        angle: rand(-0.35, 0.35),
        opacity: 0,
        startAt: nowMs,
        duration: 12000,
      };
      nextBeamAt = nowMs + rand(BEAM_MIN_INTERVAL, BEAM_MAX_INTERVAL);
    }
    if (beam.active) {
      const elapsed = nowMs - beam.startAt;
      const progress = elapsed / beam.duration;
      let opacity: number;
      if (progress < 0.15) opacity = progress / 0.15;
      else if (progress < 0.75) opacity = 1;
      else opacity = 1 - (progress - 0.75) / 0.25;
      beam = { ...beam, progress, opacity: Math.max(0, Math.min(1, opacity)) };
      if (progress >= 1) beam = { ...beam, active: false };
    }
  }

  // Decay pointer idle and scroll velocity
  const pointerIdleMs = state.pointerIdleMs + dtMs;
  const scrollVel = state.scrollVel * 0.95;

  return { ...state, blobs, beam, pointerIdleMs, scrollVel, time: now };
}

export function setPointer(state: BlobState, x: number, y: number): BlobState {
  return { ...state, pointerX: x, pointerY: y, pointerActive: true, pointerIdleMs: 0 };
}

export function addScrollVelocity(state: BlobState, dy: number): BlobState {
  const vel = Math.max(-2, Math.min(2, state.scrollVel + dy * 0.01));
  return { ...state, scrollVel: vel };
}

/** Retarget blobs near an anchor to use the given palette colours */
export function focusPalette(
  state: BlobState,
  colours: PaletteColour[],
  _anchor: { x: number; y: number } | undefined,
): BlobState {
  // Assign card colours to first N blobs, rest keep base palette
  const blobs = state.blobs.map((b, i) => {
    if (i < colours.length * 2) {
      const ci = i % colours.length;
      // We store the actual colour index in a side-channel; here we use colourIdx as a float rgb trick
      // For simplicity we store colour data externally in AmbientEngine
      return { ...b, targetColourIdx: ci, colourBlend: 0 };
    }
    return b;
  });
  return { ...state, blobs };
}
