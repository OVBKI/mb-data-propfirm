import { describe, it, expect, vi } from 'vitest'

vi.mock('../../../../lib/apiAuth', () => ({ verifyAdmin: async () => ({ user: { id: 'admin' } }) }))
// Base simulée : la table ai_reviews et la colonne journal_entries.quantity manquent.
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from(table) {
      const q = {
        _cols: '*', _head: false,
        select(cols, opts) { q._cols = cols; q._head = !!opts?.head; return q },
        limit() { return q }, eq() { return q },
        maybeSingle: async () => ({ data: { paid_launch: false }, error: null }),
        then(res) {
          if (table === 'ai_reviews') return res({ data: null, error: { code: 'PGRST205', message: 'not found' } })
          if (table === 'journal_entries' && q._cols === 'quantity') return res({ data: null, error: { code: '42703', message: 'column does not exist' } })
          return res({ data: [], count: table === 'profiles' ? 12 : 0, error: null })
        },
      }
      return q
    },
    rpc: async () => ({ data: [{ allowed: true }], error: null }),
  }),
}))

describe('/api/admin/db-health', () => {
  it('liste ce qui manque et l’état des quotas', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://db'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k'
    const { GET } = await import('./route.js')
    const body = await (await GET(new Request('http://x/api/admin/db-health'))).json()
    const missing = body.checks.filter((c) => !c.ok).map((c) => c.name)
    expect(missing).toEqual(['ai_reviews', 'journal_entries.quantity'])
    expect(body.missing).toBe(2)
    expect(body.quotas).toMatchObject({ paidLaunch: false, profiles: 12 })
  })
})
