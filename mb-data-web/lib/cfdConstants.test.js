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
import { cfdFirmToSlug, cfdSlugToFirm, getAllCfdSlugs, getCfdFirmsOrdered } from './cfdSlugs'

const FIRMS = Object.keys(CFD_PROPFIRM_RULES)
const DAILY_BASES = Object.keys(CFD_DAILY_BASIS_LABEL) // enums supported by cfdDailyLoss
const MAX_BASES = Object.keys(CFD_MAX_BASIS_LABEL)     // enums supported by cfdMaxLoss

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
      for (const m of firm.otherModels) expect(typeof m).toBe('string')
    })
  }
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
