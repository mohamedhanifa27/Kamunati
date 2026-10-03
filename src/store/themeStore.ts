import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import presets from '../lib/theme/presets.json';

export type CustomTheme = {
  id: string;
  name: string;
  colors: Record<string, string>;
};

export type AppearancePrefs = {
  themeMode: 'preset' | 'custom' | 'system';
  presetId: string;
  systemDarkPresetId: string;
  systemLightPresetId: string;
  customThemes: CustomTheme[];
  activeCustomThemeId: string | null;
  headingFont: string;
  bodyFont: string;
  fontScale: number;
  letterSpacing: 'normal' | 'relaxed';
  density: 'compact' | 'comfortable' | 'spacious';
  radius: 'sharp' | 'soft' | 'round';
  cardStyle: 'poster' | 'wide' | 'minimal';
  cardSize: 'small' | 'medium' | 'large';
  rowStyle: 'carousel' | 'grid';
  heroStyle: 'video' | 'poster-split' | 'minimal';
  navLayout: 'top' | 'sidebar';
  motionLevel: 'off' | 'minimal' | 'standard' | 'expressive';
  motionSpeed: number;
  autoplayPreviews: boolean;
  glassEffects: boolean;
  filmGrain: boolean;
  subtitleStyle: { size: number; color: string; background: string; edge: 'none' | 'shadow' | 'outline' };
  updatedAt: string;
  
  // U2 Additions
  ambient?: { mode: 'live' | 'calm' | 'static' | 'off' };
  sounds?: { enabled: boolean; volume: number; onHover: boolean; onScroll: boolean; haptics: boolean };
  myList?: { view: 'grid' | 'list'; sort: 'manual' | 'recent' | 'az' | 'year' };
};

interface ThemeStore extends AppearancePrefs {
  setPrefs: (prefs: Partial<AppearancePrefs>) => void;
}

const defaultPrefs: AppearancePrefs = {
  themeMode: 'preset',
  presetId: 'deep-vibe',
  systemDarkPresetId: 'deep-vibe',
  systemLightPresetId: 'daylight-matinee',
  customThemes: [],
  activeCustomThemeId: null,
  headingFont: 'Sora',
  bodyFont: 'Inter',
  fontScale: 1,
  letterSpacing: 'normal',
  density: 'comfortable',
  radius: 'soft',
  cardStyle: 'poster',
  cardSize: 'medium',
  rowStyle: 'carousel',
  heroStyle: 'video',
  navLayout: 'top',
  motionLevel: 'standard',
  motionSpeed: 1,
  autoplayPreviews: true,
  glassEffects: true,
  filmGrain: false,
  subtitleStyle: { size: 1, color: '#ffffff', background: 'rgba(0,0,0,0.8)', edge: 'shadow' },
  updatedAt: new Date().toISOString(),
  
  ambient: { mode: 'live' },
  sounds: { enabled: true, volume: 0.35, onHover: true, onScroll: true, haptics: false },
  myList: { view: 'grid', sort: 'recent' },
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      ...defaultPrefs,
      setPrefs: (prefs) => {
        set((state) => ({ ...state, ...prefs, updatedAt: new Date().toISOString() }));
        
        // Sync to backend asynchronously
        fetch('/api/user/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(get())
        }).catch(err => console.error('Failed to sync preferences:', err));
      },
    }),
    {
      name: 'kamunati-appearance',
    }
  )
);
