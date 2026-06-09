import React from 'react';
import { Composition } from 'remotion';
import { ReelComposition } from './compositions/ReelComposition';

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
  </>
);
