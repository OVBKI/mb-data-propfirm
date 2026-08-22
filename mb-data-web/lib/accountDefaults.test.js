// lib/accountDefaults.test.js — ce que l'app déduit d'un compte.
//
// L'enjeu : l'assistant AFFICHE ces valeurs comme des faits (« 50K · 49 $ ·
// DD 2 000 $ »). Un défaut faux n'est plus un champ pré-rempli qu'on corrige,
// c'est une information fausse sur laquelle l'utilisateur décide.

import { describe, it, expect } from 'vitest'
import {
  accountDefaults, planChoices, buildAccountForm,
  generateAccountNames, suggestProfitSplit,
} from './accountDefaults'
import { plansForFirm } from './constants'

describe('accountDefaults', () => {
  it('déduit les chiffres réels dun plan connu', () => {
    const d = accountDefaults('Topstep', '50k')
    expect(d.price).toBe(49)
    expect(d.maxDrawdown).toBe(2000)
    expect(d.payoutTarget).toBe(53000)
    expect(d.profitSplit).toBe(90)
    expect(d.planSizeNum).toBe(50000)
  })

  it('rend null — pas 0 — sur une firme inconnue', () => {
    // Un objectif de payout à 0 serait FAUX ; une absence ne l'est pas. C'est
    // ce qui permet à l'assistant de n'afficher que les lignes qu'il connaît.
    const d = accountDefaults('Firme Inventée', '50k')
    expect(d.price).toBeNull()
    expect(d.maxDrawdown).toBeNull()
    expect(d.payoutTarget).toBeNull()
  })

  it('garde un partage utilisable même sans règle', () => {
    // Le partage est le seul défaut qui ne peut pas être vide : il sert au
    // calcul du net d'un payout.
    expect(accountDefaults('Firme Inventée', '50k').profitSplit).toBe(90)
  })
})

describe('suggestProfitSplit', () => {
  it('arrondit aux paliers que les firmes pratiquent', () => {
    // 87 % ou 88 % n'existent pas dans un contrat : afficher le chiffre brut
    // ferait douter d'une donnée pourtant juste.
    expect(suggestProfitSplit('Topstep', '50k')).toBe(90)
    expect([70, 80, 90, 100]).toContain(suggestProfitSplit('Apex Trader Funding', '50k'))
  })
})

describe('planChoices', () => {
  it('couvre tous les plans de la firme', () => {
    const choices = planChoices('Topstep')
    expect(choices.map(c => c.plan)).toEqual(plansForFirm('Topstep'))
    expect(choices.every(c => c.profitSplit > 0)).toBe(true)
  })

  it('rend des choix même pour une firme hors catalogue', () => {
    // Saisir un nom libre ne doit pas mener à une étape vide et bloquante.
    expect(planChoices('Firme Inventée').length).toBeGreaterThan(0)
  })
})

describe('buildAccountForm', () => {
  it('produit des CHAÎNES, pas des nombres', () => {
    // Ce sont des valeurs d'<input> : un nombre y déclencherait le warning
    // React de champ non contrôlé au premier effacement.
    const f = buildAccountForm('Topstep', '50k')
    expect(typeof f.spent).toBe('string')
    expect(typeof f.payoutTarget).toBe('string')
    expect(f.spent).toBe('49')
  })

  it('traduit un inconnu en chaîne VIDE, jamais en "null"', () => {
    const f = buildAccountForm('Firme Inventée', '50k')
    expect(f.spent).toBe('')
    expect(f.payoutTarget).toBe('')
  })

  it('accepte des surcharges', () => {
    const f = buildAccountForm('Topstep', '50k', { status: 'Financé', currency: 'EUR' })
    expect(f.status).toBe('Financé')
    expect(f.currency).toBe('EUR')
    expect(f.spent).toBe('49')   // le reste du calcul survit à la surcharge
  })

  it('porte tous les champs attendus par saveAccount', () => {
    const f = buildAccountForm('Topstep', '50k')
    for (const k of [
      'buyDate', 'currency', 'spent', 'activationFee', 'activationDate', 'status',
      'notes', 'planSize', 'name', 'ddType', 'payoutTarget', 'minTradingDays',
      'minDailyProfit', 'profitSplit', 'paymentMode', 'quantity', 'customDrawdown',
    ]) expect(f, k).toHaveProperty(k)
  })
})

describe('generateAccountNames', () => {
  it('incrémente un suffixe numérique existant', () => {
    expect(generateAccountNames('LFF050-001', 3)).toEqual(['LFF050-001', 'LFF050-002', 'LFF050-003'])
  })

  it('en ajoute un quand il ny en a pas', () => {
    // Sans suffixe, trois comptes porteraient le même nom et seraient
    // indiscernables dans toutes les listes.
    expect(generateAccountNames('Compte', 2)).toEqual(['Compte-001', 'Compte-002'])
  })

  it('garde des noms vides si aucun nom nest donné', () => {
    expect(generateAccountNames('', 2)).toEqual(['', ''])
    expect(generateAccountNames('   ', 2)).toEqual(['', ''])
  })

  it('rend toujours au moins une entrée', () => {
    expect(generateAccountNames('X', 0)).toHaveLength(1)
    expect(generateAccountNames('X', 'nope')).toHaveLength(1)
  })

  it('respecte la largeur du padding dorigine', () => {
    expect(generateAccountNames('A-08', 3)).toEqual(['A-08', 'A-09', 'A-10'])
  })
})
