// lib/accountDefaults.test.js — ce que l'app déduit d'un compte.
//
// L'enjeu : l'assistant AFFICHE ces valeurs comme des faits (« 50K · 49 $ ·
// DD 2 000 $ »). Un défaut faux n'est plus un champ pré-rempli qu'on corrige,
// c'est une information fausse sur laquelle l'utilisateur décide.

import { describe, it, expect } from 'vitest'
import {
  accountDefaults,
  planChoices,
  buildAccountForm,
  generateAccountNames,
  suggestProfitSplit,
  programChoices,
  plansForProgram,
  programSummaries,
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

// ── Type de compte (programme) ───────────────────────────────────────────────
// Beaucoup de firmes vendent plusieurs programmes sous la même taille. Sans ce
// choix, on servait le programme principal à tout le monde : un porteur de
// compte Apex legacy voyait le drawdown 4.0, faux de 50 %.
describe('programChoices', () => {
  it('liste les programmes réellement disponibles à CETTE taille', () => {
    expect(programChoices('Apex Trader Funding', '50k').map(p => p.program))
      .toEqual(['EOD', 'Intraday', 'Legacy'])
    // Apex ne vend plus de 75K : seul un compte legacy peut en porter un.
    expect(programChoices('Apex Trader Funding', '75k').map(p => p.program))
      .toEqual(['Legacy'])
    // FundedNext n'a que Flex en 150K, et pas de Flex en 25K.
    expect(programChoices('FundedNext Futures', '150k').map(p => p.program))
      .toEqual(['Flex'])
    expect(programChoices('FundedNext Futures', '25k').map(p => p.program))
      .not.toContain('Flex')
  })

  it('chaque programme porte SES valeurs, pas celles du programme principal', () => {
    const byName = Object.fromEntries(
      programChoices('Apex Trader Funding', '150k').map(p => [p.program, p])
    )
    expect(byName['EOD'].maxDrawdown).toBe(4000)
    expect(byName['Legacy'].maxDrawdown).toBe(5000)
    expect(byName['EOD'].price).toBe(1490)
    expect(byName['Intraday'].price).toBe(599)
  })

  it('rend un tableau vide sans firme ou sans plan', () => {
    expect(programChoices(null, '50k')).toEqual([])
    expect(programChoices('Topstep', null)).toEqual([])
  })
})

describe('buildAccountForm avec un programme', () => {
  it('inscrit le programme dans le formulaire et pré-remplit à partir de LUI', () => {
    const legacy = buildAccountForm('Apex Trader Funding', '150k', {}, 'Legacy')
    expect(legacy.program).toBe('Legacy')
    expect(legacy.spent).toBe('397')

    const eod = buildAccountForm('Apex Trader Funding', '150k', {}, 'EOD')
    expect(eod.program).toBe('EOD')
    expect(eod.spent).toBe('1490')
  })

  it('sans programme, le champ reste une chaîne VIDE (pas "null")', () => {
    // Le formulaire alimente des <input> : un null y deviendrait le texte "null",
    // et partirait tel quel en base.
    expect(buildAccountForm('Topstep', '50k').program).toBe('')
  })
})

// ── Le programme est choisi AVANT la taille ─────────────────────────────────
// C'est lui qui détermine les tailles disponibles : dans l'autre sens, la liste
// des tailles mélangeait les prix de deux générations d'offres Apex.
describe('plansForProgram', () => {
  it('restreint les tailles à celles où le programme est vendu', () => {
    expect(plansForProgram('Apex Trader Funding', 'EOD')).toEqual(['25k', '50k', '100k', '150k'])
    expect(plansForProgram('Apex Trader Funding', 'Legacy'))
      .toEqual(['25k', '50k', '75k', '100k', '150k', '250k', '300k'])
    expect(plansForProgram('FundedNext Futures', 'Flex')).toEqual(['50k', '100k', '150k'])
    expect(plansForProgram('Phidias Propfirm', 'Fundamental')).toEqual(['50k', '100k', '150k'])
    expect(plansForProgram('Phidias Propfirm', 'E2L')).toEqual(['25k', '50k', '100k', '150k'])
  })

  it('sans programme, rend toutes les tailles de la firme', () => {
    expect(plansForProgram('Apex Trader Funding', null)).toEqual(plansForFirm('Apex Trader Funding'))
  })

  it('ne vide JAMAIS la liste sur un programme inconnu', () => {
    // Une liste vide bloquerait la création de compte. Mieux vaut tout proposer.
    expect(plansForProgram('Apex Trader Funding', 'Programme Inexistant').length).toBeGreaterThan(0)
  })
})

describe('programSummaries', () => {
  it('rend une FOURCHETTE, pas les chiffres d’une seule taille', () => {
    // À l'étape « type de compte » aucune taille n'est encore choisie : citer
    // celle du plus petit compte se lirait comme « le prix du programme ».
    const byName = Object.fromEntries(
      programSummaries('Apex Trader Funding').map(p => [p.program, p])
    )
    expect(byName['EOD'].drawdown).toEqual({ lo: 1000, hi: 4000, same: false })
    expect(byName['Legacy'].drawdown).toEqual({ lo: 1500, hi: 7500, same: false })
    expect(byName['Intraday'].price).toEqual({ lo: 167, hi: 599, same: false })
    expect(byName['Legacy'].plans).toContain('300k')
    expect(byName['EOD'].plans).not.toContain('300k')
  })

  it('marque same:true quand toutes les tailles partagent la valeur', () => {
    const s = programSummaries('Apex Trader Funding')[0]
    expect(s.drawdown.same).toBe(false)
    expect(typeof s.profitSplit).toBe('number')
  })

  it('rend un tableau vide sans firme', () => {
    expect(programSummaries(null)).toEqual([])
  })
})
