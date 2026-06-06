// POST /api/waitlist — inscription waitlist Pro / Elite / Business.
// Body: { email: string, plan: 'pro' | 'elite' | 'business' }
// Insert dans Supabase + envoie un email de confirmation via Resend si dispo.
//
// GET /api/waitlist?plan=<p> — public counter (no PII) used by the pricing
// page. Cached 60s at the edge.
//
// =====================================================================
// SQL à exécuter une fois dans Supabase SQL editor pour créer la table :
// =====================================================================
// create table waitlist (
//   id uuid primary key default gen_random_uuid(),
//   email text unique not null,
//   plan text not null check (plan in ('pro','elite','business')),
//   created_at timestamptz default now(),
//   ip_address text
// );
// alter table waitlist enable row level security;
// create policy "anyone can insert" on waitlist for insert with check (true);
// =====================================================================

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req) {
  // Récupère l'IP (Vercel / proxy) — utilisée pour le rate limit + storage DB
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

  // 🛡 Rate limit : 3 inscriptions / minute / IP (mai 2026 — audit Agent #1)
  // Protège contre spam d'inscriptions waitlist (coût Resend + risque blacklist domaine)
  const limit = rateLimit({ key: `waitlist:${ip}`, windowMs: 60_000, max: 3 })
  if (!limit.allowed) {
    return rateLimitResponse(limit, 'Trop d\'inscriptions depuis cette IP. Réessaye dans 1 minute.')
  }

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body?.email || '').trim().toLowerCase()
  const plan = (body?.plan || '').trim().toLowerCase()

  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'Email invalide' }, { status: 400 })
  }
  if (!['pro', 'elite', 'business'].includes(plan)) {
    return Response.json({ error: 'Plan invalide (pro, elite ou business)' }, { status: 400 })
  }

  // Insert dans Supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error: insertErr } = await supabase
    .from('waitlist')
    .insert({ email, plan, ip_address: ip })

  if (insertErr) {
    // 23505 = unique violation : l'email est déjà inscrit, on considère que c'est OK
    if (insertErr.code === '23505') {
      return Response.json({ ok: true, alreadyRegistered: true })
    }
    return Response.json({ error: insertErr.message }, { status: 500 })
  }

  // Email de confirmation via Resend (best-effort, ne casse pas l'inscription si échoue)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const planLabel = plan === 'business' ? 'Business (Team)'
        : plan === 'elite' ? 'Elite'
        : 'Pro'
      await resend.emails.send({
        from: 'Quantara <noreply@quantara.tech>',
        replyTo: 'admin@quantara.tech',
        to: email,
        subject: `✓ Inscription waitlist Quantara — ${planLabel}`,
        html: `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f0ede8;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0f14;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#141720;border-radius:14px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
        <tr><td style="padding:32px 32px 20px;text-align:center;background:linear-gradient(180deg,rgba(45,111,255,0.12),transparent);">
          <div style="font-size:24px;font-weight:700;letter-spacing:0.1em;color:#fff;margin-bottom:6px;">QUANTARA</div>
          <div style="font-size:11px;color:#9098b0;letter-spacing:0.05em;">TRACK · ANALYZE · GROW</div>
        </td></tr>
        <tr><td style="padding:16px 32px 28px;">
          <h1 style="font-size:20px;font-weight:700;margin:0 0 14px;color:#f0ede8;text-align:center;">Bienvenue sur la waitlist ✓</h1>
          <p style="font-size:14px;color:#9098b0;line-height:1.6;margin:0 0 14px;">
            Tu es inscrit·e sur la liste <strong style="color:#f0ede8;">${planLabel}</strong>.
          </p>
          <p style="font-size:14px;color:#9098b0;line-height:1.6;margin:0 0 14px;">
            Quantara reste <strong style="color:#1db87a;">gratuit pendant la beta</strong>. Quand le plan Pro sortira (Q3 2026), tu auras automatiquement <strong style="color:#f0ede8;">-50% à vie</strong>${plan === 'business' ? ' et un onboarding prioritaire pour ton équipe' : plan === 'elite' ? ' et l\'accès anticipé aux features Elite' : ''}.
          </p>
          <p style="font-size:14px;color:#9098b0;line-height:1.6;margin:0 0 20px;">
            En attendant, profite à fond de la beta — tracking illimité, CSV Rithmic, alertes.
          </p>
          <div style="text-align:center;margin-top:24px;">
            <a href="https://quantara.tech/app" style="display:inline-block;padding:12px 28px;background:#2d6fff;color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">Aller au dashboard →</a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.07);background:#0d0f14;">
          <p style="font-size:11px;color:#7b839b;margin:0;line-height:1.5;">
            Quantara Technologies LLC · Albuquerque, NM, USA<br>
            <a href="https://quantara.tech/legal/privacy" style="color:#7b839b;text-decoration:underline;">Privacy</a> · <a href="mailto:admin@quantara.tech" style="color:#7b839b;text-decoration:underline;">Contact</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      })
    } catch (err) {
      // On log mais on retourne ok quand même : l'inscription DB a fonctionné
      console.warn('Resend waitlist confirmation failed:', err?.message)
    }
  }

  return Response.json({ ok: true })
}

// GET /api/waitlist?plan=lifetime — public counter used by the pricing page
// to display "X / 100 spots claimed". No PII returned, only the integer.
// Cached for 60s at the edge so spam refresh can't hammer the DB.
const ALLOWED_COUNT_PLANS = new Set(['pro', 'elite', 'business'])

export async function GET(req) {
  const url = new URL(req.url)
  const plan = (url.searchParams.get('plan') || '').toLowerCase()
  if (!ALLOWED_COUNT_PLANS.has(plan)) {
    return Response.json({ error: 'plan invalide' }, { status: 400 })
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ count: 0 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { count, error } = await supabase
    .from('waitlist')
    .select('id', { count: 'exact', head: true })
    .eq('plan', plan)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(
    { count: count || 0 },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  )
}
