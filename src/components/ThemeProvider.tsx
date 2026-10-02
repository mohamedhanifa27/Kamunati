'use client';

import React, { useEffect, useState } from 'react';
import { useThemeStore } from '../store/themeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { primaryColor, backgroundColor, textColor, fontFamily } = useThemeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty('--color-primary', primaryColor);
      document.documentElement.style.setProperty('--color-background', backgroundColor);
      document.documentElement.style.setProperty('--color-surface', backgroundColor);
      document.documentElement.style.setProperty('--color-text', textColor);
      document.documentElement.style.setProperty('--font-main', fontFamily);
    }
  }, [mounted, primaryColor, backgroundColor, textColor, fontFamily]);

  // We return children directly to avoid hydration errors;
  // The globals.css default :root perfectly matches the initial hydration tree.
  return <>{children}</>;
}
