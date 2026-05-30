'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'
import { useT } from '../../../components/LanguageProvider'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  red: '#e8504a',
  amber: '#fac775',
}

const PRESETS = [
  { firm: 'Topstep', plan: '50K', balance: 50000, dd: 2000, type: 'eod' },
  { firm: 'Topstep', plan: '150K', balance: 150000, dd: 4500, type: 'eod' },
  { firm: 'Apex', plan: '50K FULL', balance: 50000, dd: 2500, type: 'eod' },
  { firm: 'Apex', plan: '100K FULL', balance: 100000, dd: 3000, type: 'intraday' },
  { firm: 'MFFU', plan: '100K', balance: 100000, dd: 3000, type: 'eod' },
  { firm: 'Bulenox', plan: '50K', balance: 50000, dd: 2000, type: 'intraday' },
]

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.text, fontSize: 14, fontFamily: 'inherit',
  outline: 'none',
}

const labelStyle = {
  fontSize: 11, color: C.text3, textTransform: 'uppercase',
  letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6, display: 'block',
}

export default function DrawdownSimulatorClient() {
  const t = useT()
  const [balance, setBalance] = useState(150000)
  const [ddAmount, setDdAmount] = useState(4500)
  const [ddType, setDdType] = useState('eod')
  const [currentBalance, setCurrentBalance] = useState(153500)
  const [intradayHigh, setIntradayHigh] = useState(154200)

  const sim = useMemo(() => {
    const initialFloor = balance - ddAmount
    const peakBalance = ddType === 'eod' ? currentBalance : Math.max(currentBalance, intradayHigh)
    const trailingFloor = Math.min(balance, peakBalance - ddAmount)
    const actualFloor = Math.max(initialFloor, trailingFloor)
    const isLocked = actualFloor >= balance
    const room = currentBalance - actualFloor
    const roomPct = currentBalance > 0 ? (room / currentBalance) * 100 : 0
    const maxLossToday = room
    return { initialFloor, actualFloor, isLocked, room, roomPct, maxLossToday, peakBalance }
  }, [balance, ddAmount, ddType, currentBalance, intradayHigh])

  function applyPreset(p) {
    setBalance(p.balance)
    setDdAmount(p.dd)
    setDdType(p.type)
    setCurrentBalance(p.balance + 3500)
    setIntradayHigh(p.balance + 4200)
  }

  const roomColor = sim.roomPct > 3 ? C.green : sim.roomPct > 1.5 ? C.amber : C.red
  const statusText = sim.roomPct > 3 ? 'Safe' : sim.roomPct > 1.5 ? 'Caution' : 'Danger'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <main style={{ flex: 1, padding: '60px 24px 80px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
            FREE TOOL
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, marginBottom: 12 }}>
            {t('tools.ddSim.title')}
          </h1>
          <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
            {t('tools.ddSim.subtitle')}
          </p>
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => applyPreset(p)} style={{
              padding: '7px 14px', borderRadius: 8,
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: C.surface, border: `1px solid ${C.border}`,
              color: C.text2, fontFamily: 'inherit',
              transition: 'border-color 0.15s, color 0.15s',
            }}>
              {p.firm} {p.plan}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="dd-sim-grid">
          {/* Left: inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: C.blueLight }}>{t('tools.ddSim.accountSetup')}</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={labelStyle}>{t('tools.ddSim.initialBalance')}</label>
                  <input type="number" value={balance} onChange={e => setBalance(+e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t('tools.ddSim.ddAmountLabel')}</label>
                  <input type="number" value={ddAmount} onChange={e => setDdAmount(+e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t('tools.ddSim.ddTypeLabel')}</label>
                  <div style={{ display: 'flex', gap: 4, background: C.surface2, borderRadius: 8, padding: 4 }}>
                    {['eod', 'intraday'].map(type => (
                      <button key={type} onClick={() => setDdType(type)} style={{
                        flex: 1, padding: '8px', borderRadius: 6,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: ddType === type ? C.blue : 'transparent',
                        color: ddType === type ? '#fff' : C.text2,
                        border: 'none', fontFamily: 'inherit',
                      }}>
                        {type === 'eod' ? 'End-of-Day (EOD)' : 'Intraday'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: C.green }}>{t('tools.ddSim.currentState')}</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={labelStyle}>{t('tools.ddSim.currentBalanceLabel')}</label>
                  <input type="number" value={currentBalance} onChange={e => setCurrentBalance(+e.target.value)} style={inputStyle} />
                </div>
                {ddType === 'intraday' && (
                  <div>
                    <label style={labelStyle}>{t('tools.ddSim.intradayHighLabel')}</label>
                    <input type="number" value={intradayHigh} onChange={e => setIntradayHigh(+e.target.value)} style={inputStyle} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status card */}
            <div style={{
              padding: '24px', borderRadius: 12,
              background: `${roomColor}10`,
              border: `1px solid ${roomColor}30`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: roomColor, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                {statusText}
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: roomColor, fontVariantNumeric: 'tabular-nums' }}>
                ${sim.room.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>
                {t('tools.ddSim.roomLeft')} ({sim.roomPct.toFixed(1)}%)
              </div>
            </div>

            {/* Visual bar */}
            <div style={{ padding: '20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{t('tools.ddSim.visualTitle')}</h2>
              <div style={{ position: 'relative', height: 180, background: C.surface2, borderRadius: 8, overflow: 'hidden', padding: '8px 16px' }}>
                {/* Balance line */}
                <div style={{ position: 'absolute', left: 16, right: 16, bottom: `${((currentBalance - sim.actualFloor) / (sim.peakBalance - sim.actualFloor + 1000)) * 100}%`, borderTop: `2px solid ${C.green}`, fontSize: 10, color: C.green, textAlign: 'right' }}>
                  Balance: ${currentBalance.toLocaleString()}
                </div>
                {/* DD floor line */}
                <div style={{ position: 'absolute', left: 16, right: 16, bottom: '10%', borderTop: `2px dashed ${C.red}`, fontSize: 10, color: C.red, textAlign: 'right' }}>
                  DD Floor: ${sim.actualFloor.toLocaleString()} {sim.isLocked ? '🔒' : '↑'}
                </div>
                {/* Fill zone */}
                <div style={{
                  position: 'absolute', left: 16, right: 16,
                  bottom: '10%',
                  height: `${((currentBalance - sim.actualFloor) / (sim.peakBalance - sim.actualFloor + 1000)) * 80}%`,
                  background: `linear-gradient(to top, ${roomColor}20, transparent)`,
                  borderRadius: '4px 4px 0 0',
                }} />
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: '20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{t('tools.ddSim.detailsTitle')}</h2>
              {[
                [t('tools.ddSim.initialFloor'), `$${sim.initialFloor.toLocaleString()}`],
                [t('tools.ddSim.currentFloor'), `$${sim.actualFloor.toLocaleString()}`, sim.isLocked ? '🔒 Locked' : '↑ Trailing'],
                [t('tools.ddSim.maxLossLabel'), `$${sim.maxLossToday.toLocaleString()}`, null, sim.room < 1000 ? C.red : null],
                [t('tools.ddSim.ddTypeResult'), ddType === 'eod' ? 'End-of-Day' : 'Intraday'],
              ].map(([label, value, badge, color], i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
                  fontSize: 13,
                }}>
                  <span style={{ color: C.text2 }}>{label}</span>
                  <span style={{ fontWeight: 600, color: color || C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {value}
                    {badge && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: sim.isLocked ? `${C.green}20` : `${C.amber}20`, color: sim.isLocked ? C.green : C.amber }}>{badge}</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ padding: '20px', background: `${C.blue}10`, border: `1px solid ${C.blue}25`, borderRadius: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: C.text2, margin: 0, marginBottom: 12, lineHeight: 1.6 }}>
                {t('tools.ddSim.ctaText')}
              </p>
              <Link href="/auth?mode=signup" style={{
                display: 'inline-block', padding: '10px 24px',
                background: C.blue, color: '#fff', borderRadius: 8,
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>{t('tools.ddSim.ctaButton')}</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <style>{`
        @media (max-width: 768px) {
          .dd-sim-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
