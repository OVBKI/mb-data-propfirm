import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { planSizeNum, maxDrawdown } from '../../../../lib/constants'

const THRESHOLD = 0.70

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@quantara.tech',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('id, firm_id, plan_size, status, balance, dd_floor, dd_type, user_id:firms(user_id, name)')
    .in('status', ['Challenge', 'Financé', 'Funded'])

  if (accountsError) return Response.json({ error: 'DB error', detail: accountsError.message }, { status: 500 })
  if (!accounts?.length) return Response.json({ sent: 0, checked: 0 })

  const alerts = []

  for (const acct of accounts) {
    if (!acct.balance || !acct.dd_floor) continue
    const firmName = acct.user_id?.name
    // % du BUFFER de drawdown restant : room / drawdown max autorisé (pas la balance courante).
    const room = acct.balance - acct.dd_floor
    const maxDD = maxDrawdown(firmName, acct.plan_size) || 0
    const startBal = planSizeNum(acct.plan_size) || 0
    const denom = maxDD > 0 ? maxDD : startBal
    const roomPct = denom > 0 ? room / denom : 1

    if (roomPct <= THRESHOLD && roomPct > 0) {
      alerts.push({
        userId: acct.user_id?.user_id,
        firmName: acct.user_id?.name,
        plan: acct.plan_size,
        roomPct: (roomPct * 100).toFixed(1),
        room: room.toFixed(0),
      })
    }
  }

  if (!alerts.length) return Response.json({ sent: 0, checked: accounts.length })

  const userIds = [...new Set(alerts.map(a => a.userId).filter(Boolean))]
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  let sent = 0
  const failures = []

  for (const userId of userIds) {
    const userSubs = (subs || []).filter(s => s.user_id === userId)
    if (!userSubs.length) continue

    const userAlerts = alerts.filter(a => a.userId === userId)
    const title = userAlerts.length === 1
      ? `⚠️ Drawdown alert: ${userAlerts[0].firmName} ${userAlerts[0].plan}`
      : `⚠️ Drawdown alert: ${userAlerts.length} accounts at risk`

    const body = userAlerts
      .map(a => `${a.firmName} ${a.plan}: ${a.roomPct}% left ($${a.room})`)
      .join('\n')

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon.webp',
      badge: '/icon.webp',
      tag: 'drawdown-guardian',
      url: '/app/dashboard',
      requireInteraction: true,
    })

    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
        failures.push({ endpoint: sub.endpoint.slice(0, 40), error: err.statusCode || err.message })
      }
    }
  }

  return Response.json({ sent, checked: accounts.length, alerts: alerts.length, failures: failures.length })
}
