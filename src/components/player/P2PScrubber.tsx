import React, { useRef, useState, useEffect } from 'react';
import { BufferedRange } from '../../hooks/useSwarmStats';

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
  const [isHovered, setIsHovered] = useState(false);

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
  const finalValue = isIndeterminate ? 0 : progressValue;

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
    <div 
      className="relative w-full h-8 flex flex-col justify-end group cursor-pointer -mt-4 pb-2" 
      ref={barRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); handleMouseLeave(); }}
    >
      {/* Interaction layer */}
      <div 
        className="absolute inset-x-0 bottom-0 h-10 z-20"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, duration || 0)}
        aria-valuenow={displayTime}
        tabIndex={0}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onMouseMove={handleMouseMove}
      />

      {/* The visible timeline bar container */}
      <div className={`relative w-full bg-white/20 transition-all duration-150 ease-out flex items-center ${isHovered || isScrubbing ? 'h-1.5 rounded-sm' : 'h-1 rounded-sm'}`}>
        
        {/* P2P Buffer */}
        <div className="absolute inset-y-0 left-0 right-0 z-0 overflow-hidden pointer-events-none rounded-sm">
          {p2pPieces.map((piece, idx) => (
            <div 
              key={`p2p-${idx}`}
              className="absolute top-0 bottom-0 bg-white/10"
              style={{ left: `${piece.start}%`, width: `${piece.end - piece.start}%` }}
            />
          ))}
          {browserBufferRanges.map((range, idx) => (
            <div 
              key={`browser-${idx}`}
              className="absolute top-0 bottom-0 bg-white/40 backdrop-blur-sm"
              style={{ left: `${range.start}%`, width: `${range.end - range.start}%` }}
            />
          ))}
        </div>

        {/* Progress Gradient with Frosted Accent */}
        <div 
          className="absolute inset-y-0 left-0 z-10 rounded-sm bg-gradient-to-r from-[#501A96] to-[#108AC2] backdrop-blur-md shadow-[0_0_8px_rgba(16,138,194,0.4)]"
          style={{ width: `${finalValue}%` }}
        >
          {/* Thumb */}
          <div 
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg transition-transform duration-150 ${(isHovered || isScrubbing) && !isIndeterminate ? 'scale-100' : 'scale-0'}`}
          />
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoverPosition && duration > 0 && (
        <div 
          className="absolute bottom-8 bg-black text-white text-xs font-semibold px-2 py-1 rounded-md shadow-md border border-white/10 pointer-events-none z-30"
          style={{ left: hoverPosition.x, transform: 'translateX(-50%)' }}
        >
          {formatTime(hoverPosition.time)}
        </div>
      )}
    </div>
  );
}
