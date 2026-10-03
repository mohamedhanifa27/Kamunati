/**
 * SoundEngine.ts — Web Audio API Interface Sounds
 * Pure TS. Generates synthetic ticks.
 */

const TICK_PARAMS = {
  waveform: 'triangle' as OscillatorType,
  baseFrequencyHz: 1500,
  pitchLadderSemitones: [0, 2, 4, 7, 9, 12, 9, 7, 4, 2],
  attackMs: 1,
  decayMs: 22,
  peakGain: 0.18,
  noiseBurstMs: 6,
  noiseGain: 0.05,
  lowpassHz: 6500,
  stereoJitter: 0.15,
};

const LIMITS = {
  minIntervalMs: 45,
  maxPerSecond: 12,
  masterCeiling: 0.6,
  defaultVolume: 0.35,
};

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlocked = false;
let ticksThisSecond = 0;
let lastSecondStart = 0;
let lastTickTime = 0;

// Shared audio buffer for the noise burst (created once)
let noiseBuffer: AudioBuffer | null = null;

function getContext() {
  if (!ctx && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new CtxClass();
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = LIMITS.defaultVolume * LIMITS.masterCeiling;

    // Create 1 second of white noise
    const sampleRate = ctx.sampleRate;
    noiseBuffer = ctx.createBuffer(1, sampleRate, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < sampleRate; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }
  return ctx;
}

export function unlockAudio() {
  if (unlocked) return;
  const c = getContext();
  if (!c) return;
  if (c.state === 'suspended') {
    c.resume().then(() => {
      unlocked = true;
    }).catch(() => {
      // ignore
    });
  } else {
    unlocked = true;
  }
}

export function setVolume(volume: number, enabled: boolean) {
  if (!masterGain || !ctx) return;
  masterGain.gain.setTargetAtTime(
    enabled ? volume * LIMITS.masterCeiling : 0,
    ctx.currentTime,
    0.05
  );
}

export function playTick(index: number, isScroll: boolean) {
  if (!unlocked || !ctx || !masterGain || ctx.state !== 'running') return;

  const now = Date.now();
  if (now - lastTickTime < LIMITS.minIntervalMs) return;

  if (now - lastSecondStart >= 1000) {
    lastSecondStart = now;
    ticksThisSecond = 0;
  }
  if (ticksThisSecond >= LIMITS.maxPerSecond) return;

  ticksThisSecond++;
  lastTickTime = now;

  const t = ctx.currentTime;
  const semitone = TICK_PARAMS.pitchLadderSemitones[index % TICK_PARAMS.pitchLadderSemitones.length];
  const freq = TICK_PARAMS.baseFrequencyHz * Math.pow(2, semitone / 12);
  
  const peak = TICK_PARAMS.peakGain * (isScroll ? 0.7 : 1.0);

  // 1. Stereo Panner
  let panner: StereoPannerNode | undefined;
  let dest: AudioNode = masterGain;
  if (ctx.createStereoPanner) {
    panner = ctx.createStereoPanner();
    // Jitter left/right slightly
    panner.pan.value = (Math.random() * 2 - 1) * TICK_PARAMS.stereoJitter;
    panner.connect(masterGain);
    dest = panner;
  }

  // 2. Tonal Oscillator
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = TICK_PARAMS.waveform;
  osc.frequency.value = freq;
  osc.connect(oscGain);
  
  // 3. Lowpass filter (applies to both osc and noise)
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = TICK_PARAMS.lowpassHz;
  filter.connect(dest);
  
  oscGain.connect(filter);

  // Envelope for oscillator
  oscGain.gain.setValueAtTime(0, t);
  oscGain.gain.linearRampToValueAtTime(peak, t + TICK_PARAMS.attackMs / 1000);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + (TICK_PARAMS.attackMs + TICK_PARAMS.decayMs) / 1000);
  
  // 4. Noise burst
  let noiseSrc: AudioBufferSourceNode | undefined;
  let noiseGain: GainNode | undefined;
  if (noiseBuffer) {
    noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseGain = ctx.createGain();
    
    noiseSrc.connect(noiseGain);
    noiseGain.connect(filter);
    
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(TICK_PARAMS.noiseGain, t + 0.001);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + TICK_PARAMS.noiseBurstMs / 1000);
    
    noiseSrc.start(t);
    noiseSrc.stop(t + TICK_PARAMS.noiseBurstMs / 1000);
  }

  osc.start(t);
  osc.stop(t + (TICK_PARAMS.attackMs + TICK_PARAMS.decayMs) / 1000);

  // Cleanup
  osc.onended = () => {
    osc.disconnect();
    oscGain.disconnect();
    filter.disconnect();
    if (panner) panner.disconnect();
    if (noiseSrc) noiseSrc.disconnect();
    if (noiseGain) noiseGain.disconnect();
  };
}

// Global event listeners to unlock audio on first interaction
if (typeof document !== 'undefined') {
  const unlock = () => {
    unlockAudio();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
    document.removeEventListener('touchstart', unlock);
  };
  document.addEventListener('pointerdown', unlock, { once: true, passive: true });
  document.addEventListener('keydown', unlock, { once: true, passive: true });
  document.addEventListener('touchstart', unlock, { once: true, passive: true });
}
