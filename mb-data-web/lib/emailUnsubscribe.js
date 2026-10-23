// lib/emailUnsubscribe.js — lien de désinscription signé, utilisable SANS être connecté.
//
// Un e-mail ne peut pas exiger une connexion pour se désabonner : le lien doit
// marcher depuis n'importe quel appareil, et les clients mail (Gmail, Outlook)
// l'appellent eux-mêmes en un clic (RFC 8058, en-tête List-Unsubscribe-Post).
// Le lien porte donc l'identifiant de l'utilisateur ET une signature HMAC : sans
// la clé serveur, impossible de désabonner quelqu'un d'autre en devinant son id.
//
// Clé : EMAIL_UNSUBSCRIBE_SECRET, à défaut CRON_SECRET (déjà présent en prod).
// Changer la clé invalide les liens des e-mails déjà envoyés — à éviter.
import { createHmac, timingSafeEqual } from 'crypto'

function secret() {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || ''
}

export function unsubscribeToken(userId, key = secret()) {
  if (!key || !userId) return null
  return createHmac('sha256', key).update(`unsubscribe:${userId}`).digest('base64url').slice(0, 32)
}

export function verifyUnsubscribeToken(userId, token, key = secret()) {
  const expected = unsubscribeToken(userId, key)
  if (!expected || typeof token !== 'string' || token.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://quantara.tech').replace(/\/$/, '')
}

/** Page lisible par un humain (confirmation avant d'agir). */
export function unsubscribePageUrl(userId) {
  const t = unsubscribeToken(userId)
  return t ? `${siteUrl()}/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${t}` : `${siteUrl()}/app/settings`
}

/**
 * En-têtes à poser sur chaque e-mail non essentiel. Le POST en un clic (RFC 8058)
 * vise directement l'API ; un simple GET de la même URL ne fait RIEN, car les
 * antivirus de messagerie pré-ouvrent les liens et désabonneraient les gens à
 * leur insu.
 */
export function unsubscribeHeaders(userId) {
  const t = unsubscribeToken(userId)
  if (!t) return { 'List-Unsubscribe': '<mailto:admin@quantara.tech?subject=unsubscribe>' }
  const api = `${siteUrl()}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${t}`
  return {
    'List-Unsubscribe': `<${api}>, <mailto:admin@quantara.tech?subject=unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}
