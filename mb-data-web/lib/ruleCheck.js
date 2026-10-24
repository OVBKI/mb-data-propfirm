// lib/ruleCheck.js — où en est un compte par rapport à ses règles, juste après
// un trade.
//
// Pur : reçoit le compte, sa firm et ses trades (account_id, date, pnl), rend
// une liste de constats. La fenêtre de saisie l'appelle après chaque
// enregistrement ; le même calcul de marge que la page Santé et que l'alerte
// serveur (lib/drawdownHealth), pour que les trois disent la même chose.
//
// Niveaux : 'info' (objectif atteint), 'warn', 'danger', 'breach'.
import { computeStatsByAccount, drawdownMargin } from './drawdownHealth'
import { accountRuleSet } from './accountRules'
import { accountMaxContracts } from './contractLimits'
import { contractKind } from './exposure'

export const DD_WARN = 0.5
export const DD_DANGER = 0.8
const LEVEL_RANK = { info: 0, warn: 1, danger: 2, breach: 3 }

function levelFor(used) {
  if (used >= 1) return 'breach'
  if (used >= DD_DANGER) return 'danger'
  if (used >= DD_WARN) return 'warn'
  return null
}

// `trade` (facultatif) : { instrument, quantity } du trade qu'on vient de saisir.
export function checkAccountRules({ account, firmName, trades, day, trade = null }) {
  const items = []
  const rules = accountRuleSet(account, firmName)
  if (!rules.phase) return { level: null, items, rules }
  const mine = (trades || []).filter((t) => t.account_id === account.id)
  const stats = computeStatsByAccount(mine, { [account.id]: account })[account.id]

  // 1. Drawdown max : part du coussin consommée.
  const m = drawdownMargin(account, firmName, stats)
  if (m && m.roomPct != null) {
    const used = 1 - m.roomPct
    const level = m.room <= 0 ? 'breach' : levelFor(used)
    if (level) items.push({ rule: 'drawdown', level, used, room: m.room, floor: m.ddFloor, balance: m.balance })
  }

  // 2. Perte journalière du jour du trade. Les trades d'avant le passage en
  // financé ne comptent pas (même règle que computeStatsByAccount).
  if (rules.dailyLoss && day) {
    const dayPnl = mine
      .filter((t) => (t.date || '').slice(0, 10) === day && !(account.funded_date && t.date < account.funded_date))
      .reduce((s, t) => s + (Number(t.pnl) || 0), 0)
    if (dayPnl < 0) {
      const used = -dayPnl / rules.dailyLoss
      const level = levelFor(used)
      if (level) items.push({ rule: 'dailyLoss', level, used, loss: -dayPnl, limit: rules.dailyLoss })
    }
  }

  // 3. Consistance : poids du meilleur jour dans les gains. Sans objet avant
  // deux jours de trading — un seul jour pèse toujours 100 %.
  if (rules.consistency && stats && stats.daysCount >= 2 && stats.winningDaysProfit > 0) {
    const share = stats.bestDayAmount / stats.winningDaysProfit
    if (share > rules.consistency) {
      items.push({ rule: 'consistency', level: 'warn', share, limit: rules.consistency, bestDay: stats.bestDayAmount })
    }
  }

  // 4. Taille de position : contrats du trade contre la limite du compte. Seulement
  // si l'instrument est un mini ou un micro connu et que le catalogue donne une
  // limite lisible (lib/contractLimits).
  const qty = Number(trade?.quantity)
  const kind = trade ? contractKind(trade.instrument) : null
  if (qty > 0 && kind) {
    const lim = accountMaxContracts(account, firmName)
    const limit = kind === 'mini' ? lim?.mini : (lim?.micro ?? (lim?.mini != null ? lim.mini * 10 : null))
    if (limit != null && qty > limit) {
      items.push({ rule: 'contracts', level: 'danger', qty, limit, kind })
    }
  }

  // 5. Objectif atteint : bon à savoir tout de suite (arrêter, demander le payout).
  if (rules.profitTarget && stats && stats.totalPnl >= rules.profitTarget) {
    items.push({ rule: 'target', level: 'info', profit: stats.totalPnl, target: rules.profitTarget })
  }

  items.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level])
  return { level: items[0]?.level || null, items, rules }
}
