// POST /api/stripe/portal — ouvre le Customer Portal Stripe.
//
// Sortie : { url }
//
// Le portail couvre, sans une ligne d'UI à écrire : changement de palier,
// résiliation, mise à jour du moyen de paiement, adresse de facturation, et
// l'HISTORIQUE DES FACTURES (PDF téléchargeables) — c'est la brique "Invoicing"
// côté client.
//
// À configurer une fois dans Dashboard → Settings → Billing → Customer portal
// (produits autorisés pour l'upgrade/downgrade, politique d'annulation, etc.).

import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'
import { getStripe } from '../../../../lib/stripe'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const limit = rateLimit({ key: `stripe-portal:${auth.user.id}`, windowMs: 60_000, max: 10 })
  if (!limit.allowed) return rateLimitResponse(limit)

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Billing not configured' }, { status: 503 })
  }

  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (!profile?.stripe_customer_id) {
    return Response.json({ error: 'NO_CUSTOMER', code: 'NO_CUSTOMER' }, { status: 404 })
  }

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://quantara.tech'}/app/settings`,
  })

  return Response.json({ url: session.url })
}
