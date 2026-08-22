// lib/tradovateClient.js — les appels réseau vers Tradovate.
//
// Séparé de lib/tradovate.js à dessein : là-bas, tout est pur et testé sans
// réseau ; ici, tout est I/O et ne peut pas l'être sans identifiants réels.
// Garder la frontière nette évite d'avoir un cœur métier intestable.

import { TRADOVATE_HOSTS, authBody, parseAuthResponse } from './tradovate'

const APP_ID = process.env.TRADOVATE_APP_ID
const APP_VERSION = process.env.TRADOVATE_APP_VERSION || '1.0'
const CID = process.env.TRADOVATE_CID
const SEC = process.env.TRADOVATE_SEC

export function tradovateConfigured() {
  return Boolean(APP_ID && CID && SEC)
}

export function missingConfigMessage() {
  const missing = [
    !APP_ID && 'TRADOVATE_APP_ID',
    !CID && 'TRADOVATE_CID',
    !SEC && 'TRADOVATE_SEC',
  ].filter(Boolean)
  return `Configuration Tradovate incomplète : ${missing.join(', ')}. `
    + 'Ces valeurs viennent de la clé API délivrée par Tradovate à ton compte développeur.'
}

function base(environment) {
  return TRADOVATE_HOSTS[environment === 'demo' ? 'demo' : 'live']
}

// Authentifie et rend une session. Le cas de PÉNALITÉ est remonté tel quel :
// il ne faut ni le retenter en boucle (on aggraverait la limite) ni le
// présenter comme un mauvais mot de passe.
export async function login({ username, password, environment, deviceId }) {
  if (!tradovateConfigured()) return { ok: false, kind: 'config', message: missingConfigMessage() }
  const body = authBody({ username, password, appId: APP_ID, appVersion: APP_VERSION, cid: CID, sec: SEC, deviceId })
  let json
  try {
    const res = await fetch(`${base(environment)}/auth/accesstokenrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    json = await res.json().catch(() => null)
  } catch (e) {
    return { ok: false, kind: 'network', message: `Tradovate injoignable : ${e.message}` }
  }
  return parseAuthResponse(json)
}

async function get(path, { token, environment }) {
  const res = await fetch(`${base(environment)}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Tradovate ${path} → ${res.status}`)
  return res.json()
}

export const listAccounts = (s) => get('/account/list', s)
export const listFills = (s) => get('/fill/list', s)
export const listContracts = (s) => get('/contract/list', s)
