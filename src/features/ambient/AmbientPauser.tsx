'use client';

import { useAmbientPause } from './hooks/useAmbientPause';

export function AmbientPauser() {
  useAmbientPause();
  return null;
}
