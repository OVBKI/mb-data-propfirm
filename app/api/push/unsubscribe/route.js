// POST /api/push/unsubscribe — supprime une subscription push de Supabase.

import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return Response.json({ error: 'No auth token' }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !user) return Response.json({ error: 'Invalid token' }, { status: 401 })

    const { endpoint } = await req.json()
    if (!endpoint) return Response.json({ error: 'Missing endpoint' }, { status: 400 })

    await supabase.from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
