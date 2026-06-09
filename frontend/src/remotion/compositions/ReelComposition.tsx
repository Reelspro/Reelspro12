import React, { useMemo } from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import type { ReelCompositionProps, Scene } from '../types';
import { themes } from './themes';
import { SceneLayer } from './SceneLayer';
import { OverlayLayer } from './OverlayLayer';
import { SubtitleLayer } from './SubtitleLayer';
import { CTAScene } from './CTAScene';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

function normalizeScenes(scenes: Scene[], fps: number) {
  let cursor = 0;
  return scenes.map((scene, index) => {
    const durationSec = scene.duration ?? (scene.end_time != null && scene.start_time != null
      ? scene.end_time - scene.start_time
      : 3);
    const startFrame = scene.start_time != null
      ? Math.round(scene.start_time * fps)
      : cursor;
    const durationFrames = Math.max(1, Math.round(durationSec * fps));
    cursor = scene.start_time != null ? startFrame + durationFrames : cursor + durationFrames;
    const type = scene.type || (index === scenes.length - 1 ? 'cta' : 'beat');
    return { ...scene, type, startFrame, durationFrames };
  });
}

export const ReelComposition: React.FC<ReelCompositionProps> = ({
  scenes = [],
  theme: themeKey = 'suspense',
  articleImageUrl,
  imageUrl,
  customization = {},
}) => {
  const { fps } = useVideoConfig();
  const activeTheme = themes[typeof themeKey === 'string' ? themeKey : 'suspense'] ?? themes['suspense'];
  const theme = activeTheme;
  const img = articleImageUrl || imageUrl;
  const normalized = useMemo(() => normalizeScenes(scenes, fps), [scenes, fps]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>
        {normalized.map((scene, index) => (
          <React.Fragment key={index}>
            <TransitionSeries.Sequence 
              durationInFrames={scene.durationFrames + (index < normalized.length - 1 ? 15 : 0)}
            >
              {scene.type === 'cta' ? (
                <CTAScene 
                  text={scene.text} 
                  theme={theme}
                  brandColor={customization.subtitleColor} // Use subtitle color as brand color fallback
                  buttonText="Read More"
                />
              ) : (
                <AbsoluteFill>
                  <SceneLayer 
                    scene={scene} 
                    theme={theme} 
                    imageUrlOverride={img} 
                    zoomSpeed={customization.zoomSpeed ?? 0.5} 
                  />
                  <OverlayLayer
                    theme={theme}
                    overlayOpacity={customization.overlayOpacity ?? 1}
                    grainOpacity={customization.grainOpacity ?? theme.grainOpacity}
                    logoText={customization.logoText || "ReelsPro"}
                    logoPosition={customization.logoPosition || "top-right"}
                  />
                  <SubtitleLayer
                    text={scene.text}
                    theme={theme}
                    subtitleColor={customization.subtitleColor}
                    subtitleSize={customization.subtitleSize}
                    glowIntensity={customization.glowIntensity ?? 0.5}
                  />
                </AbsoluteFill>
              )}
            </TransitionSeries.Sequence>
            {index < normalized.length - 1 && (
              <TransitionSeries.Transition
                presentation={fade()}
                timing={linearTiming({ durationInFrames: 15 })}
              />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
