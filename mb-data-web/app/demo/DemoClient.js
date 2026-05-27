'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useT } from '../../components/LanguageProvider'
import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'

const C = {
  bg: '#0d0f14', surface: '#141720', surface2: '#1c2030',
  border: 'rgba(255,255,255,0.06)', text: '#f0ede8', text2: '#9098b0',
  text3: '#7b839b', blue: '#2d6fff', blueLight: '#4d8fff',
  green: '#1db87a', red: '#e8504a', amber: '#fac775',
}

const DEMO_FIRMS = [
  {
    name: 'Lucid Trading', color: '#2d6fff', accounts: [
      { name: 'PRO 6', status: 'Financé', pnl: 2187 },
      { name: 'PRO 7', status: 'Financé', pnl: 2713 },
      { name: 'EVAL 19', status: 'Challenge', pnl: -70 },
    ],
    spent: 1197, payouts: 5090, challengeCount: 1, fundedCount: 2, failedCount: 10,
  },
  {
    name: 'Take Profit Trader', color: '#fac775', accounts: [
      { name: 'TPPRO1881087', status: 'Financé', pnl: -119 },
    ],
    spent: 119, payouts: 0, challengeCount: 0, fundedCount: 1, failedCount: 0,
  },
  {
    name: 'FuturesELites', color: '#e8504a', accounts: [
      { name: 'FE-001', status: 'Échoué', pnl: -65 },
      { name: 'FE-002', status: 'Échoué', pnl: -65 },
      { name: 'FE-003', status: 'Échoué', pnl: -65 },
      { name: 'FE-004', status: 'Échoué', pnl: -65 },
      { name: 'FE-005', status: 'Échoué', pnl: -63 },
    ],
    spent: 323, payouts: 0, challengeCount: 0, fundedCount: 0, failedCount: 5,
  },
  {
    name: 'Alpha Futures', color: '#1db87a', accounts: [
      { name: 'challenge-002', status: 'Challenge', pnl: -80 },
      { name: 'challenge-003', status: 'Challenge', pnl: -80 },
    ],
    spent: 313, payouts: 0, challengeCount: 2, fundedCount: 0, failedCount: 1,
  },
  {
    name: 'Topstep', color: '#4d8fff', accounts: [
      { name: 'challenge-001', status: 'Challenge', pnl: -135 },
      { name: 'challenge-002', status: 'Challenge', pnl: -135 },
      { name: 'challenge-003', status: 'Challenge', pnl: -135 },
    ],
    spent: 673, payouts: 0, challengeCount: 5, fundedCount: 0, failedCount: 0,
  },
]

const TOTAL_ACCOUNTS = DEMO_FIRMS.reduce((s, f) => s + f.accounts.length + f.failedCount, 0)
const TOTAL_SPENT = DEMO_FIRMS.reduce((s, f) => s + f.spent, 0)
const TOTAL_PAYOUTS = DEMO_FIRMS.reduce((s, f) => s + f.payouts, 0)
const TOTAL_NET = TOTAL_PAYOUTS - TOTAL_SPENT
const TOTAL_PAYOUT_COUNT = 4

const STATUS_COLORS = { Financé: C.green, Challenge: C.blue, 'Échoué': C.red }
const STATUS_EN = { Financé: 'Funded', Challenge: 'Challenge', 'Échoué': 'Failed' }

const card = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
  boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)',
}

function FirmLogo({ name, color }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: `linear-gradient(135deg, ${color}30, ${color}10)`,
      border: `1px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color, letterSpacing: '0.02em',
    }}>{initials}</div>
  )
}

export default function DemoClient() {
  const t = useT()
  const [dismissed, setDismissed] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const filteredFirms = DEMO_FIRMS.filter(f => f.name.toLowerCase().includes(searchQ.toLowerCase()))

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />

      {/* Demo banner */}
      {!dismissed && (
        <div style={{
          padding: '10px 24px',
          background: 'linear-gradient(90deg, rgba(45,111,255,0.95), rgba(77,143,255,0.95))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            {t('demo.banner')}
          </span>
          <Link href="/auth?mode=signup" style={{
            padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: '#fff', color: C.blue, textDecoration: 'none',
          }}>{t('demo.signupCta')}</Link>
          <button onClick={() => setDismissed(true)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', fontSize: 16, padding: 4,
          }} aria-label="Close">×</button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar — replica du vrai */}
        <aside className="demo-sidebar" style={{
          width: 230, flexShrink: 0, background: C.surface,
          borderRight: `1px solid ${C.border}`, padding: '20px 14px',
          display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
        }}>
          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, padding: '8px 10px 6px', marginTop: 4 }}>
            {t('demo.sidebarOverview')}
          </div>
          {[
            { icon: '📊', label: 'Dashboard', active: true },
            { icon: '📈', label: 'Analytics' },
            { icon: '📅', label: t('demo.sidebarCalendar') },
          ].map(item => (
            <SidebarItem key={item.label} {...item} />
          ))}

          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, padding: '14px 10px 6px' }}>
            {t('demo.sidebarTrades')}
          </div>
          {[
            { icon: '📔', label: 'Journal' },
            { icon: '📋', label: 'Trade Log' },
            { icon: '🔥', label: 'Heatmaps' },
            { icon: '📐', label: t('demo.sidebarRules') },
          ].map(item => (
            <SidebarItem key={item.label} {...item} />
          ))}

          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, padding: '14px 10px 6px' }}>
            PROPFIRMS
          </div>
          {[
            { icon: '⚖️', label: t('demo.sidebarCompare'), href: '/compare' },
            { icon: '🔔', label: t('demo.sidebarAlerts'), badge: '3' },
          ].map(item => (
            <SidebarItem key={item.label} {...item} />
          ))}

          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, padding: '14px 10px 6px' }}>
            {t('demo.sidebarCommunity')}
          </div>
          <SidebarItem icon="👥" label={t('demo.sidebarGroups')} />

          <div style={{ flex: 1 }} />
          <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>DEMO USER</div>
            <div style={{ fontSize: 11, color: C.text3 }}>demo@quantara.tech</div>
          </div>
        </aside>

        {/* Main content — replica du vrai dashboard */}
        <main style={{ flex: 1, padding: '32px 24px 60px', maxWidth: 1160, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>
                {t('demo.eyebrow')}
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, marginBottom: 6, lineHeight: 1.1 }}>
                {t('demo.greeting')}
              </h1>
              <div style={{ fontSize: 13, color: C.text3 }}>1 USD ≈ 0.8621 EUR · 1 GBP ≈ 1.1574 EUR — 14:18</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                <button style={{ padding: '7px 14px', fontSize: 12, border: 'none', background: C.blue, color: '#fff', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em' }}>USD</button>
                <button style={{ padding: '7px 14px', fontSize: 12, border: 'none', background: 'transparent', color: C.text2, cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em' }}>EUR</button>
              </div>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 Rechercher..." style={{
                maxWidth: 180, width: '100%', padding: '8px 12px', fontSize: 13,
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                color: C.text, fontFamily: 'inherit', outline: 'none',
              }} />
              <button style={{
                padding: '8px 18px', fontSize: 13, fontWeight: 600,
                background: C.blue, color: '#fff', border: 'none', borderRadius: 8,
                cursor: 'default', opacity: 0.6,
              }}>+ Ajouter PropFirm</button>
            </div>
          </div>

          {/* Stats row — 5 cards */}
          <div className="stats-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'PROPFIRMS', value: `${DEMO_FIRMS.length} · ${TOTAL_ACCOUNTS} comptes`, small: true },
              { label: t('demo.totalSpent'), value: `${TOTAL_SPENT.toLocaleString()} $`, color: C.red },
              { label: t('demo.totalPayouts'), value: `${TOTAL_PAYOUTS.toLocaleString()} $`, color: C.green },
              { label: t('demo.netResult'), value: `${TOTAL_NET >= 0 ? '+' : ''}${TOTAL_NET.toLocaleString()} $`, color: TOTAL_NET >= 0 ? C.green : C.red },
              { label: 'PAYOUTS', value: TOTAL_PAYOUT_COUNT },
            ].map((k, i) => (
              <div key={i} style={{ ...card, padding: '18px 18px' }}>
                <div style={{ fontSize: 11, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: k.small ? 15 : 24, fontWeight: 700, color: k.color || C.text, letterSpacing: '-0.015em' }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Firm cards grid */}
          <div className="firms-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16, marginBottom: 24 }}>
            {filteredFirms.map((firm, fi) => {
              const net = firm.payouts - firm.spent
              const roi = firm.spent > 0 ? net / firm.spent * 100 : 0
              const payoutCount = firm.name === 'Lucid Trading' ? 4 : 0
              return (
                <div key={fi} className="qt-firm-card" style={{
                  ...card, padding: 20, cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(45,111,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none' }}
                >
                  {/* Header: logo + name + net */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FirmLogo name={firm.name} color={firm.color} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.005em' }}>{firm.name}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                          {firm.accounts.length} comptes · {payoutCount} payout{payoutCount > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 19, fontWeight: 700, color: net >= 0 ? C.green : C.red, letterSpacing: '-0.015em' }}>
                        {net >= 0 ? '+' : ''}{net} $
                      </div>
                      <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>ROI {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%</div>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                    {[
                      { l: 'Dépensé', v: `${firm.spent} $`, c: C.red },
                      { l: 'Payouts', v: `${firm.payouts} $`, c: C.green },
                      { l: 'Actifs', v: firm.fundedCount + firm.challengeCount },
                    ].map((s, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 7, padding: '10px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 600 }}>{s.l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: s.c || C.text }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Account list */}
                  {firm.accounts.slice(0, 3).map((a, ai) => (
                    <div key={ai} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: ai > 0 ? `1px solid rgba(255,255,255,0.03)` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[a.status] }} />
                        <span style={{ fontSize: 12, color: C.text2 }}>{a.name}</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: `${STATUS_COLORS[a.status]}18`, color: STATUS_COLORS[a.status], fontWeight: 600 }}>{a.status}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: a.pnl >= 0 ? C.green : C.red }}>
                        {a.pnl >= 0 ? '+' : ''}{a.pnl} $
                      </span>
                    </div>
                  ))}
                  {firm.accounts.length > 3 && (
                    <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>+{firm.accounts.length - 3} autres...</div>
                  )}

                  {/* Status badges */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                    {firm.challengeCount > 0 && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: `${C.blue}18`, color: C.blue, fontWeight: 600 }}>{firm.challengeCount} Challenge{firm.challengeCount > 1 ? 's' : ''}</span>}
                    {firm.fundedCount > 0 && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: `${C.green}18`, color: C.green, fontWeight: 600 }}>{firm.fundedCount} Financé{firm.fundedCount > 1 ? 's' : ''}</span>}
                    {firm.failedCount > 0 && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: `${C.red}18`, color: C.red, fontWeight: 600 }}>{firm.failedCount} Échoué{firm.failedCount > 1 ? 's' : ''}</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA bottom */}
          <div style={{ marginTop: 40, padding: 32, ...card, textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 8 }}>
              {t('demo.ctaTitle')}
            </h2>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 20, lineHeight: 1.6 }}>
              {t('demo.ctaSubtitle')}
            </p>
            <Link href="/auth?mode=signup" style={{
              display: 'inline-block', padding: '12px 28px',
              background: C.blue, color: '#fff', borderRadius: 8,
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>{t('demo.ctaButton')}</Link>
          </div>
        </main>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .demo-sidebar { display: none !important; }
          main { padding: 20px 16px 60px !important; }
          .stats-5 { grid-template-columns: repeat(2, 1fr) !important; }
          .firms-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function SidebarItem({ icon, label, active, badge, href }) {
  const content = (
    <div style={{
      padding: '9px 10px', borderRadius: 8, fontSize: 13,
      color: active ? C.text : C.text2,
      background: active ? 'rgba(45,111,255,0.1)' : 'transparent',
      borderLeft: active ? `2px solid ${C.blue}` : '2px solid transparent',
      fontWeight: active ? 600 : 400,
      display: 'flex', alignItems: 'center', gap: 10,
      cursor: href ? 'pointer' : 'default',
      transition: 'background 0.15s',
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: C.red, color: '#fff', fontWeight: 700 }}>{badge}</span>}
    </div>
  )
  if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link>
  return content
}
