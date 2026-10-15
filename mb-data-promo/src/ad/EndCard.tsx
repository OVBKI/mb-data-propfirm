// EndCard.tsx — « Commence gratuitement sur quantara.tech ». Les mains de bronze de
// la landing (boucle 3D) tiennent la pièce en bas ; le titre entre sur « Commence »,
// le bouton quantara.tech tombe sur le mot et reçoit un clic. Tenu ≥ 1 s à la fin.
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { C, F, HALO } from '../brand';
import { wordAt } from './timeline';

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const VO = 8;
const POP = Easing.bezier(0.2, 0.9, 0.3, 1.2);

export const EndCard: React.FC<{ dur: number }> = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vert = height > width;
  const tIn = interpolate(f, [0, 14], [0, 1], { ...CL, easing: Easing.bezier(0, 0, 0.2, 1) });
  const head = interpolate(f, [VO - 2, VO + 12], [0, 1], { ...CL, easing: POP });
  const btnAt = VO + wordAt('cta', 3) - 4;
  const btn = interpolate(f, [btnAt, btnAt + 10], [0, 1], { ...CL, easing: POP });
  const click = btnAt + 22;
  const press = interpolate(f, [click, click + 3, click + 9], [1, 0.95, 1], CL);
  const ripple = interpolate(f, [click + 1, click + 20], [0, 1], CL);
  const cur = interpolate(f, [btnAt + 6, click], [0, 1], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const vW = vert ? 1080 : 1240, vH = vW * 0.45;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden', opacity: tIn }}>
      <AbsoluteFill style={{ background: HALO }} />
      <div style={{ position: 'absolute', left: (width - vW) / 2, top: height - vH - (vert ? 260 : 0), width: vW, height: vH, transform: `translateY(${(1 - tIn) * 80}px)` }}>
        <div style={{ position: 'absolute', left: '50%', top: '30%', width: vW * 0.45, height: vW * 0.45, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(241,217,154,.35), rgba(216,180,106,.12) 45%, transparent 72%)', filter: 'blur(16px)' }} />
        <OffthreadVideo src={staticFile('hero-loop.webm')} transparent muted style={{ width: vW, height: vH, WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 18%)', maskImage: 'linear-gradient(180deg, transparent 0%, #000 18%)' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: vert ? 330 : 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: vert ? 46 : 34 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: tIn }}>
          <Img src={staticFile('quantara-logo.webp')} style={{ width: 64, height: 64 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 56, color: C.text }}>Quantara</span>
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: vert ? 112 : 104, lineHeight: 1.04, color: C.text, textAlign: 'center', letterSpacing: '-0.015em', opacity: head, transform: `translateY(${(1 - head) * 30}px)` }}>
          Commence<br /><em style={{ fontWeight: 400, color: C.brassLight }}>gratuitement.</em>
        </div>
        <div style={{ position: 'relative', opacity: Math.min(1, btn * 1.4), transform: `scale(${(0.6 + 0.4 * btn) * press})` }}>
          <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: vert ? 58 : 52, color: '#06121e', background: C.blue, padding: vert ? '22px 52px' : '18px 46px', borderRadius: 99, boxShadow: '0 18px 50px rgba(90,176,255,0.35)' }}>quantara.tech</div>
          {ripple > 0 && ripple < 1 ? <div style={{ position: 'absolute', inset: 0, borderRadius: 99, boxShadow: `0 0 0 ${ripple * 34}px rgba(90,176,255,${0.45 * (1 - ripple)})` }} /> : null}
          {/* curseur qui vient cliquer */}
          {cur > 0 ? (
            <svg width="54" height="54" viewBox="0 0 24 24" style={{ position: 'absolute', left: `${62 + 40 * (1 - cur)}%`, top: `${70 + 90 * (1 - cur)}%`, opacity: interpolate(f, [btnAt + 6, btnAt + 10, click + 26, click + 34], [0, 1, 1, 0], CL), filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>
              <path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke="#0a1420" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          ) : null}
        </div>
      </div>
      <div style={{ position: 'absolute', right: vert ? 60 : 48, bottom: vert ? 120 : 34, fontFamily: F.mono, fontSize: 22, color: C.text2, opacity: 0.8 * tIn }}>Données de démonstration fictives</div>
    </AbsoluteFill>
  );
};
