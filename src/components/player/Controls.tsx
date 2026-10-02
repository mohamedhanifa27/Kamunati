import React from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings, Captions } from 'lucide-react';
import P2PScrubber from './P2PScrubber';
import { BufferedRange } from '../../hooks/useSwarmStats';

interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  p2pPieces: BufferedRange[];
  browserBuffered: TimeRanges | null;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onSeekBack: () => void;
  onSeekForward: () => void;
  onToggleSettings: () => void;
}

export default function Controls({
  isPlaying, currentTime, duration, volume, isMuted, isFullscreen, p2pPieces, browserBuffered,
  onPlayPause, onSeek, onVolumeChange, onMuteToggle, onFullscreenToggle, onSeekBack, onSeekForward, onToggleSettings
}: ControlsProps) {

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 transition-opacity duration-300">
      
      <P2PScrubber 
        currentTime={currentTime} 
        duration={duration} 
        p2pPieces={p2pPieces} 
        browserBuffered={browserBuffered}
        onSeek={onSeek}
      />

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center space-x-6">
          <button onClick={onPlayPause} className="text-white hover:text-primary transition-colors focus:outline-none">
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
          </button>

          <button onClick={onSeekBack} className="text-white/80 hover:text-white transition-colors focus:outline-none hidden sm:block">
            <SkipBack size={24} />
          </button>
          
          <button onClick={onSeekForward} className="text-white/80 hover:text-white transition-colors focus:outline-none hidden sm:block">
            <SkipForward size={24} />
          </button>

          <div className="flex items-center space-x-2 group relative">
            <button onClick={onMuteToggle} className="text-white hover:text-primary transition-colors focus:outline-none">
              {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 ease-out flex items-center h-full">
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          <span className="text-white/90 text-sm font-medium tracking-wide">
            {formatTime(currentTime)} <span className="text-white/40 mx-1">/</span> {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <button onClick={onToggleSettings} className="text-white/80 hover:text-white transition-colors focus:outline-none" title="Subtitles & Audio">
            <Captions size={24} />
          </button>

          <button onClick={onToggleSettings} className="text-white/80 hover:text-white transition-colors focus:outline-none" title="Settings">
            <Settings size={24} />
          </button>

          <button onClick={onFullscreenToggle} className="text-white hover:text-primary transition-colors focus:outline-none">
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
}
