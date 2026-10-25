'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import MediaCard from './MediaCard';
import { useInterfaceSounds } from '../../features/sound';

export interface MediaItem {
  id: string;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  qualityBadge?: string;
  ambientPalette?: { hex: string; weight: number }[];
  hoverBannerUrl?: string;
  hoverClipUrl?: string;
  hoverTagline?: string;
  logoUrl?: string;
  category?: string;
  releaseYear?: number;
  rating?: number;
  runtime?: number;
}

interface MediaRowProps {
  title: string;
  items: MediaItem[];
}

export default function MediaRow({ title, items }: MediaRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const { tickScroll } = useInterfaceSounds();

  // Scroll ticker state
  const scrollRaf = useRef(0);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocused = useRef<number | null>(null);

  const checkFocus = () => {
    if (!rowRef.current) return;
    const container = rowRef.current;
    const rect = container.getBoundingClientRect();
    const focusLineX = rect.left + rect.width / 2; // viewport center

    let closestIdx = -1;
    let minDiff = Infinity;

    // We can assume children are the card wrappers
    const children = container.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.left + childRect.width / 2;
      const diff = Math.abs(childCenter - focusLineX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    if (closestIdx !== -1 && closestIdx !== lastFocused.current) {
      if (lastFocused.current !== null) {
        tickScroll(closestIdx);
      }
      lastFocused.current = closestIdx;
      setFocusedIndex(closestIdx);
    }
  };

  const scrollLoop = () => {
    checkFocus();
    if (isScrolling.current) {
      scrollRaf.current = requestAnimationFrame(scrollLoop);
    }
  };

  const onScroll = () => {
    if (!isScrolling.current) {
      isScrolling.current = true;
      scrollRaf.current = requestAnimationFrame(scrollLoop);
    }
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
    }, 150); // stop loop 150ms after last scroll event
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (rowRef.current && e.deltaY !== 0) {
      // If deltaX is 0 (regular vertical scroll wheel), we translate it to horizontal scroll
      // but only if the user isn't holding shift (which already scrolls horizontally)
      if (Math.abs(e.deltaX) === 0) {
        e.preventDefault();
        rowRef.current.scrollBy({ left: e.deltaY > 0 ? 300 : -300, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    return () => {
      isScrolling.current = false;
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  const handleScrollClick = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full py-6 group">
      <h2 className="text-2xl font-bold text-text px-8 md:px-16 mb-4">{title}</h2>
      
      {/* Row clipping fix: add padding to container to prevent lift clipping */}
      <div className="relative pt-[24px] -mt-[24px]">
        <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.9)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            onClick={() => handleScrollClick('left')}
            className="absolute left-0 top-[24px] bottom-[24px] w-16 md:w-24 bg-black/70 hover:bg-black/90 text-white z-20 flex items-center justify-center opacity-100 transition-colors backdrop-blur-md border-r border-y border-white/10 rounded-r-3xl shadow-[8px_0_20px_rgba(0,0,0,0.8)]"
          >
            <ChevronLeftIcon className="w-12 h-12" />
          </motion.button>
        
        <div 
          ref={rowRef}
          onScroll={onScroll}
          onWheel={handleWheel}
          className="flex space-x-4 overflow-x-auto hide-scrollbar px-8 md:px-16 scroll-smooth snap-x snap-mandatory pb-[24px] -mb-[24px]"
        >
          {items.map((item, index) => (
             <div key={item.id} className="snap-center shrink-0">
               <MediaCard 
                 id={item.id}
                 title={item.title}
                 posterUrl={item.posterUrl}
                 backdropUrl={item.backdropUrl}
                 qualityBadge={item.qualityBadge}
                 ambientPalette={item.ambientPalette}
                 hoverBannerUrl={item.hoverBannerUrl}
                 hoverClipUrl={item.hoverClipUrl}
                 hoverTagline={item.hoverTagline}
                 logoUrl={item.logoUrl}
                 metadata={{
                   category: item.category,
                   year: item.releaseYear,
                   rating: item.rating,
                   runtime: item.runtime
                 }}
                 index={index}
                 rowFocused={focusedIndex === index}
               />
             </div>
          ))}
        </div>

        <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.9)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            onClick={() => handleScrollClick('right')}
            className="absolute right-0 top-[24px] bottom-[24px] w-16 md:w-24 bg-black/70 hover:bg-black/90 text-white z-20 flex items-center justify-center opacity-100 transition-colors backdrop-blur-md border-l border-y border-white/10 rounded-l-3xl shadow-[-8px_0_20px_rgba(0,0,0,0.8)]"
          >
            <ChevronRightIcon className="w-12 h-12" />
          </motion.button>
      </div>
    </div>
  );
}
