'use client'
// Dashboard redesign MOCKUP v2 — mirrors the REAL dashboard structure
// (app/app/(main)/dashboard/page.js): header + greeting, 5 stat cards, firm
// cards (logo / net+ROI / Dépensé-Payouts-Actifs / account rows / status badges
// + Diplômes), transactions calendar (month nav, 3 month-stats, day grid with
// -buy/+payout, day-detail panel + recent transactions), and the 3 bottom cards
// (Par firme bar chart, Statistiques, Par firme ranking).
// Restyled in the premium glass "Mission Control" direction. Mock data only,
// standalone at /dash-preview — does NOT touch the real dashboard.

import Link from 'next/link'
import { useState } from 'react'
import QLogoIcon from '../../components/QLogoIcon'

const C = {
  bg: '#080a0f',
  glass: 'rgba(22,26,37,0.55)', glass2: 'rgba(30,35,50,0.6)', surface2: 'rgba(28,32,48,0.5)',
  line: 'rgba(255,255,255,0.07)', line2: 'rgba(255,255,255,0.12)',
  text: '#f0ede8', text2: '#9098b0', text3: '#646e87',
  blue: '#2d6fff', blueLt: '#4d8fff', blueSoft: 'rgba(45,111,255,0.12)',
  green: '#1db87a', greenBg: 'rgba(29,184,122,0.13)',
  red: '#e8504a', redBg: 'rgba(232,80,74,0.13)',
  amber: '#fac775', amberBg: 'rgba(250,199,117,0.14)',
}
const STATUS = { 'Financé': C.green, 'Challenge': C.blueLt, 'Échoué': C.red }

const I = (paths, extra) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths.map((d, i) => <path key={i} d={d} />)}{extra}</svg>
)
const ICON = {
  grid: I(['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z']),
  trades: I(['M3 17l6-6 4 4 8-8', 'M21 7v6', 'M15 7h6']),
  journal: I(['M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z', 'M8 7h8', 'M8 11h6']),
  calendar: I(['M3 5h18v16H3z', 'M3 9h18', 'M8 3v4', 'M16 3v4']),
  health: I(['M3 12h4l2 6 4-14 2 8h6']),
  users: I(['M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1', 'M22 19v-1a4 4 0 0 0-3-3.9'], <><circle cx="9" cy="8" r="4" /><circle cx="17.5" cy="8" r="3" /></>),
  settings: I(['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 0 1-4 0 1.6 1.6 0 0 0-2.7-1.1 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 2.6 13a2 2 0 0 1 0-4 1.6 1.6 0 0 0 1.1-2.7 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 9 3.6a2 2 0 0 1 4 0 1.6 1.6 0 0 0 2.7 1.1 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 20.4 11a2 2 0 0 1 0 4z']),
  search: I(['m21 21-4.3-4.3'], <circle cx="11" cy="11" r="7" />),
  bell: I(['M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0']),
  plus: I(['M12 5v14', 'M5 12h14']),
  heart: I(['M12 21s-7-4.3-9.3-8.5C1 9 2.6 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.4 0 5 3.5 3.3 7C19 16.7 12 21 12 21z']),
  pie: I(['M21 12A9 9 0 1 1 11 3v9z'], <path d="M12 3a9 9 0 0 1 9 9h-9z" />),
  sync: I(['M3 12a9 9 0 0 1 15-6.7L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-15 6.7L3 16', 'M3 21v-5h5']),
  plug: I(['M9 2v6', 'M15 2v6', 'M7 8h10v3a5 5 0 0 1-10 0z', 'M12 16v6']),
  candles: I(['M7 7v3', 'M7 16v2', 'M17 5v3', 'M17 15v3'], <><rect x="5" y="10" width="4" height="6" rx="1" /><rect x="15" y="8" width="4" height="7" rx="1" /></>),
  heatmap: I([], <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  rulesCheck: I(['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 4h6v3H9z', 'M9 14l2 2 4-4']),
  scale: I(['M12 3v18', 'M5 21h14', 'M4 7l4-4 4 4', 'M2 11a4 4 0 0 0 8 0', 'M14 7l4-4 4 4', 'M14 11a4 4 0 0 0 8 0']),
}
const LOCK = <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm3 8H9V6a3 3 0 0 1 6 0z" /></svg>

// Real sidebar items (from components/AppSidebar.js), grouped by section.
const NAVG = [
  { sec: 'Vue d’ensemble', items: [
    { k: 'grid', label: 'Vue d’ensemble', active: true }, { k: 'heart', label: 'Health Center' },
    { k: 'pie', label: 'Analytics' }, { k: 'calendar', label: 'Calendrier' },
  ] },
  { sec: 'Mes Trades', items: [
    { k: 'journal', label: 'Journal manuel' }, { k: 'sync', label: 'Journal sync' },
    { k: 'plug', label: 'Sync API', lock: true }, { k: 'candles', label: 'Mes trades' },
    { k: 'heatmap', label: 'Heatmaps' }, { k: 'rulesCheck', label: 'Mes règles' },
  ] },
  { sec: 'PropFirms', items: [
    { k: 'scale', label: 'Comparateur' }, { k: 'bell', label: 'Alertes', badge: 3 },
  ] },
  { sec: 'Communauté', items: [{ k: 'users', label: 'Communauté', lock: true }] },
]

// ── Mock firms (same anatomy as the real firm cards) ──
const FIRMS = [
  { name: 'Topstep', letter: 'T', color: '#e8b34a', spent: 495, payouts: 6800, payoutCount: 4,
    accounts: [{ label: 'TS 150K #1', status: 'Financé', net: 2140 }, { label: 'TS 150K #2', status: 'Financé', net: 1200 }] },
  { name: 'Apex', letter: 'A', color: '#5b8def', spent: 870, payouts: 4200, payoutCount: 3,
    accounts: [{ label: 'APX 100K #1', status: 'Financé', net: 1050 }, { label: 'APX 100K #2', status: 'Challenge', net: -120 }] },
  { name: 'Bulenox', letter: 'B', color: '#27c2a0', spent: 360, payouts: 0, payoutCount: 0,
    accounts: [{ label: 'BLX 50K', status: 'Challenge', net: -360 }] },
  { name: 'MyFundedFutures', letter: 'M', color: '#a06bff', spent: 165, payouts: 2400, payoutCount: 2,
    accounts: [{ label: 'MFF 100K', status: 'Financé', net: 2235 }] },
]
const fNet = (f) => f.payouts - f.spent
const fRoi = (f) => f.spent > 0 ? (fNet(f) / f.spent) * 100 : 0
const fCounts = (f) => ({
  challenge: f.accounts.filter(a => a.status === 'Challenge').length,
  funded: f.accounts.filter(a => a.status === 'Financé').length,
  failed: f.accounts.filter(a => a.status === 'Échoué').length,
})

const totalSpent = FIRMS.reduce((s, f) => s + f.spent, 0)
const totalPayouts = FIRMS.reduce((s, f) => s + f.payouts, 0)
const totalNet = totalPayouts - totalSpent
const totalPayoutCount = FIRMS.reduce((s, f) => s + f.payoutCount, 0)
const totalAccts = FIRMS.reduce((s, f) => s + f.accounts.length, 0)
const fundedCount = FIRMS.reduce((s, f) => s + fCounts(f).funded, 0)

const eur = (v, dec = 0) => v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + ' €'
const eurNet = (v, dec = 0) => (v >= 0 ? '+' : '') + eur(v, dec)

// ── Mock calendar events for the current month (keyed by day number) ──
const now = new Date()
const Y = now.getFullYear(), Mo = now.getMonth()
const SEED = [
  { d: 3, type: 'buy', firm: 'Topstep', amount: 165, label: 'Challenge' },
  { d: 5, type: 'buy', firm: 'Apex', amount: 145, label: 'Reset' },
  { d: 8, type: 'pay', firm: 'Apex', amount: 1800 },
  { d: 12, type: 'buy', firm: 'Bulenox', amount: 360, label: 'Challenge' },
  { d: 15, type: 'pay', firm: 'Topstep', amount: 3200 },
  { d: 22, type: 'pay', firm: 'MyFundedFutures', amount: 2400 },
  { d: 24, type: 'buy', firm: 'MyFundedFutures', amount: 165, label: 'Challenge' },
]
const ds = (d) => `${Y}-${String(Mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const evtMap = {}
SEED.forEach(e => { const k = ds(e.d); (evtMap[k] = evtMap[k] || []).push(e) })
const msSpent = SEED.filter(e => e.type === 'buy').reduce((s, e) => s + e.amount, 0)
const msPayout = SEED.filter(e => e.type === 'pay').reduce((s, e) => s + e.amount, 0)

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function buildDays(year, month) {
  const first = new Date(year, month, 1)
  let sdow = first.getDay(); sdow = sdow === 0 ? 6 : sdow - 1
  const dim = new Date(year, month + 1, 0).getDate()
  const dipm = new Date(year, month, 0).getDate()
  const todayStr = new Date().toISOString().slice(0, 10)
  const days = []
  for (let i = sdow - 1; i >= 0; i--) days.push({ day: dipm - i, other: true })
  for (let d = 1; d <= dim; d++) { const s = ds(d); days.push({ day: d, dateStr: s, today: s === todayStr }) }
  const rem = (sdow + dim) % 7 === 0 ? 0 : 7 - (sdow + dim) % 7
  for (let d = 1; d <= rem; d++) days.push({ day: d, other: true })
  return days
}

export default function DashPreview() {
  const [selDay, setSelDay] = useState(ds(15))
  const days = buildDays(Y, Mo)

  const recent = Object.entries(evtMap).flatMap(([d, evts]) => evts.map(e => ({ ...e, date: d })))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  const stats = [
    ['Taux de réussite', Math.round(fundedCount / totalAccts * 100) + '%', C.green],
    ['Meilleur payout', eur(3200), C.green],
    ['Coût moyen challenge', eur(Math.round(totalSpent / totalAccts)), C.text],
    ['ROI global', (totalNet >= 0 ? '+' : '') + (totalNet / totalSpent * 100).toFixed(0) + '%', C.green],
    ['Comptes actifs', String(totalAccts), C.text],
  ]
  const ranking = FIRMS.slice().sort((a, b) => fNet(b) - fNet(a))
  const barMax = Math.max(...FIRMS.flatMap(f => [f.spent, f.payouts]))

  return (
    <div className="mc">
      <style>{css}</style>
      <div className="mc-banner">Maquette de redesign (calquée sur ton dashboard) · données fictives · le vrai dashboard n’est pas modifié</div>

      <div className="mc-shell">
        <aside className="mc-side">
          <div className="mc-side-logo"><QLogoIcon size={28} color={C.blueLt} /></div>
          <nav className="mc-nav">
            {NAVG.map((g, gi) => (
              <div key={g.sec} className="mc-nav-group">
                {g.items.map(n => (
                  <button key={n.label} className={'mc-nav-btn' + (n.active ? ' active' : '') + (n.lock ? ' locked' : '')} aria-label={n.label}>
                    {ICON[n.k]}
                    {n.badge ? <span className="mc-nav-badge">{n.badge}</span> : null}
                    {n.lock ? <span className="mc-nav-lock">{LOCK}</span> : null}
                    <span className="mc-nav-tip">{n.label}</span>
                  </button>
                ))}
                {gi < NAVG.length - 1 && <div className="mc-nav-sep" />}
              </div>
            ))}
            <div className="mc-nav-sep" />
            <button className="mc-nav-btn" aria-label="Réglages">{ICON.settings}<span className="mc-nav-tip">Réglages</span></button>
          </nav>
          <div className="mc-avatar">QT</div>
        </aside>

        <main className="mc-main">
          {/* HEADER */}
          <header className="mc-top">
            <div>
              <div className="mc-eyebrow">Tableau de bord</div>
              <h1 className="mc-title">Bonjour, Alex 👋</h1>
              <div className="mc-rate">1 USD = 0,92 € · taux du jour</div>
            </div>
            <div className="mc-top-actions">
              <div className="mc-seg">{['USD', 'EUR'].map((c, i) => <button key={c} className={i === 1 ? 'on' : ''}>{c}</button>)}</div>
              <div className="mc-searchbox">{ICON.search}<input placeholder="Rechercher une PropFirm…" /></div>
              <button className="mc-icon-btn" aria-label="Notifications">{ICON.bell}<i className="mc-dot" /></button>
              <button className="mc-btn-primary">{ICON.plus}Ajouter une PropFirm</button>
            </div>
          </header>

          {/* 5 STAT CARDS */}
          <section className="mc-stats5">
            {[
              { label: 'PropFirms', value: `${FIRMS.length} · ${totalAccts} comptes`, small: true },
              { label: 'Total dépensé', value: eur(totalSpent), color: C.red },
              { label: 'Total payouts', value: eur(totalPayouts), color: C.green },
              { label: 'Résultat net', value: eurNet(totalNet), color: totalNet >= 0 ? C.green : C.red },
              { label: 'Payouts', value: String(totalPayoutCount) },
            ].map((k, i) => (
              <div key={i} className="mc-stat glass">
                <div className="mc-stat-label">{k.label}</div>
                <div className="mc-stat-val" style={{ fontSize: k.small ? 16 : 24, color: k.color || C.text }}>{k.value}</div>
              </div>
            ))}
          </section>

          {/* FIRM CARDS */}
          <section className="mc-firms">
            {FIRMS.map(f => {
              const net = fNet(f), roi = fRoi(f), cc = fCounts(f)
              const active = f.accounts.filter(a => a.status !== 'Échoué')
              return (
                <div key={f.name} className="mc-card glass mc-firm">
                  <div className="mc-firm-head">
                    <div className="mc-firm-id">
                      <span className="mc-firm-logo" style={{ background: f.color + '22', color: f.color }}>{f.letter}</span>
                      <div><div className="mc-firm-name">{f.name}</div><div className="mc-firm-sub">{f.accounts.length} compte{f.accounts.length > 1 ? 's' : ''} · {f.payoutCount} payout{f.payoutCount > 1 ? 's' : ''}</div></div>
                    </div>
                    <div className="mc-firm-net"><div style={{ color: net >= 0 ? C.green : C.red }}>{eurNet(net)}</div><div className="mc-firm-roi">ROI {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%</div></div>
                  </div>
                  <div className="mc-firm-mini">
                    {[{ l: 'Dépensé', v: eur(f.spent), c: C.red }, { l: 'Payouts', v: eur(f.payouts), c: C.green }, { l: 'Actifs', v: String(cc.funded + cc.challenge), c: C.text }].map(s => (
                      <div key={s.l} className="mc-mini"><div className="mc-mini-l">{s.l}</div><div className="mc-mini-v" style={{ color: s.c }}>{s.v}</div></div>
                    ))}
                  </div>
                  <div className="mc-firm-accts">
                    {active.slice(0, 3).map(a => (
                      <div key={a.label} className="mc-acct">
                        <span className="mc-acct-dot" style={{ background: STATUS[a.status] }} />
                        <span className="mc-acct-name">{a.label}</span>
                        <span className="mc-acct-badge" style={{ background: STATUS[a.status] + '22', color: STATUS[a.status] }}>{a.status}</span>
                        <span className="mc-acct-net" style={{ color: a.net >= 0 ? C.green : C.red }}>{eurNet(a.net)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mc-firm-foot">
                    {cc.challenge > 0 && <span className="mc-tag" style={{ background: C.blueSoft, color: C.blueLt }}>{cc.challenge} Challenge</span>}
                    {cc.funded > 0 && <span className="mc-tag" style={{ background: C.greenBg, color: C.green }}>{cc.funded} Financé{cc.funded > 1 ? 's' : ''}</span>}
                    {cc.failed > 0 && <span className="mc-tag" style={{ background: C.redBg, color: C.red }}>{cc.failed} Échoué</span>}
                    <button className="mc-diploma">Diplômes</button>
                  </div>
                </div>
              )
            })}
          </section>

          {/* CALENDAR */}
          <section className="mc-calwrap">
            <div className="mc-cal-head">
              <div className="mc-section-title">Calendrier des transactions</div>
              <div className="mc-cal-nav">
                <button className="mc-ghost">‹</button>
                <span className="mc-cal-month">{MONTHS[Mo]} {Y}</span>
                <button className="mc-ghost">›</button>
                <button className="mc-ghost">Aujourd’hui</button>
              </div>
            </div>
            <div className="mc-cal-stats">
              {[{ l: 'Achats du mois', v: eur(msSpent), c: C.red }, { l: 'Payouts du mois', v: eur(msPayout), c: C.green }, { l: 'Net du mois', v: eurNet(msPayout - msSpent), c: (msPayout - msSpent) >= 0 ? C.green : C.red }].map(s => (
                <div key={s.l} className="mc-card glass mc-cal-stat"><div className="mc-mini-l">{s.l}</div><div className="mc-cal-stat-v" style={{ color: s.c }}>{s.v}</div></div>
              ))}
            </div>
            <div className="mc-cal-grid">
              <div className="mc-card glass mc-cal-table">
                <div className="mc-cal-dow">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d}>{d}</div>)}</div>
                <div className="mc-cal-cells">
                  {days.map((day, i) => {
                    const evts = day.dateStr ? (evtMap[day.dateStr] || []) : []
                    const buyT = evts.filter(e => e.type === 'buy').reduce((s, e) => s + e.amount, 0)
                    const payT = evts.filter(e => e.type === 'pay').reduce((s, e) => s + e.amount, 0)
                    const sel = day.dateStr === selDay
                    return (
                      <div key={i} className="mc-cell" onClick={() => day.dateStr && setSelDay(day.dateStr)} style={{ opacity: day.other ? 0.25 : 1, background: sel ? C.blueSoft : 'transparent', outline: sel ? `2px solid ${C.blue}` : 'none', outlineOffset: -2, cursor: day.other ? 'default' : 'pointer' }}>
                        <div className="mc-cell-num" style={{ background: day.today ? C.blue : 'transparent', color: day.today ? '#fff' : C.text2 }}>{day.day}</div>
                        {buyT > 0 && <div className="mc-cell-amt" style={{ background: C.redBg, color: C.red }}>-{eur(buyT)}</div>}
                        {payT > 0 && <div className="mc-cell-amt" style={{ background: C.greenBg, color: C.green }}>+{eur(payT)}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="mc-cal-aside">
                <div className="mc-card glass">
                  <div className="mc-aside-title">{selDay ? new Date(selDay + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sélectionnez un jour'}</div>
                  {selDay && (evtMap[selDay] || []).length > 0 ? (evtMap[selDay] || []).map((e, i) => (
                    <div key={i} className="mc-day-evt">
                      <div className="mc-day-evt-top"><span>{e.firm}</span><span className="mc-day-evt-badge" style={{ background: e.type === 'buy' ? C.redBg : C.greenBg, color: e.type === 'buy' ? C.red : C.green }}>{e.label || (e.type === 'buy' ? 'Achat' : 'Payout')}</span></div>
                      <div style={{ color: e.type === 'buy' ? C.red : C.green, fontWeight: 700, fontSize: 13 }}>{e.type === 'buy' ? '-' : '+'}{eur(e.amount)}</div>
                    </div>
                  )) : <div className="mc-empty">Aucune transaction.</div>}
                </div>
                <div className="mc-card glass">
                  <div className="mc-aside-eyebrow">Transactions récentes</div>
                  {recent.map((e, i) => (
                    <div key={i} className="mc-recent">
                      <span className="mc-recent-dot" style={{ background: e.type === 'buy' ? C.red : C.green }} />
                      <div className="mc-recent-mid"><div className="mc-recent-firm">{e.firm}</div><div className="mc-recent-meta">{e.date} · {e.type === 'buy' ? 'Achat' : 'Payout'}</div></div>
                      <span className="mc-recent-amt" style={{ color: e.type === 'buy' ? C.red : C.green }}>{e.type === 'buy' ? '-' : '+'}{eur(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3 BOTTOM CARDS */}
          <section className="mc-bottom">
            {/* Par firme (bar chart) */}
            <div className="mc-card glass">
              <div className="mc-card-title">Par firme (EUR)</div>
              <div className="mc-legend"><span><i style={{ background: C.red }} />Dépensé</span><span><i style={{ background: C.green }} />Payouts</span></div>
              <div className="mc-bars">
                {FIRMS.map(f => (
                  <div key={f.name} className="mc-bar-group">
                    <div className="mc-bar-pair">
                      <div className="mc-bar" style={{ height: (f.spent / barMax * 100) + '%', background: C.red }} title={'Dépensé ' + eur(f.spent)} />
                      <div className="mc-bar" style={{ height: (f.payouts / barMax * 100) + '%', background: C.green }} title={'Payouts ' + eur(f.payouts)} />
                    </div>
                    <div className="mc-bar-label">{f.name.length > 7 ? f.name.slice(0, 7) + '…' : f.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistiques */}
            <div className="mc-card glass">
              <div className="mc-card-title">Statistiques</div>
              <div className="mc-statlist">
                {stats.map(([l, v, c]) => (
                  <div key={l} className="mc-statrow"><span>{l}</span><span style={{ color: c, fontWeight: 700 }}>{v}</span></div>
                ))}
              </div>
            </div>

            {/* Par firme ranking */}
            <div className="mc-card glass">
              <div className="mc-card-title">Par firme</div>
              <div className="mc-rank">
                {ranking.map(f => {
                  const net = fNet(f)
                  return (
                    <div key={f.name} className="mc-rank-row">
                      <span className="mc-rank-logo" style={{ background: f.color + '22', color: f.color }}>{f.letter}</span>
                      <div className="mc-rank-mid"><div className="mc-rank-name">{f.name}</div><div className="mc-rank-meta">{f.accounts.length} compte{f.accounts.length > 1 ? 's' : ''}</div></div>
                      <span className="mc-rank-net" style={{ color: net >= 0 ? C.green : C.red }}>{eurNet(net)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <footer className="mc-foot">Quantara · maquette « Mission Control » — <Link href="/landing">voir les concepts de landing</Link></footer>
        </main>
      </div>
    </div>
  )
}

const css = `
.mc{min-height:100vh;background:
   radial-gradient(900px 500px at 80% -5%, rgba(45,111,255,0.10), transparent 60%),
   radial-gradient(700px 500px at 0% 30%, rgba(29,184,122,0.05), transparent 60%),
   ${C.bg};color:${C.text};font-family:-apple-system,'Segoe UI',system-ui,sans-serif;font-size:14px}
.mc *{box-sizing:border-box}
.mc-banner{text-align:center;font-size:12px;color:${C.text2};background:rgba(45,111,255,0.08);border-bottom:1px solid ${C.line};padding:8px 16px}
.glass{background:linear-gradient(165deg,${C.glass2},${C.glass});backdrop-filter:blur(18px);border:1px solid ${C.line};border-radius:14px}

.mc-shell{display:grid;grid-template-columns:72px 1fr}
.mc-side{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 0;border-right:1px solid ${C.line};background:rgba(8,10,15,0.6);backdrop-filter:blur(10px);position:sticky;top:0;height:100vh}
.mc-side-logo{margin-bottom:14px}
.mc-nav{display:flex;flex-direction:column;gap:6px;flex:1}
.mc-nav-btn{position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;border:none;background:transparent;color:${C.text3};cursor:pointer;transition:all .18s}
.mc-nav-btn:hover{color:${C.text};background:rgba(255,255,255,0.05)}
.mc-nav-btn.active{color:#fff;background:linear-gradient(135deg,${C.blue},${C.blueLt});box-shadow:0 6px 18px rgba(45,111,255,0.35)}
.mc-nav-tip{position:absolute;left:54px;white-space:nowrap;background:#11151f;border:1px solid ${C.line2};color:${C.text};font-size:12px;padding:5px 10px;border-radius:8px;opacity:0;pointer-events:none;transition:opacity .15s;z-index:5}
.mc-nav-btn:hover .mc-nav-tip{opacity:1}
.mc-nav-group{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%}
.mc-nav-sep{width:26px;height:1px;background:rgba(255,255,255,0.08);margin:5px 0}
.mc-nav-btn.locked{opacity:0.4;cursor:not-allowed}
.mc-nav-btn.locked:hover{background:transparent;color:${C.text3}}
.mc-nav-badge{position:absolute;top:4px;right:5px;min-width:15px;height:15px;padding:0 3px;border-radius:99px;background:${C.red};color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid ${C.bg}}
.mc-nav-lock{position:absolute;top:6px;right:7px;color:${C.text3};display:flex}
.mc-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${C.blue},${C.green});display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff}

.mc-main{padding:26px 30px 50px;max-width:1240px;margin:0 auto;width:100%}
.mc-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:26px}
.mc-eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:${C.blueLt};font-weight:700;margin-bottom:8px}
.mc-title{font-size:28px;font-weight:800;letter-spacing:-.025em;line-height:1.1;margin-bottom:6px}
.mc-rate{font-size:13px;color:${C.text3}}
.mc-top-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.mc-seg{display:flex;border:1px solid ${C.line2};border-radius:9px;overflow:hidden;background:rgba(255,255,255,0.02)}
.mc-seg button{padding:8px 14px;font-size:12px;font-weight:600;border:none;background:transparent;color:${C.text2};cursor:pointer}
.mc-seg button.on{background:var(--blue,${C.blue});color:#fff}
.mc-searchbox{display:flex;align-items:center;gap:8px;padding:9px 13px;border:1px solid ${C.line2};border-radius:10px;background:rgba(255,255,255,0.02);color:${C.text3}}
.mc-searchbox input{border:none;background:none;outline:none;color:${C.text};font-size:13px;width:170px;font-family:inherit}
.mc-icon-btn{position:relative;width:40px;height:40px;border-radius:10px;border:1px solid ${C.line2};background:rgba(255,255,255,0.02);color:${C.text2};display:flex;align-items:center;justify-content:center;cursor:pointer}
.mc-icon-btn .mc-dot{position:absolute;top:9px;right:10px;width:7px;height:7px;border-radius:50%;background:${C.red};border:2px solid ${C.bg}}
.mc-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border:none;border-radius:10px;background:linear-gradient(135deg,${C.blue},${C.blueLt});color:#fff;font-weight:600;font-size:13px;cursor:pointer;box-shadow:0 8px 22px rgba(45,111,255,0.3)}

/* 5 stats */
.mc-stats5{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}
.mc-stat{padding:16px 18px}
.mc-stat-label{font-size:11px;color:${C.text3};text-transform:uppercase;letter-spacing:.12em;font-weight:600;margin-bottom:12px}
.mc-stat-val{font-weight:800;letter-spacing:-.015em;font-family:ui-monospace,monospace}

/* firm cards */
.mc-firms{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;margin-bottom:24px}
.mc-firm{padding:18px;transition:transform .2s,border-color .2s,box-shadow .2s}
.mc-firm:hover{transform:translateY(-2px);border-color:${C.blueSoft};box-shadow:0 14px 34px rgba(0,0,0,0.3),0 0 24px rgba(45,111,255,0.08)}
.mc-firm-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px}
.mc-firm-id{display:flex;align-items:center;gap:11px;min-width:0}
.mc-firm-logo{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;flex-shrink:0}
.mc-firm-name{font-size:15px;font-weight:700;letter-spacing:-.005em}
.mc-firm-sub{font-size:11px;color:${C.text3};margin-top:2px}
.mc-firm-net{text-align:right}
.mc-firm-net>div:first-child{font-size:19px;font-weight:800;letter-spacing:-.015em;font-family:ui-monospace,monospace}
.mc-firm-roi{font-size:11px;color:${C.text3};margin-top:2px}
.mc-firm-mini{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.mc-mini{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:10px 8px;text-align:center}
.mc-mini-l{font-size:10px;color:${C.text3};text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin-bottom:4px}
.mc-mini-v{font-size:14px;font-weight:700;font-family:ui-monospace,monospace}
.mc-firm-accts{display:flex;flex-direction:column}
.mc-acct{display:flex;align-items:center;gap:7px;padding:7px 0;border-bottom:1px solid ${C.line};font-size:12px}
.mc-acct-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.mc-acct-name{color:${C.text2};font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1}
.mc-acct-badge{font-size:9px;padding:1px 7px;border-radius:99px;font-weight:600;flex-shrink:0}
.mc-acct-net{font-weight:700;font-family:ui-monospace,monospace;flex-shrink:0}
.mc-firm-foot{display:flex;gap:6px;margin-top:11px;flex-wrap:wrap;align-items:center}
.mc-tag{font-size:10px;padding:3px 9px;border-radius:99px;font-weight:600}
.mc-diploma{margin-left:auto;font-size:11px;padding:4px 10px;border-radius:99px;background:${C.blueSoft};border:1px solid rgba(45,111,255,0.3);color:${C.blueLt};cursor:pointer;font-weight:600}

/* calendar */
.mc-section-title{font-size:16px;font-weight:700}
.mc-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap}
.mc-cal-nav{display:flex;align-items:center;gap:8px}
.mc-ghost{padding:7px 12px;font-size:13px;border-radius:8px;border:1px solid ${C.line2};background:rgba(255,255,255,0.03);color:${C.text2};cursor:pointer}
.mc-cal-month{font-weight:700;min-width:130px;text-align:center}
.mc-cal-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.mc-cal-stat{padding:12px 16px}
.mc-cal-stat-v{font-size:16px;font-weight:700;font-family:ui-monospace,monospace;margin-top:4px}
.mc-cal-grid{display:grid;grid-template-columns:1fr 320px;gap:18px;align-items:start;margin-bottom:24px}
.mc-cal-table{overflow:hidden;padding:0}
.mc-cal-dow{display:grid;grid-template-columns:repeat(7,1fr);background:${C.surface2};border-bottom:1px solid ${C.line}}
.mc-cal-dow div{padding:11px 0;text-align:center;font-size:11px;font-weight:600;color:${C.text3};text-transform:uppercase;letter-spacing:.5px}
.mc-cal-cells{display:grid;grid-template-columns:repeat(7,1fr)}
.mc-cell{min-height:104px;padding:9px;border-right:1px solid ${C.line};border-bottom:1px solid ${C.line};transition:background .12s}
.mc-cell:nth-child(7n){border-right:none}
.mc-cell:hover{background:rgba(255,255,255,0.02)}
.mc-cell-num{font-size:13px;font-weight:600;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:50%;margin-bottom:5px}
.mc-cell-amt{font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;margin-bottom:3px;display:inline-block;font-family:ui-monospace,monospace}
.mc-cal-aside{display:flex;flex-direction:column;gap:12px}
.mc-cal-aside .mc-card{padding:16px}
.mc-aside-title{font-size:13px;font-weight:600;margin-bottom:12px;text-transform:capitalize}
.mc-aside-eyebrow{font-size:11px;font-weight:700;color:${C.text3};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.mc-day-evt{padding:10px 12px;background:${C.surface2};border-radius:9px;margin-bottom:8px}
.mc-day-evt-top{display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px;font-weight:600}
.mc-day-evt-badge{font-size:10px;padding:2px 8px;border-radius:99px;font-weight:600}
.mc-empty{color:${C.text3};font-size:12px}
.mc-recent{display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px solid ${C.line}}
.mc-recent-dot{width:6px;height:6px;border-radius:50%;margin-top:5px;flex-shrink:0}
.mc-recent-mid{flex:1;min-width:0}
.mc-recent-firm{font-size:12px;font-weight:500}
.mc-recent-meta{font-size:10px;color:${C.text3}}
.mc-recent-amt{font-size:12px;font-weight:700;font-family:ui-monospace,monospace}

/* bottom 3 */
.mc-bottom{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.mc-card-title{font-size:13px;font-weight:600;color:${C.text2};margin-bottom:12px}
.mc-legend{display:flex;gap:14px;margin-bottom:12px}
.mc-legend span{display:flex;align-items:center;gap:5px;font-size:11px;color:${C.text2}}
.mc-legend i{width:10px;height:3px;border-radius:2px}
.mc-bars{display:flex;align-items:flex-end;gap:10px;height:170px;padding-top:10px}
.mc-bar-group{flex:1;display:flex;flex-direction:column;align-items:center;height:100%}
.mc-bar-pair{flex:1;display:flex;align-items:flex-end;gap:4px;width:100%;justify-content:center}
.mc-bar{width:14px;border-radius:4px 4px 0 0;min-height:3px;transition:opacity .2s}
.mc-bar:hover{opacity:.8}
.mc-bar-label{font-size:9px;color:${C.text3};margin-top:8px;font-family:ui-monospace,monospace}
.mc-statlist{display:flex;flex-direction:column}
.mc-statrow{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid ${C.line};font-size:12px;color:${C.text2}}
.mc-rank{display:flex;flex-direction:column}
.mc-rank-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid ${C.line};cursor:pointer}
.mc-rank-logo{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}
.mc-rank-mid{flex:1;min-width:0}
.mc-rank-name{font-size:12px;font-weight:600}
.mc-rank-meta{font-size:10px;color:${C.text3}}
.mc-rank-net{font-size:13px;font-weight:700;font-family:ui-monospace,monospace}

.mc-foot{margin-top:30px;font-size:12px;color:${C.text3}}
.mc-foot a{color:${C.blueLt}}

@media(max-width:1100px){
  .mc-stats5{grid-template-columns:repeat(2,1fr)}
  .mc-cal-grid{grid-template-columns:1fr}
  .mc-bottom{grid-template-columns:1fr}
}
@media(max-width:680px){
  .mc-shell{grid-template-columns:58px 1fr}
  .mc-firms{grid-template-columns:1fr}
  .mc-stats5{grid-template-columns:1fr}
  .mc-cal-stats{grid-template-columns:1fr}
  .mc-main{padding:18px 14px 32px}
  .mc-searchbox{display:none}
}
`
