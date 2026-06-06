// Endpoint calendrier économique — source : ForexFactory (free JSON feed)
// Migration depuis Finnhub (data incomplète sur les events) vers FF (référence retail).
//
// PAS DE CLÉ API REQUISE — le feed est public à `nfs.faireconomy.media`.
// Si pour une raison ce feed devient indisponible, on retombe sur ff_calendar
// directement (qui est moins stable mais existe).
//
// Le format de sortie reste IDENTIQUE à l'ancien Finnhub pour éviter toute
// modif côté CalendarPage.js — on mappe les champs FF vers les nôtres.
//
// SÉCURITÉ — gardée intacte depuis la version Finnhub :
//   1. CACHE IN-MEMORY 5 min par {week} → évite de spammer le feed FF
//   2. RATE LIMIT IP : 30 req/min/IP → empêche un bot scraper d'abuser
//   3. CACHE-CONTROL public 5 min → CDN Vercel + browser cache aussi

import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit'
import { getClientIp } from '../../../lib/apiAuth'

// Cache server-side simple : key = "this" | "next" → { events, fetched, expiresAt }
const CACHE = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Mapping devise → ISO 2-letter country code (pour drapeaux côté front)
// FF utilise déjà le code devise dans `country`, mais on garde le mapping
// au cas où on voudrait afficher le pays distinctement.
const CURRENCY_TO_COUNTRY = {
  USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CAD: 'CA', AUD: 'AU',
  NZD: 'NZ', CHF: 'CH', CNY: 'CN', HKD: 'HK', SGD: 'SG', KRW: 'KR',
  INR: 'IN', SEK: 'SE', NOK: 'NO', DKK: 'DK', PLN: 'PL', CZK: 'CZ',
  HUF: 'HU', MXN: 'MX', BRL: 'BR', ZAR: 'ZA', TRY: 'TR', RUB: 'RU',
}

// FF date format : "2026-06-04T08:30:00-04:00" (ISO avec offset NY/ET)
// → on veut un { date: "MM-DD-YYYY", time: "h:mmam/pm" } en heure de Paris
// pour matcher exactement ce que CalendarPage attendait du flux Finnhub.
function parseFFDate(iso) {
  if (!iso) return { date: '', time: '' }
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return { date: '', time: '' }
    // Heure Paris pour les users EU (majorité)
    const dateStr = d.toLocaleDateString('en-US', {
      timeZone: 'Europe/Paris',
      month: '2-digit', day: '2-digit', year: 'numeric',
    }) // "06/04/2026"
    const [mo, dd, yy] = dateStr.split('/')
    const datePart = `${mo}-${dd}-${yy}`

    // FF marque "All Day" ou les holidays sans heure spécifique en mettant
    // 12:00am — on garde tel quel, CalendarPage gère "All Day"
    const timeStr = d.toLocaleString('en-US', {
      timeZone: 'Europe/Paris',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }) // "8:30 AM"
    const timePart = timeStr.replace(/\s+/g, '').replace('AM', 'am').replace('PM', 'pm')

    return { date: datePart, time: timePart }
  } catch {
    return { date: '', time: '' }
  }
}

// FF impact : "Low" | "Medium" | "High" | "Holiday" — déjà capitalisé, on garde
function normalizeImpact(s) {
  if (!s) return ''
  const v = String(s).trim()
  // FF utilise parfois "Non-Economic" pour les holidays
  if (/holiday|non-?economic/i.test(v)) return 'Holiday'
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
}

// Calcule la fenêtre [from, to] de la semaine demandée (lundi → dimanche).
// Sert uniquement à filtrer les events FF côté serveur (le feed contient
// systématiquement la semaine en cours OU la suivante selon l'URL).
function getWeekRange(week) {
  const now = new Date()
  const day = now.getDay() // 0 = Sun
  const offsetToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + offsetToMonday)
  monday.setHours(0, 0, 0, 0)
  if (week === 'next') monday.setDate(monday.getDate() + 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { from: monday.getTime(), to: sunday.getTime() }
}

// URL du feed FF — JSON officieux mais stable (faireconomy.media est le
// mirror communautaire). 2 feeds : thisweek + nextweek.
function feedUrl(week) {
  return week === 'next'
    ? 'https://nfs.faireconomy.media/ff_calendar_nextweek.json'
    : 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week') || 'this'

    if (week !== 'this' && week !== 'next') {
      return Response.json({ error: 'Invalid week param (must be "this" or "next")', events: [] }, { status: 400 })
    }

    // ── Sécurité #1 : rate limit par IP ──
    const ip = getClientIp(request)
    const limit = rateLimit({ key: `calendar:${ip}`, windowMs: 60_000, max: 30 })
    if (!limit.allowed) {
      return rateLimitResponse(limit, 'Trop de requêtes calendrier. Ralentis un peu.')
    }

    // ── Sécurité #2 : cache server-side 5 min ──
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

    const res = await fetch(feedUrl(week), {
      cache: 'no-store',
      headers: {
        // FF mirror sometimes blocks default Node fetch UA — pretend to be a browser
        'User-Agent': 'Mozilla/5.0 (compatible; QuantaraBot/1.0)',
        'Accept': 'application/json,text/plain,*/*',
      },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return Response.json({
        error: `ForexFactory unreachable (HTTP ${res.status})${body ? ': ' + body.slice(0, 200) : ''}`,
        events: [],
        week,
      }, { status: 502 })
    }

    const ffEvents = await res.json()
    if (!Array.isArray(ffEvents)) {
      return Response.json({
        error: 'ForexFactory returned unexpected payload (not an array)',
        events: [],
        week,
      }, { status: 502 })
    }

    // Filtre la fenêtre semaine demandée + map au format interne
    const range = getWeekRange(week)
    const events = ffEvents
      .filter(e => {
        if (!e.date) return false
        const t = new Date(e.date).getTime()
        return !isNaN(t) && t >= range.from && t <= range.to
      })
      .map((e, i) => {
        const { date, time } = parseFFDate(e.date)
        const currency = (e.country || '').toUpperCase() // FF puts USD/EUR/etc in country field
        const country = CURRENCY_TO_COUNTRY[currency] || currency.slice(0, 2).toLowerCase()
        return {
          id:       `ff-${i}-${(e.title || '').slice(0, 30)}`,
          title:    e.title || '',
          country,
          currency,
          date,
          time,
          impact:   normalizeImpact(e.impact),
          forecast: e.forecast != null ? String(e.forecast).trim() : '',
          previous: e.previous != null ? String(e.previous).trim() : '',
          actual:   e.actual != null ? String(e.actual).trim() : '',
        }
      })

    const payload = {
      events,
      week,
      count: events.length,
      fetched: new Date().toISOString(),
      source: 'forexfactory',
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
