// Plan 1 — ouverture. Carte : letterspace-materialize (tous les caractères tracés
// EN PARALLÈLE, même frame de départ et de fin, pathLength normalisé), posée sur
// la boucle 3D des mains de bronze de la landing (VP9 alpha). Un seul sujet,
// arc complet ≥ 3 s (Q5/R3), tenue ≥ 1 s après la dernière info (R1).
// Sortie : couture B du skill (tunnel sombre) — la scène file vers la gauche.
import React from 'react';
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { C, F, HALO } from '../brand';

// Squelettes 78×64 dans le style de la carte (U, A, N, R repris tels quels ; Q, T ajoutés).
const GLYPHS: Record<string, string> = {
  Q: 'M 39 5 C 13 5, 8 24, 8 32 C 8 47, 19 59, 39 59 C 59 59, 70 47, 70 32 C 70 17, 60 5, 39 5 M 47 45 L 68 62',
  U: 'M 12 5 L 12 40 C 12 59, 66 59, 66 40 L 66 5',
  A: 'M 7 59 L 39 5 L 71 59 M 17 41 L 61 41',
  N: 'M 12 59 L 12 5 L 66 59 L 66 5',
  T: 'M 8 5 L 70 5 M 39 5 L 39 59',
  R: 'M 12 59 L 12 5 L 44 5 C 64 5, 64 31, 44 31 L 12 31 M 42 31 L 64 59',
};
const WORD = 'QUANTARA';
const START = 30, DUR = 52;
export const OPEN_EXIT = 12; // frames de sortie (tunnel)

export const Open: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const halo = interpolate(f, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  // Les mains montent du sol : 45 f, décélération douce (entrée = ease-out).
  const rise = interpolate(f, [0, 45], [0, 1], { extrapolateRight: 'clamp', easing: Easing.bezier(0, 0, 0.2, 1) });
  const p = interpolate(f, [START, START + DUR], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const done = interpolate(f, [START + DUR, START + DUR + 8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const glowAmt = p >= 1 ? done : p > 0.7 ? (p - 0.7) / 0.3 : 0;
  // Sous-titre : blur-slide (y 30→0, blur 10→0, opacité) sur la même courbe.
  const tag = interpolate(f, [88, 112], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.7, 0.2, 1) });
  // Sortie tunnel : la scène file vers la gauche, voile sombre qui monte.
  const out = interpolate(f, [dur - OPEN_EXIT, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.2, 1) });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ background: HALO, opacity: halo }} />
      <AbsoluteFill style={{ transform: `translateX(${-1920 * out}px)` }}>
        {/* halo chaud derrière la pièce, comme sur la landing */}
        <div style={{ position: 'absolute', left: 960 - 330, top: 520, width: 660, height: 660, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(241,217,154,.42), rgba(216,180,106,.16) 45%, transparent 72%)', filter: 'blur(18px)', opacity: rise * (0.75 + 0.25 * Math.sin(f / 12)) }} />
        <div style={{ position: 'absolute', left: 240, top: 432 + (1 - rise) * 120, width: 1440, height: 648, opacity: rise }}>
          <OffthreadVideo src={staticFile('hero-loop.webm')} transparent muted style={{ width: 1440, height: 648 }} />
        </div>
        {/* le sol : brume + filet de lumière là où les mains émergent */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, background: `linear-gradient(180deg, transparent, ${C.bg} 85%)` }} />
        <div style={{ position: 'absolute', left: 480, width: 960, bottom: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.brassLight}, transparent)`, opacity: 0.7 * rise }} />

        {/* le mot-marque, tracé en parallèle */}
        <div style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 34 }}>
          {WORD.split('').map((ch, i) => (
            <svg key={i} width={78} height={64} viewBox="0 0 78 64" style={{ overflow: 'visible', transform: 'scale(1.25)' }}>
              {p > 0 && (
                <path d={GLYPHS[ch]} fill="none" stroke={C.text} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"
                  pathLength={1} strokeDasharray={1} strokeDashoffset={1 - e}
                  style={{ filter: `drop-shadow(0 0 ${6 + glowAmt * 10}px rgba(241,217,154,${0.3 + glowAmt * 0.4}))` }} />
              )}
            </svg>
          ))}
        </div>
        <div style={{
          position: 'absolute', top: 268, left: 0, right: 0, textAlign: 'center',
          fontFamily: F.display, fontStyle: 'italic', fontWeight: 400, fontSize: 50, color: C.brassLight,
          opacity: tag, transform: `translateY(${(1 - tag) * 30}px)`, filter: `blur(${(1 - tag) * 10}px)`,
        }}>
          Le dashboard des traders PropFirm
        </div>
      </AbsoluteFill>
      {/* voile du tunnel sombre (pas de noir mort : il garde le halo) */}
      <AbsoluteFill style={{ background: C.bg, opacity: out * 0.85 }} />
    </AbsoluteFill>
  );
};
