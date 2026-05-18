// lib/rateLimit.js — Rate limiter in-memory pour routes /api/*
//
// USAGE :
//   import { rateLimit } from '@/lib/rateLimit'
//
//   export async function POST(request) {
//     const ip = getClientIp(request)
//     const limit = rateLimit({ key: `px-login:${ip}`, windowMs: 60_000, max: 5 })
//     if (!limit.allowed) {
//       return Response.json(
//         { error: 'Too many requests, slow down.' },
//         { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
//       )
//     }
//     // ... logique route
//   }
//
// IMPLÉMENTATION :
//   - Sliding window simple via Map<string, { count, resetAt }>
//   - Mémoire partagée pour les requêtes sur la MÊME instance Vercel (function warm)
//   - Les cold starts repartent de zéro (pas grave : un attaquant qui spam
//     paye le coût du cold start aussi)
//   - Cleanup auto toutes les 5 min pour éviter la fuite mémoire
//
// LIMITATIONS connues :
//   - Pas de persistance cross-instance (Vercel peut avoir 2-3 instances en parallèle)
//     → un attaquant pourrait avoir 2-3× la limite réelle. Acceptable pour MVP.
//   - Pour une vraie protection en prod, utiliser Upstash Redis (gratuit < 10k req/jour)
//     ou Vercel KV. À considérer si Quantara atteint > 1000 utilisateurs actifs.

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
 * @param {string} opts.key       Identifiant unique (ex: `px-login:userId` ou `calendar:ip`)
 * @param {number} opts.windowMs  Durée de la fenêtre en ms (défaut 60_000 = 1 min)
 * @param {number} opts.max       Nombre max d'appels dans la fenêtre (défaut 60)
 * @returns {{ allowed: boolean, remaining: number, resetAt: number, retryAfter?: number }}
 */
export function rateLimit({ key, windowMs = 60_000, max = 60 }) {
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
