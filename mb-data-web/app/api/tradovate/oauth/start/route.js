// app/api/tradovate/oauth/start/route.js — lancer l'autorisation Tradovate.
//
// Rend l'URL vers laquelle envoyer l'utilisateur. On ne redirige pas nous-mêmes :
// le client a besoin de la recevoir pour l'ouvrir dans une fenêtre, et une
// redirection depuis un fetch authentifié perdrait l'en-tête Authorization.

import { verifyAuth } from '../../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit'
import { signState } from '../../../../../lib/cryptoBox'
import { authorizeUrl } from '../../../../../lib/tradovate'
import { tradovateConfigured, oauthConfig, missingConfigMessage } from '../../../../../lib/tradovateClient'

export async function GET(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const limit = rateLimit({ key: `tradovate-oauth:${auth.user.id}`, windowMs: 60_000, max: 10 })
  if (!limit.allowed) return rateLimitResponse(limit)

  if (!tradovateConfigured()) {
    return Response.json({ error: missingConfigMessage() }, { status: 503 })
  }

  const url = new URL(request.url)
  const label = String(url.searchParams.get('label') || '').trim() || 'Tradovate'
  // Demo par défaut : c'est là que vivent les comptes PropFirm.
  const environment = url.searchParams.get('environment') === 'live' ? 'live' : 'demo'

  const { clientId, redirectUri } = oauthConfig()
  // L'état porte QUI autorise et POUR QUEL environnement — le retour d'OAuth
  // est une redirection nue, sans en-tête d'authentification.
  const state = signState({ uid: auth.user.id, label, env: environment })

  return Response.json({ url: authorizeUrl({ clientId, redirectUri, state }) })
}
