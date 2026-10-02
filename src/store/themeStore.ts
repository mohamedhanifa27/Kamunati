import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AnimationLevel = 'high' | 'reduced' | 'none';

interface ThemeState {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  animationLevel: AnimationLevel;
  setTheme: (theme: Partial<ThemeState>) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      primaryColor: '#837D5E',
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      animationLevel: 'high',
      setTheme: (theme) => set((state) => ({ ...state, ...theme })),
    }),
    {
      name: 'kamunati-theme-storage',
    }
  )
);
