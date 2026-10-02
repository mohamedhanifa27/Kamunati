'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { useSwarmStats } from '../../hooks/useSwarmStats';
import Controls from './Controls';
import SwarmHUD from './SwarmHUD';

interface VideoPlayerProps {
  src: string;
  infoHash?: string;
  mediaId: string;
  title?: string;
}

export default function VideoPlayer({ src, infoHash, mediaId, title }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { state, togglePlay, seek, setVolume, toggleMute, toggleFullscreen } = useVideoPlayer(videoRef, containerRef);
  
  const [showHUD, setShowHUD] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const swarmStats = useSwarmStats(infoHash, showHUD); // only connect SSE if HUD is visible or needed for scrubber

  // Hide controls on idle
  const handleMouseMove = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    
    if (state.isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [state.isPlaying]);

  useEffect(() => {
    handleMouseMove();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [handleMouseMove]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          seek(state.currentTime - 10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          seek(state.currentTime + 10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(state.volume + 0.05);
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(state.volume - 0.05);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'd':
          e.preventDefault();
          setShowHUD(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, togglePlay, seek, setVolume, toggleMute, toggleFullscreen]);

  // Progress Auto-save ping
  useEffect(() => {
    if (!state.isPlaying || state.currentTime === 0) return;

    const ping = () => {
      fetch('/api/v1/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, timestampSec: Math.floor(state.currentTime) }),
      }).catch(() => {});
    };

    const interval = setInterval(ping, 10000);
    return () => {
      clearInterval(interval);
      ping(); // Flush on unmount
    };
  }, [state.isPlaying, state.currentTime, mediaId]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden font-sans ${!controlsVisible && state.isPlaying ? 'cursor-none' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => state.isPlaying && setControlsVisible(false)}
      onClick={togglePlay}
      onDoubleClick={toggleFullscreen}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        crossOrigin="anonymous"
        preload="auto"
        autoPlay
      >
        {/* Placeholder for tracks inserted via useVideoPlayer/utils if dynamic */}
      </video>

      <SwarmHUD stats={swarmStats} visible={showHUD} />

      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${controlsVisible || !state.isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* We block clicks on the overlay from triggering video play/pause so we enable pointer events only on controls */}
        <div className="absolute inset-0 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 pointer-events-auto" onClick={e => e.stopPropagation()}>
          <Controls 
            isPlaying={state.isPlaying}
            currentTime={state.currentTime}
            duration={state.duration}
            volume={state.volume}
            isMuted={state.isMuted}
            isFullscreen={state.isFullscreen}
            p2pPieces={swarmStats?.downloadedPieces || []}
            browserBuffered={videoRef.current?.buffered || null}
            onPlayPause={togglePlay}
            onSeek={seek}
            onVolumeChange={setVolume}
            onMuteToggle={toggleMute}
            onFullscreenToggle={toggleFullscreen}
            onSeekBack={() => seek(state.currentTime - 10)}
            onSeekForward={() => seek(state.currentTime + 10)}
            onToggleSettings={() => {}}
          />
        </div>
      </div>
      
      {/* Custom Global Styles for Subtitles (Native <track> rendering adjustments) */}
      <style dangerouslySetInnerHTML={{__html: `
        ::cue {
          background-color: rgba(0, 0, 0, 0.75);
          color: white;
          font-family: var(--font-main);
          text-shadow: 0px 2px 4px rgba(0,0,0,0.8);
          font-size: 1.25rem;
          padding: 4px 8px;
          border-radius: 4px;
        }
      `}} />
    </div>
  );
}
