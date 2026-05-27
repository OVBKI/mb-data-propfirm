// POST /api/push/subscribe — enregistre une subscription push dans Supabase.
// Authentification : verifyAuth() (Bearer token).

import { createClient } from '@supabase/supabase-js'
import { verifyAuth, getClientIp } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'

export async function POST(req) {
  try {
    // Rate limit: 10 req/min per IP
    const ip = getClientIp(req)
    const limit = rateLimit({ key: `push-subscribe:${ip}`, windowMs: 60_000, max: 10 })
    if (!limit.allowed) return rateLimitResponse(limit)

    const auth = await verifyAuth(req)
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

    const body = await req.json()
    const { endpoint, p256dh, auth: pushAuth, user_agent } = body
    if (!endpoint || !p256dh || !pushAuth) {
      return Response.json({ error: 'Missing subscription fields' }, { status: 400 })
    }

    // Service role client for DB operations (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Upsert : si déjà existe (même endpoint pour ce user) on update plutôt qu'erreur
    const { error: insertErr } = await supabase
      .from('push_subscriptions')
      .upsert(
        { user_id: auth.user.id, endpoint, p256dh, auth: pushAuth, user_agent: user_agent || null },
        { onConflict: 'user_id,endpoint' }
      )
    if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 })

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
