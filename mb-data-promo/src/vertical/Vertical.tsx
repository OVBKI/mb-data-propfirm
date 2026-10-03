// Vertical.tsx — le film en 9:16 (TikTok, Reels, Shorts). Même timeline, même
// son, mêmes plans : chaque plan est recadré par sa caméra (framing.ts) et ses
// sous-titres sont recomposés en haut du cadre.
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { SHOTS } from '../timeline';
import { Fonts } from '../lib/Fonts';
import { C } from '../brand';
import { Sound } from '../Sound';
import type { Cap } from '../lib/format';
import { Reframe } from './Reframe';
import { VCaptions } from './VCaptions';
import { FRAMING } from './framing';
import { Open } from '../shots/Open';
import { Spotlight, caps as spotCaps } from '../shots/Spotlight';
import { Tabs, caps as tabsCaps } from '../shots/Tabs';
import { Wall, caps as wallCaps } from '../shots/Wall';
import { Palette, caps as paletteCaps } from '../shots/Palette';
import { Replicate, caps as replicateCaps } from '../shots/Replicate';
import { Brake, caps as brakeCaps } from '../shots/Brake';
import { Odometer } from '../shots/Odometer';
import { Waterfall, caps as waterfallCaps } from '../shots/Waterfall';
import { Flock } from '../shots/Flock';
import { Outro } from '../shots/Outro';

type Id = keyof typeof SHOTS;
const PLAN: { id: Id; C: React.FC<{ dur: number }>; caps?: (dur: number) => Cap[] }[] = [
  { id: 'open', C: Open },
  { id: 'spot', C: Spotlight, caps: spotCaps },
  { id: 'tabs', C: Tabs, caps: tabsCaps },
  { id: 'wall', C: Wall, caps: wallCaps },
  { id: 'palette', C: Palette, caps: paletteCaps },
  { id: 'replicate', C: Replicate, caps: replicateCaps },
  { id: 'brake', C: Brake, caps: brakeCaps },
  { id: 'odometer', C: Odometer },
  { id: 'waterfall', C: Waterfall, caps: waterfallCaps },
  { id: 'flock', C: Flock },
  { id: 'outro', C: Outro },
];

export const Vertical: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Fonts />
    <Sound bgm={bgm} />
    {PLAN.map(({ id, C: Shot, caps }) => {
      const { from, dur } = SHOTS[id];
      return (
        <Sequence key={id} from={from} durationInFrames={dur}>
          <Reframe keys={FRAMING[id]}><Shot dur={dur} /></Reframe>
          {caps ? <VCaptions caps={caps(dur)} /> : null}
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
