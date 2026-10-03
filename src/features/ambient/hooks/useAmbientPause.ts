'use client';

/**
 * useAmbientPause — pause the ambient when a heavy page is mounted (watch page).
 * Call in useEffect with no deps: pauses on mount, resumes on unmount.
 */
import { useEffect } from 'react';
import { useAmbient } from '../AmbientProvider';

export function useAmbientPause() {
  const ambient = useAmbient();
  useEffect(() => {
    ambient.pause();
    return () => {
      ambient.resume();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
