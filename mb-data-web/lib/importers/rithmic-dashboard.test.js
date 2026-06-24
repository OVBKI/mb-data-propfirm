import { describe, it, expect } from 'vitest'
import { parseNum } from './rithmic-dashboard'

// rithmic-dashboard has its own copy of parseNum; keep it guarded identically to
// the rithmic-pnl one (US vs EU decimal conventions, no value inflation).
describe('rithmic-dashboard parseNum', () => {
  it('parses US decimals and thousands', () => {
    expect(parseNum('1234.56')).toBe(1234.56)
    expect(parseNum('1,234.56')).toBe(1234.56)
    expect(parseNum('1,234,567.89')).toBe(1234567.89)
  })
  it('parses EU comma-decimal and thousands', () => {
    expect(parseNum('1234,56')).toBe(1234.56)
    expect(parseNum('1.234,56')).toBe(1234.56)
  })
  it('disambiguates 3-digit comma groups (thousands) from decimals', () => {
    expect(parseNum('1,234')).toBe(1234)
    expect(parseNum('1,23')).toBe(1.23)
  })
  it('handles negatives, currency symbols and blanks', () => {
    expect(parseNum('-50')).toBe(-50)
    expect(parseNum('$1,234.56')).toBe(1234.56)
    expect(parseNum('')).toBe(0)
    expect(parseNum(null)).toBe(0)
    expect(parseNum('abc')).toBe(0)
  })
})
