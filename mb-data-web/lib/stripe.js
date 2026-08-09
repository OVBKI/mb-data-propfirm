// lib/stripe.js — Client Stripe côté serveur (jamais importé depuis un composant client).
//
// USAGE :
//   import { getStripe, priceIdFor, planFromPriceId } from '@/lib/stripe'
//   const stripe = getStripe()
//
// SÉCURITÉ :
//   - STRIPE_SECRET_KEY n'est JAMAIS préfixée NEXT_PUBLIC_ : elle reste serveur-only.
//   - En production, préférer une clé restreinte (rk_live_…) plutôt qu'une sk_live_ :
//     Dashboard → Developers → API keys → Restricted keys, avec seulement
//     Checkout Sessions (write), Customers (write), Billing Portal (write),
//     Subscriptions (read), Invoices (read), Products/Prices (read).
//   - Le client est instancié DANS les handlers (pas au niveau module) pour ne pas
//     casser le build Next quand la variable d'env est absente (même pattern que
//     les routes Supabase service-role du projet).

import Stripe from 'stripe'

// Version d'API épinglée : les webhooks et les objets renvoyés restent stables même
// si Stripe met à jour la version par défaut du compte. À bumper explicitement.
export const STRIPE_API_VERSION = '2026-07-29.dahlia'

let _stripe = null

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: STRIPE_API_VERSION,
      appInfo: { name: 'Quantara', url: 'https://quantara.tech' },
    })
  }
  return _stripe
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)
}

// ============================================================================
// Catalogue — mapping plan ↔ Price ID
// ============================================================================
// Un PRODUIT Stripe par palier (Pro, Elite, Business) — jamais un seul produit
// portant les prix de plusieurs paliers, sinon toutes les lignes de facture
// affichent le même nom et le client ne distingue pas ce qu'il a acheté.
// Plusieurs PRIX par produit uniquement pour les variantes du MÊME palier
// (mensuel vs annuel).
//
// Les Price IDs viennent des variables d'env (ils diffèrent entre sandbox et live).
export function priceIdFor(plan, interval) {
  const map = {
    pro: {
      month: process.env.STRIPE_PRICE_PRO_MONTHLY,
      year: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
    elite: {
      month: process.env.STRIPE_PRICE_ELITE_MONTHLY,
      year: process.env.STRIPE_PRICE_ELITE_YEARLY,
    },
    business: {
      month: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
      year: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
    },
  }
  return map[plan]?.[interval] || null
}

// Inverse : Price ID → plan applicatif. Utilisé par le webhook pour traduire
// l'abonnement Stripe en `profiles.plan` sans faire confiance au client.
export function planFromPriceId(priceId) {
  if (!priceId) return null
  const table = [
    ['pro', process.env.STRIPE_PRICE_PRO_MONTHLY],
    ['pro', process.env.STRIPE_PRICE_PRO_YEARLY],
    ['elite', process.env.STRIPE_PRICE_ELITE_MONTHLY],
    ['elite', process.env.STRIPE_PRICE_ELITE_YEARLY],
    ['business', process.env.STRIPE_PRICE_BUSINESS_MONTHLY],
    ['business', process.env.STRIPE_PRICE_BUSINESS_YEARLY],
  ]
  for (const [plan, id] of table) if (id && id === priceId) return plan
  return null
}

// Étiquette d'intégration (API >= 2026-03-25.dahlia) : permet de comparer les
// tunnels de checkout dans le Dashboard. Suffixe aléatoire de 8 lettres imposé
// par la convention Stripe.
export function integrationIdentifier(prefix = 'quantara-checkout') {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  let suffix = ''
  for (let i = 0; i < 8; i++) suffix += letters[Math.floor(Math.random() * letters.length)]
  return `${prefix}-${suffix}`
}
