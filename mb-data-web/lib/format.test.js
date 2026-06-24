import { describe, it, expect } from 'vitest'
import { fmtMoney, fmtE, fmtENet, toEUR } from './format'

describe('fmtMoney', () => {
  it('prefixes positive values with +', () => {
    expect(fmtMoney(1234.5)).toBe('+1234.50 $')
  })
  it('keeps the minus sign for negatives', () => {
    expect(fmtMoney(-50)).toBe('-50.00 $')
  })
  it('treats null/undefined/NaN as 0', () => {
    expect(fmtMoney(null)).toBe('+0.00 $')
    expect(fmtMoney(undefined)).toBe('+0.00 $')
    expect(fmtMoney(NaN)).toBe('+0.00 $')
  })
  it('respects the decimals argument', () => {
    expect(fmtMoney(1234.567, 0)).toBe('+1235 $')
  })
})

describe('fmtE / fmtENet', () => {
  it('fmtE has no sign prefix', () => {
    expect(fmtE(1234.5)).toBe('1234.50 €')
    expect(fmtE(-50)).toBe('-50.00 €')
  })
  it('fmtENet prefixes positives with +', () => {
    expect(fmtENet(1234.5)).toBe('+1234.50 €')
    expect(fmtENet(-50)).toBe('-50.00 €')
  })
})

describe('toEUR', () => {
  const rates = { USD: 0.9259, GBP: 1.17, EUR: 1 }
  it('multiplies by the rate for the currency', () => {
    expect(toEUR(100, 'USD', rates)).toBeCloseTo(92.59, 4)
    expect(toEUR(100, 'GBP', rates)).toBeCloseTo(117, 4)
  })
  it('is identity for EUR', () => {
    expect(toEUR(100, 'EUR', rates)).toBe(100)
  })
  it('falls back to rate 1 for an unknown currency', () => {
    expect(toEUR(100, 'CHF', rates)).toBe(100)
    expect(toEUR(100, 'USD', {})).toBe(100)
  })
})
