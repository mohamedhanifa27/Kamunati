'use client';

import React from 'react';
import { SkeuomorphicToggleCollection } from './ForkedSkeuomorphicToggleCollection';

interface AdminToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  busy?: boolean;
  tone: 'add' | 'state';
  size?: number;
  ariaLabel?: string;
}

export function AdminToggle({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  busy = false,
  tone,
  size = 0.84,
  ariaLabel
}: AdminToggleProps) {
  // Add: hue=73. State: hue=-97.
  const hue = tone === 'add' ? 73 : -97;

  return (
    <div className="flex flex-col gap-1">
      <div 
        className="flex items-center justify-between"
        aria-label={ariaLabel}
      >
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text">{label}</span>
          {description && (
            <span className="text-xs text-text-muted">{description}</span>
          )}
        </div>
        {/* @ts-ignore */}
        <SkeuomorphicToggleCollection
          variant="modern"
          mode="auto"
          speed={1.50}
          size={size}
          opacity={1.00}
          hue={hue}
          saturation={1.03}
          brightness={1.02}
          label={label}
          checked={checked}
          disabled={disabled}
          busy={busy}
          onChange={onCheckedChange}
        />
      </div>
    </div>
  );
}
