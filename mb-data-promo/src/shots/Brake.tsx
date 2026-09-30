// Plan 7 — scroll-brake-moves A (changelog-scroll-brake), d'après
// ChangelogScrollBrake.tsx : la vraie fiche Apex (page publique /firms) défile
// à grande vitesse en décélération exponentielle (out-exp, ~50 f), flou calculé
// par différence de position d'une frame à l'autre (0→6 px, retombe à 0 tout
// seul), arrêt net avec la ligne cible au centre ; la ligne s'élève (1,03 +
// ombre + liseré), le reste recule à 38 %. La ligne choisie est une règle que
// seule une source officielle donnait : « après 6 payouts, le PA est FERMÉ ».
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from 'remotion';
import { tex, pageH } from '../lib/tex';
import { Caption } from '../lib/Caption';
import { TunnelIn } from '../lib/TunnelIn';
import { C } from '../brand';

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const H = pageH('firm-apex-full');
const ROW = { x: 495, y: 2455, w: 930, h: 43 };
const S0 = 16, S1 = 66, L0 = 70, L1 = 84;
const Z = 2.5; // la ligne d'arrivée doit se lire (Q11) : ~33 px de texte à l'écran
const END_CX = 860; // centre du texte de la ligne (label à 510, fin de valeur ~1210)
const START_CY = 560;
const END_CY = ROW.y + ROW.h / 2;
const cyAt = (f: number) => interpolate(f, [S0, S1], [START_CY, END_CY], { easing: Easing.out(Easing.exp), ...CL });

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const cy = cyAt(f);
  const v = Math.abs(cyAt(f) - cyAt(f - 1)) * Z;
  const blur = Math.min(v / 60, 1) * 6;
  const t = interpolate(f, [L0, L1], [0, 1], { easing: Easing.out(Easing.cubic), ...CL });
  const cx = interpolate(f, [S0, S1], [960, END_CX], { easing: Easing.out(Easing.exp), ...CL });
  const tx = 960 - cx * Z, ty = 540 - cy * Z;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: H, transform: `translate(${tx}px, ${ty}px) scale(${Z})`, transformOrigin: '0 0', filter: blur > 0.15 ? `blur(${blur}px)` : undefined }}>
        <Img src={tex('firm-apex-full')} style={{ position: 'absolute', width: 1920, height: H }} />
        {/* voile : tout recule sauf la ligne cible */}
        <div style={{ position: 'absolute', inset: 0, background: `rgba(10,20,32,${0.62 * t})` }} />
        {t > 0 ? (
          <div style={{
            position: 'absolute', left: ROW.x, top: ROW.y, width: ROW.w, height: ROW.h,
            backgroundImage: `url(${tex('firm-apex-full')})`, backgroundSize: `1920px ${H}px`, backgroundPosition: `-${ROW.x}px -${ROW.y}px`,
            transform: `scale(${1 + 0.03 * t})`, borderRadius: 6,
            boxShadow: `0 ${6 + 22 * t}px ${16 + 44 * t}px rgba(0,0,0,${0.2 + 0.4 * t}), 0 0 0 ${2 * t}px ${C.brass}`,
          }} />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const Brake: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [dur - 10, dur], [0, 1], CL); // D : on s'éteint vers le carton sombre
  return (
    <AbsoluteFill>
      <TunnelIn><Scene /></TunnelIn>
      <Caption eyebrow="Règles PropFirm · fiche Apex" text="La règle exacte, jusqu'au dernier détail." dur={dur - 10} delay={L1 - 4} />
      <AbsoluteFill style={{ background: C.bg, opacity: fade }} />
    </AbsoluteFill>
  );
};
