// Main.tsx — le montage. Chaque plan vit dans une <Sequence> calée sur SHOTS.
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { SHOTS } from './timeline';
import { Fonts } from './lib/Fonts';
import { C } from './brand';
import { Sound } from './Sound';
import { Open } from './shots/Open';
import { Spotlight } from './shots/Spotlight';
import { Tabs } from './shots/Tabs';
import { Wall } from './shots/Wall';
import { Palette } from './shots/Palette';
import { Replicate } from './shots/Replicate';
import { Brake } from './shots/Brake';
import { Odometer } from './shots/Odometer';
import { Waterfall } from './shots/Waterfall';
import { Flock } from './shots/Flock';
import { Outro } from './shots/Outro';

export const Main: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Fonts />
    <Sound bgm={bgm} />
    <Sequence from={SHOTS.open.from} durationInFrames={SHOTS.open.dur}><Open dur={SHOTS.open.dur} /></Sequence>
    <Sequence from={SHOTS.spot.from} durationInFrames={SHOTS.spot.dur}><Spotlight /></Sequence>
    <Sequence from={SHOTS.tabs.from} durationInFrames={SHOTS.tabs.dur}><Tabs dur={SHOTS.tabs.dur} /></Sequence>
    <Sequence from={SHOTS.wall.from} durationInFrames={SHOTS.wall.dur}><Wall dur={SHOTS.wall.dur} /></Sequence>
    <Sequence from={SHOTS.palette.from} durationInFrames={SHOTS.palette.dur}><Palette dur={SHOTS.palette.dur} /></Sequence>
    <Sequence from={SHOTS.replicate.from} durationInFrames={SHOTS.replicate.dur}><Replicate dur={SHOTS.replicate.dur} /></Sequence>
    <Sequence from={SHOTS.brake.from} durationInFrames={SHOTS.brake.dur}><Brake dur={SHOTS.brake.dur} /></Sequence>
    <Sequence from={SHOTS.odometer.from} durationInFrames={SHOTS.odometer.dur}><Odometer dur={SHOTS.odometer.dur} /></Sequence>
    <Sequence from={SHOTS.waterfall.from} durationInFrames={SHOTS.waterfall.dur}><Waterfall dur={SHOTS.waterfall.dur} /></Sequence>
    <Sequence from={SHOTS.flock.from} durationInFrames={SHOTS.flock.dur}><Flock dur={SHOTS.flock.dur} /></Sequence>
    <Sequence from={SHOTS.outro.from} durationInFrames={SHOTS.outro.dur}><Outro dur={SHOTS.outro.dur} /></Sequence>
  </AbsoluteFill>
);
