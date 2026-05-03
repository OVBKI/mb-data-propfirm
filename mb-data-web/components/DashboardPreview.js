'use client'
import { useEffect, useRef, useState } from 'react'
import Counter from './Counter'
import Reveal from './Reveal'

// Aperçu visuel du dashboard pour la landing page.
// Reproduit fidèlement la vraie page /app (5 stat cards, propfirm card, calendrier, panneau).
// Chaque bloc apparaît en cascade au scroll. Les valeurs s'animent via <Counter />.

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
}

// Construit les 35 cellules d'un calendrier "Mai 2026" (commence un vendredi)
function buildCalendar() {
  const days = []
  // Avril : 27, 28, 29, 30 (other-month, opacity réduite)
  for (let d = 27; d <= 30; d++) days.push({ day: d, other: true })
  // Mai 1 → 31 (1 = vendredi)
  for (let d = 1; d <= 31; d++) days.push({ day: d, other: false, current: true })
  // Pad fin pour atteindre 6 semaines (42 cellules)
  for (let d = 1; d <= 42 - days.length; d++) days.push({ day: d, other: true })
  return days
}

const CAL_EVENTS = {
  // jour → { buy?: number, pay?: number }
  // (jours du mois courant uniquement — visuels animés)
  1:  { buy: 81 },
  3:  { buy: 81 },
  8:  { pay: 240 },
  12: { buy: 81 },
  15: { pay: 180 },
  19: { buy: 81 },
  22: { pay: 320 },
  27: { buy: 81 },
}

const CAL_OTHER_PREV = { 27: -416, 28: -406 } // jours du mois précédent visibles

const TRANSACTIONS = [
  { firm: 'Lucid Trading', date: '2026-05-01', amount: -81.20 },
  { firm: 'Lucid Trading', date: '2026-04-28', amount: -81.20 },
  { firm: 'Lucid Trading', date: '2026-04-28', amount: -81.20 },
  { firm: 'Lucid Trading', date: '2026-04-28', amount: -81.20 },
  { firm: 'Lucid Trading', date: '2026-04-28', amount: -81.20 },
]

// Petit logo "LUC" pour Lucid
function LucidLogo({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: 8, background: '#1a1d28',
      border: `1px solid ${C.border2}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.28, fontWeight: 800, color: C.text, lineHeight: 1,
    }}>
      LUC<span style={{ fontSize: size * 0.18, color: C.text3, marginTop: 2, letterSpacing: '0.05em' }}>TRAD</span>
    </div>
  )
}

export default function DashboardPreview() {
  const days = buildCalendar()
  const [hoveredDay, setHoveredDay] = useState(null)

  return (
    <section style={{ padding: '96px 24px', position: 'relative' }}>
      {/* Halo en fond */}
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
              Stats globales, comptes par PropFirm et calendrier des transactions — tout est centralisé sur un seul écran.
            </p>
          </div>
        </Reveal>

        {/* Browser frame autour du dashboard */}
        <Reveal delay={150}>
          <div className="dp-frame" style={{
            background: C.surface, border: `1px solid ${C.border2}`,
            borderRadius: 14, padding: 14,
            boxShadow: '0 30px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(45,111,255,0.08)',
          }}>
            {/* Barre de fenêtre (3 dots) */}
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

            {/* Contenu du dashboard */}
            <div style={{
              background: C.bg, borderRadius: 10, padding: '24px 22px',
            }}>
              {/* === Ligne 1 : 5 stat cards === */}
              <div className="dp-stats5" style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18,
              }}>
                {[
                  { l: 'PROPFIRMS', v: '1 firme · 11 comptes', isText: true },
                  { l: 'TOTAL DÉPENSÉ', n: 1057, suffix: '.00 $', c: C.red, decimals: 0 },
                  { l: 'TOTAL PAYOUTS', n: 0, suffix: '.00 $', c: C.green },
                  { l: 'RÉSULTAT NET', n: -1057, suffix: '.00 $', c: C.red },
                  { l: 'NB PAYOUTS', n: 0, c: C.text },
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
                        {s.isText ? s.v : <Counter to={s.n} suffix={s.suffix || ''} duration={1600} />}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* === Carte PropFirm Lucid === */}
              <Reveal delay={650}>
                <div className="dp-card dp-firm-card" style={{
                  background: C.surface, border: `1px solid ${C.blue}`,
                  borderRadius: 10, padding: 16, marginBottom: 22,
                  maxWidth: 420,
                  boxShadow: '0 0 0 1px rgba(45,111,255,0.15), 0 8px 24px rgba(45,111,255,0.10)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <LucidLogo size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Lucid Trading</div>
                      <div style={{ fontSize: 10, color: C.text3 }}>11 comptes · 0 payout</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.red }}>
                        -<Counter to={1057} duration={1400} /> $
                      </div>
                      <div style={{ fontSize: 10, color: C.text3 }}>ROI -100%</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8, marginBottom: 12,
                  }}>
                    {[
                      { l: 'DÉPENSÉ', v: '1057 $', c: C.red },
                      { l: 'PAYOUTS', v: '0 $', c: C.green },
                      { l: 'ACTIFS', v: '5', c: C.text },
                    ].map((s, i) => (
                      <div key={i} style={{
                        background: C.surface3, borderRadius: 6, padding: 8, textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{s.l}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 11,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.amber }} />
                        <span style={{ color: C.text2 }}>2026-04-28</span>
                        <span style={{
                          fontSize: 9, padding: '1px 6px', borderRadius: 99,
                          background: 'rgba(250,199,117,0.15)', color: C.amber, fontWeight: 600,
                        }}>Challenge</span>
                      </div>
                      <span style={{ fontWeight: 600, color: C.red }}>-81 €</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: C.text3, padding: '4px 0', marginTop: 4 }}>+2 autres...</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: 'rgba(250,199,117,0.15)', color: C.amber, fontWeight: 600 }}>5 Challenges</span>
                    <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: 'rgba(232,80,74,0.15)', color: C.red, fontWeight: 600 }}>6 Échoués</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: C.text3, alignSelf: 'center' }}>Détails →</span>
                  </div>
                </div>
              </Reveal>

              {/* === Bloc calendrier === */}
              <Reveal delay={850}>
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

                  {/* 3 mini-stats du mois */}
                  <div className="dp-stats3" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 10, marginBottom: 14,
                  }}>
                    {[
                      { l: 'Achats du mois', n: 81.20, c: C.red },
                      { l: 'Payouts du mois', n: 0, c: C.green },
                      { l: 'Net du mois', n: -81.20, c: C.red },
                    ].map((s, i) => (
                      <div key={i} style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: '10px 14px',
                      }}>
                        <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>{s.l}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: s.c }}>
                          <Counter to={s.n} suffix=" €" decimals={2} duration={1500} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grille calendrier + panneau */}
                  <div className="dp-cal-grid" style={{
                    display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start',
                  }}>
                    {/* Calendrier */}
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
                          const isToday = d.current && d.day === 3
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
                                  background: C.redBg, color: C.red, display: 'inline-block',
                                }}>{otherPrev} €</div>
                              )}
                              {evt?.buy && (
                                <div className="dp-cell-amount" style={{
                                  fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                                  background: C.redBg, color: C.red, display: 'inline-block',
                                  animationDelay: `${1000 + i * 30}ms`,
                                }}>-{evt.buy} €</div>
                              )}
                              {evt?.pay && (
                                <div className="dp-cell-amount" style={{
                                  fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                                  background: C.greenBg, color: C.green, display: 'inline-block',
                                  animationDelay: `${1000 + i * 30}ms`,
                                }}>+{evt.pay} €</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Panneau droit : Sélection + Transactions récentes */}
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
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, marginTop: 5, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 500 }}>{t.firm}</div>
                              <div style={{ fontSize: 10, color: C.text3 }}>{t.date} · Achat</div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.red }}>{t.amount.toFixed(2)} €</div>
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
