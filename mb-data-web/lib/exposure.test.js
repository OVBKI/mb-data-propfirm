import { describe, it, expect } from 'vitest'
import { instrumentRoot, replicationExposure } from './exposure'

describe('instrumentRoot', () => {
  it.each([
    ['NQM6', 'NQ'], ['MNQZ25', 'MNQ'], ['NQ 06-26', 'NQ'], ['mes', 'MES'],
    ['6EZ5', '6E'], ['GC', 'GC'], ['NG', 'NG'], ['ES', 'ES'],
  ])('%s → %s', (s, r) => expect(instrumentRoot(s)).toBe(r))
})

describe('replicationExposure', () => {
  it('2 NQ sur 5 comptes = 10 NQ = 100 MNQ', () => {
    expect(replicationExposure('NQM6', 2, 5)).toEqual({ root: 'NQ', contracts: 10, micro: 100, microSymbol: 'MNQ' })
  })
  it('un micro reste un micro', () => {
    expect(replicationExposure('MES', 3, 2)).toMatchObject({ contracts: 6, micro: 6, microSymbol: 'MES' })
  })
  it('instrument sans micro connu', () => {
    expect(replicationExposure('ZB', 1, 3)).toMatchObject({ contracts: 3, micro: null })
  })
  it('rien sans quantité', () => {
    expect(replicationExposure('NQ', '', 3)).toBeNull()
  })
})
