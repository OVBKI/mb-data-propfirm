// EconomicCalendarMockup — simulation /app/calendar pour la landing.
// Style ForexFactory dark : événements macro par jour avec impact, devise,
// forecast vs previous vs actual.

const C = {
  bg:        '#0a0c10',
  surface:   '#141720',
  surface2:  '#1c2030',
  border:    'rgba(255,255,255,0.07)',
  border2:   'rgba(255,255,255,0.13)',
  text:      '#f0ede8',
  text2:     '#9098b0',
  text3:     '#5a6275',
  blue:      '#2d6fff',
  blueLight: '#4d8fff',
  green:     '#10b981',
  red:       '#ef4444',
  amber:     '#fac775',
}
const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

const EVENTS_TODAY = [
  { time: '08:30', cc: 'US', cur: 'USD', name: 'Core CPI m/m',         impact: 'HIGH', fcst: '0.4%', prev: '0.4%',  actual: '0.3%',  actualColor: C.green, soon: false },
  { time: '08:30', cc: 'US', cur: 'USD', name: 'Unemployment Claims',  impact: 'HIGH', fcst: '220K', prev: '231K',  actual: '229K',  actualColor: C.green, soon: false },
  { time: '14:00', cc: 'US', cur: 'USD', name: 'Fed Powell Speech',    impact: 'HIGH', fcst: '—',    prev: '—',     actual: '—',    soon: true },
  { time: '15:30', cc: 'EU', cur: 'EUR', name: 'Industrial Production', impact: 'MED',  fcst: '0.2%', prev: '-0.1%', actual: '—',    soon: false },
]

const EVENTS_TOMORROW = [
  { time: '08:30', cc: 'US', cur: 'USD', name: 'Retail Sales m/m',              impact: 'HIGH', fcst: '0.4%', prev: '0.6%',  actual: '—' },
  { time: '10:00', cc: 'US', cur: 'USD', name: 'Prelim UoM Consumer Sentiment', impact: 'MED',  fcst: '77.5', prev: '77.2',  actual: '—' },
  { time: '15:00', cc: 'CA', cur: 'CAD', name: 'BOC Financial System Review',   impact: 'LOW',  fcst: '—',    prev: '—',     actual: '—' },
]

function ImpactTag({ impact }) {
  const map = {
    HIGH: { color: C.red,   bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.35)' },
    MED:  { color: C.amber, bg: 'rgba(250,199,117,0.10)', border: 'rgba(250,199,117,0.35)' },
    LOW:  { color: C.text3, bg: 'rgba(255,255,255,0.04)', border: C.border },
  }
  const s = map[impact] || map.LOW
  return (
    <span style={{
      padding: '3px 9px', fontSize: 9, fontWeight: 700,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 5, fontFamily: mono, letterSpacing: '0.08em',
    }}>{impact}</span>
  )
}

function EventRow({ e }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '60px 70px 1fr 70px 100px 100px 100px',
      gap: 10, alignItems: 'center',
      padding: '11px 16px',
      background: e.soon ? 'rgba(45,111,255,0.05)' : 'transparent',
      borderTop: `1px solid ${C.border}`,
    }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: e.soon ? C.blueLight : C.text, fontFamily: mono,
      }}>{e.time}</span>

      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 10, color: C.text2, fontFamily: mono,
      }}>
        <span style={{
          fontSize: 9, padding: '2px 5px', borderRadius: 3,
          background: 'rgba(255,255,255,0.05)', color: C.text3,
          fontWeight: 700, letterSpacing: '0.05em',
        }}>{e.cc}</span>
        <span style={{ fontWeight: 600 }}>{e.cur}</span>
      </span>

      <span style={{
        fontSize: 12, color: C.text, fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {e.name}
        {e.soon && (
          <span style={{
            fontSize: 8, padding: '2px 7px', borderRadius: 4,
            background: 'rgba(45,111,255,0.18)', color: C.blueLight,
            fontWeight: 700, fontFamily: mono, letterSpacing: '0.1em',
            border: '1px solid rgba(45,111,255,0.4)',
          }}>DANS 30 MIN</span>
        )}
      </span>

      <ImpactTag impact={e.impact} />

      <StatCell label="FCST" value={e.fcst} />
      <StatCell label="PREV" value={e.prev} />
      <StatCell label="ACTUAL" value={e.actual} color={e.actualColor} />
    </div>
  )
}

function StatCell({ label, value, color }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontSize: 8, color: C.text3, fontFamily: mono,
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3,
      }}>{label}</div>
      <div style={{
        fontSize: 11, fontWeight: 600, fontFamily: mono,
        color: color || C.text2,
      }}>{value}</div>
    </div>
  )
}

export default function EconomicCalendarMockup() {
  return (
    <div style={{
      background: C.bg, padding: '24px 28px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: C.text, minHeight: 480,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 16, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, margin: 0,
            letterSpacing: '-0.02em',
          }}>Calendrier économique</h1>
          <div style={{ fontSize: 10, color: C.text3, marginTop: 4, fontFamily: mono, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Événements macro à fort impact · live forexfactory
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 5 }}>
          <FilterPill label="Toutes" active />
          <FilterPill label="High"  dot={C.red} />
          <FilterPill label="Med"   dot={C.amber} />
        </div>
      </div>

      {/* Section AUJOURD'HUI */}
      <SectionLabel title="Aujourd'hui · Jeu 15 mai" count={4} />
      <div style={{
        background: 'rgba(20,23,32,0.65)',
        border: `1px solid ${C.border}`,
        borderRadius: 10, overflow: 'hidden', marginBottom: 14,
      }}>
        {EVENTS_TODAY.map((e, i) => (
          <EventRow key={i} e={e} />
        ))}
      </div>

      {/* Section DEMAIN */}
      <SectionLabel title="Demain · Ven 16 mai" count={3} />
      <div style={{
        background: 'rgba(20,23,32,0.65)',
        border: `1px solid ${C.border}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        {EVENTS_TOMORROW.map((e, i) => (
          <EventRow key={i} e={e} />
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ title, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 8,
      marginBottom: 8, marginTop: 4,
    }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
      <span style={{
        fontSize: 9, color: C.text3, fontFamily: mono,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>· {count} évènements</span>
    </div>
  )
}

function FilterPill({ label, active, dot }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '6px 12px', borderRadius: 99,
      background: active ? 'rgba(45,111,255,0.15)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${active ? 'rgba(45,111,255,0.4)' : C.border}`,
      fontSize: 11, fontWeight: active ? 600 : 500,
      color: active ? C.blueLight : C.text2,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}
      {label}
    </span>
  )
}
