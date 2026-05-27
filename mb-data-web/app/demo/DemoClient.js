'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useT } from '../../components/LanguageProvider'
import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'
import { getFirmLogo } from '../../lib/firmLogos'

const STATUS_COLORS = {
  Challenge: { bg: 'var(--blue-bg, rgba(45,111,255,0.12))', text: 'var(--blue-light, #4d8fff)' },
  'Financé': { bg: 'var(--green-bg, rgba(29,184,122,0.12))', text: 'var(--green-text, #1db87a)' },
  'Échoué': { bg: 'var(--red-bg, rgba(232,80,74,0.12))', text: 'var(--red-text, #e8504a)' },
}

const DEMO_FIRMS = [
  {
    id: 1, name: 'Lucid Trading', color: '#2d6fff',
    accounts: [
      { name: 'PRO 6', status: 'Financé', pnl: 2187, payouts: [{ amount: 2500 }, { amount: 1300 }, { amount: 890 }, { amount: 400 }] },
      { name: 'PRO 7', status: 'Financé', pnl: 2713, payouts: [] },
      { name: 'EVAL 19', status: 'Challenge', pnl: -70, payouts: [] },
    ],
    failedCount: 10, spent: 1197, totalPayouts: 5090,
  },
  {
    id: 2, name: 'Take Profit Trader', color: '#fac775',
    accounts: [
      { name: 'TPPRO1881087', status: 'Financé', pnl: -119, payouts: [] },
    ],
    failedCount: 0, spent: 119, totalPayouts: 0,
  },
  {
    id: 3, name: 'FuturesELites', color: '#e8504a',
    accounts: [
      { name: 'FE-EVAL-001', status: 'Échoué', pnl: -65, payouts: [] },
      { name: 'FE-EVAL-002', status: 'Échoué', pnl: -65, payouts: [] },
      { name: 'FE-EVAL-003', status: 'Échoué', pnl: -65, payouts: [] },
      { name: 'FE-EVAL-004', status: 'Échoué', pnl: -65, payouts: [] },
      { name: 'FE-EVAL-005', status: 'Échoué', pnl: -63, payouts: [] },
    ],
    failedCount: 5, spent: 323, totalPayouts: 0,
  },
  {
    id: 4, name: 'Alpha Futures', color: '#1db87a',
    accounts: [
      { name: 'challenge-002', status: 'Challenge', pnl: -80, payouts: [] },
      { name: 'challenge-003', status: 'Challenge', pnl: -80, payouts: [] },
    ],
    failedCount: 1, spent: 313, totalPayouts: 0,
  },
  {
    id: 5, name: 'Topstep', color: '#4d8fff',
    accounts: [
      { name: 'challenge-001', status: 'Challenge', pnl: -135, payouts: [] },
      { name: 'challenge-002', status: 'Challenge', pnl: -135, payouts: [] },
      { name: 'challenge-003', status: 'Challenge', pnl: -135, payouts: [] },
    ],
    failedCount: 0, spent: 673, totalPayouts: 0,
  },
]

const TOTAL_ACCTS = DEMO_FIRMS.reduce((s, f) => s + f.accounts.length, 0)
const TOTAL_SPENT = DEMO_FIRMS.reduce((s, f) => s + f.spent, 0)
const TOTAL_PAYOUTS = DEMO_FIRMS.reduce((s, f) => s + f.totalPayouts, 0)
const TOTAL_NET = TOTAL_PAYOUTS - TOTAL_SPENT
const TOTAL_PAYOUT_COUNT = 4

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_HEADER = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

export default function DemoClient() {
  const t = useT()
  const [dismissed, setDismissed] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const now = new Date()
  const [calMonth] = useState(now.getMonth())
  const [calYear] = useState(now.getFullYear())

  const filteredFirms = DEMO_FIRMS.filter(f => f.name.toLowerCase().includes(searchQ.toLowerCase()))

  const firstDay = new Date(calYear, calMonth, 1)
  let sdow = firstDay.getDay(); sdow = sdow === 0 ? 6 : sdow - 1
  const dim = new Date(calYear, calMonth + 1, 0).getDate()
  const todayDate = now.getDate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0d0f14)', color: 'var(--text, #f0ede8)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />

      {!dismissed && (
        <div style={{ padding: '10px 24px', background: 'linear-gradient(90deg, rgba(45,111,255,0.95), rgba(77,143,255,0.95))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{t('demo.banner')}</span>
          <Link href="/auth?mode=signup" style={{ padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#fff', color: '#2d6fff', textDecoration: 'none' }}>{t('demo.signupCta')}</Link>
          <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 16, padding: 4 }} aria-label="Close">×</button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1 }}>
        {/* ── SIDEBAR (copie exacte de AppSidebar) ── */}
        <aside className="demo-sidebar" style={{
          width: 210, flexShrink: 0,
          background: 'rgba(13,15,20,0.65)', backdropFilter: 'blur(26px)',
          borderRight: '1px solid var(--border, rgba(255,255,255,0.06))',
          padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 1,
          overflowY: 'auto', position: 'sticky', top: 52, height: 'calc(100vh - 52px)',
        }}>
          <SidebarSection label={t('app.sidebar.sectionVue')} />
          <SidebarItem icon="◫" label={t('app.sidebar.dashboard')} active />
          <SidebarItem icon="◐" label={t('app.sidebar.analytics')} />
          <SidebarItem icon="◳" label={t('app.sidebar.calendar')} />

          <SidebarSection label={t('app.sidebar.sectionTrades')} />
          <SidebarItem icon="☰" label={t('app.sidebar.journalGroup')} header />
          <SidebarItem label={t('app.sidebar.journalManuel')} indent />
          <SidebarItem label="Journal Sync" indent />
          <SidebarItem label={t('app.sidebar.syncApi')} indent disabled badge="🔒" />
          <SidebarItem icon="⊞" label={t('app.sidebar.trades')} />
          <SidebarItem icon="▦" label={t('app.sidebar.heatmaps')} />
          <SidebarItem icon="⊡" label={t('app.sidebar.myrules')} />

          <SidebarSection label={t('app.sidebar.sectionPropFirm')} />
          <SidebarItem icon="◊" label={t('app.sidebar.rules')} href="/compare" />
          <SidebarItem icon="◉" label={t('app.sidebar.alerts')} badge="3" badgeColor="#e8504a" />

          <SidebarSection label={t('app.sidebar.sectionCommunaute')} />
          <SidebarItem icon="◈" label={t('app.sidebar.groups')} />

          <div style={{ flex: 1 }} />
          <div style={{ borderTop: '1px solid var(--border)', padding: '12px 8px', marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>DEMO USER</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'ui-monospace, monospace' }}>demo@quantara.tech</div>
          </div>
        </aside>

        {/* ── MAIN CONTENT (copie exacte du dashboard) ── */}
        <main style={{ flex: 1, maxWidth: 1160, margin: '0 auto', padding: '32px 24px 60px' }}>
          {/* Header */}
          <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--blue-light, #4d8fff)', letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>{t('app.dashboard.eyebrow')}</div>
              <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, marginBottom: 6, lineHeight: 1.1 }}>
                {t('demo.greeting')}
              </h1>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>1 USD ≈ 0.8621 EUR · 1 GBP ≈ 1.1574 EUR — 14:18</div>
            </div>
            <div className="page-header-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                <button style={{ padding: '7px 14px', fontSize: 12, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'default', fontWeight: 600, letterSpacing: '0.05em' }}>USD</button>
                <button style={{ padding: '7px 14px', fontSize: 12, border: 'none', background: 'transparent', color: 'var(--text2)', cursor: 'default', fontWeight: 600, letterSpacing: '0.05em' }}>EUR</button>
              </div>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 Rechercher..." style={{ maxWidth: 180, width: '100%', padding: '8px 12px', fontSize: 13, background: 'var(--surface, #141720)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }} />
              <button style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'default', opacity: 0.5 }}>+ Ajouter PropFirm</button>
            </div>
          </div>

          {/* Stats 5 cards */}
          <div className="stats-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: t('app.dashboard.statPropfirms'), value: `${DEMO_FIRMS.length} · ${TOTAL_ACCTS} comptes`, small: true },
              { label: t('app.dashboard.statTotalSpent'), value: `${TOTAL_SPENT.toLocaleString()}.00 $`, color: 'var(--red)' },
              { label: t('app.dashboard.statTotalPayouts'), value: `${TOTAL_PAYOUTS.toLocaleString()}.00 $`, color: 'var(--green)' },
              { label: t('app.dashboard.statNetResult'), value: `${TOTAL_NET >= 0 ? '+' : ''}${TOTAL_NET.toLocaleString()}.00 $`, color: TOTAL_NET >= 0 ? 'var(--green)' : 'var(--red)' },
              { label: t('app.dashboard.statPayouts'), value: TOTAL_PAYOUT_COUNT },
            ].map((k, i) => (
              <div key={i} className="qt-stat-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px', boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: k.small ? 15 : 24, fontWeight: 700, color: k.color || 'var(--text)', letterSpacing: '-0.015em' }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Firms grid */}
          <div className="firms-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16, marginBottom: 24 }}>
            {filteredFirms.map(firm => {
              const net = firm.totalPayouts - firm.spent
              const roi = firm.spent > 0 ? net / firm.spent * 100 : 0
              const al = firm.accounts
              const challengeCount = al.filter(a => a.status === 'Challenge').length
              const fundedCount = al.filter(a => a.status === 'Financé').length
              const payoutCount = al.reduce((s, a) => s + (a.payouts?.length || 0), 0)
              const activeCount = al.filter(a => a.status !== 'Échoué').length

              return (
                <div key={firm.id} className="qt-firm-card" style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20,
                  cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(45,111,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.25), 0 0 24px rgba(45,111,255,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {getFirmLogo(firm.name, firm.color, 36)}
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.005em' }}>{firm.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{al.length} compte{al.length > 1 ? 's' : ''} · {payoutCount} payout{payoutCount > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 19, fontWeight: 700, color: net >= 0 ? 'var(--green)' : 'var(--red)', letterSpacing: '-0.015em' }}>{net >= 0 ? '+' : ''}{net} $</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>ROI {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                    {[
                      { l: t('app.dashboard.miniSpent'), v: `${firm.spent} $`, c: 'var(--red)' },
                      { l: t('app.dashboard.miniPayouts'), v: `${firm.totalPayouts} $`, c: 'var(--green)' },
                      { l: t('app.dashboard.miniActive'), v: activeCount },
                    ].map((s, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 7, padding: '10px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 600 }}>{s.l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: s.c || 'var(--text)', letterSpacing: '-0.005em' }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {al.filter(a => a.status !== 'Échoué').slice(0, 3).map((a, ai) => (
                    <div key={ai} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: `1px solid rgba(255,255,255,0.03)` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[a.status]?.text }} />
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>{a.name}</span>
                        <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 4, background: STATUS_COLORS[a.status]?.bg, color: STATUS_COLORS[a.status]?.text, fontWeight: 600 }}>{a.status}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: a.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{a.pnl >= 0 ? '+' : ''}{a.pnl} $</span>
                    </div>
                  ))}
                  {al.filter(a => a.status !== 'Échoué').length > 3 && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>+{al.filter(a => a.status !== 'Échoué').length - 3} autres...</div>
                  )}

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                    {challengeCount > 0 && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'rgba(45,111,255,0.12)', color: '#4d8fff', fontWeight: 600 }}>{challengeCount} Challenge{challengeCount > 1 ? 's' : ''}</span>}
                    {fundedCount > 0 && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'rgba(29,184,122,0.12)', color: '#1db87a', fontWeight: 600 }}>{fundedCount} Financé{fundedCount > 1 ? 's' : ''}</span>}
                    {firm.failedCount > 0 && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'rgba(232,80,74,0.12)', color: '#e8504a', fontWeight: 600 }}>{firm.failedCount} Échoué{firm.failedCount > 1 ? 's' : ''}</span>}
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'rgba(250,199,117,0.12)', color: '#fac775', fontWeight: 600, cursor: 'pointer' }}>🎓 Diplômes</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── CALENDRIER DES TRANSACTIONS (réplique exacte) ── */}
          <DemoCalendar calMonth={calMonth} calYear={calYear} sdow={sdow} dim={dim} todayDate={todayDate} t={t} />

          {/* CTA */}
          <div style={{ padding: 32, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center', boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 8 }}>{t('demo.ctaTitle')}</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>{t('demo.ctaSubtitle')}</p>
            <Link href="/auth?mode=signup" style={{ display: 'inline-block', padding: '12px 28px', background: 'var(--blue)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>{t('demo.ctaButton')}</Link>
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
          .grid-1-280 { grid-template-columns: 1fr !important; }
          .dash-sidebar-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function DemoCalendar({ calMonth, calYear, sdow, dim, todayDate, t }) {
  const [selDay, setSelDay] = useState(null)

  const DEMO_EVENTS = {
    [`${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`]: [{ type: 'buy', firm: 'Bulenox', amount: 95, label: 'Challenge' }],
    [`${calYear}-${String(calMonth + 1).padStart(2, '0')}-13`]: [{ type: 'buy', firm: 'Take Profit Trader', amount: 119, label: 'Mensualité #1' }, { type: 'pay', firm: 'Lucid Trading', amount: 1130, label: 'Payout' }],
    [`${calYear}-${String(calMonth + 1).padStart(2, '0')}-18`]: [{ type: 'buy', firm: 'Alpha Futures', amount: 140, label: 'Challenge' }, { type: 'pay', firm: 'Lucid Trading', amount: 1008, label: 'Payout' }],
    [`${calYear}-${String(calMonth + 1).padStart(2, '0')}-20`]: [{ type: 'buy', firm: 'FuturesELites', amount: 323, label: '5 Challenges' }, { type: 'pay', firm: 'Lucid Trading', amount: 1153, label: 'Payout' }],
    [`${calYear}-${String(calMonth + 1).padStart(2, '0')}-21`]: [{ type: 'buy', firm: 'Bulenox', amount: 154, label: 'Challenge' }],
    [`${calYear}-${String(calMonth + 1).padStart(2, '0')}-22`]: [{ type: 'buy', firm: 'Alpha Futures', amount: 159, label: 'Challenge' }],
    [`${calYear}-${String(calMonth + 1).padStart(2, '0')}-23`]: [{ type: 'buy', firm: 'Topstep', amount: 673, label: '5 Challenges' }],
    [`${calYear}-${String(calMonth + 1).padStart(2, '0')}-${todayDate}`]: [{ type: 'pay', firm: 'Lucid Trading', amount: 1800, label: 'Payout' }],
  }

  const msSpent = Object.values(DEMO_EVENTS).flat().filter(e => e.type === 'buy').reduce((s, e) => s + e.amount, 0)
  const msPayout = Object.values(DEMO_EVENTS).flat().filter(e => e.type === 'pay').reduce((s, e) => s + e.amount, 0)
  const msNet = msPayout - msSpent

  const recentTx = Object.entries(DEMO_EVENTS)
    .flatMap(([d, evts]) => evts.map(e => ({ ...e, date: d })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)' }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{t('app.dashboard.calendarTitle')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', cursor: 'default', fontSize: 14 }}>‹</button>
          <span style={{ fontWeight: 600, minWidth: 140, textAlign: 'center' }}>{MONTHS[calMonth]} {calYear}</span>
          <button style={{ padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', cursor: 'default', fontSize: 14 }}>›</button>
          <button style={{ padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', cursor: 'default', fontSize: 12 }}>Aujourd&apos;hui</button>
        </div>
      </div>

      {/* 3 stats du mois */}
      <div className="stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { l: t('app.dashboard.monthSpent'), v: `${msSpent.toFixed(2)} $`, c: 'var(--red)' },
          { l: t('app.dashboard.monthPayout'), v: `${msPayout.toFixed(2)} $`, c: 'var(--green)' },
          { l: t('app.dashboard.monthNet'), v: `${msNet >= 0 ? '+' : ''}${msNet.toFixed(2)} $`, c: msNet >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map((s, i) => (
          <div key={i} style={{ ...card, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.l}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid + Right panel */}
      <div className="grid-1-280" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Calendar */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: 'var(--surface2, #1c2030)', borderBottom: '0.5px solid var(--border)' }}>
            {DAYS_HEADER.map(d => <div key={d} style={{ padding: '12px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {Array.from({ length: sdow }).map((_, i) => (
              <div key={`e${i}`} style={{ minHeight: 108, padding: 10, borderRight: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)', opacity: 0.25 }} />
            ))}
            {Array.from({ length: dim }).map((_, i) => {
              const day = i + 1
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const evts = DEMO_EVENTS[dateStr] || []
              const buyT = evts.filter(e => e.type === 'buy').reduce((s, e) => s + e.amount, 0)
              const payT = evts.filter(e => e.type === 'pay').reduce((s, e) => s + e.amount, 0)
              const isToday = day === todayDate
              const isSelected = dateStr === selDay
              const cellIdx = sdow + i
              return (
                <div key={day} onClick={() => setSelDay(dateStr)} style={{
                  minHeight: 108, padding: 10, cursor: 'pointer',
                  borderRight: (cellIdx + 1) % 7 === 0 ? 'none' : '0.5px solid var(--border)',
                  borderBottom: '0.5px solid var(--border)',
                  background: isSelected ? 'rgba(45,111,255,0.08)' : 'transparent',
                  outline: isSelected ? '2px solid var(--blue)' : 'none', outlineOffset: -2,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: isToday ? 'var(--blue)' : 'transparent', color: isToday ? '#fff' : 'var(--text2)', marginBottom: 5 }}>{day}</div>
                  {buyT > 0 && <div style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--red-bg, rgba(232,80,74,0.12))', color: 'var(--red-text, #e8504a)', marginBottom: 3, display: 'inline-block' }}>-{buyT} $</div>}
                  {payT > 0 && <div style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--green-bg, rgba(29,184,122,0.12))', color: 'var(--green-text, #1db87a)', display: 'inline-block' }}>+{payT} $</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Selected day */}
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              {selDay ? new Date(selDay + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sélectionnez un jour'}
            </div>
            {selDay ? (DEMO_EVENTS[selDay] || []).length > 0 ? (DEMO_EVENTS[selDay] || []).map((e, i) => (
              <div key={i} style={{ padding: '10px 12px', background: 'var(--surface2, #1c2030)', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{e.firm}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: e.type === 'buy' ? 'var(--red-bg)' : 'var(--green-bg)', color: e.type === 'buy' ? 'var(--red-text)' : 'var(--green-text)', fontWeight: 600 }}>{e.label}</span>
                </div>
                <div style={{ fontSize: 12, color: e.type === 'buy' ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>{e.type === 'buy' ? '-' : '+'}{e.amount.toFixed(2)} $</div>
              </div>
            )) : <div style={{ color: 'var(--text3)', fontSize: 12 }}>Aucune transaction.</div> : <div style={{ color: 'var(--text3)', fontSize: 12 }}>Cliquez sur un jour.</div>}
          </div>

          {/* Transactions récentes */}
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Transactions récentes</div>
            {recentTx.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.type === 'buy' ? 'var(--red)' : 'var(--green)', marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{e.firm}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{e.date} · {e.type === 'buy' ? 'Achat' : 'Payout'}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: e.type === 'buy' ? 'var(--red)' : 'var(--green)' }}>{e.type === 'buy' ? '-' : '+'}{e.amount.toFixed(2)} $</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 cards bottom: Stats + Par firme */}
      <div className="dash-sidebar-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 24 }}>
        <div style={{ ...card, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 10 }}>Par firme ($)</div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}><div style={{ width: 10, height: 3, borderRadius: 2, background: '#e8504a' }} />Dépensé</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}><div style={{ width: 10, height: 3, borderRadius: 2, background: '#1db87a' }} />Payouts</div>
          </div>
          {DEMO_FIRMS.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', width: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.length > 8 ? f.name.slice(0, 8) + '…' : f.name}</div>
              <div style={{ flex: 1, display: 'flex', gap: 2, height: 8 }}>
                <div style={{ width: `${(f.spent / 1200) * 100}%`, background: '#e8504a', borderRadius: 2, minWidth: f.spent > 0 ? 4 : 0 }} />
                <div style={{ width: `${(f.totalPayouts / 5100) * 100}%`, background: '#1db87a', borderRadius: 2, minWidth: f.totalPayouts > 0 ? 4 : 0 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...card, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 14 }}>Statistiques</div>
          {[
            ['Taux de réussite', '11%', 'var(--text)'],
            ['Meilleur payout', '2 713 $', 'var(--green)'],
            ['Coût moyen challenge', '195 $', 'var(--text)'],
            ['ROI global', '+88.4%', 'var(--green)'],
            ['Comptes actifs', '8', 'var(--text)'],
          ].map(([label, value, color], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ ...card, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 14 }}>Par firme</div>
          {DEMO_FIRMS.slice().sort((a, b) => (b.totalPayouts - b.spent) - (a.totalPayouts - a.spent)).map(f => {
            const net = f.totalPayouts - f.spent
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getFirmLogo(f.name, f.color, 22)}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{f.accounts.length} compte{f.accounts.length > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>{net >= 0 ? '+' : ''}{net} $</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SidebarSection({ label }) {
  return <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, padding: '14px 10px 4px' }}>{label}</div>
}

function SidebarItem({ icon, label, active, header, indent, disabled, badge, badgeColor, href }) {
  const style = {
    padding: indent ? '6px 10px 6px 32px' : '8px 10px',
    borderRadius: 7, fontSize: 13,
    color: disabled ? 'var(--text3)' : active ? 'var(--text)' : 'var(--text2)',
    background: active ? 'rgba(45,111,255,0.1)' : 'transparent',
    borderLeft: active ? '2px solid var(--blue)' : '2px solid transparent',
    fontWeight: active ? 600 : header ? 600 : 400,
    display: 'flex', alignItems: 'center', gap: 8,
    cursor: href ? 'pointer' : 'default',
    opacity: disabled ? 0.5 : 1,
    textDecoration: 'none',
  }
  const inner = (
    <>
      {icon && <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>}
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: badgeColor || 'rgba(255,255,255,0.1)', color: badgeColor ? '#fff' : 'var(--text3)', fontWeight: 700 }}>{badge}</span>}
    </>
  )
  if (href) return <Link href={href} style={style}>{inner}</Link>
  return <div style={style}>{inner}</div>
}
