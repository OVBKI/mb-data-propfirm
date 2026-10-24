import { describe, it, expect } from 'vitest'
import { weekOf, lastWeek, buildWeekDigest, REVIEW_SYSTEM_PROMPT, reviewUserMessage } from './aiReview'

describe('semaines', () => {
  it('lundi → dimanche', () => expect(weekOf(new Date('2026-10-22T10:00:00Z'))).toEqual({ start: '2026-10-19', end: '2026-10-25' }))
  it('un dimanche appartient à la semaine qui finit', () => expect(weekOf(new Date('2026-10-25T23:00:00Z')).start).toBe('2026-10-19'))
  it('semaine précédente', () => expect(lastWeek(new Date('2026-10-26T08:00:00Z'))).toEqual({ start: '2026-10-19', end: '2026-10-25' }))
})

describe('buildWeekDigest', () => {
  const accounts = [{ id: 'a1', name: 'XFA 1', plan_size: '50k', status: 'Financé', firmName: 'Topstep', custom_drawdown: 2000 }]
  const trades = [
    { account_id: 'a1', date: '2026-10-20', traded_at: '2026-10-20T09:35:00', pnl: 300, instrument: 'NQ', tags: ['orb'], notes: 'Bonne attente du retest' },
    { account_id: 'a1', date: '2026-10-21', traded_at: '2026-10-21T14:10:00', pnl: -700, instrument: 'NQ', tags: ['revenge'], notes: '[import:tradovate:1-2] qty=1 entry=2026-10-21 14:10:00' },
    { account_id: 'a1', date: '2026-10-12', pnl: -700 },
  ]
  const d = buildWeekDigest({ trades, allTrades: trades, accounts, start: '2026-10-19', end: '2026-10-25' })
  it('ne garde que la semaine', () => {
    expect(d.summary).toMatchObject({ trades: 2, pnl: -400, winRate: 0.5, tradingDays: 2, largestLoss: -700 })
  })
  it('heures, setups, comptes', () => {
    expect(d.hours.map((h) => h.hour)).toEqual(['09h', '14h'])
    expect(d.setups.length).toBe(2)
    expect(d.accounts[0].account).toBe('Topstep · XFA 1')
  })
  it('les marqueurs d’import ne partent pas comme notes', () => {
    expect(d.notes).toEqual([{ date: '2026-10-20', pnl: 300, note: 'Bonne attente du retest' }])
  })
  it('état des règles sur tout l’historique', () => {
    const dd = d.rules.find((r) => r.rule === 'drawdown')
    expect(dd).toMatchObject({ level: 'warn', used: 0.55 })
  })
  it('prompt figé, données dans le message', () => {
    expect(REVIEW_SYSTEM_PROMPT).not.toMatch(/2026/)
    expect(reviewUserMessage(d)).toMatch(/^Semaine du 2026-10-19 au 2026-10-25/)
  })
})
