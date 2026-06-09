import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { ThemeConfig } from '../types';

interface OverlayLayerProps {
  theme: ThemeConfig;
  overlayOpacity?: number;
  grainOpacity?: number;
  logoText?: string;
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const OverlayLayer: React.FC<OverlayLayerProps> = ({
  theme,
  overlayOpacity = 1,
  grainOpacity,
  logoText = 'ReelsPro',
  logoUrl,
  logoPosition = 'top-right',
}) => {
  const frame = useCurrentFrame();
  const grain = grainOpacity ?? theme.grainOpacity;
  const noiseOffset = (frame % 30) * 3;

  // Corner positioning style
  const getCornerStyle = (): React.CSSProperties => {
    switch (logoPosition) {
      case 'top-left':
        return { top: 60, left: 60 };
      case 'bottom-left':
        return { bottom: 120, left: 60 };
      case 'bottom-right':
        return { bottom: 120, right: 60 };
      case 'top-right':
      default:
        return { top: 60, right: 60 };
    }
  };

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Background Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(transparent 40%, ${theme.overlayColor})`,
          opacity: overlayOpacity,
        }}
      />
      
      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Film Grain */}
      {grain > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: grain * 0.35,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            backgroundPosition: `${noiseOffset}px ${noiseOffset}px`,
            mixBlendMode: 'overlay',
          }}
        />
      )}

      {/* Light Leak Effect */}
      <div
        style={{
          position: 'absolute',
          top: `${-20 + Math.sin(frame / 30) * 10}%`,
          left: `${-20 + Math.cos(frame / 40) * 10}%`,
          width: '140%',
          height: '140%',
          background: `radial-gradient(circle at center, ${theme.glowColor}15 0%, transparent 50%)`,
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '10%',
          right: '10%',
          height: '120px',
          boxShadow: `0 0 80px 20px ${theme.glowColor}55`,
          borderRadius: '50%',
        }}
      />

      {/* Watermark/Logo Overlay */}
      {(logoUrl || logoText) && (
        <div
          style={{
            position: 'absolute',
            ...getCornerStyle(),
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: 0.8,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            padding: '8px 16px',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: 32, objectFit: 'contain' }} />
          ) : (
            <span
              style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: '1px',
                color: '#ffffff',
                textShadow: `0 0 8px ${theme.glowColor}`,
              }}
            >
              {logoText}
            </span>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
