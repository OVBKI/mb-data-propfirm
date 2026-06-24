import { describe, it, expect } from 'vitest'
import { cfdMaxLoss, cfdDailyLoss } from './cfdDrawdown'

describe('cfdMaxLoss — static', () => {
  it('floor is initial minus loss amount, fixed', () => {
    const r = cfdMaxLoss({ initialBalance: 100000, currentEquity: 100000, maxLossPct: 10, basis: 'static' })
    expect(r.floor).toBe(90000)
    expect(r.lossAmount).toBe(10000)
    expect(r.usedPct).toBe(0) // at initial, nothing used
    expect(r.status).toBe('safe')
    expect(r.breached).toBe(false)
  })
  it('in profit consumes 0% (used clamped at 0)', () => {
    const r = cfdMaxLoss({ initialBalance: 100000, currentEquity: 108000, maxLossPct: 10, basis: 'static' })
    expect(r.usedPct).toBe(0)
    expect(r.buffer).toBe(18000) // 108000 - 90000
  })
  it('half-consumed → 50% and caution starts at 60%', () => {
    const r = cfdMaxLoss({ initialBalance: 100000, currentEquity: 95000, maxLossPct: 10, basis: 'static' })
    expect(r.usedPct).toBe(50)
    expect(r.status).toBe('safe')
  })
  it('breach at floor → 100% + breached', () => {
    const r = cfdMaxLoss({ initialBalance: 100000, currentEquity: 90000, maxLossPct: 10, basis: 'static' })
    expect(r.usedPct).toBe(100)
    expect(r.breached).toBe(true)
    expect(r.status).toBe('breached')
  })
})

describe('cfdMaxLoss — trailing-relative', () => {
  it('at start behaves like static (floor = initial - loss)', () => {
    const r = cfdMaxLoss({ initialBalance: 50000, currentEquity: 50000, highWater: 50000, maxLossPct: 6, basis: 'trailing-relative' })
    expect(r.floor).toBe(47000) // 50000 - 3000
  })
  it('trails up with the high-water before locking', () => {
    // hw 52000, loss 3000 → floor 49000 (still below initial 50000, so not yet locked)
    const r = cfdMaxLoss({ initialBalance: 50000, currentEquity: 51000, highWater: 52000, maxLossPct: 6, basis: 'trailing-relative' })
    expect(r.floor).toBe(49000)
  })
  it('locks at the initial balance once high-water exceeds initial + loss', () => {
    // hw 60000, loss 3000 → 57000 but capped at initial 50000
    const r = cfdMaxLoss({ initialBalance: 50000, currentEquity: 55000, highWater: 60000, maxLossPct: 6, basis: 'trailing-relative' })
    expect(r.floor).toBe(50000)
  })
  it('breaches relative to the trailed floor', () => {
    const r = cfdMaxLoss({ initialBalance: 50000, currentEquity: 49000, highWater: 52000, maxLossPct: 6, basis: 'trailing-relative' })
    expect(r.floor).toBe(49000)
    expect(r.breached).toBe(true)
    expect(r.usedPct).toBe(100)
  })
  it('treats highWater below initial as initial (never trails down)', () => {
    const r = cfdMaxLoss({ initialBalance: 50000, currentEquity: 50000, highWater: 40000, maxLossPct: 6, basis: 'trailing-relative' })
    expect(r.floor).toBe(47000) // hw floored to initial 50000
  })
})

describe('cfdDailyLoss', () => {
  it('balance basis: used measured from day-start balance, limit off initial', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 98000, dayStartBalance: 100000, dailyLossPct: 5, basis: 'balance' })
    expect(r.limit).toBe(5000)
    expect(r.used).toBe(2000)
    expect(r.usedPct).toBe(40)
    expect(r.status).toBe('safe')
  })
  it('breaches when the day loss reaches the limit', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 95000, dayStartBalance: 100000, dailyLossPct: 5, basis: 'balance' })
    expect(r.usedPct).toBe(100)
    expect(r.breached).toBe(true)
    expect(r.status).toBe('breached')
  })
  it('higher-of basis uses the larger of day-start balance/equity as anchor', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 99000, dayStartBalance: 100000, dayStartEquity: 101000, dailyLossPct: 5, basis: 'higher-of-balance-equity' })
    expect(r.anchor).toBe(101000)
    expect(r.used).toBe(2000) // 101000 - 99000
  })
  it('equity basis anchors on day-start equity', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 99000, dayStartBalance: 102000, dayStartEquity: 100000, dailyLossPct: 5, basis: 'equity' })
    expect(r.anchor).toBe(100000)
    expect(r.used).toBe(1000)
  })
  it('balance+intraday-profit expands the allowance by booked profit', () => {
    // base limit 5000 + 1000 booked = 6000 allowance
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 96000, dayStartBalance: 100000, intradayBookedProfit: 1000, dailyLossPct: 5, basis: 'balance+intraday-profit' })
    expect(r.limit).toBe(6000)
    expect(r.used).toBe(4000)
    expect(r.usedPct).toBeCloseTo(66.67, 1)
    expect(r.status).toBe('caution')
  })
  it('in profit on the day consumes 0%', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 101000, dayStartBalance: 100000, dailyLossPct: 5, basis: 'balance' })
    expect(r.usedPct).toBe(0)
  })
})

describe('cfd engine — invalid inputs', () => {
  it('returns unknown on non-positive initial', () => {
    expect(cfdMaxLoss({ initialBalance: 0, currentEquity: 0, maxLossPct: 10 }).status).toBe('unknown')
    expect(cfdDailyLoss({ initialBalance: 0, currentEquity: 0, dailyLossPct: 5 }).status).toBe('unknown')
  })
  it('returns unknown when equity is not finite', () => {
    expect(cfdMaxLoss({ initialBalance: 100000, currentEquity: NaN, maxLossPct: 10 }).status).toBe('unknown')
  })
})
