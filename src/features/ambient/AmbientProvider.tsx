'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { AmbientEngine, AmbientMode } from './engine/AmbientEngine';
import { PaletteColour, makePaletteColour } from './engine/palette';

interface FocusRequest {
  id: string;
  palette: { hex: string; weight: number }[];
  anchor?: { x: number; y: number };
  source: 'hover' | 'carousel' | 'keyboard' | 'hero' | 'detail' | 'admin';
}

interface AmbientContextValue {
  focus(req: FocusRequest): void;
  release(id: string): void;
  releaseAll(): void;
  setMode(mode: AmbientMode): void;
  pause(): void;
  resume(): void;
}

const noop = () => {};
const AmbientContext = createContext<AmbientContextValue>({
  focus: noop,
  release: noop,
  releaseAll: noop,
  setMode: noop,
  pause: noop,
  resume: noop,
});

export function useAmbient(): AmbientContextValue {
  return useContext(AmbientContext);
}

interface AmbientProviderProps {
  children: React.ReactNode;
  enabled: boolean;
}

export function AmbientProvider({ children, enabled }: AmbientProviderProps) {
  const engineRef = useRef<AmbientEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Create the fixed canvas once
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: var(--z-ambient, -1);
      background: #000;
    `;
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    canvasRef.current = canvas;

    const engine = new AmbientEngine(canvas);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
      canvas.remove();
      canvasRef.current = null;
    };
  }, [enabled]);

  const ctx: AmbientContextValue = {
    focus(req) {
      const engine = engineRef.current;
      if (!engine) return;
      const palette: PaletteColour[] = req.palette.map((c) =>
        makePaletteColour(c.hex, c.weight),
      );
      engine.focus(req.id, palette);
    },
    release(id) {
      engineRef.current?.release(id);
    },
    releaseAll() {
      engineRef.current?.releaseAll();
    },
    setMode(mode) {
      engineRef.current?.setMode(mode);
    },
    pause() {
      engineRef.current?.pause();
    },
    resume() {
      engineRef.current?.resume();
    },
  };

  return (
    <AmbientContext.Provider value={ctx}>
      {children}
    </AmbientContext.Provider>
  );
}
