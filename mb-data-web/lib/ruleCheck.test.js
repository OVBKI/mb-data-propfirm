import { describe, it, expect } from 'vitest'
import { checkAccountRules } from './ruleCheck'

// Topstep 50K XFA Standard : perte journalière $2,000 en financé, $1,000 en Combine.
const acct = (over = {}) => ({ id: 'a1', plan_size: '50k', status: 'Financé', dd_type: 'static', ...over })
const tr = (date, pnl) => ({ account_id: 'a1', date, pnl })

describe('checkAccountRules', () => {
  it('rien à signaler sur un compte sain', () => {
    const r = checkAccountRules({ account: acct(), firmName: 'Topstep', trades: [tr('2026-10-01', 200)], day: '2026-10-01' })
    expect(r.items.filter((i) => i.level !== 'info')).toEqual([])
  })
  it('drawdown consommé à 60 % → warn', () => {
    const r = checkAccountRules({ account: acct({ custom_drawdown: 2000 }), firmName: 'Topstep', trades: [tr('2026-10-01', -600), tr('2026-10-02', -600)], day: '2026-10-02' })
    const dd = r.items.find((i) => i.rule === 'drawdown')
    expect(dd.level).toBe('warn')
    expect(dd.used).toBeCloseTo(0.6)
  })
  it('drawdown consommé à 85 % → danger', () => {
    const r = checkAccountRules({ account: acct({ custom_drawdown: 2000 }), firmName: 'Topstep', trades: [tr('2026-10-01', -900), tr('2026-10-02', -800)], day: '2026-10-02' })
    expect(r.items.find((i) => i.rule === 'drawdown').level).toBe('danger')
  })
  it('plancher franchi → breach', () => {
    const r = checkAccountRules({ account: acct({ custom_drawdown: 2000 }), firmName: 'Topstep', trades: [tr('2026-10-01', -900), tr('2026-10-02', -900), tr('2026-10-03', -300)], day: '2026-10-03' })
    expect(r.level).toBe('breach')
  })
  it('perte du jour à 85 % de la limite journalière', () => {
    const r = checkAccountRules({ account: acct({ custom_drawdown: 5000 }), firmName: 'Topstep', trades: [tr('2026-10-02', -1700)], day: '2026-10-02' })
    const d = r.items.find((i) => i.rule === 'dailyLoss')
    expect(d).toBeTruthy()
    expect(d.level).toBe('danger')
  })
  it('compte raté : pas de contrôle', () => {
    expect(checkAccountRules({ account: acct({ status: 'Échoué' }), firmName: 'Topstep', trades: [], day: '2026-10-01' }).items).toEqual([])
  })
  it('objectif de challenge atteint → info', () => {
    const r = checkAccountRules({ account: acct({ status: 'Challenge' }), firmName: 'Topstep', trades: [tr('2026-10-01', 1600), tr('2026-10-02', 1500)], day: '2026-10-02' })
    expect(r.items.find((i) => i.rule === 'target')?.level).toBe('info')
  })
  it('contrats au-delà de la limite du compte → danger', () => {
    const lucid = { id: 'a1', plan_size: '50k', status: 'Challenge', program: 'LucidFlex' }
    const r = checkAccountRules({ account: lucid, firmName: 'Lucid Trading', trades: [], day: '2026-10-02', trade: { instrument: 'NQZ6', quantity: 6 } })
    expect(r.items.find((i) => i.rule === 'contracts')).toMatchObject({ level: 'danger', qty: 6, limit: 4, kind: 'mini' })
    const ok = checkAccountRules({ account: lucid, firmName: 'Lucid Trading', trades: [], day: '2026-10-02', trade: { instrument: 'MNQ', quantity: 30 } })
    expect(ok.items.find((i) => i.rule === 'contracts')).toBeUndefined()
  })
  it('instrument inconnu ou limite illisible : pas de constat', () => {
    const tsx = { id: 'a1', plan_size: '50k', status: 'Financé', program: 'XFA Standard' }
    expect(checkAccountRules({ account: tsx, firmName: 'Topstep', trades: [], day: '2026-10-02', trade: { instrument: 'NQ', quantity: 50 } }).items.find((i) => i.rule === 'contracts')).toBeUndefined()
  })
})
