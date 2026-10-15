// timeline.ts — la pub (≈ 30 s) est montée SUR la voix off : chaque scène dure le
// temps de sa réplique plus une respiration. Les durées viennent de src/vo-meta.json
// (voice/make_vo.py) : changer le texte de la voix recale tout le montage.
// Les plans repris du film sont « rognés » : `trim` = première frame du plan utilisée.
import META from '../vo-meta.json';
import WORDS from '../vo-words.json';

export const FPS = 30;
type LineId = keyof typeof META;
export const V = (id: LineId) => META[id].frames;
/** frame (relative à la réplique) où commence le mot n° i du sous-titre */
export const wordAt = (id: LineId, i: number) => (WORDS as unknown as Record<string, [string, number, number][]>)[id][i][1];

export type SceneId = 'hook' | 'gather' | 'risk' | 'replicate' | 'brake' | 'odometer' | 'brand' | 'cta';
export type Scene = { id: SceneId; from: number; dur: number; trim?: number };
export type Line = { id: LineId; at: number; subs: boolean };

const S: Scene[] = [];
const L: Line[] = [];
let t = 0;
const scene = (id: SceneId, dur: number, trim?: number) => { const s = { id, from: t, dur, trim }; S.push(s); t += dur; return s; };
const line = (id: LineId, at: number, subs = true) => L.push({ id, at, subs });

// 1. Accroche : deux répliques, texte animé sur la voix (pas de sous-titre pour la 1re : le texte À L'ÉCRAN est la réplique)
const H1 = 8, H2 = H1 + V('hook1') + 6;
export const HOOK = { h1: H1, h2: H2 };
{ const s = scene('hook', H2 + V('hook2') + 8); line('hook1', s.from + H1, false); line('hook2', s.from + H2); }
// 2. Promesse : les comptes se rassemblent dans le dashboard
{ const s = scene('gather', 8 + V('promise') + 10); line('promise', s.from + 8); }
// 3. Carte-insight du dashboard (plan Spotlight, rogné à son travelling)
{ const s = scene('risk', Math.max(92, 12 + V('risk') + 12), 40); line('risk', s.from + 12); }
// 4. Réplication (plan Replicate, rogné juste avant la poussée sur le bouton)
{ const s = scene('replicate', Math.max(104, 8 + V('replicate') + 8), 54); line('replicate', s.from + 8); }
// 5. Règles : la fiche défile (Brake), puis « 550 » (Odometer) quand la voix dit le chiffre
{
  const b = scene('brake', 80, 10);
  const at = b.from + 30;
  line('rules', at);
  const n550 = at + wordAt('rules', 8) - 12; // le compteur part un peu avant « cinq cent cinquante »
  S.pop(); t = b.from; scene('brake', n550 - b.from, 10);
  scene('odometer', at + V('rules') + 12 - n550, 30);
}
// 6. Marque : le logo tombe sur « Quantara »
// plan Outro rogné de 4 f : le logo tombe à la frame 34–46 de la scène
export const BRAND_VO = 36;
{ const s = scene('brand', BRAND_VO + V('brand') + 10, 4); line('brand', s.from + BRAND_VO, false); }
// 7. Appel à l'action, tenu ≥ 1 s après la voix
{ const s = scene('cta', 8 + V('cta') + 32); line('cta', s.from + 8, false); }

export const SCENES = S;
export const LINES = L;
export const TOTAL = t;
export const sceneOf = (id: SceneId) => S.find((s) => s.id === id)!;
