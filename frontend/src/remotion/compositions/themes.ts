import type { ThemeConfig } from '../types';

export const themes: Record<string, ThemeConfig> = {
  horror: { overlayColor: '#1a0000cc', textColor: '#ff3333', grainOpacity: 0.4, glowColor: '#ff0000' },
  mystery: { overlayColor: '#00001acc', textColor: '#6699ff', grainOpacity: 0.3, glowColor: '#0044ff' },
  crime: { overlayColor: '#0d0d0dcc', textColor: '#ffffff', grainOpacity: 0.5, glowColor: '#888888' },
  emotional: { overlayColor: '#1a0a00cc', textColor: '#ffcc88', grainOpacity: 0.1, glowColor: '#ff8800' },
  tiktok: { overlayColor: '#000000aa', textColor: '#00f2ea', grainOpacity: 0.0, glowColor: '#00f2ea' },
  dark: { overlayColor: '#000000dd', textColor: '#cccccc', grainOpacity: 0.6, glowColor: '#ffffff' },
  suspense: { overlayColor: '#0a0a1acc', textColor: '#e0e0ff', grainOpacity: 0.35, glowColor: '#8888ff' },
};

export const getTheme = (key: string): ThemeConfig => themes[key] || themes.horror;
