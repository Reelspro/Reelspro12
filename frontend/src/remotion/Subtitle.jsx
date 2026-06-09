import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const Subtitle = ({ text, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Simple pop-in animation
  const scale = interpolate(frame, [0, 10], [0.8, 1], {
    extrapolateRight: 'clamp',
  });
  
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20%',
        width: '100%',
        textAlign: 'center',
        padding: '0 40px',
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <h2
        style={{
          fontFamily: theme.fontFamily,
          color: theme.subtitleColor,
          fontSize: '60px',
          fontWeight: '900',
          textTransform: 'uppercase',
          textShadow: `0 0 ${theme.glowIntensity * 20}px ${theme.primaryColor}, 0 4px 8px rgba(0,0,0,0.8)`,
          lineHeight: '1.2',
        }}
      >
        {text}
      </h2>
    </div>
  );
};
