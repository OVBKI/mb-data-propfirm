// EconomicCalendarMockup — réplique de CalendarPage.js réel.
// Structure réelle observée :
//   eyebrow "CALENDRIER ÉCONOMIQUE" amber
//   h1 "Calendrier Économique"
//   subtitle "Données Finnhub · heures Paris (CET) — actualisé toutes les minutes"
//   toggles langue (FR/EN/ES) + période (Cette semaine / Semaine prochaine)
//   filtres impact + devises (pills)
//   events groupés par jour : Heure · Devise (flag) · Événement · Réel · Prévision · Précédent · Impact

import { ECON_DAYS, COLORS } from './mockData'

const C = {
  ...COLORS,
  border2: 'rgba(255,255,255,0.13)',
}
const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

// Couleurs impact (cohérent avec IC dans CalendarPage)
const IMPACT = {
  High:   { dot: C.red,    text: C.red,    bg: 'rgba(232,80,74,0.03)' },
  Medium: { dot: C.amber,  text: C.amber,  bg: 'transparent' },
  Low:    { dot: C.text3,  text: C.text3,  bg: 'transparent' },
}

// Events mockés viennent de mockData (aujourd'hui = mardi 18 mai)
const DAYS = ECON_DAYS

// Mini flag rendu (badge pays code 2 lettres au lieu de fetch image — plus fiable)
function FlagBadge({ cc, cur }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: mono, fontSize: 10,
    }}>
      <span style={{
        padding: '2px 6px', borderRadius: 3,
        background: 'rgba(255,255,255,0.05)',
        color: C.text3, fontWeight: 700, letterSpacing: '0.04em',
      }}>{cc}</span>
      <span style={{ color: C.text2, fontWeight: 600 }}>{cur}</span>
    </div>
  )
}

function ImpactDot({ impact }) {
  const s = IMPACT[impact] || IMPACT.Low
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 10, fontWeight: 600, color: s.text,
      fontFamily: mono, letterSpacing: '0.05em',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: s.dot,
        boxShadow: impact === 'High' ? `0 0 6px ${s.dot}` : 'none',
      }} />
      {impact === 'High' ? 'Fort' : impact === 'Medium' ? 'Moyen' : 'Faible'}
    </span>
  )
}

function StatVal({ label, value, isActual }) {
  // Couleur du "réel" vs "prévision" (mimique getActualColor)
  let color = C.text2
  if (isActual && value !== '—') {
    // Simulé : ici on met juste vert pour les valeurs présentes
    color = C.green
  }
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontSize: 8, color: C.text3, fontFamily: mono,
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2,
      }}>{label}</div>
      <div style={{
        fontSize: 11, fontWeight: 600, fontFamily: mono,
        color: value === '—' ? C.text3 : (isActual ? color : C.text2),
      }}>{value}</div>
    </div>
  )
}

export default function EconomicCalendarMockup() {
  return (
    <div style={{
      background: '#0a0c10',
      padding: '24px 28px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: C.text, minHeight: 520,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 18, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontSize: 10, color: C.amber,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            fontWeight: 600, marginBottom: 8,
          }}>Calendrier Économique</div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, margin: 0,
            letterSpacing: '-0.025em', lineHeight: 1.1,
          }}>Calendrier Économique</h1>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>
            Données Finnhub · heures Paris (CET) — actualisé toutes les minutes · MàJ : il y a 32s
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Langue toggle */}
          <Toggle items={['FR', 'EN', 'ES']} active="FR" />
          {/* Période toggle */}
          <Toggle items={['Cette semaine', 'Semaine prochaine']} active="Cette semaine" pill />
        </div>
      </div>

      {/* Filtres card : Impact + Devises */}
      <div style={{
        padding: '12px 14px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10, marginBottom: 14,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: C.text3,
            textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: 60,
          }}>Impact</span>
          <FilterPill label="Toutes" active />
          <FilterPill label="🔴 Fort" />
          <FilterPill label="🟠 Moyen" />
          <FilterPill label="🟡 Faible" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: C.text3,
            textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: 60,
          }}>Devises</span>
          <FilterPill label="Toutes" active />
          <FilterPill label="USD" />
          <FilterPill label="EUR" />
          <FilterPill label="GBP" />
          <FilterPill label="JPY" />
        </div>
      </div>

      {/* Events grouped by day */}
      {DAYS.map((day, di) => (
        <div key={di} style={{ marginBottom: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8,
            marginBottom: 8, paddingLeft: 4,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{day.label}</span>
            <span style={{
              fontSize: 9, color: C.text3, fontFamily: mono,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>· {day.events.length} évènements</span>
          </div>
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10, overflow: 'hidden',
          }}>
            {day.events.map((e, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '55px 90px 1fr 90px 75px 75px 75px',
                gap: 12, alignItems: 'center',
                padding: '10px 14px',
                background: IMPACT[e.impact]?.bg,
                borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: C.text, fontFamily: mono,
                }}>{e.time}</span>
                <FlagBadge cc={e.cc} cur={e.cur} />
                <span style={{
                  fontSize: 12, color: C.text, fontWeight: 500,
                }}>{e.name}</span>
                <ImpactDot impact={e.impact} />
                <StatVal label="Réel"      value={e.actual} isActual />
                <StatVal label="Prévision" value={e.forecast} />
                <StatVal label="Précédent" value={e.previous} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Toggle({ items, active, pill }) {
  return (
    <div style={{
      display: 'flex',
      border: `0.5px solid ${C.border2}`,
      borderRadius: pill ? 99 : 6, overflow: 'hidden',
      background: C.surface,
    }}>
      {items.map(i => (
        <span key={i} style={{
          padding: '5px 11px', fontSize: 10, fontWeight: 600,
          background: i === active ? C.blue : 'transparent',
          color: i === active ? '#fff' : C.text2,
          letterSpacing: '0.04em',
        }}>{i}</span>
      ))}
    </div>
  )
}

function FilterPill({ label, active }) {
  return (
    <span style={{
      padding: '4px 11px', fontSize: 10, fontWeight: active ? 600 : 500,
      borderRadius: 99,
      background: active ? 'rgba(45,111,255,0.15)' : 'transparent',
      border: `1px solid ${active ? 'rgba(45,111,255,0.4)' : 'rgba(255,255,255,0.10)'}`,
      color: active ? C.blueLight : C.text2,
    }}>{label}</span>
  )
}
