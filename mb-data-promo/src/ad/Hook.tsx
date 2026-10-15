// Hook.tsx — l'accroche (≈ 6 s). Réplique 1 : « Cinq comptes. Cinq firmes. Cinq
// règlements. » — chaque mot fait entrer une fiche de règlement, et le texte animé
// EST la réplique (pas de sous-titre). Réplique 2 : « Et une seule règle oubliée peut
// te coûter un compte. » — une fiche vient au premier plan, une ligne s'allume en
// bronze (« règle »), vire au rouge (« coûter »), tampon COMPTE PERDU (« compte »).
// Les fiches sont des règlements génériques, aucune firme n'est nommée.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { C, F, HALO } from '../brand';
import { HOOK, wordAt } from './timeline';

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const FLY = Easing.bezier(0.2, 0.9, 0.3, 1.08);
const HERO = 2, HL = 2; // fiche n° 2, ligne n° 2 (« Consistance »)
const DOCS: string[][][] = [
  [['Drawdown', 'EOD trailing'], ['Perte max / jour', '1 000 $'], ['Jours minimum', '5'], ['Payout', 'après 5 jours'], ['News', 'autorisées']],
  [['Drawdown', 'intraday'], ['Objectif', '+3 000 $'], ['Contrats max', '5'], ['Consistance', 'aucune'], ['Week-end', 'interdit']],
  [['Drawdown', 'EOD trailing'], ['Perte max / jour', 'aucune'], ['Consistance', '40 % max'], ['Jours minimum', '7'], ['Payout', 'palier de 1 000 $']],
  [['Drawdown', 'statique'], ['Scaling', '2 → 10 contrats'], ['News', 'interdit T1'], ['Payout', 'tous les 14 jours'], ['Jours minimum', '3']],
  [['Drawdown', 'EOD'], ['Consistance', '50 % max'], ['Overnight', 'interdit'], ['Activation', '149 $'], ['Payout', '5 jours gagnants']],
];

const Doc: React.FC<{ i: number; w: number; hl?: number; hot?: number }> = ({ i, w, hl = 0, hot = 0 }) => {
  const fs = w / 17;
  return (
    <div style={{ width: w, padding: w * 0.07, borderRadius: w * 0.05, background: C.surfaceSolid, border: `1px solid ${C.border}`, boxShadow: '0 30px 70px rgba(0,0,0,0.55)', fontFamily: F.ui }}>
      <div style={{ fontFamily: F.mono, fontSize: fs * 0.72, letterSpacing: '0.14em', color: C.brass, textTransform: 'uppercase' }}>Règlement · compte {i + 1}</div>
      <div style={{ height: 1, background: C.border, margin: `${fs * 0.7}px 0` }} />
      {DOCS[i].map(([k, v], r) => {
        const on = r === HL ? hl : 0, red = r === HL ? hot : 0;
        const bg = red > 0 ? `rgba(255,122,134,${0.22 * red})` : `rgba(216,180,106,${0.2 * on})`;
        const ring = red > 0 ? `rgba(255,122,134,${red})` : `rgba(216,180,106,${on})`;
        return (
          <div key={r} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: `${fs * 0.42}px ${fs * 0.4}px`, borderRadius: fs * 0.3, fontSize: fs, background: bg, boxShadow: `0 0 0 ${2 * Math.max(on, red)}px ${ring}` }}>
            <span style={{ color: C.text2 }}>{k}</span><span style={{ color: red > 0.5 ? C.red : C.text, fontWeight: 500 }}>{v}</span>
          </div>
        );
      })}
    </div>
  );
};

export const Hook: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vert = height > width;
  const W = vert ? 1080 : 1920, H = vert ? 1920 : 1080;
  const { h1, h2 } = HOOK;
  // 1re réplique : un mot → une fiche ; trois lignes de texte
  const beats = [0, 1, 2, 3, 4].map((k) => h1 + wordAt('hook1', Math.min(5, k + (k >= 4 ? 1 : 0))) - 4);
  const lines = [0, 2, 4].map((wi, k) => ({ at: h1 + wordAt('hook1', wi) - 2, txt: ['comptes.', 'firmes.', 'règlements.'][k] }));
  const p2 = interpolate(f, [h2 - 6, h2 + 10], [0, 1], { ...CL, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  const hl = interpolate(f, [h2 + wordAt('hook2', 3) - 2, h2 + wordAt('hook2', 3) + 6], [0, 1], CL);
  const hot = interpolate(f, [h2 + wordAt('hook2', 7) - 2, h2 + wordAt('hook2', 7) + 4], [0, 1], CL);
  const stampAt = h2 + wordAt('hook2', 9);
  const stamp = interpolate(f, [stampAt, stampAt + 6], [0, 1], { ...CL, easing: Easing.bezier(0.5, 0, 0.7, 1.4) });
  const shake = f >= stampAt && f < stampAt + 8 ? Math.sin(f * 2.7) * 9 * (1 - (f - stampAt) / 8) : 0;
  const flash = interpolate(f, [stampAt, stampAt + 2, stampAt + 14], [0, 0.32, 0], CL);
  const out = interpolate(f, [dur - 10, dur], [0, 1], { ...CL, easing: Easing.in(Easing.quad) });

  const dw = vert ? 330 : 360; // largeur d'une fiche
  // positions en éventail (centre de la fiche), puis la fiche-héros vient au centre
  const SPOT = vert
    ? [[300, 1020, -8], [780, 980, 7], [540, 1240, -2], [290, 1460, 6], [790, 1440, -6]]
    : [[330, 690, -9], [1590, 680, 8], [960, 760, -2], [640, 800, 5], [1280, 810, -5]];
  const heroC = vert ? [540, 1060] : [960, 470];
  const heroScale = vert ? 2.15 : 1.75;

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: HALO, opacity: 0.8 }} />
      <AbsoluteFill style={{ transform: `translateX(${shake}px) scale(${1 + 0.25 * out})`, filter: out > 0 ? `blur(${10 * out}px)` : undefined, opacity: 1 - out }}>
        {SPOT.map(([x, y, rot], i) => {
          const t = interpolate(f, [beats[i], beats[i] + 12], [0, 1], { ...CL, easing: FLY });
          if (t <= 0) return null;
          const hero = i === HERO;
          const fromX = (i % 2 ? 1 : -1) * W * 0.7;
          const cx = x + fromX * (1 - t), cy = y + (1 - t) * 120;
          // 2e réplique : la héros vient au centre, les autres reculent dans le flou
          const X = hero ? cx + (heroC[0] - cx) * p2 : cx + (x - W / 2) * 0.35 * p2;
          const Y = hero ? cy + (heroC[1] - cy) * p2 : cy + (y - H / 2) * 0.35 * p2;
          const sc = hero ? 1 + (heroScale - 1) * p2 : 1 - 0.15 * p2;
          const r = hero ? rot * (1 - p2) : rot;
          return (
            <div key={i} style={{ position: 'absolute', left: X, top: Y, transform: `translate(-50%,-50%) rotate(${r * t}deg) scale(${sc})`, opacity: hero ? 1 : 1 - 0.65 * p2, filter: !hero && p2 > 0 ? `blur(${6 * p2}px)` : undefined, zIndex: hero ? 5 : i }}>
              <div style={{ filter: `brightness(${1 - 0.35 * (1 - p2) * (lines.some((l) => f >= l.at) ? 1 : 0)})` }}>
                <Doc i={i} w={dw} hl={hero ? hl : 0} hot={hero ? hot : 0} />
              </div>
            </div>
          );
        })}

        {/* texte animé de la 1re réplique */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: vert ? 330 : 90, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: vert ? 6 : 0, opacity: 1 - p2, transform: `translateY(${-60 * p2}px)` }}>
          {lines.map((l, k) => {
            const t = interpolate(f, [l.at, l.at + 8], [0, 1], { ...CL, easing: Easing.bezier(0.2, 0.9, 0.3, 1.15) });
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 24, opacity: t, transform: `translateY(${(1 - t) * 40}px) scale(${1.2 - 0.2 * t})`, textShadow: '0 6px 40px rgba(0,0,0,0.85)', fontSize: vert ? 104 : 118, lineHeight: 1.05 }}>
                <span style={{ fontFamily: F.mono, fontWeight: 700, color: C.brassLight }}>5</span>
                <span style={{ fontFamily: F.ui, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>{l.txt}</span>
              </div>
            );
          })}
        </div>

        {/* tampon sur la fiche-héros */}
        {stamp > 0 ? (
          <div style={{ position: 'absolute', left: heroC[0], top: heroC[1] + (vert ? 300 : 150), transform: `translate(-50%,-50%) rotate(-9deg) scale(${2.2 - 1.2 * stamp})`, opacity: Math.min(1, stamp * 1.6), zIndex: 9 }}>
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: vert ? 78 : 72, letterSpacing: '0.12em', whiteSpace: 'nowrap', color: C.red, border: `6px solid ${C.red}`, borderRadius: 14, padding: '8px 26px', background: 'rgba(10,20,32,0.75)', textShadow: '0 0 24px rgba(255,122,134,0.5)' }}>COMPTE PERDU</div>
          </div>
        ) : null}
        <AbsoluteFill style={{ background: `radial-gradient(closest-side, transparent 40%, rgba(255,60,80,${flash}))`, mixBlendMode: 'screen', pointerEvents: 'none' }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
