import { ThemeConfig } from './types';

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  light: {
    mode: 'light',
    primaryColor: '#0F766E', // Teal 700
    fontFamily: 'Inter, sans-serif',
    chartColors: ['#0F766E', '#3b82f6', '#6366f1', '#f43f5e', '#f59e0b', '#10b981'],
    cardBackground: '#ffffff',
    textColor: '#0f172a',
    borderColor: '#e2e8f0'
  },
  dark: {
    mode: 'dark',
    primaryColor: '#14b8a6', // Teal 500
    fontFamily: 'Inter, sans-serif',
    chartColors: ['#14b8a6', '#60a5fa', '#818cf8', '#fb7185', '#fbbf24', '#34d399'],
    cardBackground: '#1e293b',
    textColor: '#f8fafc',
    borderColor: '#334155'
  }
};

export function resolveTheme(baseTheme: 'light' | 'dark', overrides?: Partial<ThemeConfig>): ThemeConfig {
  const base = THEME_PRESETS[baseTheme] || THEME_PRESETS.light;
  return {
    ...base,
    ...overrides
  };
}