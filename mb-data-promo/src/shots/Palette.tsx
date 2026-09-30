// Plan 5 — crash-zoom-punch, variante rebond, d'après CrashZoomReal.tsx :
// tenue ≥ 30 f sur le plan large → poussée 6 f ease-in (zoom 1 → 2,2) → rebond
// 5 f (2,2 → 2,1) → tenue réelle. Flou de bougé UNIQUEMENT sur la poussée.
// La cible est la vraie palette ⌘K en découpe ×3 (Q2).
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from 'remotion';
import { tex, box } from '../lib/tex';
import { Caption } from '../lib/Caption';
import { TunnelIn } from '../lib/TunnelIn';
import { C } from '../brand';

const B = box('cut-palette');
const T = { cx: B.x + B.w / 2, cy: B.y + B.h / 2 };
const P0 = 35;
const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Scene: React.FC<{ at?: number; opacity?: number }> = ({ at, opacity = 1 }) => {
  const f = at ?? useCurrentFrame();
  const zoom = interpolate(f, [P0, P0 + 6, P0 + 11], [1, 2.2, 2.1], { ...CL, easing: Easing.bezier(0.55, 0, 0.7, 1) });
  const cx = interpolate(f, [P0, P0 + 6], [960, T.cx], { ...CL, easing: Easing.in(Easing.quad) });
  const cy = interpolate(f, [P0, P0 + 6], [540, T.cy + 40], { ...CL, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill style={{ background: opacity < 1 ? 'transparent' : C.bg, overflow: 'hidden', opacity }}>
      <div style={{ position: 'absolute', width: 1920, height: 1080, transform: `translate(${960 - cx * zoom}px, ${540 - cy * zoom}px) scale(${zoom})`, transformOrigin: '0 0' }}>
        <Img src={tex('palette')} style={{ position: 'absolute', width: 1920, height: 1080 }} />
        <Img src={tex('cut-palette')} style={{ position: 'absolute', left: B.x, top: B.y, width: B.w, height: B.h }} />
      </div>
    </AbsoluteFill>
  );
};

export const Palette: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <TunnelIn>
        <Scene />
        {/* traînée de la poussée : positions passées (f-1, f-2) en calques légers,
            uniquement pendant les 6 f de crash-zoom */}
        {f >= P0 + 1 && f <= P0 + 6 ? <><Scene at={f - 2} opacity={0.18} /><Scene at={f - 1} opacity={0.28} /></> : null}
      </TunnelIn>
      <Caption eyebrow="Recherche ⌘K" text="N'importe quel compte, en une touche." dur={dur} delay={P0 + 14} />
    </AbsoluteFill>
  );
};
