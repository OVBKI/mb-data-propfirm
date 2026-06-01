// Lucid Trading adapter — verrouillé sur le schéma réel de
// GET /api/users/accountInfo/<userKey>?accountKey=<accountKey>
//
// Réponse Lucid (vérifiée juin 2026):
//   [{
//     accountSummary: { userKey, accountKey, accountName, planCode, status,
//                       accountType, accountBalance, minAccountBalance,
//                       profitTarget, distToProfitTarget, ... },
//     accountEquity:  [{ dataDate, accountBalance, minAccountBalance, ... }],
//     calendarData:   [{ dataDate, netPnl, highPnl, lowPnl, qtyTraded,
//                        commissions, trades, winPct }],
//     symbolData:     [{ dataDate, symbol, exchange, netPnl, highPnl, lowPnl,
//                        qtyTraded, commissions, trades, avgWin, avgLoss,
//                        winPct, ... }],
//   }]
//
// On utilise symbolData parce qu'il porte le symbole (MNQM6, ES, NQ…) en plus
// du P&L quotidien. Chaque ligne devient un journal_entries unique :
//   external_id = `${accountKey}:${dataDate}:${symbol}`
// Si un jour combine plusieurs symboles, on aura plusieurs entrées ce jour-là
// — c'est le comportement attendu côté Quantara.

const ACCOUNT_INFO_RE = /\/api\/users\/accountInfo\//i

export function adaptLucid(payload) {
  if (!payload || payload.status >= 400) return null
  const url = String(payload.url || '')
  if (!ACCOUNT_INFO_RE.test(url)) return null
  if (typeof payload.body !== 'string' || !payload.body) return null

  let body
  try { body = JSON.parse(payload.body) } catch { return null }
  const root = Array.isArray(body) ? body[0] : body
  if (!root || typeof root !== 'object') return null

  const symbolData = Array.isArray(root.symbolData) ? root.symbolData : null
  if (!symbolData || !symbolData.length) return null

  const summary = root.accountSummary || {}
  const accountKey = String(summary.accountKey || symbolData[0]?.accountKey || '')
  const accountName = String(summary.accountName || symbolData[0]?.accountName || '')

  const out = []
  for (const row of symbolData) {
    if (!row || typeof row !== 'object') continue
    const date = String(row.dataDate || '').slice(0, 10)
    const symbol = String(row.symbol || '').toUpperCase()
    if (!date || !symbol) continue
    const rowAccountKey = String(row.accountKey || accountKey)

    out.push({
      external_id: `${rowAccountKey}:${date}:${symbol}`,
      date,
      pnl: num(row.netPnl),
      instrument: symbol,
      side: '',
      entry_price: null,
      exit_price: null,
      opened_at: null,
      closed_at: null,
      accountIdentifier: rowAccountKey,
      accountName: row.accountName || accountName || null,
      raw: {
        exchange: row.exchange,
        highPnl: num(row.highPnl),
        lowPnl: num(row.lowPnl),
        qtyTraded: row.qtyTraded,
        commissions: num(row.commissions),
        tradesCount: row.trades,
        avgWin: num(row.avgWin),
        avgLoss: num(row.avgLoss),
        winPct: num(row.winPct),
        maxConsecWin: row.maxConsecWin,
        maxConsecLoss: row.maxConsecLoss,
        avgWinDuration: row.avgWinDuration,
        avgLossDuration: row.avgLossDuration,
      },
    })
  }
  return out.length ? out : null
}

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
