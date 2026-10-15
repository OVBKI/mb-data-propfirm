// Ad.tsx — la pub de campagne (≈ 30 s), en 16:9 et en 9:16 selon la taille de la
// composition. Trois scènes sont propres à la pub (accroche, rassemblement, appel à
// l'action) et dessinées pour les deux formats ; quatre plans viennent du film,
// rognés sur leur temps fort et, en vertical, filmés par la caméra de framing.ts.
// Leurs propres sous-titres sont coupés : seuls ceux de la voix off s'affichent.
import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { Fonts } from '../lib/Fonts';
import { CaptionsCtx } from '../lib/format';
import { C, F } from '../brand';
import { Reframe } from '../vertical/Reframe';
import { FRAMING } from '../vertical/framing';
import { Spotlight } from '../shots/Spotlight';
import { Replicate } from '../shots/Replicate';
import { Brake } from '../shots/Brake';
import { Odometer } from '../shots/Odometer';
import { Outro } from '../shots/Outro';
import { Hook } from './Hook';
import { Gather } from './Gather';
import { EndCard } from './EndCard';
import { Subs } from './Subs';
import { AdSound } from './AdSound';
import { SCENES, SceneId } from './timeline';

const Brand: React.FC<{ dur: number }> = ({ dur }) => <Outro dur={dur} tag="Le dashboard des traders PropFirm" />;
const OWN: Partial<Record<SceneId, React.FC<{ dur: number }>>> = { hook: Hook, gather: Gather, cta: EndCard };
const FILM: Partial<Record<SceneId, { C: React.FC<{ dur: number }>; frame: keyof typeof FRAMING }>> = {
  risk: { C: Spotlight, frame: 'spot' },
  replicate: { C: Replicate, frame: 'replicate' },
  brake: { C: Brake, frame: 'brake' },
  odometer: { C: Odometer, frame: 'odometer' },
  brand: { C: Brand, frame: 'outro' },
};
// les plans du film affichent des chiffres de démonstration : on le dit
const DEMO: SceneId[] = ['gather', 'risk', 'replicate'];

export const Ad: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const { width, height } = useVideoConfig();
  const vert = height > width;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Fonts />
      <AdSound bgm={bgm} />
      <CaptionsCtx.Provider value={false}>
        {SCENES.map((s) => {
          const Own = OWN[s.id], film = FILM[s.id], trim = s.trim ?? 0;
          return (
            <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
              {Own ? <Own dur={s.dur} /> : null}
              {film ? (
                <Sequence from={-trim}>
                  {vert ? <Reframe keys={FRAMING[film.frame]}><film.C dur={trim + s.dur} /></Reframe> : <film.C dur={trim + s.dur} />}
                </Sequence>
              ) : null}
              {DEMO.includes(s.id) ? (
                <div style={{ position: 'absolute', ...(vert ? { left: 60, top: 190 } : { right: 40, top: 30 }), fontFamily: F.mono, fontSize: 22, color: C.text2, opacity: 0.75, letterSpacing: '0.04em' }}>Données de démonstration</div>
              ) : null}
            </Sequence>
          );
        })}
      </CaptionsCtx.Provider>
      <Subs />
    </AbsoluteFill>
  );
};
