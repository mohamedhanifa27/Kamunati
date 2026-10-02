'use client';

import React, { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import MediaCard from './MediaCard';

interface MediaItem {
  id: string;
  title: string;
  posterUrl: string;
  qualityBadge?: string;
}

interface MediaRowProps {
  title: string;
  items: MediaItem[];
}

export default function MediaRow({ title, items }: MediaRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full py-6 group">
      <h2 className="text-2xl font-bold text-text px-8 md:px-16 mb-4">{title}</h2>
      
      <div className="relative">
        <button 
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-0 bottom-0 w-12 md:w-16 bg-black/50 hover:bg-black/80 text-white z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <ChevronLeftIcon className="w-8 h-8" />
        </button>
        
        <div 
          ref={rowRef}
          className="flex space-x-4 overflow-x-auto hide-scrollbar px-8 md:px-16 scroll-smooth snap-x snap-mandatory"
        >
          {items.map((item) => (
             <div key={item.id} className="snap-center shrink-0">
               <MediaCard 
                 id={item.id}
                 title={item.title}
                 posterUrl={item.posterUrl}
                 qualityBadge={item.qualityBadge}
               />
             </div>
          ))}
        </div>

        <button 
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-0 bottom-0 w-12 md:w-16 bg-black/50 hover:bg-black/80 text-white z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <ChevronRightIcon className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
