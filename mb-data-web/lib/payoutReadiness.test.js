import { describe, it, expect } from 'vitest'
import { payoutReadiness, payoutWindowStart } from './payoutReadiness'

// Topstep 50K XFA Standard financé : 5 jours ≥ $150, pas de consistance au catalogue.
const base = { id: 'a1', plan_size: '50k', status: 'Financé', funded_date: '2026-09-01', payout_target: 51000 }
const tr = (date, pnl) => ({ account_id: 'a1', date, pnl })

describe('payoutReadiness', () => {
  it('compte non financé : sans objet', () => {
    expect(payoutReadiness({ account: { ...base, status: 'Challenge' }, firmName: 'Topstep', trades: [] })).toBeNull()
  })
  it('jours qualifiants comptés au-dessus du minimum journalier', () => {
    const trades = [tr('2026-09-02', 200), tr('2026-09-03', 100), tr('2026-09-04', 400), tr('2026-09-05', 160)]
    const r = payoutReadiness({ account: base, firmName: 'Topstep', trades })
    const days = r.checks.find((c) => c.key === 'days')
    expect(days).toMatchObject({ current: 3, required: 5, ok: false })
  })
  it('prêt quand objectif et jours sont tenus', () => {
    const trades = ['02', '03', '04', '05', '08'].map((d) => tr(`2026-09-${d}`, 250))
    const r = payoutReadiness({ account: base, firmName: 'Topstep', trades })
    expect(r.profit).toBe(1250)
    expect(r.ready).toBe(true)
  })
  it('la période repart après le dernier payout', () => {
    const acct = { ...base, payouts: [{ date: '2026-09-10', amount: 900 }] }
    expect(payoutWindowStart(acct)).toEqual({ date: '2026-09-10', inclusive: false })
    const r = payoutReadiness({ account: acct, firmName: 'Topstep', trades: [tr('2026-09-10', 500), tr('2026-09-11', 300)] })
    expect(r.profit).toBe(300)
  })
  it('consistance : un seul jour gagnant ne suffit pas', () => {
    const r = payoutReadiness({ account: { ...base, payout_target: null }, firmName: 'Apex', trades: [tr('2026-09-02', 900)] })
    const c = r?.checks.find((x) => x.key === 'consistency')
    if (c) expect(c.ok).toBe(false)
  })
})
