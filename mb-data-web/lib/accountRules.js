// lib/accountRules.js — les règles qui s'appliquent à UN compte, aujourd'hui.
//
// Le catalogue décrit chaque firme par programme et par phase (évaluation ou
// financé), en prose sourcée (« $1,200 si activée », « 50% (relâché de 30%) »).
// Ce module en tire des NOMBRES exploitables par le contrôle des règles après un
// trade et la préparation au payout. Il passe par la même résolution que le
// comparateur (getFuturesComparison), donc par les mêmes cellules.
//
// Principe : en cas de doute, aucune règle. Une cellule « AUCUNE », « non
// documenté », « sans objet » ou une phrase sans montant donne null — mieux vaut
// ne rien signaler que signaler une limite inventée.
import { getFuturesComparison, defaultProgramFor } from './futuresComparison'
import { defaultMinTradingDays, defaultMinDailyProfit, profitTarget, planSizeNum } from './constants'

const NONE = /^\s*(aucun|aucune|none|no\b|non\b|sans objet|n\/a|—|-\s*$|oui\b)/i

/** Premier montant en $ d'une cellule, ou null si la cellule dit « aucun ». */
export function ruleMoney(v) {
  if (typeof v === 'number') return v > 0 ? v : null
  if (typeof v !== 'string' || NONE.test(v)) return null
  const m = v.match(/\$\s*([\d][\d.,  ]*)/)
  if (!m) return null
  const n = parseFloat(m[1].replace(/[\s ]/g, '').replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.'))
  return isFinite(n) && n > 0 ? n : null
}

/** Premier pourcentage d'une cellule, en fraction (0.4), ou null. */
export function rulePct(v) {
  if (typeof v === 'number') return v > 0 && v <= 100 ? (v > 1 ? v / 100 : v) : null
  if (typeof v !== 'string' || NONE.test(v)) return null
  const m = v.match(/(\d+(?:[.,]\d+)?)\s*%/)
  if (!m) return null
  const n = parseFloat(m[1].replace(',', '.'))
  return n > 0 && n <= 100 ? n / 100 : null
}

export function accountPhase(account) {
  const s = String(account?.status || '').toLowerCase()
  if (s === 'financé' || s === 'funded') return 'funded'
  if (s === 'challenge') return 'challenge'
  return null
}

/**
 * Règles applicables au compte, pour son programme et sa phase.
 * Les valeurs saisies sur le compte (payout_target, min_trading_days) priment
 * sur le catalogue : c'est le trader qui connaît son contrat.
 */
export function accountRuleSet(account, firmName) {
  const plan = account?.plan_size
  const phase = accountPhase(account)
  const out = { program: null, phase, dailyLoss: null, consistency: null, profitTarget: null, minDays: null, minDailyProfit: null, notes: {} }
  if (!firmName || !plan || !phase) return out
  const { models } = getFuturesComparison(firmName, plan)
  const wanted = account.program || defaultProgramFor(firmName, plan)
  const model = models.find((m) => m.name === wanted) || models[0]
  if (!model) return out
  const cells = phase === 'funded' ? model.funded : model.challenge
  out.program = model.name
  out.dailyLoss = ruleMoney(cells.dailyDrawdown)
  out.consistency = rulePct(cells.consistance)
  out.notes = { dailyLoss: cells.dailyDrawdown ?? null, consistency: cells.consistance ?? null }
  if (phase === 'challenge') {
    out.profitTarget = profitTarget(firmName, plan, model.name)
  } else {
    const start = planSizeNum(plan)
    const target = account.payout_target != null ? Number(account.payout_target) - start : null
    out.profitTarget = target != null && target > 0 ? target : null
    out.minDays = account.min_trading_days != null ? Number(account.min_trading_days) : defaultMinTradingDays(firmName, plan, model.name)
    out.minDailyProfit = defaultMinDailyProfit(firmName, plan, model.name)
  }
  return out
}
