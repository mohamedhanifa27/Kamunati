'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';

interface MediaCardProps {
  id: string;
  title: string;
  posterUrl: string;
  qualityBadge?: string;
}

export default function MediaCard({ id, title, posterUrl, qualityBadge }: MediaCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { motionLevel } = useThemeStore();
  const shouldAnimate = motionLevel === 'standard' || motionLevel === 'expressive';

  return (
    <Link href={`/watch/${id}`}>
      <motion.div 
        className="relative w-32 md:w-48 lg:w-56 aspect-[2/3] rounded-md overflow-hidden cursor-pointer bg-neutral-900 group"
        whileHover={shouldAnimate ? { scale: 1.05, zIndex: 30 } : {}}
        transition={{ duration: 0.2 }}
      >
      {!imageLoaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}
      <img 
        src={posterUrl} 
        alt={title}
        onLoad={() => setImageLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {qualityBadge && (
        <div className="absolute top-2 right-2 bg-primary text-text text-[10px] font-bold px-2 py-1 rounded shadow-md z-10">
          {qualityBadge}
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-20">
        <h3 className="text-text text-sm md:text-base font-semibold line-clamp-2">
          {title}
        </h3>
        </div>
      </motion.div>
    </Link>
  );
}
