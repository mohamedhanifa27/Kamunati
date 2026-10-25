import { useState, useEffect, RefObject, useCallback } from 'react';

export interface MediaTrack {
  id: string;
  label: string;
  language?: string;
  kind?: string;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  isBuffering: boolean;
  error: string | null;
  
  audioTracks: MediaTrack[];
  videoTracks: MediaTrack[];
  textTracks: MediaTrack[];
  activeAudioTrack: string | null;
  activeVideoTrack: string | null;
  activeTextTrack: string | null; // null means off
}

export function useVideoPlayer(videoRef: RefObject<HTMLVideoElement | null>, containerRef: RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    playbackRate: 1,
    isBuffering: true,
    error: null,
    audioTracks: [],
    videoTracks: [],
    textTracks: [],
    activeAudioTrack: null,
    activeVideoTrack: null,
    activeTextTrack: null,
  });

  const updateState = useCallback((updates: Partial<VideoPlayerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const syncTracks = useCallback(() => {
    const v = videoRef.current as any;
    if (!v) return;

    const newState: Partial<VideoPlayerState> = {};

    if (v.audioTracks) {
      const aTracks: MediaTrack[] = [];
      let activeA = null;
      for (let i = 0; i < v.audioTracks.length; i++) {
        const t = v.audioTracks[i];
        const tId = t.id || String(i);
        aTracks.push({ id: tId, label: t.label || `Audio Track ${i + 1}`, language: t.language });
        if (t.enabled) activeA = tId;
      }
      newState.audioTracks = aTracks;
      newState.activeAudioTrack = activeA;
    }

    if (v.videoTracks) {
      const vTracks: MediaTrack[] = [];
      let activeV = null;
      for (let i = 0; i < v.videoTracks.length; i++) {
        const t = v.videoTracks[i];
        const tId = t.id || String(i);
        vTracks.push({ id: tId, label: t.label || `Resolution ${i + 1}` });
        if (t.selected) activeV = tId;
      }
      newState.videoTracks = vTracks;
      newState.activeVideoTrack = activeV;
    }

    if (v.textTracks) {
      const tTracks: MediaTrack[] = [];
      let activeT = null;
      for (let i = 0; i < v.textTracks.length; i++) {
        const t = v.textTracks[i];
        const tId = t.id || String(i);
        // Only include actual subtitles/captions, ignore metadata tracks
        if (t.kind !== 'metadata') {
          tTracks.push({ id: tId, label: t.label || `Subtitle ${i + 1}`, language: t.language, kind: t.kind });
          if (t.mode === 'showing') activeT = tId;
        }
      }
      newState.textTracks = tTracks;
      newState.activeTextTrack = activeT;
    }

    updateState(newState);
  }, [videoRef, updateState]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => updateState({ isPlaying: true, isBuffering: false });
    const onPause = () => updateState({ isPlaying: false });
    const onTimeUpdate = () => updateState({ currentTime: video.currentTime });
    const onLoadedMetadata = () => {
      updateState({ duration: video.duration, isBuffering: false });
      syncTracks();
    };
    const onVolumeChange = () => updateState({ volume: video.volume, isMuted: video.muted });
    const onRateChange = () => updateState({ playbackRate: video.playbackRate });

    const onWaiting = () => updateState({ isBuffering: true });
    const onCanPlay = () => {
      updateState({ isBuffering: false });
      syncTracks();
    };
    const onPlaying = () => updateState({ isBuffering: false });
    const onSeeking = () => updateState({ isBuffering: true });
    const onSeeked = () => updateState({ isBuffering: false });
    const onError = () => {
      const err = video.error;
      let msg = "An unknown error occurred.";
      if (err) {
        switch(err.code) {
          case 1: msg = "Playback aborted."; break;
          case 2: msg = "Network error while loading video."; break;
          case 3: msg = "Video decoding failed (codec not supported)."; break;
          case 4: msg = "Media source not supported or failed to load."; break;
        }
      }
      updateState({ error: msg, isBuffering: false });
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('ratechange', onRateChange);
    
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('stalled', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('seeking', onSeeking);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    // Track changes events
    const vAny = video as any;
    if (vAny.audioTracks) vAny.audioTracks.addEventListener('change', syncTracks);
    if (vAny.videoTracks) vAny.videoTracks.addEventListener('change', syncTracks);
    if (vAny.textTracks) vAny.textTracks.addEventListener('change', syncTracks);

    const onFullscreenChange = () => {
      updateState({ isFullscreen: !!document.fullscreenElement });
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('ratechange', onRateChange);
      
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('seeking', onSeeking);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      
      if (vAny.audioTracks) vAny.audioTracks.removeEventListener('change', syncTracks);
      if (vAny.videoTracks) vAny.videoTracks.removeEventListener('change', syncTracks);
      if (vAny.textTracks) vAny.textTracks.removeEventListener('change', syncTracks);

      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [videoRef, updateState, syncTracks]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) video.play().catch(e => console.warn("Play interrupted", e));
      else video.pause();
    }
  }, [videoRef]);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (video) {
      const targetTime = Math.max(0, Math.min(time, video.duration || 0));
      video.currentTime = targetTime;
    }
  }, [videoRef]);

  const setVolume = useCallback((volume: number) => {
    const video = videoRef.current;
    if (video) {
      const vol = Math.max(0, Math.min(1, volume));
      video.volume = vol;
      if (vol > 0 && video.muted) video.muted = false;
    }
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) video.muted = !video.muted;
  }, [videoRef]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen().catch(err => console.error(err));
    } else {
      await document.exitFullscreen().catch(err => console.error(err));
    }
  }, [containerRef]);

  const setPlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
  }, [videoRef]);

  const setAudioTrack = useCallback((id: string) => {
    const v = videoRef.current as any;
    if (v && v.audioTracks) {
      for (let i = 0; i < v.audioTracks.length; i++) {
        const t = v.audioTracks[i];
        t.enabled = ((t.id || String(i)) === id);
      }
      syncTracks();
    }
  }, [videoRef, syncTracks]);

  const setVideoTrack = useCallback((id: string) => {
    const v = videoRef.current as any;
    if (v && v.videoTracks) {
      for (let i = 0; i < v.videoTracks.length; i++) {
        const t = v.videoTracks[i];
        t.selected = ((t.id || String(i)) === id);
      }
      syncTracks();
    }
  }, [videoRef, syncTracks]);

  const setTextTrack = useCallback((id: string | null) => {
    const v = videoRef.current as any;
    if (v && v.textTracks) {
      for (let i = 0; i < v.textTracks.length; i++) {
        const t = v.textTracks[i];
        if (id === null) {
          t.mode = 'hidden';
        } else {
          t.mode = ((t.id || String(i)) === id) ? 'showing' : 'hidden';
        }
      }
      syncTracks();
    }
  }, [videoRef, syncTracks]);

  return {
    state,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    setPlaybackRate,
    setAudioTrack,
    setVideoTrack,
    setTextTrack,
  };
}
