// PageCam.tsx — caméra 2.5D sur une capture pleine page (origine : video-shotcraft
// assets/lib/PageCam.tsx). Deux adaptations : fond Abyss au lieu du papier, et
// `src` est une URL déjà résolue (tex()). La coordonnée (cx, cy) est un point de
// la page, en px CSS, amené au centre du cadre ; zoom 1 = 1 px CSS → 1 px sortie.
// En 3D l'agrandissement passe par la propriété CSS `zoom` (et non scale) pour que
// Chromium rastérise au grossissement final — sinon le texte bave (règle Q2).
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from 'remotion';
import { C } from '../brand';

export type CamKey = { frame: number; cx: number; cy: number; zoom: number; rotX?: number; rotY?: number; rotZ?: number; persp?: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const PageCam: React.FC<{
  src: string; pageH: number; keys: CamKey[]; children?: React.ReactNode;
  blur?: number; ease?: (t: number) => number; bg?: string;
}> = ({ src, pageH, keys, children, blur = 0, ease = Easing.bezier(0.33, 0, 0.15, 1), bg = C.bg }) => {
  const frame = useCurrentFrame();
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) if (frame >= keys[i].frame && frame <= keys[i + 1].frame) { a = keys[i]; b = keys[i + 1]; break; }
  if (frame < keys[0].frame) { a = keys[0]; b = keys[0]; }
  const t = a.frame === b.frame ? 1 : interpolate(frame, [a.frame, b.frame], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const cx = lerp(a.cx, b.cx, t), cy = lerp(a.cy, b.cy, t), zoom = lerp(a.zoom, b.zoom, t);
  const filter = blur > 0 ? `blur(${blur}px)` : undefined;
  const has3D = keys.some((k) => k.rotX !== undefined || k.rotY !== undefined || k.rotZ !== undefined || k.persp !== undefined);
  if (!has3D) {
    return (
      <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: bg }}>
        <div style={{ position: 'absolute', width: 1920, height: pageH, transform: `translate(${960 - cx * zoom}px, ${540 - cy * zoom}px) scale(${zoom})`, transformOrigin: '0 0', filter }}>
          <Img src={src} style={{ position: 'absolute', width: 1920, height: pageH }} />
          {children}
        </div>
      </AbsoluteFill>
    );
  }
  const rotX = lerp(a.rotX ?? 0, b.rotX ?? 0, t), rotY = lerp(a.rotY ?? 0, b.rotY ?? 0, t), rotZ = lerp(a.rotZ ?? 0, b.rotZ ?? 0, t);
  const persp = lerp(a.persp ?? 1400, b.persp ?? 1400, t);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: bg }}>
      <div style={{ position: 'absolute', inset: 0, perspective: `${persp * zoom}px`, perspectiveOrigin: '960px 540px' }}>
        <div style={{
          position: 'absolute', width: 1920, height: pageH, zoom,
          transform: `translate(${960 / zoom - cx}px, ${540 / zoom - cy}px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
          transformOrigin: `${cx}px ${cy}px`, transformStyle: 'preserve-3d', filter,
        }}>
          <Img src={src} style={{ position: 'absolute', width: 1920, height: pageH }} />
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
