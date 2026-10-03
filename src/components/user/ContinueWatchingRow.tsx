'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from 'lucide-react';
import MediaCard from '../browse/MediaCard';
import { useInterfaceSounds } from '../../features/sound';

interface ProgressItem {
  id: string; // WatchProgress record ID
  mediaId: string;
  title: string;
  posterUrl: string; // The backend currently returns posterUrl here, even if wide is preferred
  progressPercent: number;
  timestampSec: number;
  ambientPalette?: { hex: string; weight: number }[];
}

interface ContinueWatchingRowProps {
  items: ProgressItem[];
}

export default function ContinueWatchingRow({ items }: ContinueWatchingRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const { tickScroll } = useInterfaceSounds();

  const scrollRaf = useRef(0);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocused = useRef<number | null>(null);

  const checkFocus = () => {
    if (!rowRef.current) return;
    const container = rowRef.current;
    const rect = container.getBoundingClientRect();
    const focusLineX = rect.left + rect.width / 2;

    let closestIdx = -1;
    let minDiff = Infinity;
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
    }, 150);
  };

  useEffect(() => {
    return () => {
      isScrolling.current = false;
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  if (!items || items.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full py-6 group">
      <h2 className="text-2xl font-bold text-text px-8 md:px-16 mb-4">Continue Watching</h2>
      
      {/* Row clipping fix: add padding to container to prevent lift clipping */}
      <div className="relative pt-[24px] -mt-[24px]">
        <button 
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-[24px] bottom-0 w-12 md:w-16 bg-black/50 hover:bg-black/80 text-white z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <ChevronLeftIcon size={32} />
        </button>
        
        <div 
          ref={rowRef}
          onScroll={onScroll}
          className="flex space-x-4 overflow-x-auto hide-scrollbar px-8 md:px-16 scroll-smooth snap-x snap-mandatory pb-[24px] -mb-[24px]"
        >
          {items.map((item, index) => (
            <div key={item.id} className="snap-center shrink-0">
              <MediaCard
                id={item.mediaId}
                title={item.title}
                posterUrl={item.posterUrl}
                backdropUrl={item.posterUrl} // Fallback to poster if backdrop missing
                variant="wide"
                index={index}
                rowFocused={focusedIndex === index}
                ambientPalette={item.ambientPalette}
                linkHref={`/play/${item.mediaId}?t=${item.timestampSec}`}
              >
                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 rounded-md pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                    <PlayIcon className="text-white ml-1" size={24} fill="currentColor" />
                  </div>
                </div>

                {/* Title & Progress Bar Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8 flex flex-col justify-end z-20 rounded-b-md pointer-events-none">
                  <h3 className="text-white text-sm font-semibold truncate drop-shadow-md mb-2">{item.title}</h3>
                  <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${Math.max(2, Math.min(100, item.progressPercent))}%` }}
                    />
                  </div>
                </div>
              </MediaCard>
            </div>
          ))}
        </div>

        <button 
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-[24px] bottom-0 w-12 md:w-16 bg-black/50 hover:bg-black/80 text-white z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <ChevronRightIcon size={32} />
        </button>
      </div>
    </div>
  );
}
