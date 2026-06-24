import { describe, it, expect } from 'vitest'
import {
  PROPFIRM_RULES,
  FIRM_SUGGESTIONS,
  GENERIC_PLANS,
  planSizeNum,
  plansForFirm,
  maxDrawdown,
  isTrailingDD,
  defaultDdType,
  accountLabel,
  profitTarget,
  defaultPayoutTarget,
  defaultMinTradingDays,
  defaultProfitSplit,
  defaultMinDailyProfit,
  defaultChallengePrice,
} from './constants'

describe('planSizeNum', () => {
  it('converts plan strings to dollar amounts', () => {
    expect(planSizeNum('50k')).toBe(50000)
    expect(planSizeNum('100k')).toBe(100000)
    expect(planSizeNum('300k')).toBe(300000)
  })

  it('is case insensitive on the k suffix', () => {
    expect(planSizeNum('25K')).toBe(25000)
  })

  it('falls back to 50000 for null/empty/non-numeric input', () => {
    expect(planSizeNum(null)).toBe(50000)
    expect(planSizeNum(undefined)).toBe(50000)
    expect(planSizeNum('')).toBe(50000)
    expect(planSizeNum('abc')).toBe(50000)
  })

  it('always returns a multiple of 1000', () => {
    for (const p of GENERIC_PLANS) {
      expect(planSizeNum(p) % 1000).toBe(0)
    }
  })
})

describe('plansForFirm', () => {
  it('returns the firm plans for a known firm', () => {
    expect(plansForFirm('Topstep')).toEqual(['50k', '100k', '150k'])
  })

  it('returns a non-empty array of plan-size strings for every known firm', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      const plans = plansForFirm(firm)
      expect(Array.isArray(plans)).toBe(true)
      expect(plans.length).toBeGreaterThan(0)
      for (const p of plans) {
        expect(typeof p).toBe('string')
        expect(p).toMatch(/^\d+k$/)
      }
    }
  })

  it('falls back to GENERIC_PLANS for an unknown firm', () => {
    expect(plansForFirm('Definitely Not A Firm')).toBe(GENERIC_PLANS)
  })

  it('matches the plans declared in PROPFIRM_RULES', () => {
    expect(plansForFirm('Apex Trader Funding')).toEqual(
      PROPFIRM_RULES['Apex Trader Funding'].plans
    )
  })
})

describe('maxDrawdown', () => {
  it('extracts the numeric max drawdown for known firm + plan', () => {
    expect(maxDrawdown('Topstep', '50k')).toBe(2000)
    expect(maxDrawdown('Apex Trader Funding', '25k')).toBe(1500)
    expect(maxDrawdown('Bulenox', '50k')).toBe(2500)
  })

  it('returns null for unknown firm', () => {
    expect(maxDrawdown('Nope', '50k')).toBeNull()
  })

  it('returns null when the plan does not exist for the firm', () => {
    expect(maxDrawdown('Topstep', '999k')).toBeNull()
  })

  it('returns null when plan is missing', () => {
    expect(maxDrawdown('Topstep', null)).toBeNull()
  })

  it('returns a positive number for every firm at its first plan', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      const firstPlan = plansForFirm(firm)[0]
      const dd = maxDrawdown(firm, firstPlan)
      // Some firms may not expose a matching DD key; if present it must be positive.
      if (dd !== null) {
        expect(typeof dd).toBe('number')
        expect(dd).toBeGreaterThan(0)
      }
    }
  })
})

describe('isTrailingDD', () => {
  it('is false for EOD-only firms like Topstep', () => {
    expect(isTrailingDD('Topstep')).toBe(false)
  })

  it('is true for firms whose rules mention a trailing drawdown', () => {
    expect(isTrailingDD('Apex Trader Funding')).toBe(true)
    expect(isTrailingDD('Bulenox')).toBe(true)
    expect(isTrailingDD('Lucid Trading')).toBe(true)
  })

  it('is false for an unknown firm', () => {
    expect(isTrailingDD('Nope')).toBe(false)
  })

  it('always returns a boolean', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      expect(typeof isTrailingDD(firm)).toBe('boolean')
    }
  })
})

describe('defaultDdType', () => {
  it('classifies known firms by their confirmed default DD type', () => {
    expect(defaultDdType('Topstep')).toBe('eod')
    expect(defaultDdType('Apex Trader Funding')).toBe('eod')
    expect(defaultDdType('Bulenox')).toBe('trailing')
    expect(defaultDdType('Lucid Trading')).toBe('eod')
    expect(defaultDdType('Phidias Propfirm')).toBe('eod')
  })

  it('returns static for an unknown firm with no trailing rule', () => {
    expect(defaultDdType('Nope')).toBe('static')
  })

  it('always returns one of static|eod|trailing', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      expect(['static', 'eod', 'trailing']).toContain(defaultDdType(firm))
    }
  })
})

describe('accountLabel', () => {
  it('uses a trimmed custom name when present', () => {
    expect(accountLabel({ name: 'Big' })).toBe('Big')
    expect(accountLabel({ name: '  Padded  ' })).toBe('Padded')
  })

  it('falls back to the buy date when name is blank', () => {
    expect(accountLabel({ name: '  ', buy_date: '2026-01-01' })).toBe('Compte du 2026-01-01')
    expect(accountLabel({ buy_date: '2026-06-01' })).toBe('Compte du 2026-06-01')
  })

  it('returns empty string for null/undefined account', () => {
    expect(accountLabel(null)).toBe('')
    expect(accountLabel(undefined)).toBe('')
  })
})

describe('profitTarget', () => {
  it('extracts the numeric profit target for known firm + plan', () => {
    expect(profitTarget('Topstep', '50k')).toBe(3000)
    expect(profitTarget('Apex Trader Funding', '25k')).toBe(1500)
  })

  it('returns null for unknown firm', () => {
    expect(profitTarget('Nope', '50k')).toBeNull()
  })

  it('returns null when plan is missing', () => {
    expect(profitTarget('Topstep', null)).toBeNull()
  })
})

describe('defaultPayoutTarget', () => {
  it('returns planSizeNum + profit target', () => {
    expect(defaultPayoutTarget('Topstep', '50k')).toBe(53000)
    expect(defaultPayoutTarget('Apex Trader Funding', '25k')).toBe(26500)
  })

  it('equals plan size plus the profit target where the target exists', () => {
    const t = profitTarget('Bulenox', '50k')
    if (t !== null) {
      expect(defaultPayoutTarget('Bulenox', '50k')).toBe(50000 + t)
    }
  })

  it('returns null when there is no profit target', () => {
    expect(defaultPayoutTarget('Nope', '50k')).toBeNull()
  })
})

describe('defaultMinTradingDays', () => {
  it('returns the numeric min trading days for firms that declare it', () => {
    expect(defaultMinTradingDays('Apex Trader Funding', '25k')).toBe(0)
    expect(defaultMinTradingDays('Bulenox', '25k')).toBe(0)
  })

  it('returns null when the firm has no matching rule key', () => {
    // Topstep expresses "Aucun min" in prose without a "jours ... trading ... min" key.
    expect(defaultMinTradingDays('Topstep', '50k')).toBeNull()
  })

  it('returns null for unknown firm', () => {
    expect(defaultMinTradingDays('Nope', '50k')).toBeNull()
  })

  it('returns a non-negative number or null for every firm', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      const plan = plansForFirm(firm)[0]
      const d = defaultMinTradingDays(firm, plan)
      if (d !== null) {
        expect(d).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('defaultProfitSplit', () => {
  it('returns the trader split percentage', () => {
    expect(defaultProfitSplit('Topstep', '50k')).toBe(90)
    expect(defaultProfitSplit('Apex Trader Funding', '25k')).toBe(100)
    expect(defaultProfitSplit('Bulenox', '25k')).toBe(100)
  })

  it('returns null for unknown firm', () => {
    expect(defaultProfitSplit('Nope', '50k')).toBeNull()
  })

  it('returns a percentage between 1 and 100 or null', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      const plan = plansForFirm(firm)[0]
      const s = defaultProfitSplit(firm, plan)
      if (s !== null) {
        expect(s).toBeGreaterThanOrEqual(1)
        expect(s).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('defaultMinDailyProfit', () => {
  it('extracts the min daily profit dollar amount where present', () => {
    expect(defaultMinDailyProfit('Topstep', '50k')).toBe(150)
  })

  it('returns 0 when the matched rule has a literal $0', () => {
    expect(defaultMinDailyProfit('Bulenox', '25k')).toBe(0)
  })

  it('returns null when no matching rule/value exists', () => {
    expect(defaultMinDailyProfit('Apex Trader Funding', '50k')).toBeNull()
    expect(defaultMinDailyProfit('Nope', '50k')).toBeNull()
  })
})

describe('defaultChallengePrice', () => {
  it('extracts the first dollar price for known firm + plan', () => {
    expect(defaultChallengePrice('Topstep', '50k')).toBe(49)
    expect(defaultChallengePrice('Apex Trader Funding', '25k')).toBe(177)
    expect(defaultChallengePrice('Bulenox', '25k')).toBe(175)
  })

  it('returns null for unknown firm', () => {
    expect(defaultChallengePrice('Nope', '50k')).toBeNull()
  })

  it('returns null when plan is missing', () => {
    expect(defaultChallengePrice('Topstep', null)).toBeNull()
  })

  it('returns a positive number or null for every firm first plan', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      const plan = plansForFirm(firm)[0]
      const price = defaultChallengePrice(firm, plan)
      if (price !== null) {
        expect(price).toBeGreaterThan(0)
      }
    }
  })
})
