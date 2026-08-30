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

import { extractModelSegment, isUnavailableValue, stripNonDispoNote } from './programSegment'
import {
  PROPFIRM_RULES,
  FIRM_SUGGESTIONS,
  firmRules,
  customFirmPrograms,
  CUSTOM_FIRM_NAMES,
  maxDrawdown,
  profitTarget,
  defaultMinDailyProfit,
  planSizeNum,
} from './constants'

// Ré-exporté : le parseur vit désormais dans programSegment.js (voir l'entête
// de ce fichier pour la raison), mais les consommateurs historiques l'importent
// depuis ici.
export { extractModelSegment }

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
function resolveCell(firm, descriptor, plan, modelName = null, siblings = null) {
  if (!descriptor) return null

  if (descriptor.helper) {
    // ⚠️ `descriptor.model` DOIT être transmis. Sans lui, les trois programmes de
    // Lucid affichaient le même drawdown : le helper prenait le premier nombre de
    // la cellule, identique pour tout le monde. Le comparateur montrait donc trois
    // colonnes qui se distinguaient partout SAUF sur le chiffre qui compte.
    // ⚠️ PAS de repli sur le modèle de la colonne ici. Un helper reçoit le
    // programme UNIQUEMENT via `model:`, et c'est délibéré : plusieurs firmes
    // étiquettent leurs cellules par VARIANTE et non par programme du comparateur
    // (« Select/Growth Eval » chez Tradeify, « Pro 1-Day Addon » chez My Funded
    // Futures, « Instant : 5% buffer » chez FuturesElites). Un repli automatique
    // y chercherait un segment nommé comme la colonne, n'en trouverait pas, et
    // viderait sept cellules aujourd'hui correctes — ou pire, prendrait le
    // montant d'un add-on pour celui du programme.
    const program = descriptor.model || null
    switch (descriptor.helper) {
      case 'maxDrawdown':
        return maxDrawdown(firm, plan, program)
      case 'profitTarget':
        return profitTarget(firm, plan, program)
      case 'defaultMinDailyProfit':
        return defaultMinDailyProfit(firm, plan, program)
      default:
        return null
    }
  }

  const raw = ruleValue(firm, descriptor.key, plan)
  if (descriptor.model) return extractModelSegment(raw, descriptor.model)

  // Repli : le descripteur ne cite pas de programme, mais la CELLULE nomme ce
  // modèle (« Builder : $1,000 soft pause », « EOD : $500 · Legacy : aucune »).
  // Sans ça l'UI affichait la chaîne composite ENTIÈRE dans la colonne d'un seul
  // programme — le tableau montrait « EOD : $1,000 · Legacy : aucune » là où on
  // attend « $1,000 ».
  //
  // La condition est volontairement stricte : on n'extrait QUE si le nom du
  // modèle apparaît vraiment. Beaucoup de cellules sont de la prose contenant un
  // deux-points (« si dépassé : Profit Target AUGMENTE ») ; les découper les
  // viderait de leur sens.
  if (modelName && mentionsModel(raw, modelName)) {
    const seg = extractModelSegment(raw, modelName)
    if (seg !== null) return seg
  }

  // La cellule cite d'AUTRES programmes de cette firme, avec deux-points, mais
  // pas celui-ci : la valeur ne le concerne donc pas. « Legacy : aucune » dans la
  // colonne EOD n'est pas une information, c'est la règle du voisin.
  //
  // On se base sur la liste RÉELLE des modèles de la firme, pas sur une heuristique
  // de forme : beaucoup de cellules sont de la prose avec un deux-points
  // (« reset chaque session 5:00 PM CT ») et doivent passer telles quelles.
  if (modelName && siblings?.length && typeof raw === 'string') {
    const namesOther = siblings.filter(n => n && n !== modelName)
    if (namesOther.some(n => new RegExp(`${escapeForRe(n)}\\s*:`, 'i').test(raw))) return null
  }
  return raw
}

function escapeForRe(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Le nom du modèle apparaît-il tel quel dans la cellule ? Bornes construites
// comme dans programSegment : un libellé finissant par un signe (« PRO+ ») n'a
// pas de frontière de mot après lui.
function mentionsModel(raw, modelName) {
  if (typeof raw !== 'string' || !modelName) return false
  const esc = String(modelName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const head = /^\w/.test(modelName) ? '\\b' : ''
  const tail = /\w$/.test(modelName) ? '\\b' : '(?![\\w+])'
  return new RegExp(head + esc + tail, 'i').test(raw)
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
    // Un seul parcours (Combine → XFA → LFA), mais au passage en Express Funded
    // le trader fait un choix DÉFINITIF entre deux structures de payout. Elles ne
    // changent ni l'objectif ni le MLL — elles changent ce qu'il faut faire pour
    // être payé, et c'est justement ce que l'app suit.
    models: [
      {
        name: 'XFA Standard',
        ddType: 'EOD',
        challenge: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'Daily Loss Limit (DLL)' },
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Consistency (Combine)' },       // best day <= 50 %
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL Live Funded (LFA)' },
          buffer: null,
          jourMin: { key: 'Min trading days (XFA Standard)' }, // 5 jours gagnants
          minDailyProfit: { key: 'Profit min winning day' },   // $150
          consistance: { key: 'Consistency (XFA Standard)' },  // AUCUNE
        },
      },
      {
        // L'autre voie : 3 jours au lieu de 5 et un plafond de retrait plus haut,
        // au prix d'une règle de consistance à 40 %. Le choix est IRRÉVERSIBLE.
        name: 'XFA Consistency',
        ddType: 'EOD',
        challenge: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'Daily Loss Limit (DLL)' },
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Consistency (Combine)' },
        },
        funded: {
          drawdown: { helper: 'maxDrawdown' },
          dailyDrawdown: { key: 'DLL Live Funded (LFA)' },
          buffer: null,
          jourMin: { key: 'Min trading days (XFA Consistency)' },
          minDailyProfit: null,                                 // pas de plancher $ sur cette voie
          consistance: { key: 'Consistency (XFA Consistency)' },
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  'Apex Trader Funding': {
    // Trois programmes, et ce n'est pas cosmétique : depuis mars 2026 Apex vend
    // deux variantes (EOD et Intraday) qui partagent les montants mais pas la
    // mécanique ni le prix, tandis que les comptes achetés AVANT gardent
    // l'ancienne échelle de drawdown. Un porteur de compte legacy à qui on
    // afficherait le chiffre 4.0 verrait une jauge fausse de 25 à 50 %.
    //
    // ⚠️ Les noms doivent correspondre EXACTEMENT aux étiquettes utilisées dans
    //   les cellules de constants.js ('EOD', 'Intraday', 'Legacy') : c'est sur
    //   elles que extractModelSegment découpe.
    models: [
      {
        name: 'EOD',
        ddType: 'EOD',
        challenge: {
          drawdown: { key: 'Drawdown trailing max', model: 'EOD' },
          dailyDrawdown: { key: 'Daily Loss Limit (EOD)' },    // la DLL n'existe que sur EOD
          objectif: { key: 'Objectif de profit', model: 'EOD' },
          consistance: { key: 'Règle de cohérence (eval)' },   // AUCUNE en éval
        },
        funded: {
          drawdown: { key: 'Drawdown trailing max', model: 'EOD' },
          dailyDrawdown: { key: 'PA DLL initial' },
          buffer: { key: 'Safety Net (PA)', model: 'EOD' },
          jourMin: null,                                       // les qualifying days vivent dans le texte payout
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Règle de cohérence (PA)' },     // 50%
        },
      },
      {
        name: 'Intraday',
        ddType: 'Trailing',
        challenge: {
          drawdown: { key: 'Drawdown trailing max', model: 'Intraday' },
          dailyDrawdown: { key: 'Daily Loss Limit (Intraday)' }, // AUCUNE — c'est le différenciateur
          objectif: { key: 'Objectif de profit', model: 'Intraday' },
          consistance: { key: 'Règle de cohérence (eval)' },
        },
        funded: {
          drawdown: { key: 'Drawdown trailing max', model: 'Intraday' },
          dailyDrawdown: { key: 'DLL Intraday (PA)' },
          buffer: { key: 'Safety Net (PA)', model: 'Intraday' },
          jourMin: null,
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Règle de cohérence (PA)' },
        },
      },
      {
        name: 'Legacy',
        ddType: 'EOD',   // acheté avant mars 2026, ancienne échelle de drawdown
        challenge: {
          drawdown: { key: 'Drawdown trailing max', model: 'Legacy' },
          dailyDrawdown: { key: 'Daily Loss Limit (EOD)' },
          objectif: { key: 'Objectif de profit', model: 'Legacy' },
          consistance: { key: 'Règle de cohérence (eval)' },
        },
        funded: {
          drawdown: { key: 'Drawdown trailing max', model: 'Legacy' },
          dailyDrawdown: { key: 'PA DLL initial' },
          buffer: { key: 'Safety Net (PA)', model: 'Legacy' },
          jourMin: null,
          minDailyProfit: { key: 'Profit min jour valide' },
          consistance: { key: 'Règle de cohérence (PA)' },
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
  // Quatre programmes vendus au checkout (PDF officiel, août 2026). LucidDaily
  // manquait au catalogue : c'est le seul programme dont le TYPE de drawdown est
  // une option d'achat (EOD ou Intraday), et le seul à payer quotidiennement.
  'Lucid Trading': {
    models: [
      {
        name: 'LucidPro',
        ddType: 'EOD',
        challenge: {
          drawdown: { helper: 'maxDrawdown', model: 'LucidPro' },
          dailyDrawdown: { key: 'Daily Loss Limit (éval)' },     // $600 → $2,700, OPTIONNELLE
          objectif: { helper: 'profitTarget', model: 'LucidPro' },
          consistance: { key: 'Consistency (eval)' },            // AUCUNE en éval
        },
        funded: {
          drawdown: { helper: 'maxDrawdown', model: 'LucidPro' },
          dailyDrawdown: { key: 'DLL funded (sous le trail initial)' },
          buffer: { key: 'Buffer post-payout' },
          jourMin: { key: 'Jours min avant payout' },            // 3 jours
          minDailyProfit: { key: 'Profit min/jour (funded)' },   // aucun pour Pro
          consistance: { key: 'Consistency funded' },            // 40%
        },
      },
      {
        name: 'LucidFlex',
        ddType: 'EOD',
        challenge: {
          drawdown: { helper: 'maxDrawdown', model: 'LucidFlex' },
          dailyDrawdown: { key: 'Daily Loss Limit (éval)' },
          objectif: { helper: 'profitTarget', model: 'LucidFlex' },
          consistance: { key: 'Consistency (eval)' },            // 50% en éval
        },
        funded: {
          drawdown: { helper: 'maxDrawdown', model: 'LucidFlex' },
          dailyDrawdown: { key: 'DLL funded (sous le trail initial)' },
          buffer: { key: 'Buffer post-payout' },
          jourMin: { key: 'Jours min avant payout' },            // 5 jours
          minDailyProfit: { key: 'Profit min/jour (funded)' },   // $100 → $250
          consistance: { key: 'Consistency funded' },            // AUCUNE en financé
        },
      },
      {
        name: 'LucidDaily',
        // Le tableau officiel donne « EOD or Intraday » : le type se choisit à
        // l'achat. On annonce les deux plutôt que d'en privilégier un — un
        // porteur de compte Intraday à qui l'app afficherait « EOD » lirait un
        // seuil recalculé une fois par jour là où le sien suit le plus haut.
        ddType: 'EOD / Intraday',
        challenge: {
          drawdown: { helper: 'maxDrawdown', model: 'LucidDaily' },
          dailyDrawdown: { key: 'Daily Loss Limit (éval)' },
          objectif: { helper: 'profitTarget', model: 'LucidDaily' },
          consistance: { key: 'Consistency (eval)' },            // 50%
        },
        funded: {
          drawdown: { helper: 'maxDrawdown', model: 'LucidDaily' },
          dailyDrawdown: { key: 'DLL funded (sous le trail initial)' },
          buffer: { key: 'Buffer post-payout' },
          jourMin: { key: 'Jours min avant payout' },            // payouts QUOTIDIENS
          minDailyProfit: { key: 'Profit min/jour (funded)' },
          consistance: { key: 'Consistency funded' },            // AUCUNE en financé
        },
      },
      {
        name: 'LucidDirect',
        ddType: 'EOD',   // le PDF tranche : EOD, et non 'Static' comme supposé
        challenge: {
          drawdown: { helper: 'maxDrawdown', model: 'LucidDirect' },
          dailyDrawdown: { key: 'Daily Loss Limit (éval)' },     // sans objet : financé direct
          objectif: { helper: 'profitTarget', model: 'LucidDirect' },                  // aucun objectif
          consistance: { key: 'Consistency (eval)' },            // 20%
        },
        funded: {
          drawdown: { helper: 'maxDrawdown', model: 'LucidDirect' },
          dailyDrawdown: { key: 'DLL funded (sous le trail initial)' },
          buffer: { key: 'Buffer post-payout' },
          jourMin: { key: 'Jours min avant payout' },            // 5 jours
          minDailyProfit: { key: 'Profit min/jour (funded)' },
          consistance: { key: 'Consistency funded' },            // 20%
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
    // Parcours unique (Test → PRO → PRO+), mais les deux étages financés n'ont ni
    // la même mécanique de drawdown ni le même split — et c'est ce qui décide de
    // la jauge de risque. PRO+ est en plus un compte LIVE, pas simulé.
    models: [
      {
        name: 'PRO',
        ddType: 'EOD / Trailing',   // Test en EOD, puis PRO financé en intraday
        challenge: {
          drawdown: { key: 'Drawdown Test (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },        // AUCUN depuis janvier 2025
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Règle de cohérence (Test)' }, // <= 50 %, phase Test seulement
        },
        funded: {
          drawdown: { key: 'Drawdown PRO (INTRADAY)' },      // trailing INTRADAY : plus sévère
          dailyDrawdown: { key: 'Daily Loss Limit' },
          buffer: { key: 'Buffer payout (PRO/PRO+)' },
          jourMin: { key: 'Min entre payouts (PRO)' },       // 7 jours entre payouts
          minDailyProfit: null,
          consistance: null,
        },
      },
      {
        // Promotion automatique et gratuite depuis PRO. Le drawdown repasse en EOD
        // (moins sévère), le split monte à 90/10, et l'exécution devient réelle.
        name: 'PRO+',
        ddType: 'EOD',
        challenge: {
          drawdown: { key: 'Drawdown Test (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },
          objectif: { helper: 'profitTarget' },
          consistance: { key: 'Règle de cohérence (Test)' },
        },
        funded: {
          drawdown: { key: 'Drawdown PRO+ (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit' },
          buffer: { key: 'Buffer payout (PRO/PRO+)' },
          jourMin: { key: 'Min entre payouts (PRO+)' },
          minDailyProfit: null,
          consistance: null,
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
    // Phidias 2.0 (2026) : E2L a remplacé la famille Static et couvre les 4 tailles,
    // Swing est devenue Premium. Les trois programmes se distinguent d'abord par la
    // MÉCANIQUE de drawdown, pas par les montants : E2L est STATIQUE (il ne suit
    // jamais le solde), les deux autres sont en EOD trailing.
    models: [
      {
        name: 'E2L',
        ddType: 'Static',
        challenge: {
          drawdown: { key: 'Drawdown E2L (statique)' },
          dailyDrawdown: { key: 'Daily Loss Limit', model: 'E2L' },
          objectif: { key: 'Objectif de profit', model: 'E2L' },
          consistance: { key: 'Consistency (eval)', model: 'E2L' },
        },
        funded: {
          drawdown: { key: 'Drawdown E2L (statique)' },
          dailyDrawdown: { key: 'Daily Loss Limit', model: 'E2L' },
          buffer: null,
          jourMin: { key: 'Jours de trading min', model: 'E2L' },
          minDailyProfit: null,
          consistance: { key: 'Consistency (CASH funded)', model: 'E2L' },
        },
      },
      {
        name: 'Fundamental',
        ddType: 'EOD',
        challenge: {
          drawdown: { key: 'Drawdown Fundamental/Premium (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit', model: 'Fundamental' },
          objectif: { key: 'Objectif de profit', model: 'Fundamental' },
          consistance: { key: 'Consistency (eval)', model: 'Fundamental' },
        },
        funded: {
          drawdown: { key: 'Drawdown Fundamental/Premium (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit', model: 'Fundamental' },
          buffer: null,
          jourMin: { key: 'Jours de trading min', model: 'Fundamental' },
          minDailyProfit: null,
          consistance: { key: 'Consistency (CASH funded)', model: 'Fundamental' },
        },
      },
      {
        // Manquait au catalogue alors que c'est le programme le plus distinctif :
        // seul à autoriser l'overnight ET le week-end, et seul à monter le split
        // jusqu'à 100 % à partir du 5e payout.
        name: 'Premium',
        ddType: 'EOD',
        challenge: {
          drawdown: { key: 'Drawdown Fundamental/Premium (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit', model: 'Premium' },
          objectif: { key: 'Objectif de profit', model: 'Premium' },
          consistance: { key: 'Consistency (eval)', model: 'Premium' },
        },
        funded: {
          drawdown: { key: 'Drawdown Fundamental/Premium (EOD)' },
          dailyDrawdown: { key: 'Daily Loss Limit', model: 'Premium' },
          buffer: null,
          jourMin: { key: 'Jours de trading min', model: 'Premium' },
          minDailyProfit: null,
          consistance: { key: 'Consistency (CASH funded)', model: 'Premium' },
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
    // Renommé en août 2026 (vérifié sur alpha-futures.com) : Premium / Zero /
    // Advanced sont devenus Zero / Standard / Direct. Direct est un financement
    // DIRECT — pas d'évaluation du tout, d'où les cases de challenge à null.
    models: [
      {
        name: 'Zero',
        ddType: 'EOD',
        challenge: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Zero' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Zero' },
          objectif: { key: 'Objectif de profit', model: 'Zero' },
          consistance: { key: 'Consistency (Eval)', model: 'Zero' },      // aucune
        },
        funded: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Zero' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Zero' },
          buffer: null,
          jourMin: { key: 'Min jours trading (Qual)', model: 'Zero' },
          minDailyProfit: null,
          consistance: { key: 'Consistency (Qualified)', model: 'Zero' },  // 40 %
        },
      },
      {
        name: 'Standard',
        ddType: 'EOD',
        challenge: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Standard' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Standard' },
          objectif: { key: 'Objectif de profit', model: 'Standard' },
          consistance: { key: 'Consistency (Eval)', model: 'Standard' },   // 50 %
        },
        funded: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Standard' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Standard' },
          buffer: null,
          jourMin: { key: 'Min jours trading (Qual)', model: 'Standard' },
          minDailyProfit: null,
          consistance: { key: 'Consistency (Qualified)', model: 'Standard' },
        },
      },
      {
        name: 'Direct',
        ddType: 'EOD',
        challenge: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Direct' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Direct' },
          objectif: { key: 'Objectif de profit', model: 'Direct' },
          consistance: { key: 'Consistency (Eval)', model: 'Direct' },
        },
        funded: {
          drawdown: { key: 'MLL (Maximum Loss Limit)', model: 'Direct' },
          dailyDrawdown: { key: 'Daily Loss Guard', model: 'Direct' },
          buffer: null,
          jourMin: { key: 'Min jours trading (Qual)', model: 'Direct' },
          minDailyProfit: null,
          consistance: { key: 'Consistency (Qualified)', model: 'Direct' }, // 20 %
        },
      },
    ],
  },
  'FundedNext Futures': {
    // Quatre programmes. Rapid Pro et Rapid Daily partagent objectif, MLL et prix :
    // ce qui les sépare, c'est la DLL, la consistance et la cadence de payout — donc
    // deux entrées distinctes, sinon le comparateur les confondrait.
    //
    // ⚠ Les libellés doivent être écrits en entier ('Rapid Pro', pas 'Rapid') :
    //   extractModelSegment cherche \bRapid Pro\b dans le préfixe du segment.
    models: [
      {
        name: 'Flex',
        ddType: 'EOD',   // MLL trailing EOD, verrouillé au solde initial + $100
        challenge: {
          drawdown: { key: 'Drawdown trailing max', model: 'Flex' },
          dailyDrawdown: { key: 'Perte journalière (DLL)', model: 'Flex' },   // aucune
          objectif: { key: 'Objectif de profit', model: 'Flex' },
          consistance: { key: 'Consistency (éval)', model: 'Flex' },          // 40%
        },
        funded: {
          drawdown: { key: 'Drawdown trailing max', model: 'Flex' },
          dailyDrawdown: { key: 'Perte journalière (DLL)', model: 'Flex' },
          buffer: { key: 'Règle buffer', model: 'Flex' },                     // aucune
          jourMin: { key: 'Jours de trading min', model: 'Flex' },            // 5
          minDailyProfit: null,                                               // aucun seuil $ publié
          consistance: { key: 'Consistency (financé)', model: 'Flex' },       // aucune
        },
      },
      {
        name: 'Legacy',
        ddType: 'EOD',
        challenge: {
          drawdown: { key: 'Drawdown trailing max', model: 'Legacy' },
          dailyDrawdown: { key: 'Perte journalière (DLL)', model: 'Legacy' }, // aucune
          objectif: { key: 'Objectif de profit', model: 'Legacy' },
          consistance: { key: 'Consistency (éval)', model: 'Legacy' },        // 40%
        },
        funded: {
          drawdown: { key: 'Drawdown trailing max', model: 'Legacy' },
          dailyDrawdown: { key: 'Perte journalière (DLL)', model: 'Legacy' },
          buffer: { key: 'Règle buffer', model: 'Legacy' },                   // aucune
          jourMin: { key: 'Jours de trading min', model: 'Legacy' },          // 5
          minDailyProfit: null,
          consistance: { key: 'Consistency (financé)', model: 'Legacy' },     // aucune
        },
      },
      {
        name: 'Rapid Pro',
        ddType: 'EOD',
        challenge: {
          drawdown: { key: 'Drawdown trailing max', model: 'Rapid Pro' },
          dailyDrawdown: { key: 'Perte journalière (DLL)', model: 'Rapid Pro' }, // aucune
          objectif: { key: 'Objectif de profit', model: 'Rapid Pro' },
          consistance: { key: 'Consistency (éval)', model: 'Rapid Pro' },     // aucune
        },
        funded: {
          drawdown: { key: 'Drawdown trailing max', model: 'Rapid Pro' },
          dailyDrawdown: { key: 'Perte journalière (DLL)', model: 'Rapid Pro' },
          buffer: { key: 'Règle buffer', model: 'Rapid Pro' },                // aucune
          jourMin: { key: 'Jours de trading min', model: 'Rapid Pro' },       // 0
          minDailyProfit: null,
          consistance: { key: 'Consistency (financé)', model: 'Rapid Pro' },  // 40% — ici, pas en éval
        },
      },
      {
        name: 'Rapid Daily',
        ddType: 'EOD',
        challenge: {
          drawdown: { key: 'Drawdown trailing max', model: 'Rapid Daily' },
          dailyDrawdown: { key: 'Perte journalière (DLL)', model: 'Rapid Daily' }, // $500/$1,000/$1,250
          objectif: { key: 'Objectif de profit', model: 'Rapid Daily' },
          consistance: { key: 'Consistency (éval)', model: 'Rapid Daily' },   // aucune
        },
        funded: {
          drawdown: { key: 'Drawdown trailing max', model: 'Rapid Daily' },
          dailyDrawdown: { key: 'Perte journalière (DLL)', model: 'Rapid Daily' },
          buffer: { key: 'Règle buffer', model: 'Rapid Daily' },              // solde de clôture ≥ initial + MLL + $100
          jourMin: { key: 'Jours de trading min', model: 'Rapid Daily' },     // 0
          minDailyProfit: null,
          consistance: { key: 'Consistency (financé)', model: 'Rapid Daily' },// aucune
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
// Programmes réellement disponibles pour une firme, et — si `plan` est fourni —
// pour CETTE taille de compte. C'est ce que le sélecteur « type de compte »
// affiche à la création.
//
// ⚠️ La disponibilité se décide sur les descripteurs du COMPARATEUR, pas sur
// maxDrawdown(). Le helper balaie toutes les clés « Drawdown … » et retombe sur
// celle d'un autre programme quand la sienne vaut 'n/a' : Phidias Fundamental
// paraissait donc exister en 25K, où il n'est pas vendu, en héritant du chiffre
// d'E2L. Le descripteur, lui, pointe une clé PRÉCISE par programme.
export function programsForFirm(firmName, plan = null) {
  const entry = FIRM_COMPARISON_MAP[firmName]
  const names = entry
    ? entry.models.map(m => m.name)
    : (customFirmPrograms(firmName) || []).map(m => m.name)
  if (!plan || names.length === 0) return names

  const cmp = getFuturesComparison(firmName, plan)
  const byName = new Map((cmp?.models || []).map(m => [m.name, m]))
  // Un programme est vendu à cette taille s'il y résout un drawdown OU un
  // objectif. On teste les deux : certaines firmes laissent une case vide.
  return names.filter(n => {
    const m = byName.get(n)
    if (!m) return false
    // Le critère est le DRAWDOWN, jamais l'objectif : beaucoup de firmes
    // partagent le même objectif entre tous leurs programmes, si bien qu'il
    // résout partout et ne prouve rien. Le drawdown, lui, est propre à chaque
    // programme et vaut 'n/a' aux tailles où il n'est pas vendu.
    //
    // On regarde les deux phases : les offres à financement direct (Tradeify
    // Lightning, LucidDirect) n'ont pas de challenge du tout.
    return m.challenge?.drawdown != null || m.funded?.drawdown != null
  })
}

// Le programme proposé par défaut : le premier disponible à cette taille.
export function defaultProgramFor(firmName, plan) {
  return programsForFirm(firmName, plan)[0] || null
}

export function getFirmsWithComparison() {
  const curated = FIRM_SUGGESTIONS.filter(firm => FIRM_COMPARISON_MAP[firm])
  // Admin-added custom firms not already in the curated map (brand-new firms).
  const custom = CUSTOM_FIRM_NAMES.filter(n => !FIRM_COMPARISON_MAP[n])
  return [...curated, ...custom]
}

// Best-effort mapping of a custom firm's free-form rules → the comparator columns,
// so a brand-new firm added from /admin/propfirms shows up. One model per program.
function customComparisonModels(firmName, plan) {
  const programs = customFirmPrograms(firmName)
  if (!programs) return null
  const findKey = (rules, re) => Object.keys(rules || {}).find(k => re.test(k)) || null
  return programs.map(prog => {
    const rules = prog.rules || {}
    const val = (key) => (key ? (rules[key]?.[plan] ?? null) : null)
    const ddKey = findKey(rules, /drawdown|dd\b|max loss|mll/i)
    const ddRaw = ddKey ? String(rules[ddKey]?.[plan] || Object.values(rules[ddKey] || {})[0] || '') : ''
    const ddType = /trailing/i.test(ddRaw) ? 'Trailing' : /\beod\b/i.test(ddRaw) ? 'EOD' : /static/i.test(ddRaw) ? 'Static' : null
    return {
      name: prog.name || '',
      ddType,
      challenge: {
        drawdown: val(ddKey),
        dailyDrawdown: val(findKey(rules, /daily|dll|perte.*jour|dd.*jour/i)),
        objectif: val(findKey(rules, /objectif|profit.*target|target/i)),
        consistance: val(findKey(rules, /consist/i)),
      },
      funded: {
        drawdown: null,
        dailyDrawdown: null,
        buffer: val(findKey(rules, /buffer/i)),
        jourMin: val(findKey(rules, /jours?.*min|min.*jours?|winning.*day/i)),
        minDailyProfit: val(findKey(rules, /profit.*min.*jour|min.*profit.*jour/i)),
        consistance: val(findKey(rules, /consist/i)),
      },
    }
  })
}

// Resolve the full comparison block for a firm at a given plan size.
// Returns { models: [{ name, challenge:{...}, funded:{...} }] } with every cell
// resolved LIVE from PROPFIRM_RULES / helpers, or null where there is no source.
export function getFuturesComparison(firmName, plan) {
  const entry = FIRM_COMPARISON_MAP[firmName]
  if (!entry) {
    // Not in the curated map → a custom admin firm: derive columns from its rules.
    const custom = customComparisonModels(firmName, plan)
    return { models: custom || [] }
  }

  // Les noms des AUTRES programmes servent à écarter les segments qui ne
  // concernent pas le modèle courant (voir resolveCell).
  const modelNames = entry.models.map(m => m.name)

  const models = entry.models.map(model => ({
    name: model.name,
    // ddType is a curated classification (not a live numeric rule). It is short
    // ('Static' | 'EOD' | 'Trailing' or a combo). null → UI renders '—'.
    ddType: model.ddType ?? null,
    challenge: {
      drawdown: resolveCell(firmName, model.challenge.drawdown, plan, model.name, modelNames),
      dailyDrawdown: resolveCell(firmName, model.challenge.dailyDrawdown, plan, model.name, modelNames),
      objectif: resolveCell(firmName, model.challenge.objectif, plan, model.name, modelNames),
      consistance: resolveCell(firmName, model.challenge.consistance, plan, model.name, modelNames),
    },
    funded: {
      drawdown: resolveCell(firmName, model.funded.drawdown, plan, model.name, modelNames),
      dailyDrawdown: resolveCell(firmName, model.funded.dailyDrawdown, plan, model.name, modelNames),
      buffer: resolveCell(firmName, model.funded.buffer, plan, model.name, modelNames),
      jourMin: resolveCell(firmName, model.funded.jourMin, plan, model.name, modelNames),
      minDailyProfit: resolveCell(firmName, model.funded.minDailyProfit, plan, model.name, modelNames),
      consistance: resolveCell(firmName, model.funded.consistance, plan, model.name, modelNames),
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
