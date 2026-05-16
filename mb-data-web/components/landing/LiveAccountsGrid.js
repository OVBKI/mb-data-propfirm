'use client'
// Démo A — Live Accounts Grid
// Affiche 4 cartes "comptes PropFirm" avec données réalistes qui s'updatent en live.
// Chaque carte = nom firm, plan, balance, DD restant, consistency, status.
// Les chiffres pulsent à chaque update (toutes les 2.5s) pour simuler le live data.

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const C = {
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(45,111,255,0.4)',
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

const initialAccounts = [
  {
    firm: 'TOPSTEP', plan: '50K Combine',
    balance: 52340, target: 3000, profit: 2340,
    dd: 1250, ddMax: 2000,
    cons: 28, days: '5/15',
    status: 'OK', statusColor: C.green,
  },
  {
    firm: 'APEX', plan: '100K Eval',
    balance: 103820, target: 6000, profit: 3820,
    dd: 2400, ddMax: 3000,
    cons: 34, days: '8/30',
    status: 'OK', statusColor: C.green,
  },
  {
    firm: 'LUCID', plan: '50K Eval',
    balance: 49660, target: 3000, profit: -340,
    dd: 1900, ddMax: 2000,
    cons: null, days: '3/15',
    status: 'ATTENTION', statusColor: C.amber,
  },
  {
    firm: 'MFFU', plan: '150K PA',
    balance: 156210, target: null, profit: 6210,
    dd: 4200, ddMax: 5000,
    cons: 25, days: 'Funded',
    status: 'FUNDED', statusColor: C.blueLight,
  },
]

export default function LiveAccountsGrid() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-100px' })
  const [accounts, setAccounts] = useState(initialAccounts)
  const [pulseKey, setPulseKey] = useState(0)

  // Simulate live data updates : tiny balance fluctuations every 2.5s.
  // Le pulseKey force re-mount des chiffres → re-trigger l'animation flash.
  useEffect(() => {
    if (!inView) return
    const interval = setInterval(() => {
      setAccounts(prev => prev.map((a, i) => ({
        ...a,
        // Fluctuation aléatoire ±30$ pour rendre le "live" crédible
        balance: a.balance + Math.round((Math.random() - 0.45) * 30),
        profit: a.profit + Math.round((Math.random() - 0.45) * 30),
      })))
      setPulseKey(k => k + 1)
    }, 2500)
    return () => clearInterval(interval)
  }, [inView])

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 1 }}>
      {/* Header de section */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px',
          background: 'rgba(45,111,255,0.10)',
          border: `1px solid rgba(45,111,255,0.25)`,
          borderRadius: 99,
          fontSize: 11, fontFamily: mono, letterSpacing: '0.1em',
          color: C.blueLight,
          marginBottom: 20,
        }}>
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }}
          />
          LIVE · 4 COMPTES TRACKÉS
        </div>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 800, letterSpacing: '-0.025em',
          marginBottom: 16, color: C.text, lineHeight: 1.1,
        }}>
          Tous tes comptes PropFirm en un coup d'œil.
        </h2>
        <p style={{
          fontSize: 16, color: C.text2,
          maxWidth: 600, margin: '0 auto', lineHeight: 1.55,
        }}>
          Balance, drawdown restant, consistency, status. En temps réel sur Topstep,
          Apex, Lucid, MFFU et 4 autres firmes.
        </p>
      </div>

      {/* Grid de 4 cartes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        maxWidth: 1100, margin: '0 auto',
      }}>
        {accounts.map((acc, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '20px 22px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'default',
            }}
            className="qt-account-card"
          >
            {/* Live indicator pulsant (top-right) */}
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: 'absolute', top: 16, right: 16,
                width: 7, height: 7, borderRadius: '50%',
                background: C.green,
                boxShadow: `0 0 8px ${C.green}`,
              }}
            />

            {/* Header firm + plan */}
            <div style={{
              fontSize: 11, color: C.text3, fontFamily: mono,
              letterSpacing: '0.08em', marginBottom: 4,
            }}>
              {acc.firm}
            </div>
            <div style={{
              fontSize: 12, color: C.text2, marginBottom: 20,
            }}>
              {acc.plan}
            </div>

            {/* Balance (gros chiffre qui flash à chaque update) */}
            <motion.div
              key={`bal-${pulseKey}-${i}`}
              initial={{ color: C.blueLight }}
              animate={{ color: acc.profit >= 0 ? C.green : C.red }}
              transition={{ duration: 1.2 }}
              style={{
                fontSize: 26, fontWeight: 700,
                fontFamily: mono, letterSpacing: '-0.02em',
                marginBottom: 4,
              }}
            >
              ${acc.balance.toLocaleString('en-US')}
            </motion.div>
            <div style={{
              fontSize: 12, color: acc.profit >= 0 ? C.green : C.red,
              fontFamily: mono, marginBottom: 18,
            }}>
              {acc.profit >= 0 ? '+' : ''}${acc.profit.toLocaleString('en-US')}
              <span style={{ color: C.text3, marginLeft: 6 }}>PnL session</span>
            </div>

            {/* Drawdown bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 10, color: C.text3, fontFamily: mono,
                letterSpacing: '0.08em', marginBottom: 6,
              }}>
                <span>DD RESTANT</span>
                <span style={{ color: C.text2 }}>
                  ${acc.dd.toLocaleString('en-US')} / ${acc.ddMax.toLocaleString('en-US')}
                </span>
              </div>
              <div style={{
                height: 6, background: 'rgba(255,255,255,0.06)',
                borderRadius: 3, overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${(acc.dd / acc.ddMax) * 100}%` } : {}}
                  transition={{ duration: 1.2, delay: 0.4 + i * 0.08, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: acc.dd / acc.ddMax > 0.85
                      ? C.red : acc.dd / acc.ddMax > 0.6 ? C.amber : C.green,
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>

            {/* Footer : consistency + status */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 14, borderTop: `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 9, color: C.text3, fontFamily: mono, letterSpacing: '0.08em' }}>
                    CONS.
                  </div>
                  <div style={{ fontSize: 13, color: C.text, fontFamily: mono, fontWeight: 600 }}>
                    {acc.cons !== null ? `${acc.cons}%` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.text3, fontFamily: mono, letterSpacing: '0.08em' }}>
                    JOURS
                  </div>
                  <div style={{ fontSize: 13, color: C.text, fontFamily: mono, fontWeight: 600 }}>
                    {acc.days}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: 10, fontFamily: mono, letterSpacing: '0.1em',
                color: acc.statusColor, fontWeight: 600,
                padding: '4px 8px',
                background: `${acc.statusColor}15`,
                border: `1px solid ${acc.statusColor}40`,
                borderRadius: 5,
              }}>
                {acc.status}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <style>{`
        .qt-account-card {
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .qt-account-card:hover {
          border-color: ${C.borderHover} !important;
          box-shadow: 0 8px 24px rgba(45,111,255,0.08);
        }
      `}</style>
    </div>
  )
}
