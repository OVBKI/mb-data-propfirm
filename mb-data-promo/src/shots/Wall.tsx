// Plan 4 — steep-tilt-glide, d'après SteepTiltGlide.tsx : caméra FIXE, la page
// dressée à -60° (bord droit proche, gauche au point de fuite) glisse seule le
// long de son propre plan (seule grandeur animée : translateX local). Courbe
// bezier(0.3,0.12,0.72,0.9) — démarrage doux, fin sans arrêt mort ; fantômes
// ∝ vitesse (f-2,5 / f-5) ; panneau qui passe du sombre au clair en ~1,4 s ;
// titres qui flottent puis se posent (FloatWrap) au fil du défilement.
// Le « mur » est une vraie bande : Health Center | Analytics | Heatmaps.
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from 'remotion';
import { tex } from '../lib/tex';
import { Caption } from '../lib/Caption';
import type { Cap } from '../lib/format';
import { TunnelIn } from '../lib/TunnelIn';
import { TunnelOut } from '../lib/TunnelOut';
import { C, F } from '../brand';

const PAGES = [
  { id: 'health', label: 'Health Center' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'heatmaps', label: 'Heatmaps' },
];
const GAP = 80;
const PW = PAGES.length * 1920 + (PAGES.length - 1) * GAP;
const PH = 1080;
const easeFall = Easing.bezier(0.5, 0.05, 0.6, 1);
const liftOf = (t: number, land: number, H = 230) => {
  const FALL = 0.32;
  const p = Math.min(1, Math.max(0, (t - (land - FALL)) / FALL));
  return (1 - easeFall(p)) * H;
};
const FloatWrap: React.FC<{ h: number; children: React.ReactNode }> = ({ h, children }) => (
  <div style={{ position: 'relative' }}>
    {h > 2 && (
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${h * 0.24}px, ${h * 0.46}px) scale(${1 + h * 0.0009})`, filter: `blur(${5 + h * 0.075}px) brightness(0.2)`, opacity: Math.min(0.5, 0.2 + h * 0.0016) }}>{children}</div>
    )}
    <div style={{ transform: `translate(${-h * 0.34}px, ${-h * 0.8}px)` }}>{children}</div>
  </div>
);

const Panel: React.FC<{ shade: number; t: number }> = ({ shade, t }) => (
  <div style={{ width: PW, height: PH, position: 'relative', borderRadius: 40, overflow: 'hidden', boxShadow: '0 0 220px rgba(90,176,255,0.18)' }}>
    {PAGES.map((p, i) => (
      <div key={p.id} style={{ position: 'absolute', left: i * (1920 + GAP), top: 0, width: 1920, height: PH, borderRadius: 32, overflow: 'hidden', border: `2px solid ${C.border}` }}>
        <Img src={tex(p.id)} style={{ width: 1920, height: 1080 }} />
      </div>
    ))}
    {PAGES.map((p, i) => (
      <div key={p.label} style={{ position: 'absolute', left: i * (1920 + GAP) + 330, top: 170 }}>
        <FloatWrap h={liftOf(t, 0.3 + i * 0.28, 260)}>
          <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 150, color: C.text, letterSpacing: '-0.02em', whiteSpace: 'nowrap', textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}>{p.label}</div>
        </FloatWrap>
      </div>
    ))}
    <div style={{ position: 'absolute', inset: 0, background: '#050a12', opacity: shade }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,10,18,0.9), rgba(5,10,18,0) 42%)', opacity: Math.min(1, shade * 1.6) }} />
  </div>
);

const CAM = { persp: 1100, origin: '30% 58%', rotY: -60, rotZ: -2, left: '40%', top: '12%', scale: 1.05 };
const Layer: React.FC<{ lx: number; shade: number; opacity: number; t: number }> = ({ lx, shade, opacity, t }) => (
  <AbsoluteFill style={{ opacity }}>
    <AbsoluteFill style={{ perspective: CAM.persp, perspectiveOrigin: CAM.origin }}>
      <div style={{ position: 'absolute', left: CAM.left, top: CAM.top, transform: `rotateY(${CAM.rotY}deg) rotateZ(${CAM.rotZ}deg)`, transformOrigin: 'left top' }}>
        <div style={{ transform: `scale(${CAM.scale}) translateX(${lx}px)`, transformOrigin: 'left top' }}>
          <Panel shade={shade} t={t} />
        </div>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const glide = Easing.bezier(0.3, 0.12, 0.72, 0.9);
  const lxAt = (x: number) => interpolate(interpolate(x, [0, 128], [0, 1], { easing: glide, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), [0, 1], [60, -(PW - 1250)]);
  const lx = lxAt(f);
  const shade = interpolate(f, [0, 18, 44], [0.7, 0.4, 0], { extrapolateRight: 'clamp' });
  const speed = Math.abs(lxAt(f - 1) - lxAt(f + 1)) / 2;
  const g1 = Math.min(0.42, speed * 0.03), g2 = Math.min(0.22, speed * 0.016);
  const drop = interpolate(f, [4, 118], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const glow = interpolate(f, [14, 70], [0.15, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#050a12' }}>
      <AbsoluteFill style={{ opacity: glow, background: 'radial-gradient(ellipse 40% 50% at 20% 66%, rgba(90,176,255,0.22), transparent 70%)' }} />
      {g2 > 0.02 && <Layer lx={lxAt(f - 5)} shade={shade} opacity={g2} t={drop} />}
      {g1 > 0.02 && <Layer lx={lxAt(f - 2.5)} shade={shade} opacity={g1} t={drop} />}
      <Layer lx={lx} shade={shade} opacity={1} t={drop} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 105% 95% at 55% 42%, transparent 60%, rgba(3,6,12,0.3) 85%, rgba(2,4,8,0.55) 100%)' }} />
    </AbsoluteFill>
  );
};

export const Wall: React.FC<{ dur: number }> = ({ dur }) => (
  <TunnelOut dur={dur}>
    <TunnelIn><Scene /></TunnelIn>
    {caps(dur).map((c, i) => <Caption key={i} {...c} />)}
  </TunnelOut>
);

// Sous-titres du plan : posés ici en 16:9, recomposés par src/vertical/ en 9:16.
export const caps = (dur: number): Cap[] => [
  { eyebrow: 'Analyse', text: 'Drawdown, consistance, heatmaps — en temps réel.', dur: dur - 12, delay: 20 },
];
