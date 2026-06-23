import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit'

function escapeCSV(val) {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function toCSV(headers, rows) {
  const lines = [headers.map(escapeCSV).join(',')]
  for (const row of rows) {
    lines.push(headers.map(h => escapeCSV(row[h])).join(','))
  }
  return lines.join('\n')
}

export async function GET(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  // Rate limit: 3 req/min per user (export is heavy — multiple DB queries)
  const limit = rateLimit({ key: `export:${auth.user.id}`, windowMs: 60_000, max: 3 })
  if (!limit.allowed) return rateLimitResponse(limit)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return Response.json({ error: 'Server config error' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey)
  const userId = auth.user.id

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'

  // Colonnes explicites (pas de select('*')) : on ne charge que ce que le CSV émet.
  const { data: firms } = await admin.from('firms').select('id, name').eq('user_id', userId).order('created_at')
  const { data: accounts } = await admin.from('accounts')
    .select('id, firm_id, name, plan_size, status, currency, spent, dd_type, buy_date, activation_date, payout_target, min_trading_days, profit_split, payment_mode')
    .eq('user_id', userId).order('buy_date')
  const { data: payouts } = await admin.from('payouts').select('account_id, date, amount, note').eq('user_id', userId).order('date')
  const { data: journal } = await admin.from('journal_entries')
    .select('account_id, date, symbol, pnl, content, notes')
    .eq('user_id', userId).order('date', { ascending: false })

  const firmMap = {}
  for (const f of firms || []) firmMap[f.id] = f.name

  const sheets = []

  if (type === 'all' || type === 'accounts') {
    const headers = ['firm', 'name', 'plan_size', 'status', 'currency', 'spent', 'dd_type', 'buy_date', 'activation_date', 'payout_target', 'min_trading_days', 'profit_split', 'payment_mode']
    const rows = (accounts || []).map(a => ({
      ...a,
      firm: firmMap[a.firm_id] || '',
    }))
    sheets.push({ name: 'accounts', csv: toCSV(headers, rows) })
  }

  if (type === 'all' || type === 'payouts') {
    const acctMap = {}
    for (const a of accounts || []) acctMap[a.id] = { name: a.name || a.plan_size, firm: firmMap[a.firm_id] || '' }
    const headers = ['firm', 'account', 'date', 'amount', 'note']
    const rows = (payouts || []).map(p => ({
      firm: acctMap[p.account_id]?.firm || '',
      account: acctMap[p.account_id]?.name || '',
      date: p.date,
      amount: p.amount,
      note: p.note || '',
    }))
    sheets.push({ name: 'payouts', csv: toCSV(headers, rows) })
  }

  if (type === 'all' || type === 'journal') {
    const acctMap = {}
    for (const a of accounts || []) acctMap[a.id] = { name: a.name || a.plan_size, firm: firmMap[a.firm_id] || '' }
    const headers = ['date', 'firm', 'account', 'symbol', 'pnl', 'notes']
    const rows = (journal || []).map(j => ({
      date: j.date,
      firm: acctMap[j.account_id]?.firm || '',
      account: acctMap[j.account_id]?.name || '',
      symbol: j.symbol || '',
      pnl: j.pnl ?? '',
      notes: (j.content || j.notes || '').replace(/\n/g, ' '),
    }))
    sheets.push({ name: 'journal', csv: toCSV(headers, rows) })
  }

  let csv
  let filename
  if (sheets.length === 1) {
    csv = sheets[0].csv
    filename = `quantara-${sheets[0].name}-${new Date().toISOString().slice(0, 10)}.csv`
  } else {
    csv = sheets.map(s => `--- ${s.name.toUpperCase()} ---\n${s.csv}`).join('\n\n')
    filename = `quantara-export-${new Date().toISOString().slice(0, 10)}.csv`
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
