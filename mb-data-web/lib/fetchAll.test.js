import { describe, it, expect } from 'vitest'
import { fetchAll } from './fetchAll'

// Requête factice : 2 345 lignes servies par tranches, comme PostgREST.
function fakeQuery(total, failAt = null) {
  return () => ({
    range: async (from, to) => {
      if (failAt != null && from >= failAt) return { data: null, error: { message: 'boom' } }
      const rows = []
      for (let i = from; i <= Math.min(to, total - 1); i++) rows.push({ id: i })
      return { data: rows, error: null }
    },
  })
}

describe('fetchAll', () => {
  it('lit au-delà des 1 000 lignes', async () => {
    const { data } = await fetchAll(fakeQuery(2345))
    expect(data).toHaveLength(2345)
    expect(data[2344].id).toBe(2344)
  })
  it('une page pleine suivie d’une page vide', async () => {
    expect((await fetchAll(fakeQuery(2000))).data).toHaveLength(2000)
  })
  it('remonte l’erreur au lieu de rendre un résultat partiel', async () => {
    const r = await fetchAll(fakeQuery(5000, 1000))
    expect(r.data).toBeNull()
    expect(r.error.message).toBe('boom')
  })
})
