import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Main';
import { TOTAL, FPS } from './timeline';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="QuantaraPromo"
    component={Main}
    durationInFrames={TOTAL}
    fps={FPS}
    width={1920}
    height={1080}
    defaultProps={{ bgm: true }}
  />
);
