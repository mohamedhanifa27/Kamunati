"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

export interface ABLoopState {
  pointA: number | null;
  pointB: number | null;
  isActive: boolean;
}

export function usePlaybackControls(videoRef: React.RefObject<HTMLVideoElement | null>, fps: number = 24) {
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [abLoop, setAbLoop] = useState<ABLoopState>({
    pointA: null,
    pointB: null,
    isActive: false
  });

  const abLoopRef = useRef(abLoop);
  abLoopRef.current = abLoop;

  // Set playback speed
  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, [videoRef]);

  // Frame step forward (E)
  const stepFrameForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) video.pause();
    const frameDuration = 1 / (fps || 24);
    video.currentTime = Math.min(video.duration || Infinity, video.currentTime + frameDuration);
  }, [videoRef, fps]);

  // Frame step backward (Shift+E)
  const stepFrameBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) video.pause();
    const frameDuration = 1 / (fps || 24);
    video.currentTime = Math.max(0, video.currentTime - frameDuration);
  }, [videoRef, fps]);

  // Set Point A
  const setPointA = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setAbLoop(prev => ({
      ...prev,
      pointA: video.currentTime,
      isActive: prev.pointB !== null && prev.pointB > video.currentTime
    }));
  }, [videoRef]);

  // Set Point B
  const setPointB = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const cur = video.currentTime;
    setAbLoop(prev => {
      if (prev.pointA !== null && cur > prev.pointA) {
        return {
          pointA: prev.pointA,
          pointB: cur,
          isActive: true
        };
      }
      return {
        ...prev,
        pointB: cur,
        isActive: false
      };
    });
  }, [videoRef]);

  // Clear A-B Loop
  const clearLoop = useCallback(() => {
    setAbLoop({
      pointA: null,
      pointB: null,
      isActive: false
    });
  }, []);

  // Jump to specific time
  const jumpToTime = useCallback((timeInSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.max(0, Math.min(video.duration || Infinity, timeInSeconds));
    video.currentTime = target;
  }, [videoRef]);

  // Handle loop check on timeupdate
  const checkLoop = useCallback((currentTime: number) => {
    const loop = abLoopRef.current;
    if (loop.isActive && loop.pointA !== null && loop.pointB !== null) {
      if (currentTime >= loop.pointB || currentTime < loop.pointA - 0.5) {
        if (videoRef.current) {
          videoRef.current.currentTime = loop.pointA;
        }
      }
    }
  }, [videoRef]);

  return {
    playbackRate,
    setPlaybackRate,
    stepFrameForward,
    stepFrameBackward,
    abLoop,
    setPointA,
    setPointB,
    clearLoop,
    jumpToTime,
    checkLoop
  };
}
