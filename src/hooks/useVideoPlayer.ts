import { useState, useEffect, RefObject, useCallback } from 'react';

interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
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
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateState = (updates: Partial<VideoPlayerState>) => {
      setState(prev => ({ ...prev, ...updates }));
    };

    const onPlay = () => updateState({ isPlaying: true });
    const onPause = () => updateState({ isPlaying: false });
    const onTimeUpdate = () => updateState({ currentTime: video.currentTime });
    const onLoadedMetadata = () => updateState({ duration: video.duration });
    const onVolumeChange = () => updateState({ volume: video.volume, isMuted: video.muted });
    const onRateChange = () => updateState({ playbackRate: video.playbackRate });

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('ratechange', onRateChange);

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
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [videoRef]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) video.play();
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

  return {
    state,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    setPlaybackRate,
  };
}
