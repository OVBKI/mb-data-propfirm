import { Resend } from 'resend'
import { verifyAuth } from '../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const EMAILS = [
  {
    delay: 0,
    subject: 'Bienvenue sur Quantara — 3 étapes pour démarrer',
    subjectEn: 'Welcome to Quantara — 3 steps to get started',
  },
  {
    delay: 3,
    subject: 'As-tu logué ton premier trade ?',
    subjectEn: 'Have you logged your first trade?',
  },
  {
    delay: 7,
    subject: 'Astuce : surveille ton trailing drawdown avant chaque session',
    subjectEn: 'Tip: check your trailing drawdown before each session',
  },
]

function emailTemplate(step, username) {
  const name = username || 'Trader'
  const bodies = [
    // Email 1 — Welcome
    `<h2 style="color:#f0ede8;font-size:20px;font-weight:700;margin:0 0 16px;">Bienvenue ${name} !</h2>
    <p style="color:#9098b0;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Tu as rejoint la beta de Quantara. Voici 3 étapes pour tirer le max du dashboard :
    </p>
    <div style="margin:0 0 20px;">
      <div style="display:flex;gap:12px;margin-bottom:14px;align-items:flex-start;">
        <span style="background:#2d6fff;color:#fff;border-radius:50%;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">1</span>
        <div><strong style="color:#f0ede8;">Ajoute ta première PropFirm</strong><br><span style="color:#9098b0;font-size:13px;">Topstep, Apex, MFFU... les règles sont pré-remplies.</span></div>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:14px;align-items:flex-start;">
        <span style="background:#1db87a;color:#fff;border-radius:50%;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">2</span>
        <div><strong style="color:#f0ede8;">Crée ton premier compte</strong><br><span style="color:#9098b0;font-size:13px;">Choisis le plan et le statut (Challenge ou Funded).</span></div>
      </div>
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <span style="background:#fac775;color:#0d0f14;border-radius:50%;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">3</span>
        <div><strong style="color:#f0ede8;">Logue ton premier trade</strong><br><span style="color:#9098b0;font-size:13px;">Le journal commence à calculer ton equity curve et ta consistency.</span></div>
      </div>
    </div>`,

    // Email 2 — Day 3
    `<h2 style="color:#f0ede8;font-size:20px;font-weight:700;margin:0 0 16px;">Hey ${name},</h2>
    <p style="color:#9098b0;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Ça fait 3 jours que tu as rejoint Quantara. As-tu déjà logué ton premier trade ?
    </p>
    <p style="color:#9098b0;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Si ce n'est pas encore fait, voici pourquoi ça vaut le coup :
    </p>
    <ul style="color:#9098b0;font-size:13px;line-height:1.8;padding-left:20px;margin:0 0 20px;">
      <li><strong style="color:#f0ede8;">Equity curve automatique</strong> — vois ta progression jour après jour</li>
      <li><strong style="color:#f0ede8;">Consistency score en temps réel</strong> — sache si tu passes les critères avant de demander un payout</li>
      <li><strong style="color:#f0ede8;">Heatmap trading</strong> — identifie tes meilleurs jours/heures/sessions</li>
    </ul>
    <p style="color:#9098b0;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Un seul trade suffit pour que le dashboard prenne vie.
    </p>`,

    // Email 3 — Day 7
    `<h2 style="color:#f0ede8;font-size:20px;font-weight:700;margin:0 0 16px;">Pro tip : le drawdown avant tout</h2>
    <p style="color:#9098b0;font-size:14px;line-height:1.7;margin:0 0 20px;">
      ${name}, voici l'habitude qui sépare les traders qui gardent leurs comptes funded de ceux qui les perdent :
    </p>
    <div style="background:rgba(250,199,117,0.08);border:1px solid rgba(250,199,117,0.25);border-radius:10px;padding:16px 20px;margin:0 0 20px;">
      <p style="color:#fac775;font-size:14px;font-weight:600;margin:0 0 8px;">Avant chaque session de trading :</p>
      <ol style="color:#9098b0;font-size:13px;line-height:1.8;padding-left:20px;margin:0;">
        <li>Ouvre ton dashboard Quantara</li>
        <li>Vérifie le % de drawdown restant sur chaque compte</li>
        <li>Si tu es en dessous de 80%, réduis ta taille de position</li>
        <li>Si tu es en dessous de 70%, ne trade pas ce compte aujourd'hui</li>
      </ol>
    </div>
    <p style="color:#9098b0;font-size:14px;line-height:1.7;margin:0 0 20px;">
      La majorité des comptes sont perdus à cause d'un jour de tilt. Le dashboard est là pour te protéger de toi-même.
    </p>`,
  ]

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f14;"><tr><td align="center" style="padding:40px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#141720;border-radius:14px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
      <!-- Header -->
      <tr><td style="padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.07);">
        <div style="font-weight:800;font-size:14px;letter-spacing:0.08em;color:#f0ede8;">QUANTARA</div>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:28px 32px;">
        ${bodies[step]}
        <a href="https://quantara.tech/app" style="display:inline-block;padding:12px 28px;background:#2d6fff;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">
          Ouvrir mon dashboard →
        </a>
      </td></tr>
      <!-- Footer -->
      <tr><td style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.07);background:#0d0f14;">
        <p style="font-size:11px;color:#7b839b;margin:0 0 8px;line-height:1.5;">
          Quantara Technologies LLC · Albuquerque, NM, USA<br>
          <a href="https://quantara.tech/legal/privacy" style="color:#7b839b;text-decoration:underline;">Privacy</a> · <a href="mailto:contact@quantara.tech" style="color:#7b839b;text-decoration:underline;">Contact</a>
        </p>
        <p style="font-size:10px;color:#7b839b;margin:0;">
          Tu reçois cet email parce que tu as créé un compte sur Quantara.<br>
          <a href="https://quantara.tech/app/settings" style="color:#7b839b;">Gérer mes préférences email</a>
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

export async function POST(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  // Rate limit: 5 req/min per user
  const limit = rateLimit({ key: `onboarding:${auth.user.id}`, windowMs: 60_000, max: 5 })
  if (!limit.allowed) return rateLimitResponse(limit)

  if (!resend) return Response.json({ error: 'Email service not configured' }, { status: 503 })

  let body
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { step = 0 } = body
  if (step < 0 || step > 2) return Response.json({ error: 'Invalid step' }, { status: 400 })

  const config = EMAILS[step]

  try {
    await resend.emails.send({
      from: 'Quantara <noreply@quantara.tech>',
      to: auth.user.email,
      subject: config.subject,
      html: emailTemplate(step, escapeHtml(auth.user.user_metadata?.username)),
    })
    return Response.json({ ok: true, step })
  } catch (e) {
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
