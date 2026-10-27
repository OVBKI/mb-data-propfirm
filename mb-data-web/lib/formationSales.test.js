import { describe, it, expect } from 'vitest'
import {
  addMonths, addDays, buildSchedule, feesTotal, saleError, saleSummary,
  portfolioTotals, monthGrid, calendarItems, monthTotals, isISODate, todayLocalISO,
} from './formationSales'

describe('dates', () => {
  it('addMonths garde le jour et le ramène au dernier jour du mois', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15')
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28')
  })
  it('addDays traverse les mois et les années', () => {
    expect(addDays('2026-12-25', 14)).toBe('2027-01-08')
  })
  it('isISODate refuse les dates impossibles', () => {
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('2026-02-28')).toBe(true)
    expect(isISODate('28/02/2026')).toBe(false)
  })
  it('todayLocalISO lit la date LOCALE, pas UTC', () => {
    expect(todayLocalISO(new Date(2026, 9, 27, 0, 30))).toBe('2026-10-27')
  })
})

describe('buildSchedule', () => {
  it('en une fois : une seule échéance du montant total', () => {
    expect(buildSchedule({ total: 1497, count: 1, firstDate: '2026-10-27' }))
      .toEqual([{ due_date: '2026-10-27', amount: 1497, paid_at: null }])
  })
  it('les centimes restants vont sur la dernière échéance, le total tombe juste', () => {
    const s = buildSchedule({ total: 1000, count: 3, firstDate: '2026-01-31' })
    expect(s.map((i) => i.amount)).toEqual([333.33, 333.33, 333.34])
    expect(s.map((i) => i.due_date)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
  })
  it('suit la périodicité choisie', () => {
    expect(buildSchedule({ total: 300, count: 3, firstDate: '2026-10-01', every: 'week' }).map((i) => i.due_date))
      .toEqual(['2026-10-01', '2026-10-08', '2026-10-15'])
    expect(buildSchedule({ total: 300, count: 2, firstDate: '2026-10-01', every: '2weeks' }).map((i) => i.due_date))
      .toEqual(['2026-10-01', '2026-10-15'])
  })
  it('rend une liste vide sans prix ou sans date', () => {
    expect(buildSchedule({ total: 0, count: 3, firstDate: '2026-10-01' })).toEqual([])
    expect(buildSchedule({ total: 100, count: 3, firstDate: '' })).toEqual([])
  })
})

describe('saleError', () => {
  const ok = { client_name: 'Jean', price: 900, sale_date: '2026-10-01', fees: [], installments: buildSchedule({ total: 900, count: 3, firstDate: '2026-10-01' }) }
  it('accepte une vente cohérente', () => expect(saleError(ok)).toBeNull())
  it('exige le client, un prix et une date', () => {
    expect(saleError({ ...ok, client_name: '  ' })).toMatch(/client/)
    expect(saleError({ ...ok, price: 0 })).toMatch(/prix/)
    expect(saleError({ ...ok, sale_date: '2026-02-30' })).toMatch(/date/)
  })
  it('refuse un échéancier dont le total diffère du prix, au centime près', () => {
    const bad = ok.installments.map((i, k) => (k === 0 ? { ...i, amount: 300.01 } : i))
    expect(saleError({ ...ok, installments: bad })).toMatch(/900\.01 € pour un prix de 900\.00/)
  })
  it('refuse un frais négatif et une échéance à zéro', () => {
    expect(saleError({ ...ok, fees: [{ label: 'x', amount: -5 }] })).toMatch(/négatif/)
    expect(saleError({ ...ok, installments: [...ok.installments, { due_date: '2026-12-01', amount: 0 }] })).toMatch(/supérieur à 0/)
  })
})

describe('saleSummary', () => {
  const sale = { price: 1200, fees: [{ label: 'Stripe', amount: 36.5 }, { label: 'Support', amount: 50 }] }
  const inst = [
    { id: 'c', due_date: '2026-12-01', amount: 400, paid_at: null },
    { id: 'a', due_date: '2026-10-01', amount: 400, paid_at: '2026-10-01' },
    { id: 'b', due_date: '2026-11-01', amount: 400, paid_at: null },
  ]
  it('reste à payer, prochain paiement obligatoire et retard', () => {
    const r = saleSummary(sale, inst, '2026-11-10')
    expect(r.paid).toBe(400)
    expect(r.remaining).toBe(800)
    expect(r.nextDue.id).toBe('b')           // le plus ancien non payé, même s'il n'est pas en tête de liste
    expect(r.nextDue.overdue).toBe(true)
    expect(r.nextDue.daysLeft).toBe(-9)
    expect(r.overdueCount).toBe(1)
    expect(r.overdueAmount).toBe(400)
    expect(r.status).toBe('late')
  })
  it('les frais se retranchent de ce que la vente rapporte', () => {
    const r = saleSummary(sale, inst, '2026-10-15')
    expect(r.fees).toBe(86.5)
    expect(r.net).toBe(1113.5)
    expect(r.netCollected).toBe(313.5)
    expect(r.status).toBe('ongoing')
  })
  it('paiement complet quand tout est payé', () => {
    const r = saleSummary(sale, inst.map((i) => ({ ...i, paid_at: '2026-12-01' })), '2027-01-01')
    expect(r.complete).toBe(true)
    expect(r.remaining).toBe(0)
    expect(r.nextDue).toBeNull()
    expect(r.status).toBe('complete')
  })
  it('une échéance due AUJOURD\'HUI n\'est pas encore en retard', () => {
    expect(saleSummary(sale, inst, '2026-11-01').nextDue.overdue).toBe(false)
  })
})

describe('portfolioTotals', () => {
  it('additionne toutes les ventes', () => {
    const sales = [{ id: 1, price: 500, fees: [{ amount: 20 }] }, { id: 2, price: 300, fees: [] }]
    const by = {
      1: [{ due_date: '2026-10-01', amount: 500, paid_at: '2026-10-01' }],
      2: [{ due_date: '2026-10-01', amount: 150, paid_at: null }, { due_date: '2026-12-01', amount: 150, paid_at: null }],
    }
    expect(portfolioTotals(sales, by, '2026-11-01')).toEqual({
      sold: 800, collected: 500, remaining: 300, overdue: 150, fees: 20, net: 780, count: 2, complete: 1, late: 1,
    })
  })
})

describe('calendrier', () => {
  it('monthGrid : 42 cases, lundi en premier', () => {
    const g = monthGrid(2026, 10) // le 1er octobre 2026 est un jeudi
    expect(g).toHaveLength(42)
    expect(g[0]).toEqual({ date: '2026-09-28', inMonth: false })
    expect(g[3]).toEqual({ date: '2026-10-01', inMonth: true })
    expect(g.filter((c) => c.inMonth)).toHaveLength(31)
  })
  it('calendarItems place la vente et chaque échéance avec son état', () => {
    const sales = [{ id: 's', client_name: 'Jean', price: 600, sale_date: '2026-10-01' }]
    const by = { s: [
      { id: 1, due_date: '2026-10-01', amount: 300, paid_at: '2026-10-01' },
      { id: 2, due_date: '2026-10-20', amount: 300, paid_at: null },
    ] }
    const items = calendarItems(sales, by, '2026-10-27')
    expect(items['2026-10-01'].map((i) => i.kind)).toEqual(['sale', 'installment'])
    expect(items['2026-10-20'][0].status).toBe('overdue')
    expect(monthTotals(items, '2026-10')).toEqual({ expected: 600, collected: 300, overdue: 300, sold: 600 })
    expect(monthTotals(items, '2026-11')).toEqual({ expected: 0, collected: 0, overdue: 0, sold: 0 })
  })
  it('feesTotal ignore une liste absente', () => {
    expect(feesTotal(null)).toBe(0)
    expect(feesTotal([{ amount: '10.10' }, { amount: 0.2 }])).toBe(10.3)
  })
})
