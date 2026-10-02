'use client';

import React, { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from 'lucide-react';
import Link from 'next/link';

interface ProgressItem {
  id: string; // WatchProgress record ID
  mediaId: string;
  title: string;
  posterUrl: string;
  progressPercent: number;
  timestampSec: number;
}

interface ContinueWatchingRowProps {
  items: ProgressItem[];
}

export default function ContinueWatchingRow({ items }: ContinueWatchingRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

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
      <h2 className="text-2xl font-bold text-text-main px-8 md:px-16 mb-4">Continue Watching</h2>
      
      <div className="relative">
        <button 
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-0 bottom-0 w-12 md:w-16 bg-black/50 hover:bg-black/80 text-white z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <ChevronLeftIcon size={32} />
        </button>
        
        <div 
          ref={rowRef}
          className="flex space-x-4 overflow-x-auto hide-scrollbar px-8 md:px-16 scroll-smooth snap-x snap-mandatory"
        >
          {items.map((item) => (
             <Link 
               href={`/play/${item.mediaId}?t=${item.timestampSec}`} 
               key={item.id} 
               className="snap-center shrink-0 group/card relative w-48 md:w-64 aspect-video rounded-md overflow-hidden bg-neutral-900 block"
             >
               <img 
                 src={item.posterUrl} 
                 alt={item.title}
                 className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
               />
               
               {/* Hover Play Button Overlay */}
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center z-10">
                 <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                   <PlayIcon className="text-white ml-1" size={24} fill="currentColor" />
                 </div>
               </div>

               {/* Title & Progress Bar Overlay */}
               <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8 flex flex-col justify-end z-20">
                 <h3 className="text-white text-sm font-semibold truncate drop-shadow-md mb-2">{item.title}</h3>
                 <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-primary" 
                     style={{ width: `${Math.max(2, Math.min(100, item.progressPercent))}%` }}
                   />
                 </div>
               </div>
             </Link>
          ))}
        </div>

        <button 
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-0 bottom-0 w-12 md:w-16 bg-black/50 hover:bg-black/80 text-white z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <ChevronRightIcon size={32} />
        </button>
      </div>
    </div>
  );
}
