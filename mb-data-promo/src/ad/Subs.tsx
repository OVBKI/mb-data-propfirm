// Subs.tsx — sous-titres de la voix off, mot à mot (la plupart des pubs sont vues
// sans le son). Mot en cours : bronze ; mots à venir : atténués. 16:9 : en bas,
// 56 px ; 9:16 : en haut du cadre, 66 px (le bas est couvert par l'interface).
import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, F } from '../brand';
import WORDS from '../vo-words.json';
import META from '../vo-meta.json';
import { LINES } from './timeline';

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
type W = [string, number, number][];

export const Subs: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vert = height > width;
  return (
    <>
      {LINES.filter((l) => l.subs).map((l) => {
        const len = (META as Record<string, { frames: number }>)[l.id].frames;
        const o = interpolate(f, [l.at - 4, l.at + 2, l.at + len + 6, l.at + len + 12], [0, 1, 1, 0], CL);
        if (o <= 0) return null;
        const words = (WORDS as unknown as Record<string, W>)[l.id];
        const rel = f - l.at;
        return (
          <div key={l.id} style={{ position: 'absolute', left: 0, right: 0, ...(vert ? { top: 0, height: 640 } : { bottom: 0, height: 300 }), opacity: o, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: 0, background: vert ? 'linear-gradient(180deg, rgba(10,20,32,0.92) 0%, rgba(10,20,32,0.75) 60%, rgba(10,20,32,0) 100%)' : 'linear-gradient(180deg, rgba(10,20,32,0) 0%, rgba(10,20,32,0.8) 55%, rgba(10,20,32,0.92) 100%)' }} />
            <div style={{ position: 'absolute', left: vert ? 70 : 160, right: vert ? 70 : 160, ...(vert ? { top: 250 } : { bottom: 64 }), textAlign: 'center', fontFamily: F.ui, fontWeight: 600, fontSize: vert ? 66 : 56, lineHeight: 1.18, letterSpacing: '-0.01em', textWrap: 'balance', textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}>
              {words.map(([w, s], i) => {
                const next = i + 1 < words.length ? words[i + 1][1] : len;
                const state = rel < s ? 0 : rel < Math.max(next, s + 4) ? 1 : 2;
                return <span key={i} style={{ color: state === 1 ? C.brassLight : C.text, opacity: state === 0 ? 0.42 : 1 }}>{w}{i < words.length - 1 ? ' ' : ''}</span>;
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};
