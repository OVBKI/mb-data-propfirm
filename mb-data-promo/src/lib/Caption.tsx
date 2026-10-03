// Caption.tsx — sous-titre narratif. Règle Q11 du skill : ≥ 56 px pour ce qu'on
// doit LIRE (ici 60), ≥ 32 px pour le secondaire (surtitre mono 30→ 34). Voile
// sombre sous le texte pour qu'il tienne sur n'importe quelle capture.
import React, { useContext } from 'react';
import { FormatCtx } from './format';
import { interpolate, useCurrentFrame, Easing } from 'remotion';
import { C, F } from '../brand';

export const Caption: React.FC<{ eyebrow?: string; text: React.ReactNode; dur: number; delay?: number; align?: 'center' | 'left'; bottom?: number }> = ({ eyebrow, text, dur, delay = 0, align = 'center', bottom = 70 }) => {
  const fmt = useContext(FormatCtx);
  const f = useCurrentFrame() - delay;
  const inT = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0, 0, 0.2, 1) });
  const outT = interpolate(f, [dur - delay - 10, dur - delay], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const o = inT * outT;
  if (fmt === 'v') return null; // en vertical, src/vertical/VCaptions les pose
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, pointerEvents: 'none', opacity: o }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,20,32,0) 0%, rgba(10,20,32,0.78) 55%, rgba(10,20,32,0.92) 100%)' }} />
      <div style={{
        position: 'absolute', left: align === 'center' ? 0 : 120, right: align === 'center' ? 0 : undefined, bottom,
        display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: 16,
        transform: `translateY(${(1 - inT) * 18}px)`,
      }}>
        {eyebrow ? (
          <div style={{ fontFamily: F.mono, fontSize: 32, letterSpacing: '0.2em', color: C.brass, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 34, height: 2, background: C.brass, display: 'inline-block' }} />{eyebrow}
          </div>
        ) : null}
        <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 60, lineHeight: 1.12, color: C.text, letterSpacing: '-0.01em', textAlign: align, maxWidth: 1600, textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}>{text}</div>
      </div>
    </div>
  );
};
