// lib/drawdownHealth.js — solde, plus haut et plancher de drawdown d'un compte,
// recalculés à partir des trades du journal.
//
// UNE seule implémentation pour deux lecteurs : la page /app/health (dans le
// navigateur) et le cron drawdown-guardian (côté serveur). Le cron lisait avant
// des colonnes `balance` / `dd_floor` que personne n'écrit : il n'a jamais
// envoyé une seule alerte. Extraire le calcul de la page garantit que l'alerte
// et la jauge disent la même chose.
import { planSizeNum, maxDrawdown } from './constants'

// Compute per-account derived stats from trades (journal_entries).
// Returns: { [accountId]: { balance, peakBalance, totalPnl, bestDayAmount,
//                          totalProfit, daysCount, winningDaysCount } }
export function computeStatsByAccount(trades, accountsById) {
  // Group PnL by account → by day
  const byAcct = {}
  for (const t of trades) {
    const acctId = t.account_id
    if (!acctId) continue
    const acct = accountsById[acctId]
    if (!acct) continue
    // Exclude trades before funded_date (for Funded accounts)
    if (acct.funded_date && t.date && t.date < acct.funded_date) continue
    const day = (t.date || '').slice(0, 10)
    if (!day) continue
    const pnl = Number(t.pnl) || 0
    if (!byAcct[acctId]) byAcct[acctId] = { byDay: {}, totalPnl: 0 }
    byAcct[acctId].byDay[day] = (byAcct[acctId].byDay[day] || 0) + pnl
    byAcct[acctId].totalPnl += pnl
  }

  // For each account, compute balance (initial + cumulative pnl), peak EOD balance,
  // best winning day, total profit (sum of winning days only? OR net total?)
  const stats = {}
  for (const [acctId, data] of Object.entries(byAcct)) {
    const acct = accountsById[acctId]
    const initialBalance = planSizeNum(acct.plan_size) || 0

    // Sort days chronologically + compute cumulative balance per day
    const days = Object.entries(data.byDay).sort((a, b) => a[0].localeCompare(b[0]))
    let cum = initialBalance
    let peak = initialBalance
    for (const [_, dayPnl] of days) {
      cum += dayPnl
      if (cum > peak) peak = cum
    }

    // Best winning day
    let bestDayAmount = 0
    let bestDayDate = ''
    for (const [d, p] of days) {
      if (p > bestDayAmount) { bestDayAmount = p; bestDayDate = d }
    }

    // Somme des jours GAGNANTS (dénominateur consistency, règle Topstep/Apex).
    const winningDaysProfit = days.reduce((s, [_, p]) => s + (p > 0 ? p : 0), 0)

    stats[acctId] = {
      balance: cum,
      peakBalance: peak,
      totalPnl: data.totalPnl,
      bestDayAmount,
      bestDayDate,
      daysCount: days.length,
      winningDaysCount: days.filter(([_, p]) => p > 0).length,
      winningDaysProfit,
    }
  }

  // Fallback for accounts WITH no trades : still provide initial balance
  for (const a of Object.values(accountsById)) {
    if (stats[a.id]) continue
    const init = planSizeNum(a.plan_size) || 0
    stats[a.id] = {
      balance: init,
      peakBalance: init,
      totalPnl: 0,
      bestDayAmount: 0,
      bestDayDate: '',
      daysCount: 0,
      winningDaysCount: 0,
      winningDaysProfit: 0,
    }
  }
  return stats
}

// Compute drawdown floor per account based on dd_type + firm rules.
// - static : floor = initial - maxDD
// - eod    : floor moves with peak EOD high, then locks at initial (Topstep-style)
// - trailing : floor = peak - maxDD (no cap), tick-by-tick (we approximate with EOD peak)
// Drawdown max d'un compte : la valeur saisie par le trader (`custom_drawdown`)
// l'emporte sur celle du catalogue. Le widget du dashboard et la jauge de la page
// Santé la respectaient, le calcul du plancher non : la même marge pouvait
// différer d'un écran à l'autre.
export function maxDrawdownFor(account, firmName) {
  const custom = account.custom_drawdown != null && Number(account.custom_drawdown) > 0
    ? Number(account.custom_drawdown) : null
  return custom ?? maxDrawdown(firmName, account.plan_size, account.program)
}

// Lit les trades (account_id, date, pnl) page par page : PostgREST plafonne une
// réponse à 1 000 lignes, et un historique tronqué donnerait un faux solde.
// `client` est un client Supabase (navigateur ou service role).
export async function fetchTradePnl(client, { userId, accountIds } = {}) {
  const out = []
  const chunks = accountIds ? [] : [null]
  if (accountIds) for (let i = 0; i < accountIds.length; i += 200) chunks.push(accountIds.slice(i, i + 200))
  for (const chunk of chunks) {
    for (let from = 0; ; from += 1000) {
      let q = client.from('journal_entries').select('id, account_id, date, pnl')
      if (userId) q = q.eq('user_id', userId)
      if (chunk) q = q.in('account_id', chunk)
      const { data, error } = await q.order('id').range(from, from + 999)
      if (error) return { data: null, error }
      out.push(...(data || []))
      if (!data || data.length < 1000) break
    }
  }
  return { data: out, error: null }
}

export function computeDdFloor(account, firmName, peakBalance) {
  const initial = planSizeNum(account.plan_size) || 0
  // `account.program` = le programme choisi par le trader. Sans lui, on servait
  // le drawdown du programme principal de la firme, faux d'un quart à la moitié
  // pour qui tient un compte Apex legacy ou un FundedNext Rapid.
  const maxDD = maxDrawdownFor(account, firmName)
  if (!maxDD || !initial) return null

  const ddType = (account.dd_type || 'static').toLowerCase()
  if (ddType === 'static') {
    return initial - maxDD
  }
  if (ddType === 'eod') {
    // Trailing with lock at starting balance
    const peakOrInitial = Math.max(peakBalance, initial)
    return Math.min(peakOrInitial - maxDD, initial)
  }
  // 'trailing' or unknown : pure trailing, no lock
  return Math.max(peakBalance, initial) - maxDD
}

// Marge restante d'un compte, telle que la jauge de /app/health l'affiche.
// `stats` = l'entrée de computeStatsByAccount pour ce compte.
// roomPct = marge ÷ drawdown max autorisé (part du coussin encore disponible).
export function drawdownMargin(account, firmName, stats) {
  const balance = account.balance != null ? Number(account.balance) : stats?.balance
  const peak = Math.max(stats?.peakBalance || 0, balance || 0)
  const ddFloor = account.dd_floor != null ? Number(account.dd_floor) : computeDdFloor(account, firmName, peak)
  if (balance == null || ddFloor == null) return null
  const room = balance - ddFloor
  const maxDD = maxDrawdownFor(account, firmName) || 0
  const denom = maxDD > 0 ? maxDD : (planSizeNum(account.plan_size) || 0)
  return { balance, ddFloor, room, roomPct: denom > 0 ? room / denom : 1 }
}
