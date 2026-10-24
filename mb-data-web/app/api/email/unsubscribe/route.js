// POST /api/email/unsubscribe?u=<user_id>&t=<jeton> — désinscription des e-mails
// non essentiels (récap mensuel, séquence d'accueil). Pas de session requise :
// la preuve, c'est le jeton signé (lib/emailUnsubscribe.js).
//
// Deux appelants :
//   1. le client mail, en un clic (RFC 8058) : corps « List-Unsubscribe=One-Click »,
//      paramètres dans l'URL ;
//   2. la page /email/unsubscribe, après que la personne a cliqué « Confirmer ».
//
// GET ne fait rien exprès : les antivirus de messagerie pré-ouvrent les liens.
import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from '../../../../lib/emailUnsubscribe'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  const limit = await rateLimit({ key: `unsubscribe:${ip}`, windowMs: 60_000, max: 20 })
  if (!limit.allowed) return rateLimitResponse(limit)

  const sp = new URL(req.url).searchParams
  let u = sp.get('u'), t = sp.get('t')
  if (!u || !t) {
    try { const body = await req.json(); u = body?.u; t = body?.t } catch { /* corps one-click, pas du JSON */ }
  }
  if (!u || !t || !verifyUnsubscribeToken(u, t)) {
    return Response.json({ error: 'Lien de désinscription invalide ou expiré.' }, { status: 400 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  // upsert : un utilisateur peut ne pas avoir encore de ligne profiles.
  const { error } = await supabase.from('profiles').upsert({ user_id: u, email_optout: true }, { onConflict: 'user_id' })
  if (error) return Response.json({ error: 'Enregistrement impossible, réessaie plus tard.' }, { status: 500 })
  return Response.json({ ok: true })
}

export function GET() {
  return Response.json({ error: 'Utilise le lien de l’e-mail pour te désabonner.' }, { status: 405 })
}
