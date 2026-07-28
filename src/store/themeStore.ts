import { create } from 'zustand';
import { ThemeMode } from '@/types';

interface ThemeState {
  theme: ThemeMode;
  initializeTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const DEFAULT_THEME: ThemeMode = 'system';

export const useThemeStore = create<ThemeState>((set) => ({
  theme: DEFAULT_THEME,
  initializeTheme: () => {
    const stored = window.localStorage.getItem('life-os-theme') as ThemeMode | null;
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (isDarkMode ? 'dark' : 'light');
    set({ theme });
  },
  setTheme: (theme) => {
    window.localStorage.setItem('life-os-theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem('life-os-theme', nextTheme);
      return { theme: nextTheme };
    });
  },
}));
