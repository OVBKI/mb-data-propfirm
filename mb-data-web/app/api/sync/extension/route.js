// POST /api/sync/extension
// Receives a batch of trades captured by the Quantara Sync browser extension
// (quantara-extension/) from a PropFirm dashboard (Lucid, TopstepX, etc.)
// and upserts them into journal_entries.
//
// Dedup strategy: each row's notes column stores `[ext:<firm>:<external_id>]`.
// We look up existing rows by that tag and update them; new ones are inserted.
//
// AUTH: requires the user's Supabase session (Bearer token forwarded by the
// extension after the quantara-bridge content script reads it from
// quantara.tech localStorage).
//
// RATE LIMIT: 60 batches/min/user. Each batch can carry up to 500 trades.

import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'

const MAX_TRADES_PER_BATCH = 500

// Map firm slugs from the extension to the canonical PropFirm name used in
// PROPFIRM_RULES / FIRM_SUGGESTIONS. firms.name is free-text, so we fuzzy
// match user firms whose name contains the canonical token (case-insensitive).
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

export async function POST(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const limit = rateLimit({ key: `sync-ext:${auth.user.id}`, windowMs: 60_000, max: 60 })
  if (!limit.allowed) return rateLimitResponse(limit, 'Trop de syncs. Réessaie dans une minute.')

  let body
  try { body = await request.json() } catch { return Response.json({ error: 'JSON invalide' }, { status: 400 }) }

  const firmSlug = String(body.firm || '').toLowerCase()
  const canonical = FIRM_SLUG_TO_CANONICAL[firmSlug]
  if (!canonical) return Response.json({ error: 'firm non supportée' }, { status: 400 })

  const trades = Array.isArray(body.trades) ? body.trades : []
  if (!trades.length) return Response.json({ inserted: 0, updated: 0, skipped: 0 })
  if (trades.length > MAX_TRADES_PER_BATCH) {
    return Response.json({ error: `Batch trop gros (max ${MAX_TRADES_PER_BATCH})` }, { status: 400 })
  }

  // Server-side Supabase using user's JWT — preserves RLS.
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: request.headers.get('authorization') } } }
  )

  // 1) Fetch all the user's firms and fuzzy-match against the canonical
  //    PropFirm name (firms.name is free-text — user can call it "Mon Lucid"
  //    or "Lucid Pro" so we match on includes(), preferring the longest
  //    matching token from the canonical name).
  const { data: firms, error: firmsErr } = await supa
    .from('firms')
    .select('id, name, accounts(id, name, account_id)')
    .eq('user_id', auth.user.id)

  if (firmsErr) return Response.json({ error: 'DB error firms', detail: firmsErr.message }, { status: 500 })

  const firm = matchFirm(firms || [], canonical)
  if (!firm) {
    return Response.json({
      error: 'NO_FIRM',
      hint: `Aucune firm "${canonical}" trouvée dans ton compte. Ajoute-la d'abord depuis le dashboard.`,
      canonical,
    }, { status: 409 })
  }
  let account = (firm.accounts || [])[0]
  if (body.accountIdentifier && firm.accounts) {
    const ident = String(body.accountIdentifier).toLowerCase()
    const matched = firm.accounts.find(a =>
      String(a.name || '').toLowerCase().includes(ident) ||
      String(a.account_id || '').toLowerCase() === ident
    )
    if (matched) account = matched
  }
  if (!account) {
    return Response.json({
      error: 'NO_ACCOUNT',
      hint: `Aucun compte configuré sous ${firm.name}. Ajoute un compte avant de sync.`,
      firmId: firm.id,
    }, { status: 409 })
  }

  // 2) Build batch with idempotency tag. Tag goes into notes so we can dedup
  //    via LIKE without a schema change. Production-grade alt = dedicated
  //    external_id column + unique index; this is the no-migration path.
  const rows = []
  for (const t of trades) {
    if (!t || !t.date) continue
    const extId = String(t.external_id || '').slice(0, 80)
    if (!extId) continue
    const tag = `[ext:${firmSlug}:${extId}]`
    const userNotes = String(t.notes || '').slice(0, 500)
    rows.push({
      user_id: auth.user.id,
      account_id: account.id,
      date: t.date,
      pnl: Number(t.pnl) || 0,
      instrument: String(t.instrument || '').slice(0, 40),
      side: ['long', 'short'].includes(t.side) ? t.side : '',
      entry_price: numOrNull(t.entry_price),
      exit_price: numOrNull(t.exit_price),
      notes: tag + (userNotes ? ' ' + userNotes : ''),
    })
  }

  if (!rows.length) return Response.json({ inserted: 0, updated: 0, skipped: trades.length })

  // 3) Look up existing rows by tag (single LIKE-IN via OR list — fine up to 500).
  const tags = rows.map(r => r.notes.match(/^\[ext:[^\]]+\]/)?.[0]).filter(Boolean)
  const { data: existing, error: lookupErr } = await supa
    .from('journal_entries')
    .select('id, notes')
    .eq('user_id', auth.user.id)
    .eq('account_id', account.id)
    .or(tags.map(t => `notes.like.${t}%`).join(','))

  if (lookupErr) return Response.json({ error: 'DB error lookup', detail: lookupErr.message }, { status: 500 })

  const existingByTag = new Map()
  for (const e of (existing || [])) {
    const m = e.notes && e.notes.match(/^\[ext:[^\]]+\]/)
    if (m) existingByTag.set(m[0], e.id)
  }

  const toInsert = []
  const toUpdate = []
  for (const row of rows) {
    const tag = row.notes.match(/^\[ext:[^\]]+\]/)[0]
    const existingId = existingByTag.get(tag)
    if (existingId) toUpdate.push({ id: existingId, row })
    else toInsert.push(row)
  }

  let inserted = 0
  let updated = 0
  if (toInsert.length) {
    const { data: ins, error: insErr } = await supa
      .from('journal_entries')
      .insert(toInsert)
      .select('id')
    if (insErr) return Response.json({ error: 'DB error insert', detail: insErr.message }, { status: 500 })
    inserted = ins?.length || 0
  }
  for (const u of toUpdate) {
    const { error: updErr } = await supa
      .from('journal_entries')
      .update({
        pnl: u.row.pnl,
        instrument: u.row.instrument,
        side: u.row.side,
        entry_price: u.row.entry_price,
        exit_price: u.row.exit_price,
      })
      .eq('id', u.id)
      .eq('user_id', auth.user.id)
    if (!updErr) updated++
  }

  return Response.json({
    inserted,
    updated,
    skipped: trades.length - rows.length,
    firmId: firm.id,
    accountId: account.id,
  })
}

function numOrNull(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// Fuzzy match a user firm to a canonical PropFirm name. Exact (case-
// insensitive) match wins; otherwise we score firms by the longest canonical
// token they contain. Ties broken by created_at (first wins).
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
    for (const tok of tokens) {
      if (name.includes(tok)) score += tok.length
    }
    if (score > bestScore) { best = f; bestScore = score }
  }
  return best
}
