// app/api/tradovate/credentials/route.js — gérer les connexions Tradovate.
//
// Le mot de passe ne fait qu'un aller : le client l'envoie, la route le VÉRIFIE
// auprès de Tradovate, le chiffre et le stocke. Il n'est jamais renvoyé, jamais
// journalisé, et le client n'a pas le droit de lire la colonne (voir le revoke
// dans supabase-schema.sql).

import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'
import { encryptSecret } from '../../../../lib/cryptoBox'
import { login, tradovateConfigured, missingConfigMessage } from '../../../../lib/tradovateClient'

// Le service role est nécessaire pour écrire une colonne que le client n'a pas
// le droit d'écrire. Instancié DANS le handler : au niveau module, une variable
// d'environnement manquante ferait échouer la construction du projet entier.
function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

// GET — la liste des connexions, SANS les secrets.
export async function GET(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await admin()
    .from('tradovate_credentials')
    .select('id, label, username, environment, auto_sync, sync_days_window, last_synced_at, last_error, created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ credentials: data || [], configured: tradovateConfigured() })
}

// POST — ajouter ou remplacer une connexion.
export async function POST(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  // Une tentative de connexion broker coûte cher côté Tradovate, qui pénalise
  // les rafales. On limite AVANT de l'appeler, pas après.
  const limit = rateLimit({ key: `tradovate-connect:${auth.user.id}`, windowMs: 10 * 60 * 1000, max: 5 })
  if (!limit.allowed) return rateLimitResponse(limit)

  if (!tradovateConfigured()) {
    return Response.json({ error: missingConfigMessage() }, { status: 503 })
  }

  let body
  try { body = await request.json() } catch { return Response.json({ error: 'JSON invalide' }, { status: 400 }) }

  const label = String(body?.label || '').trim()
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  const environment = body?.environment === 'demo' ? 'demo' : 'live'
  if (!label || !username || !password) {
    return Response.json({ error: 'label, username et password sont requis' }, { status: 400 })
  }

  // On VÉRIFIE avant de stocker. Enregistrer des identifiants faux donnerait une
  // connexion qui paraît active et échoue silencieusement à chaque synchro.
  const session = await login({ username, password, environment, deviceId: `quantara-${auth.user.id}` })
  if (!session.ok) {
    const status = session.kind === 'penalty' ? 429 : session.kind === 'config' ? 503 : 400
    return Response.json({ error: session.message, kind: session.kind }, { status })
  }

  const { error } = await admin().from('tradovate_credentials').upsert({
    user_id: auth.user.id,
    label,
    username,
    encrypted_password: encryptSecret(password),
    environment,
    last_error: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,label' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, label, environment })
}

// DELETE — retirer une connexion. Les identifiants partent avec elle.
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
