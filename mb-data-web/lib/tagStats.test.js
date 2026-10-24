import { describe, it, expect } from 'vitest'
import { tagStats, UNTAGGED } from './tagStats'

describe('tagStats', () => {
  const trades = [
    { pnl: 300, tags: ['orb', 'a-plus'], entry_price: 100, exit_price: 103, stop_loss: 99, side: 'Long' },
    { pnl: -100, tags: ['orb'], entry_price: 100, exit_price: 99, stop_loss: 99, side: 'Long' },
    { pnl: 50, tags: [] },
    { pnl: -20, tags: ['revenge'] },
  ]
  const by = Object.fromEntries(tagStats(trades).map((s) => [s.tag, s]))
  it('un trade compte dans chacun de ses tags', () => {
    expect(by.orb.count).toBe(2)
    expect(by['a-plus'].count).toBe(1)
  })
  it('taux de réussite, total et espérance', () => {
    expect(by.orb.winRate).toBe(0.5)
    expect(by.orb.total).toBe(200)
    expect(by.orb.expectancy).toBe(100)
  })
  it('R moyen sur les trades où il est calculable', () => {
    expect(by.orb.avgR).toBeCloseTo((3 + -1) / 2)
    expect(by.revenge.avgR).toBeNull()
  })
  it('les trades sans tag ont leur ligne', () => {
    expect(by[UNTAGGED].count).toBe(1)
  })
  it('trié du plus rentable au moins rentable', () => {
    expect(tagStats(trades)[0].tag).toBe('a-plus')
  })
})
