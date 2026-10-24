import { describe, it, expect } from 'vitest'
import { isIndexedFuturesPair, isIndexedCfdPair } from './indexedPairs'
import { getAllFirmPairs } from './firmSlugs'
import { getAllCfdFirmPairs } from './cfdSlugs'

describe('pages de paires indexées', () => {
  it('seules les paires entre grandes firmes sont indexées : 10 futures, 6 CFD', () => {
    expect(getAllFirmPairs().filter((p) => isIndexedFuturesPair(p.slug))).toHaveLength(10)
    expect(getAllCfdFirmPairs().filter((p) => isIndexedCfdPair(p.slug))).toHaveLength(6)
  })
  it('reconnaît une paire quel que soit l’ordre des firmes', () => {
    expect(isIndexedFuturesPair('apex-trader-funding-vs-topstep')).toBe(true)
    expect(isIndexedFuturesPair('bulenox-vs-topstep')).toBe(false)
  })
})
