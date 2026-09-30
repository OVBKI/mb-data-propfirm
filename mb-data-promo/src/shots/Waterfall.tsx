// Plan 9 — page-waterfall-wall, avec le composant VerticalTicker du skill (repris
// tel quel) : 3 colonnes de VRAIES pages sur un mur incliné (rotateX 20°,
// perspective 1000, scale 1,2), boucles 12 / 9 / 14 s, colonne centrale à
// contre-sens — le parallaxe qui fait lire « trois colonnes » et non « une image
// qui défile ». Push 1 → 1,06 sur toute la durée. Toutes les pages non encore
// montrées sont ici : calendrier éco, alertes, import CSV, plan de trading,
// réglages, landing, journal, fiches firmes, simulateur, tarifs…
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { VerticalTicker, TickerColumn } from '../lib/VerticalTicker';
import { tex } from '../lib/tex';
import { Caption } from '../lib/Caption';
import { C } from '../brand';

const shot = (id: string) => (
  <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', border: `1px solid ${C.border}` }}>
    <Img src={tex(id)} style={{ width: '100%', display: 'block' }} />
  </div>
);
const COLS: TickerColumn[] = [
  { items: ['calendar', 'alerts', 'import-lab', 'settings'].map(shot), durationInSeconds: 12, direction: -1 },
  { items: ['myrules', 'journal', 'landing', 'compare'].map(shot), durationInSeconds: 9, direction: 1 },
  { items: ['firm-apex', 'dd-simulator', 'pricing', 'heatmaps'].map(shot), durationInSeconds: 14, direction: -1 },
];

export const Waterfall: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, dur], [1, 1.06]);
  const inBlur = interpolate(f, [0, 12], [8, 0], { extrapolateRight: 'clamp' });
  const inOp = interpolate(f, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const out = interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, filter: inBlur > 0 ? `blur(${inBlur}px)` : undefined, opacity: inOp * out }}>
        <VerticalTicker columns={COLS} backgroundColor={C.bg} columnWidth={560} gap={30} />
      </AbsoluteFill>
      <Caption eyebrow="Et tout le reste" text="Calendrier éco, alertes, import CSV, plan de trading, réglages…" dur={dur - 6} delay={12} />
    </AbsoluteFill>
  );
};
