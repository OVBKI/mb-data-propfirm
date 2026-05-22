// POST /api/auth/resolve-username — wrapper rate-limited pour le RPC resolve_username_to_email
//
// Body: { username: string }
// Réponse: { email: string | null } | { error: string }
//
// 🛡 SÉCURITÉ (mai 2026 — audit Agent #1) :
// L'RPC Supabase resolve_username_to_email était précédemment ouverte à `anon`,
// permettant à n'importe qui d'énumérer username → email (vector phishing).
//
// Cette route :
//  1. Rate-limite par IP (5 résolutions/min) — bloque le scraping massif
//  2. Utilise la service_role côté serveur — ne dépend pas du grant anon
//  3. Permet de révoquer le grant anon sur l'RPC (à exécuter en SQL après deploy)
//
// La SQL pour révoquer le grant anon (à exécuter UNE FOIS sur Supabase) :
//   revoke execute on function public.resolve_username_to_email(text) from anon;

import { createClient } from '@supabase/supabase-js'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'

// Pattern username : doit matcher la regex côté client (3-20 chars alphanum + _ -)
const USERNAME_RE = /^[A-Za-z0-9_-]{3,20}$/

export async function POST(req) {
  // IP pour rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

  // Rate limit : 5 résolutions / minute / IP
  // Suffisant pour un user qui fait quelques tentatives de login, bloque le scraping.
  const limit = rateLimit({ key: `resolve-username:${ip}`, windowMs: 60_000, max: 5 })
  if (!limit.allowed) {
    return rateLimitResponse(limit, 'Trop de tentatives. Réessaye dans 1 minute.')
  }

  // Parse body
  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const username = String(body?.username || '').trim()
  if (!username) {
    return Response.json({ error: 'Username manquant' }, { status: 400 })
  }
  // Valide le format — si pas valide, pas besoin de query la DB
  if (!USERNAME_RE.test(username)) {
    return Response.json({ email: null })
  }

  // Vérif config
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
  }

  // Appel du RPC avec service_role (bypass les restrictions grant)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase.rpc('resolve_username_to_email', {
    p_username: username,
  })

  if (error) {
    console.error('[resolve-username] RPC error:', error.message)
    return Response.json({ error: 'Erreur de résolution' }, { status: 500 })
  }

  // data est soit l'email (string), soit null si username inconnu
  return Response.json({ email: data || null })
}
