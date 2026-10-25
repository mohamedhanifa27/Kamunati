// [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES]
"use client";

import { useState, useCallback, useMemo } from 'react';

export type AspectRatioOption = 'default' | '16:9' | '4:3' | '2.35:1' | '1:1' | 'fill';
export type ZoomLevel = 1 | 1.25 | 1.5 | 2;

export interface VideoFilterState {
  brightness: number;   // 0 to 200% (default 100)
  contrast: number;     // 0 to 200% (default 100)
  saturation: number;   // 0 to 200% (default 100)
  gamma: number;        // 0.5 to 2.0 (default 1.0)
  hue: number;          // -180 to 180 deg (default 0)
  invert: boolean;      // default false
  rotation: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
  zoom: ZoomLevel;
  aspectRatio: AspectRatioOption;
}

export function useVideoFilters(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [gamma, setGamma] = useState<number>(1.0);
  const [hue, setHue] = useState<number>(0);
  const [invert, setInvert] = useState<boolean>(false);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [flipVertical, setFlipVertical] = useState<boolean>(false);
  const [zoom, setZoom] = useState<ZoomLevel>(1);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('default');

  // Compute CSS filter string matching VLC Video Adjustments
  const filterStyle = useMemo(() => {
    const parts: string[] = [];
    if (brightness !== 100) parts.push(`brightness(${brightness / 100})`);
    if (contrast !== 100) parts.push(`contrast(${contrast / 100})`);
    if (saturation !== 100) parts.push(`saturate(${saturation / 100})`);
    if (hue !== 0) parts.push(`hue-rotate(${hue}deg)`);
    if (invert) parts.push(`invert(100%)`);
    // Approximate gamma via contrast / brightness curve if non-default
    if (gamma !== 1.0) {
      const gFactor = Math.max(0.2, Math.min(3, 1 / gamma));
      parts.push(`brightness(${gFactor})`);
    }
    return parts.length > 0 ? parts.join(' ') : 'none';
  }, [brightness, contrast, saturation, hue, invert, gamma]);

  // Compute CSS transform string matching VLC Video Geometry
  const transformStyle = useMemo(() => {
    const transforms: string[] = [];
    if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
    if (flipHorizontal) transforms.push('scaleX(-1)');
    if (flipVertical) transforms.push('scaleY(-1)');
    if (zoom !== 1) transforms.push(`scale(${zoom})`);
    return transforms.length > 0 ? transforms.join(' ') : 'none';
  }, [rotation, flipHorizontal, flipVertical, zoom]);

  // Compute Object-Fit / Aspect Ratio styling
  const aspectStyle = useMemo((): React.CSSProperties => {
    switch (aspectRatio) {
      case 'fill':
        return { objectFit: 'fill', width: '100%', height: '100%' };
      case '16:9':
        return { objectFit: 'cover', aspectRatio: '16/9', maxHeight: '100%' };
      case '4:3':
        return { objectFit: 'cover', aspectRatio: '4/3', maxHeight: '100%' };
      case '2.35:1':
        return { objectFit: 'cover', aspectRatio: '2.35/1', maxHeight: '100%' };
      case '1:1':
        return { objectFit: 'cover', aspectRatio: '1/1', maxHeight: '100%' };
      case 'default':
      default:
        return { objectFit: 'contain', width: '100%', height: '100%' };
    }
  }, [aspectRatio]);

  // Combined CSS properties for the <video> element
  const combinedVideoStyle = useMemo((): React.CSSProperties => {
    return {
      ...aspectStyle,
      filter: filterStyle,
      transform: transformStyle,
      transformOrigin: 'center center',
      transition: 'filter 0.15s ease-out, transform 0.2s ease-out'
    };
  }, [aspectStyle, filterStyle, transformStyle]);

  // VLC Cycle Aspect Ratio ('a' key)
  const cycleAspectRatio = useCallback((): AspectRatioOption => {
    const sequence: AspectRatioOption[] = ['default', '16:9', '4:3', '2.35:1', '1:1', 'fill'];
    let nextOption: AspectRatioOption = 'default';
    setAspectRatio(current => {
      const idx = sequence.indexOf(current);
      nextOption = sequence[(idx + 1) % sequence.length];
      return nextOption;
    });
    return nextOption;
  }, []);

  // VLC Cycle Zoom ('z' key)
  const cycleZoom = useCallback((): ZoomLevel => {
    const zoomLevels: ZoomLevel[] = [1, 1.25, 1.5, 2];
    let nextZoom: ZoomLevel = 1;
    setZoom(current => {
      const idx = zoomLevels.indexOf(current);
      nextZoom = zoomLevels[(idx + 1) % zoomLevels.length];
      return nextZoom;
    });
    return nextZoom;
  }, []);

  // VLC Rotate 90 degrees clockwise
  const rotateClockwise = useCallback(() => {
    setRotation(current => ((current + 90) % 360) as (0 | 90 | 180 | 270));
  }, []);

  // Reset all video adjustments
  const resetVideoFilters = useCallback(() => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setGamma(1.0);
    setHue(0);
    setInvert(false);
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setZoom(1);
    setAspectRatio('default');
  }, []);

  // VLC Snapshot / Video Screenshot (Shift+S)
  const takeSnapshot = useCallback((title: string = 'media'): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) return resolve(null);

      try {
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        // Apply active color filters to snapshot
        if (filterStyle !== 'none') {
          ctx.filter = filterStyle;
        }

        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png');

        const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
        const timestamp = Math.floor(video.currentTime);
        const filename = `kamunati_${cleanTitle}_${timestamp}s.png`;

        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        resolve(filename);
      } catch (err) {
        console.warn('[useVideoFilters] Snapshot failed:', err);
        resolve(null);
      }
    });
  }, [videoRef, filterStyle]);

  return {
    brightness,
    contrast,
    saturation,
    gamma,
    hue,
    invert,
    rotation,
    flipHorizontal,
    flipVertical,
    zoom,
    aspectRatio,
    combinedVideoStyle,
    setBrightness,
    setContrast,
    setSaturation,
    setGamma,
    setHue,
    setInvert,
    setRotation,
    setFlipHorizontal,
    setFlipVertical,
    setZoom,
    setAspectRatio,
    cycleAspectRatio,
    cycleZoom,
    rotateClockwise,
    resetVideoFilters,
    takeSnapshot
  };
}
