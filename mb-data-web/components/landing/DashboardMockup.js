// DashboardMockup — Simulation visuelle de /app pour la landing.
// L'utilisateur voit ce mockup AVANT inscription → quand il se connecte,
// il retrouve EXACTEMENT la même UI avec ses vraies données.
//
// Reproduit fidèlement la structure de app/app/page.js : sidebar à gauche,
// topbar greeting, 4 KPI cards, table multi-comptes avec barres DD live.

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

// Comptes mockup — réalistes pour montrer ce que le user verra
const ACCOUNTS = [
  { firm: 'Topstep',  plan: '50K Combine', balance: 52340,  ddUsed: 1250, ddMax: 2000, status: 'OK',        color: C.green },
  { firm: 'Apex',     plan: '100K Eval',   balance: 103820, ddUsed: 2400, ddMax: 3000, status: 'OK',        color: C.green },
  { firm: 'Lucid',    plan: '50K Eval',    balance: 49660,  ddUsed: 1900, ddMax: 2000, status: 'ATTENTION', color: C.amber },
  { firm: 'MFFU',     plan: '150K PA',     balance: 156210, ddUsed: 4200, ddMax: 5000, status: 'FUNDED',    color: C.blueLight },
  { firm: 'Tradeify', plan: '100K Eval',   balance: 100890, ddUsed: 2800, ddMax: 3000, status: 'OK',        color: C.green },
]

const SIDEBAR_ITEMS = [
  { icon: '◫', label: 'Dashboard',  active: true },
  { icon: '☰', label: 'Journal' },
  { icon: '◳', label: 'Calendrier' },
  { icon: '◐', label: 'Equity' },
  { icon: '◉', label: 'Payouts' },
  { icon: '◊', label: 'PropFirms' },
  { icon: '△', label: 'Alertes' },
  { icon: '◇', label: 'Paramètres' },
]

function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US')
}

function StatusBadge({ status, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 99,
      background: `${color}1f`,
      border: `1px solid ${color}55`,
      fontSize: 9, fontWeight: 700, color, fontFamily: mono,
      letterSpacing: '0.06em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {status}
    </span>
  )
}

function DdBar({ used, max }) {
  const pct = Math.min(100, (used / max) * 100)
  const isWarn = pct >= 80
  const isCrit = pct >= 95
  const color = isCrit ? C.red : isWarn ? C.amber : C.green
  return (
    <div style={{ position: 'relative', minWidth: 180 }}>
      <div style={{
        fontSize: 9, color: C.text3, fontFamily: mono,
        display: 'flex', justifyContent: 'space-between', marginBottom: 4,
        letterSpacing: '0.04em',
      }}>
        <span>${used.toLocaleString()}</span>
        <span>${max.toLocaleString()}</span>
      </div>
      <div style={{
        height: 6, borderRadius: 99,
        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color, borderRadius: 99,
          boxShadow: `0 0 12px ${color}80`,
        }} />
      </div>
    </div>
  )
}

export default function DashboardMockup() {
  return (
    <div style={{
      display: 'flex',
      background: C.bg,
      minHeight: 480,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: C.text,
    }}>
      {/* ============ SIDEBAR ============ */}
      <aside style={{
        width: 160, flexShrink: 0,
        background: 'rgba(13,15,20,0.85)',
        borderRight: `1px solid ${C.border}`,
        padding: '16px 0',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Brand */}
        <div style={{ padding: '0 14px 14px', borderBottom: `1px solid ${C.border}`, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff',
            }}>Q</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em' }}>QUANTARA</div>
              <div style={{ fontSize: 7, color: C.text3, letterSpacing: '0.18em', marginTop: 1 }}>BETA</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0 8px' }}>
          {SIDEBAR_ITEMS.map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 10px', borderRadius: 6,
              marginBottom: 2,
              fontSize: 11, fontWeight: item.active ? 600 : 500,
              color: item.active ? C.blueLight : C.text2,
              background: item.active ? 'rgba(45,111,255,0.12)' : 'transparent',
              borderLeft: `2px solid ${item.active ? C.blue : 'transparent'}`,
            }}>
              <span style={{ fontSize: 12, color: item.active ? C.blueLight : C.text3, width: 14, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div style={{ padding: '0 10px' }}>
          <div style={{
            padding: '8px 10px',
            background: 'rgba(45,111,255,0.10)',
            border: '1px solid rgba(45,111,255,0.25)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.blue}, #6e3aff)`,
              flexShrink: 0,
            }} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 10, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>omar@quantara.te...</div>
              <div style={{ fontSize: 8, color: C.text3, fontFamily: mono, letterSpacing: '0.08em', marginTop: 1 }}>PRO PLAN</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ============ CONTENT ============ */}
      <div style={{ flex: 1, padding: '20px 24px', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 18, gap: 12, flexWrap: 'wrap',
        }}>
          <div>
            <h1 style={{
              fontSize: 19, fontWeight: 700, margin: 0,
              letterSpacing: '-0.015em', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              Bonjour Omar
              <span style={{ fontSize: 16 }}>🔥</span>
            </h1>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 3, fontFamily: mono, letterSpacing: '0.04em' }}>
              5 comptes actifs · sync il y a 2s
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{
              padding: '6px 12px', fontSize: 10, fontWeight: 500,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 6, color: C.text2,
              fontFamily: 'inherit', cursor: 'default',
            }}>+ Trade</button>
            <button style={{
              padding: '6px 12px', fontSize: 10, fontWeight: 500,
              background: C.text, color: '#0a0c10',
              border: '1px solid transparent', borderRadius: 6,
              fontFamily: 'inherit', cursor: 'default',
              boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
            }}>+ Compte</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10, marginBottom: 18,
        }}>
          <KpiCard label="Balance totales" value="$462,920" sub="+2.4%" subColor={C.green} />
          <KpiCard label="PnL jour"       value="+$12,920" valueColor={C.green} sub="+1.5%" subColor={C.green} />
          <KpiCard label="Comptes funded" value="1" valueColor={C.text} sub="1 / 5" subColor={C.text3} />
          <KpiCard label="Status global"  value="OK" valueColor={C.green} sub="4/5 OK" subColor={C.text3} />
        </div>

        {/* Accounts table */}
        <div style={{
          background: 'rgba(20,23,32,0.65)',
          border: `1px solid ${C.border}`,
          borderRadius: 10, overflow: 'hidden',
        }}>
          {/* Table header bar */}
          <div style={{
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Mes comptes PropFirm</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 9, color: C.text3, fontFamily: mono, letterSpacing: '0.08em',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: C.green,
                boxShadow: `0 0 6px ${C.green}`,
              }} />
              LIVE
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 2fr 1fr 0.6fr',
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: `1px solid ${C.border}`,
            fontSize: 9, fontWeight: 600, color: C.text3,
            textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: mono,
          }}>
            <span>Firm</span>
            <span>Plan</span>
            <span>Balance</span>
            <span>Drawdown</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {/* Rows */}
          {ACCOUNTS.map((a, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 2fr 1fr 0.6fr',
              padding: '11px 14px',
              borderBottom: i < ACCOUNTS.length - 1 ? `1px solid ${C.border}` : 'none',
              alignItems: 'center',
              fontSize: 11,
            }}>
              <span style={{ fontWeight: 700, fontFamily: mono }}>{a.firm}</span>
              <span style={{ color: C.text2, fontFamily: mono, fontSize: 10 }}>{a.plan}</span>
              <span style={{ color: C.green, fontFamily: mono, fontWeight: 600 }}>{fmtMoney(a.balance)}</span>
              <DdBar used={a.ddUsed} max={a.ddMax} />
              <StatusBadge status={a.status} color={a.color} />
              <span style={{ textAlign: 'right', color: C.text3, fontSize: 14, letterSpacing: '0.1em' }}>···</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, valueColor, sub, subColor }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'rgba(20,23,32,0.65)',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
    }}>
      <div style={{
        fontSize: 8, color: C.text3, fontFamily: mono,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontSize: 18, fontWeight: 700,
        color: valueColor || C.text, fontFamily: mono,
        letterSpacing: '-0.01em', lineHeight: 1,
      }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: 9, color: subColor || C.text3, fontFamily: mono,
          marginTop: 5, letterSpacing: '0.05em',
        }}>{sub}</div>
      )}
    </div>
  )
}
