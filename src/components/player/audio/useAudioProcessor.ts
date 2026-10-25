// [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES]
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

export interface AudioProcessorOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export type StereoMode = 'stereo' | 'left' | 'right' | 'reverse' | 'mono';

export interface EqualizerPreset {
  name: string;
  label: string;
  gains: number[]; // 10 bands (-20 to +20 dB)
}

export const VLC_EQ_FREQUENCIES = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

export const VLC_EQ_PRESETS: Record<string, EqualizerPreset> = {
  flat: {
    name: 'flat',
    label: 'Flat (Default)',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  rock: {
    name: 'rock',
    label: 'Rock',
    gains: [4.8, 3.2, -1.8, -3.9, -1.1, 2.0, 5.0, 6.8, 8.0, 8.8]
  },
  pop: {
    name: 'pop',
    label: 'Pop',
    gains: [-1.6, 1.2, 3.2, 4.0, 3.8, 2.0, -1.2, -1.8, -1.8, -1.8]
  },
  classical: {
    name: 'classical',
    label: 'Classical',
    gains: [4.8, 3.8, 3.2, 2.5, -1.5, -1.8, 0, 2.2, 3.2, 4.0]
  },
  bass_boost: {
    name: 'bass_boost',
    label: 'Full Bass Boost',
    gains: [8.0, 6.8, 5.5, 3.5, 1.5, 0, 0, 0, 0, 0]
  },
  vocal: {
    name: 'vocal',
    label: 'Vocal / Dialogue Clarity',
    gains: [-2.0, -3.2, -1.8, 1.2, 4.0, 5.2, 4.0, 2.0, 0, -2.0]
  },
  movie: {
    name: 'movie',
    label: 'Cinema / Movie',
    gains: [4.0, 2.5, 0.5, 0, 1.5, 2.5, 3.5, 4.5, 5.0, 4.5]
  },
  club: {
    name: 'club',
    label: 'Club',
    gains: [0, 0, 2.0, 3.2, 3.2, 3.2, 2.0, 0, 0, 0]
  },
  party: {
    name: 'party',
    label: 'Party',
    gains: [6.8, 6.8, 0, 0, 0, 0, 0, 0, 6.8, 6.8]
  },
  techno: {
    name: 'techno',
    label: 'Techno',
    gains: [7.0, 5.5, 0, -3.2, -2.8, 0, 6.8, 8.2, 8.2, 7.5]
  },
  full_treble: {
    name: 'full_treble',
    label: 'Full Treble',
    gains: [-9.0, -9.0, -9.0, -4.0, 2.2, 6.8, 10.5, 12.0, 13.0, 13.5]
  }
};

export interface AudioProcessorState {
  audioDelayMs: number;
  volumeBoost: number; // 1.0 = 100%, up to 2.0 = 200% (VLC super-boost)
  isNightMode: boolean;
  isReady: boolean;
  stereoMode: StereoMode;
  eqEnabled: boolean;
  preampGain: number; // -20dB to +20dB
  eqBands: number[];  // 10 bands
  activePreset: string;
}

export function useAudioProcessor({ videoRef }: AudioProcessorOptions) {
  const [audioDelayMs, setAudioDelayMs] = useState<number>(0);
  const [volumeBoost, setVolumeBoost] = useState<number>(1.0);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [stereoMode, setStereoMode] = useState<StereoMode>('stereo');
  const [eqEnabled, setEqEnabled] = useState<boolean>(false);
  const [preampGain, setPreampGain] = useState<number>(0);
  const [eqBands, setEqBands] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [activePreset, setActivePreset] = useState<string>('flat');
  const [isReady, setIsReady] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const preampGainNodeRef = useRef<GainNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  const splitterNodeRef = useRef<ChannelSplitterNode | null>(null);
  const mergerNodeRef = useRef<ChannelMergerNode | null>(null);

  // Initialize Web Audio API Chain matching VLC Audio Architecture
  const initAudioChain = useCallback(() => {
    if (typeof window === 'undefined') return;
    const video = videoRef.current;
    if (!video || audioCtxRef.current) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(video);
      sourceNodeRef.current = source;

      // 1. Channel Splitter and Merger for Stereo Modes (VLC Stereo Architecture)
      const splitter = ctx.createChannelSplitter(2);
      const merger = ctx.createChannelMerger(2);
      splitterNodeRef.current = splitter;
      mergerNodeRef.current = merger;

      source.connect(splitter);
      splitter.connect(merger, 0, 0); // L -> L
      splitter.connect(merger, 1, 1); // R -> R

      // 2. Preamp Gain Node
      const preamp = ctx.createGain();
      preamp.gain.value = Math.pow(10, preampGain / 20);
      preampGainNodeRef.current = preamp;
      merger.connect(preamp);

      // 3. 10-Band Graphic Equalizer (VLC 10-Band EQ)
      const filters: BiquadFilterNode[] = [];
      let lastNode: AudioNode = preamp;

      VLC_EQ_FREQUENCIES.forEach((freq, idx) => {
        const filter = ctx.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === VLC_EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = eqEnabled ? (eqBands[idx] || 0) : 0;
        
        lastNode.connect(filter);
        lastNode = filter;
        filters.push(filter);
      });
      filterNodesRef.current = filters;

      // 4. Audio Delay Node (supports -2s to +2s sync)
      const delay = ctx.createDelay(5.0);
      delay.delayTime.value = Math.max(0, audioDelayMs / 1000);
      delayNodeRef.current = delay;
      lastNode.connect(delay);

      // 5. Dynamics Compressor (VLC Night Mode / Normalizer / Anti-Clipping Limiter)
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = isNightMode ? -24 : -1;
      compressor.knee.value = 30;
      compressor.ratio.value = isNightMode ? 12 : 20; // Limiter ratio when boosting above 100%
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorNodeRef.current = compressor;
      delay.connect(compressor);

      // 6. Master Volume Boost Node (up to 200% VLC super-boost)
      const gain = ctx.createGain();
      gain.gain.value = volumeBoost;
      gainNodeRef.current = gain;
      compressor.connect(gain);

      // Connect to audio hardware output
      gain.connect(ctx.destination);

      setIsReady(true);
    } catch (e) {
      console.warn('[useAudioProcessor] Web Audio API init error (ignoring if already bound):', e);
    }
  }, [videoRef, audioDelayMs, isNightMode, volumeBoost, preampGain, eqEnabled, eqBands]);

  // Resume context on play
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (!audioCtxRef.current) {
        initAudioChain();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    };

    video.addEventListener('play', handlePlay);
    return () => {
      video.removeEventListener('play', handlePlay);
    };
  }, [videoRef, initAudioChain]);

  // Update Audio Delay
  useEffect(() => {
    if (!delayNodeRef.current || !audioCtxRef.current) return;
    const targetSeconds = Math.max(0, audioDelayMs / 1000);
    try {
      delayNodeRef.current.delayTime.setTargetAtTime(targetSeconds, audioCtxRef.current.currentTime, 0.05);
    } catch {
      delayNodeRef.current.delayTime.value = targetSeconds;
    }
  }, [audioDelayMs]);

  // Update Volume Boost (100% - 200%)
  useEffect(() => {
    if (!gainNodeRef.current || !audioCtxRef.current) return;
    try {
      gainNodeRef.current.gain.setTargetAtTime(volumeBoost, audioCtxRef.current.currentTime, 0.05);
    } catch {
      gainNodeRef.current.gain.value = volumeBoost;
    }
  }, [volumeBoost]);

  // Update Compressor (Night Mode & Limiter)
  useEffect(() => {
    if (!compressorNodeRef.current || !audioCtxRef.current) return;
    const comp = compressorNodeRef.current;
    const t = audioCtxRef.current.currentTime;
    if (isNightMode) {
      comp.threshold.setTargetAtTime(-24, t, 0.05);
      comp.ratio.setTargetAtTime(12, t, 0.05);
    } else {
      comp.threshold.setTargetAtTime(-1, t, 0.05);
      comp.ratio.setTargetAtTime(volumeBoost > 1.0 ? 10 : 1, t, 0.05);
    }
  }, [isNightMode, volumeBoost]);

  // Update Equalizer Bands & Preamp
  useEffect(() => {
    if (!audioCtxRef.current) return;
    const t = audioCtxRef.current.currentTime;

    if (preampGainNodeRef.current) {
      const preampVol = Math.pow(10, (eqEnabled ? preampGain : 0) / 20);
      try {
        preampGainNodeRef.current.gain.setTargetAtTime(preampVol, t, 0.05);
      } catch {
        preampGainNodeRef.current.gain.value = preampVol;
      }
    }

    if (filterNodesRef.current.length > 0) {
      filterNodesRef.current.forEach((filter, idx) => {
        const targetGain = eqEnabled ? (eqBands[idx] || 0) : 0;
        try {
          filter.gain.setTargetAtTime(targetGain, t, 0.05);
        } catch {
          filter.gain.value = targetGain;
        }
      });
    }
  }, [eqEnabled, preampGain, eqBands]);

  // Update Stereo Modes
  useEffect(() => {
    const splitter = splitterNodeRef.current;
    const merger = mergerNodeRef.current;
    if (!splitter || !merger) return;

    try {
      splitter.disconnect();
      if (stereoMode === 'left') {
        splitter.connect(merger, 0, 0); // L -> L
        splitter.connect(merger, 0, 1); // L -> R
      } else if (stereoMode === 'right') {
        splitter.connect(merger, 1, 0); // R -> L
        splitter.connect(merger, 1, 1); // R -> R
      } else if (stereoMode === 'reverse') {
        splitter.connect(merger, 0, 1); // L -> R
        splitter.connect(merger, 1, 0); // R -> L
      } else if (stereoMode === 'mono') {
        // Average L and R
        splitter.connect(merger, 0, 0);
        splitter.connect(merger, 1, 0);
        splitter.connect(merger, 0, 1);
        splitter.connect(merger, 1, 1);
      } else {
        // Normal Stereo
        splitter.connect(merger, 0, 0);
        splitter.connect(merger, 1, 1);
      }
    } catch (e) {
      console.warn('[useAudioProcessor] Stereo mode reconfiguration error:', e);
    }
  }, [stereoMode]);

  const adjustAudioDelay = useCallback((deltaMs: number) => {
    setAudioDelayMs(prev => Math.min(3000, Math.max(-3000, prev + deltaMs)));
  }, []);

  const resetAudioDelay = useCallback(() => {
    setAudioDelayMs(0);
  }, []);

  const toggleNightMode = useCallback(() => {
    setIsNightMode(prev => !prev);
  }, []);

  const setBandGain = useCallback((bandIndex: number, gainDb: number) => {
    setEqBands(prev => {
      const next = [...prev];
      next[bandIndex] = Math.max(-20, Math.min(20, gainDb));
      return next;
    });
    setActivePreset('custom');
  }, []);

  const applyEqPreset = useCallback((presetName: string) => {
    const preset = VLC_EQ_PRESETS[presetName];
    if (preset) {
      setEqBands([...preset.gains]);
      setActivePreset(presetName);
      setEqEnabled(true);
    }
  }, []);

  const resetEq = useCallback(() => {
    setEqBands([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setPreampGain(0);
    setActivePreset('flat');
  }, []);

  return {
    audioDelayMs,
    volumeBoost,
    isNightMode,
    isReady,
    stereoMode,
    eqEnabled,
    preampGain,
    eqBands,
    activePreset,
    setAudioDelayMs,
    adjustAudioDelay,
    resetAudioDelay,
    setVolumeBoost,
    toggleNightMode,
    setStereoMode,
    setEqEnabled,
    setPreampGain,
    setBandGain,
    applyEqPreset,
    resetEq,
    initAudioChain
  };
}
