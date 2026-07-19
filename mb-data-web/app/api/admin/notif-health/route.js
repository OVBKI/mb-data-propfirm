// Notification diagnostics (admin only).
//   GET  /api/admin/notif-health           → which notif env vars are present (booleans,
//                                             never the values) + push-subscription counts.
//   POST /api/admin/notif-health {type}     → send a live test to the admin:
//        type 'email' → Resend email to auth.user.email
//        type 'push'  → web-push to the admin's own push_subscriptions
// Turns "notifications don't work, why?" into a one-click, self-serve diagnosis.

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import webpush from 'web-push'
import { verifyAdmin } from '../../../../lib/apiAuth'

export const dynamic = 'force-dynamic'

const FROM = 'Quantara <noreply@quantara.tech>'

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// Presence only — never leak secret values to the client.
function envStatus() {
  return {
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: !!process.env.VAPID_SUBJECT,
    CRON_SECRET: !!process.env.CRON_SECRET,
  }
}

export async function GET(req) {
  const auth = await verifyAdmin(req)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const supabase = svc()
  let total = 0
  let mine = 0
  try {
    const { count } = await supabase.from('push_subscriptions').select('id', { count: 'exact', head: true })
    total = count || 0
    const { count: myCount } = await supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', auth.user.id)
    mine = myCount || 0
  } catch { /* table missing/empty */ }

  // Cron heartbeat — is the daily dispatcher actually running? (null = never, or
  // the cron_heartbeat table hasn't been created yet.)
  let lastDailyRun = null
  try {
    const { data } = await supabase.from('cron_heartbeat').select('last_run_at').eq('job', 'daily').maybeSingle()
    lastDailyRun = data?.last_run_at || null
  } catch { /* table optional */ }

  return Response.json({ ok: true, env: envStatus(), push: { total, mine }, cron: { lastDailyRun }, adminEmail: auth.user.email })
}

export async function POST(req) {
  const auth = await verifyAdmin(req)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  let body
  try { body = await req.json() } catch { body = {} }
  const type = body?.type

  // ── Test email via Resend ──
  if (type === 'email') {
    if (!process.env.RESEND_API_KEY) {
      return Response.json({ ok: false, error: 'RESEND_API_KEY absente de l’environnement (Vercel).' })
    }
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { data, error } = await resend.emails.send({
        from: FROM,
        to: auth.user.email,
        subject: 'Test notifications Quantara ✓',
        html: '<p>Email de test envoyé depuis <b>/admin/system</b>. Si tu le reçois, Resend + le domaine <code>quantara.tech</code> sont OK.</p>',
      })
      if (error) {
        return Response.json({
          ok: false,
          error: error.message || String(error),
          hint: 'Erreur Resend fréquente = domaine quantara.tech non vérifié (ajoute les enregistrements DKIM/SPF dans Cloudflare).',
        })
      }
      return Response.json({ ok: true, id: data?.id, to: auth.user.email })
    } catch (e) {
      return Response.json({ ok: false, error: String(e?.message || e) })
    }
  }

  // ── Test push via web-push ──
  if (type === 'push') {
    const missing = ['NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'].filter(k => !process.env[k])
    if (missing.length) {
      return Response.json({ ok: false, error: 'Clés VAPID absentes (Vercel) : ' + missing.join(', ') })
    }
    const supabase = svc()
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', auth.user.id)
    if (error) return Response.json({ ok: false, error: error.message })
    if (!subs?.length) {
      return Response.json({ ok: false, error: 'Aucun abonnement push sur ton compte. Active d’abord le toggle sur /app/alerts (même navigateur).' })
    }

    webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
    const payload = JSON.stringify({
      title: 'Test Quantara 🔔',
      body: 'Push de test — si tu vois ça, les notifications marchent.',
      url: '/app/alerts',
      tag: 'notif-test',
    })
    let sent = 0
    let failed = 0
    let lastErr = null
    for (const s of subs) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        sent++
      } catch (e) {
        failed++
        lastErr = e.message
        if (e.statusCode === 404 || e.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      }
    }
    return Response.json({ ok: sent > 0, sent, failed, error: sent === 0 ? (lastErr || 'Échec inconnu') : undefined })
  }

  return Response.json({ error: 'type must be "email" or "push"' }, { status: 400 })
}
