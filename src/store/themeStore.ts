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
};

interface ThemeStore extends AppearancePrefs {
  setPrefs: (prefs: Partial<AppearancePrefs>) => void;
}

const defaultPrefs: AppearancePrefs = {
  themeMode: 'preset',
  presetId: 'midnight-marquee',
  systemDarkPresetId: 'midnight-marquee',
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
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      ...defaultPrefs,
      setPrefs: (prefs) => set((state) => ({ ...state, ...prefs, updatedAt: new Date().toISOString() })),
    }),
    {
      name: 'kamunati-appearance',
    }
  )
);
