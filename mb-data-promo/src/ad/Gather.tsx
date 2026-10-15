// Gather.tsx — « Avec Quantara, tes comptes sont réunis dans un seul dashboard. »
// Cinq pastilles de comptes (ceux du trader fictif) arrivent dispersées ; sur
// « Quantara » le logo entre ; sur « réunis » elles convergent et plongent dans le
// dashboard, qui se redresse (rotateX 24° → 0) ; sur « dashboard » un liseré bronze
// en fait le tour. Sortie : poussée dans le dashboard + creux sombre, vers le plan
// suivant qui repart du même dashboard.
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { C, F, HALO } from '../brand';
import { tex } from '../lib/tex';
import { wordAt } from './timeline';

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ACC = [['TS 50K #1', C.green], ['Apex EOD 50K', C.red], ['Tradeify Select 100K', C.green], ['MFFU Rapid 50K', C.amber], ['LucidFlex 50K', C.green]] as const;
const VO = 8; // la réplique démarre à la frame 8 de la scène (timeline.ts)

export const Gather: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vert = height > width;
  const W = vert ? 1080 : 1920;
  const at = (i: number) => VO + wordAt('promise', i);
  const logo = interpolate(f, [at(1) - 4, at(1) + 8], [0, 1], { ...CL, easing: Easing.bezier(0.2, 0.9, 0.3, 1.1) });
  const conv = interpolate(f, [at(5) - 8, at(5) + 12], [0, 1], { ...CL, easing: Easing.bezier(0.5, 0, 0.2, 1) });
  const rise = interpolate(f, [at(4) - 6, at(5) + 18], [0, 1], { ...CL, easing: Easing.bezier(0.2, 0, 0, 1) });
  const ring = interpolate(f, [at(9) - 2, at(9) + 18], [0, 1], CL);
  const out = interpolate(f, [dur - 10, dur], [0, 1], { ...CL, easing: Easing.in(Easing.cubic) });
  // le dashboard
  const dW = vert ? 1000 : 1240, dH = dW * 9 / 16;
  const dC = vert ? [540, 1080] : [960, 600];
  const logoY = vert ? 640 : 150;
  // pastilles : positions de départ dispersées, cible = centre du dashboard
  const SPOTS = vert
    ? [[250, 760], [820, 820], [200, 1420], [860, 1360], [540, 1560]]
    : [[330, 330], [1590, 300], [300, 720], [1620, 700], [960, 820]];
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: HALO }} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.35 * out})`, opacity: 1 - out }}>
        {/* dashboard */}
        <div style={{ position: 'absolute', left: dC[0] - dW / 2, top: dC[1] - dH / 2, width: dW, height: dH, perspective: 1600 }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: 18, overflow: 'hidden', position: 'relative',
            transform: `translateY(${(1 - rise) * 260}px) rotateX(${24 * (1 - rise)}deg) scale(${0.86 + 0.14 * rise})`, transformOrigin: '50% 100%',
            opacity: rise, boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(241,217,154,${0.25 + 0.5 * ring * (1 - ring)})`,
          }}>
            <Img src={tex('dashboard')} style={{ width: '100%', height: '100%', display: 'block' }} />
            {ring > 0 && ring < 1 ? (
              <svg viewBox={`0 0 ${dW} ${dH}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
                <rect x={2} y={2} width={dW - 4} height={dH - 4} rx={16} fill="none" stroke={C.brassLight} strokeWidth={4} pathLength={1} strokeDasharray="0.18 1" strokeDashoffset={-ring} style={{ filter: `drop-shadow(0 0 10px ${C.brass})` }} />
              </svg>
            ) : null}
          </div>
        </div>
        {/* pastilles de comptes */}
        {ACC.map(([name, dot], i) => {
          const tin = interpolate(f, [2 + i * 3, 14 + i * 3], [0, 1], { ...CL, easing: Easing.bezier(0.2, 0.9, 0.3, 1.1) });
          const [x0, y0] = SPOTS[i];
          const x = x0 + (dC[0] - x0) * conv, y = y0 + (dC[1] - y0) * conv;
          const float = Math.sin((f + i * 11) / 14) * 6 * (1 - conv);
          return (
            <div key={name} style={{ position: 'absolute', left: x, top: y + float, transform: `translate(-50%,-50%) scale(${(0.7 + 0.3 * tin) * (1 - 0.6 * conv)})`, opacity: tin * (1 - interpolate(conv, [0.75, 1], [0, 1], CL)), zIndex: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: vert ? '16px 24px' : '14px 22px', borderRadius: 99, background: 'rgba(22,34,47,0.95)', border: `1px solid ${C.border}`, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', fontFamily: F.ui, fontWeight: 500, fontSize: vert ? 38 : 34, color: C.text, whiteSpace: 'nowrap' }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: dot }} />{name}
              </div>
            </div>
          );
        })}
        {/* logo */}
        <div style={{ position: 'absolute', left: 0, width: W, top: logoY, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: logo, transform: `translateY(${(1 - logo) * 30}px) scale(${1.15 - 0.15 * logo})` }}>
          <Img src={staticFile('quantara-logo.webp')} style={{ width: vert ? 96 : 92, height: vert ? 96 : 92, filter: 'drop-shadow(0 0 20px rgba(90,176,255,0.5))' }} />
          <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: vert ? 96 : 92, color: C.text, letterSpacing: '-0.01em' }}>Quantara</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
