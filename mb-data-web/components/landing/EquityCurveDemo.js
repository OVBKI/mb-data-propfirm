// EquityCurveDemo — mockup compact d'un compte avec courbe equity + DD trailing.
// Match exact du screenshot user : header (firm + plan + days) · balance + PNL/ROI
// · graphique SVG balance verte + ligne DD trailing rouge en escalier.

const C = {
  bg:        '#0a0c10',
  surface:   '#141720',
  border:    'rgba(255,255,255,0.07)',
  text:      '#f0ede8',
  text2:     '#9098b0',
  text3:     '#5a6275',
  green:     '#10b981',
  red:       '#ef4444',
  amber:     '#fac775',
}
const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

// Génère une courbe de balance progressivement haussière (30 jours)
// Démarre à $50000, finit à ~$57000 avec petites volatilités.
function generateBalanceCurve(start = 50000, days = 30, target = 57000) {
  const points = []
  let val = start
  const step = (target - start) / days
  for (let i = 0; i <= days; i++) {
    // Tendance haussière + bruit
    const noise = (Math.sin(i * 0.7) + Math.cos(i * 1.3) * 0.5) * 200
    val = start + step * i + noise
    points.push(val)
  }
  // Force le dernier point exactement à target
  points[points.length - 1] = target
  return points
}

// Génère la ligne DD trailing en escalier : ne monte que par paliers,
// reste figée entre les pics. Calculée depuis peak balance - DD max ($2000).
function generateTrailingDD(balances, ddMax = 2000, initialBalance = 50000) {
  const trailing = []
  let peak = initialBalance
  for (const b of balances) {
    if (b > peak) peak = b
    // Cap : trailing ne dépasse jamais la balance initiale
    trailing.push(Math.min(peak - ddMax, initialBalance))
  }
  return trailing
}

const BALANCES = generateBalanceCurve(50000, 30, 56950)
const TRAILING = generateTrailingDD(BALANCES, 2000, 50000)

export default function EquityCurveDemo() {
  const W = 660, H = 280
  const P = { l: 40, r: 16, t: 18, b: 28 }
  const innerW = W - P.l - P.r
  const innerH = H - P.t - P.b

  const minVal = 47000
  const maxVal = 58500
  const xstep = innerW / (BALANCES.length - 1)

  const x = (i) => P.l + i * xstep
  const y = (v) => P.t + (1 - (v - minVal) / (maxVal - minVal)) * innerH

  // Path balance line (smooth + area underneath)
  const balancePath = BALANCES.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const balanceArea = balancePath + ` L ${x(BALANCES.length - 1).toFixed(1)} ${(H - P.b).toFixed(1)} L ${x(0).toFixed(1)} ${(H - P.b).toFixed(1)} Z`

  // Path trailing DD (escalier / step style)
  const trailingPath = TRAILING.map((v, i) => {
    const X = x(i).toFixed(1)
    const Y = y(v).toFixed(1)
    if (i === 0) return `M ${X} ${Y}`
    // Step-after style : L horizontal puis vertical
    const prevY = y(TRAILING[i - 1]).toFixed(1)
    return `L ${X} ${prevY} L ${X} ${Y}`
  }).join(' ')

  // Grid lines (Y axis values)
  const yTicks = [47500, 50500, 53500, 58000]

  return (
    <div style={{
      background: C.bg, padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: C.text, minHeight: 360,
    }}>
      <div style={{
        background: 'rgba(20,23,32,0.65)',
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 18,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 14, gap: 12,
        }}>
          <div>
            <div style={{
              fontSize: 9, color: C.text3, fontFamily: mono,
              textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6,
              padding: '3px 9px', background: 'rgba(255,255,255,0.04)',
              borderRadius: 4, display: 'inline-block', border: `1px solid ${C.border}`,
            }}>TOPSTEP 50K · 30 JOURS</div>
            <div style={{
              fontSize: 26, fontWeight: 700, color: C.green,
              fontFamily: mono, letterSpacing: '-0.02em', lineHeight: 1,
            }}>$56,950</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 9, color: C.text3, fontFamily: mono,
              textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5,
            }}>PNL · ROI</div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: C.green,
              fontFamily: mono,
            }}>+$6,950 · +13.90%</div>
          </div>
        </div>

        {/* Chart */}
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.green} stopOpacity="0.35" />
              <stop offset="100%" stopColor={C.green} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines + Y labels */}
          {yTicks.map(v => {
            const yPos = y(v)
            return (
              <g key={v}>
                <line
                  x1={P.l} y1={yPos} x2={W - P.r} y2={yPos}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1"
                />
                <text
                  x={P.l - 6} y={yPos + 3}
                  fill={C.text3} fontSize="9" fontFamily={mono}
                  textAnchor="end" letterSpacing="0.05em"
                >${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K</text>
              </g>
            )
          })}

          {/* Area under balance curve */}
          <path d={balanceArea} fill="url(#balanceGrad)" />

          {/* DD trailing line (red dashed step) */}
          <path d={trailingPath} fill="none"
            stroke={C.red} strokeWidth="1.5"
            strokeDasharray="4 4" opacity="0.8" strokeLinecap="round" />

          {/* Balance line (smooth green) */}
          <path d={balancePath} fill="none"
            stroke={C.green} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Last point glow */}
          <circle
            cx={x(BALANCES.length - 1)} cy={y(BALANCES[BALANCES.length - 1])}
            r="5" fill={C.green} opacity="0.25"
          />
          <circle
            cx={x(BALANCES.length - 1)} cy={y(BALANCES[BALANCES.length - 1])}
            r="2.5" fill={C.green}
          />
        </svg>

        {/* Legend */}
        <div style={{
          display: 'flex', gap: 18, marginTop: 4,
          fontSize: 10, color: C.text3, fontFamily: mono,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          justifyContent: 'center',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 18, height: 2, background: C.green, borderRadius: 2,
            }} /> Balance
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 18, height: 2,
              backgroundImage: `repeating-linear-gradient(90deg, ${C.red} 0 4px, transparent 4px 8px)`,
            }} /> DD Trailing
          </span>
        </div>
      </div>
    </div>
  )
}
