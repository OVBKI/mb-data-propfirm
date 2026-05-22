// POST /api/groups/join — rejoindre un groupe via invite_code.
// Phase 3 réseau social (mai 2026).
//
// Body : { code: string }  // 6 chars alphanum
// Réponse : { ok, group_id, group_name } | { error }
//
// 🛡 SÉCURITÉ :
//   - Auth Bearer obligatoire (verifyAuth)
//   - Rate limit 10 join/min/IP (anti-bruteforce des codes invite)
//   - Service_role pour bypass RLS (l'user n'est pas encore membre, donc pas vu via RLS)
//   - Check max_members (anti-overflow)
//   - Check pas déjà membre (idempotent — retourne ok dans ce cas)

import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(req) {
  // Rate limit anti-bruteforce codes invite (6 chars = 32^6 ≈ 1 milliard combinaisons)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
  const limit = rateLimit({ key: `groups-join:${ip}`, windowMs: 60_000, max: 10 })
  if (!limit.allowed) {
    return rateLimitResponse(limit, 'Trop de tentatives. Réessaye dans 1 minute.')
  }

  // Auth
  const auth = await verifyAuth(req)
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status || 401 })
  }

  // Parse body
  let body
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const code = String(body?.code || '').trim().toUpperCase()
  if (!code || !/^[A-Z0-9]{6}$/.test(code)) {
    return Response.json({ error: 'Code invalide (6 caractères alphanumériques)' }, { status: 400 })
  }

  const admin = getAdminClient()
  if (!admin) return Response.json({ error: 'Service role manquant' }, { status: 500 })

  // 1) Trouve le groupe via le code
  const { data: group, error: gErr } = await admin
    .from('groups')
    .select('id, name, members_count, max_members')
    .eq('invite_code', code)
    .maybeSingle()
  if (gErr) {
    console.error('[groups/join] find error:', gErr)
    return Response.json({ error: 'Erreur recherche groupe' }, { status: 500 })
  }
  if (!group) {
    return Response.json({ error: 'Code invitation introuvable' }, { status: 404 })
  }

  // 2) Check déjà membre (idempotent)
  const { data: existing } = await admin
    .from('group_members')
    .select('user_id')
    .eq('group_id', group.id)
    .eq('user_id', auth.user.id)
    .maybeSingle()
  if (existing) {
    return Response.json({ ok: true, group_id: group.id, group_name: group.name, alreadyMember: true })
  }

  // 3) Check max_members
  if (group.members_count >= group.max_members) {
    return Response.json({ error: `Groupe plein (${group.max_members} membres max)` }, { status: 403 })
  }

  // 4) Insert membership
  const { error: insErr } = await admin
    .from('group_members')
    .insert({ group_id: group.id, user_id: auth.user.id, role: 'member' })
  if (insErr) {
    console.error('[groups/join] insert error:', insErr)
    return Response.json({ error: insErr.message }, { status: 500 })
  }

  return Response.json({ ok: true, group_id: group.id, group_name: group.name })
}
