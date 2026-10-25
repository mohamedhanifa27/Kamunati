"use client";

import { useState, useCallback } from 'react';

export type AspectRatioOption = 'default' | '16:9' | '4:3' | 'fill' | '2.35:1';

export function useAspectRatio() {
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('default');

  const getVideoStyle = useCallback((): React.CSSProperties => {
    switch (aspectRatio) {
      case 'fill':
        return { objectFit: 'fill', width: '100%', height: '100%' };
      case '16:9':
        return { objectFit: 'cover', aspectRatio: '16/9', maxHeight: '100%' };
      case '4:3':
        return { objectFit: 'cover', aspectRatio: '4/3', maxHeight: '100%' };
      case '2.35:1':
        return { objectFit: 'cover', aspectRatio: '2.35/1', maxHeight: '100%' };
      case 'default':
      default:
        return { objectFit: 'contain', width: '100%', height: '100%' };
    }
  }, [aspectRatio]);

  return {
    aspectRatio,
    setAspectRatio,
    getVideoStyle
  };
}
