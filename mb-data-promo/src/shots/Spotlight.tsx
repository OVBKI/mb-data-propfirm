// Plan 2 — carte spotlight-hero-card, adaptée du démo (SpotlightHeroCard.tsx) :
// mêmes temps et courbes (projecteur 4 stations → verrouillage + pulsation ;
// travelling 16 f vers un angle latéral rotY 34°/rotX 8° ; envol à dépassement
// bezier(0.2,1.25,0.3,1), flottement sin 40 f, retour 18 f ; faisceau en deux tours,
// rapide/brillant puis lent/faible ; annotation 3D dans le même espace).
// Adapté au thème Abyss : projecteur = éclaircit la cible et ASSOMBRIT le reste,
// faisceau et surligneur en bronze. Le héros est la vraie carte-insight du dashboard,
// en découpe ×3 pour rester nette sous le zoom (Q2). Zoom 1,9 au lieu de 2,6 et
// point focal décalé : la carte réelle est large (548 px) et l'annotation doit
// tenir à sa gauche dans le cadre.
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from 'remotion';
import { PageCam, CamKey } from '../lib/PageCam';
import { TunnelIn } from '../lib/TunnelIn';
import { TunnelOut } from '../lib/TunnelOut';
import { Caption } from '../lib/Caption';
import type { Cap } from '../lib/format';
import { tex, pageH, box } from '../lib/tex';
import { C, F } from '../brand';

const D = 18; // décalage : l'entrée tunnel occupe 0–14
const CARD = box('cut-insight');
const MCX = CARD.x + CARD.w / 2, MCY = CARD.y + CARD.h / 2;
const RADIUS = 18;
const PAGE_H = pageH('dashboard-full');
// Frames du démo + D : PageCam lit la frame brute du plan (bug relevé en relecture).
const CAM0: CamKey[] = [
  { frame: 0, cx: 960, cy: 640, zoom: 0.8, rotX: 0, rotY: 0, rotZ: 0, persp: 1200 },
  { frame: 32, cx: 960, cy: 640, zoom: 0.8, rotX: 0, rotY: 0, rotZ: 0, persp: 1200 },
  { frame: 48, cx: MCX - 170, cy: MCY + 20, zoom: 1.9, rotX: 8, rotY: 34, rotZ: 2, persp: 1200 },
  { frame: 400, cx: MCX - 170, cy: MCY + 20, zoom: 1.9, rotX: 8, rotY: 34, rotZ: 2, persp: 1200 },
];
const CAM: CamKey[] = CAM0.map((k) => ({ ...k, frame: k.frame + D }));
// Après le travelling, la carte est à droite du centre : 960 + 170·1,9 ≈ 1283 px.
const LOCK_X = (1283 / 1920) * 100, LOCK_Y = ((540 - 20 * 1.9) / 1080) * 100;
const PUSH = Easing.bezier(0.35, 0, 0.2, 1);
const POP = Easing.bezier(0.2, 1.25, 0.3, 1);
const RESEAT = Easing.bezier(0.4, 0, 0.3, 1.05);
const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Scene: React.FC = () => {
  const frame = Math.max(0, useCurrentFrame() - D);
  // position du projecteur en % de l'écran (vue de face) : 4 stations puis la carte
  const sx0 = (MCX - 960) * 0.8 / 1920 * 100 + 50, sy0 = (MCY - 640) * 0.8 / 1080 * 100 + 50;
  const spotX = interpolate(frame, [4, 8, 16, 22, 28, 48], [72, 72, 30, 62, sx0, LOCK_X], { ...CL, easing: Easing.bezier(0.4, 0, 0.3, 1) });
  const spotY = interpolate(frame, [4, 8, 16, 22, 28, 48], [30, 30, 55, 70, sy0, LOCK_Y], { ...CL, easing: Easing.bezier(0.4, 0, 0.3, 1) });
  const spotOn = interpolate(frame, [2, 10], [0, 1], CL);
  const poolBase = interpolate(frame, [22, 32, 48], [620, 420, 380], { ...CL, easing: Easing.bezier(0.4, 0, 0.3, 1) });
  const pulse = interpolate(frame, [32, 36, 41], [0, 0.06, 0], CL);
  const vign = interpolate(frame, [22, 32, 48], [0.25, 0.5, 0.58], CL);

  const rise = interpolate(frame, [48, 58], [0, 1], { ...CL, easing: POP });
  const reseat = interpolate(frame, [112, 130], [0, 1], { ...CL, easing: RESEAT });
  const lift = rise * (1 - reseat);
  const bob = Math.sin(((frame - 58) / 40) * Math.PI * 2) * 4 * lift;
  const z = 110 * lift + bob;
  const landed = frame >= 130;
  const press = interpolate(frame, [126, 129, 130], [1, 0.997, 1], CL);
  const shadow = `0 ${8 * lift}px ${10 + 12 * lift}px rgba(0,0,0,${0.35 * lift}), 0 ${46 * lift}px ${90 * lift}px rgba(0,0,0,${0.45 * lift})`;
  // La pièce reste opaque jusqu'à ce que la carte soit posée : sinon la copie de la
  // carte cuite dans la page apparaît à côté de la carte encore en l'air.
  const slotVis = frame < 130 ? Math.min(1, rise * 2) : 0;
  const landPulse = interpolate(frame, [126, 130, 134], [0, 1, 0], CL);
  const slotEdge = Math.min(1, 0.4 * (1 - reseat)) + landPulse * 0.6;
  const b1 = interpolate(frame, [60, 74], [0, 1], CL), b1On = frame >= 59 && frame <= 75;
  const b2 = interpolate(frame, [80, 100], [0, 1], { ...CL, easing: Easing.bezier(0.4, 0, 0.4, 1) }), b2On = frame >= 79 && frame <= 101;
  const trail = interpolate(frame, [100, 112], [0.35, 0], CL);
  const bw = CARD.w + 6, bh = CARD.h + 6;
  const hires = interpolate(frame, [32, 38], [0, 1], CL);
  const edgeGlow = 0.5 * Math.min(1, lift + Math.max(0, (frame - 32) / 16));

  // annotation 3D (même espace, même caméra — règle C3)
  const noteIn = interpolate(frame, [60, 70], [0, 1], { ...CL, easing: Easing.bezier(0.2, 0.75, 0.3, 1) });
  const noteOut = interpolate(frame, [116, 126], [1, 0], CL);
  const noteVis = frame >= 60 && frame <= 130 ? noteIn * noteOut : 0;
  const noteZ = 92 + Math.sin(((frame - 60) / 44) * Math.PI * 2) * 3;
  const hl = interpolate(frame, [74, 86], [0, 1], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const handoff = interpolate(frame, [48, 58], [0, 1], CL); // vignette écran → vignette page

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <PageCam src={tex('dashboard-full')} pageH={PAGE_H} keys={CAM} ease={PUSH}>
        {/* vignette du projecteur, en espace PAGE après le verrouillage : elle passe
            sous la carte et sous l'annotation, qui restent donc pleinement lumineuses */}
        <div style={{ position: 'absolute', left: -2000, top: -2000, width: 1920 + 4000, height: PAGE_H + 4000, background: `radial-gradient(520px 380px at ${MCX + 2000 - 80}px ${MCY + 2000}px, rgba(241,217,154,0.10), rgba(4,9,16,0.62) 100%)`, opacity: handoff }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, background: 'rgba(241,217,154,0.6)', filter: 'blur(6px)', opacity: edgeGlow }} />
        <div style={{ transformStyle: 'preserve-3d' }}>
          {slotVis > 0.02 ? (
            <div style={{ position: 'absolute', left: CARD.x - 2, top: CARD.y - 2, width: CARD.w + 4, height: CARD.h + 4, background: '#101d2c', borderRadius: RADIUS, boxShadow: `inset 0 0 26px rgba(216,180,106,${0.18 * slotEdge})`, opacity: slotVis }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: RADIUS, border: `1.5px solid ${C.brass}`, opacity: slotEdge }} />
            </div>
          ) : null}
          <div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, transform: `translateZ(${z}px) scale(${press})`, transformOrigin: 'center', transformStyle: 'preserve-3d' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: RADIUS, overflow: 'hidden', boxShadow: landed ? 'none' : shadow }}>
              <Img src={tex('cut-insight')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: Math.max(hires, 0.999) }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.14), transparent 40%)', opacity: lift }} />
            </div>
            <div style={{ position: 'absolute', inset: 0, borderRadius: RADIUS, boxShadow: `inset 0 0 0 1px rgba(241,217,154,${0.5 * lift})` }} />
            {(b1On || b2On) && lift > 0.4 ? (
              <svg width={bw} height={bh} viewBox={`0 0 ${bw} ${bh}`} style={{ position: 'absolute', left: -3, top: -3, overflow: 'visible', opacity: b1On ? 1 : 0.62, filter: `drop-shadow(0 0 6px ${C.brass}) drop-shadow(0 0 18px rgba(241,217,154,0.55))` }}>
                <rect x={2} y={2} width={bw - 4} height={bh - 4} rx={RADIUS} fill="none" stroke={C.brass} strokeWidth={b1On ? 5 : 3.5} strokeLinecap="round" pathLength={1} strokeDasharray="0.14 1" strokeDashoffset={-(b1On ? b1 : b2)} />
                <rect x={2} y={2} width={bw - 4} height={bh - 4} rx={RADIUS} fill="none" stroke="rgba(255,248,232,0.98)" strokeWidth={b1On ? 2.5 : 1.75} strokeLinecap="round" pathLength={1} strokeDasharray="0.14 1" strokeDashoffset={-(b1On ? b1 : b2)} />
              </svg>
            ) : null}
            {trail > 0.01 ? <div style={{ position: 'absolute', inset: -3, borderRadius: RADIUS + 3, border: `1.5px solid ${C.brass}`, opacity: trail }} /> : null}
          </div>
        </div>
        {noteVis > 0 ? (
          <div style={{ transformStyle: 'preserve-3d' }}>
            <div style={{ position: 'absolute', left: CARD.x - 290, top: CARD.y + 110, width: 230, height: 74, transform: 'translateZ(2px)', background: 'radial-gradient(ellipse, rgba(0,0,0,0.5), transparent 70%)', filter: 'blur(12px)', opacity: 0.6 * noteVis }} />
            <div style={{ position: 'absolute', left: CARD.x - 290, top: CARD.y + 34, width: 250, transform: `translateZ(${noteZ}px) translateY(${(1 - noteIn) * 26}px)`, opacity: noteVis, filter: `blur(${(1 - noteIn) * 4}px)` }}>
              <div style={{ fontFamily: F.display, fontSize: 37, fontWeight: 600, color: C.text, lineHeight: 1.16, letterSpacing: '-0.012em', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>Le compte à risque,</div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{ position: 'absolute', left: -5, top: '14%', bottom: '4%', width: `calc(${hl} * (100% + 10px))`, background: 'rgba(216,180,106,0.55)', borderRadius: 4 }} />
                <div style={{ position: 'relative', fontFamily: F.display, fontStyle: 'italic', fontSize: 37, fontWeight: 500, color: C.text, lineHeight: 1.16 }}>repéré avant le breach.</div>
              </div>
            </div>
          </div>
        ) : null}
      </PageCam>
      {/* projecteur : cible éclairée, le reste assombri */}
      <AbsoluteFill style={{ background: `radial-gradient(${poolBase * (1 + pulse)}px ${poolBase * 0.8 * (1 + pulse)}px at ${spotX}% ${spotY}%, rgba(241,217,154,0.16), rgba(241,217,154,0.04) 45%, rgba(4,9,16,${vign * spotOn}) 100%)`, opacity: spotOn * (1 - handoff) }} />
    </AbsoluteFill>
  );
};

export const Spotlight: React.FC<{ dur: number }> = ({ dur }) => (
  <TunnelOut dur={dur}>
    <TunnelIn><Scene /></TunnelIn>
    {caps(dur).map((c, i) => <Caption key={i} {...c} />)}
  </TunnelOut>
);

// Sous-titres du plan : posés ici en 16:9, recomposés par src/vertical/ en 9:16.
export const caps = (dur: number): Cap[] => [
  { eyebrow: 'Dashboard · à faire maintenant', text: 'Ce qui compte, en premier.', dur: dur - 12, delay: D + 132 },
];
