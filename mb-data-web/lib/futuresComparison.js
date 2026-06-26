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
//   CHALLENGE : drawdown, dailyDrawdown, objectif, consistance
//   FINANCÉ   : drawdown, dailyDrawdown, buffer, jourMin, minDailyProfit, consistance
//
// A null cell means "no reliable source in the data" → the UI renders '—'.
// We are CONSERVATIVE : when unsure which key maps to a cell, the map uses null.
// ---------------------------------------------------------------------------

import {
  PROPFIRM_RULES,
  FIRM_SUGGESTIONS,
  maxDrawdown,
  profitTarget,
  defaultMinDailyProfit,
} from './constants'

// ---------------------------------------------------------------------------
// Resolver helpers
// ---------------------------------------------------------------------------

// Resolve a raw rule value: PROPFIRM_RULES[firm].rules[KEY][plan].
// Returns null if the firm/key/plan is missing. Strings (e.g. '40%', 'AUCUNE')
// and money strings ('$2,000') are passed through verbatim.
function ruleValue(firm, key, plan) {
  if (!key) return null
  const rules = PROPFIRM_RULES[firm]?.rules
  if (!rules) return null
  const row = rules[key]
  if (!row) return null
  const v = row[plan]
  return v === undefined ? null : v
}

// Per-model extractor for firms (Alpha Futures) whose rule values pack several
// models into one composite string, e.g.
//   'Premium: $3,000 · Zero: $3,000 · Advanced: $4,000'
//   'Zero: $1,500 (Premium/Advanced non dispo)'
// Given such a string and a model label ('Premium' | 'Zero' | 'Advanced'),
// returns the segment value for that model, or null if the model is not
// available at that plan size.
function extractModelSegment(rawValue, modelLabel) {
  if (rawValue === null || rawValue === undefined) return null
  const str = String(rawValue)
  // Split on the firm's segment separator '·'
  const segments = str.split('·').map(s => s.trim())
  const re = new RegExp('^' + modelLabel + '\\s*:\\s*(.+)$', 'i')
  for (const seg of segments) {
    const m = seg.match(re)
    if (m) {
      const val = m[1].trim()
      // 'non dispo' / 'AUCUN(E)' style → treat unavailability as null, but keep
      // explicit 'AUCUN'/'AUCUNE' (a real "no daily loss" rule) as-is.
      if (/non\s+dispo/i.test(val) || val === '—' || val === '-') return null
      return val
    }
  }
  // No "Model:" prefix anywhere → the string is global (applies to all models).
  // Only return it if it isn't an unavailability marker.
  if (!/:/.test(str)) {
    if (/non\s+dispo/i.test(str) || str === '—' || str === '-') return null
    return str
  }
  return null
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
//   { key: '...', model: '...' }  (composite per-model segment, Alpha Futures)
// ---------------------------------------------------------------------------

export const FIRM_COMPARISON_MAP = {
  // -------------------------------------------------------------------------
  'Topstep': {
    models: [
      {
        name: 'Combine → XFA',
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
          jourMin: { key: 'Jours de trading min' },                   // 3 days (Select)
          minDailyProfit: { key: 'Profit min jour valide' },          // $50/$100/$200/$300
          consistance: { key: 'Consistency Select Daily (funded)' },  // balance-based (string)
        },
      },
      {
        name: 'Select Flex',
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
          jourMin: { key: 'Jours de trading min' },
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Consistency Select Flex (funded)' },   // 50%
        },
      },
      {
        name: 'Growth',
        challenge: {
          drawdown: { key: 'Drawdown Growth (EOD)' },
          dailyDrawdown: { key: 'DLL Growth' },
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Consistency Growth' },                 // string: Eval AUCUNE · Funded 35%
        },
        funded: {
          drawdown: { key: 'Drawdown Growth (EOD)' },
          dailyDrawdown: { key: 'DLL Growth' },
          buffer: { key: 'Lock drawdown' },
          jourMin: { key: 'Jours de trading min' },                   // 1 day (Growth) — see string
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Consistency Growth' },                 // 35% funded (within string)
        },
      },
      {
        name: 'Lightning Funded',
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
          jourMin: { key: 'Jours de trading min' },
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
        challenge: {
          drawdown: { key: 'Drawdown Static (25K only)' },   // $500 static (25K only)
          dailyDrawdown: { key: 'Daily Loss Limit' },        // AUCUN (no DLL any family)
          objectif: { helper: 'profitTarget' },
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
        challenge: {
          drawdown: { key: 'Drawdown Fundamental/Swing (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },        // AUCUN
          objectif: { helper: 'profitTarget' },
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
        challenge: {
          drawdown: { helper: 'maxDrawdown' },                  // Drawdown trailing max
          dailyDrawdown: { key: 'DLL Starter' },                // $1,100 / $2,000 / $3,000
          objectif: { helper: 'profitTarget' },                 // composite string (Starter/Pro/Instant)
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
        challenge: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL Pro' },                    // AUCUN (differentiator)
          objectif: { helper: 'profitTarget' },
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
