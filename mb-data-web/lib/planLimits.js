// lib/planLimits.js — Source de vérité UNIQUE des limites par palier.
//
// Isomorphe : importable côté client (afficher/masquer une UI) ET côté serveur
// (refuser une création). Ne jamais dupliquer une limite ailleurs dans le code.
//
// RÈGLE : le client peut mentir. Toute limite doit être revérifiée dans la route
// API qui crée la ressource — l'UI ne fait que rendre le refus lisible.
//
// Le plan applicatif vient de `profiles.plan`, alimenté EXCLUSIVEMENT par le
// webhook Stripe (app/api/stripe/webhook). Jamais par le client, jamais par le
// retour de Checkout (un utilisateur peut forger l'URL de succès).

export const PLANS = ['free', 'pro', 'elite', 'business']

// Les valeurs reflètent /pricing (lib/i18n.js pages.pricing.plan*).
// null = illimité.
export const PLAN_LIMITS = {
  free: {
    label: 'Free',
    maxFirms: 1,
    maxTradesPerMonth: 20,
    maxAccounts: 3,
    csvImport: false,
    brokerSync: false,
    advancedAlerts: false,
    pdfExport: false,
    aiCoach: false,
    seats: 1,
  },
  pro: {
    label: 'Pro',
    maxFirms: null,
    maxTradesPerMonth: null,
    maxAccounts: null,
    csvImport: true,
    brokerSync: true,
    advancedAlerts: true,
    pdfExport: true,
    aiCoach: false,
    seats: 1,
  },
  elite: {
    label: 'Elite',
    maxFirms: null,
    maxTradesPerMonth: null,
    maxAccounts: null,
    csvImport: true,
    brokerSync: true,
    advancedAlerts: true,
    pdfExport: true,
    aiCoach: true,
    seats: 3,
  },
  business: {
    label: 'Business',
    maxFirms: null,
    maxTradesPerMonth: null,
    maxAccounts: null,
    csvImport: true,
    brokerSync: true,
    advancedAlerts: true,
    pdfExport: true,
    aiCoach: true,
    seats: 10,
  },
}

// Statuts Stripe qui donnent accès au produit. `past_due` reste ouvert : la
// relance (dunning) tourne encore, couper l'accès au premier échec de paiement
// est le meilleur moyen de transformer une carte expirée en churn définitif.
const ENTITLED_STATUSES = new Set(['active', 'trialing', 'past_due'])

// Palier effectif d'un profil. Gère les 3 sources de droits :
//   1. beta_grandfather — les bêta-testeurs gardent le Free illimité à vie
//   2. abonnement Stripe actif
//   3. sinon : free
export function effectivePlan(profile) {
  if (!profile) return 'free'
  if (profile.beta_grandfather) return 'beta'
  const plan = profile.plan
  if (!plan || plan === 'free' || !PLANS.includes(plan)) return 'free'
  if (!ENTITLED_STATUSES.has(profile.plan_status)) return 'free'
  return plan
}

// Limites applicables à un profil. Le palier virtuel `beta` = Free sans plafond.
export function getPlanLimits(profile) {
  const plan = effectivePlan(profile)
  if (plan === 'beta') {
    return { ...PLAN_LIMITS.free, label: 'Beta (fondateur)', maxFirms: null, maxTradesPerMonth: null, maxAccounts: null }
  }
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free
}

export function hasFeature(profile, feature) {
  return Boolean(getPlanLimits(profile)[feature])
}

// true si `current` (nombre déjà créé) atteint le plafond de `key`.
export function isAtLimit(profile, key, current) {
  const max = getPlanLimits(profile)[key]
  if (max === null || max === undefined) return false
  return current >= max
}

// Réponse HTTP standard quand une route refuse une création pour cause de quota.
// 402 Payment Required + un code stable que le client peut brancher sur une modale
// d'upgrade (plutôt que de parser un message traduit).
export function planLimitError(key, limit) {
  return Response.json(
    { error: 'PLAN_LIMIT_REACHED', code: 'PLAN_LIMIT_REACHED', limitKey: key, limit },
    { status: 402 }
  )
}
