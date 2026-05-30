// POST /api/push/unsubscribe — supprime une subscription push de Supabase.

import { createClient } from '@supabase/supabase-js'
import { verifyAuth, getClientIp } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'

export async function POST(req) {
  try {
    // Rate limit: 10 req/min per IP
    const ip = getClientIp(req)
    const limit = rateLimit({ key: `push-unsubscribe:${ip}`, windowMs: 60_000, max: 10 })
    if (!limit.allowed) return rateLimitResponse(limit)

    const auth = await verifyAuth(req)
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

    const { endpoint } = await req.json()
    if (!endpoint) return Response.json({ error: 'Missing endpoint' }, { status: 400 })

    // Service role client for DB operations (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    await supabase.from('push_subscriptions')
      .delete()
      .eq('user_id', auth.user.id)
      .eq('endpoint', endpoint)

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
