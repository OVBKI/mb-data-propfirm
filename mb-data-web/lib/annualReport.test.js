import { describe, it, expect } from 'vitest'
import { annualReport, reportYears } from './annualReport'

const firms = [
  { name: 'Topstep', accounts: [
    { name: 'XFA 1', currency: 'USD', spent: 49, buy_date: '2025-11-15', payment_mode: 'monthly', months_count: 3,
      activation_fee: 149, activation_date: '2026-01-20', payouts: [{ date: '2026-02-10', amount: 1200 }] },
  ] },
  { name: 'FTMO', accounts: [{ name: 'Swing', currency: 'EUR', spent: 155, buy_date: '2026-03-01' }] },
]

describe('annualReport', () => {
  it('liste les années qui ont des flux', () => {
    expect(reportYears(firms)).toEqual([2026, 2025])
  })
  it('ne garde que les flux de l’année demandée', () => {
    const { lines } = annualReport(firms, 2026)
    // échéance de janvier, activation, payout, achat FTMO
    expect(lines.map((l) => l.kind)).toEqual(['renewal', 'activation', 'payout', 'purchase'])
  })
  it('récapitulatif par firm et par devise, sans conversion', () => {
    const { summary } = annualReport(firms, 2026)
    const top = summary.find((s) => s.firm === 'Topstep')
    expect(top).toMatchObject({ currency: 'USD', fees: 49 + 149, payouts: 1200 })
    expect(summary.find((s) => s.firm === 'FTMO').currency).toBe('EUR')
  })
  it('le CSV porte l’avertissement et un total par devise', () => {
    const { csv } = annualReport(firms, 2026, { lang: 'en' })
    expect(csv).toMatch(/not a tax document/)
    expect(csv).toMatch(/TOTAL,USD,198.00,1200.00,1002.00/)
    expect(csv).toMatch(/TOTAL,EUR,155.00,0.00,-155.00/)
  })
  it('les frais sont négatifs dans le détail', () => {
    const { csv } = annualReport(firms, 2026)
    expect(csv).toMatch(/2026-03-01,FTMO,Swing,Achat,-155.00,EUR/)
  })
})
