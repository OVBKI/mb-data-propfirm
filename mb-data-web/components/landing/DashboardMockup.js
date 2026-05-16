'use client'
// DashboardMockup — vue complète du tableau de bord Quantara comme dans l'app.
// Contient : sidebar nav + topbar + grille de stats + table de comptes propfirm.
// Données mockées mais réalistes (toutes les firms, montants crédibles).
//
// Utilisé wrapped dans Tilted3DFrame pour la présentation 3D inclinée.

import { useEffect, useState } from 'react'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  sidebar: 'rgba(20,23,32,0.8)',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(45,111,255,0.35)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#5a6275',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#10b981',
  red: '#ef4444',
  amber: '#fac775',
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

const accounts = [
  { firm: 'Topstep',    plan: '50K Combine',  balance: 52340, profit: 2340, dd: 1250, ddMax: 2000, status: 'OK', statusColor: C.green },
  { firm: 'Apex',       plan: '100K Eval',    balance: 103820, profit: 3820, dd: 2400, ddMax: 3000, status: 'OK', statusColor: C.green },
  { firm: 'Lucid',      plan: '50K Eval',     balance: 49660, profit: -340, dd: 1900, ddMax: 2000, status: 'ATTENTION', statusColor: C.amber },
  { firm: 'MFFU',       plan: '150K PA',      balance: 156210, profit: 6210, dd: 4200, ddMax: 5000, status: 'FUNDED', statusColor: C.blueLight },
  { firm: 'Tradeify',   plan: '100K Eval',    balance: 100890, profit: 890, dd: 2800, ddMax: 3000, status: 'OK', statusColor: C.green },
]

const navItems = [
  { icon: '◫', label: 'Dashboard', active: true },
  { icon: '☰', label: 'Journal' },
  { icon: '◳', label: 'Calendrier' },
  { icon: '◐', label: 'Equity' },
  { icon: '◉', label: 'Payouts' },
  { icon: '◊', label: 'PropFirms' },
  { icon: '◬', label: 'Alertes' },
  { icon: '◇', label: 'Paramètres' },
]

export default function DashboardMockup() {
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const totalProfit = accounts.reduce((s, a) => s + a.profit, 0)
  const fundedCount = accounts.filter(a => a.status === 'FUNDED').length
  const okCount = accounts.filter(a => a.status === 'OK').length

  return (
    <div style={{
      background: C.bg,
      color: C.text,
      display: 'grid',
      gridTemplateColumns: '180px 1fr',
      minHeight: 480,
      maxHeight: 540,
      fontFamily: 'inherit',
    }}>
      {/* === SIDEBAR === */}
      <aside style={{
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 6px 20px',
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 14,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff',
          }}>Q</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>
              QUANTARA
            </div>
            <div style={{ fontSize: 8, color: C.text3, fontFamily: mono, letterSpacing: '0.1em' }}>
              BETA
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 6,
                fontSize: 12,
                color: item.active ? C.text : C.text2,
                background: item.active ? 'rgba(45,111,255,0.12)' : 'transparent',
                borderLeft: `2px solid ${item.active ? C.blue : 'transparent'}`,
                fontWeight: item.active ? 600 : 400,
              }}
            >
              <span style={{
                fontSize: 11,
                color: item.active ? C.blueLight : C.text3,
                width: 14, textAlign: 'center',
              }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        {/* User avatar bottom */}
        <div style={{
          marginTop: 'auto',
          padding: '10px',
          background: C.surface,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.blue}, ${C.green})`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: C.text,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              omar@quantara.tech
            </div>
            <div style={{
              fontSize: 8, color: C.text3, fontFamily: mono, letterSpacing: '0.08em',
            }}>
              PRO PLAN
            </div>
          </div>
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <main style={{ padding: '14px 18px', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
              Bonjour Omar 👋
            </div>
            <div style={{ fontSize: 10, color: C.text3, fontFamily: mono, marginTop: 2 }}>
              {accounts.length} comptes actifs · sync il y a 2s
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={topBtn}>+ Trade</button>
            <button style={{ ...topBtn, background: C.blue, color: '#fff', border: 'none' }}>
              + Compte
            </button>
          </div>
        </div>

        {/* Stats grid (4 KPIs) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 12,
        }}>
          {[
            { label: 'BALANCE TOTALE', value: `$${totalBalance.toLocaleString('en-US')}`, color: C.text, trend: '+2.4%', trendColor: C.green },
            { label: 'PNL JOUR', value: `+$${totalProfit.toLocaleString('en-US')}`, color: C.green, trend: '+1.8%', trendColor: C.green },
            { label: 'COMPTES FUNDED', value: fundedCount, color: C.blueLight, trend: `${fundedCount}/5`, trendColor: C.text2 },
            { label: 'STATUS GLOBAL', value: 'OK', color: C.green, trend: `${okCount + fundedCount}/${accounts.length} OK`, trendColor: C.text2 },
          ].map((s, i) => (
            <div key={i} style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '10px 12px',
            }}>
              <div style={{
                fontSize: 8, color: C.text3, fontFamily: mono,
                letterSpacing: '0.1em', marginBottom: 4,
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: 16, fontWeight: 700, color: s.color,
                fontFamily: mono, letterSpacing: '-0.02em',
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: 9, color: s.trendColor, fontFamily: mono,
                letterSpacing: '0.05em', marginTop: 2,
              }}>
                {s.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Table des comptes */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Mes comptes PropFirm</div>
            <div style={{
              fontSize: 9, color: C.text3, fontFamily: mono,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: C.green,
              }} />
              LIVE
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '90px 95px 110px 1fr 100px 70px',
            gap: 10,
            padding: '8px 14px',
            background: C.surface2,
            fontSize: 9, color: C.text3, fontFamily: mono,
            letterSpacing: '0.08em',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div>FIRM</div>
            <div>PLAN</div>
            <div>BALANCE</div>
            <div>DRAWDOWN</div>
            <div>STATUS</div>
            <div style={{ textAlign: 'right' }}>ACTIONS</div>
          </div>

          {/* Rows */}
          {accounts.map((a, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '90px 95px 110px 1fr 100px 70px',
              gap: 10,
              padding: '12px 14px',
              borderBottom: i === accounts.length - 1 ? 'none' : `1px solid ${C.border}`,
              fontSize: 11,
              fontFamily: mono,
              alignItems: 'center',
            }}>
              <div style={{ fontWeight: 700, letterSpacing: '0.02em' }}>{a.firm}</div>
              <div style={{ color: C.text2 }}>{a.plan}</div>
              <div style={{
                color: a.profit >= 0 ? C.green : C.red,
                fontWeight: 600,
              }}>
                ${a.balance.toLocaleString('en-US')}
              </div>
              <div>
                <div style={{
                  fontSize: 9, color: C.text3, marginBottom: 3,
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>${a.dd}</span><span>${a.ddMax}</span>
                </div>
                <div style={{
                  height: 4, background: 'rgba(255,255,255,0.06)',
                  borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(a.dd / a.ddMax) * 100}%`,
                    height: '100%',
                    background: a.dd / a.ddMax > 0.85 ? C.red : a.dd / a.ddMax > 0.6 ? C.amber : C.green,
                  }} />
                </div>
              </div>
              <div style={{
                fontSize: 9, fontWeight: 600, color: a.statusColor,
                letterSpacing: '0.1em',
                padding: '3px 8px',
                background: `${a.statusColor}15`,
                border: `1px solid ${a.statusColor}40`,
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center', gap: 4,
                width: 'fit-content',
              }}>
                <span style={{
                  width: 4, height: 4, borderRadius: '50%', background: a.statusColor,
                }} />
                {a.status}
              </div>
              <div style={{
                textAlign: 'right',
                color: C.text3, fontSize: 14,
              }}>···</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

const topBtn = {
  padding: '6px 12px',
  background: 'transparent',
  border: `1px solid rgba(255,255,255,0.13)`,
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 500,
  color: C.text,
  cursor: 'pointer',
}
