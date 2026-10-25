// [RECTIFICATION:BLURRED_LOADING_SCREEN]
import React from 'react';
import { CloudIntroLogo } from '../components/ui/CloudIntroLogo';

export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[999] min-h-screen w-full flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        background: 'radial-gradient(circle at center, rgba(80, 26, 150, 0.22) 0%, rgba(16, 138, 194, 0.12) 45%, rgba(10, 10, 16, 0.45) 85%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      }}
    >
      {/* Ambient floating glow behind loading projector */}
      <div 
        aria-hidden="true" 
        className="absolute w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none animate-pulse" 
      />

      <div className="relative z-10 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
        <div className="il play drop-shadow-[0_0_35px_rgba(120,50,220,0.55)]" data-play="">
          <CloudIntroLogo size={130} />
        </div>
      </div>
    </div>
  );
}
