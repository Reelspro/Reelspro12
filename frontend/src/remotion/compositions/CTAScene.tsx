import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ThemeConfig } from '../types';

interface CTASceneProps {
  text?: string;
  theme: ThemeConfig;
  brandColor?: string;
  buttonText?: string;
}

export const CTAScene: React.FC<CTASceneProps> = ({
  text = '📖 Full Read Story Details In Comments 👇',
  theme,
  brandColor,
  buttonText = 'Read Full Story',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animations using spring
  const enter = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const y = interpolate(enter, [0, 1], [50, 0]);

  // Button pop-in animation
  const btnEnter = spring({ frame: frame - 15, fps, config: { damping: 10, stiffness: 120 } });
  const btnScale = interpolate(btnEnter, [0, 1], [0, 1]);
  const btnOpacity = btnEnter;

  // Brand color or fallback to theme's accent/glow color
  const accentColor = brandColor || theme.glowColor || '#7c3aed';

  // Pulse animation for the button
  const pulse = Math.sin(frame / 12) * 0.04 + 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#05050a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
        display: 'flex',
        flexDirection: 'column',
        gap: 60,
      }}
    >
      {/* Background ambient light */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}1e 0%, transparent 70%)`,
          filter: 'blur(40px)',
          top: '20%',
        }}
      />

      {/* CTA Text */}
      <h2
        style={{
          margin: 0,
          transform: `translateY(${y}px)`,
          opacity: enter,
          color: theme.textColor || '#ffffff',
          fontSize: 54,
          fontWeight: 900,
          textAlign: 'center',
          lineHeight: 1.3,
          fontFamily: 'system-ui, sans-serif',
          textShadow: `0 0 15px ${accentColor}33`,
          zIndex: 1,
        }}
      >
        {text}
      </h2>

      {/* CTA Button */}
      {btnEnter > 0 && (
        <div
          style={{
            transform: `scale(${btnScale * pulse})`,
            opacity: btnOpacity,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <button
            style={{
              backgroundColor: accentColor,
              color: '#ffffff',
              border: 'none',
              padding: '24px 56px',
              fontSize: 34,
              fontWeight: 800,
              borderRadius: 50,
              cursor: 'pointer',
              boxShadow: `0 10px 30px ${accentColor}55, 0 0 20px ${accentColor}aa`,
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {buttonText}
          </button>
        </div>
      )}
    </AbsoluteFill>
  );
};
