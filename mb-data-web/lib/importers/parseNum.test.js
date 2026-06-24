import { describe, it, expect } from 'vitest'
import { parseNum } from './parseNum'

// Shared Rithmic numeric parser (used by both rithmic-pnl and rithmic-dashboard).
// Must read US (1,234.56) and EU (1.234,56 / 1234,56) decimals without inflating
// values — regression guard for the "1234,56 -> 123456 x100" bug.
describe('parseNum', () => {
  it('parses plain US decimals', () => {
    expect(parseNum('1234.56')).toBe(1234.56)
  })
  it('parses US thousands + decimal', () => {
    expect(parseNum('1,234.56')).toBe(1234.56)
    expect(parseNum('1,234,567.89')).toBe(1234567.89)
  })
  it('parses EU comma-decimal', () => {
    expect(parseNum('1234,56')).toBe(1234.56)
  })
  it('parses EU thousands + comma-decimal', () => {
    expect(parseNum('1.234,56')).toBe(1234.56)
  })
  it('treats a comma group of exactly 3 digits as thousands', () => {
    expect(parseNum('1,234')).toBe(1234)
  })
  it('treats a comma group that is not 3 digits as a decimal', () => {
    expect(parseNum('1,23')).toBe(1.23)
  })
  it('handles negatives', () => {
    expect(parseNum('-50')).toBe(-50)
  })
  it('strips currency symbols and whitespace', () => {
    expect(parseNum('$1,234.56')).toBe(1234.56)
    expect(parseNum('1 234,56 EUR'.replace(' EUR', ''))).toBe(1234.56)
  })
  it('returns 0 for empty / null / undefined / non-numeric', () => {
    expect(parseNum('')).toBe(0)
    expect(parseNum(null)).toBe(0)
    expect(parseNum(undefined)).toBe(0)
    expect(parseNum('abc')).toBe(0)
  })
})
