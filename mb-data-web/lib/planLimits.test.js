// lib/planLimits.test.js — la logique de droits d'accès.
//
// C'est le code qui décide qui a payé. Un faux négatif bloque un client payant,
// un faux positif donne le produit gratuitement : les deux sens comptent.

import { describe, it, expect } from 'vitest'
import { effectivePlan, getPlanLimits, hasFeature, isAtLimit, PLAN_LIMITS, parsePlanLimitError, planLimitMessage } from './planLimits'

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

describe('refus venant de la base', () => {
  // Les plafonds sont appliqués par des triggers Postgres : la création part du
  // navigateur en direct, il n'y a pas de route API à intercepter. Le trigger
  // lève `PLAN_LIMIT_REACHED:<clé>:<plafond>` et le client doit le traduire.
  const dbError = (key, n) => ({
    message: `PLAN_LIMIT_REACHED:${key}:${n}`,
    code: '23514',
  })

  it('extrait la clé et le plafond du message Postgres', () => {
    expect(parsePlanLimitError(dbError('maxFirms', 1))).toEqual({ key: 'maxFirms', limit: 1 })
    expect(parsePlanLimitError(dbError('maxTradesPerMonth', 20)))
      .toEqual({ key: 'maxTradesPerMonth', limit: 20 })
  })

  it('lit aussi bien un objet erreur qu une chaîne brute', () => {
    expect(parsePlanLimitError('PLAN_LIMIT_REACHED:maxAccounts:3'))
      .toEqual({ key: 'maxAccounts', limit: 3 })
  })

  it('ignore les erreurs qui ne sont pas des quotas', () => {
    // Sans ça, une panne réseau s'afficherait comme une invitation à payer.
    expect(parsePlanLimitError({ message: 'network error' })).toBeNull()
    expect(parsePlanLimitError({ message: 'duplicate key value' })).toBeNull()
    expect(parsePlanLimitError(null)).toBeNull()
    expect(parsePlanLimitError(undefined)).toBeNull()
    expect(parsePlanLimitError({})).toBeNull()
  })

  it('rend un message citant le vrai plafond, dans les deux langues', () => {
    expect(planLimitMessage(dbError('maxFirms', 1), 'fr')).toContain('1 PropFirm')
    expect(planLimitMessage(dbError('maxTradesPerMonth', 20), 'fr')).toContain('20 trades')
    expect(planLimitMessage(dbError('maxAccounts', 3), 'en')).toContain('3 accounts')
  })

  it('renvoie null quand ce n est pas un quota — l appelant garde son message', () => {
    expect(planLimitMessage({ message: 'boom' })).toBeNull()
  })

  it('dégrade proprement sur une clé de quota inconnue', () => {
    expect(planLimitMessage(dbError('maxWidgets', 5), 'fr')).toBeTruthy()
  })

  it('les plafonds annoncés par la base correspondent à PLAN_LIMITS', () => {
    // Le SQL duplique nécessairement ces chiffres (les triggers ne peuvent pas
    // importer le JS). Ce test fige la valeur côté application : si quelqu'un la
    // change ici sans toucher supabase-schema.sql, il le voit tout de suite.
    expect(PLAN_LIMITS.free.maxFirms).toBe(1)
    expect(PLAN_LIMITS.free.maxAccounts).toBe(3)
    expect(PLAN_LIMITS.free.maxTradesPerMonth).toBe(20)
  })
})
