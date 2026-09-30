// Plan 3 — beat-cut-moves A (递进硬切串), d'après BeatCutAccelerando.tsx :
// six vues du MÊME dashboard (les quatre onglets réels + deux cadrages serrés),
// coupes sèches à 0/49/65/77/85/91 (intervalles 16→12→8→6→4), dernière coupe à 95
// qui revient sur la vue principale, push 1→1,06 puis tenue ≥ 35 f.
// Aucun fondu : une coupe = une frame. Chaque coupe a son 1 f de « déclic »
// (brightness 1.05 + 6 % de blanc), pas plus.
import React from 'react';
import { AbsoluteFill, Img, Easing, interpolate, useCurrentFrame } from 'remotion';
import { tex } from '../lib/tex';
import { Caption } from '../lib/Caption';
import { TunnelOut } from '../lib/TunnelOut';
import { C } from '../brand';

type View = { id: string; scale: number; cx: number; cy: number };
const VIEWS: View[] = [
  { id: 'dashboard', scale: 1, cx: 960, cy: 540 },
  { id: 'dash-performance', scale: 1, cx: 960, cy: 540 },
  { id: 'dash-performance', scale: 1.8, cx: 1140, cy: 300 },
  { id: 'dash-payouts', scale: 1, cx: 960, cy: 540 },
  { id: 'dash-risk', scale: 1, cx: 960, cy: 540 },
  { id: 'dash-risk', scale: 1.9, cx: 1400, cy: 250 },
];
export const CUTS = [0, 49, 65, 77, 85, 91, 95];
const FINAL = 95;

const Shot: React.FC<{ v: View; extra: number }> = ({ v, extra }) => (
  <div style={{ width: 1920, height: 1080, transformOrigin: `${v.cx}px ${v.cy}px`, transform: `translate(${960 - v.cx}px, ${540 - v.cy}px) scale(${v.scale * extra})` }}>
    <Img src={tex(v.id)} style={{ width: 1920, height: 1080 }} />
  </div>
);

export const Tabs: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  let seg = 0; for (let i = 0; i < CUTS.length; i++) if (f >= CUTS[i]) seg = i;
  const isFinal = seg === CUTS.length - 1;
  const v = isFinal ? VIEWS[0] : VIEWS[seg];
  const push = isFinal ? interpolate(f, [FINAL, FINAL + 20], [1, 1.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }) : 1;
  const cut = CUTS.some((c, i) => i > 0 && f === c);
  return (
    <TunnelOut dur={dur}>
      <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, filter: cut ? 'brightness(1.05)' : undefined }}><Shot v={v} extra={push} /></div>
        {cut ? <AbsoluteFill style={{ background: '#fff', opacity: 0.06 }} /> : null}
        <Caption eyebrow="Vue d'ensemble · Performance · Payouts · Risque" text="Quatre vues. Un seul dashboard." dur={dur} delay={FINAL + 2} />
      </AbsoluteFill>
    </TunnelOut>
  );
};
