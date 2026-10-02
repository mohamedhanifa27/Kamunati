import React, { useRef, useState } from 'react';
import { BufferedRange } from '../../hooks/useSwarmStats';

interface P2PScrubberProps {
  currentTime: number;
  duration: number;
  p2pPieces: BufferedRange[];
  browserBuffered: TimeRanges | null;
  onSeek: (time: number) => void;
}

export default function P2PScrubber({ currentTime, duration, p2pPieces, browserBuffered, onSeek }: P2PScrubberProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number, time: number } | null>(null);

  const calculateTimeFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    if (!barRef.current || duration === 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pos * duration;
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const time = calculateTimeFromEvent(e);
    onSeek(time);

    const onPointerMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!barRef.current || duration === 0) return;
      const rect = barRef.current.getBoundingClientRect();
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(pos * duration);
    };

    const onPointerUp = () => {
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchend', onPointerUp);
    };

    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('touchmove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!barRef.current || duration === 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition({ x: e.clientX - rect.left, time: pos * duration });
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Format time for tooltip
  const formatTime = (time: number) => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Convert TimeRanges to array for rendering browser buffer
  const browserBufferRanges = [];
  if (browserBuffered && duration > 0) {
    for (let i = 0; i < browserBuffered.length; i++) {
      browserBufferRanges.push({
        start: (browserBuffered.start(i) / duration) * 100,
        end: (browserBuffered.end(i) / duration) * 100
      });
    }
  }

  return (
    <div 
      className="relative w-full h-8 flex items-center group cursor-pointer"
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={barRef}
    >
      <div className="absolute left-0 right-0 h-1.5 bg-white/20 rounded-full overflow-hidden transition-all group-hover:h-2">
        {/* P2P Buffer Layer (Deep Purple with low opacity) */}
        {p2pPieces.map((piece, idx) => (
          <div 
            key={`p2p-${idx}`}
            className="absolute top-0 bottom-0 bg-primary/40"
            style={{ left: `${piece.start}%`, width: `${piece.end - piece.start}%` }}
          />
        ))}

        {/* Browser Buffer Layer (White/gray low opacity) */}
        {browserBufferRanges.map((range, idx) => (
          <div 
            key={`browser-${idx}`}
            className="absolute top-0 bottom-0 bg-white/40"
            style={{ left: `${range.start}%`, width: `${range.end - range.start}%` }}
          />
        ))}

        {/* Current Playhead Layer (Primary Color) */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-primary"
          style={{ width: `${currentPercent}%` }}
        />
      </div>

      {/* Scrubber Thumb */}
      <div 
        className="absolute w-4 h-4 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform pointer-events-none"
        style={{ left: `calc(${currentPercent}% - 8px)` }}
      />

      {/* Hover Tooltip */}
      {hoverPosition && duration > 0 && (
        <div 
          className="absolute bottom-6 bg-background/90 text-white text-xs font-semibold px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap border border-white/10"
          style={{ left: hoverPosition.x, transform: 'translateX(-50%)' }}
        >
          {formatTime(hoverPosition.time)}
        </div>
      )}
    </div>
  );
}
