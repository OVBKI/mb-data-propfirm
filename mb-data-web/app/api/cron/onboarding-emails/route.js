import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const SCHEDULE = [
  { day: 0, subject: 'Bienvenue sur Quantara — 3 étapes pour démarrer', step: 0 },
  { day: 3, subject: 'As-tu logué ton premier trade ?', step: 1 },
  { day: 7, subject: 'Astuce : surveille ton trailing drawdown avant chaque session', step: 2 },
]

function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function emailBody(step, name) {
  const n = escapeHtml(name) || 'Trader'
  const bodies = [
    `<h2 style="color:#f0ede8;font-size:20px;font-weight:700;margin:0 0 16px;">Bienvenue ${n} !</h2>
    <p style="color:#9098b0;font-size:14px;line-height:1.7;">Tu as rejoint Quantara. 3 étapes pour démarrer :</p>
    <p style="color:#9098b0;font-size:13px;line-height:1.8;">
      <strong style="color:#f0ede8;">1.</strong> Ajoute ta PropFirm (Topstep, Apex, MFFU...)<br>
      <strong style="color:#f0ede8;">2.</strong> Crée ton premier compte (plan + statut)<br>
      <strong style="color:#f0ede8;">3.</strong> Logue ton premier trade
    </p>`,
    `<h2 style="color:#f0ede8;font-size:20px;font-weight:700;margin:0 0 16px;">Hey ${n},</h2>
    <p style="color:#9098b0;font-size:14px;line-height:1.7;">3 jours déjà ! As-tu logué ton premier trade ? Un seul suffit pour que le dashboard prenne vie : equity curve, consistency score, heatmap trading.</p>`,
    `<h2 style="color:#f0ede8;font-size:20px;font-weight:700;margin:0 0 16px;">Pro tip pour ${n}</h2>
    <p style="color:#9098b0;font-size:14px;line-height:1.7;">Avant chaque session : vérifie ton drawdown sur Quantara. En dessous de 80% ? Réduis ta taille. En dessous de 70% ? Ne trade pas ce compte. La majorité des comptes sont perdus à cause d'un jour de tilt.</p>`,
  ]

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f14;"><tr><td align="center" style="padding:40px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#141720;border-radius:14px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
<tr><td style="padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.07);"><div style="font-weight:800;font-size:14px;letter-spacing:0.08em;color:#f0ede8;">QUANTARA</div></td></tr>
<tr><td style="padding:28px 32px;">${bodies[step]}<br><a href="https://quantara.tech/app" style="display:inline-block;padding:12px 28px;background:#2d6fff;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:12px;">Ouvrir mon dashboard →</a></td></tr>
<tr><td style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.07);background:#0d0f14;">
<p style="font-size:11px;color:#7b839b;margin:0;line-height:1.5;">Quantara Technologies LLC · Albuquerque, NM, USA<br><a href="https://quantara.tech/app/settings" style="color:#7b839b;">Gérer mes emails</a></p>
</td></tr></table></td></tr></table></body></html>`
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  if (!resend) return Response.json({ error: 'Resend not configured' }, { status: 503 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (!users?.length) return Response.json({ sent: 0 })

  const now = new Date()
  let sent = 0

  for (const user of users) {
    const createdAt = new Date(user.created_at)
    const daysSinceSignup = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))

    for (const schedule of SCHEDULE) {
      if (daysSinceSignup !== schedule.day) continue

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, onboarding_emails_sent')
        .eq('user_id', user.id)
        .single()

      const alreadySent = profile?.onboarding_emails_sent || 0
      if (alreadySent > schedule.step) continue

      try {
        await resend.emails.send({
          from: 'Quantara <noreply@quantara.tech>',
          to: user.email,
          subject: schedule.subject,
          html: emailBody(schedule.step, profile?.username),
        })

        await supabase
          .from('profiles')
          .update({ onboarding_emails_sent: schedule.step + 1 })
          .eq('user_id', user.id)

        sent++
      } catch (e) {
        console.error(`Onboarding email failed for ${user.email}:`, e.message)
      }
    }
  }

  return Response.json({ sent, total: users.length })
}
