import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { TextStoryScreen, TextSegment } from './TextStoryScreen';
import { BackgroundStyle } from './textStoryBackgrounds';

export interface TextStoryCompositionProps {
  screens?: { id: number; rawText: string; segments: TextSegment[] }[];
  background?: BackgroundStyle;
  accentColor?: { name: string; hex: string };
  animationStyle?: string;
  username?: string;
  avatarUrl?: string;
  footerText?: string;
  durationPerScreen?: number; // in seconds
}

export const TextStoryComposition: React.FC<TextStoryCompositionProps> = ({
  screens = [],
  background = { name: 'pink_floral', color: '#FFE4E8', pattern: 'floral', text: '#2D0000' },
  accentColor = { name: 'Crimson', hex: '#E11D48' },
  animationStyle = 'typewriter',
  username = 'Sarah Storyteller',
  avatarUrl = '',
  footerText = 'Full Story In First Comment 👇',
  durationPerScreen = 5.0
}) => {
  const { fps } = useVideoConfig();

  if (!screens.length) {
    // Render an empty card placeholder if no screens are loaded yet
    return (
      <TextStoryScreen
        rawText=""
        segments={[]}
        background={background}
        accentColor={accentColor}
        animationStyle={animationStyle}
        username={username}
        avatarUrl={avatarUrl}
        footerText={footerText}
      />
    );
  }

  const durationFrames = Math.max(30, Math.round(durationPerScreen * fps));
  const transitionFrames = 15; // 0.5s fade transitions

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>
        {screens.map((screen, idx) => {
          const isLast = idx === screens.length - 1;
          const sequenceDuration = durationFrames + (isLast ? 0 : transitionFrames);

          return (
            <React.Fragment key={screen.id}>
              <TransitionSeries.Sequence durationInFrames={sequenceDuration}>
                <TextStoryScreen
                  rawText={screen.rawText}
                  segments={screen.segments}
                  background={background}
                  accentColor={accentColor}
                  animationStyle={animationStyle}
                  username={username}
                  avatarUrl={avatarUrl}
                  footerText={footerText}
                />
              </TransitionSeries.Sequence>
              
              {!isLast && (
                <TransitionSeries.Transition
                  timing={linearTiming({ durationInFrames: transitionFrames })}
                  presentation={fade()}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
