import { describe, it, expect } from 'vitest'
import { PROPFIRM_RULES } from './constants'
import { programsForFirm } from './futuresComparison'
import { maxContracts, parseContractCell, accountMaxContracts } from './contractLimits'

describe('parseContractCell', () => {
  it.each([
    ['5 minis OU 50 micros (ratio standard 10:1)', 'mini', { mini: 5, micro: 50 }],
    ['3 mini + 30 micro', 'mini', { mini: 3, micro: 30 }],
    ['12', 'mini', { mini: 12, micro: null }],
    ['40 (10× mini, comptent à l\'unité)', 'micro', { mini: null, micro: 40 }],
    ['3 → 4-5 (scaling profit-based)', 'mini', null],
    ['4 (Starter) / 5 (Pro) / 5 (Instant)', 'mini', null],
    ['1 (Select/Growth · Lightning n/a)', 'mini', null],
    ['selon le solde', 'mini', null],
  ])('%s', (cell, size, out) => expect(parseContractCell(cell, size)).toEqual(out))
})

describe('maxContracts — catalogue', () => {
  it('Topstep : Combine 50K = 5 minis / 50 micros ; XFA (plan d\'échelle) sans limite fixe', () => {
    expect(maxContracts('Topstep', '50k', 'XFA Standard', 'challenge')).toMatchObject({ mini: 5, micro: 50 })
    expect(maxContracts('Topstep', '50k', 'XFA Standard', 'funded')).toBeNull()
  })
  it('Apex 50K : 6 en évaluation EOD, 10 en Legacy, pleine taille PA 4', () => {
    expect(maxContracts('Apex Trader Funding', '50k', 'EOD', 'challenge').mini).toBe(6)
    expect(maxContracts('Apex Trader Funding', '50k', 'Legacy', 'challenge').mini).toBe(10)
    expect(maxContracts('Apex Trader Funding', '50k', 'EOD', 'funded').mini).toBe(4)
  })
  it('My Funded Futures : le segment du programme', () => {
    expect(maxContracts('My Funded Futures', '50k', 'Rapid', 'funded')).toMatchObject({ mini: 5, micro: 50 })
    expect(maxContracts('My Funded Futures', '50k', 'Pro', 'challenge')).toMatchObject({ mini: 3, micro: 30 })
  })
  it('Bulenox Option 2 ne reprend pas la limite de l\'Option 1', () => {
    const r = maxContracts('Bulenox', '50k', 'Option 2 (EOD)', 'challenge')
    expect(r?.mini ?? null).toBeNull()
  })
  it('valeurs plausibles sur tout le catalogue', () => {
    for (const firm of Object.keys(PROPFIRM_RULES)) {
      for (const plan of PROPFIRM_RULES[firm].plans || []) {
        const progs = programsForFirm(firm, plan)
        for (const pg of progs.length ? progs : [null]) {
          for (const ph of ['challenge', 'funded']) {
            const r = maxContracts(firm, plan, pg, ph)
            if (!r) continue
            if (r.mini != null) expect(r.mini, `${firm} ${plan} ${pg} ${ph}`).toBeGreaterThan(0)
            if (r.mini != null) expect(r.mini).toBeLessThanOrEqual(40)
            if (r.micro != null) expect(r.micro).toBeLessThanOrEqual(400)
          }
        }
      }
    }
  })
  it('compte sans programme : programme par défaut de la firme', () => {
    expect(accountMaxContracts({ plan_size: '50k', status: 'Challenge' }, 'Lucid Trading')).toMatchObject({ mini: 4, micro: 40 })
  })
})
