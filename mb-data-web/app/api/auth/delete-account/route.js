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

  const failures = []
  for (const table of tables) {
    const col = (table === 'follows') ? 'follower_id' : 'user_id'
    const { error } = await admin.from(table).delete().eq(col, userId)
    if (error) { console.error(`[delete-account] ${table}:`, error.message); failures.push(table) }
  }

  if (tables.includes('follows')) {
    const { error } = await admin.from('follows').delete().eq('following_id', userId)
    if (error) { console.error('[delete-account] follows(following_id):', error.message); failures.push('follows') }
  }

  // Best-effort cleanup of secondary tables (also covered by FK cascade on auth.users).
  await admin.from('group_members').delete().eq('user_id', userId).then(() => {}, () => {})

  // RGPD: ne PAS supprimer l'utilisateur auth si une table PII a échoué — on laisse
  // le compte pour que la suppression soit ré-essayable, au lieu d'orpheliner les données.
  if (failures.length) {
    return Response.json({
      error: `Suppression incomplète (${failures.join(', ')}). Réessaie ou contacte le support.`,
    }, { status: 500 })
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId)
  if (authError) {
    console.error('[delete-account] auth delete:', authError.message)
    return Response.json({ error: 'Data deleted but auth removal failed. Contact support.' }, { status: 500 })
  }

  return Response.json({ success: true })
}
