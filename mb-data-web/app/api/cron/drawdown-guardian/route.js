// GET /api/cron/drawdown-guardian — appelé en semaine par /api/cron/daily.
//
// Pour chaque compte futures en challenge ou financé : marge de drawdown
// recalculée à partir des trades (lib/drawdownHealth, même calcul que la page
// Santé et que le contrôle après chaque trade), puis un palier : 50 % consommé,
// 80 % consommé, plancher franchi. On prévient par push ET par e-mail, une seule
// fois par palier franchi vers le haut (lib/drawdownAlerts) ; l'état est gardé
// dans drawdown_alert_state.
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { Resend } from 'resend'
import { computeStatsByAccount, drawdownMargin, fetchTradePnl } from '../../../../lib/drawdownHealth'
import { drawdownLevel, alertDecision } from '../../../../lib/drawdownAlerts'
import { accountLabel } from '../../../../lib/constants'
import { unsubscribeHeaders, unsubscribePageUrl } from '../../../../lib/emailUnsubscribe'

export const dynamic = 'force-dynamic'

const LABEL = {
  warn: { push: 'Drawdown à 50 %', mail: 'a consommé plus de la moitié de son drawdown' },
  danger: { push: 'Drawdown à 80 %', mail: 'a consommé plus de 80 % de son drawdown' },
  breach: { push: 'Drawdown franchi', mail: 'est sous son plancher de drawdown d’après ton journal' },
}
const usd = (v) => `$${Math.round(v).toLocaleString('en-US')}`

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pushReady = !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
  if (pushReady) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@quantara.tech',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
  }
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Comptes CFD exclus : les règles de drawdown du catalogue sont futures-only.
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('id, name, buy_date, plan_size, program, status, dd_type, funded_date, custom_drawdown, firm:firms(user_id, name)')
    .in('status', ['Challenge', 'Financé', 'Funded'])
    // Un `neq` seul écarterait aussi les lignes où market est NULL (comptes anciens).
    .or('market.is.null,market.neq.cfd')

  if (accountsError) return Response.json({ error: 'DB error', detail: accountsError.message }, { status: 500 })
  if (!accounts?.length) return Response.json({ sent: 0, checked: 0 })

  const { data: trades, error: tradesError } = await fetchTradePnl(supabase, { accountIds: accounts.map((a) => a.id) })
  if (tradesError) return Response.json({ error: 'DB error (trades)', detail: tradesError.message }, { status: 500 })

  const { data: states, error: stateError } = await supabase.from('drawdown_alert_state').select('account_id, level')
  if (stateError) return Response.json({ error: 'DB error (state)', detail: stateError.message }, { status: 500 })
  const prevLevel = Object.fromEntries((states || []).map((s) => [s.account_id, s.level]))

  const accountsById = Object.fromEntries(accounts.map((a) => [a.id, a]))
  const stats = computeStatsByAccount(trades, accountsById)

  const alerts = []
  const writes = []
  for (const acct of accounts) {
    const firmName = acct.firm?.name
    const m = drawdownMargin(acct, firmName, stats[acct.id])
    const level = drawdownLevel(m)
    const { notify, store } = alertDecision(prevLevel[acct.id], level)
    if (store !== undefined) writes.push({ account_id: acct.id, level: store, updated_at: new Date().toISOString() })
    if (notify && acct.firm?.user_id) {
      alerts.push({
        userId: acct.firm.user_id,
        level,
        name: `${firmName} ${acct.plan_size} · ${accountLabel(acct)}`,
        usedPct: Math.round((1 - m.roomPct) * 100),
        room: m.room,
        floor: m.ddFloor,
      })
    }
  }

  if (writes.length) {
    const { error } = await supabase.from('drawdown_alert_state').upsert(writes, { onConflict: 'account_id' })
    if (error) return Response.json({ error: 'DB error (state write)', detail: error.message }, { status: 500 })
  }
  if (!alerts.length) return Response.json({ sent: 0, emailed: 0, checked: accounts.length })

  const userIds = [...new Set(alerts.map((a) => a.userId))]
  const [{ data: subs }, { data: optedOut }] = await Promise.all([
    supabase.from('push_subscriptions').select('user_id, endpoint, p256dh, auth').in('user_id', userIds),
    supabase.from('profiles').select('user_id').in('user_id', userIds).eq('email_optout', true),
  ])
  const noMail = new Set((optedOut || []).map((p) => p.user_id))

  let sent = 0
  let emailed = 0
  const failures = []

  for (const userId of userIds) {
    const userAlerts = alerts.filter((a) => a.userId === userId)
    const worst = userAlerts.find((a) => a.level === 'breach') || userAlerts.find((a) => a.level === 'danger') || userAlerts[0]
    const title = userAlerts.length === 1
      ? `⚠️ ${LABEL[worst.level].push} : ${worst.name}`
      : `⚠️ ${userAlerts.length} comptes à surveiller`
    const lines = userAlerts.map((a) => a.level === 'breach'
      ? `${a.name} : plancher franchi (${usd(a.floor)})`
      : `${a.name} : ${a.usedPct} % consommé, reste ${usd(a.room)}`)

    // Push
    if (pushReady) {
      const payload = JSON.stringify({
        title,
        body: lines.join('\n'),
        icon: '/icon.webp',
        badge: '/icon.webp',
        tag: 'drawdown-guardian',
        url: '/app/health',
        requireInteraction: true,
      })
      for (const sub of (subs || []).filter((s) => s.user_id === userId)) {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
          sent++
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
          failures.push({ channel: 'push', error: err.statusCode || err.message })
        }
      }
    }

    // E-mail, sauf désinscription
    if (resend && !noMail.has(userId)) {
      const { data: u } = await supabase.auth.admin.getUserById(userId)
      const email = u?.user?.email
      if (!email) continue
      const sentence = (a) => a.level === 'breach'
        ? `Plancher : ${usd(a.floor)}.`
        : `Il reste ${usd(a.room)} avant le plancher (${usd(a.floor)}).`
      const text = [
        'Bonjour,',
        '',
        ...userAlerts.map((a) => `• ${a.name} ${LABEL[a.level].mail}. ${sentence(a)}`),
        '',
        'Calcul fait à partir des trades de ton journal et des règles publiées par la firm : ta plateforme fait foi.',
        'Voir la page Santé : https://quantara.tech/app/health',
        '',
        `Ne plus recevoir ces e-mails : ${unsubscribePageUrl(userId)}`,
      ].join('\n')
      const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;color:#16181d;line-height:1.55">
<p>Bonjour,</p>
<ul style="padding-left:18px">${userAlerts.map((a) => `<li><strong>${escapeHtml(a.name)}</strong> ${LABEL[a.level].mail}. ${sentence(a)}</li>`).join('')}</ul>
<p style="color:#5b616e;font-size:13px">Calcul fait à partir des trades de ton journal et des règles publiées par la firm : ta plateforme fait foi.</p>
<p><a href="https://quantara.tech/app/health">Voir la page Santé</a></p>
<p style="color:#8a909c;font-size:12px"><a href="${unsubscribePageUrl(userId)}" style="color:#8a909c">Ne plus recevoir ces e-mails</a></p>
</div>`
      try {
        await resend.emails.send({
          from: 'Quantara <noreply@quantara.tech>',
          replyTo: 'admin@quantara.tech',
          to: email,
          subject: title.replace('⚠️ ', ''),
          html,
          text,
          headers: unsubscribeHeaders(userId),
        })
        emailed++
      } catch (err) {
        failures.push({ channel: 'email', error: err.message })
      }
    }
  }

  return Response.json({ sent, emailed, checked: accounts.length, alerts: alerts.length, failures: failures.length })
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}
