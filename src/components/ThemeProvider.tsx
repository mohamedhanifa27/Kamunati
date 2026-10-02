'use client';

import React, { useEffect, useState } from 'react';
import { useThemeStore } from '../store/themeStore';
import presets from '../lib/theme/presets.json';
import { generateThemeVariables } from '../lib/theme/utils';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const prefs = useThemeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Apply color theme
    let activePreset = presets.find(p => p.id === prefs.presetId) || presets[0];
    
    if (prefs.themeMode === 'custom' && prefs.activeCustomThemeId) {
      const custom = prefs.customThemes.find(c => c.id === prefs.activeCustomThemeId);
      if (custom) activePreset = custom as any;
    }

    const cssVars = generateThemeVariables(activePreset);
    
    // Inject the generated variables directly into a style tag or the root inline style
    const styleElId = 'kamunati-theme-vars';
    let styleEl = document.getElementById(styleElId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleElId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `:root { ${cssVars} }`;

    // Apply Typography
    root.style.setProperty('--font-heading', `"${prefs.headingFont}", sans-serif`);
    root.style.setProperty('--font-body', `"${prefs.bodyFont}", sans-serif`);
    root.style.setProperty('--fs-scale', prefs.fontScale.toString());

    // Apply layout & shape data attributes
    root.setAttribute('data-radius', prefs.radius);
    root.setAttribute('data-density', prefs.density);
    root.setAttribute('data-motion', prefs.motionLevel);
    root.style.setProperty('--motion-speed', prefs.motionSpeed.toString());

  }, [mounted, prefs]);

  return <>{children}</>;
}
