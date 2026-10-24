import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const rpc = vi.fn()
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ rpc }) }))

describe('rateLimit', () => {
  beforeEach(() => { vi.resetModules(); rpc.mockReset() })
  afterEach(() => { delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY })

  it('sans base configurée : compteur en mémoire', async () => {
    const { rateLimit } = await import('./rateLimit')
    const key = `mem-${Math.random()}`
    const r = []
    for (let i = 0; i < 4; i++) r.push(await rateLimit({ key, max: 3 }))
    expect(r.map((x) => x.allowed)).toEqual([true, true, true, false])
    expect(rpc).not.toHaveBeenCalled()
  })

  it('avec la base : verdict de rate_limit_hit, clé hachée', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://db'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k'
    const reset = new Date(Date.now() + 30_000).toISOString()
    rpc.mockResolvedValueOnce({ data: [{ allowed: false, hits: 6, reset_at: reset }], error: null })
    const { rateLimit, hashKey } = await import('./rateLimit')
    const r = await rateLimit({ key: 'waitlist:1.2.3.4', windowMs: 60_000, max: 5 })
    expect(r.allowed).toBe(false)
    expect(r.retryAfter).toBeGreaterThan(0)
    const args = rpc.mock.calls[0][1]
    expect(args.p_key).toBe(hashKey('waitlist:1.2.3.4'))
    expect(args.p_key).not.toContain('1.2.3.4')
  })

  it('base en erreur : repli en mémoire, la route reste protégée', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://db'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k'
    rpc.mockResolvedValue({ data: null, error: { message: 'function rate_limit_hit does not exist' } })
    const { rateLimit } = await import('./rateLimit')
    const key = `fallback-${Math.random()}`
    expect((await rateLimit({ key, max: 1 })).allowed).toBe(true)
    expect((await rateLimit({ key, max: 1 })).allowed).toBe(false)
  })
})
