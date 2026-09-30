// TunnelIn.tsx — moitié « entrée » de la couture B (穿暗场直航) : la scène suivante
// arrive de la droite dans le MÊME sens que la sortie précédente (vers la gauche),
// en grossissant de 0.6 à 1 et en faisant le point (flou 12 → 0). Poussières
// dérivantes pour que le passage sombre reste « en mouvement ».
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { C } from '../brand';

export const TUNNEL_IN = 14;
export const TunnelIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, TUNNEL_IN], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const dust = interpolate(f, [0, TUNNEL_IN], [1, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ transform: `translateX(${(1 - t) * 960}px) scale(${0.6 + 0.4 * t})`, filter: t < 1 ? `blur(${(1 - t) * 12}px)` : undefined, transformOrigin: '50% 45%' }}>
        {children}
      </AbsoluteFill>
      {dust > 0 && [0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: 'absolute', left: 780 + i * 320 - f * (6 + (i % 3) * 4), top: 300 + ((i * 137) % 480), width: 2, height: 2, borderRadius: '50%', background: 'rgba(159,179,200,0.45)', opacity: dust }} />
      ))}
    </AbsoluteFill>
  );
};
