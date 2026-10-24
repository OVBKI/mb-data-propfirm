import { describe, it, expect, vi, beforeEach } from 'vitest'

const create = vi.fn()
vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error {}
  class RateLimitError extends APIError {}
  class AuthenticationError extends APIError {}
  class NotFoundError extends APIError {}
  function Anthropic() { this.messages = { create } }
  Object.assign(Anthropic, { APIError, RateLimitError, AuthenticationError, NotFoundError })
  return { default: Anthropic }
})

const { generateWeeklyReview, aiReviewConfigured, aiErrorMessage } = await import('./aiReviewServer')
const Anthropic = (await import('@anthropic-ai/sdk')).default

// Client Supabase factice : rend des données par table et garde les écritures.
function fakeSupabase(tables) {
  const writes = []
  const from = (table) => {
    const q = {
      _table: table,
      select() { return q }, eq() { return q }, gte() { return q }, lte() { return q }, in() { return q },
      order() { return q }, limit() { return q }, range() { return q },
      upsert(row) { writes.push({ table, row }); return { select: () => ({ single: async () => ({ data: { id: 'r1', ...row }, error: null }) }) } },
      then(resolve) { resolve({ data: tables[table] || [], error: null }) },
    }
    return q
  }
  return { from, writes }
}

describe('generateWeeklyReview', () => {
  beforeEach(() => {
    create.mockReset()
    process.env.ANTHROPIC_API_KEY = 'test'
    process.env.AI_REVIEW_MODEL = 'model-under-test'
  })

  it('configuration lue dans l’environnement', () => {
    expect(aiReviewConfigured()).toBe(true)
    delete process.env.AI_REVIEW_MODEL
    expect(aiReviewConfigured()).toBe(false)
  })

  it('appel au modèle : prompt système en cache, données dans le message, revue enregistrée', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'Ce qui a marché\n- Le setup ORB : +300 $.' }] })
    const sb = fakeSupabase({
      accounts: [{ id: 'a1', name: 'XFA', plan_size: '50k', status: 'Financé', firm: { name: 'Topstep' } }],
      journal_entries: [{ account_id: 'a1', date: '2026-10-20', pnl: 300, tags: ['orb'], notes: '' }],
    })
    const r = await generateWeeklyReview(sb, 'u1', { start: '2026-10-19', end: '2026-10-25' })
    const req = create.mock.calls[0][0]
    expect(req.model).toBe('model-under-test')
    expect(req.system[0].cache_control).toEqual({ type: 'ephemeral' })
    expect(req.messages[0].content).toMatch(/^Semaine du 2026-10-19 au 2026-10-25/)
    expect(r.review.content).toMatch(/Ce qui a marché/)
    expect(sb.writes[0]).toMatchObject({ table: 'ai_reviews', row: { user_id: 'u1', week_start: '2026-10-19', trades_count: 1, pnl: 300 } })
  })

  it('pas de trade : pas d’appel', async () => {
    const sb = fakeSupabase({ accounts: [], journal_entries: [] })
    expect(await generateWeeklyReview(sb, 'u1', { start: '2026-10-19', end: '2026-10-25' })).toEqual({ skipped: 'no_trades' })
    expect(create).not.toHaveBeenCalled()
  })

  it('erreurs typées du SDK → message lisible', () => {
    expect(aiErrorMessage(new Anthropic.RateLimitError('x'))).toMatch(/saturé/)
    expect(aiErrorMessage(new Error('x'))).toMatch(/pas pu/)
  })
})
