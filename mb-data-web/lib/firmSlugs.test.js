import { describe, it, expect } from 'vitest'
import { FIRM_SUGGESTIONS } from './constants'
import {
  firmToSlug,
  slugToFirm,
  getAllFirmSlugs,
  getAllFirmPairs,
  slugToPair,
  FIRM_META,
  getFirmsOrdered,
  categorizeRule,
  pickComparisonPlan,
} from './firmSlugs'

const N = FIRM_SUGGESTIONS.length

describe('firmToSlug', () => {
  it('produces canonical kebab-case slugs', () => {
    expect(firmToSlug('Apex Trader Funding')).toBe('apex-trader-funding')
    expect(firmToSlug('Topstep')).toBe('topstep')
    expect(firmToSlug('My Funded Futures')).toBe('my-funded-futures')
  })

  it('lowercases, strips diacritics and trims surrounding separators', () => {
    expect(firmToSlug('Café Crème')).toBe('cafe-creme')
    expect(firmToSlug('  Spaced  Name  ')).toBe('spaced-name')
  })

  it('every firm slug is lowercase, hyphen-separated, no spaces, no leading/trailing hyphen', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      const slug = firmToSlug(firm)
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(slug).not.toMatch(/\s/)
      expect(slug).toBe(slug.toLowerCase())
    }
  })
})

describe('getAllFirmSlugs', () => {
  it('returns one slug per firm', () => {
    const slugs = getAllFirmSlugs()
    expect(slugs.length).toBe(N)
  })

  it('matches firmToSlug applied to each firm', () => {
    expect(getAllFirmSlugs()).toEqual(FIRM_SUGGESTIONS.map(firmToSlug))
  })

  it('contains only unique slugs', () => {
    const slugs = getAllFirmSlugs()
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('slugToFirm', () => {
  it('round-trips with firmToSlug for every firm', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      expect(slugToFirm(firmToSlug(firm))).toBe(firm)
    }
  })

  it('resolves a known slug to its canonical firm name', () => {
    expect(slugToFirm('apex-trader-funding')).toBe('Apex Trader Funding')
    expect(slugToFirm('topstep')).toBe('Topstep')
  })

  it('is case insensitive on the input slug', () => {
    expect(slugToFirm('TOPSTEP')).toBe('Topstep')
  })

  it('returns null for an unknown slug or empty input', () => {
    expect(slugToFirm('not-a-firm')).toBeNull()
    expect(slugToFirm('')).toBeNull()
  })
})

describe('getAllFirmPairs', () => {
  const pairs = getAllFirmPairs()

  it('has C(n,2) entries', () => {
    expect(pairs.length).toBe((N * (N - 1)) / 2)
  })

  it('orders each pair alphabetically by slug and builds an -vs- slug', () => {
    for (const { firmA, firmB, slug } of pairs) {
      const slugA = firmToSlug(firmA)
      const slugB = firmToSlug(firmB)
      expect(slugA < slugB).toBe(true)
      expect(slug).toBe(`${slugA}-vs-${slugB}`)
    }
  })

  it('produces unique pair slugs', () => {
    const slugs = pairs.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('never pairs a firm with itself', () => {
    for (const { firmA, firmB } of pairs) {
      expect(firmA).not.toBe(firmB)
    }
  })
})

describe('slugToPair', () => {
  it('parses a valid pair slug into both firm names', () => {
    expect(slugToPair('apex-trader-funding-vs-topstep')).toEqual({
      firmA: 'Apex Trader Funding',
      firmB: 'Topstep',
      slugA: 'apex-trader-funding',
      slugB: 'topstep',
    })
  })

  it('round-trips every generated pair slug back to its firms', () => {
    for (const { firmA, firmB, slug } of getAllFirmPairs()) {
      const parsed = slugToPair(slug)
      expect(parsed).not.toBeNull()
      expect(new Set([parsed.firmA, parsed.firmB])).toEqual(new Set([firmA, firmB]))
    }
  })

  it('returns null for slugs without the -vs- delimiter', () => {
    expect(slugToPair('foo-bar')).toBeNull()
    expect(slugToPair('')).toBeNull()
    expect(slugToPair(null)).toBeNull()
  })

  it('returns null when a side is not a known firm', () => {
    expect(slugToPair('topstep-vs-not-a-firm')).toBeNull()
  })
})

describe('FIRM_META', () => {
  it('has an entry for every firm in FIRM_SUGGESTIONS', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      expect(FIRM_META[firm]).toBeDefined()
    }
  })

  it('each meta entry exposes the required editorial fields', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      const meta = FIRM_META[firm]
      expect(typeof meta.tagline).toBe('string')
      expect(typeof meta.description).toBe('string')
      expect(typeof meta.intro).toBe('string')
      expect(meta.website).toMatch(/^https?:\/\//)
      expect(typeof meta.ddType).toBe('string')
      expect(Array.isArray(meta.keyFacts)).toBe(true)
      expect(meta.keyFacts.length).toBeGreaterThan(0)
      expect(Array.isArray(meta.faqs)).toBe(true)
      expect(meta.faqs.length).toBeGreaterThan(0)
      for (const faq of meta.faqs) {
        expect(typeof faq.q).toBe('string')
        expect(typeof faq.a).toBe('string')
      }
    }
  })
})

describe('getFirmsOrdered', () => {
  const ordered = getFirmsOrdered()

  it('returns one entry per firm, in FIRM_SUGGESTIONS order', () => {
    expect(ordered.length).toBe(N)
    expect(ordered.map((f) => f.name)).toEqual(FIRM_SUGGESTIONS)
  })

  it('attaches slug, meta and plans to each firm', () => {
    for (const f of ordered) {
      expect(f.slug).toBe(firmToSlug(f.name))
      expect(f.meta).toBe(FIRM_META[f.name])
      expect(Array.isArray(f.plans)).toBe(true)
    }
  })
})

describe('categorizeRule', () => {
  it('maps rule keys to their section', () => {
    expect(categorizeRule('Max Loss Limit (MLL)')).toBe('drawdown')
    expect(categorizeRule('Daily Loss Limit (DLL)')).toBe('drawdown')
    expect(categorizeRule('Profit Split (post 12-jan-2026)')).toBe('profit')
    expect(categorizeRule('Trading des news')).toBe('trading')
    expect(categorizeRule('Max contracts (Combine)')).toBe('contracts')
    expect(categorizeRule('Prix mensuel Standard')).toBe('pricing')
    expect(categorizeRule('Méthodes payout')).toBe('payouts')
    expect(categorizeRule('Comptes simul.')).toBe('multi')
  })

  it('falls back to other for unmatched keys', () => {
    expect(categorizeRule('Some unrelated label')).toBe('other')
  })
})

describe('pickComparisonPlan', () => {
  it('prefers 50k, then 100k, then the first plan', () => {
    expect(pickComparisonPlan({ plans: ['25k', '50k', '100k'] })).toBe('50k')
    expect(pickComparisonPlan({ plans: ['100k', '150k'] })).toBe('100k')
    expect(pickComparisonPlan({ plans: ['300k'] })).toBe('300k')
  })

  it('returns null when there are no plans', () => {
    expect(pickComparisonPlan({ plans: [] })).toBeNull()
    expect(pickComparisonPlan(null)).toBeNull()
  })
})
