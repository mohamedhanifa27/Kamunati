'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const LiquidMetalButton = dynamic(
  () => import('../../../../vendor/threeui/src/shaders/liquid-metal-button/LiquidMetalButton').then((mod) => mod.LiquidMetalButton),
  { ssr: false }
);

interface AdminOrbButtonProps {
  onClick: () => void;
  ariaLabel: string;
  label?: string;
  disabled?: boolean;
  size?: number; // 56 to 72 px
}

export function AdminOrbButton({
  onClick,
  ariaLabel,
  label,
  disabled = false,
  size = 56
}: AdminOrbButtonProps) {
  return (
    <div className="flex items-center gap-3">
      <div 
        style={{ width: size, height: size, opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
        aria-label={ariaLabel}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        onClick={onClick}
      >
        <LiquidMetalButton variant="circle" />
      </div>
      {label && (
        <span className="font-heading font-semibold text-text">{label}</span>
      )}
    </div>
  );
}
