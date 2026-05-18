// lib/tradeTags.js — Tags trades prédéfinis pour le journal Quantara.
//
// PHILOSOPHIE : 12 tags couvrant les 3 axes psychologiques que tout trader pro
// doit tracker pour progresser :
//   1. QUALITÉ DU SETUP        (A+, B, C)  → distingue les hauts/bas convictions
//   2. ERREURS PSYCHOLOGIQUES  (FOMO, revenge, overtrading, hesitation)
//   3. CONTEXTE / STYLE        (plan respecté, news, breakout, reversal, scalp)
//
// L'utilisateur peut aussi ajouter des tags free-text pour les cas custom
// (ex: "open-NFP", "session-asia", "MFE>2R", etc.). Le composant TagSelector
// gère les 2 modes (presets cliquables + input texte libre).
//
// USAGE :
//   import { TRADE_TAGS, getTagMeta, normalizeTag } from '@/lib/tradeTags'
//   TRADE_TAGS.forEach(tag => <Badge key={tag.id} {...tag} />)
//   const meta = getTagMeta('fomo')  // { id, label, color, bg, category }

// === Catégories pour le grouping visuel dans le selector ===
export const TAG_CATEGORIES = {
  setup:   { label: 'Qualité du setup',     icon: '🎯' },
  mistake: { label: 'Erreurs psychologiques', icon: '⚠' },
  context: { label: 'Contexte / Style',     icon: '📊' },
}

// === Tags prédéfinis ===
// id        : slug stable (utilisé en DB, jamais changer après prod)
// label     : nom affiché en français
// color     : couleur du texte du badge (token thème)
// bg        : couleur de fond du badge (rgba avec alpha pour glow)
// category  : pour grouping dans le selector
// description : tooltip optionnel
export const TRADE_TAGS = [
  // ────────── Qualité du setup ──────────
  { id: 'a-plus',    label: 'A+ Setup',     color: '#1db87a', bg: 'rgba(29,184,122,0.18)',  category: 'setup',
    description: 'Setup haute conviction, toutes les conditions sont réunies' },
  { id: 'b-setup',   label: 'B Setup',      color: '#4d8fff', bg: 'rgba(77,143,255,0.18)',  category: 'setup',
    description: 'Setup standard, conditions correctes mais pas exceptionnelles' },
  { id: 'c-setup',   label: 'C Setup',      color: '#9098b0', bg: 'rgba(144,152,176,0.18)', category: 'setup',
    description: 'Setup faible — à éviter en général' },

  // ────────── Erreurs psychologiques ──────────
  { id: 'fomo',         label: 'FOMO',          color: '#e8504a', bg: 'rgba(232,80,74,0.18)',  category: 'mistake',
    description: 'Entré par peur de rater le mouvement' },
  { id: 'revenge',      label: 'Revenge Trade', color: '#b8453f', bg: 'rgba(184,69,63,0.22)',  category: 'mistake',
    description: 'Pris pour récupérer une perte précédente' },
  { id: 'overtrading',  label: 'Overtrading',   color: '#fac775', bg: 'rgba(250,199,117,0.18)',category: 'mistake',
    description: 'Trade en trop dans la session' },
  { id: 'hesitation',   label: 'Hesitation',    color: '#ffb84d', bg: 'rgba(255,184,77,0.18)', category: 'mistake',
    description: 'Hésité avant d\'entrer, exécution retardée' },

  // ────────── Contexte / Style ──────────
  { id: 'plan-respecte', label: 'Plan respecté', color: '#1db87a', bg: 'rgba(29,184,122,0.12)', category: 'context',
    description: 'Trade exécuté en respectant strictement le plan' },
  { id: 'news-play',     label: 'News Play',     color: '#a76ef5', bg: 'rgba(167,110,245,0.18)',category: 'context',
    description: 'Trade pris sur news macro (NFP, FOMC, CPI...)' },
  { id: 'breakout',      label: 'Breakout',      color: '#4fd1ff', bg: 'rgba(79,209,255,0.18)', category: 'context',
    description: 'Cassure d\'un niveau / range' },
  { id: 'reversal',      label: 'Reversal',      color: '#ff7eb6', bg: 'rgba(255,126,182,0.18)',category: 'context',
    description: 'Retournement contre tendance court terme' },
  { id: 'scalp',         label: 'Scalp',         color: '#5eead4', bg: 'rgba(94,234,212,0.18)', category: 'context',
    description: 'Trade court terme (quelques ticks / minutes)' },
]

// Index pour lookup rapide
const TAG_INDEX = Object.fromEntries(TRADE_TAGS.map(t => [t.id, t]))

// === Helpers ===

// Récupère les metadata d'un tag (ou null si custom/inconnu)
export function getTagMeta(id) {
  return TAG_INDEX[id] || null
}

// Récupère metadata + fallback pour tag custom (free-text)
// Pour un tag custom, on génère une couleur stable basée sur le hash du nom.
export function getTagDisplay(id) {
  const known = TAG_INDEX[id]
  if (known) return known
  // Fallback custom tag : neutre, gris bleu
  return {
    id,
    label: id,
    color: '#9098b0',
    bg: 'rgba(144,152,176,0.14)',
    category: 'custom',
    description: 'Tag custom',
  }
}

// Normalise un tag free-text saisi par l'user :
// - trim
// - lowercase
// - remplace espaces par tirets
// - garde lettres, chiffres, tirets, underscores
// - max 30 chars
export function normalizeTag(raw) {
  if (!raw) return ''
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 30)
}

// Liste de tous les IDs de tags prédéfinis (pour validation)
export const PRESET_TAG_IDS = TRADE_TAGS.map(t => t.id)

// Groupe les tags par catégorie (pour rendu dans le selector)
export const TAGS_BY_CATEGORY = TRADE_TAGS.reduce((acc, t) => {
  if (!acc[t.category]) acc[t.category] = []
  acc[t.category].push(t)
  return acc
}, {})
