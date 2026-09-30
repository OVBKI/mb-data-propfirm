// Sound.tsx — table de calage SFX. Chaque ligne donne la frame où le PIC du son doit
// tomber (`at`, toujours relative à un plan : SHOTS.x.from + décalage). La frame de
// départ est calculée : at − retard du pic dans le fichier − décalage AAC mesuré
// (≈1,25 f). Sans ça, la relecture indépendante a mesuré des impacts arrivant
// jusqu'à 65 f après l'image (règle S5 du skill). Retards/niveaux : src/sfx-meta.json,
// mesurés sur les fichiers.
// Les sons ne sont jamais coupés net : fondu sur les 10 dernières frames (S4).
// Les fichiers enregistrés bas (clock-tick-single : −14 dBFS) reçoivent un gain > 1.
import React from 'react';
import { Audio, Sequence, interpolate, staticFile } from 'remotion';
import { SHOTS, TOTAL } from './timeline';
import { CUTS } from './shots/Tabs';
import { PRESS, SWAP } from './shots/Replicate';
import META from './sfx-meta.json';

const AAC_OFFSET = 1.25;
type Meta = Record<string, { peakLag: number; len: number; peakDb: number }>;
const M = META as Meta;
type Cue = { at: number; src: string; volume: number; dur?: number; note: string };
const S = SHOTS;
const SPOT0 = S.spot.from + 18; // le démo spotlight démarre après l'entrée tunnel
const exit = (id: keyof typeof SHOTS) => S[id].from + S[id].dur - 6; // milieu d'une sortie tunnel
const TICK = 2.0; // gain du tick (−14 dBFS à la source)

export const CUES: Cue[] = [
  { at: S.open.from + 60, src: 'shimmer-sparkle-sweep', volume: 0.45, note: 'le mot-marque se trace' },
  { at: S.open.from + 82, src: 'impact-deep-whoosh', volume: 0.42, note: 'tracé terminé (cristallisation)' },
  { at: exit('open'), src: 'whoosh-fast', volume: 0.6, note: 'sortie tunnel vers le dashboard' },
  { at: SPOT0 + 40, src: 'zoom-futuristic', volume: 0.4, note: 'travelling latéral vers la carte-insight' },
  { at: SPOT0 + 53, src: 'whoosh-swirl', volume: 0.35, note: 'la carte s’envole' },
  { at: SPOT0 + 62, src: 'sparkle-touch', volume: 0.5, note: 'premier tour du faisceau bronze' },
  { at: SPOT0 + 130, src: 'transition-snap', volume: 0.5, note: 'la carte se repose dans son emplacement' },
  { at: exit('spot'), src: 'whoosh-fast', volume: 0.5, note: 'sortie tunnel' },
  // coupes sèches : deux échantillons alternés + volume dégressif (anti-mitraillette, S2)
  ...CUTS.slice(1, -1).map((c, i) => ({ at: S.tabs.from + c, src: i % 2 ? 'typewriter-hit-single' : 'clock-tick-single', volume: (i % 2 ? 0.5 : TICK) * (1 - i * 0.06), note: `coupe ${i + 1}` })),
  { at: S.tabs.from + CUTS[CUTS.length - 1], src: 'bass-hit-short', volume: 0.45, note: 'dernière coupe : retour sur la vue principale' },
  { at: exit('tabs'), src: 'whoosh-fast', volume: 0.5, note: 'sortie tunnel' },
  { at: S.wall.from + 30, src: 'warp-slide', volume: 0.45, note: 'le mur Health/Analytics/Heatmaps glisse' },
  { at: exit('wall'), src: 'whoosh-fast', volume: 0.5, note: 'sortie tunnel' },
  { at: S.palette.from + 38, src: 'swoosh-quick', volume: 0.5, note: 'crash-zoom (6 f)' },
  { at: S.palette.from + 41, src: 'impact-transition', volume: 0.4, note: 'arrivée du crash-zoom' },
  { at: S.replicate.from + 2, src: 'whoosh-fast', volume: 0.45, note: 'flash-cut vers le modal' },
  { at: S.replicate.from + PRESS, src: 'switch-tap', volume: 0.65, note: 'clic sur « Ajouter sur 3 comptes »' },
  ...[0, 1, 2].map((i) => ({ at: S.replicate.from + SWAP + 14 + i * 9 + 12, src: 'typewriter-hit-single', volume: 0.5 - i * 0.06, note: `carte ${i + 1} emboîtée` })),
  { at: exit('replicate'), src: 'whoosh-fast', volume: 0.5, note: 'sortie tunnel' },
  { at: S.brake.from + 30, src: 'whoosh-fast', volume: 0.6, note: 'la fiche Apex défile à pleine vitesse' },
  { at: S.brake.from + 66, src: 'impact-transition', volume: 0.45, note: 'freinage net sur la ligne' },
  ...[0, 1, 2].map((i) => ({ at: S.odometer.from + 6 + 20 + i * 7 + 22, src: 'clock-tick-single', volume: TICK * (1 - i * 0.08), note: `chiffre ${i + 1} verrouillé` })),
  { at: S.odometer.from + 6 + 20 + 2 * 7 + 22, src: 'bass-hit-short', volume: 0.42, note: '550 confirmé' },
  { at: S.waterfall.from + 8, src: 'whoosh-swirl', volume: 0.35, note: 'le mur de pages fait le point' },
  { at: S.flock.from + 30, src: 'air-whoosh-powerful', volume: 0.5, note: 'les trois pages tournoient' },
  { at: S.flock.from + 67, src: 'swoosh-quick', volume: 0.45, note: 'aspiration au centre' },
  { at: S.flock.from + 72, src: 'impact-cine-big', volume: 0.5, dur: 150, note: 'l’anneau de fumée s’ouvre' },
  { at: S.outro.from + 40, src: 'light-transition-magic', volume: 0.38, note: 'montée vers le logo' },
  { at: S.outro.from + 45, src: 'impact-deep-whoosh', volume: 0.65, note: 'le logo tombe — pic sonore du film' },
  { at: S.outro.from + 62, src: 'sparkle-touch', volume: 0.45, note: 'le filet bronze s’étire' },
];

export const Sound: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <>
    {bgm ? (
      <Audio src={staticFile('audio/house-vibez.mp3')} volume={(f) => 0.3 * interpolate(f, [0, 30, TOTAL - 45, TOTAL], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
    ) : null}
    {CUES.map((c, i) => {
      const m = M[c.src];
      const from = Math.max(0, Math.round(c.at - m.peakLag - AAC_OFFSET));
      const dur = Math.min(c.dur ?? m.len + 2, TOTAL - from);
      return (
        <Sequence key={i} from={from} durationInFrames={dur} name={c.note}>
          <Audio src={staticFile(`audio/${c.src}.mp3`)} volume={(f) => c.volume * interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
        </Sequence>
      );
    })}
  </>
);
