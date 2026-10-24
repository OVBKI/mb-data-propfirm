import { describe, it, expect } from 'vitest'
import { accountCashflows, firmEconomics, wasFunded } from './firmEconomics'

describe('accountCashflows', () => {
  it('un abonnement mensuel compte chaque échéance', () => {
    const c = accountCashflows({ spent: 49, buy_date: '2026-01-31', payment_mode: 'monthly', months_count: 3, currency: 'USD' })
    expect(c.map((x) => x.kind)).toEqual(['purchase', 'renewal', 'renewal'])
    expect(c[1].date.slice(0, 7)).toBe('2026-03')
  })
  it('activation et payouts', () => {
    const c = accountCashflows({ spent: 100, buy_date: '2026-01-01', activation_fee: 149, activation_date: '2026-02-01', payouts: [{ date: '2026-03-01', amount: 1000 }] })
    expect(c.find((x) => x.kind === 'activation').amount).toBe(149)
    expect(c.find((x) => x.kind === 'payout').amount).toBe(1000)
  })
})

describe('firmEconomics', () => {
  const firms = [
    { id: 1, name: 'Topstep', accounts: [
      { status: 'Échoué', spent: 49, buy_date: '2026-01-01' },
      { status: 'Échoué', spent: 49, buy_date: '2026-02-01' },
      { status: 'Financé', spent: 49, buy_date: '2026-03-01', funded_date: '2026-03-21', activation_fee: 149, payouts: [{ date: '2026-04-10', amount: 500 }] },
      { status: 'Challenge', spent: 49, buy_date: '2026-04-01' },
    ] },
    { id: 2, name: 'Apex', accounts: [{ status: 'Challenge', spent: 30, buy_date: '2026-04-01' }] },
  ]
  const rows = firmEconomics(firms)
  const top = rows.find((r) => r.firm === 'Topstep')
  it('coût par financé = tout ce qui a été dépensé chez la firm ÷ financés', () => {
    expect(top.spent).toBe(49 * 4 + 149)
    expect(top.costPerFunded).toBe(49 * 4 + 149)
  })
  it('taux de réussite sur les évaluations terminées seulement', () => {
    expect(top.passRate).toBeCloseTo(1 / 3)
  })
  it('délai moyen et net', () => {
    expect(top.avgDaysToFunded).toBe(20)
    expect(top.net).toBe(500 - (49 * 4 + 149))
  })
  it('une firm sans financé n’a pas de coût par financé et passe en dernier', () => {
    expect(rows[rows.length - 1].firm).toBe('Apex')
    expect(rows[rows.length - 1].costPerFunded).toBeNull()
  })
  it('un compte financé puis cramé reste compté comme financé', () => {
    expect(wasFunded({ status: 'Échoué', funded_date: '2026-01-01' })).toBe(true)
  })
  it('conversion de devise appliquée', () => {
    const r = firmEconomics(firms, (x) => x * 2)
    expect(r.find((x) => x.firm === 'Apex').spent).toBe(60)
  })
})
