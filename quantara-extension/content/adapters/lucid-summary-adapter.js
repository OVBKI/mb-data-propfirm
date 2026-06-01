// Lucid Trading — summary adapter (account discovery).
//
// Endpoint: GET /api/users/summary/<userKey>
// Returns: a flat array of every account the user owns at Lucid, with
//          status, plan, balance, drawdown floor and accountType.
//
//   [{
//     userKey, accountKey, accountName, planCode, status, accountType,
//     accountBalance, minAccountBalance, profitTarget, distToProfitTarget,
//     dailyLossLimit, totalPnlPeriod, ..., planLabel: "LucidFlex 50K",
//     ...
//   }, ...]
//
// We map every entry to a normalised Quantara account record and let the
// backend upsert it via /api/sync/extension/accounts. accountType "Pro" +
// status "Active" → Funded; accountType "Test" + status "Active" →
// Challenge; anything else → Failed (placeholder until we capture a real
// liquidated/failed example to confirm Lucid's exact label).

const SUMMARY_URL_RE = /\/api\/users\/summary\//i

export function adaptLucidSummary(payload) {
  if (!payload || payload.status >= 400) return null
  if (!SUMMARY_URL_RE.test(String(payload.url || ''))) return null
  if (typeof payload.body !== 'string' || !payload.body) return null

  let body
  try { body = JSON.parse(payload.body) } catch { return null }
  if (!Array.isArray(body) || !body.length) return null

  const accounts = []
  for (const row of body) {
    if (!row || typeof row !== 'object') continue
    const accountKey = String(row.accountKey || '')
    if (!accountKey) continue

    accounts.push({
      accountKey,
      accountName: String(row.accountName || ''),
      planCode:    String(row.planCode || ''),
      planLabel:   String(row.planLabel || ''),
      planSize:    extractPlanSize(row.planLabel, row.planCode),
      accountType: String(row.accountType || ''),         // 'Pro' | 'Test'
      status:      String(row.status || ''),              // 'Active' | 'Liquidated' | ...
      quantaraStatus: mapStatus(row),                     // 'Challenge' | 'Funded' | 'Failed'
      accountBalance:    num(row.accountBalance),
      minAccountBalance: num(row.minAccountBalance),
      profitTarget:      num(row.profitTarget),
      totalPnlPeriod:    num(row.totalPnlPeriod),
      payoutIneligible:  !!row.payoutIneligible,
      lastPayoutDate:    row.lastPayoutDate || null,
      consistencyPeriod: row.consistencyPeriod || null,
      tradingDaysPeriod: row.tradingDaysPeriod || 0,
    })
  }
  return accounts.length ? accounts : null
}

// Extract '50k' / '100k' / '150k' from labels like "LucidFlex 50K" or
// plan codes like "LFF050" (Funded Flex 50k) / "LFE050" (Eval Flex 50k).
function extractPlanSize(label, code) {
  const m1 = String(label || '').match(/(\d+)\s*K/i)
  if (m1) return `${m1[1]}k`
  const m2 = String(code || '').match(/(\d+)$/)
  if (m2) return `${parseInt(m2[1], 10)}k`
  return '50k'
}

// Map Lucid (accountType, status) to Quantara status enum.
function mapStatus(row) {
  const lucidStatus = String(row.status || '').toLowerCase()
  const lucidType   = String(row.accountType || '').toLowerCase()

  // Inactive / liquidated / failed → Failed
  if (lucidStatus && lucidStatus !== 'active') return 'Failed'

  // Drawdown floor breached (defensive — Lucid normally flips status, but
  // catch the edge where status is still "Active" with balance below floor)
  const balance = num(row.accountBalance)
  const floor   = num(row.minAccountBalance)
  if (balance != null && floor != null && balance < floor) return 'Failed'

  if (lucidType === 'pro')  return 'Funded'
  if (lucidType === 'test') return 'Challenge'
  return 'Challenge'
}

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
