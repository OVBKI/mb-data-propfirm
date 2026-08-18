// lib/stripe.test.js — résolution palier ↔ Price ID.
//
// Cette table est ce qui empêche un client de choisir son propre prix : il
// envoie un PALIER, le serveur résout le Price. Une inversion ici facturerait
// le mauvais montant, et `planFromPriceId` est ce que le webhook utilise pour
// décider quel plan accorder.

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { priceIdFor, planFromPriceId, integrationIdentifier } from './stripe'

const ENV = {
  STRIPE_PRICE_PRO_MONTHLY: 'price_pro_m',
  STRIPE_PRICE_PRO_YEARLY: 'price_pro_y',
  STRIPE_PRICE_ELITE_MONTHLY: 'price_elite_m',
  STRIPE_PRICE_ELITE_YEARLY: 'price_elite_y',
  STRIPE_PRICE_BUSINESS_MONTHLY: 'price_biz_m',
  STRIPE_PRICE_BUSINESS_YEARLY: 'price_biz_y',
}

let saved
beforeEach(() => {
  saved = {}
  for (const [k, v] of Object.entries(ENV)) { saved[k] = process.env[k]; process.env[k] = v }
})
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v
  }
})

describe('priceIdFor', () => {
  it('résout chaque combinaison palier × périodicité', () => {
    expect(priceIdFor('pro', 'month')).toBe('price_pro_m')
    expect(priceIdFor('pro', 'year')).toBe('price_pro_y')
    expect(priceIdFor('elite', 'month')).toBe('price_elite_m')
    expect(priceIdFor('elite', 'year')).toBe('price_elite_y')
    expect(priceIdFor('business', 'month')).toBe('price_biz_m')
    expect(priceIdFor('business', 'year')).toBe('price_biz_y')
  })

  it('renvoie null sur un palier inconnu — jamais un prix par défaut', () => {
    // Retomber sur un prix quelconque ferait payer le mauvais montant en silence.
    expect(priceIdFor('enterprise', 'month')).toBeNull()
    expect(priceIdFor('', 'month')).toBeNull()
    expect(priceIdFor(undefined, 'month')).toBeNull()
  })

  it('renvoie null quand la variable d env manque', () => {
    delete process.env.STRIPE_PRICE_PRO_MONTHLY
    expect(priceIdFor('pro', 'month')).toBeNull()
  })
})

describe('planFromPriceId', () => {
  it('fait l aller-retour avec priceIdFor', () => {
    for (const plan of ['pro', 'elite', 'business']) {
      for (const interval of ['month', 'year']) {
        expect(planFromPriceId(priceIdFor(plan, interval))).toBe(plan)
      }
    }
  })

  it('renvoie null sur un Price inconnu', () => {
    // Un abonnement créé à la main dans le Dashboard sur un Price hors catalogue
    // ne doit accorder AUCUN plan, pas le premier de la liste.
    expect(planFromPriceId('price_inconnu')).toBeNull()
    expect(planFromPriceId(null)).toBeNull()
    expect(planFromPriceId('')).toBeNull()
  })

  it('ne matche pas quand la variable d env est vide', () => {
    // Sans ce garde, priceId=undefined matcherait une env absente et accorderait
    // un plan payant à un abonnement vide.
    delete process.env.STRIPE_PRICE_ELITE_YEARLY
    expect(planFromPriceId(undefined)).toBeNull()
  })
})

describe('integrationIdentifier', () => {
  it('ajoute un suffixe de 8 lettres minuscules', () => {
    const id = integrationIdentifier()
    expect(id).toMatch(/^quantara-checkout-[a-z]{8}$/)
  })

  it('varie d un appel à l autre', () => {
    const ids = new Set(Array.from({ length: 25 }, () => integrationIdentifier()))
    expect(ids.size).toBeGreaterThan(20)
  })
})
