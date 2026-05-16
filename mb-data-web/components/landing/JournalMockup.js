'use client'
// JournalMockup — vue complète du journal de trading Quantara comme dans l'app.
// Contient : header avec filtres + bouton "Nouveau trade" + table des trades détaillés.
// Données mockées réalistes (instruments futures, side long/short, PnL, notes).

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
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

const trades = [
  { date: '15 mai', time: '09:42', firm: 'Topstep', inst: 'MNQ',  side: 'LONG',  entry: 18254.50, exit: 18289.25, qty: 2, pnl: 138.00,  notes: 'Cassure résistance' },
  { date: '15 mai', time: '10:18', firm: 'Topstep', inst: 'MNQ',  side: 'SHORT', entry: 18301.00, exit: 18278.50, qty: 2, pnl: 90.00,   notes: 'Rejet du high' },
  { date: '15 mai', time: '14:05', firm: 'Apex',    inst: 'MES',  side: 'LONG',  entry: 5247.25,  exit: 5251.00,  qty: 3, pnl: 56.25,   notes: 'FOMC reaction' },
  { date: '14 mai', time: '15:30', firm: 'Apex',    inst: 'MES',  side: 'SHORT', entry: 5258.00,  exit: 5263.50,  qty: 2, pnl: -55.00,  notes: 'Bad entry' },
  { date: '14 mai', time: '11:22', firm: 'MFFU',    inst: 'MGC',  side: 'LONG',  entry: 2348.40,  exit: 2351.80,  qty: 1, pnl: 34.00,   notes: 'Gold bounce' },
  { date: '13 mai', time: '13:15', firm: 'Topstep', inst: 'MNQ',  side: 'LONG',  entry: 18198.50, exit: 18215.25, qty: 2, pnl: 67.00,   notes: 'Trend continuation' },
  { date: '13 mai', time: '09:55', firm: 'Lucid',   inst: 'MES',  side: 'SHORT', entry: 5223.50,  exit: 5226.25,  qty: 1, pnl: -13.75,  notes: 'Stopped out' },
]

export default function JournalMockup() {
  return (
    <div style={{
      background: C.bg,
      color: C.text,
      padding: '16px 18px',
      minHeight: 480,
      maxHeight: 540,
    }}>
      {/* Header avec titre + bouton + filtres */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Journal de trading</div>
          <div style={{ fontSize: 10, color: C.text3, fontFamily: mono, marginTop: 3, letterSpacing: '0.05em' }}>
            7 TRADES · 3 DERNIERS JOURS · +$316.50 NET
          </div>
        </div>
        <button style={{
          padding: '7px 14px',
          background: C.blue, color: '#fff',
          border: 'none', borderRadius: 6,
          fontSize: 11, fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          + Nouveau trade
        </button>
      </div>

      {/* Filtres en pill */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 12,
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Toutes les firms', count: 4, active: true },
          { label: 'Topstep', count: 3 },
          { label: 'Apex', count: 2 },
          { label: 'Lucid', count: 1 },
          { label: 'MFFU', count: 1 },
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
          }}>
            {f.label}
            <span style={{
              fontSize: 9, color: C.text3, fontFamily: mono,
              padding: '1px 5px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 3,
            }}>{f.count}</span>
          </div>
        ))}
      </div>

      {/* Tableau des trades */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {/* Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '75px 60px 70px 60px 90px 80px 70px 1fr',
          gap: 10,
          padding: '9px 14px',
          background: C.surface2,
          fontSize: 9,
          color: C.text3,
          fontFamily: mono,
          letterSpacing: '0.08em',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div>DATE</div>
          <div>HEURE</div>
          <div>FIRM</div>
          <div>INST.</div>
          <div>SIDE</div>
          <div>ENTRY</div>
          <div style={{ textAlign: 'right' }}>PNL</div>
          <div>NOTES</div>
        </div>

        {/* Rows */}
        {trades.map((t, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '75px 60px 70px 60px 90px 80px 70px 1fr',
            gap: 10,
            padding: '10px 14px',
            borderBottom: i === trades.length - 1 ? 'none' : `1px solid ${C.border}`,
            fontSize: 11,
            fontFamily: mono,
            alignItems: 'center',
          }}>
            <div style={{ color: C.text }}>{t.date}</div>
            <div style={{ color: C.text2 }}>{t.time}</div>
            <div style={{ color: C.text, fontWeight: 600 }}>{t.firm}</div>
            <div style={{ color: C.text2 }}>{t.inst}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              color: t.side === 'LONG' ? C.green : C.red,
              fontSize: 9, fontWeight: 600,
              padding: '2px 6px',
              background: t.side === 'LONG' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              borderRadius: 3,
              width: 'fit-content',
            }}>
              {t.side === 'LONG' ? '↑' : '↓'} {t.side}
            </div>
            <div style={{ color: C.text2 }}>{t.entry.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div style={{
              textAlign: 'right',
              color: t.pnl >= 0 ? C.green : C.red,
              fontWeight: 700,
            }}>
              {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
            </div>
            <div style={{
              color: C.text3, fontSize: 10,
              fontFamily: 'inherit',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {t.notes}
            </div>
          </div>
        ))}
      </div>

      {/* Footer pagination/summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        padding: '0 4px',
      }}>
        <div style={{ fontSize: 10, color: C.text3, fontFamily: mono, letterSpacing: '0.05em' }}>
          AFFICHAGE 1-7 SUR 84 TRADES
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['‹', '1', '2', '3', '...', '12', '›'].map((p, i) => (
            <button key={i} style={{
              minWidth: 22, height: 22,
              padding: '0 6px',
              background: p === '1' ? C.blue : 'transparent',
              border: `1px solid ${p === '1' ? C.blue : C.border}`,
              borderRadius: 4,
              color: p === '1' ? '#fff' : C.text2,
              fontSize: 10, cursor: 'pointer',
              fontFamily: mono,
            }}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
