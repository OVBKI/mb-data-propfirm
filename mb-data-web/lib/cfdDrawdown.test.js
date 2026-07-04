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

describe('cfdMaxLoss — eod-trailing & edge cases', () => {
  it('eod-trailing takes the trailing branch (same formula as trailing-relative)', () => {
    // hw 52000, loss 3000 → floor 49000, NOT the static 47000
    const r = cfdMaxLoss({ initialBalance: 50000, currentEquity: 51000, highWater: 52000, maxLossPct: 6, basis: 'eod-trailing' })
    expect(r.floor).toBe(49000)
  })
  it('eod-trailing locks at the initial balance like trailing-relative', () => {
    const r = cfdMaxLoss({ initialBalance: 50000, currentEquity: 55000, highWater: 60000, maxLossPct: 6, basis: 'eod-trailing' })
    expect(r.floor).toBe(50000)
  })
  it('missing highWater on a trailing basis defaults to the initial balance', () => {
    const r = cfdMaxLoss({ initialBalance: 50000, currentEquity: 49000, maxLossPct: 6, basis: 'eod-trailing' })
    expect(r.floor).toBe(47000) // hw = init 50000 → 50000 - 3000
    expect(r.breached).toBe(false)
  })
  it('unknown basis falls back to the static floor', () => {
    const r = cfdMaxLoss({ initialBalance: 100000, currentEquity: 100000, highWater: 120000, maxLossPct: 10, basis: 'not-a-basis' })
    expect(r.floor).toBe(90000) // static, ignores the high-water
  })
  it('danger band: >=90% and <100% consumed', () => {
    // used 9500 / 10000 → 95%
    const r = cfdMaxLoss({ initialBalance: 100000, currentEquity: 90500, maxLossPct: 10, basis: 'static' })
    expect(r.usedPct).toBe(95)
    expect(r.status).toBe('danger')
    expect(r.breached).toBe(false)
  })
  it('equity below the floor clamps usedPct at 100 and reports breached', () => {
    const r = cfdMaxLoss({ initialBalance: 100000, currentEquity: 85000, maxLossPct: 10, basis: 'static' })
    expect(r.usedPct).toBe(100) // clamped (raw would be 150%)
    expect(r.breached).toBe(true)
    expect(r.status).toBe('breached')
    expect(r.buffer).toBe(-5000)
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

describe('cfdDailyLoss — anchor-sized limit (equity / higher-of bases)', () => {
  it('FundingPips-style: higher-of limit is a % of the day-start anchor, not the initial', () => {
    // 100K account, day-start 96K, 5% daily → limit 4800 (not 5000)
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 94000, dayStartBalance: 96000, dayStartEquity: 96000, dailyLossPct: 5, basis: 'higher-of-balance-equity' })
    expect(r.limit).toBe(4800)
    expect(r.anchor).toBe(96000)
    expect(r.used).toBe(2000)
    expect(r.breached).toBe(false)
  })
  it('FundingPips-style: breach happens at anchor − anchor·pct (91 200, not 91 000)', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 91200, dayStartBalance: 96000, dayStartEquity: 96000, dailyLossPct: 5, basis: 'higher-of-balance-equity' })
    expect(r.limit).toBe(4800)
    expect(r.used).toBe(4800)
    expect(r.usedPct).toBe(100)
    expect(r.breached).toBe(true)
  })
  it('higher-of sizes off the LARGER of day-start balance/equity', () => {
    // anchor = max(96000, 98000) = 98000 → limit 4900
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 97000, dayStartBalance: 96000, dayStartEquity: 98000, dailyLossPct: 5, basis: 'higher-of-balance-equity' })
    expect(r.anchor).toBe(98000)
    expect(r.limit).toBe(4900)
  })
  it('equity basis sizes the limit off the day-start equity', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 97000, dayStartBalance: 102000, dayStartEquity: 98000, dailyLossPct: 5, basis: 'equity' })
    expect(r.anchor).toBe(98000)
    expect(r.limit).toBe(4900)
    expect(r.used).toBe(1000)
  })
  it('balance basis keeps the initial-sized limit even when the day-start differs', () => {
    // FTMO-style: fixed $ amount = % of initial, measured from the day-start balance
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 94000, dayStartBalance: 96000, dailyLossPct: 5, basis: 'balance' })
    expect(r.limit).toBe(5000)
    expect(r.anchor).toBe(96000)
    expect(r.used).toBe(2000)
  })
})

describe('cfdDailyLoss — defaults & edge cases', () => {
  it('missing dayStartBalance defaults the anchor to the initial balance', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 98000, dailyLossPct: 5, basis: 'balance' })
    expect(r.anchor).toBe(100000)
    expect(r.used).toBe(2000)
  })
  it('higher-of with missing dayStartEquity degrades to the day-start balance (se = sb)', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 94000, dayStartBalance: 96000, dailyLossPct: 5, basis: 'higher-of-balance-equity' })
    expect(r.anchor).toBe(96000)
    expect(r.limit).toBe(4800) // anchor-sized even without the equity snapshot
  })
  it('negative intradayBookedProfit is clamped (never shrinks the allowance)', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 98000, dayStartBalance: 100000, intradayBookedProfit: -1000, dailyLossPct: 5, basis: 'balance+intraday-profit' })
    expect(r.limit).toBe(5000)
  })
  it('danger band: >=90% and <100% of the daily allowance consumed', () => {
    // used 4750 / 5000 → 95%
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 95250, dayStartBalance: 100000, dailyLossPct: 5, basis: 'balance' })
    expect(r.usedPct).toBe(95)
    expect(r.status).toBe('danger')
    expect(r.breached).toBe(false)
  })
  it('dailyLossPct of 0 → unknown', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 98000, dayStartBalance: 100000, dailyLossPct: 0, basis: 'balance' })
    expect(r.status).toBe('unknown')
    expect(r.usedPct).toBeNull()
    expect(r.breached).toBe(false)
  })
  it('dailyLossPct NaN → unknown', () => {
    const r = cfdDailyLoss({ initialBalance: 100000, currentEquity: 98000, dayStartBalance: 100000, dailyLossPct: NaN, basis: 'balance' })
    expect(r.status).toBe('unknown')
    expect(r.usedPct).toBeNull()
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
