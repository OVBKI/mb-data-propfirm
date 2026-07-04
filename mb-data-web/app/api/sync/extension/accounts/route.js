// POST /api/sync/extension/accounts
// Receives a list of accounts detected by the Quantara Sync extension on
// a PropFirm dashboard (e.g. Lucid's /api/users/summary returns 5 accounts)
// and creates or updates the matching rows in the accounts table.
//
// Matching strategy (per account, in order):
//   1) accounts.rithmic_account_id == accountKey
//   2) accounts.name contains accountKey
//   3) accounts.name contains accountName
//   4) miss → CREATE new row
//
// On update we refresh: status, name, rithmic_balance, rithmic_min_balance,
// plan_size, rithmic_synced_at. We do NOT touch buy_date / activation_fee
// / spent — those are user-edited fields and the extension has no business
// overwriting them.

import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit'

const MAX_ACCOUNTS_PER_BATCH = 50

const FIRM_SLUG_TO_CANONICAL = {
  'lucid-trading':         'Lucid Trading',
  'topstep':               'Topstep',
  'apex-trader-funding':   'Apex Trader Funding',
  'my-funded-futures':     'My Funded Futures',
  'tradeify':              'Tradeify',
  'bulenox':               'Bulenox',
  'take-profit-trader':    'Take Profit Trader',
  'tradeday':              'TradeDay',
}

// L'extension envoie des statuts en anglais, mais la DB stocke l'enum FRANÇAIS
// ('Challenge'/'Financé'/'Échoué') — on normalise avant écriture, en acceptant
// aussi les formes françaises directement.
const STATUS_NORMALIZE = {
  'Challenge': 'Challenge',
  'Funded': 'Financé',
  'Financé': 'Financé',
  'Failed': 'Échoué',
  'Échoué': 'Échoué',
}

// PAUSED (juin 2026) — extension Quantara Sync en pause. Réactiver : passer à false.
const SYNC_PAUSED = true

export async function POST(request) {
  if (SYNC_PAUSED) return Response.json({ error: 'Extension sync paused', code: 'SYNC_PAUSED' }, { status: 503 })
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const limit = rateLimit({ key: `sync-ext-accounts:${auth.user.id}`, windowMs: 60_000, max: 30 })
  if (!limit.allowed) return rateLimitResponse(limit, 'Trop de syncs comptes. Réessaie dans une minute.')

  let body
  try { body = await request.json() } catch { return Response.json({ error: 'JSON invalide' }, { status: 400 }) }

  const firmSlug  = String(body.firm || '').toLowerCase()
  const canonical = FIRM_SLUG_TO_CANONICAL[firmSlug]
  if (!canonical) return Response.json({ error: 'firm non supportée' }, { status: 400 })

  const accounts = Array.isArray(body.accounts) ? body.accounts : []
  if (!accounts.length) return Response.json({ created: 0, updated: 0 })
  if (accounts.length > MAX_ACCOUNTS_PER_BATCH) {
    return Response.json({ error: `Trop de comptes (max ${MAX_ACCOUNTS_PER_BATCH})` }, { status: 400 })
  }

  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: request.headers.get('authorization') } } }
  )

  // 1) Find the user's firm
  const { data: firms, error: firmsErr } = await supa
    .from('firms')
    .select('id, name, market, accounts(id, name, rithmic_account_id, status)')
    .eq('user_id', auth.user.id)

  if (firmsErr) return Response.json({ error: 'DB error firms', detail: firmsErr.message }, { status: 500 })

  // L'extension ne sync que des propfirms futures : on exclut les firms CFD du
  // fuzzy-match pour ne jamais créer/mettre à jour des comptes sous une firm CFD.
  const firm = matchFirm((firms || []).filter(f => f.market !== 'cfd'), canonical)
  if (!firm) {
    return Response.json({
      error: 'NO_FIRM',
      hint: `Aucune firm "${canonical}" trouvée dans ton compte. Ajoute-la d'abord depuis le dashboard.`,
      canonical,
    }, { status: 409 })
  }

  const existing = firm.accounts || []
  const today = new Date().toISOString().slice(0, 10)

  let created = 0
  let updated = 0
  const conflicts = []

  for (const a of accounts) {
    if (!a || !a.accountKey) continue
    const accountKey  = String(a.accountKey).slice(0, 80)
    const accountName = String(a.accountName || '').slice(0, 120)
    const status      = STATUS_NORMALIZE[a.quantaraStatus] || 'Challenge'
    const planSize    = (String(a.planSize || '').match(/^\d+k$/) ? a.planSize : '50k')
    const balance     = numOrNull(a.accountBalance)
    const minBalance  = numOrNull(a.minAccountBalance)

    const match = matchAccount(existing, accountKey, accountName)

    if (match) {
      const patch = {
        status,
        plan_size: planSize,
        rithmic_account_id: match.rithmic_account_id || accountKey,
        rithmic_balance: balance,
        rithmic_min_balance: minBalance,
        rithmic_synced_at: new Date().toISOString(),
      }
      // Only rename if user kept the default empty name
      if (!match.name && accountName) patch.name = accountName

      // Auto-flag liquidation timestamp the first time we see Failed (statut FR normalisé)
      if (status === 'Échoué' && match.status !== 'Échoué') {
        patch.liquidated_at = new Date().toISOString()
      }

      const { error: updErr } = await supa
        .from('accounts')
        .update(patch)
        .eq('id', match.id)
        .eq('user_id', auth.user.id)
      if (updErr) { conflicts.push({ accountKey, error: updErr.message }); continue }
      updated++
    } else {
      const insertRow = {
        user_id: auth.user.id,
        firm_id: firm.id,
        market: 'futures', // extension = comptes propfirm futures uniquement
        buy_date: today,
        currency: 'USD',
        status,
        name: accountName || accountKey,
        plan_size: planSize,
        rithmic_account_id: accountKey,
        rithmic_balance: balance,
        rithmic_min_balance: minBalance,
        rithmic_synced_at: new Date().toISOString(),
        notes: `[ext:${firmSlug}:auto-created]`,
      }
      if (status === 'Échoué') insertRow.liquidated_at = new Date().toISOString()

      const { error: insErr } = await supa.from('accounts').insert(insertRow)
      if (insErr) { conflicts.push({ accountKey, error: insErr.message }); continue }
      created++
    }
  }

  return Response.json({
    created,
    updated,
    skipped: accounts.length - created - updated - conflicts.length,
    conflicts: conflicts.length ? conflicts : undefined,
    firmId: firm.id,
  })
}

function numOrNull(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function matchAccount(accounts, accountKey, accountName) {
  const key  = String(accountKey || '').toLowerCase()
  const full = String(accountName || '').toLowerCase()

  // 1) exact rithmic_account_id match
  for (const a of accounts) {
    if (String(a.rithmic_account_id || '').toLowerCase() === key) return a
  }
  // 2) name contains accountKey
  for (const a of accounts) {
    if (key && String(a.name || '').toLowerCase().includes(key)) return a
  }
  // 3) name matches/contains full accountName
  for (const a of accounts) {
    const n = String(a.name || '').toLowerCase()
    if (full && (n === full || n.includes(full) || full.includes(n))) return a
  }
  return null
}

function matchFirm(firms, canonical) {
  const target = canonical.toLowerCase()
  for (const f of firms) {
    if (String(f.name || '').toLowerCase() === target) return f
  }
  const tokens = canonical.toLowerCase().split(/\s+/).filter(t => t.length >= 4)
  let best = null
  let bestScore = 0
  for (const f of firms) {
    const name = String(f.name || '').toLowerCase()
    let score = 0
    for (const tok of tokens) if (name.includes(tok)) score += tok.length
    if (score > bestScore) { best = f; bestScore = score }
  }
  return best
}
