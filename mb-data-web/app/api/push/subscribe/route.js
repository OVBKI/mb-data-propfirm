// POST /api/push/subscribe — enregistre une subscription push dans Supabase.
// Authentification : Bearer token (user authentifié).

import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return Response.json({ error: 'No auth token' }, { status: 401 })

    // Vérifie l'identité de l'user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !user) return Response.json({ error: 'Invalid token' }, { status: 401 })

    const body = await req.json()
    const { endpoint, p256dh, auth, user_agent } = body
    if (!endpoint || !p256dh || !auth) {
      return Response.json({ error: 'Missing subscription fields' }, { status: 400 })
    }

    // Upsert : si déjà existe (même endpoint pour ce user) on update plutôt qu'erreur
    const { error: insertErr } = await supabase
      .from('push_subscriptions')
      .upsert(
        { user_id: user.id, endpoint, p256dh, auth, user_agent: user_agent || null },
        { onConflict: 'user_id,endpoint' }
      )
    if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 })

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
