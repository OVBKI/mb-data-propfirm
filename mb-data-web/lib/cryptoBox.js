// lib/cryptoBox.js — chiffrement des secrets stockés en base.
//
// Sert aux identifiants broker. La base est protégée par RLS, mais RLS ne
// protège pas d'une fuite du dump : un mot de passe en clair dans une sauvegarde
// est un mot de passe fuité. Le chiffrement est la seconde barrière.
//
// AES-256-GCM, pas AES-CBC : GCM est AUTHENTIFIÉ. Un chiffré modifié échoue au
// déchiffrement au lieu de rendre des octets aléatoires qu'on enverrait ensuite
// à Tradovate comme mot de passe.
//
// Format stocké : `v1.<iv b64url>.<tag b64url>.<chiffré b64url>`
// Le préfixe de version permettra de changer d'algorithme sans deviner le format
// des lignes existantes.

import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto'

const VERSION = 'v1'
const IV_BYTES = 12          // 96 bits, la taille recommandée pour GCM
const KEY_BYTES = 32

function b64u(buf) { return buf.toString('base64url') }
function unb64u(s) { return Buffer.from(s, 'base64url') }

// La clé vient de l'environnement et n'est JAMAIS écrite ailleurs.
// On la lit à chaque appel plutôt qu'au chargement du module : une variable
// manquante doit faire échouer la requête concernée, pas la construction.
function readKey() {
  const raw = process.env.TRADOVATE_ENC_KEY
  if (!raw) throw new Error('TRADOVATE_ENC_KEY manquante')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== KEY_BYTES) {
    throw new Error(`TRADOVATE_ENC_KEY doit faire ${KEY_BYTES} octets en base64 (reçu ${key.length})`)
  }
  return key
}

export function encryptSecret(plain) {
  if (typeof plain !== 'string' || plain === '') throw new Error('Rien à chiffrer')
  const key = readKey()
  const iv = randomBytes(IV_BYTES)
  const c = createCipheriv('aes-256-gcm', key, iv)
  const out = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return [VERSION, b64u(iv), b64u(c.getAuthTag()), b64u(out)].join('.')
}

export function decryptSecret(packed) {
  const parts = String(packed || '').split('.')
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error('Format chiffré inconnu')
  const key = readKey()
  const d = createDecipheriv('aes-256-gcm', key, unb64u(parts[1]))
  d.setAuthTag(unb64u(parts[2]))
  // `final()` LÈVE si le tag ne correspond pas : c'est là que l'altération est
  // détectée, et c'est exactement le comportement voulu.
  return Buffer.concat([d.update(unb64u(parts[3])), d.final()]).toString('utf8')
}

// Comparaison à temps constant, pour les secrets partagés (cron, webhooks).
// `a === b` sort au premier octet différent et laisse mesurer le préfixe correct.
export function secretEquals(a, b) {
  const ba = Buffer.from(String(a || ''), 'utf8')
  const bb = Buffer.from(String(b || ''), 'utf8')
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

// Retire tout ce qui ressemble à un secret d'un objet destiné aux journaux.
// Un identifiant broker qui atterrit dans les logs annule le chiffrement.
const SECRET_KEYS = /^(password|pass|secret|sec|token|access_?token|api_?key|encrypted_\w+)$/i
export function redact(value, depth = 0) {
  if (depth > 6 || value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(v => redact(v, depth + 1))
  const out = {}
  for (const [k, v] of Object.entries(value)) {
    out[k] = SECRET_KEYS.test(k) ? '[masqué]' : redact(v, depth + 1)
  }
  return out
}
