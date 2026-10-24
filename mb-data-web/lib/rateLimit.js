// lib/rateLimit.js — limitation de débit des routes /api/*.
//
// USAGE (dans une route, toujours avec await) :
//   const limit = await rateLimit({ key: `waitlist:${ip}`, windowMs: 60_000, max: 5 })
//   if (!limit.allowed) return rateLimitResponse(limit)
//
// Les compteurs vivent dans Postgres (table rate_limits, fonction atomique
// rate_limit_hit, voir supabase-schema.sql) : ils survivent aux démarrages à
// froid et sont partagés entre les instances Vercel. En mémoire, chaque
// instance avait son compteur, remis à zéro à chaque démarrage.
//
// Si la base ne répond pas (variables absentes, fonction pas encore créée,
// panne), on retombe sur le compteur EN MÉMOIRE de l'instance plutôt que de
// bloquer ou d'ouvrir complètement la route.
// Les clés sont hachées avant stockage : une IP n'est jamais écrite en clair.
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const buckets = new Map() // key → { count: number, resetAt: number (timestamp ms) }

// Cleanup périodique des buckets expirés (toutes les 5 min)
// Important pour les long-running instances Vercel — évite fuite mémoire si beaucoup de clés
let cleanupInterval = null
function ensureCleanup() {
  if (cleanupInterval) return
  if (typeof setInterval === 'undefined') return // edge runtime n'a pas setInterval
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of buckets) {
      if (entry.resetAt < now) buckets.delete(key)
    }
  }, 5 * 60 * 1000)
  // Pas de unref() — on veut que ça reste actif tant que la fonction est warm
}

/**
 * Vérifie et incrémente le compteur pour `key`.
 *
 * @param {object} opts
 * @param {string} opts.key       Identifiant unique (ex: `waitlist:ip` ou `calendar:ip`)
 * @param {number} opts.windowMs  Durée de la fenêtre en ms (défaut 60_000 = 1 min)
 * @param {number} opts.max       Nombre max d'appels dans la fenêtre (défaut 60)
 * @returns {{ allowed: boolean, remaining: number, resetAt: number, retryAfter?: number }}
 */
export function rateLimitMemory({ key, windowMs = 60_000, max = 60 }) {
  ensureCleanup()
  const now = Date.now()
  const entry = buckets.get(key)

  // Pas d'entrée OU fenêtre expirée → reset
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }

  // Limite atteinte
  if (entry.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    }
  }

  // Incrémente le compteur
  entry.count += 1
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt }
}

let db = null
function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  if (!db) db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  return db
}

export function hashKey(key) {
  return createHash('sha256').update(String(key)).digest('hex').slice(0, 40)
}

/**
 * Compte un appel pour `key` et dit s'il est autorisé.
 * @returns {Promise<{ allowed: boolean, remaining: number, resetAt: number, retryAfter?: number }>}
 */
export async function rateLimit({ key, windowMs = 60_000, max = 60 }) {
  const c = client()
  if (c) {
    try {
      const { data, error } = await c.rpc('rate_limit_hit', { p_key: hashKey(key), p_window_ms: Math.round(windowMs), p_max: max })
      const row = Array.isArray(data) ? data[0] : data
      if (!error && row) {
        const resetAt = new Date(row.reset_at).getTime()
        return row.allowed
          ? { allowed: true, remaining: Math.max(0, max - row.hits), resetAt }
          : { allowed: false, remaining: 0, resetAt, retryAfter: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)) }
      }
    } catch { /* repli en mémoire ci-dessous */ }
  }
  return rateLimitMemory({ key, windowMs, max })
}

/**
 * Helper pour répondre directement avec 429 Too Many Requests.
 * Inclut les headers `Retry-After` et `X-RateLimit-*` standards.
 */
export function rateLimitResponse(limit, customMessage) {
  return Response.json(
    { error: customMessage || 'Too many requests. Please slow down.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(limit.retryAfter || 60),
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(limit.resetAt / 1000)),
      },
    }
  )
}
