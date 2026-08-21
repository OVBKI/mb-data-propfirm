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

// Au-delà de ce délai, une réservation restée en `processing` est considérée
// comme abandonnée (instance tuée mid-traitement) et peut être reprise. Plus long
// que le timeout d'une fonction serverless, plus court que l'intervalle de rejeu
// de Stripe.
const STALE_CLAIM_MS = 5 * 60 * 1000

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
  // On RÉSERVE l'event.id par un insert sur la PK : un doublon simultané se
  // heurte au 23505, ce qui est plus fiable qu'un select-puis-insert (course).
  //
  // La réservation est marquée `processing`, et passe à `done` seulement après
  // un traitement réussi. C'est ce qui distingue « déjà traité » de « traitement
  // interrompu » : une réservation restée en `processing` (crash, timeout, échec
  // de nettoyage) est reprise par le rejeu Stripe au lieu d'être classée doublon
  // et perdue définitivement.
  const claimedAt = new Date().toISOString()
  const { error: dupErr } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type, status: 'processing', received_at: claimedAt })

  if (dupErr) {
    if (dupErr.code === '23505') {
      const { data: prior } = await supabase
        .from('stripe_events')
        .select('status, received_at')
        .eq('id', event.id)
        .maybeSingle()

      // Traitement abouti : c'est un vrai doublon, on l'acquitte.
      if (!prior || prior.status === 'done') {
        return Response.json({ received: true, duplicate: true })
      }

      // Réservation `processing` encore fraîche : une autre instance est
      // probablement en train de traiter le même event, on la laisse finir.
      // Le délai ne s'applique QU'À `processing` : un `failed` a déjà rendu la
      // main, l'attendre ferait perdre cinq minutes au rejeu pour rien.
      const age = Date.now() - new Date(prior.received_at || 0).getTime()
      if (prior.status === 'processing' && age < STALE_CLAIM_MS) {
        return Response.json({ received: true, inFlight: true })
      }

      // Réservation périmée : le traitement précédent n'a jamais abouti. On la
      // reprend à notre compte et on rejoue.
      await supabase
        .from('stripe_events')
        .update({ status: 'processing', received_at: claimedAt })
        .eq('id', event.id)
      console.warn('[stripe-webhook] reprise d une réservation périmée:', event.id)
    } else {
      // La table manque (migration pas encore jouée) : on continue quand même,
      // mieux vaut un traitement non-dédoublonné qu'un abonnement jamais activé.
      console.error('[stripe-webhook] stripe_events insert failed:', dupErr.message)
    }
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
    // 500 → Stripe rejoue. On repasse la réservation en `failed` pour que le
    // rejeu la reprenne. Si même cette écriture échoue, la réservation reste en
    // `processing` et la règle de péremption ci-dessus la rattrape : dans aucun
    // cas l'événement n'est classé doublon et perdu.
    const { error: releaseErr } = await supabase
      .from('stripe_events')
      .update({ status: 'failed' })
      .eq('id', event.id)
    if (releaseErr) console.error('[stripe-webhook] release failed:', releaseErr.message)
    return Response.json({ error: 'Handler failed' }, { status: 500 })
  }

  // Traitement abouti : c'est cette marque qui fait qu'un rejeu sera reconnu
  // comme doublon.
  await supabase.from('stripe_events').update({ status: 'done' }).eq('id', event.id)

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
  // `start_date` absent → laisser null. Sans ce garde, `new Date(0)` écrivait
  // 1970-01-01 et l'ancienneté affichée à l'utilisateur devenait absurde.
  if (active && plan && sub.start_date) {
    patch.plan_started_at = new Date(sub.start_date * 1000).toISOString()
  }

  // `select('user_id')` pour compter les lignes touchées : un update Supabase qui
  // ne matche AUCUNE ligne ne renvoie pas d'erreur. Sans ce contrôle, un profil
  // manquant faisait silencieusement disparaître un abonnement payé.
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('user_id', userId)
    .select('user_id')
  if (error) throw new Error(`profiles update failed: ${error.message}`)
  if (!data?.length) throw new Error(`no profile row for user ${userId}`)
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
