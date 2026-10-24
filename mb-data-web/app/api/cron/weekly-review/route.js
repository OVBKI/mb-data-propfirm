// GET /api/cron/weekly-review — appelé chaque jour par /api/cron/daily.
//
// Pour chaque utilisateur qui a activé la revue IA : génère la revue de la
// semaine COMPLÈTE précédente si elle manque (ou si seule une revue partielle,
// faite à la demande en cours de semaine, existe), puis l'envoie par e-mail
// (sauf désinscription). Un passage quotidien rattrape ce qu'un passage
// précédent n'a pas eu le temps de faire : chaque génération prend plusieurs
// secondes et la fonction est limitée à 60 s.
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { lastWeek } from '../../../../lib/aiReview'
import { aiReviewConfigured, generateWeeklyReview } from '../../../../lib/aiReviewServer'
import { unsubscribeHeaders, unsubscribePageUrl } from '../../../../lib/emailUnsubscribe'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Le dispatcher quotidien attend cette route : rester bien sous ses 60 s.
const BUDGET_MS = 35_000

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!aiReviewConfigured()) return Response.json({ skipped: 'not_configured' })

  const t0 = Date.now()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { start, end } = lastWeek()

  const { data: optedIn, error } = await supabase.from('profiles').select('user_id, email_optout').eq('ai_review_optin', true)
  if (error) return Response.json({ error: 'DB error', detail: error.message }, { status: 500 })
  if (!optedIn?.length) return Response.json({ generated: 0, emailed: 0, week: start })

  const ids = optedIn.map((p) => p.user_id)
  const { data: done } = await supabase.from('ai_reviews').select('user_id, period_end').eq('week_start', start).in('user_id', ids)
  const complete = new Set((done || []).filter((r) => r.period_end >= end).map((r) => r.user_id))

  let generated = 0
  let skipped = 0
  const failures = []
  for (const userId of ids) {
    if (complete.has(userId)) continue
    if (Date.now() - t0 > BUDGET_MS) break
    try {
      const r = await generateWeeklyReview(supabase, userId, { start, end })
      if (r.skipped) skipped++
      else generated++
    } catch (e) {
      failures.push({ status: e?.status || null })
    }
  }

  // E-mails : revues complètes de la semaine pas encore envoyées.
  let emailed = 0
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  const noMail = new Set(optedIn.filter((p) => p.email_optout).map((p) => p.user_id))
  if (resend) {
    const { data: toSend } = await supabase.from('ai_reviews')
      .select('id, user_id, content, trades_count, pnl')
      .eq('week_start', start).gte('period_end', end).is('emailed_at', null).in('user_id', ids)
    for (const r of toSend || []) {
      if (Date.now() - t0 > BUDGET_MS + 10_000) break
      if (noMail.has(r.user_id)) continue
      const { data: u } = await supabase.auth.admin.getUserById(r.user_id)
      const email = u?.user?.email
      if (!email) continue
      const subject = `Ta revue de la semaine du ${start}`
      const text = [
        r.content, '',
        'Revue rédigée par IA à partir de ton journal Quantara : vérifie les chiffres avant d’agir. Ce n’est pas un conseil en investissement.',
        'Voir dans Quantara : https://quantara.tech/app/dashboard',
        '', `Ne plus recevoir ces e-mails : ${unsubscribePageUrl(r.user_id)}`,
      ].join('\n')
      const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;color:#16181d;line-height:1.6">
<h2 style="font-size:18px;margin:0 0 14px">Ta revue de la semaine du ${escapeHtml(start)}</h2>
<div style="white-space:pre-wrap;font-size:14px">${escapeHtml(r.content)}</div>
<p style="color:#5b616e;font-size:12px;margin-top:18px">Revue rédigée par IA à partir de ton journal Quantara : vérifie les chiffres avant d’agir. Ce n’est pas un conseil en investissement.</p>
<p><a href="https://quantara.tech/app/dashboard">Voir dans Quantara</a></p>
<p style="color:#8a909c;font-size:12px"><a href="${unsubscribePageUrl(r.user_id)}" style="color:#8a909c">Ne plus recevoir ces e-mails</a></p>
</div>`
      try {
        await resend.emails.send({ from: 'Quantara <noreply@quantara.tech>', replyTo: 'admin@quantara.tech', to: email, subject, html, text, headers: unsubscribeHeaders(r.user_id) })
        await supabase.from('ai_reviews').update({ emailed_at: new Date().toISOString() }).eq('id', r.id)
        emailed++
      } catch (e) {
        failures.push({ email: true, error: e.message })
      }
    }
  }

  return Response.json({ week: start, generated, skipped, emailed, pending: ids.length - complete.size - generated - skipped, failures: failures.length })
}
