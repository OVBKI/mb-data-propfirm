// API admin pour gérer les users.
// Nécessite SUPABASE_SERVICE_ROLE_KEY en env var Vercel (côté server uniquement).
//
// Endpoints :
//   GET  /api/admin/users          → liste paginée + recherche
//   GET  /api/admin/users?summary=1 → stats agrégées (total, newWeek, newMonth, active7d)
//   DELETE /api/admin/users?id=xxx  → supprime un user (avec cascade sur ses data)
//
// SÉCURITÉ : vérifie que la requête vient d'un admin via Bearer token Supabase
// + match avec ADMIN_EMAILS (centralisée dans lib/admins.js).

import { createClient } from '@supabase/supabase-js'
import { verifyAdmin } from '../../../../lib/apiAuth'

export const dynamic = 'force-dynamic'

// Crée un client Supabase avec la service_role key (admin, bypass RLS)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// === GET ===
export async function GET(request) {
  const auth = await verifyAdmin(request)
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status || 401 })
  }

  const admin = getAdminClient()
  if (!admin) {
    return Response.json({
      error: 'SUPABASE_SERVICE_ROLE_KEY non configurée sur Vercel',
      hint: 'Va dans Vercel → Settings → Environment Variables → Add → SUPABASE_SERVICE_ROLE_KEY (récupère la valeur dans Supabase Dashboard → Settings → API → service_role secret)',
    }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const summary = searchParams.get('summary') === '1'

  try {
    // Liste tous les users (Supabase Auth admin API)
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (error) throw error
    const users = data?.users || []

    // Mode "summary" : retourne juste des stats agrégées
    if (summary) {
      const now = new Date()
      const day7  = new Date(now); day7.setDate(now.getDate() - 7)
      const day30 = new Date(now); day30.setDate(now.getDate() - 30)

      // Active users = ceux qui ont saisi un trade ces 7 derniers jours
      const { data: recentTrades } = await admin
        .from('journal_entries')
        .select('user_id')
        .gte('created_at', day7.toISOString())
      const activeUserIds = new Set((recentTrades || []).map(t => t.user_id))

      return Response.json({
        total: users.length,
        newWeek: users.filter(u => new Date(u.created_at) >= day7).length,
        newMonth: users.filter(u => new Date(u.created_at) >= day30).length,
        active7d: activeUserIds.size,
      })
    }

    // Mode liste : avec recherche et stats par user
    const q = (searchParams.get('q') || '').toLowerCase()
    const filtered = q
      ? users.filter(u => (u.email || '').toLowerCase().includes(q))
      : users

    // Pour chaque user, compte ses firms / trades
    const ids = filtered.map(u => u.id)
    const { data: firmCounts } = await admin
      .from('firms')
      .select('user_id')
      .in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    const { data: tradeCounts } = await admin
      .from('journal_entries')
      .select('user_id')
      .in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])

    const firmsByUser = {}
    ;(firmCounts || []).forEach(f => { firmsByUser[f.user_id] = (firmsByUser[f.user_id] || 0) + 1 })
    const tradesByUser = {}
    ;(tradeCounts || []).forEach(t => { tradesByUser[t.user_id] = (tradesByUser[t.user_id] || 0) + 1 })

    const enriched = filtered
      .map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        firms: firmsByUser[u.id] || 0,
        trades: tradesByUser[u.id] || 0,
        banned: u.banned_until !== null && new Date(u.banned_until) > new Date(),
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return Response.json({ users: enriched, total: users.length, filtered: enriched.length })
  } catch (err) {
    console.error('[/api/admin/users GET]', err)
    return Response.json({ error: err.message || 'Erreur server' }, { status: 500 })
  }
}

// === DELETE ===
export async function DELETE(request) {
  const auth = await verifyAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status || 401 })

  const admin = getAdminClient()
  if (!admin) return Response.json({ error: 'Service role not configured' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')
  if (!userId) return Response.json({ error: 'Missing id' }, { status: 400 })

  // Empêche de se supprimer soi-même
  if (userId === auth.user.id) {
    return Response.json({ error: 'Tu ne peux pas supprimer ton propre compte admin' }, { status: 400 })
  }

  try {
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[/api/admin/users DELETE]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
