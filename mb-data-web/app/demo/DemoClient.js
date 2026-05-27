'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useT } from '../../components/LanguageProvider'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  red: '#e8504a',
  amber: '#fac775',
}

const DEMO_FIRMS = [
  {
    name: 'Topstep', color: '#2d6fff', status: 'Funded', plan: '150K',
    balance: 153420, dd: 147500, ddPct: 96.1, split: 90, spent: 49,
    payouts: 2800, consistency: 28, tradingDays: 14, net: 2751,
  },
  {
    name: 'Apex Trader Funding', color: '#e8504a', status: 'Challenge', plan: '100K FULL',
    balance: 101850, dd: 97375, ddPct: 95.6, split: 100, spent: 167,
    payouts: 0, consistency: 22, tradingDays: 8, net: -167,
  },
  {
    name: 'MyFundedFutures', color: '#fac775', status: 'Funded', plan: '100K',
    balance: 105200, dd: 97000, ddPct: 92.2, split: 80, spent: 112,
    payouts: 1500, consistency: 35, tradingDays: 22, net: 1388,
  },
  {
    name: 'Bulenox', color: '#1db87a', status: 'Failed', plan: '50K',
    balance: 0, dd: 0, ddPct: 0, split: 90, spent: 155,
    payouts: 0, consistency: 0, tradingDays: 3, net: -155,
  },
]

const TOTAL_SPENT = DEMO_FIRMS.reduce((s, f) => s + f.spent, 0)
const TOTAL_PAYOUTS = DEMO_FIRMS.reduce((s, f) => s + f.payouts, 0)
const TOTAL_NET = TOTAL_PAYOUTS - TOTAL_SPENT

function StatCard({ label, value, color, prefix = '' }) {
  return (
    <div style={{
      padding: '16px 18px', background: C.surface,
      border: `1px solid ${C.border}`, borderRadius: 10,
    }}>
      <div style={{ fontSize: 11, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || C.text, fontVariantNumeric: 'tabular-nums' }}>{prefix}{value}</div>
    </div>
  )
}

function FirmCard({ firm }) {
  const statusColors = { Funded: C.green, Challenge: C.blue, Failed: C.red }
  const statusLabels = { Funded: 'Funded', Challenge: 'Challenge', Failed: 'Failed' }
  return (
    <div style={{
      padding: '20px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      borderLeft: `3px solid ${firm.color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{firm.name}</div>
          <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>{firm.plan}</div>
        </div>
        <span style={{
          padding: '4px 10px', borderRadius: 6,
          fontSize: 11, fontWeight: 600,
          color: statusColors[firm.status],
          background: `${statusColors[firm.status]}15`,
          border: `1px solid ${statusColors[firm.status]}30`,
        }}>{statusLabels[firm.status]}</span>
      </div>

      {firm.status !== 'Failed' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.text3, marginBottom: 4 }}>
              <span>Drawdown</span>
              <span style={{ color: firm.ddPct > 95 ? C.green : firm.ddPct > 85 ? C.amber : C.red }}>{firm.ddPct.toFixed(1)}%</span>
            </div>
            <div style={{ height: 5, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${firm.ddPct}%`,
                background: firm.ddPct > 95 ? C.green : firm.ddPct > 85 ? C.amber : C.red,
              }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11, color: C.text2 }}>
            <div>
              <div style={{ color: C.text3, marginBottom: 2 }}>Balance</div>
              <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>${firm.balance.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: C.text3, marginBottom: 2 }}>Split</div>
              <div style={{ fontWeight: 600 }}>{firm.split}%</div>
            </div>
            <div>
              <div style={{ color: C.text3, marginBottom: 2 }}>Consistency</div>
              <div style={{ fontWeight: 600, color: firm.consistency <= 30 ? C.green : C.amber }}>{firm.consistency}%</div>
            </div>
          </div>
        </>
      )}

      {firm.status === 'Failed' && (
        <div style={{ fontSize: 12, color: C.text3, padding: '12px 0' }}>
          Account blown after {firm.tradingDays} days. Loss: ${firm.spent}
        </div>
      )}
    </div>
  )
}

export default function DemoClient() {
  const t = useT()
  const [dismissed, setDismissed] = useState(false)

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Demo banner */}
      {!dismissed && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '10px 24px',
          background: 'linear-gradient(90deg, rgba(45,111,255,0.95), rgba(77,143,255,0.95))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            {t('demo.banner')}
          </span>
          <Link href="/app" style={{
            padding: '6px 16px', borderRadius: 6,
            fontSize: 12, fontWeight: 600,
            background: '#fff', color: C.blue,
            textDecoration: 'none',
          }}>{t('demo.signupCta')}</Link>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontSize: 16, padding: 4,
            }}
            aria-label="Close"
          >×</button>
        </div>
      )}

      {/* Sidebar + main */}
      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: dismissed ? 0 : 44 }}>
        {/* Sidebar */}
        <aside className="demo-sidebar" style={{
          width: 220, flexShrink: 0,
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          padding: '24px 16px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', color: C.text, marginBottom: 20, paddingLeft: 8 }}>
            QUANTARA
          </div>
          {[
            { icon: '📊', label: 'Dashboard', active: true },
            { icon: '📈', label: 'Analytics' },
            { icon: '📔', label: 'Journal' },
            { icon: '🗓', label: 'Calendar' },
            { icon: '🔥', label: 'Heatmaps' },
            { icon: '📋', label: 'My Rules' },
            { icon: '⚖️', label: 'Compare', href: '/compare' },
          ].map(item => (
            <div key={item.label} style={{
              padding: '10px 12px', borderRadius: 8,
              fontSize: 13, color: item.active ? C.text : C.text2,
              background: item.active ? 'rgba(45,111,255,0.1)' : 'transparent',
              borderLeft: item.active ? `2px solid ${C.blue}` : '2px solid transparent',
              fontWeight: item.active ? 600 : 400,
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'default',
            }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '28px 32px', maxWidth: 1100 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 4 }}>
              {t('demo.greeting')}
            </h1>
            <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>
              {t('demo.subtitle')}
            </p>
          </div>

          {/* Stats row */}
          <div className="demo-stats" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12, marginBottom: 28,
          }}>
            <StatCard label="PropFirms" value="3" />
            <StatCard label={t('demo.totalSpent')} value={`$${TOTAL_SPENT}`} color={C.red} />
            <StatCard label={t('demo.totalPayouts')} value={`$${TOTAL_PAYOUTS.toLocaleString()}`} color={C.green} />
            <StatCard label={t('demo.netResult')} value={`${TOTAL_NET >= 0 ? '+' : ''}$${TOTAL_NET.toLocaleString()}`} color={TOTAL_NET >= 0 ? C.green : C.red} />
            <StatCard label={t('demo.payoutCount')} value="4" color={C.blueLight} />
          </div>

          {/* Firm cards */}
          <div className="demo-firms" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}>
            {DEMO_FIRMS.map(f => <FirmCard key={f.name} firm={f} />)}
          </div>

          {/* CTA bottom */}
          <div style={{
            marginTop: 48, padding: '32px',
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 14, textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 8 }}>
              {t('demo.ctaTitle')}
            </h2>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 20, lineHeight: 1.6 }}>
              {t('demo.ctaSubtitle')}
            </p>
            <Link href="/app" style={{
              display: 'inline-block', padding: '12px 28px',
              background: C.blue, color: '#fff', borderRadius: 8,
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>{t('demo.ctaButton')}</Link>
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .demo-sidebar { display: none !important; }
          main { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  )
}
