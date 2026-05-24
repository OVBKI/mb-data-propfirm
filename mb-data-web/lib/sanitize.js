// lib/sanitize.js — Fonctions de sanitization pour prévenir les injections XSS.
//
// USAGE :
//   import { sanitizeUrl } from '@/lib/sanitize'
//   const safe = sanitizeUrl(userProvidedUrl)
//   // retourne null si le protocole n'est pas http/https (bloque javascript:, data:, etc.)

/**
 * Valide et normalise une URL fournie par l'utilisateur.
 * Bloque les protocoles dangereux (javascript:, data:, vbscript:, etc.).
 * Retourne null si l'URL est invalide ou utilise un protocole non autorisé.
 */
export function sanitizeUrl(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (!['https:', 'http:'].includes(parsed.protocol)) return null
    return parsed.href
  } catch {
    return null
  }
}
