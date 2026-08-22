// app/api/tradovate/credentials/route.js — lister et supprimer les connexions.
//
// La CRÉATION passe par OAuth (voir oauth/start + oauth/callback) : il n'y a
// donc pas de POST ici. Aucun mot de passe ne transite par Quantara.

import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../../lib/apiAuth'
import { tradovateConfigured } from '../../../../lib/tradovateClient'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

export async function GET(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await admin()
    .from('tradovate_credentials')
    .select('id, label, username, environment, auto_sync, token_expires_at, last_synced_at, last_error, created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ credentials: data || [], configured: tradovateConfigured() })
}

// DELETE — retirer une connexion. Le jeton part avec elle.
export async function DELETE(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'id requis' }, { status: 400 })

  const { error } = await admin()
    .from('tradovate_credentials')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)   // ceinture et bretelles : RLS + filtre explicite

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
