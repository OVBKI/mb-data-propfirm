import { describe, it, expect } from 'vitest'
import {
  inferSide,
  computeRMultiple,
  computeRiskReward,
  computeRStats,
  formatR,
  formatRR,
} from './tradeMath'

// ---------------------------------------------------------------------------
// inferSide — heuristique documentée : gagnant qui monte = Long, gagnant qui
// descend = Short (et inversement pour un perdant).
// ---------------------------------------------------------------------------
describe('inferSide', () => {
  it('trade gagnant : exit > entry → Long, exit < entry → Short', () => {
    expect(inferSide({ entry: 100, exit: 110, pnl: 500 })).toBe('Long')
    expect(inferSide({ entry: 100, exit: 90, pnl: 500 })).toBe('Short')
  })

  it('trade perdant : exit > entry → Short, exit < entry → Long', () => {
    expect(inferSide({ entry: 100, exit: 110, pnl: -500 })).toBe('Short')
    expect(inferSide({ entry: 100, exit: 90, pnl: -500 })).toBe('Long')
  })

  it('sans PnL : devine par le sens du mouvement', () => {
    expect(inferSide({ entry: 100, exit: 110, pnl: null })).toBe('Long')
    expect(inferSide({ entry: 100, exit: 90, pnl: null })).toBe('Short')
  })

  // NOTE : le commentaire du code dit « si pnl=0 → null », mais le code
  // traite pnl=0 comme pnl absent (devine par le mouvement). On teste le
  // comportement RÉEL — divergence doc/code signalée, pas corrigée ici.
  it('pnl = 0 : se comporte comme pnl absent (comportement actuel)', () => {
    expect(inferSide({ entry: 100, exit: 110, pnl: 0 })).toBe('Long')
  })

  it('exit égal à entry ou données manquantes → null', () => {
    expect(inferSide({ entry: 100, exit: 100, pnl: 50 })).toBeNull()
    expect(inferSide({ entry: null, exit: 110, pnl: 50 })).toBeNull()
    expect(inferSide({ entry: 100, exit: undefined, pnl: 50 })).toBeNull()
  })

  it('accepte des prix en chaînes de caractères', () => {
    expect(inferSide({ entry: '100', exit: '110', pnl: '500' })).toBe('Long')
  })
})

// ---------------------------------------------------------------------------
// computeRMultiple — conventions de signes Long vs Short
// ---------------------------------------------------------------------------
describe('computeRMultiple', () => {
  it('Long gagnant : (exit - entry) / (entry - stop)', () => {
    // Risque 5 pts, gain 10 pts → +2R
    expect(computeRMultiple({ entry: 100, exit: 110, stop: 95, side: 'Long' })).toBe(2)
  })

  it('Long perdant : R négatif', () => {
    expect(computeRMultiple({ entry: 100, exit: 90, stop: 95, side: 'Long' })).toBe(-2)
    // Stop touché exactement → -1R
    expect(computeRMultiple({ entry: 100, exit: 95, stop: 95, side: 'Long' })).toBe(-1)
  })

  it('Short gagnant : (entry - exit) / (stop - entry)', () => {
    // Risque 5 pts au-dessus, gain 10 pts à la baisse → +2R
    expect(computeRMultiple({ entry: 100, exit: 90, stop: 105, side: 'Short' })).toBe(2)
  })

  it('Short perdant : R négatif', () => {
    expect(computeRMultiple({ entry: 100, exit: 110, stop: 105, side: 'Short' })).toBe(-2)
    expect(computeRMultiple({ entry: 100, exit: 105, stop: 105, side: 'Short' })).toBe(-1)
  })

  it('stop incohérent avec le side → null', () => {
    // Long avec stop AU-DESSUS de l'entry
    expect(computeRMultiple({ entry: 100, exit: 110, stop: 105, side: 'Long' })).toBeNull()
    // Short avec stop EN-DESSOUS de l'entry
    expect(computeRMultiple({ entry: 100, exit: 90, stop: 95, side: 'Short' })).toBeNull()
    // Stop = entry (risque nul) → null dans les deux sens
    expect(computeRMultiple({ entry: 100, exit: 110, stop: 100, side: 'Long' })).toBeNull()
  })

  it('side absent : inféré depuis entry/exit/pnl', () => {
    // Gagnant qui monte → Long inféré → +2R
    expect(computeRMultiple({ entry: 100, exit: 110, stop: 95, pnl: 500 })).toBe(2)
    // Gagnant qui descend → Short inféré → +2R
    expect(computeRMultiple({ entry: 100, exit: 90, stop: 105, pnl: 500 })).toBe(2)
    // Inférence impossible (exit = entry, pnl non nul) → null
    expect(computeRMultiple({ entry: 100, exit: 100, stop: 95, pnl: 50 })).toBeNull()
  })

  it('données manquantes → null', () => {
    expect(computeRMultiple({ entry: 100, exit: null, stop: 95, side: 'Long' })).toBeNull()
    expect(computeRMultiple({ entry: 100, exit: 110, stop: undefined, side: 'Long' })).toBeNull()
    expect(computeRMultiple({ entry: 'abc', exit: 110, stop: 95, side: 'Long' })).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// computeRiskReward — R:R planifié
// ---------------------------------------------------------------------------
describe('computeRiskReward', () => {
  it('Long : (tp - entry) / (entry - stop)', () => {
    expect(computeRiskReward({ entry: 100, takeProfit: 110, stop: 95, side: 'Long' })).toBe(2)
  })

  it('Short : (entry - tp) / (stop - entry)', () => {
    expect(computeRiskReward({ entry: 100, takeProfit: 90, stop: 105, side: 'Short' })).toBe(2)
  })

  it('risque ou reward incohérent → null', () => {
    // Long avec TP sous l'entry (reward ≤ 0)
    expect(computeRiskReward({ entry: 100, takeProfit: 95, stop: 90, side: 'Long' })).toBeNull()
    // Long avec stop au-dessus de l'entry (risk ≤ 0)
    expect(computeRiskReward({ entry: 100, takeProfit: 110, stop: 105, side: 'Long' })).toBeNull()
    // Short avec TP au-dessus de l'entry
    expect(computeRiskReward({ entry: 100, takeProfit: 110, stop: 105, side: 'Short' })).toBeNull()
  })

  it('side absent : inféré via exit/pnl', () => {
    expect(computeRiskReward({ entry: 100, takeProfit: 110, stop: 95, exit: 108, pnl: 400 })).toBe(2)
  })

  it('données manquantes → null', () => {
    expect(computeRiskReward({ entry: 100, takeProfit: null, stop: 95, side: 'Long' })).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// computeRStats — agrégats sur journal_entries
// ---------------------------------------------------------------------------
describe('computeRStats', () => {
  const entry = (entry_price, exit_price, stop_loss, side) => ({
    entry_price, exit_price, stop_loss, side,
  })

  it('journal vide ou null → tous les agrégats à null', () => {
    expect(computeRStats([])).toEqual({
      avgR: null, rCount: 0, expectancyR: null, bestR: null, worstR: null,
    })
    expect(computeRStats(null).rCount).toBe(0)
  })

  it('calcule avg/best/worst/expectancy sur les trades exploitables', () => {
    const stats = computeRStats([
      entry(100, 110, 95, 'Long'),   // +2R
      entry(100, 95, 95, 'Long'),    // -1R
      entry(100, 90, 105, 'Short'),  // +2R
    ])
    expect(stats.rCount).toBe(3)
    expect(stats.avgR).toBeCloseTo(1)
    expect(stats.expectancyR).toBeCloseTo(1) // = avgR par construction
    expect(stats.bestR).toBe(2)
    expect(stats.worstR).toBe(-1)
  })

  it('ignore les trades sans entry/exit/stop ou incohérents', () => {
    const stats = computeRStats([
      entry(100, 110, 95, 'Long'),   // +2R — seul valide
      entry(100, 110, null, 'Long'), // pas de stop → ignoré
      entry(100, 110, 105, 'Long'),  // stop incohérent → ignoré
      { entry_price: null, exit_price: 5, stop_loss: 3, side: 'Long' },
    ])
    expect(stats.rCount).toBe(1)
    expect(stats.avgR).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
describe('formatR / formatRR', () => {
  it('formatR : signe explicite + suffixe R', () => {
    expect(formatR(2.345)).toBe('+2.35R')
    expect(formatR(-1)).toBe('-1.00R')
    expect(formatR(null)).toBe('—')
    expect(formatR(NaN)).toBe('—')
  })

  it('formatRR : format 1:x, null/négatif → —', () => {
    expect(formatRR(2)).toBe('1:2.0')
    expect(formatRR(null)).toBe('—')
    expect(formatRR(-1)).toBe('—')
    expect(formatRR(0)).toBe('—')
  })
})
