import { describe, it, expect } from 'vitest'
import { cashflowLines, niceScale, labelIndexes } from './cashflowChart'

const rows = [
  { payout: 0, spent: 300 },
  { payout: 0, spent: 150 },
  { payout: 1200, spent: 0 },
  { payout: 500, spent: 300 },
]

describe('cashflowLines', () => {
  it('cumule payouts, dépenses et net depuis le début de la période', () => {
    const r = cashflowLines(rows, true)
    expect(r.payout).toEqual([0, 0, 1200, 1700])
    expect(r.spent).toEqual([300, 450, 450, 750])
    expect(r.net).toEqual([-300, -450, 750, 950])
    expect(r.totals).toEqual({ payout: 1700, spent: 750, net: 950 })
  })
  it('mois par mois, chaque point est le montant du mois', () => {
    const r = cashflowLines(rows, false)
    expect(r.payout).toEqual([0, 0, 1200, 500])
    expect(r.net).toEqual([-300, -150, 1200, 200])
    // Les totaux de la légende ne dépendent pas du mode d'affichage.
    expect(r.totals.net).toBe(950)
  })
  it('accepte une série vide', () => {
    expect(cashflowLines([], true)).toEqual({ payout: [], spent: [], net: [], totals: { payout: 0, spent: 0, net: 0 } })
  })
})

describe('niceScale', () => {
  it('garde zéro dans l\'axe et arrondit les bornes au pas', () => {
    const s = niceScale([-450, 1700, 750])
    expect(s.min).toBeLessThanOrEqual(-450)
    expect(s.max).toBeGreaterThanOrEqual(1700)
    expect(s.ticks).toContain(0)
    expect(s.ticks[0]).toBe(s.min)
    expect(s.ticks.at(-1)).toBe(s.max)
  })
  it('un axe tout positif part de zéro', () => {
    expect(niceScale([120, 980]).min).toBe(0)
  })
  it('des valeurs toutes nulles donnent quand même un axe utilisable', () => {
    const s = niceScale([0, 0])
    expect(s.max).toBeGreaterThan(s.min)
  })
  it('aucune graduation à rallonge du type 0,30000000000000004', () => {
    for (const v of niceScale([0.1, 0.3]).ticks) expect(String(v).length).toBeLessThan(8)
  })
})

describe('labelIndexes', () => {
  it('étiquette toujours le dernier mois et en écrit au plus 8', () => {
    const idx = labelIndexes(36, 8)
    expect(idx.at(-1)).toBe(35)
    expect(idx.length).toBeLessThanOrEqual(8)
    expect(labelIndexes(7, 8)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(labelIndexes(0)).toEqual([])
  })
})
