"use client";

import React, { useMemo } from 'react';
import { SubtitleCue } from './localSubtitles';
import { SubtitleStyling } from './useSubtitles';

interface SubtitleOverlayProps {
  currentTime: number;
  activeCues: SubtitleCue[];
  subtitleDelayMs: number;
  styling: SubtitleStyling;
}

export default function SubtitleOverlay({
  currentTime,
  activeCues,
  subtitleDelayMs,
  styling
}: SubtitleOverlayProps) {
  // Compute effective time with sync delay
  const effectiveTime = currentTime - (subtitleDelayMs / 1000);

  // Find active cue
  const activeCue = useMemo(() => {
    if (!activeCues || activeCues.length === 0) return null;
    return activeCues.find(cue => effectiveTime >= cue.start && effectiveTime <= cue.end) || null;
  }, [activeCues, effectiveTime]);

  if (!activeCue || !activeCue.text) return null;

  // Compute text edge shadow style
  let textShadow = '0 2px 4px rgba(0,0,0,0.9)';
  if (styling.edgeStyle === 'none') {
    textShadow = 'none';
  } else if (styling.edgeStyle === 'outline') {
    textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.8)';
  } else if (styling.edgeStyle === 'raised') {
    textShadow = '0 1px 0 #ffffff44, 0 -1px 0 #000, 1px 0 0 #000, -1px 0 0 #000';
  }

  // Base font size scale: 100% = 1.35rem on desktop, clamped
  const fontSize = `calc(${styling.fontSizePercent * 0.01} * clamp(1rem, 2.5vw, 1.6rem))`;
  const bgAlpha = styling.bgOpacity / 100;

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-20 flex justify-center px-4"
      style={{ bottom: `${styling.bottomPercent}%` }}
    >
      <div
        className="max-w-[85%] text-center px-3 py-1 rounded transition-all duration-75 select-none"
        style={{
          fontSize,
          color: styling.color,
          backgroundColor: bgAlpha > 0 ? `rgba(0, 0, 0, ${bgAlpha})` : 'transparent',
          textShadow,
          lineHeight: '1.35',
          whiteSpace: 'pre-line'
        }}
      >
        {activeCue.text}
      </div>
    </div>
  );
}
