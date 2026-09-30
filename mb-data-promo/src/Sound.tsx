// Sound.tsx — table de calage SFX, UNE ligne par geste à l'image, toujours en
// frame RELATIVE (SHOTS.x.from + décalage) : bouger un plan déplace ses sons.
// Vocabulaire « film produit » du skill (S1) : whoosh = mouvement de caméra,
// impact = atterrissage, sparkle = lumière, tick/clac = mécanique réelle.
// Les échantillons > 5 s ont une durée explicite (sinon ils débordent, S4).
// Tous les fichiers viennent de Mixkit, licence libre (voir public/audio/ATTRIBUTION.md).
import React from 'react';
import { Audio, Sequence, interpolate, staticFile } from 'remotion';
import { SHOTS, TOTAL } from './timeline';
import { CUTS } from './shots/Tabs';

type Cue = { from: number; src: string; volume: number; dur?: number; note: string };
const S = SHOTS;
const SPOT0 = S.spot.from + 18; // le démo spotlight démarre après l'entrée tunnel
export const CUES: Cue[] = [
  { from: S.open.from + 30, src: 'shimmer-sparkle-sweep', volume: 0.45, note: 'le mot-marque commence à se tracer' },
  { from: S.open.from + 82, src: 'impact-deep-whoosh', volume: 0.4, note: 'tracé terminé (flash de cristallisation)' },
  { from: S.open.from + S.open.dur - 12, src: 'whoosh-fast', volume: 0.38, note: 'sortie tunnel vers le dashboard' },
  { from: SPOT0 + 32, src: 'zoom-futuristic', volume: 0.32, note: 'travelling latéral vers la carte-insight' },
  { from: SPOT0 + 48, src: 'whoosh-swirl', volume: 0.3, note: 'la carte s’envole' },
  { from: SPOT0 + 60, src: 'sparkle-touch', volume: 0.45, note: 'premier tour du faisceau bronze' },
  { from: SPOT0 + 127, src: 'transition-snap', volume: 0.42, note: 'la carte se repose dans son emplacement' },
  // coupes sèches : deux échantillons alternés + volume dégressif (anti-mitraillette, S2)
  ...CUTS.slice(1, -1).map((c, i) => ({ from: S.tabs.from + c, src: i % 2 ? 'typewriter-hit-single' : 'clock-tick-single', volume: 0.5 - i * 0.03, note: `coupe ${i + 1}` })),
  { from: S.tabs.from + CUTS[CUTS.length - 1], src: 'bass-hit-short', volume: 0.45, note: 'dernière coupe : retour sur la vue principale' },
  { from: S.tabs.from + S.tabs.dur - 12, src: 'whoosh-fast', volume: 0.32, note: 'sortie tunnel' },
  { from: S.wall.from + 6, src: 'warp-slide', volume: 0.38, note: 'le mur Health/Analytics/Heatmaps glisse' },
  { from: S.wall.from + S.wall.dur - 12, src: 'whoosh-fast', volume: 0.3, note: 'sortie tunnel' },
  { from: S.palette.from + 33, src: 'swoosh-quick', volume: 0.45, note: 'crash-zoom (6 f)' },
  { from: S.palette.from + 41, src: 'impact-transition', volume: 0.36, dur: 45, note: 'rebond du crash-zoom' },
  { from: S.replicate.from, src: 'whoosh-fast', volume: 0.3, note: 'flash-cut vers le modal' },
  { from: S.replicate.from + 56, src: 'switch-tap', volume: 0.6, note: 'clic sur « Ajouter sur 3 comptes »' },
  ...[0, 1, 2].map((i) => ({ from: S.replicate.from + 84 + 14 + i * 9 + 12, src: 'typewriter-hit-single', volume: 0.45 - i * 0.06, note: `carte ${i + 1} emboîtée` })),
  { from: S.replicate.from + S.replicate.dur - 12, src: 'whoosh-fast', volume: 0.3, note: 'sortie tunnel' },
  { from: S.brake.from + 16, src: 'whoosh-fast', volume: 0.42, note: 'la fiche Apex défile à pleine vitesse' },
  { from: S.brake.from + 66, src: 'impact-transition', volume: 0.42, dur: 50, note: 'freinage net sur la ligne' },
  ...[0, 1, 2].map((i) => ({ from: S.odometer.from + 6 + 20 + i * 7 + 22, src: 'clock-tick-single', volume: 0.55 - i * 0.05, note: `chiffre ${i + 1} verrouillé` })),
  { from: S.odometer.from + 6 + 20 + 2 * 7 + 22, src: 'bass-hit-short', volume: 0.4, note: '550 confirmé' },
  { from: S.waterfall.from, src: 'whoosh-swirl', volume: 0.3, note: 'le mur de pages fait le point' },
  { from: S.flock.from + 10, src: 'air-whoosh-powerful', volume: 0.45, note: 'les trois pages tournoient' },
  { from: S.flock.from + 62, src: 'swoosh-quick', volume: 0.4, note: 'aspiration au centre' },
  { from: S.flock.from + 70, src: 'impact-cine-big', volume: 0.5, dur: 70, note: 'l’anneau de fumée s’ouvre' },
  { from: S.outro.from - 20, src: 'light-transition-magic', volume: 0.32, dur: 60, note: 'montée vers la photo de groupe' },
  { from: S.outro.from + 42, src: 'impact-deep-whoosh', volume: 0.55, note: 'le logo tombe — pic sonore du film' },
  { from: S.outro.from + 58, src: 'sparkle-touch', volume: 0.42, note: 'le filet bronze s’étire' },
];

export const Sound: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <>
    {bgm ? (
      <Audio src={staticFile('audio/house-vibez.mp3')} volume={(f) => 0.3 * interpolate(f, [0, 30, TOTAL - 45, TOTAL], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
    ) : null}
    {CUES.map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={c.dur ?? 150} name={c.note}>
        <Audio src={staticFile(`audio/${c.src}.mp3`)} volume={c.volume} />
      </Sequence>
    ))}
  </>
);
