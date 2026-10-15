// AdSound.tsx — voix off + musique + bruitages. La voix passe devant : la musique
// descend de 0,30 à 0,11 pendant chaque réplique (rampes de 8 f). Bruitages discrets
// (≤ 0,5), calés sur leur PIC comme dans Sound.tsx (sfx-meta.json).
import React from 'react';
import { Audio, Sequence, interpolate, staticFile } from 'remotion';
import META from '../sfx-meta.json';
import VO from '../vo-meta.json';
import { LINES, TOTAL, sceneOf, wordAt, HOOK } from './timeline';
import { PRESS, SWAP } from '../shots/Replicate';

const M = META as Record<string, { peakLag: number; len: number }>;
const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const at = (id: Parameters<typeof sceneOf>[0], k: number) => { const s = sceneOf(id); return s.from + k - (s.trim ?? 0); };
const vlen = (id: string) => (VO as Record<string, { frames: number }>)[id].frames;

const CUES: [number, string, number][] = [
  ...[0, 2, 5].map((w) => [HOOK.h1 + wordAt('hook1', w) + 6, 'swoosh-quick', 0.28] as [number, string, number]),
  [HOOK.h2 + wordAt('hook2', 9), 'impact-transition', 0.5],
  [sceneOf('gather').from + 8 + wordAt('promise', 1) + 4, 'sparkle-touch', 0.35],
  [sceneOf('gather').from + 8 + wordAt('promise', 5) + 6, 'whoosh-swirl', 0.3],
  [at('risk', 18 + 32 + 8), 'zoom-futuristic', 0.28],
  [at('risk', 18 + 62), 'sparkle-touch', 0.35],
  [at('replicate', PRESS), 'switch-tap', 0.55],
  ...[0, 1, 2].map((i) => [at('replicate', SWAP + 26 + i * 9), 'typewriter-hit-single', 0.4 - i * 0.05] as [number, string, number]),
  [at('brake', 30), 'whoosh-fast', 0.4],
  [at('brake', 66), 'impact-transition', 0.32],
  ...[0, 1, 2].map((i) => [at('odometer', 6 + 20 + i * 7 + 22), 'clock-tick-single', 1.6 - i * 0.12] as [number, string, number]),
  [at('odometer', 6 + 20 + 14 + 22), 'bass-hit-short', 0.32],
  [at('brand', 40), 'light-transition-magic', 0.3],
  [at('brand', 45), 'impact-deep-whoosh', 0.5],
  [at('brand', 62), 'sparkle-touch', 0.3],
  [sceneOf('cta').from + 8 + wordAt('cta', 3) - 4 + 22, 'switch-tap', 0.5],
];

const duck = (f: number) => Math.max(0, ...LINES.map((l) => interpolate(f, [l.at - 8, l.at, l.at + vlen(l.id), l.at + vlen(l.id) + 8], [0, 1, 1, 0], CL)));

export const AdSound: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <>
    {LINES.map((l) => (
      <Sequence key={l.id} from={l.at} durationInFrames={vlen(l.id) + 4} name={`voix : ${l.id}`}>
        <Audio src={staticFile(`vo/${l.id}.wav`)} />
      </Sequence>
    ))}
    {bgm ? <Audio src={staticFile('audio/house-vibez.mp3')} volume={(f) => (0.3 - 0.19 * duck(f)) * interpolate(f, [0, 12, TOTAL - 30, TOTAL], [0, 1, 1, 0], CL)} /> : null}
    {CUES.map(([peak, src, vol], i) => {
      const from = Math.max(0, Math.round(peak - M[src].peakLag - 1.25));
      const dur = Math.min(M[src].len + 2, TOTAL - from);
      return (
        <Sequence key={i} from={from} durationInFrames={dur} name={src}>
          <Audio src={staticFile(`audio/${src}.mp3`)} volume={(f) => vol * interpolate(f, [dur - 10, dur], [1, 0], CL)} />
        </Sequence>
      );
    })}
  </>
);
