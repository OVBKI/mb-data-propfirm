// Plan 6 — la réplication multi-comptes, en deux temps.
// A) le vrai modal « Nouveau trade » (découpe ×3) : lent push, le bouton
//    « Ajouter sur 3 comptes » est pressé (anticipation 0,97 → retour).
// B) row-embed, d'après RowEmbed.tsx : les trois cartes créées (vraie capture du
//    Trade Log APRÈS réplication) tombent du ciel, rotateX qui se remet à plat,
//    léger dépassement puis pression, et un liseré bronze s'ouvre du centre vers
//    les bords à l'emboîtement — le « clic » visuel. Emplacements masqués par une
//    pièce de fond tant que la carte n'est pas posée (sinon double image).
// Couture d'entrée : flash-cut A (blanc chaud 10 f). Couture interne : C (bascule
// de point, le modal sort du plan de netteté pendant que la page y entre).
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from 'remotion';
import { tex, box } from '../lib/tex';
import { Caption } from '../lib/Caption';
import { TunnelOut } from '../lib/TunnelOut';
import { PageCam } from '../lib/PageCam';
import layout from '../../public/textures/layout.json';
import { C } from '../brand';

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const M = box('cut-trade-modal');
const ROWS = (layout as Record<string, { boxes?: { x: number; y: number; w: number; h: number }[] }>)['rows-replicated'].boxes!.slice(0, 3);
const SWAP = 84; // début de la bascule de point
const PRESS = 56;
const FLY = Easing.bezier(0.3, 0, 0.25, 1);

const PartA: React.FC<{ f: number }> = ({ f }) => {
  // Le modal doit se LIRE : il occupe ~90 % de la hauteur, centré.
  const z = interpolate(f, [0, 80], [1.38, 1.48], { ...CL, easing: Easing.bezier(0.33, 0, 0.15, 1) });
  const mcx = M.x + M.w / 2, mcy = M.y + M.h / 2 - 8;
  const press = interpolate(f, [PRESS, PRESS + 3, PRESS + 9], [1, 0.97, 1], { ...CL, easing: Easing.bezier(0.2, 0, 0, 1) });
  // bouton : ~66–95 % en largeur, 90,6–95,8 % en hauteur du modal (mesuré sur la découpe)
  const bx = M.x + M.w * 0.662, by = M.y + M.h * 0.906, bw = M.w * 0.285, bh = M.h * 0.052;
  const ring = interpolate(f, [PRESS + 2, PRESS + 16], [0, 1], CL);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 1920, height: 1080, transform: `translate(${960 - mcx * z}px, ${540 - mcy * z}px) scale(${z})`, transformOrigin: '0 0' }}>
        <Img src={tex('trade-modal')} style={{ position: 'absolute', width: 1920, height: 1080 }} />
        <Img src={tex('cut-trade-modal')} style={{ position: 'absolute', left: M.x, top: M.y, width: M.w, height: M.h }} />
        <div style={{ position: 'absolute', left: bx, top: by, width: bw, height: bh, transform: `scale(${press})`, transformOrigin: 'center', borderRadius: 12, boxShadow: `0 0 0 ${2 + ring * 10}px rgba(216,180,106,${0.55 * (1 - ring)})` }} />
      </div>
    </AbsoluteFill>
  );
};

const PartB: React.FC<{ f: number }> = ({ f }) => {
  const cam = [{ frame: 0, cx: 900, cy: 330, zoom: 1.28 }, { frame: 96, cx: 900, cy: 460, zoom: 1.12 }];
  return (
    <PageCam src={tex('trades-after')} pageH={1080} keys={cam}>
      {ROWS.map((r, i) => {
        const cue = 14 + i * 9, land = cue + 12;
        const patch = interpolate(f, [land, land + 2], [1, 0], CL);
        const p = interpolate(f, [cue, cue + 12], [0, 1], { ...CL, easing: FLY });
        const appear = interpolate(f, [cue, cue + 3], [0, 1], CL);
        const scale = f < land ? 1.06 - 0.065 * p : interpolate(f, [land, land + 4], [0.995, 1], { ...CL, easing: Easing.out(Easing.quad) });
        const air = 1 - p;
        const spread = interpolate(f, [land, land + 5], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
        const seamO = interpolate(f, [land, land + 2, land + 8], [1, 1, 0], CL);
        return (
          <React.Fragment key={i}>
            {patch > 0 ? <div style={{ position: 'absolute', left: r.x - 4, top: r.y - 4, width: r.w + 8, height: r.h + 8, background: '#10202f', borderRadius: 16, opacity: patch }} /> : null}
            {f >= cue && f < land + 6 ? (
              <div style={{
                position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 14, overflow: 'hidden',
                backgroundImage: `url(${tex('trades-after')})`, backgroundSize: '1920px 1080px', backgroundPosition: `-${r.x}px -${r.y}px`,
                opacity: appear, transform: `perspective(900px) translateY(${-140 * air}px) rotateX(${16 * air}deg) scale(${scale})`,
                boxShadow: `0 ${30 * air}px ${60 * air}px rgba(0,0,0,${0.45 * air})`, zIndex: 3,
              }} />
            ) : null}
            {f >= land && f < land + 8 ? (
              <div style={{ position: 'absolute', left: r.x + (r.w - r.w * spread) / 2, top: r.y + r.h - 3, width: r.w * spread, height: 2, background: C.brass, boxShadow: '0 0 8px rgba(216,180,106,0.6)', opacity: seamO, zIndex: 4 }} />
            ) : null}
          </React.Fragment>
        );
      })}
    </PageCam>
  );
};

export const Replicate: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  // C : bascule de point — A sort du net (0→8 px), B y entre (8→0), départs décalés de 3 f.
  const aBlur = interpolate(f, [SWAP, SWAP + 12], [0, 8], CL);
  const aOp = interpolate(f, [SWAP + 4, SWAP + 14], [1, 0], CL);
  const bBlur = interpolate(f, [SWAP + 3, SWAP + 15], [8, 0], CL);
  const bOp = interpolate(f, [SWAP + 3, SWAP + 10], [0, 1], CL);
  const flash = interpolate(f, [0, 4, 10], [0.85, 0.85, 0], CL);
  return (
    <TunnelOut dur={dur}>
      {f < SWAP + 15 ? <AbsoluteFill style={{ filter: aBlur > 0 ? `blur(${aBlur}px)` : undefined, opacity: aOp }}><PartA f={f} /></AbsoluteFill> : null}
      {f >= SWAP + 3 ? <AbsoluteFill style={{ filter: bBlur > 0 ? `blur(${bBlur}px)` : undefined, opacity: bOp }}><PartB f={f - SWAP} /></AbsoluteFill> : null}
      {flash > 0 ? <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(255,248,235,0.98), rgba(255,244,224,0.55) 55%, transparent 80%)', opacity: flash }} /> : null}
      <Caption eyebrow="Journal · réplication" text="Un trade saisi une fois. Copié sur tous tes comptes." dur={dur - 12} delay={SWAP + 14} />
    </TunnelOut>
  );
};
