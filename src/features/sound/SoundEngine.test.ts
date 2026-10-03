import { playTick, unlockAudio, setVolume } from './SoundEngine';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Basic mock to check functionality without real AudioContext in Node
const mockCreateOscillator = vi.fn(() => ({
  type: 'sine',
  frequency: { value: 440 },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  disconnect: vi.fn(),
  onended: null,
}));

const mockCreateGain = vi.fn(() => ({
  connect: vi.fn(),
  gain: { value: 1, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
}));

beforeAll(() => {
  (global as any).window = {
    AudioContext: vi.fn(() => ({
      state: 'suspended',
      resume: vi.fn().mockResolvedValue(undefined),
      createOscillator: mockCreateOscillator,
      createGain: mockCreateGain,
      destination: {},
      currentTime: 0,
      createBiquadFilter: vi.fn(() => ({ connect: vi.fn(), frequency: { value: 0 } })),
      sampleRate: 44100,
      createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(44100) })),
      createBufferSource: vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), buffer: null }))
    }))
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SoundEngine', () => {
  it('does not play before unlock', () => {
    playTick(0, false);
    expect(mockCreateOscillator).not.toHaveBeenCalled();
  });

  it('plays after unlock', async () => {
    unlockAudio();
    // Force some delay to allow state changes if they were real
    await new Promise(r => setTimeout(r, 50));
    playTick(0, false);
    expect(mockCreateOscillator).toHaveBeenCalled();
  });

  it('rate limits to maxPerSecond', async () => {
    unlockAudio();
    await new Promise(r => setTimeout(r, 50));
    
    // Reset call count
    mockCreateOscillator.mockClear();

    // Fire 20 ticks very quickly, bypassing minIntervalMs by mocking Date.now
    let now = 100000;
    vi.spyOn(Date, 'now').mockImplementation(() => {
      now += 50; // just above minIntervalMs (45)
      return now;
    });

    for (let i = 0; i < 20; i++) {
      playTick(i, false);
    }
    
    // Limits say max 12 per second
    expect(mockCreateOscillator.mock.calls.length).toBeLessThanOrEqual(12);
    
    vi.restoreAllMocks();
  });
});
