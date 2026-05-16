// GET /api/cron/check-bills — déclenché chaque jour par Vercel Cron (9h UTC).
// Scanne tous les comptes Challenge en mode monthly, calcule les échéances à J+2,
// et envoie un push aux users concernés via web-push.
//
// Sécurité : header Authorization: Bearer ${CRON_SECRET}

import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

// Config VAPID (depuis env vars)
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@quantara.tech',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function GET(req) {
  // Auth via CRON_SECRET — Vercel Cron envoie ce header automatiquement
  const authHeader = req.headers.get('authorization') || ''
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Récupère tous les comptes Challenge en mode monthly
  const { data: accounts, error: accErr } = await supabase
    .from('accounts')
    .select('id, user_id, name, buy_date, months_count, spent, currency, firm_id')
    .eq('status', 'Challenge')
    .eq('payment_mode', 'monthly')
  if (accErr) return Response.json({ error: accErr.message }, { status: 500 })

  // Récupère noms des firmes (pour personnaliser le message)
  const firmIds = [...new Set((accounts || []).map(a => a.firm_id))]
  const { data: firms } = await supabase.from('firms').select('id, name').in('id', firmIds)
  const firmMap = Object.fromEntries((firms || []).map(f => [f.id, f.name]))

  // Filtre : ne garde que ceux dont prochain prélèvement = dans 2 jours
  // ⚠ Important : on compare en JOURS uniquement (pas en heures) pour éviter les
  // décalages dus à l'heure d'exécution du cron. On normalize aujourd'hui à 00h00 UTC.
  const todayMidnight = new Date()
  todayMidnight.setUTCHours(0, 0, 0, 0)
  const targets = []
  for (const a of (accounts || [])) {
    const buyDate = new Date(a.buy_date + 'T00:00:00Z')
    const nextBilling = new Date(buyDate)
    nextBilling.setUTCDate(buyDate.getUTCDate() + (a.months_count || 1) * 30)
    nextBilling.setUTCHours(0, 0, 0, 0) // also normalize to midnight
    const daysUntilBilling = Math.round((nextBilling - todayMidnight) / 86400000)
    if (daysUntilBilling === 2) {
      targets.push({
        userId: a.user_id,
        firmName: firmMap[a.firm_id] || 'PropFirm',
        acctName: a.name || `Compte du ${a.buy_date}`,
        cost: a.spent,
        currency: a.currency,
        date: nextBilling.toISOString().slice(0, 10),
      })
    }
  }

  if (targets.length === 0) {
    return Response.json({ ok: true, checked: accounts?.length || 0, sent: 0, message: 'Aucun prélèvement à J+2' })
  }

  // Récupère les subscriptions push de ces users
  const userIds = [...new Set(targets.map(t => t.userId))]
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  const subsByUser = {}
  ;(subs || []).forEach(s => {
    if (!subsByUser[s.user_id]) subsByUser[s.user_id] = []
    subsByUser[s.user_id].push(s)
  })

  // Group targets par user pour envoyer 1 notif par user (au lieu de N)
  const targetsByUser = {}
  targets.forEach(t => {
    if (!targetsByUser[t.userId]) targetsByUser[t.userId] = []
    targetsByUser[t.userId].push(t)
  })

  let sent = 0
  const failures = []

  for (const [userId, userTargets] of Object.entries(targetsByUser)) {
    const userSubs = subsByUser[userId] || []
    if (userSubs.length === 0) continue

    const sym = userTargets[0].currency === 'EUR' ? '€' : userTargets[0].currency === 'GBP' ? '£' : '$'
    const total = userTargets.reduce((s, t) => s + (Number(t.cost) || 0), 0)
    const payload = JSON.stringify({
      title: userTargets.length === 1
        ? `📅 Paiement mensuel imminent`
        : `📅 ${userTargets.length} prélèvements imminents`,
      body: userTargets.length === 1
        ? `${userTargets[0].firmName} · ${userTargets[0].acctName} — ${userTargets[0].cost} ${sym} dans 2 jours`
        : `Total ${total} ${sym} dans 2 jours sur ${userTargets.length} comptes`,
      url: '/app/alerts',
      tag: 'bill-reminder',
      requireInteraction: true,
    })

    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
        sent++
      } catch (err) {
        failures.push({ userId, endpoint: sub.endpoint, error: err.message, statusCode: err.statusCode })
        // Subscription expirée ou désinscrite → supprime de la DB
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }
  }

  return Response.json({
    ok: true,
    checked: accounts?.length || 0,
    targets: targets.length,
    sent,
    failures: failures.length,
    details: failures.length > 0 ? failures : undefined,
  })
}
