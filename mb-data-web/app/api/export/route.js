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
  const limit = await rateLimit({ key: `export:${auth.user.id}`, windowMs: 60_000, max: 3 })
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
  // Lecture page par page : PostgREST plafonne une réponse à 1 000 lignes, et un
  // export tronqué sans le dire est pire qu'un export qui échoue.
  async function all(build) {
    const out = []
    for (let from = 0; ; from += 1000) {
      const { data, error } = await build().range(from, from + 999)
      if (error) throw new Error(error.message)
      out.push(...(data || []))
      if (!data || data.length < 1000) return out
    }
  }
  let firms, accounts, payouts, journal
  try {
    firms = await all(() => admin.from('firms').select('id, name').eq('user_id', userId).order('created_at'))
    accounts = await all(() => admin.from('accounts')
      .select('id, firm_id, name, plan_size, status, currency, spent, dd_type, buy_date, activation_date, payout_target, min_trading_days, profit_split, payment_mode')
      .eq('user_id', userId).order('buy_date'))
    payouts = await all(() => admin.from('payouts').select('account_id, date, amount, note').eq('user_id', userId).order('date'))
    // Le journal n'a ni `symbol` ni `content` : les demander faisait échouer la
    // requête, et l'export sortait sans un seul trade.
    journal = await all(() => admin.from('journal_entries')
      .select('id, account_id, date, traded_at, instrument, side, quantity, entry_price, exit_price, stop_loss, take_profit, pnl, commissions, slippage, tags, notes')
      .eq('user_id', userId).order('date', { ascending: false }).order('id'))
  } catch (e) {
    console.error('[export]', e.message)
    return Response.json({ error: 'EXPORT_FAILED' }, { status: 500 })
  }

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
    const headers = ['date', 'traded_at', 'firm', 'account', 'instrument', 'side', 'quantity', 'entry_price', 'exit_price', 'stop_loss', 'take_profit', 'pnl', 'commissions', 'slippage', 'tags', 'notes']
    const rows = (journal || []).map(j => ({
      ...j,
      firm: acctMap[j.account_id]?.firm || '',
      account: acctMap[j.account_id]?.name || '',
      tags: Array.isArray(j.tags) ? j.tags.join(' ') : '',
      notes: (j.notes || '').replace(/\n/g, ' '),
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
