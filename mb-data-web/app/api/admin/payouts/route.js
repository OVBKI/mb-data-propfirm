// API admin pour analyser les payouts de TOUS les users.
// Utilise SUPABASE_SERVICE_ROLE_KEY pour bypass RLS (donc fonctionne même si les
// RLS admin policies ne sont pas encore appliquées sur Supabase).
//
// Endpoints :
//   GET /api/admin/payouts                  → tous les payouts (depuis toujours)
//   GET /api/admin/payouts?month=2026-05    → payouts du mois spécifié
//
// Réponse : { filter, totalAmount, totalCount, usersWithPayouts, users: [...] }
//   Chaque user : { user_id, email, totalAmount, count, lastPayoutDate, payouts: [...] }
//   Chaque payout : { id, date, amount, currency, firm_name, account_name, note }
//
// SÉCURITÉ : verifyAdmin via Bearer token + ADMIN_EMAILS check.

import { createClient } from '@supabase/supabase-js'
import { verifyAdmin } from '../../../../lib/apiAuth'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET(request) {
  const auth = await verifyAdmin(request)
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status || 401 })
  }

  const admin = getAdminClient()
  if (!admin) {
    return Response.json({
      error: 'SUPABASE_SERVICE_ROLE_KEY non configurée sur Vercel',
    }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month') // format "YYYY-MM" ou null pour "all time"

  // Détermine la fenêtre date si un mois est spécifié
  let fromDate = null
  let toDate = null
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [yyyy, mm] = monthParam.split('-').map(Number)
    fromDate = `${yyyy}-${String(mm).padStart(2, '0')}-01`
    // Dernier jour du mois : nouveau mois - 1 jour
    const nextMonth = new Date(yyyy, mm, 1) // mm est 1-based, donc Date(y, mm, 1) = 1er du mois suivant
    nextMonth.setDate(0) // 0 = dernier jour du mois précédent
    toDate = nextMonth.toISOString().slice(0, 10)
  }

  try {
    // 1) Récupère les payouts (avec filtre date si défini)
    let query = admin
      .from('payouts')
      .select('id, user_id, account_id, date, amount, note, created_at')
      .order('date', { ascending: false })

    if (fromDate && toDate) {
      query = query.gte('date', fromDate).lte('date', toDate)
    }

    const { data: payouts, error: payoutsErr } = await query
    if (payoutsErr) throw payoutsErr

    if (!payouts || payouts.length === 0) {
      return Response.json({
        filter: { month: monthParam, fromDate, toDate },
        totalAmount: 0,
        totalCount: 0,
        usersWithPayouts: 0,
        users: [],
      })
    }

    // 2) Récupère les accounts et firms associés (en batch)
    const accountIds = [...new Set(payouts.map(p => p.account_id))]
    const { data: accounts } = await admin
      .from('accounts')
      .select('id, firm_id, name, currency, plan_size')
      .in('id', accountIds)

    const firmIds = [...new Set((accounts || []).map(a => a.firm_id))]
    const { data: firms } = await admin
      .from('firms')
      .select('id, name')
      .in('id', firmIds)

    // 3) Récupère TOUS les users (pour avoir les emails — limité à 1000)
    const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const allUsers = usersData?.users || []

    // 4) Lookup maps pour join O(1)
    const accountById = new Map((accounts || []).map(a => [a.id, a]))
    const firmById    = new Map((firms || []).map(f => [f.id, f]))
    const emailById   = new Map(allUsers.map(u => [u.id, u.email]))

    // 5) Enrichit chaque payout avec firm_name, account_name, currency
    const enrichedPayouts = payouts.map(p => {
      const acc = accountById.get(p.account_id) || {}
      const firm = firmById.get(acc.firm_id) || {}
      return {
        id: p.id,
        user_id: p.user_id,
        date: p.date,
        amount: Number(p.amount) || 0,
        currency: acc.currency || 'USD',
        firm_name: firm.name || '(firme supprimée)',
        account_name: acc.name || '(compte supprimé)',
        account_size: acc.plan_size || '',
        note: p.note || '',
      }
    })

    // 6) Group by user
    const byUser = new Map()
    for (const p of enrichedPayouts) {
      if (!byUser.has(p.user_id)) {
        byUser.set(p.user_id, {
          user_id: p.user_id,
          email: emailById.get(p.user_id) || '(user supprimé)',
          totalAmount: 0,
          count: 0,
          lastPayoutDate: null,
          payouts: [],
        })
      }
      const u = byUser.get(p.user_id)
      u.totalAmount += p.amount
      u.count += 1
      if (!u.lastPayoutDate || p.date > u.lastPayoutDate) {
        u.lastPayoutDate = p.date
      }
      u.payouts.push(p)
    }

    // 7) Sort users par totalAmount DESC
    const users = [...byUser.values()].sort((a, b) => b.totalAmount - a.totalAmount)

    const totalAmount = enrichedPayouts.reduce((sum, p) => sum + p.amount, 0)

    return Response.json({
      filter: { month: monthParam, fromDate, toDate },
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalCount: enrichedPayouts.length,
      usersWithPayouts: users.length,
      users,
    })
  } catch (err) {
    console.error('[/api/admin/payouts GET]', err)
    return Response.json({ error: err.message || 'Erreur server' }, { status: 500 })
  }
}
