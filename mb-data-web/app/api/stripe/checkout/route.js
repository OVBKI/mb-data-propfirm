// POST /api/stripe/checkout — ouvre une Checkout Session d'abonnement.
//
// Entrée  : { plan: 'pro'|'elite'|'business', interval: 'month'|'year' }
// Sortie  : { url } → le client fait window.location.href = url
//
// Le prix N'EST JAMAIS envoyé par le client : il choisit un palier, le serveur
// résout le Price ID depuis l'env. Sinon n'importe qui peut s'abonner au prix
// de son choix.

import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'
import { getStripe, priceIdFor, integrationIdentifier } from '../../../../lib/stripe'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://quantara.tech'
}

export async function POST(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const limit = rateLimit({ key: `stripe-checkout:${auth.user.id}`, windowMs: 60_000, max: 5 })
  if (!limit.allowed) return rateLimitResponse(limit)

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Billing not configured' }, { status: 503 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const plan = String(body?.plan || '').toLowerCase()
  const interval = body?.interval === 'year' ? 'year' : 'month'
  const priceId = priceIdFor(plan, interval)
  if (!priceId) {
    return Response.json({ error: `Unknown plan/interval: ${plan}/${interval}` }, { status: 400 })
  }

  const stripe = getStripe()
  const supabase = getSupabase()

  // ── Customer : réutiliser celui déjà lié au profil, sinon en créer un ────────
  // On stocke user_id dans les metadata pour que le webhook puisse retrouver le
  // profil même si l'email change côté Stripe.
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  let customerId = profile?.stripe_customer_id || null

  if (customerId) {
    // Un customer supprimé côté Dashboard casse la Checkout Session : on repart à neuf.
    try {
      const existing = await stripe.customers.retrieve(customerId)
      if (existing?.deleted) customerId = null
    } catch {
      customerId = null
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: auth.user.email,
      metadata: { supabase_user_id: auth.user.id },
    })
    customerId = customer.id
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', auth.user.id)
  }

  // ── Checkout Session ────────────────────────────────────────────────────────
  // - PAS de payment_method_types : Stripe choisit dynamiquement les moyens de
  //   paiement éligibles (SEPA, Bancontact, iDEAL, Link…) selon le pays du client.
  // - automatic_tax : TVA/sales tax calculées automatiquement. N'a d'effet que si
  //   une immatriculation (registration) est active dans la juridiction du client.
  // - customer_update.address : sans ça, Checkout garde l'adresse enregistrée du
  //   customer et ignore celle saisie au paiement → mauvais taux de TVA.
  // - tax_id_collection : un client B2B avec un n° de TVA intracommunautaire
  //   valide bascule en autoliquidation au lieu d'être taxé comme un particulier.
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: auth.user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    automatic_tax: { enabled: true },
    customer_update: { address: 'auto', name: 'auto' },
    tax_id_collection: { enabled: true },
    billing_address_collection: 'required',
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { supabase_user_id: auth.user.id, plan },
    },
    metadata: { supabase_user_id: auth.user.id, plan, interval },
    integration_identifier: integrationIdentifier(),
    success_url: `${siteUrl()}/app/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/pricing?billing=cancelled`,
  })

  return Response.json({ url: session.url })
}
