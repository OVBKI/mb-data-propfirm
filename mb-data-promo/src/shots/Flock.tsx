// Plan 10 — card-flock-tumble, d'après CardFlockTumble.tsx (v5) : trois VRAIES
// pages publiques (comparateur, simulateur de drawdown, tarifs) partent de la
// tranche (≈90°), tournoient et se posent en escalier sur UNE spline Catmull-Rom
// continue (aucune cassure de vitesse), ne s'arrêtent jamais (dérive lente
// jusqu'à l'aspiration), puis sont aspirées au centre en 10 f ease-in, un seul
// anneau de fumée turbulent s'ouvre et le mot géant traverse l'écran.
// Zéro flou sur les cartes (verdict de la carte). Couleurs : bronze → bleu Abyss.
import React, { useId } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, interpolate, Easing } from 'remotion';
import { tex } from '../lib/tex';
import { C, F } from '../brand';
import { TunnelOut } from '../lib/TunnelOut';

const WALL_UP = [6, 22] as const, FLIGHT = [10, 54] as const, CARD_OUT = [62, 72] as const;
const RING_T0 = 70, TEXT_T0 = 84;
const ROWS = ['COMPARATEUR', 'SIMULATEUR', 'TARIFS'];
const ROW_GRADS: [string, string][] = [[C.brassLight, C.blue], [C.brass, C.violet], [C.brassLight, C.blue]];

const Wall: React.FC<{ f: number }> = ({ f }) => {
  const up = interpolate(f, [WALL_UP[0], WALL_UP[1]], [0.12, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(f, [CARD_OUT[0], CARD_OUT[1] + 4], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const blurOut = interpolate(f, [CARD_OUT[0], CARD_OUT[1] + 4], [0, 26], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (out <= 0.01) return null;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', opacity: up * out, filter: `blur(${blurOut}px)` }}>
      {ROWS.map((w, row) => (
        <div key={row} style={{ position: 'absolute', top: -140 + row * 380, left: 0, whiteSpace: 'nowrap', fontFamily: F.ui, fontWeight: 700, fontSize: 300, letterSpacing: 6, transform: `translateX(${(row % 2 === 0 ? -1 : 1) * f * 2 - 600}px)` }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ marginRight: 70, color: 'transparent', WebkitTextStroke: `3px ${ROW_GRADS[row][i % 2]}`, filter: `drop-shadow(0 0 16px ${ROW_GRADS[row][i % 2]})`, opacity: 0.45 }}>{w}</span>
          ))}
        </div>
      ))}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,10,18,0.8) 85%)' }} />
    </AbsoluteFill>
  );
};

const Card: React.FC<{ id: string }> = ({ id }) => (
  <div style={{ width: 640, height: 360, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(241,217,154,0.35)', boxShadow: '0 0 60px rgba(90,176,255,0.25), 0 22px 60px rgba(0,0,0,0.6)' }}>
    <Img src={tex(id)} style={{ width: 640, height: 360, display: 'block' }} />
  </div>
);

const SmokeRing: React.FC<{ f: number }> = ({ f }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const t = f - RING_T0;
  if (t < 0) return null;
  const grow = Easing.out(Easing.cubic)(Math.min(1, t / 52));
  const R = 46 + 330 * grow + Math.max(0, t - 52) * 1.6;
  const op = interpolate(t, [0, 5, 30, 60], [0, 1, 0.92, 0.72], { extrapolateRight: 'clamp' });
  const w = R * interpolate(t, [0, 52], [0.36, 0.27], { extrapolateRight: 'clamp' });
  const disp = 60 + grow * 90;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <filter id={`sA${uid}`} x="-60%" y="-60%" width="220%" height="220%"><feTurbulence type="fractalNoise" baseFrequency="0.013 0.016" numOctaves={4} seed={11} result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale={disp} xChannelSelector="R" yChannelSelector="G" /></filter>
          <filter id={`sB${uid}`} x="-60%" y="-60%" width="220%" height="220%"><feTurbulence type="fractalNoise" baseFrequency="0.021 0.018" numOctaves={4} seed={37} result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale={disp * 0.85} xChannelSelector="R" yChannelSelector="G" /></filter>
          <filter id={`sC${uid}`} x="-60%" y="-60%" width="220%" height="220%"><feTurbulence type="fractalNoise" baseFrequency="0.019 0.023" numOctaves={3} seed={73} result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale={disp * 1.1} xChannelSelector="R" yChannelSelector="G" /></filter>
          <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsla(40 70% 78% / 0.85)" />
            <stop offset="40%" stopColor="hsla(38 45% 62% / 0.8)" />
            <stop offset="100%" stopColor="hsla(208 85% 66% / 0.8)" />
          </linearGradient>
        </defs>
        <g transform={`rotate(${t * 0.35} 960 540)`} opacity={op}>
          <g style={{ filter: `url(#sA${uid})` }}><circle cx={960} cy={540} r={R} fill="none" stroke="hsla(208 60% 60% / 0.24)" strokeWidth={w * 1.9} style={{ filter: 'blur(22px)' }} /></g>
          <g style={{ filter: `url(#sA${uid})` }}><circle cx={960} cy={540} r={R} fill="none" stroke={`url(#g${uid})`} strokeWidth={w} style={{ filter: 'blur(9px)' }} opacity={0.85} /></g>
          <g style={{ filter: `url(#sB${uid})` }}><circle cx={960} cy={540} r={R * 0.99} fill="none" stroke="hsla(42 80% 86% / 0.55)" strokeWidth={w * 0.45} style={{ filter: 'blur(6px)' }} /></g>
          <g style={{ filter: `url(#sC${uid})` }}><circle cx={960} cy={540} r={R * 1.005} fill="none" stroke="hsla(215 45% 8% / 0.34)" strokeWidth={w * 0.4} style={{ filter: 'blur(7px)' }} /></g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

type Pose = { x: number; y: number; rx: number; ry: number; rz: number; s: number };
const KEYS: (keyof Pose)[] = ['x', 'y', 'rx', 'ry', 'rz', 's'];
const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) => { const t2 = t * t, t3 = t2 * t; return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); };
const spline = (k: Pose[], u: number): Pose => {
  const seg = u < 0.55 ? 0 : 1, lt = seg === 0 ? u / 0.55 : (u - 0.55) / 0.45; const o = {} as Pose;
  for (const key of KEYS) o[key] = catmull(k[Math.max(0, seg - 1)][key], k[seg][key], k[seg + 1][key], k[Math.min(2, seg + 2)][key], lt);
  return o;
};
const lerpPose = (a: Pose, b: Pose, t: number): Pose => { const o = {} as Pose; for (const k of KEYS) o[k] = a[k] + (b[k] - a[k]) * t; return o; };
const CARDS: { id: string; k: [Pose, Pose, Pose]; conv: Pose }[] = [
  { id: 'compare', k: [{ x: -8, y: -16, rx: 9, ry: 88, rz: 12, s: 0.95 }, { x: -300, y: -120, rx: 16, ry: 44, rz: -8, s: 1.1 }, { x: -360, y: -120, rx: 4, ry: 16, rz: -3, s: 1.18 }], conv: { x: -20, y: -12, rx: 0, ry: 55, rz: 4, s: 0.1 } },
  { id: 'dd-simulator', k: [{ x: 0, y: 0, rx: 8, ry: 89, rz: 12, s: 0.9 }, { x: -16, y: -7, rx: 13, ry: 38, rz: -7, s: 1.24 }, { x: 0, y: 10, rx: 3, ry: 10, rz: -1, s: 1.22 }], conv: { x: 0, y: 0, rx: 0, ry: 60, rz: 4, s: 0.1 } },
  { id: 'pricing', k: [{ x: 8, y: 16, rx: 7, ry: 90, rz: 12, s: 0.86 }, { x: 300, y: 110, rx: 11, ry: 34, rz: -6, s: 1.16 }, { x: 360, y: 130, rx: 2, ry: 5, rz: 1, s: 1.26 }], conv: { x: 15, y: 10, rx: 0, ry: 65, rz: 4, s: 0.1 } },
];

export const Flock: React.FC<{ dur: number }> = ({ dur }) => (
  <TunnelOut dur={dur}><FlockScene /></TunnelOut>
);
const FlockScene: React.FC = () => {
  const f = useCurrentFrame();
  const gid = `tg${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const st = f - TEXT_T0;
  const ts = interpolate(st, [0, 34], [0.6, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const to = interpolate(st, [0, 12, 34], [0, 0.8, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sub = interpolate(st, [14, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#060d17' }}>
      <Wall f={f} />
      {f < CARD_OUT[1] + 2 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', perspective: 1400 }}>
          {CARDS.map((c, i) => {
            const idle = (() => { const t = Math.min(f, CARD_OUT[0]) - FLIGHT[1] * 0.86; if (t <= 0) return { ry: 0, rx: 0, rz: 0 }; const ramp = Math.min(1, t / 14) ** 2; return { ry: t * 0.34 * ramp, rx: t * -0.1 * ramp, rz: t * 0.05 * ramp }; })();
            let pose: Pose; let op = interpolate(f, [4, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            if (f < FLIGHT[0]) pose = c.k[0];
            else if (f < CARD_OUT[0]) { const u = Easing.out(Easing.cubic)(Math.min(1, (f - FLIGHT[0]) / (FLIGHT[1] - FLIGHT[0]))); const p = spline(c.k, u); pose = { ...p, ry: p.ry + idle.ry, rx: p.rx + idle.rx, rz: p.rz + idle.rz }; }
            else { const r = Math.min(1, (f - CARD_OUT[0]) / (CARD_OUT[1] - CARD_OUT[0])); const from = { ...c.k[2], ry: c.k[2].ry + idle.ry, rx: c.k[2].rx + idle.rx, rz: c.k[2].rz + idle.rz }; pose = lerpPose(from, c.conv, Easing.in(Easing.quad)(r)); op = 1 - Easing.in(Easing.cubic)(Math.max(0, (r - 0.55) / 0.45)); }
            return (
              <div key={c.id} style={{ position: 'absolute', transform: `translate3d(${pose.x}px, ${pose.y}px, 0) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) rotateZ(${pose.rz}deg) scale(${pose.s})`, opacity: op, zIndex: 10 + i }}>
                <Card id={c.id} />
              </div>
            );
          })}
        </AbsoluteFill>
      )}
      <SmokeRing f={f} />
      {st >= 0 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <svg width={1920} height={560} viewBox="0 0 1920 560" style={{ transform: `scale(${ts})`, opacity: to, filter: 'drop-shadow(0 0 26px rgba(216,180,106,0.5))', overflow: 'visible' }}>
            <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.brassLight} /><stop offset="45%" stopColor={C.brass} /><stop offset="100%" stopColor={C.blue} /></linearGradient></defs>
            <text x="960" y="330" textAnchor="middle" fontFamily="Outfit" fontWeight={700} fontSize={300} letterSpacing={8} fill="none" stroke={`url(#${gid})`} strokeWidth={4.5}>GRATUIT</text>
          </svg>
          <div style={{ position: 'absolute', top: 760, fontFamily: F.display, fontStyle: 'italic', fontSize: 64, color: C.text, opacity: sub, transform: `translateY(${(1 - sub) * 16}px)` }}>pour commencer — tes données restent à toi</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
