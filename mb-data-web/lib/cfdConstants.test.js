// lib/cfdConstants.test.js — catalog integrity for the CFD vertical.
// Mirrors lib/firmSlugs.test.js (futures): every firm exposes the fields the
// engine (lib/cfdDrawdown.js) and the UI (CfdAccountModal, CfdDrawdownCard,
// /cfd pages) consume, with values inside the supported enums/ranges, and the
// slug mapping is bidirectional.

import { describe, it, expect } from 'vitest'
import {
  CFD_PROPFIRM_RULES,
  CFD_FIRM_ORDER,
  CFD_REPUTATION,
  CFD_DAILY_BASIS_LABEL,
  CFD_MAX_BASIS_LABEL,
} from './cfdConstants'
import {
  cfdFirmToSlug,
  cfdSlugToFirm,
  getAllCfdSlugs,
  getCfdFirmsOrdered,
  getCfdModels,
  getAllCfdFirmPairs,
  cfdSlugToPair,
} from './cfdSlugs'

const FIRMS = Object.keys(CFD_PROPFIRM_RULES)
const DAILY_BASES = Object.keys(CFD_DAILY_BASIS_LABEL) // enums supported by cfdDailyLoss
const MAX_BASES = Object.keys(CFD_MAX_BASIS_LABEL)     // enums supported by cfdMaxLoss
const isPctOrNull = (v) => v == null || (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 100)

const isPctInRange = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 100

describe('CFD_FIRM_ORDER', () => {
  it('lists every catalog firm exactly once (same set as CFD_PROPFIRM_RULES)', () => {
    expect(new Set(CFD_FIRM_ORDER)).toEqual(new Set(FIRMS))
    expect(new Set(CFD_FIRM_ORDER).size).toBe(CFD_FIRM_ORDER.length)
  })
})

describe('CFD_PROPFIRM_RULES — firm-level fields', () => {
  for (const name of FIRMS) {
    const firm = CFD_PROPFIRM_RULES[name]
    it(`${name}: category/website/country/reputation/platforms/instruments/verified`, () => {
      expect(firm.category).toBe('cfd')
      expect(firm.website).toMatch(/^https?:\/\//)
      expect(typeof firm.country).toBe('string')
      expect(Object.keys(CFD_REPUTATION)).toContain(firm.reputation)
      expect(typeof firm.reputationNote).toBe('string')
      expect(Array.isArray(firm.platforms)).toBe(true)
      expect(firm.platforms.length).toBeGreaterThan(0)
      expect(Array.isArray(firm.instruments)).toBe(true)
      expect(firm.instruments.length).toBeGreaterThan(0)
      expect(typeof firm.verified).toBe('string')
      expect(Array.isArray(firm.otherModels)).toBe(true)
      for (const m of firm.otherModels) {
        // Structured sub-model: { name, desc, ...overrides }. `desc` (the FR summary
        // rendered on the public /cfd pages) and `name` must both be non-empty strings.
        expect(typeof m).toBe('object')
        expect(typeof m.name).toBe('string')
        expect(m.name.length).toBeGreaterThan(0)
        expect(typeof m.desc).toBe('string')
        expect(m.desc.length).toBeGreaterThan(0)
        // Any stated rule override must sit within the supported enums/ranges.
        if (m.steps != null) {
          expect(Number.isInteger(m.steps)).toBe(true)
          expect(m.steps).toBeGreaterThanOrEqual(1)
        }
        if (m.dailyLoss != null) {
          expect(isPctOrNull(m.dailyLoss.pct)).toBe(true)
          if (m.dailyLoss.basis != null) expect(DAILY_BASES).toContain(m.dailyLoss.basis)
        }
        if (m.maxLoss != null) {
          expect(isPctOrNull(m.maxLoss.pct)).toBe(true)
          if (m.maxLoss.basis != null) expect(MAX_BASES).toContain(m.maxLoss.basis)
        }
        if (Array.isArray(m.profitTargets)) {
          for (const t of m.profitTargets) expect(isPctInRange(t)).toBe(true)
        }
      }
    })
  }
})

describe('getCfdModels — flagship + structured sub-models for the selectors', () => {
  for (const name of FIRMS) {
    it(`${name}: returns flagship first, then one entry per otherModels`, () => {
      const firm = CFD_PROPFIRM_RULES[name]
      const models = getCfdModels(name)
      expect(models.length).toBe(1 + firm.otherModels.length)

      const [flagship, ...others] = models
      expect(flagship.isFlagship).toBe(true)
      expect(flagship.name).toBe(firm.flagship.model)

      others.forEach((m, i) => {
        expect(m.isFlagship).toBe(false)
        expect(typeof m.name).toBe('string')
        expect(m.name.length).toBeGreaterThan(0)
        // Firm-wide infra is inherited from the flagship unless the model overrides it.
        const src = firm.otherModels[i]
        if (src.accountSizes === undefined) {
          expect(m.accountSizes).toEqual(firm.flagship.accountSizes)
        }
        if (src.profitSplit === undefined) {
          expect(m.profitSplit).toEqual(firm.flagship.profitSplit)
        }
        // Rules are NEVER inherited: a model only exposes maxLoss if it stated one.
        if (src.maxLoss === undefined) expect(m.maxLoss).toBeUndefined()
        if (src.dailyLoss === undefined) expect(m.dailyLoss).toBeUndefined()
      })
    })
  }

  it('returns [] for an unknown firm', () => {
    expect(getCfdModels('not-a-firm')).toEqual([])
  })
})

describe('CFD_PROPFIRM_RULES — flagship fields consumed by the engine/UI', () => {
  for (const name of FIRMS) {
    const f = CFD_PROPFIRM_RULES[name].flagship
    it(`${name}: model / steps / accountSizes / currency`, () => {
      expect(typeof f.model).toBe('string')
      expect(f.model.length).toBeGreaterThan(0)
      expect(Number.isInteger(f.steps)).toBe(true)
      expect(f.steps).toBeGreaterThanOrEqual(1)
      expect(Array.isArray(f.accountSizes)).toBe(true)
      expect(f.accountSizes.length).toBeGreaterThan(0)
      for (const s of f.accountSizes) {
        expect(Number.isFinite(s)).toBe(true)
        expect(s).toBeGreaterThan(0)
      }
      expect(typeof f.currency).toBe('string')
    })

    it(`${name}: profitTargets — one per step, each in 0–100`, () => {
      expect(Array.isArray(f.profitTargets)).toBe(true)
      expect(f.profitTargets.length).toBe(f.steps)
      for (const t of f.profitTargets) expect(isPctInRange(t)).toBe(true)
    })

    it(`${name}: dailyLoss / maxLoss — pct in 0–100, basis within the engine enums`, () => {
      expect(isPctInRange(f.dailyLoss.pct)).toBe(true)
      expect(DAILY_BASES).toContain(f.dailyLoss.basis)
      expect(isPctInRange(f.maxLoss.pct)).toBe(true)
      expect(MAX_BASES).toContain(f.maxLoss.basis)
    })

    it(`${name}: profitSplit range is coherent`, () => {
      expect(isPctInRange(f.profitSplit.from)).toBe(true)
      expect(isPctInRange(f.profitSplit.to)).toBe(true)
      expect(f.profitSplit.from).toBeLessThanOrEqual(f.profitSplit.to)
    })

    it(`${name}: priceIndicative shape (per-size keys numeric, confidence present)`, () => {
      if (f.priceIndicative == null) return
      expect(['low', 'medium', 'high']).toContain(f.priceIndicative.confidence)
      for (const [k, v] of Object.entries(f.priceIndicative)) {
        if (k === 'note' || k === 'confidence') continue
        expect(Number.isFinite(Number(k))).toBe(true) // account size key
        expect(Number.isFinite(Number(v))).toBe(true) // price
      }
    })

    it(`${name}: refundNote only decorates refundable === true firms`, () => {
      if (f.refundNote == null) return
      expect(typeof f.refundNote).toBe('string')
      expect(f.refundNote.length).toBeGreaterThan(0)
      expect(f.refundable).toBe(true)
    })
  }
})

describe('CFD slugs — bidirectional mapping (mirror of firmSlugs futures tests)', () => {
  it('one slug per firm, all unique, kebab-case', () => {
    const slugs = getAllCfdSlugs()
    expect(slugs.length).toBe(CFD_FIRM_ORDER.length)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('round-trips firm → slug → firm for every catalog firm', () => {
    for (const name of FIRMS) {
      expect(cfdSlugToFirm(cfdFirmToSlug(name))).toBe(name)
    }
  })

  it('returns null for an unknown slug', () => {
    expect(cfdSlugToFirm('not-a-cfd-firm')).toBeNull()
  })

  it('getCfdFirmsOrdered attaches name + slug + catalog data for every firm', () => {
    const ordered = getCfdFirmsOrdered()
    expect(ordered.map((f) => f.name)).toEqual(CFD_FIRM_ORDER)
    for (const f of ordered) {
      expect(f.slug).toBe(cfdFirmToSlug(f.name))
      expect(f.flagship).toBe(CFD_PROPFIRM_RULES[f.name].flagship)
    }
  })
})

describe('CFD firm-vs-firm pairs (mirror of futures getAllFirmPairs / slugToPair)', () => {
  const pairs = getAllCfdFirmPairs()
  const N = FIRMS.length

  it('has C(n,2) entries', () => {
    expect(pairs.length).toBe((N * (N - 1)) / 2)
  })

  it('orders each pair alphabetically by slug and builds an -vs- slug', () => {
    for (const { firmA, firmB, slug } of pairs) {
      const slugA = cfdFirmToSlug(firmA)
      const slugB = cfdFirmToSlug(firmB)
      expect(slugA < slugB).toBe(true)
      expect(slug).toBe(`${slugA}-vs-${slugB}`)
    }
  })

  it('produces unique pair slugs', () => {
    const slugs = pairs.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('never pairs a firm with itself', () => {
    for (const { firmA, firmB } of pairs) expect(firmA).not.toBe(firmB)
  })

  it('round-trips every generated pair slug back to its firms', () => {
    for (const { firmA, firmB, slug } of pairs) {
      const parsed = cfdSlugToPair(slug)
      expect(parsed).not.toBeNull()
      expect(new Set([parsed.firmA, parsed.firmB])).toEqual(new Set([firmA, firmB]))
    }
  })

  it('returns null for invalid or non-firm slugs', () => {
    expect(cfdSlugToPair('foo-bar')).toBeNull()
    expect(cfdSlugToPair('')).toBeNull()
    expect(cfdSlugToPair(null)).toBeNull()
    expect(cfdSlugToPair('ftmo-vs-not-a-firm')).toBeNull()
  })
})
