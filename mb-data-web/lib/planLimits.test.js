// lib/planLimits.test.js — la logique de droits d'accès.
//
// C'est le code qui décide qui a payé. Un faux négatif bloque un client payant,
// un faux positif donne le produit gratuitement : les deux sens comptent.

import { describe, it, expect } from 'vitest'
import { effectivePlan, getPlanLimits, hasFeature, isAtLimit, PLAN_LIMITS } from './planLimits'

const paid = (plan, status = 'active') => ({ plan, plan_status: status })

describe('effectivePlan', () => {
  it('retombe sur free quand le profil est absent ou vide', () => {
    expect(effectivePlan(null)).toBe('free')
    expect(effectivePlan(undefined)).toBe('free')
    expect(effectivePlan({})).toBe('free')
  })

  it('rend le palier payé quand l abonnement est actif', () => {
    expect(effectivePlan(paid('pro'))).toBe('pro')
    expect(effectivePlan(paid('elite'))).toBe('elite')
    expect(effectivePlan(paid('business'))).toBe('business')
  })

  it('garde l acces pendant l essai', () => {
    expect(effectivePlan(paid('pro', 'trialing'))).toBe('pro')
  })

  it('garde l acces en past_due — la relance tourne encore', () => {
    // Couper au premier echec de paiement transforme une carte expiree en churn.
    expect(effectivePlan(paid('pro', 'past_due'))).toBe('pro')
  })

  it('coupe l acces sur les statuts terminaux', () => {
    for (const s of ['canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused']) {
      expect(effectivePlan(paid('elite', s))).toBe('free')
    }
  })

  it('coupe l acces quand le statut est absent', () => {
    // Un plan pose sans statut ne doit rien ouvrir : c'est le cas d'une ecriture
    // partielle ou d'une tentative de falsification.
    expect(effectivePlan({ plan: 'elite' })).toBe('free')
  })

  it('rejette un palier inconnu', () => {
    expect(effectivePlan(paid('enterprise'))).toBe('free')
    expect(effectivePlan(paid('admin'))).toBe('free')
  })

  it('le grandfather beta prime sur tout le reste', () => {
    expect(effectivePlan({ beta_grandfather: true })).toBe('beta')
    expect(effectivePlan({ beta_grandfather: true, plan: 'free', plan_status: 'canceled' })).toBe('beta')
  })
})

describe('getPlanLimits', () => {
  it('plafonne le palier free', () => {
    const l = getPlanLimits(null)
    expect(l.maxFirms).toBe(1)
    expect(l.maxTradesPerMonth).toBe(20)
    expect(l.csvImport).toBe(false)
  })

  it('deplafonne les paliers payants', () => {
    for (const p of ['pro', 'elite', 'business']) {
      const l = getPlanLimits(paid(p))
      expect(l.maxFirms).toBeNull()
      expect(l.maxTradesPerMonth).toBeNull()
    }
  })

  it('donne un beta illimite sans lui donner les features payantes', () => {
    const l = getPlanLimits({ beta_grandfather: true })
    expect(l.maxFirms).toBeNull()
    expect(l.maxTradesPerMonth).toBeNull()
    // Le beta garde le Free deplafonne, pas le Pro : la sync broker reste payante.
    expect(l.brokerSync).toBe(false)
  })

  it('reserve l AI Coach a Elite et Business', () => {
    expect(hasFeature(paid('pro'), 'aiCoach')).toBe(false)
    expect(hasFeature(paid('elite'), 'aiCoach')).toBe(true)
    expect(hasFeature(paid('business'), 'aiCoach')).toBe(true)
  })

  it('les paliers montent en seats sans jamais redescendre', () => {
    const seats = ['free', 'pro', 'elite', 'business'].map((p) => PLAN_LIMITS[p].seats)
    expect(seats).toEqual([...seats].sort((a, b) => a - b))
  })
})

describe('isAtLimit', () => {
  it('bloque exactement AU plafond, pas apres', () => {
    // Le free a droit a 1 firme : avec 0 il peut creer, avec 1 il est bloque.
    expect(isAtLimit(null, 'maxFirms', 0)).toBe(false)
    expect(isAtLimit(null, 'maxFirms', 1)).toBe(true)
    expect(isAtLimit(null, 'maxFirms', 2)).toBe(true)
  })

  it('ne bloque jamais un plafond null (illimite)', () => {
    expect(isAtLimit(paid('pro'), 'maxFirms', 10_000)).toBe(false)
    expect(isAtLimit({ beta_grandfather: true }, 'maxTradesPerMonth', 10_000)).toBe(false)
  })

  it('ne bloque pas sur une cle inconnue', () => {
    expect(isAtLimit(null, 'maxWidgets', 999)).toBe(false)
  })

  it('bloque un abonnement resilie comme un free', () => {
    expect(isAtLimit(paid('elite', 'canceled'), 'maxFirms', 1)).toBe(true)
  })
})
