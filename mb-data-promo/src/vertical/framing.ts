// framing.ts — la caméra verticale, plan par plan. Chaque clé dit : à la frame
// `f` du plan, le point (x, y) de la scène 16:9 (px de la scène 1920×1080) est
// amené au centre de la bande image, avec le grossissement `s` (1 = 1 px de
// scène → 1 px de sortie ; 1080/s = largeur de scène visible).
// Les valeurs viennent des contrôles en images fixes (qa.sh … QuantaraVertical).
import { SHOTS } from '../timeline';
import { PRESS, SWAP } from '../shots/Replicate';

export type FrameKey = { f: number; s: number; x: number; y: number };
type ShotId = keyof typeof SHOTS;

const D = 18; // décalage d'entrée du plan Spotlight (cf. Spotlight.tsx)

export const FRAMING: Record<ShotId, FrameKey[]> = {
  // marque + mains : tout tient dans 1030 px de large
  open: [{ f: 0, s: 1.05, x: 960, y: 610 }],
  // dashboard entier, puis la carte et son annotation 3D quand la caméra pivote
  spot: [
    { f: 0, s: 0.95, x: 960, y: 540 },
    { f: D + 30, s: 0.95, x: 960, y: 540 },
    { f: D + 50, s: 0.66, x: 975, y: 500 },
  ],
  // la colonne de contenu, sans la barre latérale
  tabs: [{ f: 0, s: 0.85, x: 1100, y: 540 }],
  wall: [{ f: 0, s: 0.9, x: 960, y: 540 }],
  palette: [{ f: 0, s: 0.78, x: 960, y: 540 }],
  // modal entier, poussée sur le bouton ; pendant la bascule de point, la caméra
  // rejoint la 1re carte du Trade Log, suit l'emboîtement des trois (elles atterrissent
  // à SWAP+26/35/44, centres scène x 425 / 940 / 1441), puis recule pour les montrer ensemble.
  replicate: [
    { f: 0, s: 1.25, x: 960, y: 540 },
    { f: PRESS - 16, s: 1.25, x: 960, y: 540 },
    { f: PRESS - 2, s: 1.0, x: 1110, y: 560 },
    { f: SWAP + 4, s: 1.0, x: 1110, y: 560 },
    { f: SWAP + 16, s: 1.3, x: 425, y: 610 },
    { f: SWAP + 26, s: 1.3, x: 425, y: 610 },
    { f: SWAP + 44, s: 1.3, x: 1441, y: 580 },
    { f: SWAP + 50, s: 1.3, x: 1441, y: 575 },
    { f: SWAP + 66, s: 0.7, x: 935, y: 540 },
  ],
  brake: [{ f: 0, s: 0.95, x: 960, y: 540 }],
  odometer: [{ f: 0, s: 1.1, x: 960, y: 520 }],
  waterfall: [{ f: 0, s: 0.85, x: 960, y: 540 }],
  flock: [{ f: 0, s: 0.72, x: 960, y: 540 }],
  outro: [{ f: 0, s: 1.0, x: 960, y: 560 }],
};
