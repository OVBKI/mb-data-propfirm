// lib/tradovateClient.js — les appels réseau vers Tradovate.
//
// Séparé de lib/tradovate.js à dessein : là-bas, tout est pur et testé sans
// réseau ; ici, tout est I/O et ne peut pas l'être sans identifiants réels.
//
// L'authentification passe par OAUTH. La voie mot de passe a été abandonnée :
// elle exige un abonnement API à 25 $/mois côté utilisateur, et les PropFirms
// désactivent de toute façon la génération de clé API sur les comptes
// d'évaluation et financés.

import { TRADOVATE_HOSTS, oauthTokenUrl, tokenExchangeBody, parseAuthResponse } from './tradovate'

const CLIENT_ID = process.env.TRADOVATE_CLIENT_ID
const CLIENT_SECRET = process.env.TRADOVATE_CLIENT_SECRET
const REDIRECT_URI = process.env.TRADOVATE_REDIRECT_URI

export function tradovateConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET && REDIRECT_URI)
}

export function oauthConfig() {
  return { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT_URI }
}

export function missingConfigMessage() {
  const missing = [
    !CLIENT_ID && 'TRADOVATE_CLIENT_ID',
    !CLIENT_SECRET && 'TRADOVATE_CLIENT_SECRET',
    !REDIRECT_URI && 'TRADOVATE_REDIRECT_URI',
  ].filter(Boolean)
  return `Configuration Tradovate incomplète : ${missing.join(', ')}. `
    + 'Ces identifiants OAuth sont délivrés après acceptation du dossier NinjaTrader Ecosystem.'
}

function base(environment) {
  // Par défaut DEMO : c'est là que vivent les comptes PropFirm, même quand les
  // payouts sont réels. Se tromper renvoie « identifiants invalides » sans autre
  // explication, et fait chercher le problème au mauvais endroit pendant des heures.
  return TRADOVATE_HOSTS[environment === 'live' ? 'live' : 'demo']
}

// Échange le code d'autorisation contre un jeton.
// Le corps part en FORM-URLENCODED : ce point d'entrée refuse le JSON, et son
// message d'erreur ne le dit pas.
export async function exchangeCode({ code, environment }) {
  if (!tradovateConfigured()) return { ok: false, kind: 'config', message: missingConfigMessage() }
  try {
    const res = await fetch(oauthTokenUrl(environment), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenExchangeBody({ code, ...oauthConfig() }).toString(),
      cache: 'no-store',
    })
    return parseAuthResponse(await res.json().catch(() => null))
  } catch (e) {
    return { ok: false, kind: 'network', message: `Tradovate injoignable : ${e.message}` }
  }
}

// Prolonge un jeton ENCORE VALIDE. C'est ce qui rend la synchronisation
// vraiment automatique : le cron renouvelle avant l'échéance, et l'utilisateur
// n'a plus jamais à réautoriser.
//
// ⚠️ Un jeton EXPIRÉ ne se renouvelle pas — il faut repasser par l'écran
// d'autorisation. D'où un renouvellement bien avant l'échéance plutôt qu'après.
export async function renewToken({ token, environment }) {
  try {
    const res = await fetch(`${base(environment)}/auth/renewaccesstoken`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    return parseAuthResponse(await res.json().catch(() => null))
  } catch (e) {
    return { ok: false, kind: 'network', message: `Renouvellement impossible : ${e.message}` }
  }
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
