import { describe, it, expect } from 'vitest'
import { drawdownLevel, alertDecision } from './drawdownAlerts'

describe('drawdownLevel', () => {
  it.each([
    [{ room: 1500, roomPct: 0.75 }, 'none'],
    [{ room: 900, roomPct: 0.45 }, 'warn'],
    [{ room: 300, roomPct: 0.15 }, 'danger'],
    [{ room: -10, roomPct: -0.005 }, 'breach'],
    [null, 'none'],
  ])('%j → %s', (m, l) => expect(drawdownLevel(m)).toBe(l))
})

describe('alertDecision', () => {
  it('première alerte à 50 %', () => expect(alertDecision(null, 'warn')).toEqual({ notify: true, store: 'warn' }))
  it('pas de répétition au même palier', () => expect(alertDecision('danger', 'danger')).toEqual({ notify: false, store: undefined }))
  it('escalade 50 → 80 %', () => expect(alertDecision('warn', 'danger').notify).toBe(true))
  it('retour au calme : on mémorise sans prévenir', () => expect(alertDecision('danger', 'none')).toEqual({ notify: false, store: 'none' }))
})
