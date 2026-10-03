// VCaptions.tsx — les mêmes sous-titres qu'en 16:9, recomposés pour un téléphone :
// en haut du cadre (la zone basse est couverte par l'interface TikTok / Reels /
// Shorts), texte 68 px équilibré sur 2–3 lignes, surtitre mono 32 px (Q11).
import React from 'react';
import { interpolate, useCurrentFrame, Easing } from 'remotion';
import { C, F } from '../brand';
import type { Cap } from '../lib/format';

export const CAP_TOP = 250;

const One: React.FC<Cap> = ({ eyebrow, text, delay, dur }) => {
  const f = useCurrentFrame() - delay;
  const inT = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0, 0, 0.2, 1) });
  const outT = interpolate(f, [dur - delay - 10, dur - delay], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const o = inT * outT;
  if (o <= 0) return null;
  return (<>
    {/* voile : quand la caméra cadre serré, la page remonte sous le texte */}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 660, background: 'linear-gradient(180deg, rgba(10,20,32,0.94) 0%, rgba(10,20,32,0.82) 62%, rgba(10,20,32,0) 100%)', opacity: o }} />
    <div style={{ position: 'absolute', left: 70, right: 70, top: CAP_TOP, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: o, transform: `translateY(${(1 - inT) * 22}px)` }}>
      {eyebrow ? (
        <div style={{ fontFamily: F.mono, fontSize: 32, lineHeight: 1.35, letterSpacing: '0.14em', color: C.brass, textTransform: 'uppercase', textAlign: 'center', textWrap: 'balance' }}>{eyebrow}</div>
      ) : null}
      <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 68, lineHeight: 1.1, color: C.text, letterSpacing: '-0.01em', textAlign: 'center', textWrap: 'balance', textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}>{text}</div>
    </div>
  </>);
};

export const VCaptions: React.FC<{ caps: Cap[] }> = ({ caps }) => <>{caps.map((c, i) => <One key={i} {...c} />)}</>;
