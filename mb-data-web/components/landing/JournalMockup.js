// JournalMockup — simulation visuelle de /app/journal pour la landing.
// Reproduit le pattern : header avec filtres pills par firme + table dense de trades.

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

const FIRM_FILTERS = [
  { name: 'Toutes les firms', count: 6, active: true },
  { name: 'Topstep', count: 3 },
  { name: 'Apex',    count: 2 },
  { name: 'Lucid',   count: 1 },
  { name: 'MFFU',    count: 1 },
]

const TRADES = [
  { date: '15 mai', time: '09:42', firm: 'Topstep', inst: 'MNQ', side: 'LONG',  entry: 18254.50, pnl: 138.00,  note: 'Cassure résistance' },
  { date: '15 mai', time: '10:18', firm: 'Topstep', inst: 'MNQ', side: 'SHORT', entry: 18301.00, pnl: 90.00,   note: 'Rejet du high' },
  { date: '15 mai', time: '14:05', firm: 'Apex',    inst: 'MES', side: 'LONG',  entry: 5247.25,  pnl: 56.25,   note: 'FOMC reaction' },
  { date: '14 mai', time: '15:30', firm: 'Apex',    inst: 'MES', side: 'SHORT', entry: 5258.00,  pnl: -55.00,  note: 'Bad entry' },
  { date: '14 mai', time: '11:22', firm: 'MFFU',    inst: 'MGC', side: 'LONG',  entry: 2348.40,  pnl: 34.00,   note: 'Gold bounce' },
  { date: '13 mai', time: '13:15', firm: 'Topstep', inst: 'MNQ', side: 'LONG',  entry: 18198.50, pnl: 67.00,   note: 'Trend continuation' },
  { date: '13 mai', time: '09:55', firm: 'Lucid',   inst: 'MES', side: 'SHORT', entry: 5223.50,  pnl: -13.75,  note: 'Stopped out' },
]

function SideTag({ side }) {
  const isLong = side === 'LONG'
  const color = isLong ? C.green : C.red
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      background: `${color}1a`,
      border: `1px solid ${color}44`,
      fontSize: 9, fontWeight: 700, color, fontFamily: mono,
      letterSpacing: '0.06em',
    }}>
      {isLong ? '↑' : '↓'} {side}
    </span>
  )
}

function fmtPnl(n) {
  return (n >= 0 ? '+$' : '-$') + Math.abs(n).toFixed(2)
}

export default function JournalMockup() {
  return (
    <div style={{
      background: C.bg, padding: '24px 28px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: C.text, minHeight: 500,
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
          }}>Journal de trading</h1>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 4, fontFamily: mono, letterSpacing: '0.04em' }}>
            7 TRADES · 3 DERNIERS JOURS · <span style={{ color: C.green, fontWeight: 600 }}>+$316.50 NET</span>
          </div>
        </div>
        <button style={{
          padding: '8px 14px', fontSize: 11, fontWeight: 600,
          background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
          color: '#fff', border: 'none', borderRadius: 7,
          fontFamily: 'inherit', cursor: 'default',
          boxShadow: '0 4px 12px rgba(45,111,255,0.3)',
        }}>+ Nouveau trade</button>
      </div>

      {/* Firm filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {FIRM_FILTERS.map(f => (
          <div key={f.name} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 99,
            background: f.active ? 'rgba(45,111,255,0.15)' : 'transparent',
            border: `1px solid ${f.active ? 'rgba(45,111,255,0.4)' : C.border}`,
            fontSize: 11, fontWeight: f.active ? 600 : 500,
            color: f.active ? C.blueLight : C.text2,
          }}>
            {f.name}
            <span style={{
              fontSize: 9, padding: '1px 6px', borderRadius: 99,
              background: f.active ? 'rgba(45,111,255,0.25)' : 'rgba(255,255,255,0.05)',
              color: f.active ? C.blueLight : C.text3,
              fontFamily: mono, fontWeight: 600,
            }}>{f.count}</span>
          </div>
        ))}
      </div>

      {/* Trades table */}
      <div style={{
        background: 'rgba(20,23,32,0.65)',
        border: `1px solid ${C.border}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        {/* Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '70px 60px 90px 60px 80px 90px 100px 1fr',
          padding: '8px 14px',
          background: 'rgba(255,255,255,0.025)',
          borderBottom: `1px solid ${C.border}`,
          fontSize: 9, fontWeight: 600, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: mono,
        }}>
          <span>Date</span>
          <span>Heure</span>
          <span>Firm</span>
          <span>Inst.</span>
          <span>Side</span>
          <span>Entry</span>
          <span>PnL</span>
          <span>Notes</span>
        </div>

        {/* Rows */}
        {TRADES.map((t, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '70px 60px 90px 60px 80px 90px 100px 1fr',
            padding: '10px 14px',
            borderBottom: i < TRADES.length - 1 ? `1px solid ${C.border}` : 'none',
            alignItems: 'center',
            fontSize: 11, fontFamily: mono,
          }}>
            <span style={{ fontWeight: 600 }}>{t.date}</span>
            <span style={{ color: C.text2 }}>{t.time}</span>
            <span style={{ fontWeight: 700 }}>{t.firm}</span>
            <span style={{ color: C.text2 }}>{t.inst}</span>
            <SideTag side={t.side} />
            <span style={{ color: C.text2 }}>{t.entry.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span style={{
              fontWeight: 700,
              color: t.pnl >= 0 ? C.green : C.red,
            }}>{fmtPnl(t.pnl)}</span>
            <span style={{
              color: C.text3, fontFamily: '-apple-system, sans-serif',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{t.note}</span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{
        marginTop: 14, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        fontSize: 10, color: C.text3, fontFamily: mono,
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        <span>Affichage 1-7 sur 84 trades</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <PgBtn>&lt;</PgBtn>
          <PgBtn active>1</PgBtn>
          <PgBtn>2</PgBtn>
          <PgBtn>3</PgBtn>
          <PgBtn>···</PgBtn>
          <PgBtn>12</PgBtn>
          <PgBtn>&gt;</PgBtn>
        </div>
      </div>
    </div>
  )
}

function PgBtn({ children, active }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 24, height: 24, padding: '0 6px',
      fontSize: 10, fontWeight: active ? 700 : 500,
      borderRadius: 5,
      background: active ? C.blue : 'rgba(255,255,255,0.04)',
      color: active ? '#fff' : C.text2,
      border: `1px solid ${active ? C.blue : C.border}`,
      fontFamily: mono,
    }}>{children}</span>
  )
}
