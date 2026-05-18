'use client'
// Démo F — Notification mockup
// Fausse notification browser style macOS/Chrome qui slide-in depuis le coin
// haut-droit, cycle 3 messages différents (billing 48h, payout dispo, ROI mensuel).

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { NOTIFICATIONS } from './mockData'

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

// Notifications viennent de mockData (cohérentes avec Dashboard/Analytics)
const messages = NOTIFICATIONS

export default function NotificationMockup() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-100px' })
  const [idx, setIdx] = useState(0)

  // Cycle messages : show 3.5s, transition, next
  useEffect(() => {
    if (!inView) return
    const interval = setInterval(() => {
      setIdx(prev => (prev + 1) % messages.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [inView])

  return (
    <div ref={ref} style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
      gap: 48, alignItems: 'center',
      maxWidth: 1100, margin: '0 auto',
    }} className="qt-notif-section">
      {/* TEXTE à gauche */}
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px',
          background: 'rgba(250,199,117,0.10)',
          border: '1px solid rgba(250,199,117,0.25)',
          borderRadius: 99,
          fontSize: 11, fontFamily: mono, letterSpacing: '0.1em',
          color: C.amber,
          marginBottom: 24,
        }}>
          NOTIFICATIONS
        </div>
        <h2 style={{
          fontSize: 'clamp(28px, 3.5vw, 38px)',
          fontWeight: 800, letterSpacing: '-0.025em',
          marginBottom: 18, color: C.text, lineHeight: 1.15,
        }}>
          Plus jamais surpris<br />
          par un prélèvement.
        </h2>
        <p style={{
          fontSize: 15, color: C.text2, lineHeight: 1.6, marginBottom: 24,
        }}>
          Notifications push browser 48h avant chaque facture mensuelle Topstep,
          Apex, MFFU. Alertes payout dispo, récap auto, milestones —
          tout ce qui doit savoir, sans spam.
        </p>
        <ul style={{
          listStyle: 'none', padding: 0, margin: 0,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {[
            'Alerte 48h avant chaque billing mensuel',
            'Notif quand un payout devient demandable',
            'Récap email automatique chaque 1er du mois',
          ].map((t, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              fontSize: 14, color: C.text,
            }}>
              <span style={{
                flexShrink: 0, width: 18, height: 18, borderRadius: 4,
                background: 'rgba(250,199,117,0.18)', color: C.amber,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, marginTop: 1,
              }}>✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* MOCKUP browser à droite avec notification qui slide */}
      <div style={{
        position: 'relative',
        background: '#0a0c10',
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        minHeight: 320,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Browser chrome */}
        <div style={{
          padding: '10px 14px',
          background: C.surface2,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <div style={{
            flex: 1, padding: '4px 10px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 5,
            fontSize: 11, color: C.text3, fontFamily: mono,
            textAlign: 'center',
          }}>
            quantara.tech
          </div>
        </div>

        {/* Faux contenu site en arrière-plan */}
        <div style={{ padding: '28px 24px', opacity: 0.4 }}>
          <div style={{
            height: 14, width: '50%',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 4, marginBottom: 12,
          }} />
          <div style={{
            height: 10, width: '80%',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 3, marginBottom: 6,
          }} />
          <div style={{
            height: 10, width: '70%',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 3, marginBottom: 6,
          }} />
          <div style={{
            height: 10, width: '60%',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 3, marginBottom: 24,
          }} />
          <div style={{
            height: 100,
            background: 'rgba(45,111,255,0.05)',
            border: `1px solid rgba(45,111,255,0.1)`,
            borderRadius: 8,
          }} />
        </div>

        {/* NOTIFICATION qui slide depuis le coin haut-droit */}
        <div style={{
          position: 'absolute',
          top: 50, right: 14,
          width: 'min(280px, calc(100% - 28px))',
          pointerEvents: 'none',
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 50, y: -8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50, transition: { duration: 0.25 } }}
              transition={{
                type: 'spring',
                stiffness: 220,
                damping: 22,
              }}
              style={{
                background: C.surface,
                border: `1px solid ${messages[idx].border}`,
                borderRadius: 10,
                padding: '12px 14px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 5,
                    background: messages[idx].bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12,
                  }}>
                    {messages[idx].icon}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: C.text,
                  }}>
                    Quantara
                  </div>
                </div>
                <div style={{
                  fontSize: 9, color: C.text3, fontFamily: mono,
                  letterSpacing: '0.05em',
                }}>
                  {messages[idx].time}
                </div>
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: C.text,
                marginBottom: 4, lineHeight: 1.3,
              }}>
                {messages[idx].title}
              </div>
              <div style={{
                fontSize: 12, color: C.text2, lineHeight: 1.45,
              }}>
                {messages[idx].body}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots indicator en bas */}
        <div style={{
          position: 'absolute', bottom: 14, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: 6,
        }}>
          {messages.map((_, i) => (
            <span key={i} style={{
              width: i === idx ? 18 : 6, height: 6,
              borderRadius: 3,
              background: i === idx ? messages[idx].color : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .qt-notif-section {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
