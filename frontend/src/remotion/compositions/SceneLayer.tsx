import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Scene, ThemeConfig } from '../types';

interface SceneLayerProps {
  scene: Scene;
  theme: ThemeConfig;
  zoomSpeed?: number;
  imageUrlOverride?: string;
}

export const SceneLayer: React.FC<SceneLayerProps> = ({
  scene,
  theme,
  zoomSpeed = 0.5,
  imageUrlOverride,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoomEnd = 1 + 0.15 * zoomSpeed;

  // Zoom interpolation (Ken Burns)
  const scale = interpolate(frame, [0, durationInFrames], [1, zoomEnd], {
    extrapolateRight: 'clamp',
  });

  const imageUrl = imageUrlOverride || scene.imageUrl || scene.image;
  const bgColor = scene.backgroundColor || scene.color || theme.overlayColor || '#000000';

  // Pseudo-random deterministic direction based on text or default
  const hash = scene.text ? scene.text.length : 10;
  const panX = hash % 2 === 0 ? 1 : -1;
  const panY = hash % 3 === 0 ? 1 : -1;

  const translateX = interpolate(frame, [0, durationInFrames], [0, panX * 20 * zoomSpeed], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, durationInFrames], [0, panY * 20 * zoomSpeed], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {imageUrl ? (
        <Img
          src={imageUrl}
          style={{
            width: '110%', // Make wider for panning
            height: '110%',
            left: '-5%',   // Offset
            top: '-5%',
            objectFit: 'cover',
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          }}
        />
      ) : (
        <AbsoluteFill 
          style={{ 
            background: bgColor.startsWith('#') 
              ? bgColor 
              : `linear-gradient(180deg, #111 0%, ${bgColor} 100%)` 
          }} 
        />
      )}
    </AbsoluteFill>
  );
};
