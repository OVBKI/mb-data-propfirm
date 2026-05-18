// /api/px-login — Proxy d'authentification ProjectX (Topstep, Tradeify, TPT, MFF, etc.).
//
// SÉCURITÉ (renforcée mai 2026 — audit Agent #3) :
//   1. AUTH REQUIRED : exige un user authentifié Quantara (Bearer token Supabase).
//      Sans ce check, n'importe qui pouvait spam ce endpoint avec des userName/apiKey
//      et brute-forcer les API broker. Maintenant : 401 si pas authentifié.
//
//   2. RATE LIMIT : max 5 appels / minute / user. Empêche un user compromis
//      (token volé) de bruteforcer plusieurs comptes broker à la suite.
//
//   3. NO LOGS DES SECRETS : on ne logge JAMAIS `userName` ou `apiKey` dans
//      console.log/error — uniquement le clientId (= nom de la firme) et le
//      statut HTTP de la réponse broker.
//
//   4. PAS DE PERSISTANCE : aucune crédential broker n'est stockée côté Quantara.
//      Le token retourné est utilisé uniquement côté client pour les appels suivants.

import { verifyAuth } from '../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit'

export async function POST(request) {
  // ── Sécurité #1 : authentification Quantara obligatoire ──
  const auth = await verifyAuth(request)
  if (auth.error) {
    return Response.json({ error: 'Non autorisé. Connecte-toi à Quantara.' }, { status: auth.status })
  }

  // ── Sécurité #2 : rate limit (5 req/min/user) ──
  const limit = rateLimit({ key: `px-login:${auth.user.id}`, windowMs: 60_000, max: 5 })
  if (!limit.allowed) {
    return rateLimitResponse(limit, 'Trop de tentatives de connexion. Réessaie dans une minute.')
  }

  try {
    const body = await request.json()
    const { userName, apiKey, clientId } = body

    // Validation minimale des inputs (avant d'appeler l'API broker)
    if (!userName || !apiKey || !clientId) {
      return Response.json({ error: 'userName, apiKey et clientId requis' }, { status: 400 })
    }
    // Empêche un clientId malformé qui pourrait construire une URL malicieuse
    if (typeof clientId !== 'string' || !/^[a-z0-9_-]+$/i.test(clientId)) {
      return Response.json({ error: 'clientId invalide' }, { status: 400 })
    }

    // Map firm to correct API URL
    const API_URLS = {
      'topstepx':  'https://api.topstepx.com/api',
      'tradeify':  'https://api.tradeify.com/api',
      'tpt':       'https://api.takeprofittrader.com/api',
      'mff':       'https://api.myfuturesfunding.com/api',
      'tradeday':  'https://api.tradeday.co/api',
      'uprofit':   'https://api.uprofit.com/api',
    }

    const baseUrl = API_URLS[clientId] || `https://api.${clientId}.com/api`

    // Auth with API key (official ProjectX method)
    const authRes = await fetch(`${baseUrl}/Auth/loginKey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'text/plain' },
      body: JSON.stringify({ userName, apiKey })
    })

    const authData = await authRes.json()
    if (!authData.success || !authData.token) {
      // ⚠ pas de log de userName/apiKey ici — uniquement clientId et HTTP status pour debug
      console.warn('[px-login] auth failed', { clientId, httpStatus: authRes.status })
      return Response.json({ error: authData.errorMessage || 'Identifiants incorrects — vérifiez votre clé API' }, { status: 401 })
    }

    const token = authData.token
    const headers = { 'Authorization': `Bearer ${token}`, 'accept': 'text/plain' }

    // Fetch accounts
    const acctRes = await fetch(`${baseUrl}/Account/search`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ onlyActiveAccounts: true })
    })
    const acctData = await acctRes.json()
    const accounts = acctData.accounts || []

    // Fetch trades & positions for first account
    let trades = [], positions = []
    if (accounts[0]?.id) {
      const acctId = accounts[0].id
      const now = new Date()
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

      const [posRes, trdRes] = await Promise.all([
        fetch(`${baseUrl}/Position/searchOpen`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: acctId })
        }),
        fetch(`${baseUrl}/Trade/search`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: acctId,
            startTimestamp: thirtyDaysAgo.toISOString(),
            endTimestamp: now.toISOString()
          })
        })
      ])

      const posData = await posRes.json()
      const trdData = await trdRes.json()
      positions = posData.positions || []
      trades = trdData.trades || []
    }

    return Response.json({ token, accounts, trades, positions })
  } catch (err) {
    // ⚠ ne pas inclure le body original (peut contenir l'apiKey) dans le log
    console.error('[px-login] error:', err.message)
    return Response.json({ error: 'Erreur serveur lors de la connexion broker' }, { status: 500 })
  }
}
