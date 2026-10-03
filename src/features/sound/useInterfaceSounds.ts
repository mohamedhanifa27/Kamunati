'use client';

import { useEffect, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { setVolume, playTick } from './SoundEngine';
import { usePathname } from 'next/navigation';

export function useInterfaceSounds() {
  const prefs = useThemeStore(s => s.sounds);
  const pathname = usePathname();

  const isEnabled = prefs?.enabled ?? true;
  const vol = prefs?.volume ?? 0.35;
  const isWatchPage = pathname?.startsWith('/watch/');

  useEffect(() => {
    setVolume(vol, isEnabled && !isWatchPage);
  }, [vol, isEnabled, isWatchPage]);

  const tickHover = useCallback((index: number) => {
    if (!isEnabled || !prefs?.onHover || isWatchPage) return;
    playTick(index, false);
  }, [isEnabled, prefs?.onHover, isWatchPage]);

  const tickScroll = useCallback((index: number) => {
    if (!isEnabled || !prefs?.onScroll || isWatchPage) return;
    playTick(index, true);
  }, [isEnabled, prefs?.onScroll, isWatchPage]);

  const hapticSnap = useCallback(() => {
    if (!isEnabled || !prefs?.haptics || isWatchPage) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(4); } catch (e) {} // ignore feature-detect errors
    }
  }, [isEnabled, prefs?.haptics, isWatchPage]);

  return { tickHover, tickScroll, hapticSnap };
}
