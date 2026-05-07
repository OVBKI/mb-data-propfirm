// Endpoint calendrier économique — source : Finnhub (free tier 60 calls/min)
// Migration depuis ForexFactory (XML RSS) vers Finnhub (JSON officiel)
//
// Env var requise côté Vercel : FINNHUB_API_KEY
// → https://vercel.com/dashboard → Project → Settings → Environment Variables
//
// Le format de sortie reste IDENTIQUE à l'ancien (ForexFactory) pour éviter
// toute modif côté CalendarPage.js — on mappe les champs Finnhub vers les nôtres.

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Mapping ISO 2-letter country code → devise forex (utilisé pour filtrer dans l'UI)
const COUNTRY_TO_CURRENCY = {
  'US': 'USD',
  // Zone euro
  'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
  'BE': 'EUR', 'AT': 'EUR', 'GR': 'EUR', 'IE': 'EUR', 'PT': 'EUR',
  'FI': 'EUR', 'EU': 'EUR', 'EZ': 'EUR',
  // Reste du G10
  'GB': 'GBP', 'UK': 'GBP',
  'JP': 'JPY',
  'CA': 'CAD',
  'AU': 'AUD',
  'NZ': 'NZD',
  'CH': 'CHF',
  // Autres
  'CN': 'CNY',
}

// "2026-04-01" → "04-01-2026" (format MM-DD-YYYY attendu par CalendarPage)
function isoToFFDate(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-')
  return `${m}-${d}-${y}`
}

// Convertit un datetime UTC ("2026-04-01 14:30:00") en heure locale du user (Paris/Bruxelles)
// au format "h:mmam/pm" attendu par CalendarPage. Si le formatage échoue → renvoie tel quel.
function utcToLocalTime(dateStr, timeStr) {
  if (!timeStr) return ''
  try {
    const utc = new Date(`${dateStr}T${timeStr}Z`)
    if (isNaN(utc.getTime())) return ''
    // Affiche en heure de Paris (CET/CEST) — la plupart des users sont en EU
    const formatted = utc.toLocaleString('en-US', {
      timeZone: 'Europe/Paris',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    // "2:30 PM" → "2:30pm"
    return formatted.replace(/\s+/g, '').replace('AM', 'am').replace('PM', 'pm')
  } catch {
    return timeStr
  }
}

// "high" → "High", "medium" → "Medium", "low" → "Low"
function capitalizeImpact(s) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

// Calcule la fenêtre [from, to] selon `week` ('this' | 'next')
// Semaine ISO : Lundi → Dimanche
function getWeekRange(week) {
  const now = new Date()
  const day = now.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const offsetToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + offsetToMonday)
  monday.setHours(0, 0, 0, 0)

  if (week === 'next') monday.setDate(monday.getDate() + 7)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const ymd = (d) => d.toISOString().slice(0, 10)
  return { from: ymd(monday), to: ymd(sunday) }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week') || 'this'

    const apiKey = process.env.FINNHUB_API_KEY
    if (!apiKey) {
      return Response.json({
        error: 'FINNHUB_API_KEY non configurée sur Vercel. Va dans Settings → Environment Variables et ajoute-la.',
        events: [],
        week,
      }, { status: 500 })
    }

    const { from, to } = getWeekRange(week)
    const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`

    const res = await fetch(url, { cache: 'no-store' })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return Response.json({
        error: `Finnhub unreachable (HTTP ${res.status})${body ? ': ' + body.slice(0, 200) : ''}`,
        events: [],
        week,
      }, { status: 502 })
    }

    const data = await res.json()
    const fhEvents = Array.isArray(data.economicCalendar) ? data.economicCalendar : []

    // Mapping vers le format ForexFactory que CalendarPage attend déjà
    const events = fhEvents.map((e, i) => {
      const [datePart = '', timePart = ''] = (e.time || '').split(' ')
      const country = e.country || ''
      return {
        id:       `fh-${i}-${(e.event || '').slice(0, 30)}`,
        title:    e.event || '',
        country,
        currency: COUNTRY_TO_CURRENCY[country] || country,
        date:     isoToFFDate(datePart),
        time:     utcToLocalTime(datePart, timePart),
        impact:   capitalizeImpact(e.impact),
        forecast: e.estimate != null ? String(e.estimate) : '',
        previous: e.prev != null ? String(e.prev) : '',
        actual:   e.actual != null ? String(e.actual) : '',
      }
    })

    return new Response(JSON.stringify({
      events,
      week,
      count: events.length,
      fetched: new Date().toISOString(),
      source: 'finnhub',
      range: { from, to },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    })
  } catch (err) {
    return Response.json({ error: err.message, events: [] }, { status: 500 })
  }
}
