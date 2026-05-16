'use client'
// Démo B — Equity Curve animée
// Courbe de balance qui se draw au scroll into view + ligne trailing drawdown
// pointillée rouge en dessous. Tooltip au hover.

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const C = {
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#10b981',
  red: '#ef4444',
  amber: '#fac775',
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

// 30 points de données simulant 1 mois d'evolution d'un compte 50K
// Balance + Trailing DD (qui suit le peak puis se fige)
const data = [
  { d: 1,  b: 50000, dd: 48000 },
  { d: 2,  b: 50320, dd: 48000 },
  { d: 3,  b: 50840, dd: 48000 },
  { d: 4,  b: 50620, dd: 48000 },
  { d: 5,  b: 51200, dd: 48000 },
  { d: 6,  b: 51640, dd: 48000 },
  { d: 7,  b: 51280, dd: 48000 },
  { d: 8,  b: 51920, dd: 48000 },
  { d: 9,  b: 52480, dd: 48000 },
  { d: 10, b: 52340, dd: 48000 },
  { d: 11, b: 52900, dd: 48000 },
  { d: 12, b: 53440, dd: 48000 },
  { d: 13, b: 53180, dd: 48000 },
  { d: 14, b: 53720, dd: 48000 },
  { d: 15, b: 54100, dd: 48000 },
  { d: 16, b: 53850, dd: 48000 },
  { d: 17, b: 54380, dd: 48000 },
  { d: 18, b: 54920, dd: 48000 }, // Peak — trailing DD se déverrouille
  { d: 19, b: 54620, dd: 48920 }, // DD se met à trailer
  { d: 20, b: 55180, dd: 49180 },
  { d: 21, b: 54980, dd: 49180 },
  { d: 22, b: 55460, dd: 49460 },
  { d: 23, b: 55320, dd: 49460 },
  { d: 24, b: 56020, dd: 50020 },
  { d: 25, b: 55840, dd: 50020 },
  { d: 26, b: 56380, dd: 50000 }, // DD se lock au balance initial 50K
  { d: 27, b: 56210, dd: 50000 },
  { d: 28, b: 56680, dd: 50000 },
  { d: 29, b: 56420, dd: 50000 },
  { d: 30, b: 56950, dd: 50000 },
]

const WIDTH = 700
const HEIGHT = 260
const PAD = { l: 60, r: 20, t: 20, b: 30 }
const CHART_W = WIDTH - PAD.l - PAD.r
const CHART_H = HEIGHT - PAD.t - PAD.b

const minY = 47000
const maxY = 58000

const xScale = (i) => PAD.l + (i / (data.length - 1)) * CHART_W
const yScale = (val) => PAD.t + ((maxY - val) / (maxY - minY)) * CHART_H

// Build SVG path strings
const balancePath = data
  .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.b)}`)
  .join(' ')

const balanceAreaPath = balancePath
  + ` L ${xScale(data.length - 1)} ${HEIGHT - PAD.b}`
  + ` L ${xScale(0)} ${HEIGHT - PAD.b} Z`

const ddPath = data
  .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.dd)}`)
  .join(' ')

export default function EquityCurveDemo() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [hover, setHover] = useState(null)

  const finalBalance = data[data.length - 1].b
  const initialBalance = data[0].b
  const profit = finalBalance - initialBalance
  const roi = ((profit / initialBalance) * 100).toFixed(2)

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH
    const idx = Math.round(((x - PAD.l) / CHART_W) * (data.length - 1))
    if (idx >= 0 && idx < data.length) setHover(idx)
    else setHover(null)
  }

  return (
    <div ref={ref} style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
      gap: 48, alignItems: 'center',
      maxWidth: 1100, margin: '0 auto',
    }} className="qt-equity-section">
      {/* CHART à gauche */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '20px 16px 12px',
        position: 'relative',
      }}>
        {/* Header chart */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '0 8px', marginBottom: 4,
        }}>
          <div>
            <div style={{
              fontSize: 11, color: C.text3, fontFamily: mono, letterSpacing: '0.08em',
            }}>
              TOPSTEP 50K · 30 JOURS
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: C.green,
              fontFamily: mono, marginTop: 2,
            }}>
              ${finalBalance.toLocaleString('en-US')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 11, color: C.text3, fontFamily: mono, letterSpacing: '0.08em',
            }}>
              PNL · ROI
            </div>
            <div style={{
              fontSize: 14, fontWeight: 600, color: C.green,
              fontFamily: mono, marginTop: 2,
            }}>
              +${profit.toLocaleString('en-US')} · +{roi}%
            </div>
          </div>
        </div>

        {/* SVG chart */}
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="eqArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.green} stopOpacity="0.35" />
              <stop offset="100%" stopColor={C.green} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grille horizontale */}
          {[0, 0.25, 0.5, 0.75, 1].map(p => (
            <line
              key={p}
              x1={PAD.l} x2={WIDTH - PAD.r}
              y1={PAD.t + p * CHART_H} y2={PAD.t + p * CHART_H}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1"
            />
          ))}

          {/* Y-axis labels */}
          {[minY, (minY + maxY) / 2, maxY].map((v, i) => (
            <text
              key={i}
              x={PAD.l - 8}
              y={yScale(v) + 4}
              fill={C.text3}
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              textAnchor="end"
            >
              ${(v / 1000).toFixed(0)}K
            </text>
          ))}

          {/* Aire sous balance (fade) */}
          <motion.path
            d={balanceAreaPath}
            fill="url(#eqArea)"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 1.5, delay: 1.5 }}
          />

          {/* Ligne balance — draw progressif */}
          <motion.path
            d={balancePath}
            fill="none"
            stroke={C.green}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 2.2, ease: 'easeInOut' }}
          />

          {/* Ligne trailing DD pointillée */}
          <motion.path
            d={ddPath}
            fill="none"
            stroke={C.red}
            strokeWidth="1.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.5 }}
          />

          {/* Hover line + dot + tooltip */}
          {hover !== null && (
            <g>
              <line
                x1={xScale(hover)} x2={xScale(hover)}
                y1={PAD.t} y2={HEIGHT - PAD.b}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={xScale(hover)} cy={yScale(data[hover].b)}
                r="5" fill={C.green} stroke={C.surface} strokeWidth="2"
              />
              <rect
                x={Math.min(Math.max(xScale(hover) - 60, 5), WIDTH - 125)}
                y={Math.max(yScale(data[hover].b) - 60, 5)}
                width="120" height="42"
                rx="6"
                fill="#1c2030"
                stroke={C.border}
              />
              <text
                x={Math.min(Math.max(xScale(hover) - 50, 15), WIDTH - 115)}
                y={Math.max(yScale(data[hover].b) - 42, 22)}
                fill={C.text3} fontSize="9" fontFamily="ui-monospace, monospace"
                letterSpacing="0.5"
              >
                JOUR {data[hover].d}
              </text>
              <text
                x={Math.min(Math.max(xScale(hover) - 50, 15), WIDTH - 115)}
                y={Math.max(yScale(data[hover].b) - 26, 38)}
                fill={C.text} fontSize="12" fontFamily="ui-monospace, monospace"
                fontWeight="600"
              >
                ${data[hover].b.toLocaleString('en-US')}
              </text>
            </g>
          )}
        </svg>

        {/* Légende sous chart */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 22,
          marginTop: 6, fontSize: 11, color: C.text3, fontFamily: mono,
          letterSpacing: '0.06em',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 2, background: C.green, borderRadius: 1 }} />
            BALANCE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 14, height: 0, borderTop: `1.5px dashed ${C.red}`,
            }} />
            DD TRAILING
          </div>
        </div>
      </div>

      {/* TEXTE à droite */}
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px',
          background: 'rgba(45,111,255,0.10)',
          border: '1px solid rgba(45,111,255,0.25)',
          borderRadius: 99,
          fontSize: 11, fontFamily: mono, letterSpacing: '0.1em',
          color: C.blueLight,
          marginBottom: 24,
        }}>
          EQUITY CURVE
        </div>
        <h2 style={{
          fontSize: 'clamp(28px, 3.5vw, 38px)',
          fontWeight: 800, letterSpacing: '-0.025em',
          marginBottom: 18, color: C.text, lineHeight: 1.15,
        }}>
          La courbe que tu n'as jamais eue.<br />
          Trailing drawdown inclus.
        </h2>
        <p style={{
          fontSize: 15, color: C.text2, lineHeight: 1.6, marginBottom: 24,
        }}>
          Ta balance jour par jour. La ligne pointillée rouge = ton trailing drawdown
          qui suit ton peak puis se fige automatiquement au balance initial (règle
          standard Topstep, Apex, MFFU).
        </p>
        <ul style={{
          listStyle: 'none', padding: 0, margin: 0,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {[
            'Calcul automatique selon la firm (EOD / Intraday)',
            'Lock au balance initial quand applicable',
            'Hover pour voir balance précise par jour',
          ].map((t, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              fontSize: 14, color: C.text,
            }}>
              <span style={{
                flexShrink: 0, width: 18, height: 18, borderRadius: 4,
                background: 'rgba(16,185,129,0.18)', color: C.green,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, marginTop: 1,
              }}>✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .qt-equity-section {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
