// app/api/tradovate/sync/route.js — importer les trades depuis Tradovate.
//
// Chaîne complète : identifiants déchiffrés → jeton → exécutions → appariement
// en allers-retours → lignes de journal. Tout le calcul vit dans lib/tradovate.js
// et y est testé ; cette route n'orchestre que les entrées-sorties.
//
// IDEMPOTENCE : l'écriture passe par `upsert` sur (user_id, source_id). Relancer
// une synchro sur la même période met à jour au lieu de dupliquer — sans quoi
// chaque passage doublerait le journal de l'utilisateur.

import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'
import { decryptSecret, encryptSecret, redact } from '../../../../lib/cryptoBox'
import { renewToken, listFills } from '../../../../lib/tradovateClient'
import { pairFills, toJournalEntry, isTokenUsable } from '../../../../lib/tradovate'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

export async function POST(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const limit = rateLimit({ key: `tradovate-sync:${auth.user.id}`, windowMs: 60_000, max: 4 })
  if (!limit.allowed) return rateLimitResponse(limit)

  let body
  try { body = await request.json() } catch { return Response.json({ error: 'JSON invalide' }, { status: 400 }) }

  const credentialId = String(body?.credentialId || '')
  const accountId = String(body?.accountId || '')
  if (!credentialId || !accountId) {
    return Response.json({ error: 'credentialId et accountId sont requis' }, { status: 400 })
  }

  const db = admin()

  // Le compte de destination doit appartenir à l'appelant. Sans ce contrôle, un
  // utilisateur pourrait écrire des trades dans le compte d'un autre.
  const { data: account } = await db
    .from('accounts').select('id, user_id').eq('id', accountId).maybeSingle()
  if (!account || account.user_id !== auth.user.id) {
    return Response.json({ error: 'Compte introuvable' }, { status: 404 })
  }

  const { data: cred } = await db
    .from('tradovate_credentials')
    .select('id, user_id, label, username, encrypted_token, token_expires_at, environment')
    .eq('id', credentialId).maybeSingle()
  if (!cred || cred.user_id !== auth.user.id) {
    return Response.json({ error: 'Connexion introuvable' }, { status: 404 })
  }

  let token
  try {
    token = decryptSecret(cred.encrypted_token)
  } catch {
    // Cas réel : la clé de chiffrement a été tournée. Le message doit dire quoi
    // FAIRE, pas « erreur interne ».
    await noteError(db, cred.id, 'Jeton illisible — reconnecte ce compte.')
    return Response.json({ error: 'Jeton illisible. Supprime cette connexion et reconnecte-toi.' }, { status: 409 })
  }

  const expiresAt = cred.token_expires_at ? Date.parse(cred.token_expires_at) : null
  let session = { ok: true, token, expiresAt }

  // Un jeton Tradovate vit ~80 min. On le prolonge AVANT l'échéance : un jeton
  // expiré ne se renouvelle plus, il faut repasser par l'écran d'autorisation.
  if (!isTokenUsable(session)) {
    const renewed = await renewToken({ token, environment: cred.environment })
    if (!renewed.ok) {
      await noteError(db, cred.id, 'Autorisation expirée — reconnecte ce compte.')
      return Response.json({ error: 'Autorisation Tradovate expirée. Reconnecte le compte.', kind: 'reauth' }, { status: 401 })
    }
    session = renewed
    await db.from('tradovate_credentials').update({
      encrypted_token: encryptSecret(renewed.token),
      token_expires_at: renewed.expiresAt ? new Date(renewed.expiresAt).toISOString() : null,
    }).eq('id', cred.id)
  }

  let fills
  try {
    fills = await listFills({ token: session.token, environment: cred.environment })
  } catch (e) {
    await noteError(db, cred.id, e.message)
    return Response.json({ error: `Lecture des exécutions impossible : ${e.message}` }, { status: 502 })
  }

  const trades = pairFills(fills)
  if (trades.length === 0) {
    await noteOk(db, cred.id)
    return Response.json({ ok: true, imported: 0, trades: 0, message: 'Aucun aller-retour terminé sur la période.' })
  }

  const rows = trades.map(t => toJournalEntry(t, { accountId, userId: auth.user.id }))
  const { error } = await db.from('journal_entries').upsert(rows, { onConflict: 'user_id,source_id' })
  if (error) {
    await noteError(db, cred.id, error.message)
    // Le quota de palier remonte par ici : le message brut ne veut rien dire
    // pour l'utilisateur, mais il est traduit côté client par planLimitMessage.
    return Response.json({ error: error.message }, { status: 400 })
  }

  await noteOk(db, cred.id)
  const incomplete = trades.filter(t => t.needsMultiplier).length
  return Response.json({
    ok: true,
    imported: rows.length,
    incomplete,
    // Aucun identifiant ne doit atteindre les journaux, même en diagnostic.
    sample: redact(rows[0] || {}),
  })
}

async function noteOk(db, id) {
  await db.from('tradovate_credentials')
    .update({ last_synced_at: new Date().toISOString(), last_error: null }).eq('id', id)
}
async function noteError(db, id, message) {
  await db.from('tradovate_credentials')
    .update({ last_error: String(message).slice(0, 300) }).eq('id', id)
}
