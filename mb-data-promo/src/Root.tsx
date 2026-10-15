import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Main';
import { Vertical } from './vertical/Vertical';
import { TOTAL, FPS } from './timeline';
import { Ad } from './ad/Ad';
import { TOTAL as AD_TOTAL } from './ad/timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="QuantaraPromo" component={Main} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} defaultProps={{ bgm: true }} />
    {/* 9:16 pour TikTok, Instagram Reels, YouTube Shorts */}
    <Composition id="QuantaraVertical" component={Vertical} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} defaultProps={{ bgm: true }} />
    {/* pub de campagne avec voix off, ≈ 30 s */}
    <Composition id="QuantaraAd" component={Ad} durationInFrames={AD_TOTAL} fps={FPS} width={1920} height={1080} defaultProps={{ bgm: true }} />
    <Composition id="QuantaraAdVertical" component={Ad} durationInFrames={AD_TOTAL} fps={FPS} width={1080} height={1920} defaultProps={{ bgm: true }} />
  </>
);
