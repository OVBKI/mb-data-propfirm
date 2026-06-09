// GET /api/cron/monthly-recap — déclenché le 1er de chaque mois (Vercel Cron).
// Pour chaque user actif, calcule le récap du mois précédent et envoie un email via Resend.

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { verifyAdmin } from '../../../../lib/apiAuth'

export async function GET(req) {
  // Modes diagnostic (aucun envoi de masse) :
  //   ?dry=1     → ne renvoie AUCUN email, juste un état + le nombre de destinataires éligibles
  //   ?test=self → envoie UN SEUL email de test à l'admin connecté (vérifie la délivrabilité Resend)
  const sp = new URL(req.url).searchParams
  const dry = sp.get('dry') === '1'
  const test = sp.get('test') === 'self'

  // Auth : CRON_SECRET (cron Vercel) OU — en mode dry/test uniquement — un admin connecté.
  const authHeader = req.headers.get('authorization') || ''
  const cronOk = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
  let adminUser = null
  if ((dry || test) && !cronOk) {
    const a = await verifyAdmin(req)
    if (!a.error) adminUser = a.user
  }
  if (!cronOk && !adminUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY && !dry) {
    return Response.json({ error: 'RESEND_API_KEY manquante' }, { status: 500 })
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  // === Test délivrabilité : un seul email vers l'admin ===
  if (test) {
    const to = adminUser?.email
    if (!to) return Response.json({ ok: false, test: true, error: 'Réservé à un admin connecté' }, { status: 403 })
    if (!resend) return Response.json({ ok: false, test: true, error: 'RESEND_API_KEY manquante' }, { status: 500 })
    try {
      const r = await resend.emails.send({
        from: 'Quantara <noreply@quantara.tech>',
        replyTo: 'admin@quantara.tech',
        to,
        subject: '✅ Test Quantara — délivrabilité Resend',
        html: '<div style="font-family:sans-serif;padding:16px"><h2>Test de délivrabilité</h2><p>Si tu lis ceci, l\'envoi Resend fonctionne (clé valide + domaine OK). Le problème du récap vient donc d\'ailleurs (probablement le cron Vercel Hobby).</p></div>',
      })
      return Response.json({ ok: true, test: true, sent: true, id: r?.data?.id || null, to: to.replace(/^(.{2}).*(@.*)$/, '$1***$2') })
    } catch (err) {
      return Response.json({ ok: true, test: true, sent: false, error: String(err?.message || err) })
    }
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Calcule le mois précédent (1er jour 00h00 → dernier jour 23h59)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const monthLabel = startOfMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // Récupère les users via auth admin
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (usersErr) return Response.json({ error: usersErr.message }, { status: 500 })
  const users = usersData.users || []

  // Récupère toutes les données du mois en parallèle
  // + tous les comptes monthly (peu importe création) pour calculer le recurring qui a hit dans le mois
  // + tous les comptes activés dans le mois (pour les frais d'activation)
  const startMonthStr = startOfMonth.toISOString().slice(0, 10)
  const endMonthStr = endOfMonth.toISOString().slice(0, 10)
  const [tradesRes, payoutsRes, firmsRes, accountsRes, allMonthlyRes, activatedRes] = await Promise.all([
    supabase.from('journal_entries').select('user_id, pnl, date, created_at')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString()),
    supabase.from('payouts').select('user_id, amount, date, created_at')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString()),
    supabase.from('firms').select('id, user_id, created_at')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString()),
    supabase.from('accounts').select('user_id, status, spent, currency, activation_fee, created_at')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString()),
    // Tous les comptes monthly (pour recurring qui a frappé dans le mois)
    supabase.from('accounts').select('user_id, spent, buy_date, months_count, payment_mode')
      .eq('payment_mode', 'monthly'),
    // Comptes activés dans le mois (frais d'activation payés)
    supabase.from('accounts').select('user_id, activation_fee, activation_date')
      .gte('activation_date', startMonthStr)
      .lte('activation_date', endMonthStr)
      .gt('activation_fee', 0),
  ])

  const trades = tradesRes.data || []
  const payouts = payoutsRes.data || []
  const newFirms = firmsRes.data || []
  const newAccounts = accountsRes.data || []
  const allMonthlyAccounts = allMonthlyRes.data || []
  const activatedInMonth = activatedRes.data || []

  let sent = 0
  const failures = []
  const dryRecipients = []

  for (const user of users) {
    const email = user.email
    if (!email) continue

    // Compute stats du mois pour ce user
    const userTrades = trades.filter(t => t.user_id === user.id)
    const userPayouts = payouts.filter(p => p.user_id === user.id)
    const userFirms = newFirms.filter(f => f.user_id === user.id)
    const userAccounts = newAccounts.filter(a => a.user_id === user.id)

    // Skip users sans aucune activité ce mois
    if (userTrades.length === 0 && userPayouts.length === 0 && userFirms.length === 0 && userAccounts.length === 0) {
      continue
    }

    // Mode diagnostic : on compte seulement, on n'envoie rien
    if (dry) { dryRecipients.push(email); continue }

    const totalPnL = userTrades.reduce((s, t) => s + (Number(t.pnl) || 0), 0)
    const wins = userTrades.filter(t => Number(t.pnl) > 0).length
    const losses = userTrades.filter(t => Number(t.pnl) < 0).length
    const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
    const totalPayoutsAmount = userPayouts.reduce((s, p) => s + (Number(p.amount) || 0), 0)

    // === Calcul des dépenses totales du mois pour cet user ===
    // 1) Achat de nouveaux challenges dans le mois (spent de chaque compte créé)
    let totalSpentMonth = 0
    userAccounts.forEach(a => {
      totalSpentMonth += Number(a.spent) || 0
      // Si le compte a été créé ET activé dans le mois, on compte aussi l'activation
      // (sinon les activations hors-mois sont gérées par activatedInMonth ci-dessous)
    })
    // 2) Frais d'activation payés dans le mois (toutes activations, pas seulement comptes créés dans le mois)
    activatedInMonth.filter(a => a.user_id === user.id).forEach(a => {
      totalSpentMonth += Number(a.activation_fee) || 0
    })
    // 3) Mensualités récurrentes : comptes monthly créés AVANT le mois mais dont un cycle de facturation
    // est tombé dans le mois (ex: compte acheté en mars, le 2ème prélèvement tombe en avril)
    allMonthlyAccounts.filter(a => a.user_id === user.id).forEach(a => {
      if (!a.buy_date) return
      const buy = new Date(a.buy_date + 'T00:00:00Z')
      if (buy >= startOfMonth) return // déjà compté dans #1 (création dans le mois)
      const cycles = (a.months_count || 1)
      for (let i = 1; i < cycles; i++) {
        const billDate = new Date(buy)
        billDate.setUTCDate(buy.getUTCDate() + i * 30)
        if (billDate >= startOfMonth && billDate <= endOfMonth) {
          totalSpentMonth += Number(a.spent) || 0
        }
      }
    })

    // Génère HTML
    const html = generateRecapHTML({
      monthLabel,
      tradeCount: userTrades.length,
      totalPnL,
      winRate,
      wins,
      losses,
      payoutCount: userPayouts.length,
      totalPayoutsAmount,
      newFirmsCount: userFirms.length,
      newAccountsCount: userAccounts.length,
      totalSpentMonth,
    })

    try {
      await resend.emails.send({
        from: 'Quantara <noreply@quantara.tech>',
        replyTo: 'admin@quantara.tech',
        to: email,
        subject: `📊 Ton récap Quantara — ${monthLabel}`,
        html,
      })
      sent++
    } catch (err) {
      failures.push({ email, error: err.message })
    }
  }

  // === Sortie diagnostic (aucun envoi) ===
  if (dry) {
    let resendDomain = null
    if (process.env.RESEND_API_KEY) {
      try {
        const dr = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } })
        if (dr.ok) {
          const dj = await dr.json()
          const list = Array.isArray(dj) ? dj : (dj.data || [])
          const d = list.find(x => (x.name || '').includes('quantara.tech'))
          resendDomain = d ? d.status : 'not_found'
        } else { resendDomain = `http_${dr.status}` }
      } catch { resendDomain = 'error' }
    }
    return Response.json({
      ok: true,
      dry: true,
      month: monthLabel,
      window: { start: startMonthStr, end: endMonthStr },
      env: { CRON_SECRET: !!process.env.CRON_SECRET, RESEND_API_KEY: !!process.env.RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
      resendDomain,
      usersTotal: users.length,
      eligibleRecipients: dryRecipients.length,
      activityCounts: { trades: trades.length, payouts: payouts.length, newFirms: newFirms.length, newAccounts: newAccounts.length },
      sample: dryRecipients.slice(0, 5).map(e => e.replace(/^(.{2}).*(@.*)$/, '$1***$2')),
    })
  }

  return Response.json({
    ok: true,
    month: monthLabel,
    usersProcessed: users.length,
    sent,
    failures: failures.length,
    details: failures.length > 0 ? failures : undefined,
  })
}

// Template HTML simple, propre, responsive — bouquet de stats
function generateRecapHTML(data) {
  const {
    monthLabel,
    tradeCount, totalPnL, winRate, wins, losses,
    payoutCount, totalPayoutsAmount,
    newFirmsCount, newAccountsCount,
    totalSpentMonth = 0,
  } = data
  const pnlColor = totalPnL >= 0 ? '#1db87a' : '#e8504a'
  const pnlSign = totalPnL >= 0 ? '+' : ''
  // Bilan net = payouts - dépenses (le vrai cash flow du mois)
  const netCashFlow = totalPayoutsAmount - totalSpentMonth
  const netColor = netCashFlow >= 0 ? '#1db87a' : '#e8504a'
  const netSign = netCashFlow >= 0 ? '+' : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Quantara — Récap ${monthLabel}</title>
</head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f0ede8;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0f14;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#141720;border-radius:14px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 32px 20px;text-align:center;background:linear-gradient(180deg,rgba(45,111,255,0.12),transparent);">
          <div style="font-size:24px;font-weight:700;letter-spacing:0.1em;color:#fff;margin-bottom:6px;">QUANTARA</div>
          <div style="font-size:11px;color:#9098b0;letter-spacing:0.05em;">TRACK · ANALYZE · GROW</div>
        </td></tr>

        <tr><td style="padding:0 32px 28px;text-align:center;">
          <h1 style="font-size:22px;font-weight:700;margin:18px 0 8px;color:#f0ede8;">📊 Ton récap de ${monthLabel}</h1>
          <p style="font-size:13px;color:#9098b0;margin:0;line-height:1.5;">Voici ce que tu as accompli sur Quantara ce mois-ci.</p>
        </td></tr>

        <!-- Stats principales : Trades + PnL -->
        <tr><td style="padding:0 32px 14px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="50%" style="padding:14px;background:#1c2030;border-radius:10px;text-align:center;vertical-align:top;" valign="top">
                <div style="font-size:10px;font-weight:700;color:#7b839b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">📔 Trades loggés</div>
                <div style="font-size:28px;font-weight:700;color:#f0ede8;">${tradeCount}</div>
                <div style="font-size:11px;color:#9098b0;margin-top:4px;">${wins} gains · ${losses} pertes · WR ${winRate}%</div>
              </td>
              <td width="8"></td>
              <td width="50%" style="padding:14px;background:#1c2030;border-radius:10px;text-align:center;vertical-align:top;" valign="top">
                <div style="font-size:10px;font-weight:700;color:#7b839b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">💰 PnL trading</div>
                <div style="font-size:28px;font-weight:700;color:${pnlColor};">${pnlSign}${totalPnL.toFixed(0)} $</div>
                <div style="font-size:11px;color:#9098b0;margin-top:4px;">Performance journal</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Cash flow : Dépenses + Payouts + Net -->
        <tr><td style="padding:0 32px 14px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="33%" style="padding:14px;background:#1c2030;border-radius:10px;text-align:center;vertical-align:top;" valign="top">
                <div style="font-size:10px;font-weight:700;color:#7b839b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">📉 Dépenses</div>
                <div style="font-size:20px;font-weight:700;color:#e8504a;">-${totalSpentMonth.toFixed(0)} $</div>
                <div style="font-size:11px;color:#9098b0;margin-top:4px;">challenges + activations + mensualités</div>
              </td>
              <td width="8"></td>
              <td width="33%" style="padding:14px;background:#1c2030;border-radius:10px;text-align:center;vertical-align:top;" valign="top">
                <div style="font-size:10px;font-weight:700;color:#7b839b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">💸 Payouts</div>
                <div style="font-size:20px;font-weight:700;color:#1db87a;">+${totalPayoutsAmount.toFixed(0)} $</div>
                <div style="font-size:11px;color:#9098b0;margin-top:4px;">${payoutCount} payout${payoutCount > 1 ? 's' : ''} net reçu${payoutCount > 1 ? 's' : ''}</div>
              </td>
              <td width="8"></td>
              <td width="33%" style="padding:14px;background:#1c2030;border-radius:10px;text-align:center;vertical-align:top;border:1px solid ${netCashFlow >= 0 ? 'rgba(29,184,122,0.3)' : 'rgba(232,80,74,0.3)'};" valign="top">
                <div style="font-size:10px;font-weight:700;color:#7b839b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">⚖️ Bilan du mois</div>
                <div style="font-size:20px;font-weight:700;color:${netColor};">${netSign}${netCashFlow.toFixed(0)} $</div>
                <div style="font-size:11px;color:#9098b0;margin-top:4px;">cash flow réel</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Activité : Firmes + Comptes -->
        <tr><td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="50%" style="padding:14px;background:#1c2030;border-radius:10px;text-align:center;vertical-align:top;" valign="top">
                <div style="font-size:10px;font-weight:700;color:#7b839b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">🏢 Firmes</div>
                <div style="font-size:20px;font-weight:700;color:#4d8fff;">${newFirmsCount}</div>
                <div style="font-size:11px;color:#9098b0;margin-top:4px;">ajoutée${newFirmsCount > 1 ? 's' : ''} ce mois</div>
              </td>
              <td width="8"></td>
              <td width="50%" style="padding:14px;background:#1c2030;border-radius:10px;text-align:center;vertical-align:top;" valign="top">
                <div style="font-size:10px;font-weight:700;color:#7b839b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">💼 Comptes</div>
                <div style="font-size:20px;font-weight:700;color:#fac775;">${newAccountsCount}</div>
                <div style="font-size:11px;color:#9098b0;margin-top:4px;">créé${newAccountsCount > 1 ? 's' : ''} ce mois</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <a href="https://quantara.tech/app" style="display:inline-block;padding:14px 36px;background:#2d6fff;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Voir mon dashboard →</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.07);background:#0d0f14;">
          <p style="font-size:11px;color:#7b839b;margin:0 0 8px;line-height:1.5;">
            Quantara Technologies LLC · Albuquerque, NM, USA<br>
            <a href="https://quantara.tech/legal/privacy" style="color:#7b839b;text-decoration:underline;">Privacy</a> · <a href="mailto:admin@quantara.tech" style="color:#7b839b;text-decoration:underline;">Contact</a>
          </p>
          <p style="font-size:10px;color:#7b839b;margin:0;">
            Tu reçois cet email parce que tu as un compte actif sur Quantara.<br>
            <a href="https://quantara.tech/app/settings" style="color:#7b839b;">Gérer mes préférences email</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
