// Calls into the Quantara backend. All requests carry the Supabase Bearer
// token captured by the quantara-bridge content script.

import { QUANTARA_API_BASE } from './config.js'
import { get } from './storage.js'

async function baseUrl() {
  return (await get('apiBase')) || QUANTARA_API_BASE
}

async function authHeader() {
  const auth = await get('auth')
  if (!auth || !auth.accessToken) throw new Error('NOT_AUTHENTICATED')
  if (auth.expiresAt && auth.expiresAt * 1000 < Date.now()) {
    throw new Error('TOKEN_EXPIRED')
  }
  return { Authorization: `Bearer ${auth.accessToken}` }
}

// POST /api/sync/extension — submit a batch of normalised trades.
// payload = { firm: 'lucid-trading', accountIdentifier: 'Lucid-12345',
//             trades: [{ external_id, date, pnl, instrument, side, entry_price,
//                        exit_price, opened_at, closed_at, raw }] }
export async function submitSync(payload) {
  const base = await baseUrl()
  const headers = { 'Content-Type': 'application/json', ...(await authHeader()) }
  const res = await fetch(`${base}/api/sync/extension`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

// POST /api/sync/extension/accounts — submit a list of accounts (auto-create/update).
// payload = { firm: 'lucid-trading', accounts: [{ accountKey, accountName,
//             quantaraStatus, planSize, accountBalance, minAccountBalance, ... }] }
export async function submitAccounts(payload) {
  const base = await baseUrl()
  const headers = { 'Content-Type': 'application/json', ...(await authHeader()) }
  const res = await fetch(`${base}/api/sync/extension/accounts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

// GET /api/sync/extension/ping — cheap auth check used by popup.
export async function ping() {
  const base = await baseUrl()
  const headers = await authHeader()
  const res = await fetch(`${base}/api/sync/extension/ping`, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
