import React, { useState, useEffect } from 'react';
import { PlayIcon, InformationCircleIcon, PlusIcon, CheckIcon, StarIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { Link } from 'next-view-transitions';
import { useThemeStore } from '../../store/themeStore';

interface HeroBannerProps {
  mediaId: string;
  title: string;
  overview?: string;
  backdropUrl?: string;
  logoUrl?: string | null;
}

export default function HeroBanner({ mediaId, title, overview, backdropUrl, logoUrl }: HeroBannerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [inList, setInList] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  
  const { motionLevel } = useThemeStore();
  const shouldAnimate = motionLevel === 'standard' || motionLevel === 'expressive';

  useEffect(() => {
    // Check if item is in watchlist (we could do a GET, but skipping for simplicity)
    const fetchRating = async () => {
      try {
        const res = await fetch(`/api/user/rating?mediaId=${mediaId}`);
        if (res.ok) {
          const data = await res.json();
          setRating(data.score);
        }
      } catch (e) {}
    };
    fetchRating();
  }, [mediaId]);

  const handleRate = async (score: number) => {
    try {
      setRating(score);
      await fetch('/api/user/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, score })
      });
    } catch (e) {
      console.error(e);
    }
  };

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
            fetchPriority="high"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {/* Horizontal dark tint: starts deep on left with Title & Description, smoothly fades as it approaches the focus point on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg from-20% via-bg/60 via-50% to-transparent to-85% md:from-15% md:via-bg/40 md:via-40% md:to-70% pointer-events-none" />
        {/* Bottom fade: localized to bottom edge for smooth transition into media rows without darkening the upper focal area */}
        <div className="absolute inset-x-0 bottom-0 h-40 md:h-56 bg-gradient-to-t from-bg via-bg/50 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <motion.div 
        className="relative z-10 px-8 md:px-16 max-w-3xl space-y-6"
        initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        // [RECTIFICATION:IMPROVE_ANIMATIONS] Crisp fluid entrance
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      >
        {/* [RECTIFICATION:PIXEL_FONT_DESCRIPTION_AND_TITLE_LOGO] */}
        {/* Title: render media title logo if available, fallback to title heading */}
        {logoUrl ? (
          <div className="max-w-md md:max-w-lg mb-4">
            <img 
              src={logoUrl} 
              alt={title}
              fetchPriority="high" 
              className="max-h-24 sm:max-h-32 md:max-h-40 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]" 
            />
          </div>
        ) : (
          <h1 className="text-5xl md:text-7xl font-bold text-text line-clamp-2 drop-shadow-lg font-heading">
            {title}
          </h1>
        )}
        
        {/* [RECTIFICATION:PIXEL_FONT_DESCRIPTION_AND_TITLE_LOGO] */}
        {/* Description: render overview with pixel font */}
        {overview && (
          <p className="text-sm md:text-base text-text-muted line-clamp-3 drop-shadow-md max-w-xl font-pixelcode tracking-wide leading-relaxed">
            {overview}
          </p>
        )}
        
        <div className="flex items-center space-x-4 pt-4">
          <Link href={`/watch/${mediaId}`} className="flex items-center space-x-2 btn-live-gradient px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:scale-105 active:scale-95 text-white">
            <PlayIcon className="w-6 h-6" />
            <span>Play</span>
          </Link>
          
          
          
          <button className="flex items-center space-x-2 bg-surface/50 hover:bg-surface-raised active:scale-95 text-text px-6 py-3 rounded-md font-semibold backdrop-blur-sm transition-all border border-border/50">
            <InformationCircleIcon className="w-6 h-6" />
            <span>More Info</span>
          </button>
          
          <div className="flex items-center space-x-1 pl-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button 
                key={star} 
                onClick={() => handleRate(star)}
                className="focus:outline-none"
              >
                <StarIcon className={`w-8 h-8 transition-colors ${rating && rating >= star ? 'text-warning' : 'text-text-muted hover:text-warning/70'}`} />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
