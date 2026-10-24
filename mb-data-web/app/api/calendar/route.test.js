import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Une semaine ForexFactory minimale, datée dans la semaine courante.
function ffWeek() {
  const d = new Date()
  d.setUTCHours(12, 30, 0, 0)
  return [{ title: 'CPI m/m', country: 'USD', date: d.toISOString(), impact: 'High', forecast: '0.3%', previous: '0.2%' }]
}
const req = (week = 'this') => new Request(`http://localhost/api/calendar?week=${week}`, { headers: { 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}` } })

describe('/api/calendar — repli entre sources', () => {
  beforeEach(() => { vi.resetModules(); process.env.FMP_API_KEY = 'test' })
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.FMP_API_KEY })

  it('FMP répond du HTML : on passe à ForexFactory au lieu de finir en 500', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => String(url).includes('financialmodelingprep')
      ? new Response('<html>Bad gateway</html>', { status: 200, headers: { 'content-type': 'text/html' } })
      : Response.json(ffWeek())))
    const { GET } = await import('./route.js')
    const res = await GET(req())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.source).toBe('forexfactory')
    expect(body.events[0].title).toBe('CPI m/m')
  })

  it('FMP injoignable (exception réseau) : même repli', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).includes('financialmodelingprep')) throw new TypeError('fetch failed')
      return Response.json(ffWeek())
    }))
    const { GET } = await import('./route.js')
    const body = await (await GET(req())).json()
    expect(body.source).toBe('forexfactory')
  })

  it('les deux sources tombent après un premier succès : dernier calendrier connu, signalé périmé', async () => {
    let up = true
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (!up || String(url).includes('financialmodelingprep')) throw new TypeError('fetch failed')
      return Response.json(ffWeek())
    }))
    vi.useFakeTimers({ toFake: ['Date'] })
    const { GET } = await import('./route.js')
    expect((await GET(req('next'))).status).toBe(200)
    up = false
    vi.setSystemTime(Date.now() + 10 * 60 * 1000) // au-delà des 5 min de cache
    const res = await GET(req('next'))
    vi.useRealTimers()
    expect(res.status).toBe(200)
    expect((await res.json()).stale).toBe(true)
  })

  it('les deux sources tombent sans rien en cache : 502 explicite', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed') }))
    const { GET } = await import('./route.js')
    expect((await GET(req())).status).toBe(502)
  })
})
