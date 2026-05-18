// Endpoint calendrier économique — source : Finnhub (free tier 60 calls/min)
// Migration depuis ForexFactory (XML RSS) vers Finnhub (JSON officiel)
//
// Env var requise côté Vercel : FINNHUB_API_KEY
// → https://vercel.com/dashboard → Project → Settings → Environment Variables
//
// Le format de sortie reste IDENTIQUE à l'ancien (ForexFactory) pour éviter
// toute modif côté CalendarPage.js — on mappe les champs Finnhub vers les nôtres.
//
// SÉCURITÉ (mai 2026 — audit Agent #3) :
//   1. CACHE IN-MEMORY 5 min par {week} → évite de burn la clé Finnhub
//      (free tier 60 calls/min). Avant : chaque request hit Finnhub directement.
//   2. RATE LIMIT IP : 30 req/min/IP → empêche un bot scraper d'épuiser la clé
//      via spam de cette route.
//   3. CACHE-CONTROL public 5 min → permet au CDN Vercel + browser de cacher
//      aussi côté edge, réduisant encore plus les hits Finnhub.

import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit'
import { getClientIp } from '../../../lib/apiAuth'

// Cache server-side simple : key = "this" | "next" → { events, fetched, expiresAt }
// Cleanup auto via TTL check à chaque GET.
const CACHE = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Mapping ISO 2-letter country code → devise forex
const COUNTRY_TO_CURRENCY = {
  // === G10 (devises majeures) ===
  'US': 'USD',
  'GB': 'GBP', 'UK': 'GBP',
  'JP': 'JPY',
  'CA': 'CAD',
  'AU': 'AUD',
  'NZ': 'NZD',
  'CH': 'CHF',
  // Zone euro (tous mappés vers EUR)
  'EU': 'EUR', 'EZ': 'EUR',
  'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
  'BE': 'EUR', 'AT': 'EUR', 'GR': 'EUR', 'IE': 'EUR', 'PT': 'EUR',
  'FI': 'EUR', 'LU': 'EUR', 'CY': 'EUR', 'MT': 'EUR', 'SI': 'EUR',
  'SK': 'EUR', 'EE': 'EUR', 'LV': 'EUR', 'LT': 'EUR', 'HR': 'EUR',
  // === Devises secondaires courantes ===
  'CN': 'CNY',
  'HK': 'HKD',
  'SG': 'SGD',
  'KR': 'KRW',
  'IN': 'INR',
  'TW': 'TWD',
  'TH': 'THB',
  'MY': 'MYR',
  'ID': 'IDR',
  'PH': 'PHP',
  'VN': 'VND',
  // Europe (hors zone euro)
  'SE': 'SEK',
  'NO': 'NOK',
  'DK': 'DKK',
  'IS': 'ISK',
  'PL': 'PLN',
  'CZ': 'CZK',
  'HU': 'HUF',
  'RO': 'RON',
  'RU': 'RUB',
  'UA': 'UAH',
  'TR': 'TRY',
  'BG': 'BGN',
  'RS': 'RSD',
  // Amériques
  'MX': 'MXN',
  'BR': 'BRL',
  'AR': 'ARS',
  'CL': 'CLP',
  'CO': 'COP',
  'PE': 'PEN',
  'UY': 'UYU',
  // Moyen-Orient & Afrique
  'AE': 'AED',
  'SA': 'SAR',
  'IL': 'ILS',
  'EG': 'EGP',
  'ZA': 'ZAR',
  'MA': 'MAD',
  'NG': 'NGN',
  // Autres
  'WW': 'WORLD', // Événements globaux (Finnhub utilise 'WW' parfois)
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

    // Validation du param week (anti-injection dans cache key)
    if (week !== 'this' && week !== 'next') {
      return Response.json({ error: 'Invalid week param (must be "this" or "next")', events: [] }, { status: 400 })
    }

    // ── Sécurité #1 : rate limit par IP (30 req/min) ──
    const ip = getClientIp(request)
    const limit = rateLimit({ key: `calendar:${ip}`, windowMs: 60_000, max: 30 })
    if (!limit.allowed) {
      return rateLimitResponse(limit, 'Trop de requêtes calendrier. Ralentis un peu.')
    }

    // ── Sécurité #2 : cache server-side (5 min) ──
    // Évite de spammer Finnhub si plusieurs users demandent la même semaine en parallèle.
    const cacheKey = `calendar:${week}`
    const cached = CACHE.get(cacheKey)
    const now = Date.now()
    if (cached && cached.expiresAt > now) {
      // Hit cache — retourne directement sans appeler Finnhub
      return new Response(JSON.stringify(cached.payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Cache CDN/browser aussi : pas la peine de relancer la requête côté client avant 5 min
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Cache': 'HIT',
          'X-Cache-Age': String(Math.floor((CACHE_TTL_MS - (cached.expiresAt - now)) / 1000)),
        },
      })
    }

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

    const payload = {
      events,
      week,
      count: events.length,
      fetched: new Date().toISOString(),
      source: 'finnhub',
      range: { from, to },
    }

    // ── Sécurité #2 : store dans cache server-side pour les 5 prochaines minutes ──
    CACHE.set(cacheKey, { payload, expiresAt: Date.now() + CACHE_TTL_MS })

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache CDN/browser : 5 min — réduit drastiquement les hits Finnhub
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Cache': 'MISS',
      },
    })
  } catch (err) {
    console.error('[/api/calendar] error:', err.message)
    return Response.json({ error: 'Erreur calendrier économique', events: [] }, { status: 500 })
  }
}
