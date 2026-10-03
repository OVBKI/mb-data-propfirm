// format.ts — le même montage sert deux formats. 'h' : 16:9 (1920×1080), les
// sous-titres sont posés par chaque plan. 'v' : 9:16 (1080×1920), la scène 16:9
// est recadrée par une caméra verticale et les sous-titres sont recomposés en
// dehors d'elle (src/vertical/), à partir des mêmes tables `caps`.
import React from 'react';

export type Format = 'h' | 'v';
export const FormatCtx = React.createContext<Format>('h');

/** Un sous-titre narratif. `delay` = entrée, `dur` = frame de fin (relatives au plan). */
export type Cap = { eyebrow?: string; text: string; delay: number; dur: number };
