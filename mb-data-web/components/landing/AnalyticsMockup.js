// AnalyticsMockup — réplique fidèle de la page /app?p=analytics.
// Structure réelle observée dans app/app/page.js (composant AnalyticsCharts) :
//   eyebrow "ANALYTICS" + h1 "Analytics"
//   1) Card "Évolution cumulée"   — line chart 3 lignes (Dépenses/Payouts/Net dashed)
//   2) Grid 2-col :
//      Card "Performance annuelle"  — bar chart groupé par année
//      Card "Performance mensuelle" — bar chart groupé par mois
//   Couleurs : Dépenses #e8504a / Payouts #1db87a / Net #2d6fff
//
// IMPLÉMENTATION : SVG pur (pas Chart.js → léger pour landing, 0 ms TTI).
//
// COHÉRENCE — les chiffres prolongent exactement ceux du DashboardMockup :
//   Total Dépensé : $905
//   Total Payouts : $6,419
//   Résultat net  : +$5,514
//
// Répartition mensuelle (Jun 2025 → Mai 2026, 12 mois cumulés) qui aboutit aux totaux :
//   Mois     Dép  Pay   ΔNet  | Dép cum  Pay cum  Net cum
//   Jun 25 :  75    0    -75  |    75       0       -75
//   Jul 25 :  60  230   +170  |   135     230       +95
//   Aoû 25 :  60  330   +270  |   195     560      +365
//   Sep 25 :  95  330   +235  |   290     890      +600
//   Oct 25 : 100  490   +390  |   390    1380      +990
//   Nov 25 :  90  470   +380  |   480    1850     +1370
//   Déc 25 :  65  530   +465  |   545    2380     +1835  ← bilan 2025
//   Jan 26 :  80  600   +520  |   625    2980     +2355
//   Fév 26 :  70  540   +470  |   695    3520     +2825
//   Mar 26 :  75  760   +685  |   770    4280     +3510
//   Avr 26 :  70  900   +830  |   840    5180     +4340
//   Mai 26 :  65 1239  +1174  |   905    6419     +5514  ← totaux DashboardMockup ✓
//
// Bilan annuel :
//   2025 : Dép $545 · Pay $2,380 · Net +$1,835
//   2026 : Dép $360 · Pay $4,039 · Net +$3,679   (= 905-545 / 6419-2380 / 5514-1835)
//   ✓ tout balance

const C = {
  surface:    'rgba(20,23,32,0.65)',
  surface2:   'rgba(28,32,48,0.7)',
  border:     'rgba(255,255,255,0.07)',
  text:       '#f0ede8',
  text2:      '#9098b0',
  text3:      '#5a6275',
  blue:       '#2d6fff',
  blueLight:  '#4d8fff',
  green:      '#1db87a',
  red:        '#e8504a',
  amber:      '#fac775',
  grid:       'rgba(255,255,255,0.04)',
  gridStrong: 'rgba(255,255,255,0.08)',
}
const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

// === Données cumulées (line chart "Évolution cumulée") ===
const CUM_LABELS = ['Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai']
const CUM_SPENT  = [  75,  135,  195,  290,  390,  480,  545,  625,  695,  770,  840,  905 ]
const CUM_PAYOUT = [   0,  230,  560,  890, 1380, 1850, 2380, 2980, 3520, 4280, 5180, 6419 ]
const CUM_NET    = CUM_PAYOUT.map((p, i) => p - CUM_SPENT[i])

// === Données annuelles (bar chart "Performance annuelle") ===
const YEAR_LABELS  = ['2025', '2026']
const YEAR_SPENT   = [ 545, 360 ]
const YEAR_PAYOUT  = [2380, 4039]
const YEAR_NET     = YEAR_PAYOUT.map((p, i) => p - YEAR_SPENT[i])

// === Données mensuelles 2026 (bar chart "Performance mensuelle") ===
//  (5 mois écoulés au 18 mai 2026)
const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai']
const MONTH_SPENT  = [  80,   70,   75,   70,   65 ]
const MONTH_PAYOUT = [ 600,  540,  760,  900, 1239 ]
const MONTH_NET    = MONTH_PAYOUT.map((p, i) => p - MONTH_SPENT[i])

// ───────────────────────────────────────────────────────────────────────
// SVG utils — pure rendering, pas de lib externe
// ───────────────────────────────────────────────────────────────────────

// Génère une courbe smooth (Catmull-Rom converti en cubic Bezier) à partir de points
function smoothPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

// Légende inline (3 entrées) — identique au real /app
function Legend({ items }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {items.map(it => (
        <div key={it.l} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, color: C.text2,
        }}>
          <div style={{
            width: 10, height: 3, borderRadius: 2,
            background: it.c,
            ...(it.dashed ? { borderTop: `1.5px dashed ${it.c}`, background: 'transparent', height: 0 } : {}),
          }} />
          {it.l}
        </div>
      ))}
    </div>
  )
}

// ── Line chart : Évolution cumulée ──────────────────────────────────────
function CumulativeLineChart() {
  const W = 760, H = 200            // viewBox
  const PAD_L = 38, PAD_R = 12, PAD_T = 10, PAD_B = 24
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  const all = [...CUM_SPENT, ...CUM_PAYOUT, ...CUM_NET]
  const yMin = Math.min(0, ...all)
  const yMax = Math.max(...all)
  const yRange = yMax - yMin || 1

  const xAt = (i) => PAD_L + (i / (CUM_LABELS.length - 1)) * innerW
  const yAt = (v) => PAD_T + (1 - (v - yMin) / yRange) * innerH

  const toPts = (arr) => arr.map((v, i) => ({ x: xAt(i), y: yAt(v) }))
  const ptsS = toPts(CUM_SPENT)
  const ptsP = toPts(CUM_PAYOUT)
  const ptsN = toPts(CUM_NET)

  // y ticks (0, 1500, 3000, 4500, 6000)
  const yTicks = [0, 1500, 3000, 4500, 6000]
  // fill area under payouts curve (lift)
  const areaP = `${smoothPath(ptsP)} L ${ptsP[ptsP.length - 1].x} ${yAt(0)} L ${ptsP[0].x} ${yAt(0)} Z`
  const areaS = `${smoothPath(ptsS)} L ${ptsS[ptsS.length - 1].x} ${yAt(0)} L ${ptsS[0].x} ${yAt(0)} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="240" style={{ display: 'block' }}>
      {/* Y gridlines */}
      {yTicks.map(t => (
        <g key={t}>
          <line x1={PAD_L} y1={yAt(t)} x2={W - PAD_R} y2={yAt(t)}
            stroke={C.grid} strokeWidth="1" />
          <text x={PAD_L - 6} y={yAt(t) + 3} fontSize="9" fill={C.text3}
            textAnchor="end" fontFamily={mono}>{t}$</text>
        </g>
      ))}
      {/* Filled area under payouts (very subtle) */}
      <path d={areaP} fill="rgba(29,184,122,0.07)" />
      <path d={areaS} fill="rgba(232,80,74,0.06)" />

      {/* Lines */}
      <path d={smoothPath(ptsP)} stroke={C.green} strokeWidth="2" fill="none" />
      <path d={smoothPath(ptsS)} stroke={C.red}   strokeWidth="2" fill="none" />
      <path d={smoothPath(ptsN)} stroke={C.blue}  strokeWidth="2" fill="none"
        strokeDasharray="6 3" />

      {/* Last point markers */}
      <circle cx={ptsP[ptsP.length-1].x} cy={ptsP[ptsP.length-1].y} r="3.5"
        fill={C.green} stroke="#0a0c10" strokeWidth="1.5" />
      <circle cx={ptsS[ptsS.length-1].x} cy={ptsS[ptsS.length-1].y} r="3.5"
        fill={C.red} stroke="#0a0c10" strokeWidth="1.5" />
      <circle cx={ptsN[ptsN.length-1].x} cy={ptsN[ptsN.length-1].y} r="3.5"
        fill={C.blue} stroke="#0a0c10" strokeWidth="1.5" />

      {/* X labels */}
      {CUM_LABELS.map((lbl, i) => (
        <text key={lbl + i} x={xAt(i)} y={H - 6}
          fontSize="9" fill={C.text3} textAnchor="middle" fontFamily={mono}>
          {lbl}
        </text>
      ))}
    </svg>
  )
}

// ── Bar chart groupé (Performance annuelle / mensuelle) ─────────────────
function GroupedBarChart({ labels, spent, payout, net, height = 220 }) {
  const W = 380, H = 200
  const PAD_L = 36, PAD_R = 8, PAD_T = 8, PAD_B = 24
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  const all = [...spent, ...payout, ...net]
  const yMin = Math.min(0, ...all)
  const yMax = Math.max(...all)
  const yRange = yMax - yMin || 1

  const groupW = innerW / labels.length
  const barW = Math.min(14, (groupW - 8) / 3)   // 3 bars par groupe + padding
  const yAt = (v) => PAD_T + (1 - (v - yMin) / yRange) * innerH
  const y0 = yAt(0)

  const yTicks = (() => {
    // 4 ticks adaptés au yMax (arrondis)
    const step = Math.ceil(yMax / 4 / 100) * 100
    return [0, step, step * 2, step * 3, step * 4]
  })()

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} style={{ display: 'block' }}>
      {/* Y gridlines */}
      {yTicks.map(t => (
        <g key={t}>
          <line x1={PAD_L} y1={yAt(t)} x2={W - PAD_R} y2={yAt(t)}
            stroke={C.grid} strokeWidth="1" />
          <text x={PAD_L - 4} y={yAt(t) + 3} fontSize="8" fill={C.text3}
            textAnchor="end" fontFamily={mono}>{t}$</text>
        </g>
      ))}

      {labels.map((lbl, i) => {
        const xCenter = PAD_L + i * groupW + groupW / 2
        const x1 = xCenter - barW * 1.5 - 2
        const x2 = xCenter - barW * 0.5
        const x3 = xCenter + barW * 0.5 + 2
        const bars = [
          { x: x1, v: spent[i],  c: C.red },
          { x: x2, v: payout[i], c: C.green },
          { x: x3, v: net[i],    c: net[i] >= 0 ? 'rgba(45,111,255,0.75)' : 'rgba(232,80,74,0.45)' },
        ]
        return (
          <g key={lbl}>
            {bars.map((b, j) => {
              const top = yAt(b.v)
              const h = Math.abs(top - y0)
              const y = b.v >= 0 ? top : y0
              return (
                <rect key={j}
                  x={b.x} y={y} width={barW} height={h}
                  fill={b.c} rx="3" />
              )
            })}
            <text x={xCenter} y={H - 6}
              fontSize="9" fill={C.text3} textAnchor="middle" fontFamily={mono}>
              {lbl}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ───────────────────────────────────────────────────────────────────────
// Composant principal
// ───────────────────────────────────────────────────────────────────────
export default function AnalyticsMockup() {
  const cardS = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)',
  }

  return (
    <div style={{
      background: '#0a0c10',
      padding: '24px 26px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: C.text, minHeight: 540,
    }}>
      {/* Header — exactement comme /app analytics */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 10, color: C.blueLight,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          fontWeight: 600, marginBottom: 8,
        }}>Analytics</div>
        <h1 style={{
          fontSize: 22, fontWeight: 700, margin: 0,
          letterSpacing: '-0.025em', lineHeight: 1.1,
        }}>Analytics</h1>
        <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>
          Évolution cumulée sur 12 mois · 9 comptes · 3 PropFirms
        </div>
      </div>

      {/* === Card 1 : Évolution cumulée === */}
      <div style={{ ...cardS, padding: 16, marginBottom: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10, gap: 10, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>
            Évolution cumulée
          </div>
          <Legend items={[
            { l: 'Dépenses', c: C.red },
            { l: 'Payouts',  c: C.green },
            { l: 'Net',      c: C.blue, dashed: true },
          ]} />
        </div>
        <CumulativeLineChart />

        {/* Stats footer — résume les 3 lignes à la fin */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8, marginTop: 8,
          paddingTop: 10, borderTop: `1px solid ${C.border}`,
        }}>
          {[
            { l: 'Dépenses cum.', v: '$905',    c: C.red },
            { l: 'Payouts cum.',  v: '$6,419',  c: C.green },
            { l: 'Net cum.',      v: '+$5,514', c: C.blue },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 8, color: C.text3,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: 2, fontWeight: 600,
              }}>{s.l}</div>
              <div style={{
                fontSize: 13, fontWeight: 700, color: s.c, fontFamily: mono,
                letterSpacing: '-0.015em',
              }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* === Cards 2-3 : Performance annuelle / mensuelle === */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        {/* Annuelle */}
        <div style={{ ...cardS, padding: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10, gap: 10, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>
              Performance annuelle
            </div>
            <Legend items={[
              { l: 'Dép', c: C.red },
              { l: 'Pay', c: C.green },
              { l: 'Net', c: 'rgba(45,111,255,0.75)' },
            ]} />
          </div>
          <GroupedBarChart
            labels={YEAR_LABELS}
            spent={YEAR_SPENT}
            payout={YEAR_PAYOUT}
            net={YEAR_NET}
          />
        </div>

        {/* Mensuelle */}
        <div style={{ ...cardS, padding: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10, gap: 10, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>
              Performance mensuelle
            </div>
            <Legend items={[
              { l: 'Dép', c: C.red },
              { l: 'Pay', c: C.green },
              { l: 'Net', c: 'rgba(45,111,255,0.75)' },
            ]} />
          </div>
          <GroupedBarChart
            labels={MONTH_LABELS}
            spent={MONTH_SPENT}
            payout={MONTH_PAYOUT}
            net={MONTH_NET}
          />
        </div>
      </div>
    </div>
  )
}
