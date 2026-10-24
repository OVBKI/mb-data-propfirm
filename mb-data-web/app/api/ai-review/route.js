// /api/ai-review — revue de la semaine en cours, générée à la demande.
//   GET  → { configured } : le widget sait s'il peut proposer la génération.
//   POST → génère (ou rend, si elle date de moins de 30 minutes) la revue de la
//          semaine en cours, du lundi à aujourd'hui. Exige l'opt-in.
import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit'
import { weekOf } from '../../../lib/aiReview'
import { aiReviewConfigured, generateWeeklyReview, aiErrorMessage } from '../../../lib/aiReviewServer'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FRESH_MS = 30 * 60 * 1000

export async function GET(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })
  return Response.json({ configured: aiReviewConfigured() })
}

export async function POST(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })
  if (!aiReviewConfigured()) return Response.json({ error: 'La revue IA n’est pas encore disponible.' }, { status: 503 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const userId = auth.user.id

  const { data: profile } = await supabase.from('profiles').select('ai_review_optin').eq('user_id', userId).maybeSingle()
  if (!profile?.ai_review_optin) return Response.json({ error: 'Active d’abord la revue IA.' }, { status: 403 })

  const today = new Date().toISOString().slice(0, 10)
  const { start } = weekOf(new Date())
  const { data: existing } = await supabase.from('ai_reviews').select('*').eq('user_id', userId).eq('week_start', start).maybeSingle()
  if (existing && existing.period_end === today && Date.now() - new Date(existing.created_at).getTime() < FRESH_MS) {
    return Response.json({ review: existing, cached: true })
  }

  // Chaque génération coûte un appel au modèle : 4 par heure et par utilisateur.
  const limit = rateLimit({ key: `ai-review:${userId}`, windowMs: 3_600_000, max: 4 })
  if (!limit.allowed) return rateLimitResponse(limit, 'Tu as généré plusieurs revues coup sur coup. Réessaie dans une heure.')

  try {
    const r = await generateWeeklyReview(supabase, userId, { start, end: today })
    if (r.skipped) return Response.json({ error: 'Aucun trade cette semaine : rien à analyser pour l’instant.' }, { status: 422 })
    return Response.json({ review: r.review })
  } catch (e) {
    console.error('[ai-review]', e?.status || '', e?.message)
    return Response.json({ error: aiErrorMessage(e) }, { status: 502 })
  }
}
