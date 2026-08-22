// app/api/tradovate/oauth/callback/route.js — le retour de Tradovate.
//
// C'est une REDIRECTION du navigateur : pas d'en-tête Authorization, pas de
// session applicative. L'identité vient de l'état signé qu'on a émis au départ.
// Sans cette vérification, n'importe qui pourrait faire rattacher SON compte
// Tradovate à la session d'un autre.

import { createClient } from '@supabase/supabase-js'
import { verifyState, encryptSecret } from '../../../../../lib/cryptoBox'
import { exchangeCode } from '../../../../../lib/tradovateClient'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

// L'utilisateur revient dans son navigateur : on le renvoie sur l'écran de
// synchronisation avec un message, plutôt que de lui afficher du JSON.
function back(request, params) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const url = new URL('/app/journal-sync/tradovate', base)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return Response.redirect(url.toString(), 303)
}

export async function GET(request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = verifyState(url.searchParams.get('state'))

  // Un état invalide ou périmé : on n'écrit rien et on ne dit pas pourquoi en
  // détail — c'est soit une tentative, soit un onglet laissé ouvert trop longtemps.
  if (!state?.uid) return back(request, { error: 'expired' })
  if (!code) return back(request, { error: 'denied' })

  const session = await exchangeCode({ code, environment: state.env })
  if (!session.ok) return back(request, { error: session.kind || 'failed' })

  const { error } = await admin().from('tradovate_credentials').upsert({
    user_id: state.uid,
    label: state.label || 'Tradovate',
    encrypted_token: encryptSecret(session.token),
    token_expires_at: session.expiresAt ? new Date(session.expiresAt).toISOString() : null,
    environment: state.env === 'live' ? 'live' : 'demo',
    last_error: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,label' })

  if (error) return back(request, { error: 'save' })
  return back(request, { connected: state.label || 'Tradovate' })
}
