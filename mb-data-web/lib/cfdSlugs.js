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

// Firm-wide "infrastructure" fields a sub-model inherits from the flagship unless it
// overrides them. These are account/firm policies (not per-model rules), so inheriting
// them is safe; the actual RULES (steps, profitTargets, dailyLoss, maxLoss,
// minTradingDays, consistency) are NEVER inherited — a sub-model only exposes what its
// catalog entry states explicitly, everything else stays absent (rendered as '—').
const CFD_INFRA_KEYS = ['accountSizes', 'currency', 'leverage', 'platforms', 'payout', 'profitSplit', 'priceIndicative']

// getCfdModels(firmName) → normalized [flagship, ...otherModels] for the selectors.
// Each entry has a stable shape:
//   { name, desc, isFlagship, steps?, accountSizes, currency, leverage, platforms,
//     payout, profitSplit, profitTargets?, dailyLoss?, maxLoss?, minTradingDays?,
//     consistency? }
// - flagship: derived from firm.flagship (name = flagship.model, desc = null).
// - otherModels: firm-wide infra merged UNDER the entry's own fields, so overrides win
//   and unstated rules resolve to undefined (the UI treats that as '—' / editable).
// Back-compat: a legacy string entry is wrapped as { name, desc } with no rules.
export function getCfdModels(firmName) {
  const firm = CFD_PROPFIRM_RULES[firmName]
  if (!firm) return []
  const fl = firm.flagship || {}
  const flagshipModel = { ...fl, name: fl.model || firmName, desc: null, isFlagship: true }

  const infra = {}
  for (const k of CFD_INFRA_KEYS) if (fl[k] !== undefined) infra[k] = fl[k]

  const others = (firm.otherModels || []).map((m) => {
    if (typeof m === 'string') {
      const name = m.split('(')[0].split('—')[0].trim() || m
      return { name, desc: m, isFlagship: false }
    }
    const { name, desc, ...overrides } = m
    return {
      ...infra,
      ...overrides,
      name: name || (desc ? String(desc).split('(')[0].trim() : firmName),
      desc: desc || null,
      isFlagship: false,
    }
  })
  return [flagshipModel, ...others]
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
