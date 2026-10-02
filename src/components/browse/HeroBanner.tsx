import React, { useState, useEffect } from 'react';
import { PlayIcon, InformationCircleIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useThemeStore } from '../../store/themeStore';

interface HeroBannerProps {
  mediaId: string;
  title: string;
  overview?: string;
  backdropUrl?: string;
}

export default function HeroBanner({ mediaId, title, overview, backdropUrl }: HeroBannerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [inList, setInList] = useState(false);
  
  const { motionLevel } = useThemeStore();
  const shouldAnimate = motionLevel === 'standard' || motionLevel === 'expressive';

  useEffect(() => {
    // Check if item is in watchlist (we could do a GET, but skipping for simplicity)
  }, [mediaId]);

  const toggleList = async () => {
    try {
      const res = await fetch('/api/user/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId })
      });
      if (res.ok) {
        const data = await res.json();
        setInList(data.action === 'added');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative w-full h-[85vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 bg-bg">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-surface-raised animate-pulse" />
        )}
        {backdropUrl && (
          <img 
            src={backdropUrl} 
            alt={title}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
      </div>

      {/* Content */}
      <motion.div 
        className="relative z-10 px-8 md:px-16 max-w-3xl space-y-6"
        initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1 className="text-5xl md:text-7xl font-bold text-text line-clamp-2 drop-shadow-lg font-heading">
          {title}
        </h1>
        
        {overview && (
          <p className="text-lg md:text-xl text-text-muted line-clamp-3 drop-shadow-md max-w-xl font-body">
            {overview}
          </p>
        )}
        
        <div className="flex items-center space-x-4 pt-4">
          <Link href={`/watch/${mediaId}`} className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-text-on-primary px-8 py-3 rounded-md font-semibold transition-colors shadow-lg">
            <PlayIcon className="w-6 h-6" />
            <span>Play</span>
          </Link>
          
          <button onClick={toggleList} className="flex items-center space-x-2 bg-surface hover:bg-surface-raised text-text px-6 py-3 rounded-md font-semibold transition-colors shadow-lg border border-border">
            {inList ? <CheckIcon className="w-6 h-6" /> : <PlusIcon className="w-6 h-6" />}
            <span>My List</span>
          </button>
          
          <button className="flex items-center space-x-2 bg-surface/50 hover:bg-surface-raised text-text px-6 py-3 rounded-md font-semibold backdrop-blur-sm transition-colors border border-border/50">
            <InformationCircleIcon className="w-6 h-6" />
            <span>More Info</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
