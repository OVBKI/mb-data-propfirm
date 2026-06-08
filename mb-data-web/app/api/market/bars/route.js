// app/api/market/bars/route.js
// Historical OHLC bars for the backtest/replay feature, multi-provider.
//
//   GET /api/market/bars?provider=binance&symbol=BTCUSDT&interval=5m&limit=400
//   GET /api/market/bars?provider=databento&symbol=ES&interval=5m&limit=400
//
// Providers:
//   - binance   : public crypto market data (data-api.binance.vision) — NO KEY,
//                 works out of the box (BTCUSDT, ETHUSDT, …).
//   - databento : CME Globex (dataset GLBX.MDP3) — requires DATABENTO_API_KEY.
//                 CME futures data is licensed/paid; without the key this returns
//                 501 NO_KEY and the client falls back to synthetic data.
//
// Returns: { ok, provider, symbol, interval, source, bars: [{t,o,h,l,c,v}] }
// Public route (preview feature) with in-memory rate limiting + short cache.

import { rateLimit } from '../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

const ALLOWED_INTERVALS = ['1m', '5m', '15m', '1h', '4h']
const INTERVAL_MS = { '1m': 60e3, '5m': 300e3, '15m': 900e3, '1h': 3600e3, '4h': 14400e3 }

const cache = new Map() // key -> { at, payload }
const CACHE_MS = 60_000

function ipFrom(req) {
  const xff = req.headers.get('x-forwarded-for')
  return (xff ? xff.split(',')[0].trim() : '') || req.headers.get('x-real-ip') || 'anon'
}

function aggregate(bars, factor) {
  if (factor <= 1) return bars
  const out = []
  for (let i = 0; i < bars.length; i += factor) {
    const chunk = bars.slice(i, i + factor)
    if (!chunk.length) break
    out.push({
      t: chunk[0].t, o: chunk[0].o,
      h: Math.max(...chunk.map(b => b.h)), l: Math.min(...chunk.map(b => b.l)),
      c: chunk[chunk.length - 1].c, v: chunk.reduce((s, b) => s + b.v, 0),
    })
  }
  return out
}

// ── Binance (public, no key) ──
async function fetchBinance(symbol, interval, limit) {
  const url = `https://data-api.binance.vision/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${Math.min(1000, limit)}`
  const r = await fetch(url, { headers: { accept: 'application/json' } })
  if (!r.ok) throw new Error(`binance ${r.status}`)
  const rows = await r.json()
  if (!Array.isArray(rows)) throw new Error('binance bad payload')
  return rows.map(k => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] }))
}

// ── Databento — CME Globex (GLBX.MDP3), requires DATABENTO_API_KEY ──
async function fetchDatabento(symbol, interval, limit) {
  const key = process.env.DATABENTO_API_KEY
  if (!key) { const e = new Error('DATABENTO_API_KEY not set'); e.code = 'NO_KEY'; throw e }
  // Native OHLCV schemas: 1m / 1h. Aggregate to 5m/15m/4h from the base schema.
  const base = INTERVAL_MS[interval] >= INTERVAL_MS['1h'] ? '1h' : '1m'
  const factor = INTERVAL_MS[interval] / INTERVAL_MS[base]
  const need = Math.ceil(limit * factor)
  const end = Date.now()
  const start = end - need * INTERVAL_MS[base] * 1.6
  const params = new URLSearchParams({
    dataset: 'GLBX.MDP3',
    schema: `ohlcv-${base}`,
    symbols: `${symbol}.c.0`,   // continuous front month
    stype_in: 'continuous',
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    encoding: 'json',
  })
  const url = `https://hist.databento.com/v0/timeseries.get_range?${params}`
  const auth = Buffer.from(key + ':').toString('base64')
  const r = await fetch(url, { headers: { Authorization: `Basic ${auth}` } })
  if (!r.ok) { const e = new Error(`databento ${r.status}: ${(await r.text()).slice(0, 200)}`); e.code = 'PROVIDER_ERROR'; throw e }
  const text = await r.text()
  const raw = text.trim().split('\n').filter(Boolean).map(line => {
    const j = JSON.parse(line)
    return { t: Math.round(Number(j.hd?.ts_event ?? j.ts_event) / 1e6), o: +j.open / 1e9, h: +j.high / 1e9, l: +j.low / 1e9, c: +j.close / 1e9, v: +j.volume }
  }).filter(b => Number.isFinite(b.o) && Number.isFinite(b.c))
  return aggregate(raw, factor)
}

export async function GET(request) {
  const ip = ipFrom(request)
  const limit429 = rateLimit({ key: `market:${ip}`, windowMs: 60_000, max: 40 })
  if (!limit429.allowed) return Response.json({ ok: false, error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(limit429.retryAfter) } })

  const sp = new URL(request.url).searchParams
  const provider = (sp.get('provider') || 'binance').toLowerCase()
  const symbol = (sp.get('symbol') || '').toUpperCase().replace(/[^A-Z0-9.]/g, '')
  const interval = sp.get('interval') || '5m'
  const limit = Math.min(1000, Math.max(20, parseInt(sp.get('limit') || '400', 10)))

  if (!symbol) return Response.json({ ok: false, error: 'symbol required' }, { status: 400 })
  if (!ALLOWED_INTERVALS.includes(interval)) return Response.json({ ok: false, error: 'bad interval' }, { status: 400 })

  const ckey = `${provider}|${symbol}|${interval}|${limit}`
  const hit = cache.get(ckey)
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return Response.json(hit.payload, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } })
  }

  try {
    let bars
    if (provider === 'binance') bars = await fetchBinance(symbol, interval, limit)
    else if (provider === 'databento') bars = await fetchDatabento(symbol, interval, limit)
    else return Response.json({ ok: false, error: 'unknown provider' }, { status: 400 })

    bars = bars.slice(-limit)
    if (bars.length < 10) return Response.json({ ok: false, error: 'not enough data' }, { status: 502 })

    const payload = { ok: true, provider, symbol, interval, source: provider === 'binance' ? 'Binance (spot)' : 'CME · Databento', bars }
    cache.set(ckey, { at: Date.now(), payload })
    return Response.json(payload, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } })
  } catch (e) {
    const code = e.code || 'PROVIDER_ERROR'
    const status = code === 'NO_KEY' ? 501 : 502
    return Response.json({ ok: false, error: String(e.message || e), code }, { status })
  }
}
