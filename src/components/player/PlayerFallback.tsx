'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCcw, Search } from 'lucide-react';
import { SwarmStats } from '../../hooks/useSwarmStats';

interface PlayerFallbackProps {
  stats: SwarmStats | null;
  isPlaying: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onRetry: () => void;
  onSwitchSource?: () => void;
}

export default function PlayerFallback({ stats, isPlaying, videoRef, onRetry, onSwitchSource }: PlayerFallbackProps) {
  const [isStalled, setIsStalled] = useState(false);

  useEffect(() => {
    if (!isPlaying) {
      setIsStalled(false);
      return;
    }

    let stalledTimer: NodeJS.Timeout;

    // Check if network is dead (0 seeders and 0 speed)
    const isNetworkDead = stats && stats.seeders === 0 && stats.downloadSpeed === '0 B/s';
    
    // Check if video is waiting for buffer
    const video = videoRef.current;
    const isWaiting = video && video.readyState < 3; // HAVE_FUTURE_DATA

    if (isNetworkDead || isWaiting) {
      // Wait 30 seconds of persistent stalled state before showing the error overlay
      stalledTimer = setTimeout(() => {
        setIsStalled(true);
        if (video) video.pause();
      }, 30000);
    } else {
      setIsStalled(false);
    }

    return () => clearTimeout(stalledTimer);
  }, [stats, isPlaying, videoRef]);

  if (!isStalled) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="max-w-md w-full flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative">
          <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping opacity-20" />
          <WifiOff size={40} className="text-white/50" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Swarm Unresponsive</h2>
        
        <p className="text-white/60 mb-8 text-sm leading-relaxed">
          Unable to connect to active peers or seeders for this torrent. The network might be dead or there are zero seeders online right now. Try switching sources or check back later.
        </p>

        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={() => {
              setIsStalled(false);
              onRetry();
            }}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} /> Retry Connection
          </button>
          
          {onSwitchSource && (
            <button 
              onClick={onSwitchSource}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Search size={18} /> Switch Source / Resolution
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
