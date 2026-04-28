'use client'
import { useState, useEffect } from 'react'

// ── Translations ──
const T = {
  fr: {
    title: 'Calendrier Économique',
    subtitle: 'Données ForexFactory — actualisé toutes les 5 minutes',
    thisWeek: 'Cette semaine',
    nextWeek: 'Semaine prochaine',
    refresh: '↻ Actualiser',
    loading: 'Chargement...',
    error: 'Erreur de chargement',
    noEvents: 'Aucun événement',
    all: 'Tout',
    high: '🔴 Fort',
    medium: '🟠 Moyen',
    low: '🟡 Faible',
    holiday: '📅 Férié',
    time: 'Heure',
    currency: 'Devise',
    event: 'Événement',
    actual: 'Réel',
    forecast: 'Prévision',
    previous: 'Précédent',
    impact: 'Impact',
    country: 'Pays',
    filterImpact: 'Filtrer par impact',
    filterCurrency: 'Filtrer par devise',
    lastUpdate: 'Dernière mise à jour',
    days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    months: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'],
    betterThanExpected: 'Meilleur que prévu',
    worseThanExpected: 'Moins bon que prévu',
    asExpected: 'Conforme aux prévisions',
  },
  en: {
    title: 'Economic Calendar',
    subtitle: 'ForexFactory data — refreshed every 5 minutes',
    thisWeek: 'This week',
    nextWeek: 'Next week',
    refresh: '↻ Refresh',
    loading: 'Loading...',
    error: 'Loading error',
    noEvents: 'No events',
    all: 'All',
    high: '🔴 High',
    medium: '🟠 Medium',
    low: '🟡 Low',
    holiday: '📅 Holiday',
    time: 'Time',
    currency: 'Currency',
    event: 'Event',
    actual: 'Actual',
    forecast: 'Forecast',
    previous: 'Previous',
    impact: 'Impact',
    country: 'Country',
    filterImpact: 'Filter by impact',
    filterCurrency: 'Filter by currency',
    lastUpdate: 'Last update',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    betterThanExpected: 'Better than expected',
    worseThanExpected: 'Worse than expected',
    asExpected: 'As expected',
  },
  es: {
    title: 'Calendario Económico',
    subtitle: 'Datos ForexFactory — actualizado cada 5 minutos',
    thisWeek: 'Esta semana',
    nextWeek: 'Próxima semana',
    refresh: '↻ Actualizar',
    loading: 'Cargando...',
    error: 'Error de carga',
    noEvents: 'Sin eventos',
    all: 'Todo',
    high: '🔴 Alto',
    medium: '🟠 Medio',
    low: '🟡 Bajo',
    holiday: '📅 Festivo',
    time: 'Hora',
    currency: 'Divisa',
    event: 'Evento',
    actual: 'Real',
    forecast: 'Previsión',
    previous: 'Anterior',
    impact: 'Impacto',
    country: 'País',
    filterImpact: 'Filtrar por impacto',
    filterCurrency: 'Filtrar por divisa',
    lastUpdate: 'Última actualización',
    days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    months: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
    betterThanExpected: 'Mejor de lo esperado',
    worseThanExpected: 'Peor de lo esperado',
    asExpected: 'Según lo previsto',
  }
}

const IMPACT_COLORS = {
  High:    { bg: 'rgba(232,80,74,0.15)',  border: '#e8504a', dot: '#e8504a',  text: '#e8504a'  },
  Medium:  { bg: 'rgba(250,199,117,0.15)', border: '#fac775', dot: '#fac775', text: '#fac775'  },
  Low:     { bg: 'rgba(86,94,120,0.15)',  border: '#565e78', dot: '#565e78',  text: '#565e78'  },
  Holiday: { bg: 'rgba(45,111,255,0.1)', border: '#2d6fff', dot: '#2d6fff',  text: '#4d8fff'  },
}

const FLAG_EMOJIS = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CAD: '🇨🇦',
  AUD: '🇦🇺', NZD: '🇳🇿', CHF: '🇨🇭', CNY: '🇨🇳', SEK: '🇸🇪',
}

function impactColor(impact) {
  return IMPACT_COLORS[impact] || IMPACT_COLORS.Low
}

function formatDate(dateStr, lang) {
  // dateStr format: "01-27-2025" (MM-DD-YYYY from FF)
  if (!dateStr) return ''
  try {
    const [m, d, y] = dateStr.split('-')
    const date = new Date(`${y}-${m}-${d}T00:00:00`)
    const t = T[lang]
    const dow = t.days[(date.getDay() + 6) % 7]
    const month = t.months[date.getMonth()]
    return `${dow} ${parseInt(d)} ${month} ${y}`
  } catch { return dateStr }
}

function getActualColor(actual, forecast) {
  if (!actual || actual === '' || !forecast || forecast === '') return 'var(--text)'
  const a = parseFloat(actual.replace(/[^0-9.-]/g, ''))
  const f = parseFloat(forecast.replace(/[^0-9.-]/g, ''))
  if (isNaN(a) || isNaN(f)) return 'var(--text)'
  if (a > f) return 'var(--green)'
  if (a < f) return 'var(--red)'
  return 'var(--amber-text)'
}

export default function CalendarPage({ lang = 'fr' }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [week, setWeek] = useState('this')
  const [filterImpact, setFilterImpact] = useState('all')
  const [filterCurrency, setFilterCurrency] = useState('all')
  const [lastUpdate, setLastUpdate] = useState('')
  const [expandedDay, setExpandedDay] = useState(null)

  const t = T[lang] || T.fr

  async function loadCalendar() {
    setLoading(true); setError('')
    try {
      const r = await fetch(`/api/calendar?week=${week}&t=${Date.now()}`)
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setEvents(data.events || [])
      setLastUpdate(new Date().toLocaleTimeString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { loadCalendar() }, [week])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadCalendar, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [week])

  // Group by date
  const grouped = {}
  const currencies = new Set()
  events.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = []
    if (e.currency) currencies.add(e.currency)
    // Apply filters
    const impactMatch = filterImpact === 'all' || e.impact === filterImpact
    const currencyMatch = filterCurrency === 'all' || e.currency === filterCurrency
    if (impactMatch && currencyMatch) grouped[e.date].push(e)
  })

  const sortedDates = Object.keys(grouped).sort()
  const todayStr = (() => {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const y = d.getFullYear()
    return `${m}-${day}-${y}`
  })()

  // Set default expanded day to today
  useEffect(() => {
    if (sortedDates.includes(todayStr)) setExpandedDay(todayStr)
    else if (sortedDates.length) setExpandedDay(sortedDates[0])
  }, [events.length])

  const S = {
    card: { background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)' },
    btn: (active) => ({
      padding: '6px 14px', fontSize: '12px', cursor: 'pointer', borderRadius: '99px',
      border: '0.5px solid var(--border2)',
      background: active ? 'var(--blue)' : 'transparent',
      color: active ? '#fff' : 'var(--text2)',
      fontFamily: 'inherit', fontWeight: '500', transition: 'all 0.15s'
    }),
    select: {
      padding: '6px 10px', fontSize: '12px', border: '0.5px solid var(--border2)',
      borderRadius: '8px', background: 'var(--surface2)', color: 'var(--text)',
      outline: 'none', fontFamily: 'inherit', cursor: 'pointer'
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>{t.title}</h1>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
            {t.subtitle}
            {lastUpdate && <span> · {t.lastUpdate} : {lastUpdate}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Week selector */}
          <div style={{ display: 'flex', border: '0.5px solid var(--border2)', borderRadius: '99px', overflow: 'hidden', background: 'var(--surface)' }}>
            <button onClick={() => setWeek('this')} style={S.btn(week === 'this')}>{t.thisWeek}</button>
            <button onClick={() => setWeek('next')} style={S.btn(week === 'next')}>{t.nextWeek}</button>
          </div>
          <button onClick={loadCalendar} style={{ ...S.btn(false), background: 'var(--surface2)' }}>{t.refresh}</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.filterImpact} :</div>
        {['all', 'High', 'Medium', 'Low'].map(imp => (
          <button key={imp} onClick={() => setFilterImpact(imp)} style={S.btn(filterImpact === imp)}>
            {imp === 'all' ? t.all : imp === 'High' ? t.high : imp === 'Medium' ? t.medium : t.low}
          </button>
        ))}
        <div style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.filterCurrency} :</div>
        <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)} style={S.select}>
          <option value="all">{t.all}</option>
          {[...currencies].sort().map(c => <option key={c} value={c}>{FLAG_EMOJIS[c] || ''} {c}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ ...S.card, padding: '60px', textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          {t.loading}
        </div>
      ) : error ? (
        <div style={{ ...S.card, padding: '40px', textAlign: 'center', color: 'var(--red-text)', background: 'var(--red-bg)' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
          {t.error}: {error}
        </div>
      ) : sortedDates.length === 0 ? (
        <div style={{ ...S.card, padding: '60px', textAlign: 'center', color: 'var(--text3)' }}>{t.noEvents}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedDates.map(date => {
            const dayEvents = grouped[date]
            if (!dayEvents || !dayEvents.length) return null
            const isToday = date === todayStr
            const isExpanded = expandedDay === date
            const highCount = dayEvents.filter(e => e.impact === 'High').length
            const medCount  = dayEvents.filter(e => e.impact === 'Medium').length

            return (
              <div key={date} style={{ ...S.card, overflow: 'hidden', borderColor: isToday ? 'var(--blue)' : 'rgba(255,255,255,0.07)' }}>
                {/* Day header */}
                <div
                  onClick={() => setExpandedDay(isExpanded ? null : date)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', background: isToday ? 'rgba(45,111,255,0.06)' : 'var(--surface2)', borderBottom: isExpanded ? '0.5px solid var(--border)' : 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isToday && <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '99px', background: 'var(--blue)', color: '#fff', textTransform: 'uppercase' }}>Aujourd'hui</span>}
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{formatDate(date, lang)}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {highCount > 0 && <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '99px', background: 'rgba(232,80,74,0.15)', color: '#e8504a' }}>🔴 {highCount}</span>}
                    {medCount  > 0 && <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '99px', background: 'rgba(250,199,117,0.15)', color: '#fac775' }}>🟠 {medCount}</span>}
                    <span style={{ color: 'var(--text3)', fontSize: '16px', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                  </div>
                </div>

                {/* Events table */}
                {isExpanded && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface2)' }}>
                          {[t.time, t.currency, t.impact, t.event, t.actual, t.forecast, t.previous].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dayEvents.map((evt, i) => {
                          const ic = impactColor(evt.impact)
                          const actualColor = getActualColor(evt.actual, evt.forecast)
                          const isHigh = evt.impact === 'High'
                          return (
                            <tr key={i} style={{ borderBottom: '0.5px solid var(--border)', background: isHigh ? 'rgba(232,80,74,0.03)' : 'transparent' }}>
                              <td style={{ padding: '11px 14px', color: 'var(--text2)', whiteSpace: 'nowrap', fontWeight: '500' }}>
                                {evt.time || '—'}
                              </td>
                              <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ fontSize: '16px' }}>{FLAG_EMOJIS[evt.currency] || ''}</span>
                                  <span style={{ fontWeight: '600', fontSize: '12px' }}>{evt.currency}</span>
                                </div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ic.dot, flexShrink: 0 }} />
                                  <span style={{ fontSize: '11px', color: ic.text, fontWeight: '600' }}>{evt.impact || '—'}</span>
                                </div>
                              </td>
                              <td style={{ padding: '11px 14px', maxWidth: '280px' }}>
                                <div style={{ fontWeight: evt.impact === 'High' ? '600' : '400', color: 'var(--text)' }}>{evt.title}</div>
                                {evt.country && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{evt.country}</div>}
                              </td>
                              <td style={{ padding: '11px 14px', fontWeight: '700', color: actualColor, whiteSpace: 'nowrap' }}>
                                {evt.actual || '—'}
                              </td>
                              <td style={{ padding: '11px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                                {evt.forecast || '—'}
                              </td>
                              <td style={{ padding: '11px 14px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                                {evt.previous || '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Source */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--text3)' }}>
        Source : <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-light)', textDecoration: 'none' }}>ForexFactory</a>
        {' '}· Les données sont fournies à titre indicatif uniquement.
      </div>
    </div>
  )
}
