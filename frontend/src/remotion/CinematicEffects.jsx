import React from 'react';

export const CinematicEffects = ({ theme }) => {
  return (
    <>
      {/* Vignette Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${theme.vignetteIntensity}) 100%)`,
          pointerEvents: 'none',
        }}
      />
      
      {/* Subtle Color Tint Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: theme.primaryColor,
          opacity: 0.05,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};
