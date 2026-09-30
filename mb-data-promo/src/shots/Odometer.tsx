// Plan 8 — odometer-digit-roll, d'après OdometerDigitRoll.tsx : chaque chiffre
// est une bande 0–9 qui tourne vite (0,85 rangée/f), puis ralentit de gauche à
// droite (départs 20 + i·7), dépasse d'une demi-rangée et revient en 6 f — le
// « clac ». Deux fantômes pendant la rotation (0,25 / 0,12), coupés à l'arrêt.
// Au verrouillage général : pulsation de couleur + 1,035. Chiffres roulés = les
// VRAIS chiffres de 550 (5, 5, 0) — calculés par facts.mjs.
import React from 'react';
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame, Easing } from 'remotion';
import { C, F, HALO } from '../brand';

const ROW = 210, DW = 136, FS = 190, SPIN = 0.85;
const DIGITS = [5, 5, 0];
const LOCK = 20 + (DIGITS.length - 1) * 7 + 22;
const posAt = (f: number, i: number): number => {
  const d = DIGITS[i], s = 20 + i * 7, p0 = SPIN * s;
  const T = Math.ceil((p0 + 6 - d) / 10) * 10 + d;
  if (f < s) return SPIN * Math.max(f, 0);
  if (f < s + 16) return interpolate(f, [s, s + 16], [p0, T + 0.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  if (f < s + 22) return interpolate(f, [s + 16, s + 22], [T + 0.5, T], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return T;
};
const Strip: React.FC<{ pos: number; color: string; opacity?: number; dy?: number }> = ({ pos, color, opacity = 1, dy = 0 }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: DW, transform: `translateY(${-(pos % 10) * ROW + dy}px)`, opacity }}>
    {Array.from({ length: 20 }).map((_, k) => (
      <div key={k} style={{ width: DW, height: ROW, lineHeight: `${ROW}px`, textAlign: 'center', fontFamily: F.mono, fontSize: FS, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color }}>{k % 10}</div>
    ))}
  </div>
);
const Reel: React.FC<{ f: number; i: number; color: string }> = ({ f, i, color }) => {
  const pos = posAt(f, i);
  const gate = interpolate(Math.abs(pos - posAt(f - 1, i)), [0.06, 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'relative', width: DW, height: ROW, overflow: 'hidden' }}>
      {gate > 0.001 && (<><Strip pos={pos} color={color} opacity={0.25 * gate} dy={ROW * 0.5} /><Strip pos={pos} color={color} opacity={0.12 * gate} dy={-ROW * 0.5} /></>)}
      <Strip pos={pos} color={color} />
    </div>
  );
};

export const Odometer: React.FC<{ dur: number }> = ({ dur }) => {
  const f0 = useCurrentFrame();
  const inT = interpolate(f0, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const f = f0 - 6;
  const ink = interpolateColors(f, [LOCK, LOCK + 4, LOCK + 8], [C.text, C.brassLight, C.text]);
  const pulse = interpolate(f, [LOCK, LOCK + 4, LOCK + 8], [1, 1.035, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  const label = interpolate(f, [LOCK + 3, LOCK + 21], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  // C : sortie par perte de point (le plan suivant fait le point)
  const outBlur = interpolate(f0, [dur - 12, dur], [0, 8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outOp = interpolate(f0, [dur - 8, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: C.bg, opacity: inT * outOp, filter: outBlur > 0 ? `blur(${outBlur}px)` : undefined }}>
      <AbsoluteFill style={{ background: HALO }} />
      <div style={{ position: 'absolute', left: 0, top: 330, width: 1920, display: 'flex', justifyContent: 'center', transform: `scale(${pulse})`, transformOrigin: '960px 105px' }}>
        {DIGITS.map((_, i) => <Reel key={i} f={f} i={i} color={ink} />)}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 580, width: 1920, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: label, transform: `translateY(${(1 - label) * 14}px)` }}>
        <div style={{ fontFamily: F.display, fontStyle: 'italic', fontSize: 64, color: C.brassLight }}>lignes de règles, sourcées</div>
        <div style={{ fontFamily: F.mono, fontSize: 34, letterSpacing: '0.12em', color: C.text2, textTransform: 'uppercase' }}>12 firmes futures · 36 programmes · 9 firmes CFD</div>
      </div>
    </AbsoluteFill>
  );
};
