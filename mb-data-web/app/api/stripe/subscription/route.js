// GET /api/stripe/subscription — état d'abonnement + factures de l'utilisateur.
//
// Sortie : { plan, planStatus, planInterval, expiresAt, cancelAtPeriodEnd,
//            limits, invoices: [{ id, number, status, total, currency, created,
//                                 pdfUrl, hostedUrl }] }
//
// Le plan renvoyé vient de `profiles` (écrit par le webhook), pas d'un appel
// Stripe : la page reste rapide et fonctionne même si Stripe est down.
// Les factures, elles, sont lues en direct — c'est la partie "Invoicing".

import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'
import { getStripe } from '../../../../lib/stripe'
import { effectivePlan, getPlanLimits } from '../../../../lib/planLimits'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function GET(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const limit = rateLimit({ key: `stripe-sub:${auth.user.id}`, windowMs: 60_000, max: 20 })
  if (!limit.allowed) return rateLimitResponse(limit)

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_status, plan_interval, plan_expires_at, plan_cancel_at_period_end, beta_grandfather, stripe_customer_id')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  const payload = {
    plan: effectivePlan(profile),
    planStatus: profile?.plan_status || null,
    planInterval: profile?.plan_interval || null,
    expiresAt: profile?.plan_expires_at || null,
    cancelAtPeriodEnd: Boolean(profile?.plan_cancel_at_period_end),
    betaGrandfather: Boolean(profile?.beta_grandfather),
    limits: getPlanLimits(profile),
    hasCustomer: Boolean(profile?.stripe_customer_id),
    invoices: [],
  }

  // Les factures ne sont lues que si le user a déjà un customer Stripe.
  // Une panne Stripe ne doit pas casser l'affichage du plan.
  if (profile?.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = getStripe()
      const list = await stripe.invoices.list({ customer: profile.stripe_customer_id, limit: 24 })
      payload.invoices = list.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        total: inv.total,
        tax: inv.total_taxes?.reduce((s, t) => s + (t.amount || 0), 0) ?? null,
        currency: inv.currency,
        created: inv.created,
        pdfUrl: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url,
      }))
    } catch (err) {
      console.error('[stripe-subscription] invoice list failed:', err.message)
    }
  }

  return Response.json(payload)
}
