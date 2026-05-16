'use client'
// EconomicCalendarMockup — vue calendrier économique de Quantara comme dans l'app.
// Style ForexFactory : événements macro par jour avec impact (high/medium/low),
// devise concernée, forecast vs previous vs actual.

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#5a6275',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#10b981',
  red: '#ef4444',
  amber: '#fac775',
  high: '#ef4444',
  med: '#fac775',
  low: '#5a6275',
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

const events = [
  { day: 'Aujourd\'hui · Jeu 15 mai', items: [
    { time: '08:30', cur: 'USD', flag: '🇺🇸', impact: 'high', event: 'Core CPI m/m', forecast: '0.3%', previous: '0.4%', actual: '0.3%', done: true, surprise: 'neutral' },
    { time: '08:30', cur: 'USD', flag: '🇺🇸', impact: 'high', event: 'Unemployment Claims', forecast: '220K', previous: '231K', actual: '229K', done: true, surprise: 'neutral' },
    { time: '14:00', cur: 'USD', flag: '🇺🇸', impact: 'high', event: 'Fed Powell Speech', forecast: '—', previous: '—', actual: null, done: false, soon: true },
    { time: '15:30', cur: 'EUR', flag: '🇪🇺', impact: 'med',  event: 'Industrial Production', forecast: '0.2%', previous: '-0.1%', actual: null, done: false },
  ]},
  { day: 'Demain · Ven 16 mai', items: [
    { time: '08:30', cur: 'USD', flag: '🇺🇸', impact: 'high', event: 'Retail Sales m/m', forecast: '0.4%', previous: '0.6%', actual: null, done: false },
    { time: '10:00', cur: 'USD', flag: '🇺🇸', impact: 'med',  event: 'Prelim UoM Consumer Sentiment', forecast: '77.5', previous: '77.2', actual: null, done: false },
    { time: '15:00', cur: 'CAD', flag: '🇨🇦', impact: 'low',  event: 'BOC Financial System Review', forecast: '—', previous: '—', actual: null, done: false },
  ]},
]

const impactStyles = {
  high: { color: C.red,   bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.35)',   label: 'HIGH' },
  med:  { color: C.amber, bg: 'rgba(250,199,117,0.15)', border: 'rgba(250,199,117,0.35)', label: 'MED' },
  low:  { color: C.text3, bg: 'rgba(90,98,117,0.15)',   border: 'rgba(90,98,117,0.3)',    label: 'LOW' },
}

export default function EconomicCalendarMockup() {
  return (
    <div style={{
      background: C.bg,
      color: C.text,
      padding: '16px 18px',
      minHeight: 480,
      maxHeight: 540,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Calendrier économique</div>
          <div style={{ fontSize: 10, color: C.text3, fontFamily: mono, marginTop: 3, letterSpacing: '0.05em' }}>
            ÉVÉNEMENTS MACRO À FORT IMPACT · LIVE FOREXFACTORY
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 5 }}>
          {[
            { label: 'Toutes', active: true },
            { label: 'High', icon: '●', color: C.red },
            { label: 'Med', icon: '●', color: C.amber },
          ].map((f, i) => (
            <div key={i} style={{
              padding: '4px 10px',
              background: f.active ? 'rgba(45,111,255,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${f.active ? 'rgba(45,111,255,0.4)' : C.border}`,
              borderRadius: 99,
              fontSize: 10,
              color: f.active ? C.blueLight : C.text2,
              fontWeight: f.active ? 600 : 400,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              cursor: 'pointer',
            }}>
              {f.icon && <span style={{ color: f.color, fontSize: 8 }}>{f.icon}</span>}
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Liste des jours + events */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {events.map((day, di) => (
          <div key={di}>
            {/* Day label */}
            <div style={{
              fontSize: 11, fontWeight: 600, color: C.text2,
              marginBottom: 6,
              padding: '4px 0',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {day.day}
              <span style={{
                fontSize: 9, color: C.text3, fontFamily: mono,
                letterSpacing: '0.1em',
              }}>
                · {day.items.length} ÉVÉNEMENTS
              </span>
            </div>

            {/* Items */}
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              {day.items.map((ev, i) => {
                const impact = impactStyles[ev.impact]
                return (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 40px 1fr 60px 70px 70px 70px',
                    gap: 10,
                    padding: '10px 14px',
                    borderBottom: i === day.items.length - 1 ? 'none' : `1px solid ${C.border}`,
                    alignItems: 'center',
                    fontSize: 11,
                    background: ev.soon ? 'rgba(45,111,255,0.05)' : 'transparent',
                  }}>
                    {/* Time */}
                    <div style={{
                      color: ev.soon ? C.blueLight : C.text,
                      fontFamily: mono,
                      fontWeight: ev.soon ? 700 : 400,
                      fontSize: 11,
                    }}>
                      {ev.time}
                    </div>

                    {/* Currency + flag */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 10, color: C.text2, fontFamily: mono,
                    }}>
                      <span style={{ fontSize: 12 }}>{ev.flag}</span>
                      {ev.cur}
                    </div>

                    {/* Event name */}
                    <div style={{
                      color: C.text,
                      fontSize: 11,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      {ev.event}
                      {ev.soon && (
                        <span style={{
                          fontSize: 8, color: C.blueLight,
                          padding: '1px 5px',
                          background: 'rgba(45,111,255,0.18)',
                          border: '1px solid rgba(45,111,255,0.4)',
                          borderRadius: 3,
                          fontFamily: mono,
                          letterSpacing: '0.1em',
                        }}>
                          DANS 30 MIN
                        </span>
                      )}
                    </div>

                    {/* Impact badge */}
                    <div style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: impact.color,
                      background: impact.bg,
                      border: `1px solid ${impact.border}`,
                      borderRadius: 3,
                      padding: '2px 6px',
                      textAlign: 'center',
                      letterSpacing: '0.1em',
                      fontFamily: mono,
                      width: 'fit-content',
                    }}>
                      {impact.label}
                    </div>

                    {/* Forecast */}
                    <div style={{
                      fontSize: 10, color: C.text3, fontFamily: mono,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 7, color: C.text3, letterSpacing: '0.1em', marginBottom: 1 }}>FCST</div>
                      {ev.forecast}
                    </div>

                    {/* Previous */}
                    <div style={{
                      fontSize: 10, color: C.text2, fontFamily: mono,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 7, color: C.text3, letterSpacing: '0.1em', marginBottom: 1 }}>PREV</div>
                      {ev.previous}
                    </div>

                    {/* Actual */}
                    <div style={{
                      fontSize: 11, fontWeight: 700, fontFamily: mono,
                      textAlign: 'center',
                      color: ev.done ? (ev.actual === ev.forecast ? C.text : ev.actual > ev.forecast ? C.green : C.red) : C.text3,
                    }}>
                      <div style={{ fontSize: 7, color: C.text3, letterSpacing: '0.1em', marginBottom: 1, fontWeight: 400 }}>ACTUAL</div>
                      {ev.actual || '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
