'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';
import { PlayIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface HeroBannerProps {
  title: string;
  overview: string;
  backdropUrl: string;
  logoUrl?: string;
  mediaId: string;
}

export default function HeroBanner({ title, overview, backdropUrl, logoUrl, mediaId }: HeroBannerProps) {
  const { animationLevel } = useThemeStore();
  const shouldAnimate = animationLevel === 'high';

  return (
    <div className="relative w-full h-[80vh] min-h-[600px] flex items-center">
      <div className="absolute inset-0 z-0">
        <img src={backdropUrl} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      </div>

      <motion.div 
        className="relative z-10 max-w-2xl px-8 md:px-16 space-y-6"
        initial={shouldAnimate ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={title} className="w-full max-w-[400px] object-contain" />
        ) : (
          <h1 className="text-5xl md:text-7xl font-bold text-text-main line-clamp-2 drop-shadow-lg">
            {title}
          </h1>
        )}
        
        <p className="text-lg md:text-xl text-text-main/90 line-clamp-3 drop-shadow-md max-w-xl">
          {overview}
        </p>
        
        <div className="flex items-center space-x-4 pt-4">
          <button className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-text-main px-8 py-3 rounded font-semibold transition-colors shadow-lg">
            <PlayIcon className="w-6 h-6 text-text-main" />
            <span>Play</span>
          </button>
          
          <button className="flex items-center space-x-2 bg-black/50 hover:bg-black/70 text-text-main px-8 py-3 rounded font-semibold backdrop-blur-sm transition-colors border border-white/20">
            <InformationCircleIcon className="w-6 h-6 text-text-main" />
            <span>More Info</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
