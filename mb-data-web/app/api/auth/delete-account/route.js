import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../../lib/apiAuth'

export async function DELETE(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return Response.json({ error: 'Server config error' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey)
  const userId = auth.user.id

  const body = await request.json().catch(() => ({}))
  if (body.confirmation !== 'SUPPRIMER MON COMPTE') {
    return Response.json({ error: 'Confirmation text does not match' }, { status: 400 })
  }

  const tables = [
    'journal_entries',
    'payouts',
    'accounts',
    'firms',
    'push_subscriptions',
    'follows',
    'certificates',
    'profiles',
  ]

  for (const table of tables) {
    const col = (table === 'follows') ? 'follower_id' : 'user_id'
    const { error } = await admin.from(table).delete().eq(col, userId)
    if (error) console.error(`[delete-account] ${table}:`, error.message)
  }

  if (tables.includes('follows')) {
    await admin.from('follows').delete().eq('following_id', userId)
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId)
  if (authError) {
    console.error('[delete-account] auth delete:', authError.message)
    return Response.json({ error: 'Data deleted but auth removal failed. Contact support.' }, { status: 500 })
  }

  return Response.json({ success: true })
}
