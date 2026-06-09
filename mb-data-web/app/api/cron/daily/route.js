// GET /api/cron/daily — Dispatcher quotidien (compatible Vercel Hobby : 1 seul cron).
//
// Vercel Hobby ne permet que ~2 cron jobs → on en déclare UN seul (ce fichier)
// dans vercel.json, et il déclenche les jobs réels selon la date :
//   - check-bills        → tous les jours
//   - onboarding-emails  → tous les jours
//   - drawdown-guardian  → en semaine (lun→ven)
//   - monthly-recap      → le 1er du mois
//
// Chaque sous-job est appelé en interne (HTTP, même déploiement) avec le
// CRON_SECRET — leur logique/route restent inchangées.
//
//   ?dry=1 (admin ou cron secret) → n'appelle RIEN, renvoie seulement le plan du jour.

import { verifyAdmin } from '../../../../lib/apiAuth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req) {
  const dry = new URL(req.url).searchParams.get('dry') === '1'

  const authHeader = req.headers.get('authorization') || ''
  const cronOk = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
  let adminOk = false
  if (dry && !cronOk) {
    const a = await verifyAdmin(req)
    adminOk = !a.error
  }
  if (!cronOk && !adminOk) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const dow = now.getUTCDay()        // 0 = dimanche … 6 = samedi
  const dom = now.getUTCDate()       // jour du mois (UTC)
  const isWeekday = dow >= 1 && dow <= 5
  const isFirstOfMonth = dom === 1

  const jobs = [
    { name: 'check-bills', run: true },
    { name: 'onboarding-emails', run: true },
    { name: 'drawdown-guardian', run: isWeekday },
    { name: 'monthly-recap', run: isFirstOfMonth },
  ]

  if (dry) {
    return Response.json({
      ok: true, dry: true, dateUTC: now.toISOString(),
      plan: jobs.map(j => ({ job: j.name, willRun: j.run })),
    })
  }

  const origin = new URL(req.url).origin
  const results = await Promise.all(jobs.map(async (j) => {
    if (!j.run) return { job: j.name, skipped: true }
    try {
      const r = await fetch(`${origin}/api/cron/${j.name}`, {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      })
      let body = null
      try { body = await r.json() } catch { /* non-JSON */ }
      return { job: j.name, status: r.status, sent: body?.sent, ok: body?.ok }
    } catch (e) {
      return { job: j.name, error: String(e?.message || e) }
    }
  }))

  return Response.json({ ok: true, dateUTC: now.toISOString(), results })
}
