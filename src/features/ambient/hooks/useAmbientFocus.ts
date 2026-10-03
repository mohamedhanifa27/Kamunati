'use client';

/**
 * useAmbientFocus — API for cards and rows to set the focused palette.
 * Hover intent: begins swap after 120ms of hover.
 */
import { useCallback, useRef } from 'react';
import { useAmbient } from '../AmbientProvider';

interface FocusOptions {
  id: string;
  palette: { hex: string; weight: number }[];
  source?: 'hover' | 'carousel' | 'keyboard' | 'hero' | 'detail' | 'admin';
  anchor?: { x: number; y: number };
}

export function useAmbientFocus() {
  const ambient = useAmbient();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeId = useRef<string | null>(null);

  const focus = useCallback((opts: FocusOptions) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      activeId.current = opts.id;
      ambient.focus({
        id: opts.id,
        palette: opts.palette,
        source: opts.source ?? 'hover',
        anchor: opts.anchor,
      });
    }, 120); // hover intent delay
  }, [ambient]);

  const release = useCallback((id: string) => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    ambient.release(id);
    activeId.current = null;
  }, [ambient]);

  return { focus, release };
}
