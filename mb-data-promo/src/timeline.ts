// timeline.ts — SOURCE UNIQUE du film. Sous-titres, SFX et transitions en
// dérivent par des frames relatives (SHOTS.x.from + offset) : décaler un plan
// décale tout ce qui s'y rattache, sans réécrire un seul numéro de frame.
export const FPS = 30;

const ORDER = [
  ['open', 165],
  ['spot', 190],
  ['tabs', 135],
  ['wall', 165],
  ['palette', 115],
  ['replicate', 180],
  ['brake', 150],
  ['odometer', 135],
  ['waterfall', 150],
  ['flock', 150],
  ['outro', 165],
] as const;

export type ShotId = (typeof ORDER)[number][0];
export const SHOTS = {} as Record<ShotId, { from: number; dur: number }>;
let f = 0;
for (const [id, dur] of ORDER) { SHOTS[id] = { from: f, dur }; f += dur; }
export const TOTAL = f;
