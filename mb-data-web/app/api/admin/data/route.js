// GET /api/admin/data?view=counts|activity|stats — données de l'admin, lues
// côté serveur avec la service role.
//
// Les pages admin lisaient ces tables avec le client NAVIGATEUR. La RLS limite
// chaque table aux lignes de l'utilisateur connecté, et les policies de lecture
// admin sont commentées dans le schéma : l'admin ne voyait donc que SES propres
// données, présentées comme les chiffres de toute la plateforme.
import { createClient } from '@supabase/supabase-js'
import { verifyAdmin } from '../../../../lib/apiAuth'

export const dynamic = 'force-dynamic'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Toutes les lignes, page par page (PostgREST plafonne à 1 000).
async function all(build) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().range(from, from + 999)
    if (error) throw new Error(error.message)
    out.push(...(data || []))
    if (!data || data.length < 1000) return out
  }
}

async function count(q) {
  const { count: n, error } = await q
  if (error) throw new Error(error.message)
  return n || 0
}

export async function GET(request) {
  const auth = await verifyAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status || 401 })
  const db = adminClient()
  if (!db) return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY non configurée' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view')

  try {
    if (view === 'counts') {
      const now = Date.now()
      const day7 = new Date(now - 7 * 86400000).toISOString()
      const day30 = new Date(now - 30 * 86400000).toISOString()
      const head = (t) => db.from(t).select('id', { count: 'exact', head: true })
      const [firms, accounts, trades, payouts, certs, tradesWeek, tradesMonth, firmNames] = await Promise.all([
        count(head('firms')), count(head('accounts')), count(head('journal_entries')),
        count(head('payouts')), count(head('certificates')),
        count(head('journal_entries').gte('created_at', day7)),
        count(head('journal_entries').gte('created_at', day30)),
        all(() => db.from('firms').select('name').order('id')),
      ])
      return Response.json({ firms, accounts, trades, payouts, certs, tradesWeek, tradesMonth, firmNames: firmNames.map((f) => f.name) })
    }

    if (view === 'activity') {
      const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50))
      const recent = (t, cols) => db.from(t).select(cols).order('created_at', { ascending: false }).limit(limit)
      const res = await Promise.all([
        recent('firms', 'id, name, user_id, created_at'),
        recent('accounts', 'id, name, status, user_id, firm_id, created_at, plan_size, funded_date'),
        recent('journal_entries', 'id, date, pnl, instrument, account_id, created_at, user_id'),
        recent('payouts', 'id, amount, date, account_id, created_at, user_id, note'),
        recent('certificates', 'id, type, created_at, user_id'),
        recent('announcements', 'id, title, created_at'),
      ])
      const err = res.find((r) => r.error)
      if (err) throw new Error(err.error.message)
      const [firms, accounts, trades, payouts, certs, announcements] = res.map((r) => r.data || [])
      return Response.json({ firms, accounts, trades, payouts, certs, announcements })
    }

    if (view === 'stats') {
      const [firms, accounts, trades, payouts] = await Promise.all([
        all(() => db.from('firms').select('id, user_id, name').order('id')),
        all(() => db.from('accounts').select('id, status, payment_mode, plan_size, profit_split, user_id, created_at, months_count, spent, currency').order('id')),
        all(() => db.from('journal_entries').select('id, user_id, account_id, pnl, created_at').order('id')),
        all(() => db.from('payouts').select('id, user_id, account_id, amount, created_at').order('id')),
      ])
      return Response.json({ firms, accounts, trades, payouts })
    }

    return Response.json({ error: 'view inconnue' }, { status: 400 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
