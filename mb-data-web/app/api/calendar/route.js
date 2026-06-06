// Endpoint calendrier économique — sources : Financial Modeling Prep (avec actuals)
// avec fallback ForexFactory (schedule + forecast + previous mais PAS d'actuals).
//
// Pourquoi ce double-source :
//   - Le mirror community ForexFactory à `nfs.faireconomy.media` ne contient
//     QUE le schedule, le forecast et le previous. Pas le `actual`. C'est une
//     limitation du mirror gratuit (le actual vit sur le site officiel FF
//     côté HTML uniquement, non exposé en JSON).
//   - Financial Modeling Prep (FMP) fournit les 4 champs (actual + forecast
//     + previous + impact) sur leur endpoint /economic_calendar, free tier
//     250 appels/jour ce qui est largement suffisant avec notre cache 5 min.
//
// Setup pour avoir les actuals :
//   1. Va sur https://site.financialmodelingprep.com/developer/docs (free signup)
//   2. Récupère ta clé API gratuite
//   3. Ajoute `FMP_API_KEY` dans Vercel → Settings → Environment Variables
//   Sans cette clé, le calendrier marche quand même (forecasts + previous)
//   via le fallback ForexFactory — seuls les actuals ne s'afficheront pas.
//
// SÉCURITÉ — préservée :
//   1. CACHE IN-MEMORY 5 min par {week}
//   2. RATE LIMIT IP : 30 req/min/IP
//   3. CACHE-CONTROL public 5 min (CDN Vercel + browser)

import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit'
import { getClientIp } from '../../../lib/apiAuth'

const CACHE = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Mapping devise → ISO 2-letter pour drapeaux (côté front)
const CURRENCY_TO_COUNTRY = {
  USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CAD: 'CA', AUD: 'AU',
  NZD: 'NZ', CHF: 'CH', CNY: 'CN', HKD: 'HK', SGD: 'SG', KRW: 'KR',
  INR: 'IN', SEK: 'SE', NOK: 'NO', DKK: 'DK', PLN: 'PL', CZK: 'CZ',
  HUF: 'HU', MXN: 'MX', BRL: 'BR', ZAR: 'ZA', TRY: 'TR', RUB: 'RU',
}

// FMP renvoie le pays en code 2-lettres ("US", "GB") → on dérive la devise
const COUNTRY_TO_CURRENCY = {
  US: 'USD', GB: 'GBP', UK: 'GBP', JP: 'JPY', CA: 'CAD', AU: 'AUD',
  NZ: 'NZD', CH: 'CHF', EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR',
  ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', GR: 'EUR', IE: 'EUR',
  PT: 'EUR', FI: 'EUR', CN: 'CNY', HK: 'HKD', SG: 'SGD', KR: 'KRW',
  IN: 'INR', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK',
  HU: 'HUF', MX: 'MXN', BR: 'BRL', ZA: 'ZAR', TR: 'TRY', RU: 'RUB',
}

function normalizeImpact(s) {
  if (!s) return ''
  const v = String(s).trim()
  if (/holiday|non-?economic/i.test(v)) return 'Holiday'
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
}

// FMP date format : "2026-06-04 12:30:00" en UTC → on veut MM-DD-YYYY + h:mmam/pm
// en heure de Paris pour matcher le format consommé par CalendarPage.
function parseFMPDate(dateStr) {
  if (!dateStr) return { date: '', time: '' }
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z')
    if (isNaN(d.getTime())) return { date: '', time: '' }
    const dateFmt = d.toLocaleDateString('en-US', {
      timeZone: 'Europe/Paris',
      month: '2-digit', day: '2-digit', year: 'numeric',
    })
    const [mo, dd, yy] = dateFmt.split('/')
    const datePart = `${mo}-${dd}-${yy}`
    const timeFmt = d.toLocaleString('en-US', {
      timeZone: 'Europe/Paris',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
    const timePart = timeFmt.replace(/\s+/g, '').replace('AM', 'am').replace('PM', 'pm')
    return { date: datePart, time: timePart }
  } catch {
    return { date: '', time: '' }
  }
}

// FF date format : "2026-06-04T08:30:00-04:00" (ISO avec offset NY) — voir parseFMPDate
function parseFFDate(iso) {
  if (!iso) return { date: '', time: '' }
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return { date: '', time: '' }
    const dateFmt = d.toLocaleDateString('en-US', {
      timeZone: 'Europe/Paris',
      month: '2-digit', day: '2-digit', year: 'numeric',
    })
    const [mo, dd, yy] = dateFmt.split('/')
    const datePart = `${mo}-${dd}-${yy}`
    const timeFmt = d.toLocaleString('en-US', {
      timeZone: 'Europe/Paris',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
    const timePart = timeFmt.replace(/\s+/g, '').replace('AM', 'am').replace('PM', 'pm')
    return { date: datePart, time: timePart }
  } catch {
    return { date: '', time: '' }
  }
}

function getWeekRange(week) {
  const now = new Date()
  const day = now.getDay()
  const offsetToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + offsetToMonday)
  monday.setHours(0, 0, 0, 0)
  if (week === 'next') monday.setDate(monday.getDate() + 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { from: monday, to: sunday }
}

function ymd(d) {
  return d.toISOString().slice(0, 10)
}

// ── FMP fetcher ───────────────────────────────────────────────────────────
// Endpoint : https://financialmodelingprep.com/api/v3/economic_calendar
// Returns events with: date, country, event, currency, previous, estimate, actual, change, changePercentage, impact
// → Includes ACTUALS, which is the whole point of preferring FMP over FF.
async function fetchFMP(range) {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) return null

  const from = ymd(range.from)
  const to = ymd(range.to)
  const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${from}&to=${to}&apikey=${apiKey}`

  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QuantaraBot/1.0)' },
  })
  if (!res.ok) {
    console.error('[FMP] HTTP', res.status, await res.text().catch(() => ''))
    return null
  }
  const data = await res.json()
  if (!Array.isArray(data)) return null

  return data.map((e, i) => {
    const { date, time } = parseFMPDate(e.date)
    const currency = (e.currency || '').toUpperCase()
    const country = (e.country || '').toUpperCase().length === 2
      ? (e.country || '').toLowerCase()
      : (CURRENCY_TO_COUNTRY[currency] || currency.slice(0, 2)).toLowerCase()
    return {
      id:       `fmp-${i}-${(e.event || '').slice(0, 30)}`,
      title:    e.event || '',
      country,
      currency: currency || COUNTRY_TO_CURRENCY[country?.toUpperCase()] || '',
      date,
      time,
      impact:   normalizeImpact(e.impact),
      forecast: e.estimate != null && e.estimate !== '' ? String(e.estimate).trim() : '',
      previous: e.previous != null && e.previous !== '' ? String(e.previous).trim() : '',
      actual:   e.actual != null && e.actual !== '' ? String(e.actual).trim() : '',
    }
  })
}

// ── ForexFactory fetcher (fallback, no actuals) ──────────────────────────
function ffUrl(week) {
  return week === 'next'
    ? 'https://nfs.faireconomy.media/ff_calendar_nextweek.json'
    : 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
}
async function fetchFF(week, range) {
  const res = await fetch(ffUrl(week), {
    cache: 'no-store',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; QuantaraBot/1.0)',
      'Accept': 'application/json,text/plain,*/*',
    },
  })
  if (!res.ok) {
    console.error('[FF] HTTP', res.status)
    return null
  }
  const ffEvents = await res.json()
  if (!Array.isArray(ffEvents)) return null

  return ffEvents
    .filter(e => {
      if (!e.date) return false
      const t = new Date(e.date).getTime()
      return !isNaN(t) && t >= range.from.getTime() && t <= range.to.getTime()
    })
    .map((e, i) => {
      const { date, time } = parseFFDate(e.date)
      const currency = (e.country || '').toUpperCase()
      const country = (CURRENCY_TO_COUNTRY[currency] || currency.slice(0, 2)).toLowerCase()
      return {
        id:       `ff-${i}-${(e.title || '').slice(0, 30)}`,
        title:    e.title || '',
        country,
        currency,
        date,
        time,
        impact:   normalizeImpact(e.impact),
        forecast: e.forecast != null && e.forecast !== '' ? String(e.forecast).trim() : '',
        previous: e.previous != null && e.previous !== '' ? String(e.previous).trim() : '',
        actual:   e.actual != null && e.actual !== '' ? String(e.actual).trim() : '',
      }
    })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week') || 'this'

    if (week !== 'this' && week !== 'next') {
      return Response.json({ error: 'Invalid week param (must be "this" or "next")', events: [] }, { status: 400 })
    }

    // ── Sécurité #1 : rate limit ──
    const ip = getClientIp(request)
    const limit = rateLimit({ key: `calendar:${ip}`, windowMs: 60_000, max: 30 })
    if (!limit.allowed) {
      return rateLimitResponse(limit, 'Trop de requêtes calendrier. Ralentis un peu.')
    }

    // ── Sécurité #2 : cache 5 min ──
    const cacheKey = `calendar:${week}`
    const cached = CACHE.get(cacheKey)
    const now = Date.now()
    if (cached && cached.expiresAt > now) {
      return new Response(JSON.stringify(cached.payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Cache': 'HIT',
          'X-Cache-Age': String(Math.floor((CACHE_TTL_MS - (cached.expiresAt - now)) / 1000)),
        },
      })
    }

    const range = getWeekRange(week)
    let events = null
    let source = null
    let hasActuals = false

    // 1) Try FMP first if API key configured (gives actuals)
    events = await fetchFMP(range)
    if (events && events.length > 0) {
      source = 'fmp'
      hasActuals = events.some(e => !!e.actual)
    }

    // 2) Fallback to ForexFactory (full schedule + forecast/previous but no actuals)
    if (!events || events.length === 0) {
      events = await fetchFF(week, range)
      if (events) source = 'forexfactory'
    }

    if (!events) {
      return Response.json({
        error: 'Both sources (FMP + ForexFactory) unreachable. Try again in a few minutes.',
        events: [], week,
      }, { status: 502 })
    }

    const payload = {
      events,
      week,
      count: events.length,
      fetched: new Date().toISOString(),
      source,
      hasActuals, // tell the UI whether actuals are expected from this source
    }
    CACHE.set(cacheKey, { payload, expiresAt: Date.now() + CACHE_TTL_MS })

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Cache': 'MISS',
      },
    })
  } catch (err) {
    console.error('[/api/calendar] error:', err.message)
    return Response.json({ error: 'Erreur calendrier économique', events: [] }, { status: 500 })
  }
}
