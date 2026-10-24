// lib/payoutReadiness.js — un compte financé peut-il demander un payout ?
//
// Trois conditions, lues dans les règles du compte (lib/accountRules) et
// mesurées sur les trades depuis le dernier payout (ou depuis le passage en
// financé s'il n'y en a pas encore) :
//   - profit : P&L de la période ≥ objectif de payout ;
//   - jours  : jours qualifiants (P&L du jour ≥ minimum de la firm) ≥ jours requis ;
//   - consistance : meilleur jour ÷ gains des jours gagnants ≤ plafond.
// Une condition inconnue (règle absente du catalogue et non saisie) n'est pas
// affichée plutôt qu'inventée.
import { accountRuleSet } from './accountRules'

export function payoutWindowStart(account) {
  const dates = (account.payouts || []).map((p) => p.date).filter(Boolean).sort()
  return dates.length ? { date: dates[dates.length - 1], inclusive: false } : { date: account.funded_date || null, inclusive: true }
}

export function payoutReadiness({ account, firmName, trades }) {
  const rules = accountRuleSet(account, firmName)
  if (rules.phase !== 'funded') return null
  const start = payoutWindowStart(account)
  const byDay = {}
  for (const t of trades || []) {
    if (t.account_id !== account.id) continue
    const d = (t.date || '').slice(0, 10)
    if (!d) continue
    if (start.date && (start.inclusive ? d < start.date : d <= start.date)) continue
    byDay[d] = (byDay[d] || 0) + (Number(t.pnl) || 0)
  }
  const days = Object.values(byDay)
  const profit = days.reduce((s, p) => s + p, 0)
  const checks = []

  if (rules.profitTarget) {
    checks.push({ key: 'profit', ok: profit >= rules.profitTarget, current: profit, required: rules.profitTarget })
  }
  if (rules.minDays) {
    const min = rules.minDailyProfit || 0
    const qualifying = days.filter((p) => (min > 0 ? p >= min : p > 0)).length
    checks.push({ key: 'days', ok: qualifying >= rules.minDays, current: qualifying, required: rules.minDays, minDailyProfit: rules.minDailyProfit })
  }
  if (rules.consistency) {
    const wins = days.filter((p) => p > 0)
    const total = wins.reduce((s, p) => s + p, 0)
    const share = total > 0 ? Math.max(...wins) / total : null
    // Un seul jour gagnant pèse 100 % : la règle n'est tenue qu'à partir de deux.
    checks.push({ key: 'consistency', ok: share != null && wins.length >= 2 && share <= rules.consistency, current: share, required: rules.consistency })
  }

  return {
    since: start.date,
    profit,
    tradingDays: days.length,
    checks,
    ready: checks.length > 0 && checks.every((c) => c.ok),
  }
}
