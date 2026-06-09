import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ThemeConfig } from '../types';

interface SubtitleLayerProps {
  text: string;
  theme: ThemeConfig;
  subtitleColor?: string;
  subtitleSize?: number;
  glowIntensity?: number;
}

export const SubtitleLayer: React.FC<SubtitleLayerProps> = ({
  text,
  theme,
  subtitleColor,
  subtitleSize = 52,
  glowIntensity = 0.5,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const words = text.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  // Reserve last 6 frames for fadeOut transition
  const activeDuration = Math.max(10, durationInFrames - 6);
  const framesPerWord = activeDuration / totalWords;

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 6, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const defaultColor = subtitleColor || theme.textColor;
  const glowColor = theme.glowColor;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: '25%',
        paddingLeft: 48,
        paddingRight: 48,
        opacity: fadeOut,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px 16px',
        }}
      >
        {words.map((word, index) => {
          const startFrame = index * framesPerWord;
          const isHighlighted = frame >= startFrame && frame < startFrame + framesPerWord;
          const hasBeenHighlighted = frame >= startFrame;

          // Word entrance spring
          const enterSpring = spring({
            frame: frame - startFrame,
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          const scale = interpolate(enterSpring, [0, 1], [0.8, 1]);
          const opacity = interpolate(enterSpring, [0, 1], [0, 1]);

          // Highlight color: gold/yellow for active, default color for read words, transparent-ish for future words
          const wordColor = isHighlighted
            ? '#FFDD00' 
            : hasBeenHighlighted
            ? defaultColor
            : `${defaultColor}88`;

          const textShadow = isHighlighted
            ? `0 0 ${20 + glowIntensity * 30}px ${glowColor}, 0 4px 12px rgba(0,0,0,0.85)`
            : '0 2px 6px rgba(0,0,0,0.6)';

          return (
            <span
              key={index}
              style={{
                display: 'inline-block',
                transform: `scale(${scale})`,
                opacity,
                color: wordColor,
                fontSize: subtitleSize,
                fontWeight: 800,
                textAlign: 'center',
                textShadow,
                transition: 'color 0.15s ease-out, text-shadow 0.15s ease-out',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
