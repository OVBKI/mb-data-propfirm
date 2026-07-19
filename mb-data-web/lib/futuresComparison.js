// lib/futuresComparison.js
// ---------------------------------------------------------------------------
// Normalized comparison data layer for the 11 FUTURES propfirms.
//
// SOURCE OF TRUTH : lib/constants.js (PROPFIRM_RULES + helper functions).
// NOTHING is invented or hardcoded here — every numeric / string cell is
// resolved LIVE at call time from PROPFIRM_RULES[firm].rules[KEY][plan] (or a
// helper). This file only holds a CURATED KEY MAP (FIRM_COMPARISON_MAP) that
// says, per firm/model, which rule KEY feeds each comparison cell.
//
// Shape consumed by the future comparator UI (plan selector + grouped table):
//   per-model : ddType  (curated short DD classification — see below)
//   CHALLENGE : ddType, drawdown, dailyDrawdown, objectif, consistance
//   FINANCÉ   : buffer, jourMin, minDailyProfit, consistance
//
// ddType ('Static' | 'EOD' | 'Trailing', or a combo like 'EOD / Trailing') is a
// CURATED literal classification per model — it is NOT a numeric rule resolved
// live, but it is derived from the firm's real drawdown rule text in
// PROPFIRM_RULES and FIRM_META[firm].ddType (lib/firmSlugs.js). null → '—'.
//
// A null cell means "no reliable source in the data" → the UI renders '—'.
// We are CONSERVATIVE : when unsure which key maps to a cell, the map uses null.
// ---------------------------------------------------------------------------

import {
  PROPFIRM_RULES,
  FIRM_SUGGESTIONS,
  firmRules,
  maxDrawdown,
  profitTarget,
  defaultMinDailyProfit,
  planSizeNum,
} from './constants'

// ---------------------------------------------------------------------------
// Resolver helpers
// ---------------------------------------------------------------------------

// Détecte la sentinelle 'idem' — éventuellement décorée d'un emoji/symbole en
// tête (ex: '🚨 idem', '🌟 idem (ex: 50K → bloque à $50,100)'). Dans les
// données, 'idem' signifie « même règle que la taille de plan INFÉRIEURE la
// plus proche ». Ce n'est jamais une valeur affichable.
function isIdemSentinel(v) {
  if (typeof v !== 'string') return false
  // Retire les symboles/emoji de tête avant de tester le mot 'idem'.
  const stripped = v.trim().replace(/^[^a-zà-ÿ0-9]+/i, '')
  return /^idem\b/i.test(stripped)
}

// 'n/a' exact = non applicable pour ce plan/modèle → null (l'UI rend '—').
function isNaSentinel(v) {
  return typeof v === 'string' && /^n\/a$/i.test(v.trim())
}

// Resolve a raw rule value: PROPFIRM_RULES[firm].rules[KEY][plan].
// Returns null if the firm/key/plan is missing. Strings (e.g. '40%', 'AUCUNE')
// and money strings ('$2,000') are passed through verbatim.
// Sentinelles : 'idem' est résolu en redescendant vers la taille de plan
// inférieure la plus proche ayant une vraie valeur ; 'n/a' exact devient null.
function ruleValue(firm, key, plan) {
  if (!key) return null
  // firmRules() = admin override (custom_propfirms) first, else the static catalog —
  // so editing a firm from /admin/propfirms reflects live in the comparator.
  const rules = firmRules(firm)?.rules
  if (!rules) return null
  const row = rules[key]
  if (!row) return null
  let v = row[plan]
  if (v === undefined) return null
  if (isIdemSentinel(v)) {
    // 'idem' → plan inférieur le plus proche avec une valeur non-'idem'.
    const smaller = Object.keys(row)
      .filter(p => planSizeNum(p) < planSizeNum(plan))
      .sort((a, b) => planSizeNum(b) - planSizeNum(a))
    v = undefined
    for (const p of smaller) {
      const candidate = row[p]
      if (candidate !== undefined && !isIdemSentinel(candidate)) {
        v = candidate
        break
      }
    }
    if (v === undefined) return null // rien ne se résout → pas de donnée fiable
  }
  if (isNaSentinel(v)) return null
  return v
}

// Retire une note finale '(… non dispo …)' — elle parle d'AUTRES modèles, la
// valeur qui précède reste valide ('$12,000 (Zero non dispo)' → '$12,000').
function stripNonDispoNote(val) {
  return val.replace(/\s*\([^)]*non\s+dispo[^)]*\)\s*$/i, '').trim()
}

// Vrai si la valeur (une fois une éventuelle note entre parenthèses retirée)
// est un marqueur d'indisponibilité pour le modèle LUI-MÊME :
// 'non dispo', '— non dispo en 25K', 'n/a', '—', '-'. 'AUCUN(E)' (une vraie
// règle « aucune limite ») n'est PAS un marqueur d'indisponibilité.
function isUnavailableValue(val) {
  const core = val.replace(/\s*\([^)]*\)\s*$/, '').trim()
  if (core === '' || core === '—' || core === '-') return true
  if (/^n\/a$/i.test(core)) return true
  if (/^[—–-]?\s*non\s+dispo/i.test(core)) return true
  return false
}

// Per-model extractor for firms whose rule values pack several models into one
// composite string. Trois styles coexistent dans constants.js :
//   Alpha         : 'Premium: $3,000 · Zero: $3,000 · Advanced: $4,000'
//   Phidias       : '$3,000 (E2L) · $4,000 (Fundamental/Premium)'
//   FuturesElites : 'Starter ~$3,000 · Pro ~$4,000' (préfixe sans deux-points)
// Given such a string and a model label, returns the segment value for that
// model, or null if the model is not available at that plan size.
// Une note '(… non dispo …)' en fin de valeur est retirée (elle concerne les
// autres modèles) ; 'non dispo' ne rend null QUE si la valeur du modèle
// lui-même est un marqueur d'indisponibilité, ou si la parenthèse cite
// explicitement CE modèle comme non dispo.
export function extractModelSegment(rawValue, modelLabel) {
  if (rawValue === null || rawValue === undefined) return null
  const str = String(rawValue).trim()
  const esc = String(modelLabel).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const labelRe = new RegExp('\\b' + esc + '\\b', 'i')
  // Split on the firm's segment separator '·'
  const segments = str.split('·').map(s => s.trim()).filter(Boolean)

  // Vrai si la chaîne est composite (segments ciblant des modèles) : dans ce
  // cas, un modèle sans segment est indisponible à cette taille → null.
  let sawModelTargetedSegment = false

  for (const seg of segments) {
    const colonIdx = seg.indexOf(':')
    if (colonIdx > 0) {
      // Style 'Model: valeur' — le préfixe peut lister plusieurs modèles
      // (ex: 'Select/Growth Eval : $1,500').
      sawModelTargetedSegment = true
      if (labelRe.test(seg.slice(0, colonIdx))) {
        const val = stripNonDispoNote(seg.slice(colonIdx + 1).trim())
        return isUnavailableValue(val) ? null : val
      }
      continue
    }
    // Style 'valeur (ModelA/ModelB)' — note finale entre parenthèses.
    const pm = seg.match(/^(.*?)\s*\(([^)]*)\)$/)
    if (pm && labelRe.test(pm[2])) {
      // La parenthèse cite CE modèle : indisponibilité explicite ou valeur.
      if (/non\s+dispo/i.test(pm[2])) return null
      const val = pm[1].trim()
      return isUnavailableValue(val) ? null : val
    }
    if (pm && /^[A-ZÀ-Ý]/.test(pm[2].trim()) && !/non\s+dispo/i.test(pm[2])) {
      // Parenthèse « garde-modèle » citant d'AUTRES modèles → pas pour nous.
      sawModelTargetedSegment = true
      continue
    }
    // Style 'Model valeur' sans deux-points (ex: 'Starter ~$3,000').
    const lm = seg.match(new RegExp('^' + esc + '\\s+(.+)$', 'i'))
    if (lm) {
      const val = stripNonDispoNote(lm[1].trim())
      return isUnavailableValue(val) ? null : val
    }
  }

  // Aucun segment ne cible ce modèle.
  if (sawModelTargetedSegment) return null // composite : modèle absent ici
  // Chaîne globale (s'applique à tous les modèles) — sauf marqueur d'indispo.
  const val = stripNonDispoNote(str)
  return isUnavailableValue(val) ? null : val
}

// Resolve a cell described by a mapping descriptor.
// Descriptor forms:
//   null                       → cell has no source → null
//   { helper: 'maxDrawdown' }  → call the named constants helper
//   { key: 'Rule Name' }       → raw PROPFIRM_RULES value at [key][plan]
//   { key: 'Rule Name', model: 'Premium' } → composite-string per-model segment
function resolveCell(firm, descriptor, plan) {
  if (!descriptor) return null

  if (descriptor.helper) {
    switch (descriptor.helper) {
      case 'maxDrawdown':
        return maxDrawdown(firm, plan)
      case 'profitTarget':
        return profitTarget(firm, plan)
      case 'defaultMinDailyProfit':
        return defaultMinDailyProfit(firm, plan)
      default:
        return null
    }
  }

  const raw = ruleValue(firm, descriptor.key, plan)
  if (descriptor.model) return extractModelSegment(raw, descriptor.model)
  return raw
}

// ---------------------------------------------------------------------------
// CURATED KEY MAP — single source of the mapping (firm → models → cells)
//
// Each cell is either:
//   null                          (no reliable source → '—')
//   { helper: '<helperName>' }    (use a constants helper)
//   { key: '<exact rule key>' }   (raw value)
//   { key: '...', model: '...' }  (composite per-model segment — Alpha Futures,
//                                  Phidias, Tradeify, FuturesElites)
// ---------------------------------------------------------------------------

export const FIRM_COMPARISON_MAP = {
  // -------------------------------------------------------------------------
  'Topstep': {
    models: [
      {
        name: 'Combine → XFA',
        ddType: 'EOD',   // MLL "EOD seulement (PAS intraday)" + FIRM_META 'EOD uniquement'
        challenge: {
          drawdown: { helper: 'maxDrawdown' },              // Max Loss Limit (MLL)
          dailyDrawdown: { key: 'Daily Loss Limit (DLL)' }, // real DLL, Combine + XFA
          objectif: { helper: 'profitTarget' },             // Profit Target (Combine)
          consistance: { key: 'Consistency (Combine)' },    // ≤ 50%
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },              // MLL identical across stages
          dailyDrawdown: { key: 'DLL Live Funded (LFA)' },  // funded DLL
          buffer: null,                                     // no drawdown-buffer rule documented
          jourMin: { key: 'Min trading days (XFA Standard)' }, // 5 winning days
          minDailyProfit: { key: 'Profit min winning day' },  // $150 (XFA Standard)
          consistance: { key: 'Consistency (XFA Standard)' }, // AUCUNE
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  'Apex Trader Funding': {
    models: [
      {
        name: 'Apex (EOD)',
        ddType: 'EOD',   // mapped model = EOD variant (Apex offre aussi Intraday) ; defaultDdType=eod
        challenge: {
          drawdown: { helper: 'maxDrawdown' },                 // Drawdown trailing max
          dailyDrawdown: { key: 'Daily Loss Limit (EOD)' },    // DLL on EOD accounts
          objectif: { helper: 'profitTarget' },                // Objectif de profit
          consistance: { key: 'Règle de cohérence (eval)' },   // AUCUNE en éval
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },                 // trailing DD identical
          dailyDrawdown: { key: 'PA DLL initial' },            // funded PA DLL
          buffer: { key: 'Safety Net (PA)' },                  // safety-net cushion (locks trailing)
          jourMin: null,                                       // no funded min-days rule (qualifying days live in payout text)
          minDailyProfit: { key: 'Qualifying days/payout' },   // string '5 jours · min $200/jour'
          consistance: { key: 'Règle de cohérence (PA)' },     // 50%
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  'Bulenox': {
    models: [
      {
        name: 'Option 1 (No Scaling)',
        ddType: 'Trailing',   // "Option 1 real-time" (trailing intraday)
        challenge: {
          drawdown: { helper: 'maxDrawdown' },                 // Drawdown trailing max
          dailyDrawdown: { key: 'DLL Option 1 (No Scaling)' }, // AUCUN
          objectif: { helper: 'profitTarget' },                // Objectif de profit
          consistance: { key: 'Règle de cohérence (Q)' },      // AUCUNE en Qualification
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL Option 1 (No Scaling)' }, // AUCUN (no separate funded DLL key)
          buffer: { key: 'Drawdown lock (trailing)' },         // locks at starting + $100
          jourMin: { key: 'Jours min Funded/cycle' },          // 5 days between payouts
          minDailyProfit: { key: 'Profit min jour valide' },   // $0
          consistance: { key: 'Règle de cohérence Master' },   // 40%
        },
      },
      {
        name: 'Option 2 (EOD)',
        ddType: 'EOD',   // "Option 2 EOD close 16h CT"
        challenge: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL Option 2 (EOD)' },        // $500 / $1,100 ...
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Règle de cohérence (Q)' },
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL Option 2 (EOD)' },        // funded uses same EOD DLL
          buffer: { key: 'Drawdown lock (trailing)' },
          jourMin: { key: 'Jours min Funded/cycle' },
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Règle de cohérence Master' },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  'Lucid Trading': {
    models: [
      {
        name: 'LucidPro',
        ddType: 'EOD',   // "EOD trailing (recalcule à 16h45 EST close)" ; FIRM_META 'Trailing intraday OU Static'
        challenge: {
          drawdown: { helper: 'maxDrawdown' },                   // Drawdown trailing max
          dailyDrawdown: { key: 'DLL LucidPro/Direct' },         // ~$1,200
          objectif: { helper: 'profitTarget' },                  // Objectif de profit
          consistance: { key: 'Consistency (eval) LucidPro' },   // AUCUNE (supprimée)
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL LucidPro/Direct' },
          buffer: { key: 'Buffer post-payout' },                 // post-payout cushion (see summary note)
          jourMin: { key: 'Jours min LucidPro funded' },         // 3 days between payouts
          minDailyProfit: null,                                  // no per-day profit floor for Pro
          consistance: { key: 'Consistency LucidPro funded' },   // 40%
        },
      },
      {
        name: 'LucidFlex',
        ddType: 'EOD',   // partage le "Drawdown trailing max" EOD de Lucid (pas de DLL)
        challenge: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL LucidFlex' },               // AUCUN (differentiator)
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Consistency (eval) LucidFlex' },  // 50%
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL LucidFlex' },               // AUCUN funded too
          buffer: { key: 'Buffer post-payout' },
          jourMin: { key: 'Jours min LucidFlex funded' },        // 5 profitable days
          minDailyProfit: { key: 'Profit min/jour LucidFlex' },  // $100/$150/$200/$250
          consistance: { key: 'Consistency LucidFlex funded' },  // AUCUNE en funded
        },
      },
      {
        name: 'LucidDirect',
        ddType: 'Static',   // l'option "Static" du couple FIRM_META 'Trailing intraday OU Static (au choix)'
        challenge: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL LucidPro/Direct' },         // shares Pro/Direct DLL
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Consistency LucidDirect' },       // 20% (strict, applies cycle-wide)
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL LucidPro/Direct' },
          buffer: { key: 'Buffer post-payout' },
          jourMin: null,                                         // no Direct-specific funded min-days key
          minDailyProfit: null,
          consistance: { key: 'Consistency LucidDirect' },       // 20% strict (cycle profit)
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  'Tradeify': {
    models: [
      {
        name: 'Select Daily',
        ddType: 'EOD',   // 'Drawdown Select (EOD)' + FIRM_META 'EOD uniquement'
        challenge: {
          drawdown: { key: 'Drawdown Select (EOD)' },
          dailyDrawdown: { key: 'DLL Select Daily' },
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Consistency Select (eval)' },          // 40%
        },
        funded: {
          drawdown: { key: 'Drawdown Select (EOD)' },
          dailyDrawdown: { key: 'DLL Select Daily' },
          buffer: { key: 'Lock drawdown' },                           // +$100 lock cushion
          jourMin: { key: 'Jours de trading min', model: 'Select' },  // '3 jours (Select …)'
          minDailyProfit: { key: 'Profit min jour valide' },          // $50/$100/$200/$300
          consistance: { key: 'Consistency Select Daily (funded)' },  // balance-based (string)
        },
      },
      {
        name: 'Select Flex',
        ddType: 'EOD',   // 'Drawdown Select (EOD)'
        challenge: {
          drawdown: { key: 'Drawdown Select (EOD)' },
          dailyDrawdown: { key: 'DLL Select Flex' },                  // AUCUN
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Consistency Select (eval)' },          // 40%
        },
        funded: {
          drawdown: { key: 'Drawdown Select (EOD)' },
          dailyDrawdown: { key: 'DLL Select Flex' },                  // AUCUN
          buffer: { key: 'Lock drawdown' },
          jourMin: { key: 'Jours de trading min', model: 'Select' },  // '3 jours (Select …)'
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Consistency Select Flex (funded)' },   // 50%
        },
      },
      {
        name: 'Growth',
        ddType: 'EOD',   // 'Drawdown Growth (EOD)'
        challenge: {
          drawdown: { key: 'Drawdown Growth (EOD)' },
          dailyDrawdown: { key: 'DLL Growth' },
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Consistency Growth', model: 'Eval' },  // 'Eval : AUCUNE (unrestricted)'
        },
        funded: {
          drawdown: { key: 'Drawdown Growth (EOD)' },
          dailyDrawdown: { key: 'DLL Growth' },
          buffer: { key: 'Lock drawdown' },
          jourMin: { key: 'Jours de trading min', model: 'Growth' },  // '1 jour (Growth)'
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Consistency Growth', model: 'Funded' }, // 'Funded : 35%'
        },
      },
      {
        name: 'Lightning Funded',
        ddType: 'EOD',   // 'Drawdown Lightning (EOD)' (instant, funded-only)
        challenge: {
          // Lightning skips evaluation (instant) — no eval drawdown/objectif/consistency.
          drawdown: null,
          dailyDrawdown: null,
          objectif: null,
          consistance: null,
        },
        funded: {
          drawdown: { key: 'Drawdown Lightning (EOD)' },
          dailyDrawdown: { key: 'DLL Lightning' },
          buffer: { key: 'Lock drawdown' },
          jourMin: { key: 'Jours de trading min', model: 'Lightning' }, // pas documenté pour Lightning → null
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Consistency Lightning' },              // 20/25/30% string
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  'Take Profit Trader': {
    models: [
      {
        name: 'Test → PRO → PRO+',
        ddType: 'EOD / Trailing',   // Test = 'Drawdown Test (EOD)' · PRO funded = 'Drawdown PRO (INTRADAY)'
        challenge: {
          drawdown: { key: 'Drawdown Test (EOD)' },          // Test EOD trailing
          dailyDrawdown: { key: 'Daily Loss Limit' },        // AUCUN (removed Jan 2025)
          objectif: { helper: 'profitTarget' },              // Objectif de profit
          consistance: { key: 'Règle de cohérence (Test)' }, // ≤ 50% (Test only)
        },
        funded: {
          drawdown: { key: 'Drawdown PRO (INTRADAY)' },      // PRO funded = intraday trailing
          dailyDrawdown: { key: 'Daily Loss Limit' },        // AUCUN on all phases
          buffer: { key: 'Buffer payout (PRO/PRO+)' },       // starting + MLL buffer (payout buffer)
          jourMin: { key: 'Min entre payouts (PRO)' },       // 7 days between payouts
          minDailyProfit: null,                              // no $ floor (just ≥1 trade/day)
          consistance: null,                                 // no consistency on PRO/PRO+
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  'My Funded Futures': {
    models: [
      {
        name: 'Rapid',
        ddType: 'Trailing',   // 'Drawdown Rapid (intraday)' (4% intraday trailing)
        challenge: {
          drawdown: { key: 'Drawdown Rapid (intraday)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },        // AUCUN (string notes Builder/LIVE exceptions)
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Règle de cohérence (eval)' }, // 50% eval
        },
        funded: {
          drawdown: { key: 'Drawdown Rapid (intraday)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },
          buffer: { key: 'Buffer payout (Rapid)' },          // eval max-loss + $100
          jourMin: null,                                     // no funded min-days; payout cadence is daily
          minDailyProfit: null,
          consistance: null,                                 // consistency removed in sim funded
        },
      },
      {
        name: 'Pro',
        ddType: 'EOD',   // 'Drawdown Core/Pro (EOD)' (3% EOD trailing)
        challenge: {
          drawdown: { key: 'Drawdown Core/Pro (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Règle de cohérence (eval)' },
        },
        funded: {
          drawdown: { key: 'Drawdown Core/Pro (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },
          buffer: { key: 'Buffer payout (Pro)' },            // $2,100 + 60% carve-out
          jourMin: null,                                     // payout = 14 calendar days (cadence, not min-days)
          minDailyProfit: null,
          consistance: null,
        },
      },
      {
        name: 'Flex',
        ddType: 'Static',   // 'Drawdown Flex (EOD static)' (4% EOD STATIC · ne trail jamais)
        challenge: {
          drawdown: { key: 'Drawdown Flex (EOD static)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Règle de cohérence (eval)' },
        },
        funded: {
          drawdown: { key: 'Drawdown Flex (EOD static)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },
          buffer: null,                                      // no Flex-specific buffer key (static DD already)
          jourMin: null,
          minDailyProfit: null,
          consistance: null,
        },
      },
      {
        name: 'Builder',
        ddType: 'Static',   // 'Drawdown Builder (buffer)' (fixed buffer, no trail)
        challenge: {
          drawdown: { key: 'Drawdown Builder (buffer)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },        // Builder: $1,000 soft pause (in string)
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Règle de cohérence (eval)' },
        },
        funded: {
          drawdown: { key: 'Drawdown Builder (buffer)' },    // fixed buffer DD itself
          dailyDrawdown: { key: 'Daily Loss Limit' },
          buffer: { key: 'Drawdown Builder (buffer)' },      // the fixed $2K/$1.5K buffer IS the cushion
          jourMin: null,
          minDailyProfit: null,
          consistance: null,
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  'Phidias Propfirm': {
    models: [
      {
        name: 'Static / E2L',
        ddType: 'Static',   // 'Drawdown Static (25K only)' ($500 STATIQUE PUR · ne trail jamais)
        challenge: {
          drawdown: { key: 'Drawdown Static (25K only)' },   // $500 static (25K only)
          dailyDrawdown: { key: 'Daily Loss Limit' },        // AUCUN (no DLL any family)
          objectif: { key: 'Objectif de profit', model: 'E2L' }, // '$1,500 (Static/E2L)' / '$3,000 (E2L)'
          consistance: { key: 'Consistency (eval)' },        // AUCUNE
        },
        funded: {
          drawdown: { key: 'Drawdown Static (25K only)' },   // static stays static
          dailyDrawdown: { key: 'Daily Loss Limit' },
          buffer: null,
          jourMin: null,                                     // Static: first payout = direct LIVE (no min-days)
          minDailyProfit: null,
          consistance: { key: 'Consistency (LIVE)' },        // AUCUNE
        },
      },
      {
        name: 'Fundamental / Swing',
        ddType: 'EOD',   // 'Drawdown Fundamental/Swing (EOD)' (EOD trailing)
        challenge: {
          drawdown: { key: 'Drawdown Fundamental/Swing (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },        // AUCUN
          objectif: { key: 'Objectif de profit', model: 'Fundamental' }, // '$4,000 (Fundamental/Premium)'
          consistance: { key: 'Consistency (eval)' },        // AUCUNE
        },
        funded: {
          drawdown: { key: 'Drawdown Fundamental/Swing (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },
          buffer: null,
          jourMin: null,                                     // no explicit funded min-days key
          minDailyProfit: null,
          consistance: { key: 'Consistency (CASH funded)' }, // 30% max/day (funded)
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  'Funded Futures Network': {
    models: [
      {
        name: 'Standard',
        ddType: 'EOD / Static',   // eval 'Drawdown trailing max (eval)' EOD → 'Drawdown post-Exhibition' STATIC en funded
        challenge: {
          drawdown: { key: 'Drawdown trailing max (eval)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },          // AUCUN
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Consistency Standard (eval)' },  // 40%
        },
        funded: {
          drawdown: { key: 'Drawdown post-Exhibition' },        // STATIC once funded (string)
          dailyDrawdown: { key: 'Daily Loss Limit' },
          buffer: null,                                         // no documented funded drawdown buffer
          jourMin: null,                                        // funded cadence (3-day / daily), not min-days
          minDailyProfit: { key: 'Profit min jour valide' },    // AUCUN (string)
          consistance: { key: 'Consistency funded' },           // 3 first payouts then removed (string)
        },
      },
      {
        name: 'Express',
        ddType: 'EOD / Static',   // idem Standard : EOD en éval → STATIC une fois funded
        challenge: {
          drawdown: { key: 'Drawdown trailing max (eval)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Consistency Express (eval)' },   // 15% (brutal)
        },
        funded: {
          drawdown: { key: 'Drawdown post-Exhibition' },
          dailyDrawdown: { key: 'Daily Loss Limit' },
          buffer: null,
          jourMin: null,
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Consistency funded' },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  'FuturesELites': {
    models: [
      {
        name: 'Starter',
        ddType: 'EOD',   // 'Drawdown trailing max' = "$2,000 EOD (Starter/Pro)"
        challenge: {
          drawdown: { helper: 'maxDrawdown' },                  // Drawdown trailing max
          dailyDrawdown: { key: 'DLL Starter' },                // $1,100 / $2,000 / $3,000
          objectif: { key: 'Objectif de profit', model: 'Starter' }, // 'Starter ~$3,000 · Pro ~$4,000 · …'
          consistance: { key: 'Consistency Starter/Pro' },      // 40%
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL Starter' },
          buffer: { key: 'Mécanisme trailing' },                // lock at starting balance after 1st payout
          jourMin: { key: 'Jours de trading min' },             // ≥5 profitable days / 14 (string)
          minDailyProfit: { key: 'Profit min jour valide' },    // 'Non documenté' (string) → passes through
          consistance: { key: 'Consistency Starter/Pro' },      // 40%
        },
      },
      {
        name: 'Pro',
        ddType: 'EOD',   // 'Drawdown trailing max' = "$2,000 EOD (Starter/Pro)"
        challenge: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL Pro' },                    // AUCUN (differentiator)
          objectif: { key: 'Objectif de profit', model: 'Pro' }, // 'Pro ~$4,000' (segment dédié à 50K)
          consistance: { key: 'Consistency Starter/Pro' },
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL Pro' },                    // AUCUN
          buffer: { key: 'Mécanisme trailing' },
          jourMin: { key: 'Jours de trading min' },
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Consistency Starter/Pro' },
        },
      },
      {
        name: 'Instant Funded',
        ddType: 'Trailing',   // 'Drawdown trailing max' = "Instant : 5% current balance (trailing dynamique)"
        challenge: {
          // Instant Funded skips evaluation; eval-side cells left null.
          drawdown: null,
          dailyDrawdown: null,
          objectif: null,
          consistance: null,
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },                  // 5% current balance (string, captured by maxDrawdown best-effort)
          dailyDrawdown: { key: 'DLL Instant' },                // 'Non documenté' (string)
          buffer: { key: 'Mécanisme trailing' },
          jourMin: { key: 'Jours de trading min' },             // 7 on 14 (Instant, in string)
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Consistency Instant' },          // 25% / 20% disputed (string)
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Alpha Futures — composite per-model strings; values extracted via `model`.
  'Alpha Futures': {
    models: [
      {
        name: 'Premium',
        ddType: 'EOD',   // 'MLL (Maximum Loss Limit)' = "EOD trailing, lock starting balance"
        challenge: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Premium' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Premium' }, // AUCUN
          objectif: { key: 'Objectif de profit', model: 'Premium' },
          consistance: { key: 'Consistency (Eval)', model: 'Premium' }, // 50%
        },
        funded: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Premium' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Premium' }, // AUCUN
          buffer: null,                                                  // MLL locks at starting; no separate buffer rule
          jourMin: { key: 'Min jours trading (Qual)', model: 'Premium' }, // 5
          minDailyProfit: null,                                          // $200 floor lives in payout text, not a per-plan $ field
          consistance: { key: 'Consistency (Qualified)', model: 'Premium' }, // AUCUNE
        },
      },
      {
        name: 'Zero',
        ddType: 'EOD',   // 'MLL (Maximum Loss Limit)' = "EOD trailing, lock starting balance"
        challenge: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Zero' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Zero' },    // $500/$1,000/$2,000
          objectif: { key: 'Objectif de profit', model: 'Zero' },
          consistance: { key: 'Consistency (Eval)', model: 'Zero' },    // AUCUNE
        },
        funded: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Zero' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Zero' },
          buffer: null,
          jourMin: { key: 'Min jours trading (Qual)', model: 'Zero' },  // 5
          minDailyProfit: null,
          consistance: { key: 'Consistency (Qualified)', model: 'Zero' }, // 40% (rare in Qualified)
        },
      },
      {
        name: 'Advanced',
        ddType: 'EOD',   // 'MLL (Maximum Loss Limit)' = "EOD trailing, lock starting balance"
        challenge: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Advanced' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Advanced' }, // AUCUN
          objectif: { key: 'Objectif de profit', model: 'Advanced' },    // 8% target
          consistance: { key: 'Consistency (Eval)', model: 'Advanced' }, // 50%
        },
        funded: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Advanced' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Advanced' }, // AUCUN
          buffer: null,
          jourMin: { key: 'Min jours trading (Qual)', model: 'Advanced' }, // 5
          minDailyProfit: null,
          consistance: { key: 'Consistency (Qualified)', model: 'Advanced' }, // AUCUNE
        },
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Ordered list of firm names for the comparator (reuses FIRM_SUGGESTIONS order).
// Only firms present in the curated map are returned (all 11 are mapped).
export function getFirmsWithComparison() {
  return FIRM_SUGGESTIONS.filter(firm => FIRM_COMPARISON_MAP[firm])
}

// Resolve the full comparison block for a firm at a given plan size.
// Returns { models: [{ name, challenge:{...}, funded:{...} }] } with every cell
// resolved LIVE from PROPFIRM_RULES / helpers, or null where there is no source.
export function getFuturesComparison(firmName, plan) {
  const entry = FIRM_COMPARISON_MAP[firmName]
  if (!entry) return { models: [] }

  const models = entry.models.map(model => ({
    name: model.name,
    // ddType is a curated classification (not a live numeric rule). It is short
    // ('Static' | 'EOD' | 'Trailing' or a combo). null → UI renders '—'.
    ddType: model.ddType ?? null,
    challenge: {
      drawdown: resolveCell(firmName, model.challenge.drawdown, plan),
      dailyDrawdown: resolveCell(firmName, model.challenge.dailyDrawdown, plan),
      objectif: resolveCell(firmName, model.challenge.objectif, plan),
      consistance: resolveCell(firmName, model.challenge.consistance, plan),
    },
    funded: {
      drawdown: resolveCell(firmName, model.funded.drawdown, plan),
      dailyDrawdown: resolveCell(firmName, model.funded.dailyDrawdown, plan),
      buffer: resolveCell(firmName, model.funded.buffer, plan),
      jourMin: resolveCell(firmName, model.funded.jourMin, plan),
      minDailyProfit: resolveCell(firmName, model.funded.minDailyProfit, plan),
      consistance: resolveCell(firmName, model.funded.consistance, plan),
    },
  }))

  return { models }
}

// ---------------------------------------------------------------------------
// Normalisation d'affichage des cellules — partagée avec le comparateur UI
// (components/FuturesRulesComparator.js) et exportée pour être testable.
// ---------------------------------------------------------------------------

// Format monnaie fr : '2 000 $' (espace comme séparateur de milliers).
export function fmtMoney(num) {
  const neg = num < 0
  const abs = Math.abs(num)
  const int = Math.round(abs)
  const s = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (neg ? '-' : '') + s + ' $'
}

// Extrait le premier montant PRÉFIXÉ par '$' d'une chaîne et le retourne en
// NOMBRE (ex: '5 winning days ≥ $150' → 150, '$2,500' → 2500). Un montant
// DOIT être ancré par '$' : les chiffres nus (dates, compteurs, « 3 sources »,
// « 1er payout »…) ne sont JAMAIS interprétés comme de l'argent.
// Retourne null si aucun montant '$' n'existe dans la chaîne.
export function extractMoney(str) {
  if (typeof str !== 'string') return null
  // Run de chiffres + séparateurs de milliers usuels (espace, NBSP, thin
  // space, point, virgule) précédé de '$'.
  const m = str.match(/\$\s*([\d][\d.,\u00a0\u2009 ]*)/)
  if (!m) return null
  // Nettoie les séparateurs de milliers, garde un éventuel décimal.
  const digits = m[1].replace(/[\s\u00a0\u2009]/g, '')
  // '2,000' / '2.000' / '2,000.50' -> on isole la partie entiere.
  const cleaned = digits.replace(/[.,](?=\d{3}\b)/g, '')
  const num = parseFloat(cleaned.replace(',', '.'))
  if (!isFinite(num)) return null
  return num
}

// Normalisation d'une cellule pour l'affichage.
// kind ∈ 'money' | 'pct' | 'days' | 'buffer' | 'type'
// Retourne TOUJOURS { text, title } — title = valeur brute complète (tooltip).
export function cleanCell(value, kind) {
  // null / undefined / '' → '—' pour TOUS les kinds. Pour 'buffer' aussi :
  // null signifie « pas de donnée fiable », PAS « pas de buffer » → jamais 'Non'.
  if (value === null || value === undefined || value === '') {
    return { text: '—', title: '' }
  }

  const rawTitle = String(value)
  const raw = rawTitle.trim()

  // 'type' (ddType) : classification courte déjà normalisée → passe-through.
  if (kind === 'type') {
    return { text: raw, title: rawTitle }
  }

  const trunc = (s, n = 18) =>
    s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s

  if (kind === 'money') {
    if (typeof value === 'number') {
      return { text: fmtMoney(value), title: rawTitle }
    }
    if (/aucun/i.test(raw) || raw === '—') return { text: '—', title: rawTitle }
    const money = extractMoney(raw)
    if (money !== null) return { text: fmtMoney(money), title: rawTitle }
    // Pas de montant '$' → on retombe sur le texte brut tronqué (jamais un
    // nombre inventé depuis des chiffres non monétaires).
    return { text: trunc(raw), title: rawTitle }
  }

  if (kind === 'pct') {
    if (typeof value === 'number') {
      return { text: value + ' %', title: rawTitle }
    }
    // 'AUCUN(E)' ne vaut « pas de règle » que s'il OUVRE la valeur — pas quand
    // il apparaît en milieu de phrase après un vrai pourcentage
    // (ex: '50% — aucun jour > 50% du profit total…' doit afficher '50 %').
    if (/^aucun/i.test(raw)) return { text: '—', title: rawTitle }
    const m = raw.match(/(\d+(?:[.,]\d+)?)\s*%/)
    if (m) return { text: m[1].replace(',', '.') + ' %', title: rawTitle }
    return { text: trunc(raw), title: rawTitle }
  }

  if (kind === 'days') {
    if (typeof value === 'number') {
      return { text: String(value), title: rawTitle }
    }
    const m = raw.match(/\d+/)
    if (m) return { text: m[0], title: rawTitle }
    return { text: trunc(raw), title: rawTitle }
  }

  if (kind === 'buffer') {
    // 'AUCUN' / 'Non …' explicites = un vrai « pas de buffer » → 'Non'.
    if (/aucun|^non\b/i.test(raw)) return { text: 'Non', title: rawTitle }
    if (typeof value === 'number') return { text: fmtMoney(value), title: rawTitle }
    const money = extractMoney(raw)
    if (money !== null) return { text: fmtMoney(money), title: rawTitle }
    return { text: trunc(raw), title: rawTitle }
  }

  // fallback générique
  return { text: trunc(raw), title: rawTitle }
}
