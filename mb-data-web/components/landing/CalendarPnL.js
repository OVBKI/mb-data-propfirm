'use client'
// Démo D — Calendrier PnL
// Mini-calendrier d'un mois avec chaque jour coloré vert/rouge selon le PnL.
// Animation : les cellules apparaissent une par une au scroll into view (stagger).

import { useRef } from 'react'
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
  greenSoft: 'rgba(16,185,129,0.18)',
  greenStrong: 'rgba(16,185,129,0.35)',
  red: '#ef4444',
  redSoft: 'rgba(239,68,68,0.18)',
  redStrong: 'rgba(239,68,68,0.35)',
  amber: '#fac775',
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

// 31 jours d'un mois fictif — exemple réaliste de trader propfirm
// null = pas de trading (weekend ou hors session), number = PnL
const days = [
  null, null, null, // Jeudi 1 vacant, vendredi 2, samedi 3
  { v: 340, intensity: 1 },   // Dim 4 — pas de trade en réalité, mais on simule pour démo
  { v: 520, intensity: 2 },   // Lun 5
  { v: -180, intensity: 1 },  // Mar 6
  { v: 240, intensity: 1 },   // Mer 7
  { v: 880, intensity: 3 },   // Jeu 8 — gros vert
  null, null,                  // Weekend
  { v: -340, intensity: 2 },  // Lun 11 — gros rouge
  { v: 140, intensity: 1 },
  { v: 620, intensity: 2 },
  { v: 380, intensity: 1 },
  { v: 90, intensity: 1 },
  null, null,
  { v: -85, intensity: 1 },
  { v: 450, intensity: 2 },
  { v: 1240, intensity: 3 },  // Best day du mois
  { v: 220, intensity: 1 },
  { v: -160, intensity: 1 },
  null, null,
  { v: 380, intensity: 1 },
  { v: 540, intensity: 2 },
  { v: 290, intensity: 1 },
  { v: -120, intensity: 1 },
  { v: 670, intensity: 2 },
  null, null,
]

const dayLabels = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

export default function CalendarPnL() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  // Calcul des totaux
  const total = days.reduce((acc, d) => acc + (d?.v || 0), 0)
  const tradingDays = days.filter(d => d !== null).length
  const winDays = days.filter(d => d && d.v > 0).length
  const winRate = Math.round((winDays / tradingDays) * 100)
  const bestDay = Math.max(...days.filter(d => d).map(d => d.v))

  return (
    <div ref={ref} style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
      gap: 48, alignItems: 'center',
      maxWidth: 1100, margin: '0 auto',
    }} className="qt-calendar-section">
      {/* TEXTE à gauche */}
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px',
          background: 'rgba(16,185,129,0.10)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 99,
          fontSize: 11, fontFamily: mono, letterSpacing: '0.1em',
          color: C.green,
          marginBottom: 24,
        }}>
          CALENDRIER PNL
        </div>
        <h2 style={{
          fontSize: 'clamp(28px, 3.5vw, 38px)',
          fontWeight: 800, letterSpacing: '-0.025em',
          marginBottom: 18, color: C.text, lineHeight: 1.15,
        }}>
          Ton mois en un coup d'œil.<br />
          Vert = gagné. Rouge = perdu.
        </h2>
        <p style={{
          fontSize: 15, color: C.text2, lineHeight: 1.6, marginBottom: 28,
        }}>
          Chaque jour de trading coloré selon ton PnL. Identifie tes jours forts,
          tes patterns mensuels, et les jours à éviter. L'intensité de la couleur
          reflète la taille du gain ou de la perte.
        </p>

        {/* Stats latérales */}
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: total >= 0 ? C.green : C.red,
              fontFamily: mono, letterSpacing: '-0.02em',
            }}>
              {total >= 0 ? '+' : ''}${total.toLocaleString('en-US')}
            </div>
            <div style={{ fontSize: 10, color: C.text3, fontFamily: mono, letterSpacing: '0.1em' }}>
              PNL MOIS
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: C.text,
              fontFamily: mono, letterSpacing: '-0.02em',
            }}>
              {winRate}%
            </div>
            <div style={{ fontSize: 10, color: C.text3, fontFamily: mono, letterSpacing: '0.1em' }}>
              WIN RATE
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: C.green,
              fontFamily: mono, letterSpacing: '-0.02em',
            }}>
              ${bestDay}
            </div>
            <div style={{ fontSize: 10, color: C.text3, fontFamily: mono, letterSpacing: '0.1em' }}>
              MEILLEUR JOUR
            </div>
          </div>
        </div>
      </div>

      {/* CALENDRIER à droite */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 24,
        position: 'relative',
      }}>
        {/* Header du mois */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 18,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
              Avril 2026
            </div>
            <div style={{
              fontSize: 11, color: C.text3, fontFamily: mono, letterSpacing: '0.08em',
              marginTop: 2,
            }}>
              TOPSTEP 50K · COMBINE
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={navBtn} disabled>‹</button>
            <button style={navBtn}>›</button>
          </div>
        </div>

        {/* Day labels */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5,
          marginBottom: 8,
        }}>
          {dayLabels.map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 10, fontFamily: mono,
              color: C.text3, letterSpacing: '0.1em', padding: '4px 0',
            }}>{d}</div>
          ))}
        </div>

        {/* Grille des jours */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5,
        }}>
          {days.map((d, i) => {
            const bg = !d
              ? 'transparent'
              : d.v > 0
                ? (d.intensity >= 3 ? C.greenStrong : d.intensity === 2 ? C.greenSoft : 'rgba(16,185,129,0.10)')
                : (d.intensity >= 2 ? C.redStrong : C.redSoft)
            const border = !d ? `1px dashed rgba(255,255,255,0.05)` : 'none'
            const fontColor = !d ? C.text3 : d.v > 0 ? C.green : C.red

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  duration: 0.3,
                  delay: i * 0.018,
                  ease: 'easeOut',
                }}
                style={{
                  aspectRatio: '1 / 0.85',
                  background: bg,
                  border,
                  borderRadius: 6,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontFamily: mono,
                  color: fontColor, fontWeight: 600,
                  cursor: d ? 'pointer' : 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  fontSize: 9, color: C.text3, fontWeight: 400,
                  position: 'absolute', top: 3, left: 5,
                }}>
                  {i + 1}
                </div>
                {d && (
                  <div style={{ marginTop: 4, fontSize: 10 }}>
                    {d.v > 0 ? '+' : ''}${Math.abs(d.v)}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Légende */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 18,
          marginTop: 16, paddingTop: 14,
          borderTop: `1px solid ${C.border}`,
          fontSize: 10, color: C.text3, fontFamily: mono,
          letterSpacing: '0.08em',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: C.greenStrong }} />
            BIG WIN
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: C.greenSoft }} />
            WIN
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: C.redSoft }} />
            LOSS
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .qt-calendar-section {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

const navBtn = {
  width: 24, height: 24,
  background: 'transparent',
  border: `1px solid ${C.border}`,
  borderRadius: 5,
  color: C.text2,
  fontSize: 12, cursor: 'pointer',
}
