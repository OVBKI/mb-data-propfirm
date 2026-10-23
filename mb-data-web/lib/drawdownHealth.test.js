import { describe, it, expect } from 'vitest'
import { computeStatsByAccount, computeDdFloor, drawdownMargin } from './drawdownHealth'
import { maxDrawdown } from './constants'

// Compte Topstep 50K : le plancher et la marge doivent sortir des TRADES seuls,
// sans colonne `balance` / `dd_floor` — c'est ce qui manquait au cron.
const acct = { id: 'a1', plan_size: '50k', dd_type: 'eod', status: 'Financé' }
const FIRM = 'Topstep'
const MDD = maxDrawdown(FIRM, '50k')

describe('drawdownHealth', () => {
  it('le catalogue donne un drawdown pour le compte de test', () => {
    expect(MDD).toBeGreaterThan(0)
  })

  it('recalcule solde et plus haut à partir des trades, jour par jour', () => {
    const trades = [
      { account_id: 'a1', date: '2026-10-01', pnl: 800 },
      { account_id: 'a1', date: '2026-10-02', pnl: -300 },
      { account_id: 'a1', date: '2026-10-02', pnl: -200 },
    ]
    const s = computeStatsByAccount(trades, { a1: acct })
    expect(s.a1.balance).toBe(50300)
    expect(s.a1.peakBalance).toBe(50800)
    expect(s.a1.bestDayAmount).toBe(800)
  })

  it('un compte sans trade garde son solde de départ', () => {
    const s = computeStatsByAccount([], { a1: acct })
    expect(s.a1.balance).toBe(50000)
  })

  it('EOD : le plancher suit le plus haut, mais pas au-delà du solde de départ', () => {
    expect(computeDdFloor(acct, FIRM, 50000)).toBe(50000 - MDD)
    expect(computeDdFloor(acct, FIRM, 50000 + 10 * MDD)).toBe(50000)
  })

  it('la marge d’alerte vient des trades seuls', () => {
    const trades = [{ account_id: 'a1', date: '2026-10-01', pnl: -0.8 * MDD }]
    const s = computeStatsByAccount(trades, { a1: acct })
    const m = drawdownMargin(acct, FIRM, s.a1)
    expect(m.room).toBeCloseTo(0.2 * MDD)
    expect(m.roomPct).toBeCloseTo(0.2)
  })

  it('une valeur saisie à la main reste prioritaire, comme sur la page Santé', () => {
    const m = drawdownMargin({ ...acct, balance: 49000, dd_floor: 48500 }, FIRM, { balance: 50000, peakBalance: 50000 })
    expect(m.room).toBe(500)
  })

  it('les trades antérieurs au financement ne comptent pas', () => {
    const funded = { ...acct, funded_date: '2026-10-05' }
    const trades = [{ account_id: 'a1', date: '2026-10-01', pnl: -1000 }, { account_id: 'a1', date: '2026-10-06', pnl: 200 }]
    expect(computeStatsByAccount(trades, { a1: funded }).a1.balance).toBe(50200)
  })
})
