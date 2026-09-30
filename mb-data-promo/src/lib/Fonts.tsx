// Fonts.tsx — polices de l'app servies EN LOCAL (public/fonts) : le rendu ne
// dépend d'aucun réseau, et le film ne part pas tant qu'elles ne sont pas prêtes.
import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import faces from '../../public/fonts/faces.json';

const css = (faces as { family: string; style: string; weight: string; file: string; range: string }[])
  .map((f) => `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:block;src:url(${staticFile('fonts/' + f.file)}) format('woff2');unicode-range:${f.range};}`)
  .join('\n');

export const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const probes = ['500 40px Outfit', '700 40px Outfit', '500 40px "Roboto Mono"', '600 40px Fraunces', 'italic 400 40px Fraunces'];
    Promise.all(probes.map((p) => document.fonts.load(p))).then(() => document.fonts.ready).then(() => continueRender(handle));
  }, [handle]);
  return <style>{css}</style>;
};
