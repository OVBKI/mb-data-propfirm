import { describe, it, expect } from 'vitest'
import { computeBudget, normalizeAnswers, isAnswered, spentInMonthEUR, medianChallengeEUR, emptyAnswers } from './budgetCalculator'

// Une situation saine : 3 000 d'entrées, 1 800 de charges, épargne de précaution complète.
const base = {
  currency: 'EUR', income: 3000, fixed: 1200, living: 600, debt: 0,
  savings: 20000, dependents: 0, stability: 'stable', experience: 'intermediate',
}

describe('computeBudget — le cas nominal', () => {
  it('soft = 10 % du reste à vivre, agressive = 25 %, arrondis au multiple de 5 inférieur', () => {
    const r = computeBudget(base)
    expect(r.disposable).toBe(1200)
    expect(r.soft.monthly).toBe(120)
    expect(r.aggressive.monthly).toBe(300)
  })
  it('l\'agressive dépasse toujours la soft', () => {
    for (const exp of ['beginner', 'intermediate', 'funded']) {
      for (const st of ['stable', 'variable', 'none']) {
        const r = computeBudget({ ...base, experience: exp, stability: st, savings: 5000 })
        expect(r.aggressive.monthly).toBeGreaterThanOrEqual(r.soft.monthly)
      }
    }
  })
  it('l\'enveloppe de départ ne vient que de l\'épargne AU-DELÀ de la précaution', () => {
    const r = computeBudget(base)
    expect(r.safetyTarget).toBe(1800 * 3)
    expect(r.surplusSavings).toBe(20000 - 5400)
    expect(r.soft.oneOff).toBe(730)        // 5 % de 14 600
    expect(r.aggressive.oneOff).toBe(2190) // 15 % de 14 600
    expect(r.aggressive.yearly).toBe(300 * 12 + 2190)
  })
  it('n\'affiche jamais un plafond plus haut que le calcul', () => {
    const r = computeBudget({ ...base, income: 3007 })
    expect(r.soft.monthly % 5).toBe(0)
    expect(r.soft.monthly).toBeLessThanOrEqual(r.disposable * 0.10)
  })
})

describe('computeBudget — les garde-fous', () => {
  it('charges supérieures aux entrées : rien à investir, dans les deux approches', () => {
    const r = computeBudget({ ...base, income: 1700 })
    expect(r.verdict).toBe('deficit')
    expect(r.soft.monthly).toBe(0)
    expect(r.aggressive.monthly).toBe(0)
    expect(r.aggressive.oneOff).toBe(0)
  })
  it('sans entrée d\'argent : rien', () => {
    expect(computeBudget({ ...base, income: 0 }).verdict).toBe('noIncome')
  })
  it('épargne de précaution à moins de moitié : soft à zéro, agressive réduite mais non nulle', () => {
    const r = computeBudget({ ...base, savings: 2000 }) // 2 000 / 5 400 = 37 %
    expect(r.soft.monthly).toBe(0)
    expect(r.aggressive.monthly).toBeGreaterThan(0)
    expect(r.aggressive.monthly).toBeLessThan(300)
    expect(r.warnings).toContain('safetyMissing')
    expect(r.safetyMissing).toBe(3400)
  })
  it('endettement au-dessus de 33 % : la soft ne propose rien', () => {
    const r = computeBudget({ ...base, income: 4000, fixed: 800, living: 600, debt: 1400 })
    expect(r.debtRatio).toBeCloseTo(0.35)
    expect(r.soft.monthly).toBe(0)
    expect(r.aggressive.monthly).toBeGreaterThan(0)
    expect(r.warnings).toContain('debtHigh')
  })
  it('revenus irréguliers et personnes à charge allongent l\'épargne de précaution', () => {
    const r = computeBudget({ ...base, stability: 'none', dependents: 2 })
    expect(r.safetyMonths).toBe(9 + 2)
    expect(r.warnings).toContain('irregular')
  })
  it('chaque coefficient appliqué est rendu, pour expliquer le chiffre', () => {
    const r = computeBudget(base)
    expect(r.soft.factors.map((f) => f.key)).toEqual(['rate', 'stability', 'dependents', 'experience', 'debt', 'safety'])
    const product = r.aggressive.factors.reduce((m, f) => m * f.value, 1)
    expect(r.aggressive.share).toBeCloseTo(product)
  })
})

describe('computeBudget — ce mois-ci et nombre de challenges', () => {
  it('reste du mois et nombre de challenges au prix donné', () => {
    const r = computeBudget(base, { avgChallenge: 100, spentThisMonth: 180 })
    expect(r.aggressive.challenges).toBe(3)
    expect(r.aggressive.remaining).toBe(120)
    expect(r.soft.remaining).toBe(0)
    expect(r.soft.overspent).toBe(60)
    expect(r.aggressive.pauseAfter).toBe(900)
  })
  it('sous le prix d\'un challenge, le plafond devient un rythme', () => {
    const r = computeBudget(base, { avgChallenge: 143 })
    expect(r.soft.monthly).toBe(120)
    expect(r.soft.challenges).toBe(0)
    expect(r.soft.monthsPerChallenge).toBe(2)
    expect(r.aggressive.monthsPerChallenge).toBeNull()
  })
  it('sans prix de référence, pas de nombre de challenges inventé', () => {
    expect(computeBudget(base).soft.challenges).toBeNull()
  })
})

describe('réponses', () => {
  it('normalise les montants saisis (virgule, vide, négatif)', () => {
    const a = normalizeAnswers({ income: '2500,50', fixed: '', debt: '-20', stability: 'bizarre', dependents: '7' })
    expect(a.income).toBe(2500.5)
    expect(a.fixed).toBe(0)
    expect(a.debt).toBe(0)
    expect(a.stability).toBe('variable')
    expect(a.dependents).toBe(3)
  })
  it('isAnswered : 0 est une réponse valable sauf pour les entrées d\'argent', () => {
    const a = { ...emptyAnswers(), income: '0', debt: '0', dependents: 0 }
    expect(isAnswered('income', a)).toBe(false)
    expect(isAnswered('debt', a)).toBe(true)
    expect(isAnswered('fixed', a)).toBe(false)
    expect(isAnswered('dependents', a)).toBe(true)
    expect(isAnswered('stability', a)).toBe(false)
  })
})

describe('données des comptes', () => {
  const rates = { EUR: 1, USD: 0.9 }
  const toEUR = (amount, cur, r) => amount * (r[cur] || 1)
  const firms = [{ accounts: [
    { spent: 100, currency: 'USD', payment_mode: 'onetime', buy_date: '2026-11-03' },
    { spent: 50, currency: 'EUR', payment_mode: 'monthly', months_count: 3, buy_date: '2026-09-10' },
    { spent: 300, currency: 'EUR', payment_mode: 'onetime', buy_date: '2026-06-01', activation_fee: 40, activation_date: '2026-11-15' },
  ] }]
  it('additionne les achats, échéances d\'abonnement et activations du mois', () => {
    // 90 (100 $) + 50 (3e échéance de l'abonnement, en novembre) + 40 d'activation
    expect(spentInMonthEUR(firms, toEUR, rates, new Date(2026, 10, 20))).toBeCloseTo(180)
  })
  it('prix médian d\'un challenge, null sans compte', () => {
    expect(medianChallengeEUR(firms, toEUR, rates)).toBe(90)
    expect(medianChallengeEUR([], toEUR, rates)).toBeNull()
  })
})
