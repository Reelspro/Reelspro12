import React from 'react';
import { Composition } from 'remotion';
import { ReelComposition } from './compositions/ReelComposition';
import { TextStoryComposition } from './compositions/TextStoryComposition';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ReelComposition"
      component={ReelComposition}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        scenes: [],
        theme: 'horror',
        articleImageUrl: '',
      }}
    />
    <Composition
      id="TextStoryReel"
      component={TextStoryComposition}
      durationInFrames={450} // 15 seconds default
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        screens: [],
        username: 'Sarah Storyteller'
      }}
    />
  </>
);
