'use client';

import React from 'react';
import { RectangleButtons } from './ForkedRectangleButtons';

interface AdminBloomButtonProps {
  label: string;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md';
  intent?: 'secondary' | 'danger';
  icon?: React.ReactNode;
}

export function AdminBloomButton({
  label,
  onClick,
  href,
  type = 'button',
  disabled = false,
  loading = false,
  size = 'md',
  intent = 'secondary',
  icon
}: AdminBloomButtonProps) {
  return (
    <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled || loading ? 'none' : 'auto', display: 'inline-block' }}>
      {/* @ts-ignore */}
      <RectangleButtons
        variant="bloom-outline-button"
        mode="dark"
        hue={intent === 'danger' ? 0 : -52}
        saturation={1.00}
        brightness={1.00}
        onClick={onClick}
        label={loading ? 'Loading...' : label}
      />
    </div>
  );
}
