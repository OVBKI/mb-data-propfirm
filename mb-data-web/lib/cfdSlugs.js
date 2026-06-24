// lib/cfdSlugs.js — slug helpers + light editorial layer for CFD PropFirm pages.
// Mirrors lib/firmSlugs.js (futures) but for the CFD vertical (lib/cfdConstants.js).
// Editorial is intentionally minimal & factual: a one-line tagline per firm. Key
// facts and FAQs are derived from CFD_PROPFIRM_RULES at render time so we never
// invent rules that diverge from the sourced data.

import { CFD_PROPFIRM_RULES, CFD_FIRM_ORDER } from './cfdConstants'

// Stable, SEO-friendly slugs (kept explicit so they don't drift if a name changes).
const FIRM_TO_SLUG = {
  'FTMO': 'ftmo',
  'FundedNext': 'fundednext',
  'The5ers': 'the5ers',
  'E8 Markets': 'e8-markets',
  'FundingPips': 'fundingpips',
  'Alpha Capital Group': 'alpha-capital-group',
  'Funded Trading Plus': 'funded-trading-plus',
  'The Funded Trader': 'the-funded-trader',
  'Blueberry Funded': 'blueberry-funded',
}
const SLUG_TO_FIRM = Object.fromEntries(Object.entries(FIRM_TO_SLUG).map(([k, v]) => [v, k]))

export function cfdFirmToSlug(name) {
  return FIRM_TO_SLUG[name] || String(name || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
export function cfdSlugToFirm(slug) {
  return SLUG_TO_FIRM[slug] || null
}
export function getAllCfdSlugs() {
  return CFD_FIRM_ORDER.map((name) => FIRM_TO_SLUG[name]).filter(Boolean)
}
export function getCfdFirmsOrdered() {
  return CFD_FIRM_ORDER
    .filter((name) => CFD_PROPFIRM_RULES[name])
    .map((name) => ({ name, slug: FIRM_TO_SLUG[name], ...CFD_PROPFIRM_RULES[name] }))
}

// One-line factual taglines (FR). Derived from the sourced research, no invented rules.
export const CFD_FIRM_TAGLINE = {
  'FTMO': 'La référence CFD historique : challenge 2-step, max loss statique 10%, payouts on-demand.',
  'FundedNext': 'Gamme Stellar (1/2-step, Lite, Instant), reward share dès la phase de challenge.',
  'The5ers': 'Firme établie depuis 2016, scaling agressif (le solde double tous les +10%), split jusqu’à 100%.',
  'E8 Markets': 'Drawdowns personnalisables : E8 One 1-step (max 4% trailing) jusqu’à 100% de split.',
  'FundingPips': 'Payout flexible — le split dépend de la cadence choisie (60% hebdo → 100% mensuel).',
  'Alpha Capital Group': 'Gamme large 1/2/3-step (One, Pro, Swing, Three), plateformes MT5/cTrader/DXtrade.',
  'Funded Trading Plus': 'Bonne réputation (Trustpilot ~4,4★), swap-free, payouts rapides ~2 j ouvrés.',
  'The Funded Trader': '⚠️ Gros catalogue mais incident de payouts en 2024 — à considérer avec prudence.',
  'Blueberry Funded': '5 modèles dont Instant ; réputation payout mitigée — vérifie avant de t’engager.',
}
