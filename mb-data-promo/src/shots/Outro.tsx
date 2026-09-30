// Plan 11 — outro-group-photo-launch, d'après OutroGroupPhotoLaunch.tsx : un
// élément RÉEL de chaque plan revient en volant des quatre côtés (départ 4 f,
// puis tous les 3 f, vol 12 f, bezier(0.34,1.4,0.44,1) — y1 > 1 : vrai
// dépassement à l'atterrissage), halo bronze à la pose, tout le monde recule
// d'un rang quand le logo entre (−12 % d'opacité), crane 4° → 0, balayage
// lumineux, lumière de scène, 20 grains de poussière bronze déterministes, page
// de fond floutée. Tenue ≥ 30 f à la fin. Pas de sous-titre : la clôture reste nette.
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { PageCam } from '../lib/PageCam';
import { tex, pageH, box } from '../lib/tex';
import layout from '../../public/textures/layout.json';
import { C, F } from '../brand';

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const FLY = Easing.bezier(0.34, 1.4, 0.44, 1);
const CRANE = Easing.bezier(0.3, 0, 0.2, 1);
const REPL = (layout as Record<string, { boxes?: { x: number; y: number; w: number; h: number }[] }>)['rows-replicated'].boxes![1];

// crop = découpe d'une capture (x, y, w, h en px CSS de la page source)
type El = { key: string; src: string; srcW: number; srcH: number; crop: { x: number; y: number; w: number; h: number }; cx: number; cy: number; scale: number; rot: number; dx: number; dy: number; cue: number };
const full = (id: string) => ({ x: 0, y: 0, w: box(id).w, h: box(id).h });
const ELS: El[] = [
  { key: 'tabs', src: 'dashboard', srcW: 1920, srcH: 1080, crop: { x: 548, y: 34, w: 460, h: 44 }, cx: 960, cy: 120, scale: 1.2, rot: 0, dx: 0, dy: -160, cue: 4 },
  { key: 'insight', src: 'cut-insight', srcW: box('cut-insight').w, srcH: box('cut-insight').h, crop: full('cut-insight'), cx: 350, cy: 330, scale: 0.7, rot: -5, dx: -520, dy: 0, cue: 7 },
  { key: 'palette', src: 'cut-palette', srcW: box('cut-palette').w, srcH: box('cut-palette').h, crop: full('cut-palette'), cx: 1570, cy: 320, scale: 0.62, rot: 4, dx: 520, dy: 0, cue: 10 },
  { key: 'trade', src: 'trades-after', srcW: 1920, srcH: 1080, crop: REPL, cx: 1520, cy: 770, scale: 0.85, rot: -3, dx: 460, dy: 260, cue: 13 },
  { key: 'danger', src: 'cut-danger', srcW: box('cut-danger').w, srcH: box('cut-danger').h, crop: full('cut-danger'), cx: 330, cy: 790, scale: 1.0, rot: 3, dx: -420, dy: 300, cue: 16 },
];
const DUST = Array.from({ length: 20 }, (_, i) => ({ x: (i * 439 + 137) % 1920, y0: (i * 613 + 271) % 1080, rise: 0.3 + (i % 5) * 0.11, amp: 9 + (i % 4) * 5, freq: 0.022 + (i % 3) * 0.008, ph: (i * 0.83) % (Math.PI * 2), size: 2 + (i % 3) * 0.5, op: 0.2 + ((i * 7) % 5) * 0.06 }));
const WORD = 'Quantara'.split('');

export const Outro: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const blur = interpolate(f, [0, 24], [0, 14], { ...CL, easing: Easing.bezier(0.4, 0, 0.4, 1) });
  const rule = interpolate(f, [58, 70], [0, 1], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const tag = interpolate(f, [68, 80], [0, 1], CL);
  const recede = interpolate(f, [42, 50], [0, 1], CL);
  const craneT = interpolate(f, [0, 40], [0, 1], { ...CL, easing: CRANE });
  const pushT = interpolate(f, [40, dur], [0, 1], CL);
  const camScale = 1.06 - 0.06 * craneT + 0.035 * pushT, camTilt = 4 * (1 - craneT);
  const sweepX = interpolate(f, [2, 14], [-700, 2020], { ...CL, easing: Easing.bezier(0.4, 0, 0.6, 1) });
  const sweepO = interpolate(f, [2, 5, 11, 14], [0, 0.14, 0.14, 0], CL);
  const stage = interpolate(f, [42, 50, 58], [0, 0.8, 0.45], CL); // clôture = pic d'énergie (Q8)
  const ext = interpolate(f, [58, 66], [0, 1], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const extFade = interpolate(f, [66, 72], [1, 0], CL);
  const spacing = interpolate(f, [62, 66], [-0.01, 0.005], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const logo = interpolate(f, [38, 50], [0, 1], { ...CL, easing: Easing.bezier(0.2, 0.75, 0.3, 1) });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ transform: `perspective(1400px) rotateX(${camTilt}deg) scale(${camScale})`, transformOrigin: '50% 45%' }}>
        <PageCam src={tex('dashboard-full')} pageH={pageH('dashboard-full')} keys={[{ frame: 0, cx: 960, cy: 700, zoom: 0.75 }]} blur={blur} />
        <AbsoluteFill style={{ background: 'radial-gradient(1200px 800px at 50% 48%, rgba(10,20,32,0.88), rgba(10,20,32,0.66) 60%, rgba(10,20,32,0.5))' }} />
        <AbsoluteFill>
          {ELS.map((el) => {
            if (f < el.cue) return null;
            const t = interpolate(f, [el.cue, el.cue + 12], [0, 1], { ...CL, easing: FLY });
            const o = interpolate(f, [el.cue, el.cue + 3], [0, 1], CL);
            const lin = interpolate(f, [el.cue, el.cue + 12], [0, 1], CL);
            const air = Math.max(0, 1 - t);
            const x = el.dx * (1 - t), y = el.dy * (1 - t), rot = el.rot * (2 - t), sc = el.scale * (1.12 - 0.12 * t);
            const tile = (extra: React.CSSProperties) => (
              <div style={{ position: 'absolute', left: el.cx - el.crop.w / 2, top: el.cy - el.crop.h / 2, width: el.crop.w, height: el.crop.h, borderRadius: 14, overflow: 'hidden', transformOrigin: 'center', ...extra }}>
                <Img src={tex(el.src)} style={{ position: 'absolute', left: -el.crop.x, top: -el.crop.y, width: el.srcW, height: el.srcH }} />
              </div>
            );
            return (
              <div key={el.key}>
                {lin > 0.05 && lin < 0.95 ? tile({ transform: `translate(${x + el.dx * 0.08}px, ${y + el.dy * 0.08}px) rotate(${rot}deg) scale(${sc})`, opacity: 0.2 * (1 - lin), filter: 'blur(8px)' }) : null}
                {tile({ transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sc})`, opacity: o * (1 - 0.12 * recede), filter: `saturate(${1 - 0.08 * recede})`, boxShadow: `0 ${10 + 26 * air}px ${24 + 46 * air}px rgba(0,0,0,${0.4 + 0.15 * air}), 0 0 0 1px rgba(241,217,154,0.18)` })}
              </div>
            );
          })}
          {/* représentant du plan « 550 » : même vol, même atterrissage */}
          {f >= 19 ? (() => { const t = interpolate(f, [19, 31], [0, 1], { ...CL, easing: FLY }); return (
            <div style={{ position: 'absolute', left: 960 - 170, top: 930, width: 340, padding: '14px 20px', borderRadius: 14, background: 'rgba(24,37,53,0.9)', border: '1px solid rgba(241,217,154,0.25)', display: 'flex', alignItems: 'baseline', gap: 14, justifyContent: 'center', transform: `translateY(${320 * (1 - t)}px) rotate(${1.5 * (2 - t)}deg)`, opacity: interpolate(f, [19, 22], [0, 1], CL) * (1 - 0.12 * recede) }}>
              <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 52, color: C.text }}>550</span>
              <span style={{ fontFamily: F.ui, fontSize: 22, color: C.text2 }}>lignes de règles</span>
            </div>); })() : null}
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill>
        {DUST.map((d, i) => <div key={i} style={{ position: 'absolute', left: d.x + Math.sin(f * d.freq + d.ph) * d.amp, top: (((d.y0 - f * d.rise) % 1080) + 1080) % 1080, width: d.size, height: d.size, borderRadius: '50%', background: C.brassLight, opacity: d.op }} />)}
      </AbsoluteFill>
      {sweepO > 0 ? <AbsoluteFill style={{ mixBlendMode: 'screen' }}><div style={{ position: 'absolute', top: 0, bottom: 0, left: sweepX - 300, width: 600, background: 'linear-gradient(90deg, rgba(241,217,154,0), rgba(241,217,154,1) 50%, rgba(241,217,154,0))', opacity: sweepO }} /></AbsoluteFill> : null}
      {stage > 0 ? <AbsoluteFill style={{ background: 'radial-gradient(760px 380px at 960px 470px, rgba(241,217,154,0.35), rgba(216,180,106,0.12) 55%, rgba(0,0,0,0) 75%)', opacity: stage }} /> : null}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
            <Img src={staticFile('quantara-logo.webp')} style={{ width: 132, height: 132, opacity: logo, transform: `scale(${1.3 - 0.3 * logo})`, filter: `drop-shadow(0 0 24px rgba(90,176,255,${0.5 * logo}))` }} />
            <div style={{ fontFamily: F.ui, fontSize: 150, fontWeight: 600, color: C.text, letterSpacing: `${spacing}em`, display: 'flex' }}>
              {WORD.map((ch, i) => {
                const d = Math.round(42 + i * 1.8);
                const t = interpolate(f, [d, d + 8], [0, 1], { ...CL, easing: Easing.bezier(0.2, 0.75, 0.3, 1) });
                return <span key={i} style={{ opacity: t, transform: `translateY(${(1 - t) * 28}px) scale(${1.35 - 0.35 * t})`, filter: `blur(${(1 - t) * 8}px)`, display: 'inline-block' }}>{ch}</span>;
              })}
            </div>
          </div>
          <div style={{ position: 'relative', height: 6, width: 300, margin: '30px auto 0' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 3, background: C.brass, transform: `scaleX(${rule})` }} />
            {ext > 0 && extFade > 0 ? (<>
              <div style={{ position: 'absolute', top: 2.5, height: 1, right: '100%', width: 190 * ext, background: C.brass, opacity: extFade }} />
              <div style={{ position: 'absolute', top: 2.5, height: 1, left: '100%', width: 190 * ext, background: C.brass, opacity: extFade }} />
            </>) : null}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 46, letterSpacing: '0.12em', color: C.text2, marginTop: 30, opacity: tag, textTransform: 'uppercase' }}>
            quantara.tech · <span style={{ color: C.brassLight }}>crée ton compte</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
