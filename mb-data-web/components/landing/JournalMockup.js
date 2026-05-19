// JournalMockup — réplique du JournalPage.js réel.
// Structure réelle observée :
//   eyebrow "JOURNAL DE TRADING" blue
//   h1 "Chaque trade. Tracké. Analysé."
//   subtitle "X trades enregistrés · saisie manuelle"
//   buttons [↓ CSV] [+ Ajouter trade]
//   Filtres card : Statut pills + Firme dropdown + Compte dropdown
//   6 PNL stats cards (Filtré / Mois / Win Rate / Consistency / Trades / Jours)
//   Calendrier PnL mensuel (heatmap vert/rouge)

import { CAL_DAYS, PNL_MAY, TODAY_MONTH_FR, COLORS } from './mockData'
import { useT } from '../LanguageProvider'

const C = {
  ...COLORS,
  border2: 'rgba(255,255,255,0.13)',
}
const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

function fmtMoneyShort(n) {
  return (n >= 0 ? '+' : '-') + '$' + Math.abs(n)
}

export default function JournalMockup() {
  const t = useT()
  const DAYS = [
    t('mockups.journal.dayMon'),
    t('mockups.journal.dayTue'),
    t('mockups.journal.dayWed'),
    t('mockups.journal.dayThu'),
    t('mockups.journal.dayFri'),
    t('mockups.journal.daySat'),
    t('mockups.journal.daySun'),
  ]
  const monthLabel = t('mockups.journal.monthMay2026')
  return (
    <div style={{
      background: '#0a0c10',
      padding: '24px 28px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: C.text, minHeight: 540,
    }}>
      {/* Header (eyebrow + title + subtitle + actions) */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 18, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontSize: 10, color: C.blueLight,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            fontWeight: 600, marginBottom: 8,
          }}>{t('mockups.journal.eyebrow')}</div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, margin: 0,
            letterSpacing: '-0.025em', lineHeight: 1.1,
            marginBottom: 4,
          }}>{t('mockups.journal.title')}</h1>
          <div style={{ fontSize: 11, color: C.text3 }}>
            {t('mockups.journal.subtitle')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{
            padding: '6px 12px', fontSize: 10, fontWeight: 500,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: C.text2, borderRadius: 6,
          }}>{t('mockups.journal.btnCsv')}</span>
          <span style={{
            padding: '6px 12px', fontSize: 10, fontWeight: 500,
            background: C.text, color: '#0a0c10', borderRadius: 6,
            boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
          }}>{t('mockups.journal.btnAddTrade')}</span>
        </div>
      </div>

      {/* Filtres card : Statut pills + Firme/Compte selects */}
      <div style={{
        padding: '12px 14px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10, marginBottom: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Statut row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: C.text3,
            textTransform: 'uppercase', letterSpacing: '0.5px',
            minWidth: 50,
          }}>{t('mockups.journal.filterStatus')}</span>
          <StatusPill label={t('mockups.journal.pillAll')} active />
          <StatusPill label={t('mockups.common.statusChallenge')} dot={C.amber} />
          <StatusPill label={t('mockups.common.statusFinance')} dot={C.green} />
          <StatusPill label={t('mockups.common.statusEchoue')} dot={C.red} />
        </div>
        {/* Firme + Compte */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: C.text3,
              textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: 50,
            }}>{t('mockups.journal.filterFirm')}</span>
            <FakeSelect value={t('mockups.journal.selectAllFirms')} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: C.text3,
              textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: 50,
            }}>{t('mockups.journal.filterAccount')}</span>
            <FakeSelect value={t('mockups.journal.selectAllAccts')} />
          </div>
        </div>
      </div>

      {/* 6 PNL stats cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 8, marginBottom: 18,
      }}>
        <PnlCard label={t('mockups.journal.pnlFiltered')}   value={PNL_MAY.netDisplay} color={C.green} />
        <PnlCard label={t('mockups.journal.pnlMonth').replace('{month}', monthLabel)} value={PNL_MAY.netDisplay} color={C.green} />
        <PnlCard label={t('mockups.journal.pnlWinRate')}     value="78.5%"  color={C.green} />
        <PnlCard label={t('mockups.journal.pnlConsistency')} value="22.4%"  />
        <PnlCard label={t('mockups.journal.pnlTrades')}      value="42" />
        <PnlCard label={t('mockups.journal.pnlTradedDays')}  value="11" />
      </div>

      {/* Calendrier PnL */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {t('mockups.journal.calendarTitle')} <span style={{ color: C.text3, fontWeight: 500 }}>— {monthLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <NavBtn>◀</NavBtn>
          <span style={{
            padding: '4px 12px', fontSize: 10, fontWeight: 600,
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${C.border}`, borderRadius: 5,
            color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>{t('mockups.journal.todayBtn')}</span>
          <NavBtn>▶</NavBtn>
        </div>
      </div>

      {/* Day labels */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4, marginBottom: 4,
      }}>
        {DAYS.map(d => (
          <div key={d} style={{
            fontSize: 9, color: C.text3, textAlign: 'center', padding: '4px 0',
            fontFamily: mono, letterSpacing: '0.1em', textTransform: 'uppercase',
            fontWeight: 600,
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
      }}>
        {CAL_DAYS.map((c, i) => {
          const hasPnl = c.pnl !== undefined
          const isProfit = (c.pnl || 0) >= 0
          const intensity = hasPnl ? 0.12 + Math.min(0.4, Math.abs(c.pnl) / 500) : 0
          const bg = !hasPnl
            ? (c.other ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)')
            : isProfit ? `rgba(29,184,122,${intensity})` : `rgba(232,80,74,${intensity})`
          return (
            <div key={i} style={{
              aspectRatio: '1.35',
              background: bg,
              borderRadius: 5,
              padding: '4px 6px',
              border: c.today ? `1px solid ${C.blueLight}` : '1px solid rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              opacity: c.other ? 0.35 : 1,
            }}>
              <div style={{
                fontSize: 9, fontWeight: c.today ? 700 : 500,
                color: c.today ? C.blueLight : (hasPnl ? C.text : C.text3),
                fontFamily: mono,
              }}>{c.day}</div>
              {hasPnl && (
                <div style={{
                  fontSize: 9, fontWeight: 700,
                  color: isProfit ? C.green : C.red,
                  textAlign: 'right', fontFamily: mono, lineHeight: 1,
                }}>{fmtMoneyShort(c.pnl)}</div>
              )}
              {hasPnl && (
                <div style={{
                  fontSize: 7, color: C.text3,
                  textAlign: 'right', fontFamily: mono, marginTop: 1,
                }}>{c.count} {c.count > 1 ? t('mockups.journal.tradePlural') : t('mockups.journal.tradeSingular')}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusPill({ label, active, dot }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 11px', borderRadius: 99,
      background: active ? 'rgba(45,111,255,0.15)' : 'transparent',
      border: `1px solid ${active ? 'rgba(45,111,255,0.4)' : 'rgba(255,255,255,0.10)'}`,
      fontSize: 10, fontWeight: active ? 600 : 500,
      color: active ? C.blueLight : C.text2,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}
      {label}
    </span>
  )
}

function FakeSelect({ value }) {
  return (
    <div style={{
      flex: 1, padding: '7px 11px', fontSize: 11,
      background: 'rgba(28,32,48,0.7)',
      border: `1px solid ${C.border2}`,
      borderRadius: 6, color: C.text,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span>{value}</span>
      <span style={{ color: C.text3, fontSize: 9 }}>▼</span>
    </div>
  )
}

function PnlCard({ label, value, color }) {
  return (
    <div style={{
      padding: '10px 11px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
    }}>
      <div style={{
        fontSize: 8, color: C.text3,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        marginBottom: 6, fontWeight: 600,
      }}>{label}</div>
      <div style={{
        fontSize: 15, fontWeight: 700,
        color: color || C.text, fontFamily: mono,
        letterSpacing: '-0.015em',
      }}>{value}</div>
    </div>
  )
}

function NavBtn({ children }) {
  return (
    <span style={{
      padding: '4px 8px', fontSize: 10, fontWeight: 600,
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${C.border}`, borderRadius: 5,
      color: C.text2,
    }}>{children}</span>
  )
}
