'use client';

import { useEffect } from 'react';
import { useAmbient } from './AmbientProvider';
import { useThemeStore } from '../../store/themeStore';

export function AmbientSync() {
  const ambient = useAmbient();
  const mode = useThemeStore(state => state.ambient?.mode || 'live');
  const reducedMotion = useThemeStore(state => state.motionLevel === 'off' || state.motionLevel === 'minimal');

  useEffect(() => {
    // If user has motion disabled, force calm or static mode
    if (reducedMotion && mode === 'live') {
      ambient.setMode('calm');
    } else {
      ambient.setMode(mode as any);
    }
  }, [ambient, mode, reducedMotion]);

  return null;
}
