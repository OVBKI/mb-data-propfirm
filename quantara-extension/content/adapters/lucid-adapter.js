// Lucid Trading adapter.
//
// STATUS: heuristic skeleton. Until we capture a real response payload
// from dash.lucidtrading.com, this adapter does best-effort field
// detection on any JSON body whose URL path hints at trades / fills /
// orders / positions. Once we have a confirmed schema, replace
// `detectArray` + `mapTrade` with hard-coded shape.
//
// Output contract (consumed by service-worker.js → submitSync):
//   [{
//     external_id,        // unique per-firm id, used for dedup
//     date,               // 'YYYY-MM-DD'
//     pnl,                // number (USD)
//     instrument,         // e.g. 'MNQ', 'ES'
//     side,               // 'long' | 'short' | ''
//     entry_price,        // number | null
//     exit_price,         // number | null
//     opened_at,          // ISO 8601 | null
//     closed_at,          // ISO 8601 | null
//     accountIdentifier,  // string | null
//     raw,                // original record (kept for debugging)
//   }]

const TRADE_URL_HINTS = [
  '/trade', '/trades', '/fill', '/fills', '/order', '/orders',
  '/history', '/position', '/positions', '/journal',
]

export function adaptLucid(payload) {
  if (!payload || !payload.body || payload.status >= 400) return null
  const url = String(payload.url || '').toLowerCase()
  if (!TRADE_URL_HINTS.some(h => url.includes(h))) return null

  let body
  try { body = JSON.parse(payload.body) } catch { return null }

  const array = detectArray(body)
  if (!array || !array.length) return null

  const out = []
  for (const row of array) {
    const t = mapTrade(row)
    if (t) out.push(t)
  }
  return out.length ? out : null
}

function detectArray(body) {
  if (Array.isArray(body)) return body
  if (!body || typeof body !== 'object') return null
  // Common envelopes: { data: [...] }, { trades: [...] }, { fills: [...] },
  // { results: [...] }, { items: [...] }
  for (const k of ['trades', 'fills', 'orders', 'positions', 'data', 'results', 'items']) {
    if (Array.isArray(body[k])) return body[k]
    if (body[k] && Array.isArray(body[k].items)) return body[k].items
  }
  return null
}

function mapTrade(row) {
  if (!row || typeof row !== 'object') return null

  const externalId = pick(row, ['id', 'tradeId', 'fillId', 'orderId', 'uuid', 'reference'])
  const instrument = String(pick(row, ['symbol', 'instrument', 'contract', 'product', 'ticker']) || '').toUpperCase()
  const pnl = num(pick(row, ['pnl', 'profit', 'realizedPnl', 'realized_profit', 'netPnl', 'net_profit', 'profitLoss']))
  if (pnl == null && !externalId) return null

  const sideRaw = String(pick(row, ['side', 'direction', 'action', 'buySell']) || '').toLowerCase()
  let side = ''
  if (/buy|long|bid/.test(sideRaw)) side = 'long'
  else if (/sell|short|ask/.test(sideRaw)) side = 'short'

  const entry = num(pick(row, ['entryPrice', 'entry_price', 'openPrice', 'open_price', 'avgEntry']))
  const exit  = num(pick(row, ['exitPrice', 'exit_price', 'closePrice', 'close_price', 'avgExit']))

  const openedRaw = pick(row, ['openedAt', 'opened_at', 'openTime', 'open_time', 'entryTime', 'entry_time', 'tradeDate', 'date', 'timestamp', 'createdAt'])
  const closedRaw = pick(row, ['closedAt', 'closed_at', 'closeTime', 'close_time', 'exitTime', 'exit_time'])
  const opened = iso(openedRaw)
  const closed = iso(closedRaw) || opened

  const dateBase = closed || opened
  const date = dateBase ? dateBase.slice(0, 10) : null
  if (!date) return null

  return {
    external_id: String(externalId || `${date}-${instrument}-${pnl}-${entry}-${exit}`),
    date,
    pnl: pnl == null ? 0 : pnl,
    instrument,
    side,
    entry_price: entry,
    exit_price: exit,
    opened_at: opened,
    closed_at: closed,
    accountIdentifier: String(pick(row, ['accountId', 'account_id', 'accountName', 'account', 'accountNumber']) || '') || null,
    raw: row,
  }
}

function pick(obj, keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k]
  }
  return null
}

function num(v) {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function iso(v) {
  if (!v) return null
  if (typeof v === 'number') {
    // Heuristic: seconds vs milliseconds
    const ms = v < 1e12 ? v * 1000 : v
    return new Date(ms).toISOString()
  }
  const d = new Date(v)
  return Number.isFinite(d.getTime()) ? d.toISOString() : null
}
