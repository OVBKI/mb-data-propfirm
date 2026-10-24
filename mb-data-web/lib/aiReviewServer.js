// lib/aiReviewServer.js — génération d'une revue hebdomadaire (côté serveur).
//
// Lit les comptes et les trades d'un utilisateur avec un client Supabase
// service role, construit le résumé (lib/aiReview), appelle l'API Claude et
// enregistre la revue dans ai_reviews. Utilisé par le cron weekly-review et par
// la génération à la demande (/api/ai-review).
//
// Configuration : ANTHROPIC_API_KEY et AI_REVIEW_MODEL (identifiant du modèle
// Claude). Sans l'une des deux, la fonctionnalité se déclare non configurée.
import Anthropic from '@anthropic-ai/sdk'
import { buildWeekDigest, REVIEW_SYSTEM_PROMPT, reviewUserMessage } from './aiReview'
import { fetchTradePnl } from './drawdownHealth'

export function aiReviewConfigured() {
  return !!(process.env.ANTHROPIC_API_KEY && process.env.AI_REVIEW_MODEL)
}

let client = null
function anthropic() {
  if (!client) client = new Anthropic() // lit ANTHROPIC_API_KEY
  return client
}

// → { review } | { skipped: 'no_trades' } ; lève une erreur sinon.
export async function generateWeeklyReview(supabase, userId, { start, end }) {
  const { data: accts, error: aErr } = await supabase
    .from('accounts')
    .select('id, name, buy_date, plan_size, program, status, dd_type, funded_date, custom_drawdown, payout_target, min_trading_days, min_daily_profit, balance, dd_floor, firm:firms(name)')
    .eq('user_id', userId)
  if (aErr) throw new Error(aErr.message)
  const accounts = (accts || []).map((a) => ({ ...a, firmName: a.firm?.name || '' }))

  const { data: trades, error: tErr } = await supabase
    .from('journal_entries')
    .select('account_id, date, traded_at, pnl, instrument, side, tags, notes, entry_price, exit_price, stop_loss')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date')
    .limit(3000)
  if (tErr) throw new Error(tErr.message)
  if (!trades?.length) return { skipped: 'no_trades' }

  const { data: allTrades, error: hErr } = await fetchTradePnl(supabase, { userId })
  if (hErr) throw new Error(hErr.message)

  const digest = buildWeekDigest({ trades, allTrades, accounts, start, end })

  // Le prompt système est identique pour tous les utilisateurs : marqué pour
  // le cache, il n'est facturé plein tarif qu'une fois par série d'appels
  // (s'il dépasse la taille minimale de mise en cache du modèle).
  const res = await anthropic().messages.create({
    model: process.env.AI_REVIEW_MODEL,
    max_tokens: 2000,
    system: [{ type: 'text', text: REVIEW_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: reviewUserMessage(digest) }],
  })
  const content = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
  if (!content) throw new Error('Réponse vide du modèle')

  const row = {
    user_id: userId,
    week_start: start,
    period_end: end,
    content,
    trades_count: digest.summary.trades,
    pnl: digest.summary.pnl,
    emailed_at: null,
    created_at: new Date().toISOString(),
  }
  const { data: saved, error: sErr } = await supabase
    .from('ai_reviews')
    .upsert(row, { onConflict: 'user_id,week_start' })
    .select()
    .single()
  if (sErr) throw new Error(sErr.message)
  return { review: saved }
}

// Message lisible pour une erreur de l'API Claude (typée par le SDK).
export function aiErrorMessage(err) {
  if (err instanceof Anthropic.RateLimitError) return 'Le service de revue est saturé. Réessaie dans quelques minutes.'
  if (err instanceof Anthropic.AuthenticationError) return 'La revue IA est mal configurée (clé API).'
  if (err instanceof Anthropic.NotFoundError) return 'La revue IA est mal configurée (modèle introuvable).'
  if (err instanceof Anthropic.APIError) return 'Le service de revue ne répond pas. Réessaie plus tard.'
  return 'La revue n’a pas pu être générée.'
}
