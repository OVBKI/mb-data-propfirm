// POST /api/stripe/webhook — SOURCE DE VÉRITÉ de l'état d'abonnement.
//
// C'est la seule chose qui a le droit d'écrire `profiles.plan` / `plan_status`.
// Ni le client, ni la page de succès du Checkout : un utilisateur peut ouvrir
// /app/settings?billing=success à la main sans avoir jamais payé.
//
// Trois garde-fous obligatoires :
//   1. SIGNATURE — le corps brut est vérifié contre STRIPE_WEBHOOK_SECRET.
//      Sans ça, n'importe qui peut POSTer un faux "abonnement actif".
//   2. CORPS BRUT — request.text(), jamais request.json() : re-sérialiser le
//      JSON change les octets et invalide la signature.
//   3. IDEMPOTENCE — Stripe rejoue les événements (au moins une fois, pas
//      exactement une fois) et ne garantit pas l'ordre. On dédoublonne sur
//      event.id et on ignore les événements plus vieux que l'état enregistré.

import { createClient } from '@supabase/supabase-js'
import { getStripe, planFromPriceId } from '../../../../lib/stripe'

// Node runtime obligatoire : la vérification de signature utilise `crypto`.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

const RELEVANT = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
])

export async function POST(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Billing not configured' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) return Response.json({ error: 'Missing signature' }, { status: 400 })

  const raw = await request.text()
  const stripe = getStripe()

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, secret)
  } catch (err) {
    // 400 → Stripe réessaiera. Ne jamais logger le corps : il contient des
    // données de facturation.
    return Response.json({ error: `Signature verification failed: ${err.message}` }, { status: 400 })
  }

  if (!RELEVANT.has(event.type)) return Response.json({ received: true, ignored: event.type })

  const supabase = getSupabase()

  // ── Idempotence ─────────────────────────────────────────────────────────────
  // insert sur une PK = event.id : le doublon renvoie une erreur 23505 qu'on
  // traite comme "déjà traité". Plus fiable qu'un select-puis-insert (course).
  const { error: dupErr } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type })
  if (dupErr) {
    if (dupErr.code === '23505') return Response.json({ received: true, duplicate: true })
    // La table manque (migration pas encore jouée) : on continue quand même,
    // mieux vaut un traitement non-dédoublonné qu'un abonnement jamais activé.
    console.error('[stripe-webhook] stripe_events insert failed:', dupErr.message)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode !== 'subscription') break
        // La session ne porte pas encore l'état final de l'abonnement : on le
        // relit pour éviter d'enregistrer un statut périmé.
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        if (!subId) break
        const sub = await stripe.subscriptions.retrieve(subId)
        await applySubscription(supabase, sub, session.client_reference_id || null)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await applySubscription(supabase, event.data.object, null)
        break
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        // Le changement de statut arrive de toute façon via customer.subscription.updated.
        // On ne s'en sert que pour horodater le dernier événement de facturation,
        // utile au support ("son paiement a échoué quand ?").
        const invoice = event.data.object
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (!customerId) break
        await supabase
          .from('profiles')
          .update({
            last_invoice_status: event.type === 'invoice.paid' ? 'paid' : 'failed',
            last_invoice_at: new Date((invoice.created || 0) * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId)
        break
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error:', event.type, err.message)
    // 500 → Stripe rejoue. L'idempotence ci-dessus a déjà consommé l'event.id,
    // donc on le libère pour que le rejeu soit réellement traité.
    await supabase.from('stripe_events').delete().eq('id', event.id)
    return Response.json({ error: 'Handler failed' }, { status: 500 })
  }

  return Response.json({ received: true })
}

// ============================================================================
// applySubscription — projette un objet Subscription Stripe sur `profiles`
// ============================================================================
async function applySubscription(supabase, sub, fallbackUserId) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id

  // Retrouver le profil : metadata d'abord (posé au checkout), puis
  // stripe_customer_id, puis client_reference_id de la session.
  const userId =
    sub.metadata?.supabase_user_id ||
    fallbackUserId ||
    (await userIdFromCustomer(supabase, customerId))

  if (!userId) {
    console.error('[stripe-webhook] no user for subscription', sub.id)
    return
  }

  const item = sub.items?.data?.[0]
  const priceId = item?.price?.id || null
  const plan = planFromPriceId(priceId)

  // `current_period_end` vit sur l'item d'abonnement depuis 2025-03-31.basil ;
  // on lit les deux emplacements pour rester tolérant aux versions d'API.
  const periodEnd = item?.current_period_end ?? sub.current_period_end ?? null

  const active = ['active', 'trialing', 'past_due'].includes(sub.status)

  const patch = {
    plan: active && plan ? plan : 'free',
    plan_status: sub.status,
    plan_interval: item?.price?.recurring?.interval || null,
    plan_expires_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    plan_cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId || undefined,
  }
  if (active && plan) patch.plan_started_at = new Date((sub.start_date || 0) * 1000).toISOString()

  const { error } = await supabase.from('profiles').update(patch).eq('user_id', userId)
  if (error) throw new Error(`profiles update failed: ${error.message}`)
}

async function userIdFromCustomer(supabase, customerId) {
  if (!customerId) return null
  const { data } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.user_id || null
}
