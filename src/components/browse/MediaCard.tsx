'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'next-view-transitions';
import { AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';
import { useAmbientFocus } from '../../features/ambient';
import { useInterfaceSounds } from '../../features/sound';
import { featureFlags } from '../../lib/featureFlags';
import { HoverBanner } from './HoverBanner';

export type CardVariant = 'poster' | 'wide' | 'minimal';

export interface MediaCardProps {
  id: string;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  qualityBadge?: string;
  variant?: CardVariant;
  index?: number;
  rowFocused?: boolean;
  children?: React.ReactNode;
  
  // U2 Extended properties for ambient/banner
  ambientPalette?: { hex: string; weight: number }[];
  hoverBannerUrl?: string;
  hoverClipUrl?: string;
  hoverTagline?: string;
  metadata?: {
    category?: string | null;
    year?: number | null;
    rating?: number | null;
    runtime?: number | null;
    genres?: string[];
  };
  linkHref?: string;
}

export default function MediaCard({
  id,
  title,
  posterUrl,
  backdropUrl,
  qualityBadge,
  variant = 'poster',
  index = 0,
  rowFocused = false,
  children,
  ambientPalette,
  hoverBannerUrl,
  hoverClipUrl,
  hoverTagline,
  metadata,
  linkHref
}: MediaCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  
  const cardRef = useRef<HTMLAnchorElement>(null);
  const hoverIntentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { motionLevel } = useThemeStore();
  const { focus: ambientFocus, release: ambientRelease } = useAmbientFocus();
  const { tickHover, hapticSnap } = useInterfaceSounds();

  // If this card is the center of a scrolling row, it gets focus automatically
  useEffect(() => {
    if (rowFocused && ambientPalette?.length) {
      ambientFocus({ id, palette: ambientPalette, source: 'carousel' });
    } else if (!rowFocused && !hovered) {
      ambientRelease(id);
    }
  }, [rowFocused, id, ambientPalette, ambientFocus, ambientRelease, hovered]);

  const handlePointerEnter = () => {
    if (window.matchMedia('(hover: none)').matches) return; // touch devices

    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    
    // Play tick
    if (!hovered) tickHover(index);
    setHovered(true);

    // Hover intent (120ms) for ambient swap
    if (!hoverIntentTimer.current && ambientPalette?.length) {
      hoverIntentTimer.current = setTimeout(() => {
        if (cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect();
          ambientFocus({
            id,
            palette: ambientPalette,
            source: 'hover',
            anchor: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
          });
        }
      }, 120);
    }

    // Banner intent (450ms)
    if (!bannerTimer.current && featureFlags.hoverBanner) {
      bannerTimer.current = setTimeout(() => {
        setShowBanner(true);
      }, 450);
    }
  };

  const handlePointerLeave = () => {
    if (hoverIntentTimer.current) {
      clearTimeout(hoverIntentTimer.current);
      hoverIntentTimer.current = null;
    }
    if (bannerTimer.current) {
      clearTimeout(bannerTimer.current);
      bannerTimer.current = null;
    }
    
    // 150ms grace period before closing banner and dropping lift
    leaveTimer.current = setTimeout(() => {
      setHovered(false);
      setShowBanner(false);
      if (!rowFocused) ambientRelease(id);
    }, 150);
  };

  const handleFocus = () => {
    handlePointerEnter();
  };

  const handleBlur = () => {
    handlePointerLeave();
  };

  const handleTouch = () => {
    hapticSnap();
  };

  // Determine classes by variant
  let sizeClass = '';
  if (variant === 'poster') sizeClass = 'w-32 md:w-48 lg:w-56 aspect-[2/3]';
  else if (variant === 'wide') sizeClass = 'w-48 md:w-64 aspect-video';
  else if (variant === 'minimal') sizeClass = 'w-24 md:w-32 aspect-square';

  // Motion level lift logic
  const isLifted = hovered || showBanner; // lift stays active while banner is open
  let transformStyle = '';
  let outlineStyle = '';
  if (isLifted) {
    if (motionLevel === 'minimal') {
      outlineStyle = 'ring-1 ring-white/50';
    } else if (motionLevel === 'standard') {
      transformStyle = `translateY(var(--lift-card, -8px))`;
    } else if (motionLevel === 'expressive') {
      transformStyle = `translateY(var(--lift-card, -8px)) scale(1.02) rotate(1deg)`;
    }
  }

  // Glow logic
  const primaryHex = ambientPalette?.[0]?.hex || '255 255 255';
  
  return (
    <>
      <Link 
        ref={cardRef}
        href={linkHref || `/watch/${id}`}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouch}
        className={`relative rounded-md cursor-pointer bg-neutral-900 group block ${sizeClass} ${outlineStyle}`}
        style={{
          transform: transformStyle,
          transition: `transform var(--dur-fast) ease-out, box-shadow var(--dur-fast) ease-out`,
          zIndex: isLifted ? 30 : 1, // ensure it overlaps neighbours when lifted
          '--card-glow': primaryHex, // expose variable for the pseudo-element glow
        } as any}
      >
        {/* Glow pseudo-element behind card (only visible on lift) */}
        <div 
          className="absolute inset-0 rounded-md pointer-events-none transition-opacity duration-200"
          style={{
            opacity: isLifted ? 0.6 : 0,
            boxShadow: `0 12px 30px -10px ${primaryHex}80, 0 0 20px 0px ${primaryHex}40`,
            zIndex: -1,
          }}
        />

        {!imageLoaded && (
          <div className="absolute inset-0 bg-neutral-800 animate-pulse rounded-md" />
        )}
        
        <img 
          src={variant === 'wide' ? (backdropUrl || posterUrl) : posterUrl} 
          alt={title}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover rounded-md transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {qualityBadge && (
          <div className="absolute top-2 right-2 bg-primary text-text text-[10px] font-bold px-2 py-1 rounded shadow-md z-10">
            {qualityBadge}
          </div>
        )}

        {/* Default Title Overlay for poster variant (if no children provided) */}
        {variant === 'poster' && !children && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-20 rounded-md">
            <h3 className="text-text text-sm md:text-base font-semibold line-clamp-2">
              {title}
            </h3>
          </div>
        )}

        {/* Custom children (e.g. progress bar) */}
        {children && (
          <div className="absolute inset-0 z-20 rounded-md pointer-events-none">
            {children}
          </div>
        )}
      </Link>

      {/* Hover Banner Portal */}
      <AnimatePresence>
        {showBanner && cardRef.current && (
          <HoverBanner 
            anchorElement={cardRef.current}
            media={{ id, title, hoverBannerUrl, hoverClipUrl, backdropUrl, posterUrl, hoverTagline, ambientPalette, metadata }}
            onPointerEnter={() => {
              if (leaveTimer.current) clearTimeout(leaveTimer.current);
            }}
            onPointerLeave={handlePointerLeave}
            onClose={() => {
              setShowBanner(false);
              setHovered(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
