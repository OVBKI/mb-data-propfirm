'use client'
import { useState } from 'react'
import Counter from './Counter'
import Reveal from './Reveal'

// Aperçu visuel du dashboard pour la landing page.
// Reproduit la vraie page /app avec données démo réalistes (4 PropFirms, mix
// Financé/Challenge/Échoué, payouts reçus, calendrier mixte achats/payouts).
// Cascade au scroll via <Reveal>, compteurs animés via <Counter>.

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  surface3: '#222637',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  red: '#e8504a',
  amber: '#fac775',
  redBg: 'rgba(232,80,74,0.14)',
  greenBg: 'rgba(29,184,122,0.14)',
  amberBg: 'rgba(250,199,117,0.15)',
  blueBg: 'rgba(45,111,255,0.15)',
}

// 4 PropFirms (résultat global positif — montre une démo gagnante)
const FIRMS = [
  {
    name: 'Topstep',
    color: '#ff8c42',
    initials: 'TS',
    net: 3450,
    spent: 1320,
    payouts: 4770,
    accounts: 5,
    financed: 2, challenge: 2, failed: 1,
    nbPayouts: 4,
    items: [
      { date: '2026-05-26', status: 'Payout', amount: 1400, type: 'pay' },
      { date: '2026-05-12', status: 'Payout', amount: 1200, type: 'pay' },
      { date: '2026-04-18', status: 'Financé', amount: -165, type: 'buy' },
    ],
  },
  {
    name: 'Lucid Trading',
    color: '#4d8fff',
    initials: 'LU',
    net: 1820,
    spent: 740,
    payouts: 2560,
    accounts: 4,
    financed: 1, challenge: 2, failed: 1,
    nbPayouts: 2,
    items: [
      { date: '2026-05-19', status: 'Payout', amount: 680, type: 'pay' },
      { date: '2026-04-28', status: 'Challenge', amount: -185, type: 'buy' },
      { date: '2026-04-12', status: 'Financé', amount: -185, type: 'buy' },
    ],
  },
  {
    name: 'Apex Trader',
    color: '#a86bff',
    initials: 'AP',
    net: 310,
    spent: 580,
    payouts: 890,
    accounts: 3,
    financed: 1, challenge: 1, failed: 1,
    nbPayouts: 1,
    items: [
      { date: '2026-05-08', status: 'Payout', amount: 890, type: 'pay' },
      { date: '2026-04-22', status: 'Challenge', amount: -240, type: 'buy' },
      { date: '2026-04-05', status: 'Échoué', amount: -190, type: 'buy' },
    ],
  },
]

// Statuses → couleurs badge
const STATUS_BG = { 'Financé': C.greenBg, 'Challenge': C.amberBg, 'Échoué': C.redBg, 'Payout': C.greenBg }
const STATUS_COLOR = { 'Financé': C.green, 'Challenge': C.amber, 'Échoué': C.red, 'Payout': C.green }
const STATUS_DOT = { 'Financé': C.green, 'Challenge': C.amber, 'Échoué': C.red, 'Payout': C.green }

// Construit les cellules d'un calendrier "Mai 2026" (1er = vendredi)
function buildCalendar() {
  const days = []
  for (let d = 27; d <= 30; d++) days.push({ day: d, other: true })   // avril en gris
  for (let d = 1; d <= 31; d++) days.push({ day: d, current: true })   // mai
  while (days.length < 42) days.push({ day: days.length - 35, other: true })
  return days
}

// Événements du calendrier — mix achats & payouts répartis sur le mois
const CAL_EVENTS = {
  1:  { buy: 250 },
  5:  { pay: 850 },
  7:  { buy: 180 },
  12: { pay: 1200 },
  14: { buy: 300 },
  19: { pay: 680 },
  22: { buy: 250 },
  26: { pay: 1400 },
}

// Quelques jours d'avril visibles (autres mois) pour l'effet "déjà passé"
const CAL_OTHER_PREV = { 28: -185, 29: -90, 30: 320 }

// Transactions récentes (panneau de droite)
const TRANSACTIONS = [
  { firm: 'Topstep',       date: '2026-05-26', type: 'Payout', amount: 1400, sign: 'pay' },
  { firm: 'Topstep',       date: '2026-05-22', type: 'Achat',  amount: -250, sign: 'buy' },
  { firm: 'Lucid Trading', date: '2026-05-19', type: 'Payout', amount: 680,  sign: 'pay' },
  { firm: 'Apex Trader',   date: '2026-05-14', type: 'Achat',  amount: -300, sign: 'buy' },
  { firm: 'Topstep',       date: '2026-05-12', type: 'Payout', amount: 1200, sign: 'pay' },
]

// Mini-logo carré coloré + initiales (style cohérent avec le vrai app)
function FirmLogo({ initials, color, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: 8,
      background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 800, color: '#fff',
      letterSpacing: '0.02em',
      boxShadow: `0 0 0 1px ${color}55, 0 4px 10px ${color}33`,
    }}>{initials}</div>
  )
}

export default function DashboardPreview() {
  const days = buildCalendar()
  const [hoveredDay, setHoveredDay] = useState(null)

  return (
    <section style={{ padding: '96px 24px', position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 70% 50% at 50% 30%, rgba(45,111,255,0.08), transparent 60%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: C.blueLight,
              textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12,
            }}>APERÇU DU TABLEAU DE BORD</div>
            <h2 className="lp-h2" style={{
              fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800,
              marginBottom: 16, letterSpacing: '-0.01em',
            }}>
              Visualise tout d'un <span className="lp-gradient-text">coup d'œil</span>
            </h2>
            <p style={{
              fontSize: 16, color: C.text2,
              maxWidth: 620, margin: '0 auto', lineHeight: 1.5,
            }}>
              Stats globales, comptes par PropFirm, payouts reçus et calendrier des transactions — tout est centralisé sur un seul écran.
            </p>
          </div>
        </Reveal>

        {/* Frame navigateur autour du dashboard */}
        <Reveal delay={150}>
          <div className="dp-frame" style={{
            background: C.surface, border: `1px solid ${C.border2}`,
            borderRadius: 14, padding: 14,
            boxShadow: '0 30px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(45,111,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '0 4px' }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
              <div style={{
                marginLeft: 14, fontSize: 11, color: C.text3,
                background: C.bg, padding: '4px 12px', borderRadius: 99,
                border: `1px solid ${C.border}`,
              }}>quantara.app/dashboard</div>
            </div>

            <div style={{ background: C.bg, borderRadius: 10, padding: '24px 22px' }}>
              {/* === Ligne 1 : 5 stat cards (résultat global positif) === */}
              <div className="dp-stats5" style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 22,
              }}>
                {[
                  { l: 'PROPFIRMS', v: '4 firmes · 12 comptes', isText: true },
                  { l: 'TOTAL DÉPENSÉ', n: 2840, suffix: '.00 $', c: C.red },
                  { l: 'TOTAL PAYOUTS', n: 8420, suffix: '.00 $', c: C.green },
                  { l: 'RÉSULTAT NET', n: 5580, suffix: '.00 $', c: C.green, prefix: '+' },
                  { l: 'NB PAYOUTS', n: 7, c: C.text },
                ].map((s, i) => (
                  <Reveal key={i} delay={250 + i * 70}>
                    <div className="dp-card" style={{
                      background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: '14px 16px',
                    }}>
                      <div style={{
                        fontSize: 10, color: C.text3, textTransform: 'uppercase',
                        letterSpacing: '0.6px', marginBottom: 8, fontWeight: 600,
                      }}>{s.l}</div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: s.c || C.text }}>
                        {s.isText ? s.v : <Counter to={s.n} suffix={s.suffix || ''} prefix={s.prefix || ''} duration={1600} />}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* === Grille des 3 PropFirms === */}
              <div className="dp-firms" style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 14, marginBottom: 26,
              }}>
                {FIRMS.map((f, idx) => (
                  <Reveal key={f.name} delay={650 + idx * 120}>
                    <div className="dp-card" style={{
                      background: C.surface,
                      border: `1px solid ${idx === 0 ? f.color : C.border}`,
                      borderRadius: 10, padding: 14,
                      boxShadow: idx === 0 ? `0 0 0 1px ${f.color}30, 0 8px 24px ${f.color}15` : 'none',
                    }}>
                      {/* Header firm */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <FirmLogo initials={f.initials} color={f.color} size={34} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                          <div style={{ fontSize: 10, color: C.text3 }}>{f.accounts} comptes · {f.nbPayouts} payout{f.nbPayouts > 1 ? 's' : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>
                            +<Counter to={f.net} duration={1400} /> $
                          </div>
                          <div style={{ fontSize: 9, color: C.text3 }}>ROI +{Math.round(f.net / f.spent * 100)}%</div>
                        </div>
                      </div>

                      {/* Mini stats */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 6, marginBottom: 12,
                      }}>
                        {[
                          { l: 'DÉPENSÉ', v: f.spent + ' $', c: C.red },
                          { l: 'PAYOUTS', v: f.payouts + ' $', c: C.green },
                          { l: 'ACTIFS', v: f.financed + f.challenge, c: C.text },
                        ].map((s, i) => (
                          <div key={i} style={{
                            background: C.surface3, borderRadius: 6, padding: '7px 4px', textAlign: 'center',
                          }}>
                            <div style={{ fontSize: 8, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2, fontWeight: 600 }}>{s.l}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: s.c }}>{s.v}</div>
                          </div>
                        ))}
                      </div>

                      {/* 3 dernières lignes */}
                      {f.items.map((it, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '5px 0', borderBottom: i < f.items.length - 1 ? `1px solid ${C.border}` : 'none', fontSize: 11,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_DOT[it.status], flexShrink: 0 }} />
                            <span style={{ color: C.text2, fontSize: 10 }}>{it.date}</span>
                            <span style={{
                              fontSize: 9, padding: '1px 6px', borderRadius: 99,
                              background: STATUS_BG[it.status], color: STATUS_COLOR[it.status], fontWeight: 600,
                            }}>{it.status}</span>
                          </div>
                          <span style={{ fontWeight: 600, color: it.amount > 0 ? C.green : C.red, fontSize: 11 }}>
                            {it.amount > 0 ? '+' : ''}{it.amount} €
                          </span>
                        </div>
                      ))}

                      {/* Badges status counts */}
                      <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
                        {f.financed > 0 && (
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: C.greenBg, color: C.green, fontWeight: 600 }}>
                            {f.financed} Financé{f.financed > 1 ? 's' : ''}
                          </span>
                        )}
                        {f.challenge > 0 && (
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: C.amberBg, color: C.amber, fontWeight: 600 }}>
                            {f.challenge} Challenge{f.challenge > 1 ? 's' : ''}
                          </span>
                        )}
                        {f.failed > 0 && (
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: C.redBg, color: C.red, fontWeight: 600 }}>
                            {f.failed} Échoué{f.failed > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* === Bloc calendrier === */}
              <Reveal delay={1100}>
                <div>
                  {/* Header calendrier */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 14,
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Calendrier des transactions</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="dp-btn-ghost" style={btnGhostStyle}>‹</button>
                      <span style={{ fontWeight: 600, minWidth: 110, textAlign: 'center', fontSize: 13 }}>Mai 2026</span>
                      <button className="dp-btn-ghost" style={btnGhostStyle}>›</button>
                      <button className="dp-btn-ghost" style={btnGhostStyle}>Aujourd'hui</button>
                    </div>
                  </div>

                  {/* 3 mini-stats du mois (mois rentable) */}
                  <div className="dp-stats3" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 10, marginBottom: 14,
                  }}>
                    {[
                      { l: 'Achats du mois', n: 980, c: C.red, prefix: '' },
                      { l: 'Payouts du mois', n: 4130, c: C.green },
                      { l: 'Net du mois', n: 3150, c: C.green, prefix: '+' },
                    ].map((s, i) => (
                      <div key={i} style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: '10px 14px',
                      }}>
                        <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>{s.l}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: s.c }}>
                          <Counter to={s.n} suffix=" €" prefix={s.prefix || ''} duration={1500} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calendrier + panneau de droite */}
                  <div className="dp-cal-grid" style={{
                    display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start',
                  }}>
                    <div style={{
                      background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: 10, overflow: 'hidden',
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: C.surface2, borderBottom: `1px solid ${C.border}` }}>
                        {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(d => (
                          <div key={d} style={{
                            padding: '10px 0', textAlign: 'center', fontSize: 10,
                            fontWeight: 600, color: C.text3, letterSpacing: '0.5px',
                          }}>{d}</div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {days.map((d, i) => {
                          const evt = d.current ? CAL_EVENTS[d.day] : null
                          const otherPrev = d.other && CAL_OTHER_PREV[d.day]
                          const isToday = d.current && d.day === 12
                          const isHovered = hoveredDay === i
                          return (
                            <div
                              key={i}
                              onMouseEnter={() => setHoveredDay(i)}
                              onMouseLeave={() => setHoveredDay(null)}
                              className="dp-cal-cell"
                              style={{
                                minHeight: 70, padding: 6,
                                borderRight: (i + 1) % 7 === 0 ? 'none' : `1px solid ${C.border}`,
                                borderBottom: `1px solid ${C.border}`,
                                opacity: d.other ? 0.28 : 1,
                                background: isHovered ? 'rgba(45,111,255,0.06)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                              }}>
                              <div style={{
                                fontSize: 11, fontWeight: 600,
                                width: 22, height: 22, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isToday ? C.blue : 'transparent',
                                color: isToday ? '#fff' : C.text2,
                                marginBottom: 4,
                              }}>{d.day}</div>
                              {otherPrev && (
                                <div style={{
                                  fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                                  background: otherPrev > 0 ? C.greenBg : C.redBg,
                                  color: otherPrev > 0 ? C.green : C.red, display: 'inline-block',
                                }}>{otherPrev > 0 ? '+' : ''}{otherPrev} €</div>
                              )}
                              {evt?.buy && (
                                <div className="dp-cell-amount" style={{
                                  fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                                  background: C.redBg, color: C.red, display: 'inline-block',
                                  animationDelay: `${1300 + i * 30}ms`,
                                }}>-{evt.buy} €</div>
                              )}
                              {evt?.pay && (
                                <div className="dp-cell-amount" style={{
                                  fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                                  background: C.greenBg, color: C.green, display: 'inline-block',
                                  animationDelay: `${1300 + i * 30}ms`,
                                }}>+{evt.pay} €</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Panneau droit */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: 16,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Sélectionnez un jour</div>
                        <div style={{ fontSize: 11, color: C.text3 }}>Cliquez sur un jour.</div>
                      </div>
                      <div style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: 16,
                      }}>
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: C.text3,
                          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
                        }}>Transactions récentes</div>
                        {TRANSACTIONS.map((t, i) => (
                          <div key={i} style={{
                            display: 'flex', gap: 8, padding: '7px 0',
                            borderBottom: i < TRANSACTIONS.length - 1 ? `1px solid ${C.border}` : 'none',
                          }}>
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: t.sign === 'pay' ? C.green : C.red,
                              marginTop: 5, flexShrink: 0,
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.firm}</div>
                              <div style={{ fontSize: 10, color: C.text3 }}>{t.date} · {t.type}</div>
                            </div>
                            <div style={{
                              fontSize: 12, fontWeight: 600,
                              color: t.sign === 'pay' ? C.green : C.red,
                            }}>
                              {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)} €
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const btnGhostStyle = {
  background: 'transparent',
  border: `1px solid ${C.border2}`,
  color: C.text2,
  fontSize: 12, fontWeight: 600,
  padding: '5px 10px', borderRadius: 8,
  cursor: 'pointer',
}
