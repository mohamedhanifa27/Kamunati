import React, { useRef, useState, useEffect } from 'react';
import { BufferedRange } from '../../hooks/useSwarmStats';
import { HaloProgress } from '../ui/halo-progress';

interface P2PScrubberProps {
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  p2pPieces: BufferedRange[];
  browserBuffered: TimeRanges | null;
  onSeek: (time: number) => void;
}

export default function P2PScrubber({ currentTime, duration, isBuffering, p2pPieces, browserBuffered, onSeek }: P2PScrubberProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number, time: number } | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const calculateTimeFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    if (!barRef.current || duration === 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pos * duration;
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const time = calculateTimeFromEvent(e);
    setIsScrubbing(true);
    setScrubTime(time);
    onSeek(time);

    const onPointerMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!barRef.current || duration === 0) return;
      const rect = barRef.current.getBoundingClientRect();
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = pos * duration;
      setScrubTime(newTime);
      onSeek(newTime);
    };

    const onPointerUp = () => {
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchend', onPointerUp);
      setIsScrubbing(false);
      // Wait a moment before clearing scrubTime so the bar doesn't snap back before video timeupdate fires
      setTimeout(() => setScrubTime(null), 500);
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

  const displayTime = isScrubbing && scrubTime !== null ? scrubTime : (scrubTime !== null ? scrubTime : currentTime);
  const progressValue = duration > 0 ? (displayTime / duration) * 100 : 0;
  
  const isIndeterminate = isBuffering || duration === 0 || !isFinite(duration);
  const finalValue = isIndeterminate ? null : progressValue;

  // Format time for tooltip
  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const browserBufferRanges = [];
  if (browserBuffered && duration > 0 && isFinite(duration)) {
    for (let i = 0; i < browserBuffered.length; i++) {
      browserBufferRanges.push({
        start: (browserBuffered.start(i) / duration) * 100,
        end: (browserBuffered.end(i) / duration) * 100
      });
    }
  }

  return (
    <div className="relative w-full h-8 flex items-center group cursor-pointer" ref={barRef}>
      {/* Interaction layer */}
      <div 
        className="absolute inset-x-0 -top-2 -bottom-2 z-20"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, duration || 0)}
        aria-valuenow={displayTime}
        aria-valuetext={`${formatTime(displayTime)} of ${formatTime(duration)}`}
        tabIndex={0}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none">
        {/* Buffered Layer (behind the fill) */}
        <div className="absolute inset-0 z-10 rounded-full overflow-hidden opacity-30 mix-blend-screen pointer-events-none">
          {p2pPieces.map((piece, idx) => (
            <div 
              key={`p2p-${idx}`}
              className="absolute top-0 bottom-0 bg-[#818cf8]"
              style={{ left: `${piece.start}%`, width: `${piece.end - piece.start}%` }}
            />
          ))}
          {browserBufferRanges.map((range, idx) => (
            <div 
              key={`browser-${idx}`}
              className="absolute top-0 bottom-0 bg-white"
              style={{ left: `${range.start}%`, width: `${range.end - range.start}%` }}
            />
          ))}
        </div>

        <HaloProgress 
          value={finalValue} 
          className="min-w-0" 
          trackClassName="bg-transparent border-transparent"
        />
      </div>

      {/* Hover Tooltip */}
      {hoverPosition && duration > 0 && (
        <div 
          className="absolute bottom-8 bg-black/90 text-white text-xs font-semibold px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap border border-white/10 z-30"
          style={{ left: hoverPosition.x, transform: 'translateX(-50%)' }}
        >
          {formatTime(hoverPosition.time)}
        </div>
      )}
    </div>
  );
}
