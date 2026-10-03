'use client';

import { useEffect, useState, useRef } from 'react';
import { useAmbient } from '../AmbientProvider';
import { getAverageFrameTime, getMode, RenderMode } from '../engine/quality';
import { getCut } from '../engine/coverage';

export function AmbientDebug() {
  const [show, setShow] = useState(false);
  const [stats, setStats] = useState({ fps: 60, mode: 'live', cut: 0.55 });
  const ambient = useAmbient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('ambientDebug') === '1') {
        setShow(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      const ms = getAverageFrameTime();
      setStats({
        fps: Math.round(1000 / (ms || 16)),
        mode: getMode(),
        cut: getCut()
      });
    }, 500);
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] bg-black/80 text-white font-mono text-xs p-3 rounded border border-white/20 pointer-events-none">
      <div className="font-bold mb-1">Ambient Debug</div>
      <div>FPS: {stats.fps}</div>
      <div>Mode: {stats.mode}</div>
      <div>Cut: {stats.cut.toFixed(3)}</div>
    </div>
  );
}
