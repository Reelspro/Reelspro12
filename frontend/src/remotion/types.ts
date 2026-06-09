export interface Scene {
  id?: number;
  type?: 'hook' | 'beat' | 'cliffhanger' | 'cta';
  text: string;
  duration: number;
  start_time?: number;
  end_time?: number;
}

export interface ThemeConfig {
  overlayColor: string;
  textColor: string;
  grainOpacity: number;
  glowColor: string;
}

export interface CustomizationOptions {
  subtitleColor?: string;
  subtitleSize?: number;
  overlayOpacity?: number;
  glowIntensity?: number;
  zoomSpeed?: number;
  grainOpacity?: number;
  logoText?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface ReelCompositionProps {
  scenes: Scene[];
  theme: string;
  articleImageUrl?: string;
  imageUrl?: string;
  customization?: CustomizationOptions;
}
