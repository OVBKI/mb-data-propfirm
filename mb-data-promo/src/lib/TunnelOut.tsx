// TunnelOut.tsx — moitié « sortie » de la couture B : sur les `len` dernières
// frames le plan file vers la gauche (même sens que l'entrée suivante) sous un
// voile sombre qui garde le halo — jamais de noir mort.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { C } from '../brand';

export const TunnelOut: React.FC<{ dur: number; len?: number; children: React.ReactNode }> = ({ dur, len = 12, children }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - len, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.2, 1) });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ transform: out > 0 ? `translateX(${-1920 * out}px)` : undefined }}>{children}</AbsoluteFill>
      {out > 0 ? <AbsoluteFill style={{ background: C.bg, opacity: out * 0.85 }} /> : null}
    </AbsoluteFill>
  );
};
