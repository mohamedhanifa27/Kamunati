import React from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings, Captions } from 'lucide-react';
import P2PScrubber from './P2PScrubber';
import { TimerRoot, TimerDisplay } from '../ui/timer';
import { BufferedRange } from '../../hooks/useSwarmStats';

interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isBuffering: boolean;
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
  isPlaying, currentTime, duration, volume, isMuted, isFullscreen, isBuffering, p2pPieces, browserBuffered,
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
    <div className="absolute bottom-0 left-0 right-0 px-4 pb-2 pt-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col transition-opacity duration-300">
      
      <P2PScrubber 
        currentTime={currentTime} 
        duration={duration} 
        isBuffering={isBuffering}
        p2pPieces={p2pPieces} 
        browserBuffered={browserBuffered}
        onSeek={onSeek}
      />

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center space-x-4">
          <button onClick={onPlayPause} className="text-white hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none hover:drop-shadow-[0_0_8px_rgba(80,26,150,0.5)]">
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
          
          <button onClick={onSeekForward} className="text-white/90 hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none hidden sm:block hover:drop-shadow-[0_0_8px_rgba(80,26,150,0.5)]">
            <SkipForward size={20} />
          </button>

          <div className="flex items-center space-x-2 group relative">
            <button onClick={onMuteToggle} className="text-white hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none hover:drop-shadow-[0_0_8px_rgba(80,26,150,0.5)]">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="w-0 overflow-hidden group-hover:w-20 transition-all duration-300 ease-out flex items-center h-full">
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-1 pl-2">
            <span className="text-white text-sm font-medium">{formatTime(currentTime)}</span>
            <span className="text-white/60 text-sm">/</span>
            <span className="text-white/60 text-sm">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-5">
          <button onClick={onToggleSettings} className="text-white/90 hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none hover:drop-shadow-[0_0_8px_rgba(80,26,150,0.5)]" title="Subtitles & Audio">
            <Captions size={20} />
          </button>

          <button onClick={onToggleSettings} className="text-white/90 hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none hover:drop-shadow-[0_0_8px_rgba(80,26,150,0.5)]" title="Settings">
            <Settings size={20} />
          </button>

          <button onClick={onFullscreenToggle} className="text-white/90 hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none hover:drop-shadow-[0_0_8px_rgba(80,26,150,0.5)]">
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
