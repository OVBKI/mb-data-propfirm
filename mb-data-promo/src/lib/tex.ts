// tex.ts — accès aux captures réelles (2x) et à leur géométrie (layout.json).
import { staticFile } from 'remotion';
import layout from '../../public/textures/layout.json';

type L = { pageH?: number; box?: { x: number; y: number; w: number; h: number } };
const LAYOUT = layout as Record<string, L>;
export const tex = (id: string) => staticFile(`textures/${id}.png`);
export const pageH = (id: string) => LAYOUT[id]?.pageH ?? 1080;
export const box = (id: string) => LAYOUT[id]!.box!;
