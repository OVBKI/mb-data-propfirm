// EquityCurveDemo — réplique de la EquityCurveCard du JournalPage.js réel.
// Structure observée dans le JournalPage :
//   header : logo firme + nom compte + "Firm · Plan · DD type" + bouton + Trade
//            | balance (vert/rouge) + variation %
//   ligne payout : "X payout : net +Y$ (brut +Z$ · split N%)"
//   section "Jours validés (≥X$)" avec progress bar et compteur
//   chart : Balance (vert smooth) + ligne DD (rouge step)
//
// Données fictives : un compte Lucid Plan 50K Financé qui performe bien.

const C = {
  surface:   'rgba(20,23,32,0.65)',
  surface2:  'rgba(28,32,48,0.7)',
  border:    'rgba(255,255,255,0.07)',
  border2:   'rgba(255,255,255,0.13)',
  text:      '#f0ede8',
  text2:     '#9098b0',
  text3:     '#5a6275',
  blue:      '#2d6fff',
  blueLight: '#4d8fff',
  green:     '#1db87a',
  greenSoft: 'rgba(29,184,122,0.15)',
  red:       '#e8504a',
  amber:     '#fac775',
}
const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

// === Génère 12 jours de balance progressivement haussière ===
// Start $50K, finit $51,120 (croissance progressive + petits dips réalistes)
function genBalance() {
  const days = ['2026-05-08', '2026-05-09', '2026-05-10', '2026-05-11', '2026-05-12',
                '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16', '2026-05-17',
                '2026-05-18', '2026-05-19']
  const vals = [50000, 50300, 50180, 50890, 51000, 51400, 51280, 51800, 52050, 52240, 51980, 51120]
  return days.map((d, i) => ({ date: d, balance: vals[i] }))
}

const DATA = genBalance()

// DD EOD line en step : reste à $48K puis monte progressivement par paliers
function genDD() {
  const ddVals = [48000, 48000, 48000, 48000, 48890, 48890, 49400, 49400, 49800, 49964, 49964, 49964]
  return DATA.map((d, i) => ({ date: d.date, dd: ddVals[i] }))
}
const DD = genDD()

function fmtDate(s) {
  // "2026-05-08" → "8 mai"
  const [, m, d] = s.split('-')
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

export default function EquityCurveDemo() {
  // Chart dimensions
  const W = 700, H = 280
  const P = { l: 50, r: 16, t: 18, b: 32 }
  const innerW = W - P.l - P.r
  const innerH = H - P.t - P.b

  const minVal = 47500
  const maxVal = 52500
  const xstep = innerW / (DATA.length - 1)

  const x = i => P.l + i * xstep
  const y = v => P.t + (1 - (v - minVal) / (maxVal - minVal)) * innerH

  // Balance path + area
  const balancePath = DATA.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.balance).toFixed(1)}`).join(' ')
  const balanceArea = balancePath + ` L ${x(DATA.length - 1).toFixed(1)} ${(H - P.b).toFixed(1)} L ${x(0).toFixed(1)} ${(H - P.b).toFixed(1)} Z`

  // DD line en step (rouge pointillé)
  const ddPath = DD.map((d, i) => {
    const X = x(i).toFixed(1)
    const Y = y(d.dd).toFixed(1)
    if (i === 0) return `M ${X} ${Y}`
    const prevY = y(DD[i - 1].dd).toFixed(1)
    return `L ${X} ${prevY} L ${X} ${Y}`
  }).join(' ')

  const finalBalance = DATA[DATA.length - 1].balance
  const initialBalance = 50000
  const netGain = finalBalance - initialBalance
  const variation = ((netGain / initialBalance) * 100).toFixed(2)

  // Y axis ticks
  const yTicks = [48000, 49500, 51000, 52500]
  const xTicksIdx = [0, 3, 6, 9, 11]

  return (
    <div style={{
      background: '#0a0c10', padding: 24,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: C.text, minHeight: 480,
    }}>
      {/* Card mère */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 18,
      }}>
        {/* Header : logo + nom + meta | balance + variation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14, gap: 10, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Logo Lucid (fac775 = amber) */}
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #fac775, #e8a043)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color: '#0a0c10',
              letterSpacing: '-0.02em',
            }}>LUC</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>PRO 7</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>
                Lucid Trading · Plan 50K · DD EOD
              </div>
            </div>
            {/* + Trade button */}
            <span style={{
              marginLeft: 8,
              fontSize: 9, padding: '5px 9px', borderRadius: 6,
              background: 'rgba(45,111,255,0.10)',
              border: '1px solid rgba(45,111,255,0.35)',
              color: C.blueLight, fontWeight: 600,
            }}>+ Trade</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 18, fontWeight: 700,
              color: C.green, fontFamily: mono,
              letterSpacing: '-0.015em', lineHeight: 1,
            }}>${finalBalance.toLocaleString('en-US')}</div>
            <div style={{
              fontSize: 11, color: C.green, fontFamily: mono, marginTop: 3,
            }}>+${netGain.toLocaleString('en-US')} ({variation}%)</div>
          </div>
        </div>

        {/* Ligne payouts */}
        <div style={{
          fontSize: 11, color: C.text2, marginBottom: 10,
          padding: '7px 12px',
          background: 'rgba(255,255,255,0.025)',
          borderRadius: 6, fontFamily: mono,
        }}>
          💰 1 payout : net <span style={{ color: C.green, fontWeight: 600 }}>+$1,008</span>
          <span style={{ color: C.text3 }}> (brut +$1,120 · split 90%)</span>
        </div>

        {/* Jours validés progress */}
        <div style={{
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${C.border}`,
          borderRadius: 8, marginBottom: 14,
        }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 7,
          }}>
            <div style={{ fontSize: 10, fontFamily: mono, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              📅 Jours validés (≥$150)
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.green, fontFamily: mono }}>3 / 5 · 60%</div>
          </div>
          <div style={{
            height: 6, borderRadius: 99,
            background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
          }}>
            <div style={{
              width: '60%', height: '100%',
              background: `linear-gradient(90deg, ${C.green}, ${C.greenSoft})`,
              borderRadius: 99,
              boxShadow: `0 0 10px ${C.green}60`,
            }} />
          </div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 5, fontFamily: mono }}>
            Encore 2 jours à ≥$150 pour ton prochain payout
          </div>
        </div>

        {/* Légende chart */}
        <div style={{
          display: 'flex', gap: 18, marginBottom: 8,
          fontSize: 9, color: C.text3, fontFamily: mono,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 16, height: 2, background: C.green, borderRadius: 2 }} />
            Balance
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 16, height: 2,
              backgroundImage: `repeating-linear-gradient(90deg, ${C.red} 0 4px, transparent 4px 7px)`,
            }} />
            DD EOD ($2,000) → actuellement <span style={{ color: C.text2, fontWeight: 600 }}>$49,964</span>
          </span>
        </div>

        {/* Chart SVG */}
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.green} stopOpacity="0.35" />
              <stop offset="100%" stopColor={C.green} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y grid lines + labels */}
          {yTicks.map(v => {
            const yPos = y(v)
            return (
              <g key={v}>
                <line x1={P.l} y1={yPos} x2={W - P.r} y2={yPos}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <text x={P.l - 6} y={yPos + 3} fill={C.text3}
                  fontSize="9" fontFamily={mono} textAnchor="end" letterSpacing="0.05em">
                  ${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K
                </text>
              </g>
            )
          })}

          {/* Area sous balance */}
          <path d={balanceArea} fill="url(#balanceFill)" />

          {/* DD trailing line (rouge step pointillé) */}
          <path d={ddPath} fill="none" stroke={C.red} strokeWidth="1.5"
            strokeDasharray="5 4" opacity="0.85" strokeLinecap="round" />

          {/* Balance line (vert smooth) */}
          <path d={balancePath} fill="none" stroke={C.green} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Points sur chaque jour */}
          {DATA.map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d.balance)} r="2.5" fill={C.green} />
          ))}

          {/* X axis labels (5 dates) */}
          {xTicksIdx.map(i => (
            <text key={i} x={x(i)} y={H - 10}
              fill={C.text3} fontSize="9" fontFamily={mono}
              textAnchor="middle" letterSpacing="0.04em">
              {fmtDate(DATA[i].date)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}
