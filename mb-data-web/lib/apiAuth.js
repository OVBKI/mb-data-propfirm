// lib/apiAuth.js — Helpers d'authentification pour les routes /api/*
//
// USAGE :
//   import { verifyAuth, verifyAdmin, getClientIp } from '@/lib/apiAuth'
//
//   export async function POST(request) {
//     const auth = await verifyAuth(request)
//     if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })
//     const userId = auth.user.id
//     // ... ta logique
//   }
//
// Sécurité : tous les checks utilisent le token Bearer dans `Authorization` header
// (envoyé par le client via `supabase.auth.getSession()` → headers.Authorization).
// Le token est validé contre Supabase Auth (un client read-only fait getUser(token)).

import { createClient } from '@supabase/supabase-js'
import { isAdmin } from './admins'

// ============================================================================
// verifyAuth — exige un user authentifié
// ============================================================================
// Retour :
//   { user }              → succès, user contient { id, email, ... }
//   { error, status }     → échec ; status est le code HTTP à retourner
export async function verifyAuth(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return { error: 'Supabase env vars missing', status: 500 }
  }

  // Récupère le token Bearer (envoyé par le client via fetch(..., { headers: { Authorization: `Bearer ${session.access_token}` } }))
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return { error: 'Missing auth token', status: 401 }
  }

  // Vérifie le token via Supabase Auth
  const client = createClient(url, anonKey)
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) {
    return { error: 'Invalid token', status: 401 }
  }

  return { user }
}

// ============================================================================
// verifyAdmin — exige un user authentifié ET admin
// ============================================================================
export async function verifyAdmin(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return auth
  if (!isAdmin(auth.user.email)) {
    return { error: 'Forbidden', status: 403 }
  }
  return auth
}

// ============================================================================
// getClientIp — extrait l'IP du client depuis les headers Vercel
// ============================================================================
// Utile pour rate-limiter par IP les endpoints publics (sans auth).
// Vercel met l'IP cliente dans `x-forwarded-for` (la première valeur si proxy chain).
export function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip')
      || request.headers.get('cf-connecting-ip') // Cloudflare fallback
      || 'unknown'
}
