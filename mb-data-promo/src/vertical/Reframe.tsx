// Reframe.tsx — filme une scène 16:9 dans le cadre 9:16. La scène garde sa
// taille de travail (1920×1080) et passe par la propriété CSS `zoom`, pas par
// scale() : Chromium la rastérise au grossissement final, le texte reste net
// (règle Q2). Les bords haut/bas de la bande sont fondus dans le fond Abyss.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { FormatCtx } from '../lib/format';
import { C } from '../brand';
import type { FrameKey } from './framing';

export const VW = 1080, VH = 1920;
/** Centre vertical de la bande image : sous les sous-titres, au-dessus de l'interface TikTok. */
export const BAND_Y = 1000;
const EASE = Easing.bezier(0.45, 0, 0.2, 1);

export const frameAt = (keys: FrameKey[], f: number) => {
  if (keys.length === 1 || f <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f <= b.f) {
      const t = a.f === b.f ? 1 : interpolate(f, [a.f, b.f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });
      return { f, s: a.s + (b.s - a.s) * t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return keys[keys.length - 1];
};

export const Reframe: React.FC<{ keys: FrameKey[]; children: React.ReactNode }> = ({ keys, children }) => {
  const { s, x, y } = frameAt(keys, useCurrentFrame());
  const top = BAND_Y - 540 * s, bottom = BAND_Y + 540 * s;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${VW / 2 - x * s}px, ${BAND_Y - y * s}px)` }}>
        <div style={{ position: 'relative', width: 1920, height: 1080, zoom: s, overflow: 'hidden' }}>
          <FormatCtx.Provider value="v">{children}</FormatCtx.Provider>
        </div>
      </div>
      {/* fondu des bords de bande */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top + 140, background: `linear-gradient(180deg, ${C.bg} 0, ${C.bg} ${top}px, rgba(10,20,32,0) ${top + 140}px)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: bottom - 140, bottom: 0, background: `linear-gradient(180deg, rgba(10,20,32,0) 0, ${C.bg} 140px)` }} />
    </AbsoluteFill>
  );
};
