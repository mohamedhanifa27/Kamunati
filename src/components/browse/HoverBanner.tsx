'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
// @ts-ignore
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { PlayIcon, PlusIcon, InfoIcon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { Link } from 'next-view-transitions';

interface HoverBannerProps {
  anchorElement: HTMLElement;
  media: {
    id: string;
    title: string;
    hoverBannerUrl?: string;
    hoverClipUrl?: string;
    backdropUrl?: string;
    posterUrl?: string;
    hoverTagline?: string;
    ambientPalette?: { hex: string; weight: number }[];
    metadata?: {
      category?: string | null;
      year?: number | null;
      rating?: number | null;
      runtime?: number | null;
      genres?: string[];
    };
  };
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onClose: () => void;
}

export function HoverBanner({ anchorElement, media, onPointerEnter, onPointerLeave, onClose }: HoverBannerProps) {
  const { motionLevel, autoplayPreviews } = useThemeStore();
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320 });
  const [videoLoaded, setVideoLoaded] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  
  // Calculate position once on mount
  useEffect(() => {
    const rect = anchorElement.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Target width: 1.5x card width, clamped between 300 and 420
    let targetWidth = Math.max(300, Math.min(420, rect.width * 1.5));
    
    let left = rect.left + scrollX + (rect.width / 2) - (targetWidth / 2);
    // Clamp horizontally
    if (left < 20) left = 20;
    if (left + targetWidth > window.innerWidth - 20) left = window.innerWidth - targetWidth - 20;
    
    // Estimate height
    const estHeight = (targetWidth * (9/16)) + 140; // 16:9 media + text area
    let top = rect.top + scrollY - 20; // default anchor slightly above card
    
    // Flip vertical if it goes off bottom edge, unless it would go off top edge
    if (rect.top + estHeight > window.innerHeight && rect.top - estHeight > 0) {
      top = rect.bottom + scrollY - estHeight + 20;
    }
    
    setPosition({ top, left, width: targetWidth });
  }, [anchorElement]);

  // Handle escape and scroll to close
  useEffect(() => {
    const initialScroll = window.scrollY;
    
    const handleScroll = () => {
      if (Math.abs(window.scrollY - initialScroll) > 40) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Motion variants
  const variants = useMemo(() => {
    const rect = anchorElement.getBoundingClientRect();
    const originY = (rect.top - position.top) + (rect.height / 2);
    const originX = (rect.left - position.left) + (rect.width / 2);
    
    if (motionLevel === 'off') {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0 } },
        exit: { opacity: 0, transition: { duration: 0 } }
      };
    } else if (motionLevel === 'minimal') {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.15 } }
      };
    } else if (motionLevel === 'standard') {
      return {
        hidden: { opacity: 0, scale: 0.96, transformOrigin: `${originX}px ${originY}px` },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' as any } },
        exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } }
      };
    } else {
      // expressive
      return {
        hidden: { opacity: 0, scale: 0.9, transformOrigin: `${originX}px ${originY}px` },
        visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } as any },
        exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } }
      };
    }
  }, [motionLevel, position, anchorElement]);

  const glowColor = media.ambientPalette?.[0]?.hex || '255 255 255';
  const imgUrl = media.hoverBannerUrl || media.backdropUrl || media.posterUrl;
  const playClip = autoplayPreviews && motionLevel !== 'off' && media.hoverClipUrl;

  const content = (
    <motion.div
      ref={bannerRef}
      role="group"
      aria-label={`Preview of ${media.title}`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      className="absolute bg-neutral-900 rounded-lg shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 'var(--z-popover, 1000)',
        boxShadow: `0 20px 40px -10px rgba(0,0,0,0.8), 0 0 20px 0px rgba(${glowColor.split(' ').join(',')}, 0.25)`
      }}
    >
      {/* 16:9 Media Area */}
      <div className="relative w-full aspect-video bg-neutral-800 shrink-0">
        <img 
          src={imgUrl} 
          alt={media.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${playClip && videoLoaded ? 'opacity-0' : 'opacity-100'}`}
        />
        {playClip && (
          <video
            src={media.hoverClipUrl}
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {/* Scrim for text */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none" />
        
        {/* Title overlay on media */}
        <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none">
          <h3 className="text-xl font-bold text-white drop-shadow-md truncate">{media.title}</h3>
        </div>
      </div>

      {/* Details Area */}
      <div className="p-4 flex flex-col gap-3">
        
        <div className="flex items-center gap-2 text-xs font-semibold">
          {media.metadata?.rating !== undefined && media.metadata?.rating !== null && (
            <span className="text-green-400">{Math.round(media.metadata.rating * 10)}% Match</span>
          )}
          {media.metadata?.year && <span className="text-neutral-300">{media.metadata.year}</span>}
          {media.metadata?.category && <span className="px-1.5 py-0.5 bg-neutral-700 rounded text-neutral-200">{media.metadata.category}</span>}
          {media.metadata?.runtime && <span className="text-neutral-300">{Math.floor(media.metadata.runtime / 60)}h {media.metadata.runtime % 60}m</span>}
        </div>

        {media.metadata?.genres && media.metadata.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {media.metadata.genres.slice(0, 3).map(g => (
              <span key={g} className="text-[10px] text-neutral-400">{g}</span>
            ))}
          </div>
        )}

        {media.hoverTagline && (
          <p className="text-sm text-neutral-300 line-clamp-1">{media.hoverTagline}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-1">
          <Link 
            href={`/watch/${media.id}`}
            className="flex items-center justify-center flex-1 bg-white text-black font-bold py-1.5 px-3 rounded-md hover:bg-neutral-200 transition-colors"
          >
            <PlayIcon size={16} className="mr-1" fill="currentColor" /> Play
          </Link>
          <button 
            title="Add to My List"
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-neutral-500 text-white hover:border-white transition-colors"
          >
            <PlusIcon size={16} />
          </button>
          <button 
            title="More Info"
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-neutral-500 text-white hover:border-white transition-colors"
          >
            <InfoIcon size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(
    content,
    document.body
  );
}
