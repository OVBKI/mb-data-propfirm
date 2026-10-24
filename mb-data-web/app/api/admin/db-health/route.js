// GET /api/admin/db-health — ce qui manque dans la base de production après
// avoir recollé supabase-schema.sql, et l'état des quotas de la bêta.
//
// PostgREST ne donne pas accès au catalogue Postgres : on sonde. Une table
// absente répond 42P01 / PGRST205, une colonne absente 42703 / PGRST204, une
// fonction absente PGRST202. Lecture seule, sauf un appel à rate_limit_hit sur
// une clé réservée (un compteur de plus, sans effet sur les utilisateurs).
import { createClient } from '@supabase/supabase-js'
import { verifyAdmin } from '../../../../lib/apiAuth'

export const dynamic = 'force-dynamic'

const TABLES = [
  'app_flags', 'drawdown_alert_state', 'ai_reviews', 'rate_limits', 'referrals',
  'propfirm_rules_overrides', 'trading_plan', 'trading_setups', 'trading_rule_items',
  'custom_propfirms', 'stripe_events', 'feedback', 'cron_heartbeat',
]
const COLUMNS = {
  journal_entries: ['quantity', 'traded_at', 'commissions', 'slippage', 'tags'],
  accounts: ['program', 'custom_drawdown', 'payment_mode', 'months_count', 'last_bill_check_at', 'balance', 'dd_floor', 'funded_date', 'market'],
  profiles: ['email_optout', 'ai_review_optin', 'onboarding_emails_sent', 'referral_code', 'dashboard_layout', 'beta_grandfather', 'plan'],
}

const missingCode = (e) => /42P01|PGRST205|42703|PGRST204|PGRST202|42883/.test(`${e?.code} ${e?.message}`)

export async function GET(request) {
  const auth = await verifyAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status || 401 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY non configurée' }, { status: 500 })
  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  const checks = []
  const add = (group, name, ok, detail = '') => checks.push({ group, name, ok, detail })

  for (const t of TABLES) {
    const { error } = await db.from(t).select('*', { count: 'exact', head: true })
    add('table', t, !error, error ? (missingCode(error) ? 'absente' : error.message) : '')
  }
  for (const [t, cols] of Object.entries(COLUMNS)) {
    for (const c of cols) {
      const { error } = await db.from(t).select(c).limit(1)
      add('colonne', `${t}.${c}`, !error, error ? (missingCode(error) ? 'absente' : error.message) : '')
    }
  }
  {
    const { error } = await db.rpc('rate_limit_hit', { p_key: '__db_health__', p_window_ms: 60000, p_max: 1000000 })
    add('fonction', 'rate_limit_hit', !error, error ? (missingCode(error) ? 'absente' : error.message) : '')
  }

  // Quotas de la bêta : tant que paid_launch est faux, personne n'est bridé.
  const quotas = { paidLaunch: null, profiles: null, grandfathered: null }
  {
    const { data, error } = await db.from('app_flags').select('paid_launch').eq('id', 1).maybeSingle()
    if (!error) quotas.paidLaunch = data ? !!data.paid_launch : null
  }
  {
    const { count } = await db.from('profiles').select('user_id', { count: 'exact', head: true })
    quotas.profiles = count ?? null
    const { count: g, error } = await db.from('profiles').select('user_id', { count: 'exact', head: true }).eq('beta_grandfather', true)
    if (!error) quotas.grandfathered = g ?? 0
  }

  return Response.json({ checks, quotas, missing: checks.filter((c) => !c.ok).length })
}
