'use client'
// components/dashpreview/DashStructure.js
// Shared dashboard MOCKUP structure that mirrors the real dashboard
// (app/app/(main)/dashboard/page.js) box-for-box: collapsible sidebar, header,
// 5 stat cards, firm cards, transactions calendar (+ day detail + recent) and
// the 3 bottom cards (bar chart / statistiques / par firme ranking).
//
// 100% themed via CSS variables + stable class names, so the 3 skin pages
// (glass / terminal / light) only swap a `css` string + root class — same boxes,
// same layout, different design / typography. Mock data only; standalone (no
// Supabase / AppContext / i18n).

import Link from 'next/link'
import { useState } from 'react'
import QLogoIcon from '../QLogoIcon'

// ── SVG icons (Lucide-style) ──
const I = (paths, extra) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths.map((d, i) => <path key={i} d={d} />)}{extra}</svg>
)
const ICON = {
  grid: I(['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z']),
  heart: I(['M12 21s-7-4.3-9.3-8.5C1 9 2.6 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.4 0 5 3.5 3.3 7C19 16.7 12 21 12 21z']),
  pie: I(['M21 12A9 9 0 1 1 11 3v9z'], <path d="M12 3a9 9 0 0 1 9 9h-9z" />),
  calendar: I(['M3 5h18v16H3z', 'M3 9h18', 'M8 3v4', 'M16 3v4']),
  journal: I(['M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z', 'M8 7h8', 'M8 11h6']),
  sync: I(['M3 12a9 9 0 0 1 15-6.7L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-15 6.7L3 16', 'M3 21v-5h5']),
  plug: I(['M9 2v6', 'M15 2v6', 'M7 8h10v3a5 5 0 0 1-10 0z', 'M12 16v6']),
  candles: I(['M7 7v3', 'M7 16v2', 'M17 5v3', 'M17 15v3'], <><rect x="5" y="10" width="4" height="6" rx="1" /><rect x="15" y="8" width="4" height="7" rx="1" /></>),
  heatmap: I([], <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  rules2: I(['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 4h6v3H9z', 'M9 14l2 2 4-4']),
  scale: I(['M12 3v18', 'M5 21h14', 'M4 7l4-4 4 4', 'M2 11a4 4 0 0 0 8 0', 'M14 7l4-4 4 4', 'M14 11a4 4 0 0 0 8 0']),
  bell: I(['M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0']),
  users: I(['M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1', 'M22 19v-1a4 4 0 0 0-3-3.9'], <><circle cx="9" cy="8" r="4" /><circle cx="17.5" cy="8" r="3" /></>),
  settings: I(['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 0 1-4 0 1.6 1.6 0 0 0-2.7-1.1 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 2.6 13a2 2 0 0 1 0-4 1.6 1.6 0 0 0 1.1-2.7 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 9 3.6a2 2 0 0 1 4 0 1.6 1.6 0 0 0 2.7 1.1 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 20.4 11a2 2 0 0 1 0 4z']),
  search: I(['m21 21-4.3-4.3'], <circle cx="11" cy="11" r="7" />),
  plus: I(['M12 5v14', 'M5 12h14']),
}
const LOCK = <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm3 8H9V6a3 3 0 0 1 6 0z" /></svg>

const NAVG = [
  { sec: 'Vue d’ensemble', items: [{ k: 'grid', label: 'Vue d’ensemble', active: true }, { k: 'heart', label: 'Health Center' }, { k: 'pie', label: 'Analytics' }, { k: 'calendar', label: 'Calendrier' }] },
  { sec: 'Mes Trades', items: [{ k: 'journal', label: 'Journal manuel' }, { k: 'sync', label: 'Journal sync' }, { k: 'plug', label: 'Sync API', lock: true }, { k: 'candles', label: 'Mes trades' }, { k: 'heatmap', label: 'Heatmaps' }, { k: 'rules2', label: 'Mes règles' }] },
  { sec: 'PropFirms', items: [{ k: 'scale', label: 'Comparateur' }, { k: 'bell', label: 'Alertes', badge: 3 }] },
  { sec: 'Communauté', items: [{ k: 'users', label: 'Communauté', lock: true }] },
]

const FIRMS = [
  { name: 'Topstep', letter: 'T', color: '#e8b34a', spent: 495, payouts: 6800, payoutCount: 4, spark: [10, 12, 11, 15, 14, 18, 22, 24, 28, 32], accounts: [{ label: 'TS 150K #1', status: 'Financé', net: 2140 }, { label: 'TS 150K #2', status: 'Financé', net: 1200 }] },
  { name: 'Apex', letter: 'A', color: '#5b8def', spent: 870, payouts: 4200, payoutCount: 3, spark: [8, 9, 11, 10, 13, 14, 16, 15, 19, 21], accounts: [{ label: 'APX 100K #1', status: 'Financé', net: 1050 }, { label: 'APX 100K #2', status: 'Challenge', net: -120 }] },
  { name: 'Bulenox', letter: 'B', color: '#27c2a0', spent: 360, payouts: 0, payoutCount: 0, spark: [12, 11, 13, 10, 9, 11, 8, 9, 7, 6], accounts: [{ label: 'BLX 50K', status: 'Challenge', net: -360 }] },
  { name: 'MyFundedFutures', letter: 'M', color: '#a06bff', spent: 165, payouts: 2400, payoutCount: 2, spark: [6, 8, 9, 12, 14, 16, 18, 22, 26, 29], accounts: [{ label: 'MFF 100K', status: 'Financé', net: 2235 }] },
]
const STATUS_TONE = { 'Financé': 't-pos', 'Challenge': 't-acc', 'Échoué': 't-neg' }
const fNet = f => f.payouts - f.spent
const fRoi = f => f.spent > 0 ? (fNet(f) / f.spent) * 100 : 0
const fCounts = f => ({ challenge: f.accounts.filter(a => a.status === 'Challenge').length, funded: f.accounts.filter(a => a.status === 'Financé').length, failed: f.accounts.filter(a => a.status === 'Échoué').length })
const totalSpent = FIRMS.reduce((s, f) => s + f.spent, 0)
const totalPayouts = FIRMS.reduce((s, f) => s + f.payouts, 0)
const totalNet = totalPayouts - totalSpent
const totalPayoutCount = FIRMS.reduce((s, f) => s + f.payoutCount, 0)
const totalAccts = FIRMS.reduce((s, f) => s + f.accounts.length, 0)
const fundedCount = FIRMS.reduce((s, f) => s + fCounts(f).funded, 0)
const eur = (v, d = 0) => v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' €'
const eurNet = (v, d = 0) => (v >= 0 ? '+' : '') + eur(v, d)

const now = new Date(), Y = now.getFullYear(), Mo = now.getMonth()
const SEED = [
  { d: 3, type: 'buy', firm: 'Topstep', amount: 165, label: 'Challenge' }, { d: 5, type: 'buy', firm: 'Apex', amount: 145, label: 'Reset' },
  { d: 8, type: 'pay', firm: 'Apex', amount: 1800 }, { d: 12, type: 'buy', firm: 'Bulenox', amount: 360, label: 'Challenge' },
  { d: 15, type: 'pay', firm: 'Topstep', amount: 3200 }, { d: 22, type: 'pay', firm: 'MyFundedFutures', amount: 2400 },
  { d: 24, type: 'buy', firm: 'MyFundedFutures', amount: 165, label: 'Challenge' },
]
const ds = d => `${Y}-${String(Mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const evtMap = {}
SEED.forEach(e => { const k = ds(e.d); (evtMap[k] = evtMap[k] || []).push(e) })
const msSpent = SEED.filter(e => e.type === 'buy').reduce((s, e) => s + e.amount, 0)
const msPayout = SEED.filter(e => e.type === 'pay').reduce((s, e) => s + e.amount, 0)
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
function buildDays(y, m) {
  const first = new Date(y, m, 1); let sdow = first.getDay(); sdow = sdow === 0 ? 6 : sdow - 1
  const dim = new Date(y, m + 1, 0).getDate(), dipm = new Date(y, m, 0).getDate(), todayStr = new Date().toISOString().slice(0, 10)
  const days = []
  for (let i = sdow - 1; i >= 0; i--) days.push({ day: dipm - i, other: true })
  for (let d = 1; d <= dim; d++) { const s = ds(d); days.push({ day: d, dateStr: s, today: s === todayStr }) }
  const rem = (sdow + dim) % 7 === 0 ? 0 : 7 - (sdow + dim) % 7
  for (let d = 1; d <= rem; d++) days.push({ day: d, other: true })
  return days
}

function Spark({ data, tone = 't-acc', w = 150, h = 36 }) {
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - ((d - min) / rng) * (h - 4) - 2])
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  return (
    <svg className={tone} viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" style={{ display: 'block', width: '100%' }}>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="currentColor" fillOpacity="0.14" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function DashStructure({ rootClass = '', css = '', label = '' }) {
  const [selDay, setSelDay] = useState(ds(15))
  const [navOpen, setNavOpen] = useState(false)
  const days = buildDays(Y, Mo)
  const recent = Object.entries(evtMap).flatMap(([d, evts]) => evts.map(e => ({ ...e, date: d }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const stats = [
    ['Taux de réussite', Math.round(fundedCount / totalAccts * 100) + '%', 't-pos'],
    ['Meilleur payout', eur(3200), 't-pos'],
    ['Coût moyen challenge', eur(Math.round(totalSpent / totalAccts)), ''],
    ['ROI global', (totalNet >= 0 ? '+' : '') + (totalNet / totalSpent * 100).toFixed(0) + '%', 't-pos'],
    ['Comptes actifs', String(totalAccts), ''],
  ]
  const ranking = FIRMS.slice().sort((a, b) => fNet(b) - fNet(a))
  const barMax = Math.max(...FIRMS.flatMap(f => [f.spent, f.payouts]))

  return (
    <div className={'dp ' + rootClass + (navOpen ? ' nav-open' : '')}>
      <style>{css}</style>
      {label && <div className="dp-banner">{label} · données fictives · le vrai dashboard n’est pas modifié</div>}

      <div className="dp-shell">
        {/* SIDEBAR */}
        <aside className="dp-side">
          <div className="dp-side-head">
            <QLogoIcon size={26} color="var(--accent-solid)" />
            <span className="dp-side-word">QUANTARA</span>
            <button className="dp-side-toggle" onClick={() => setNavOpen(o => !o)} aria-label={navOpen ? 'Réduire' : 'Déplier'}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
          <nav className="dp-nav">
            {NAVG.map((g, gi) => (
              <div key={g.sec} className="dp-nav-group">
                <div className="dp-nav-sec">{g.sec}</div>
                {g.items.map(n => (
                  <button key={n.label} className={'dp-nav-btn' + (n.active ? ' active' : '') + (n.lock ? ' locked' : '')} title={n.label} aria-label={n.label}>
                    <span className="dp-nav-ic">{ICON[n.k]}</span>
                    <span className="dp-nav-label">{n.label}</span>
                    {n.badge ? <span className="dp-nav-badge">{n.badge}</span> : null}
                    {n.lock ? <span className="dp-nav-lock">{LOCK}</span> : null}
                  </button>
                ))}
                {gi < NAVG.length - 1 && <div className="dp-nav-sep" />}
              </div>
            ))}
            <div className="dp-nav-sep" />
            <button className="dp-nav-btn" title="Réglages" aria-label="Réglages"><span className="dp-nav-ic">{ICON.settings}</span><span className="dp-nav-label">Réglages</span></button>
          </nav>
          <div className="dp-side-foot"><div className="dp-avatar">QT</div><div className="dp-side-user"><div className="dp-side-name">Alex</div><div className="dp-side-mail">alex@quantara.tech</div></div></div>
        </aside>

        {/* MAIN */}
        <main className="dp-main">
          <header className="dp-top">
            <div>
              <div className="dp-eyebrow">Tableau de bord</div>
              <h1 className="dp-title">Bonjour, Alex</h1>
              <div className="dp-rate">1 USD = 0,92 € · taux du jour</div>
            </div>
            <div className="dp-top-actions">
              <div className="dp-seg">{['USD', 'EUR'].map((c, i) => <button key={c} className={i === 1 ? 'on' : ''}>{c}</button>)}</div>
              <div className="dp-searchbox"><span className="dp-search-ic">{ICON.search}</span><input placeholder="Rechercher une PropFirm…" /></div>
              <button className="dp-icon-btn" aria-label="Notifications">{ICON.bell}<i className="dp-dot" /></button>
              <button className="dp-btn-primary">{ICON.plus}<span>Ajouter une PropFirm</span></button>
            </div>
          </header>

          {/* 5 STATS */}
          <section className="dp-stats5">
            {[
              { label: 'PropFirms', value: `${FIRMS.length} · ${totalAccts} comptes`, small: true },
              { label: 'Total dépensé', value: eur(totalSpent), tone: 't-neg' },
              { label: 'Total payouts', value: eur(totalPayouts), tone: 't-pos' },
              { label: 'Résultat net', value: eurNet(totalNet), tone: 't-pos' },
              { label: 'Payouts', value: String(totalPayoutCount) },
            ].map((k, i) => (
              <div key={i} className="dp-card dp-stat">
                <div className="dp-stat-label">{k.label}</div>
                <div className={'dp-stat-val ' + (k.tone || '')} style={{ fontSize: k.small ? 'var(--stat-sm)' : 'var(--stat-lg)' }}>{k.value}</div>
              </div>
            ))}
          </section>

          {/* FIRM CARDS */}
          <section className="dp-firms">
            {FIRMS.map(f => {
              const net = fNet(f), roi = fRoi(f), cc = fCounts(f), active = f.accounts.filter(a => a.status !== 'Échoué')
              return (
                <div key={f.name} className="dp-card dp-firm">
                  <div className="dp-firm-head">
                    <div className="dp-firm-id"><span className="dp-firm-logo" style={{ '--fc': f.color }}>{f.letter}</span><div><div className="dp-firm-name">{f.name}</div><div className="dp-firm-sub">{f.accounts.length} compte{f.accounts.length > 1 ? 's' : ''} · {f.payoutCount} payout{f.payoutCount > 1 ? 's' : ''}</div></div></div>
                    <div className="dp-firm-net"><div className={net >= 0 ? 't-pos' : 't-neg'}>{eurNet(net)}</div><div className="dp-firm-roi">ROI {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%</div></div>
                  </div>
                  <div className="dp-firm-spark"><Spark data={f.spark} tone={net >= 0 ? 't-pos' : 't-neg'} h={34} /></div>
                  <div className="dp-firm-mini">
                    {[{ l: 'Dépensé', v: eur(f.spent), t: 't-neg' }, { l: 'Payouts', v: eur(f.payouts), t: 't-pos' }, { l: 'Actifs', v: String(cc.funded + cc.challenge), t: '' }].map(s => (
                      <div key={s.l} className="dp-mini"><div className="dp-mini-l">{s.l}</div><div className={'dp-mini-v ' + s.t}>{s.v}</div></div>
                    ))}
                  </div>
                  <div className="dp-firm-accts">
                    {active.slice(0, 3).map(a => (
                      <div key={a.label} className="dp-acct">
                        <span className={'dp-acct-dot ' + STATUS_TONE[a.status]} />
                        <span className="dp-acct-name">{a.label}</span>
                        <span className={'dp-acct-badge ' + STATUS_TONE[a.status]}>{a.status}</span>
                        <span className={'dp-acct-net ' + (a.net >= 0 ? 't-pos' : 't-neg')}>{eurNet(a.net)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="dp-firm-foot">
                    {cc.challenge > 0 && <span className="dp-tag t-acc">{cc.challenge} Challenge</span>}
                    {cc.funded > 0 && <span className="dp-tag t-pos">{cc.funded} Financé{cc.funded > 1 ? 's' : ''}</span>}
                    {cc.failed > 0 && <span className="dp-tag t-neg">{cc.failed} Échoué</span>}
                    <button className="dp-diploma">Diplômes</button>
                  </div>
                </div>
              )
            })}
          </section>

          {/* CALENDAR */}
          <section className="dp-calwrap">
            <div className="dp-cal-head">
              <div className="dp-section-title">Calendrier des transactions</div>
              <div className="dp-cal-nav"><button className="dp-ghost">‹</button><span className="dp-cal-month">{MONTHS[Mo]} {Y}</span><button className="dp-ghost">›</button><button className="dp-ghost">Aujourd’hui</button></div>
            </div>
            <div className="dp-cal-stats">
              {[{ l: 'Achats du mois', v: eur(msSpent), t: 't-neg' }, { l: 'Payouts du mois', v: eur(msPayout), t: 't-pos' }, { l: 'Net du mois', v: eurNet(msPayout - msSpent), t: 't-pos' }].map(s => (
                <div key={s.l} className="dp-card dp-cal-stat"><div className="dp-mini-l">{s.l}</div><div className={'dp-cal-stat-v ' + s.t}>{s.v}</div></div>
              ))}
            </div>
            <div className="dp-cal-grid">
              <div className="dp-card dp-cal-table">
                <div className="dp-cal-dow">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d}>{d}</div>)}</div>
                <div className="dp-cal-cells">
                  {days.map((day, i) => {
                    const evts = day.dateStr ? (evtMap[day.dateStr] || []) : []
                    const buyT = evts.filter(e => e.type === 'buy').reduce((s, e) => s + e.amount, 0)
                    const payT = evts.filter(e => e.type === 'pay').reduce((s, e) => s + e.amount, 0)
                    const sel = day.dateStr === selDay
                    return (
                      <div key={i} className={'dp-cell' + (day.other ? ' other' : '') + (sel ? ' sel' : '')} onClick={() => day.dateStr && setSelDay(day.dateStr)}>
                        <div className={'dp-cell-num' + (day.today ? ' today' : '')}>{day.day}</div>
                        {buyT > 0 && <div className="dp-cell-amt neg">-{eur(buyT)}</div>}
                        {payT > 0 && <div className="dp-cell-amt pos">+{eur(payT)}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="dp-cal-aside">
                <div className="dp-card">
                  <div className="dp-aside-title">{selDay ? new Date(selDay + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sélectionnez un jour'}</div>
                  {selDay && (evtMap[selDay] || []).length > 0 ? (evtMap[selDay] || []).map((e, i) => (
                    <div key={i} className="dp-day-evt">
                      <div className="dp-day-evt-top"><span>{e.firm}</span><span className={'dp-day-evt-badge ' + (e.type === 'buy' ? 'neg' : 'pos')}>{e.label || (e.type === 'buy' ? 'Achat' : 'Payout')}</span></div>
                      <div className={e.type === 'buy' ? 't-neg' : 't-pos'} style={{ fontWeight: 700, fontSize: 13 }}>{e.type === 'buy' ? '-' : '+'}{eur(e.amount)}</div>
                    </div>
                  )) : <div className="dp-empty">Aucune transaction.</div>}
                </div>
                <div className="dp-card">
                  <div className="dp-aside-eyebrow">Transactions récentes</div>
                  {recent.map((e, i) => (
                    <div key={i} className="dp-recent">
                      <span className={'dp-recent-dot ' + (e.type === 'buy' ? 'neg' : 'pos')} />
                      <div className="dp-recent-mid"><div className="dp-recent-firm">{e.firm}</div><div className="dp-recent-meta">{e.date} · {e.type === 'buy' ? 'Achat' : 'Payout'}</div></div>
                      <span className={'dp-recent-amt ' + (e.type === 'buy' ? 't-neg' : 't-pos')}>{e.type === 'buy' ? '-' : '+'}{eur(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3 BOTTOM CARDS */}
          <section className="dp-bottom">
            <div className="dp-card">
              <div className="dp-card-title">Par firme (EUR)</div>
              <div className="dp-legend"><span><i className="neg" />Dépensé</span><span><i className="pos" />Payouts</span></div>
              <div className="dp-bars">
                {FIRMS.map(f => (
                  <div key={f.name} className="dp-bar-group">
                    <div className="dp-bar-pair"><div className="dp-bar neg" style={{ height: (f.spent / barMax * 100) + '%' }} /><div className="dp-bar pos" style={{ height: (f.payouts / barMax * 100) + '%' }} /></div>
                    <div className="dp-bar-label">{f.name.length > 7 ? f.name.slice(0, 7) + '…' : f.name}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="dp-card">
              <div className="dp-card-title">Statistiques</div>
              <div className="dp-statlist">{stats.map(([l, v, tn]) => <div key={l} className="dp-statrow"><span>{l}</span><span className={'dp-statrow-v ' + tn}>{v}</span></div>)}</div>
            </div>
            <div className="dp-card">
              <div className="dp-card-title">Par firme</div>
              <div className="dp-rank">
                {ranking.map(f => { const net = fNet(f); return (
                  <div key={f.name} className="dp-rank-row">
                    <span className="dp-rank-logo" style={{ '--fc': f.color }}>{f.letter}</span>
                    <div className="dp-rank-mid"><div className="dp-rank-name">{f.name}</div><div className="dp-rank-meta">{f.accounts.length} compte{f.accounts.length > 1 ? 's' : ''}</div></div>
                    <span className={'dp-rank-net ' + (net >= 0 ? 't-pos' : 't-neg')}>{eurNet(net)}</span>
                  </div>
                ) })}
              </div>
            </div>
          </section>

          <footer className="dp-foot">Quantara · maquette de redesign — <Link href="/dash-preview">comparer les 3 variantes</Link></footer>
        </main>
      </div>
    </div>
  )
}

// ── BASE layout CSS (theme-agnostic, driven by CSS vars). Skins set the vars + a
// few aesthetic overrides. Class names are stable across all 3 variants. ──
export const BASE_CSS = `
.dp{min-height:100vh;background:var(--bg);color:var(--text);font-family:var(--font);font-size:14px}
.dp *{box-sizing:border-box}
.t-pos{color:var(--pos)}.t-neg{color:var(--neg)}.t-acc{color:var(--accent-solid)}.t-warn{color:var(--warn)}
.dp-banner{text-align:center;font-size:12px;color:var(--text2);background:var(--banner-bg);border-bottom:1px solid var(--line);padding:8px 16px}
.dp-card{background:var(--card);border:var(--card-border);border-radius:var(--radius);box-shadow:var(--card-shadow)}

.dp-shell{display:grid;grid-template-columns:72px 1fr;transition:grid-template-columns .25s ease}
.dp.nav-open .dp-shell{grid-template-columns:228px 1fr}
.dp-side{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 0;border-right:1px solid var(--line);background:var(--side-bg);backdrop-filter:var(--blur);position:sticky;top:0;height:100vh;transition:padding .25s ease}
.dp.nav-open .dp-side{align-items:stretch;padding:18px 12px}
.dp-side-head{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:0 0 14px;margin-bottom:4px;border-bottom:1px solid var(--line)}
.dp.nav-open .dp-side-head{justify-content:flex-start;padding:0 6px 14px}
.dp-side-word{display:none;font-weight:800;letter-spacing:.14em;font-size:14px;flex:1;white-space:nowrap;font-family:var(--disp)}
.dp.nav-open .dp-side-word{display:block}
.dp-side-toggle{width:28px;height:28px;border-radius:8px;border:1px solid var(--line2);background:var(--ghost-bg);color:var(--text2);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .18s}
.dp-side-toggle:hover{color:var(--text);border-color:var(--accent-solid)}
.dp-side-toggle svg{transition:transform .25s ease}
.dp.nav-open .dp-side-toggle svg{transform:rotate(180deg)}
.dp-nav{display:flex;flex-direction:column;gap:6px;flex:1;width:100%}
.dp-nav-group{display:flex;flex-direction:column;align-items:center;gap:3px;width:100%}
.dp.nav-open .dp-nav-group{align-items:stretch}
.dp-nav-sec{display:none;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text3);padding:10px 12px 4px}
.dp.nav-open .dp-nav-sec{display:block}
.dp-nav-sep{width:26px;height:1px;background:var(--line);margin:5px 0}
.dp.nav-open .dp-nav-sep{display:none}
.dp-nav-btn{position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;gap:11px;border-radius:11px;border:none;background:transparent;color:var(--text3);cursor:pointer;transition:all .16s;font-family:inherit}
.dp-nav-btn:hover{color:var(--text);background:var(--hover)}
.dp-nav-btn.active{color:var(--on-accent);background:var(--accent);box-shadow:var(--accent-shadow)}
.dp-nav-btn.active .dp-nav-ic{color:var(--on-accent)}
.dp-nav-btn.locked{opacity:.4;cursor:not-allowed}
.dp-nav-btn.locked:hover{background:transparent;color:var(--text3)}
.dp-nav-ic{width:20px;height:20px;display:flex;flex-shrink:0}
.dp-nav-label{display:none;font-size:13px;font-weight:500;white-space:nowrap}
.dp.nav-open .dp-nav-btn{width:100%;height:40px;justify-content:flex-start;padding:0 12px;border-radius:10px;color:var(--text2)}
.dp.nav-open .dp-nav-btn.active{color:var(--on-accent)}
.dp.nav-open .dp-nav-label{display:inline}
.dp-nav-badge{position:absolute;top:4px;right:5px;min-width:15px;height:15px;padding:0 3px;border-radius:99px;background:var(--neg);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg)}
.dp.nav-open .dp-nav-badge{position:static;margin-left:auto;border:none}
.dp-nav-lock{position:absolute;top:6px;right:7px;color:var(--text3);display:flex}
.dp.nav-open .dp-nav-lock{position:static;margin-left:auto}
.dp-side-foot{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:auto;padding-top:12px;border-top:1px solid var(--line)}
.dp.nav-open .dp-side-foot{justify-content:flex-start;padding:12px 4px 0}
.dp-avatar{width:34px;height:34px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--on-accent);flex-shrink:0}
.dp-side-user{display:none;min-width:0}
.dp.nav-open .dp-side-user{display:block}
.dp-side-name{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dp-side-mail{font-size:10px;color:var(--text3);font-family:var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.dp-main{padding:26px 30px 50px;max-width:1240px;margin:0 auto;width:100%}
.dp-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:26px}
.dp-eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:var(--accent-solid);font-weight:700;margin-bottom:8px}
.dp-title{font-size:var(--h1);font-weight:800;letter-spacing:-.02em;line-height:1.1;margin-bottom:6px;font-family:var(--disp)}
.dp-rate{font-size:13px;color:var(--text3)}
.dp-top-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.dp-seg{display:flex;border:1px solid var(--line2);border-radius:var(--radius-sm);overflow:hidden;background:var(--ghost-bg)}
.dp-seg button{padding:8px 14px;font-size:12px;font-weight:600;border:none;background:transparent;color:var(--text2);cursor:pointer;font-family:var(--mono)}
.dp-seg button.on{background:var(--accent);color:var(--on-accent)}
.dp-searchbox{display:flex;align-items:center;gap:8px;padding:9px 13px;border:1px solid var(--line2);border-radius:var(--radius-sm);background:var(--ghost-bg);color:var(--text3)}
.dp-search-ic{display:flex}.dp-search-ic svg{width:18px;height:18px}
.dp-searchbox input{border:none;background:none;outline:none;color:var(--text);font-size:13px;width:170px;font-family:inherit}
.dp-icon-btn{position:relative;width:40px;height:40px;border-radius:var(--radius-sm);border:1px solid var(--line2);background:var(--ghost-bg);color:var(--text2);display:flex;align-items:center;justify-content:center;cursor:pointer}
.dp-icon-btn .dp-dot{position:absolute;top:9px;right:10px;width:7px;height:7px;border-radius:50%;background:var(--neg);border:2px solid var(--bg)}
.dp-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border:none;border-radius:var(--radius-sm);background:var(--accent);color:var(--on-accent);font-weight:600;font-size:13px;cursor:pointer;box-shadow:var(--accent-shadow);font-family:var(--font)}
.dp-btn-primary svg{width:18px;height:18px}

.dp-stats5{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:22px}
.dp-stat{padding:16px 18px}
.dp-stat-label{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.12em;font-weight:600;margin-bottom:12px}
.dp-stat-val{font-weight:800;letter-spacing:-.015em;font-family:var(--num)}

.dp-firms{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;margin-bottom:22px}
.dp-firm{padding:18px;transition:transform .2s,border-color .2s,box-shadow .2s}
.dp-firm:hover{transform:translateY(-3px);box-shadow:var(--card-hover)}
.dp-firm-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.dp-firm-id{display:flex;align-items:center;gap:11px;min-width:0}
.dp-firm-logo{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;flex-shrink:0;background:color-mix(in srgb,var(--fc) 18%,transparent);color:var(--fc)}
.dp-firm-name{font-size:15px;font-weight:700;font-family:var(--disp)}
.dp-firm-sub{font-size:11px;color:var(--text3);margin-top:2px}
.dp-firm-net{text-align:right}
.dp-firm-net>div:first-child{font-size:19px;font-weight:800;letter-spacing:-.015em;font-family:var(--num)}
.dp-firm-roi{font-size:11px;color:var(--text3);margin-top:2px}
.dp-firm-spark{height:34px;margin:2px 0 12px}
.dp-firm-mini{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:13px}
.dp-mini{background:var(--inset);border:1px solid var(--line);border-radius:8px;padding:9px 8px;text-align:center}
.dp-mini-l{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin-bottom:4px}
.dp-mini-v{font-size:14px;font-weight:700;font-family:var(--num)}
.dp-firm-accts{display:flex;flex-direction:column}
.dp-acct{display:flex;align-items:center;gap:7px;padding:7px 0;border-bottom:1px solid var(--line);font-size:12px}
.dp-acct-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:currentColor}
.dp-acct-name{color:var(--text2);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1}
.dp-acct-badge{font-size:9px;padding:1px 7px;border-radius:99px;font-weight:600;flex-shrink:0;background:color-mix(in srgb,currentColor 16%,transparent)}
.dp-acct-net{font-weight:700;font-family:var(--num);flex-shrink:0}
.dp-firm-foot{display:flex;gap:6px;margin-top:11px;flex-wrap:wrap;align-items:center}
.dp-tag{font-size:10px;padding:3px 9px;border-radius:99px;font-weight:600;background:color-mix(in srgb,currentColor 14%,transparent)}
.dp-diploma{margin-left:auto;font-size:11px;padding:4px 10px;border-radius:99px;background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent-solid);cursor:pointer;font-weight:600;font-family:inherit}

.dp-section-title{font-size:16px;font-weight:700;font-family:var(--disp)}
.dp-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap}
.dp-cal-nav{display:flex;align-items:center;gap:8px}
.dp-ghost{padding:7px 12px;font-size:13px;border-radius:var(--radius-sm);border:1px solid var(--line2);background:var(--ghost-bg);color:var(--text2);cursor:pointer;font-family:inherit}
.dp-cal-month{font-weight:700;min-width:130px;text-align:center}
.dp-cal-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.dp-cal-stat{padding:12px 16px}
.dp-cal-stat-v{font-size:16px;font-weight:700;font-family:var(--num);margin-top:4px}
.dp-cal-grid{display:grid;grid-template-columns:1fr 320px;gap:18px;align-items:start;margin-bottom:22px}
.dp-cal-table{overflow:hidden;padding:0}
.dp-cal-dow{display:grid;grid-template-columns:repeat(7,1fr);background:var(--inset);border-bottom:1px solid var(--line)}
.dp-cal-dow div{padding:11px 0;text-align:center;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px}
.dp-cal-cells{display:grid;grid-template-columns:repeat(7,1fr)}
.dp-cell{min-height:104px;padding:9px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);transition:background .12s;cursor:pointer}
.dp-cell.other{opacity:.3;cursor:default}
.dp-cell:nth-child(7n){border-right:none}
.dp-cell:hover{background:var(--hover)}
.dp-cell.sel{background:var(--accent-soft);outline:2px solid var(--accent-solid);outline-offset:-2px}
.dp-cell-num{font-size:13px;font-weight:600;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:50%;margin-bottom:5px;color:var(--text2)}
.dp-cell-num.today{background:var(--accent);color:var(--on-accent)}
.dp-cell-amt{font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;margin-bottom:3px;display:inline-block;font-family:var(--num)}
.dp-cell-amt.neg{background:color-mix(in srgb,var(--neg) 14%,transparent);color:var(--neg)}
.dp-cell-amt.pos{background:color-mix(in srgb,var(--pos) 14%,transparent);color:var(--pos)}
.dp-cal-aside{display:flex;flex-direction:column;gap:12px}
.dp-cal-aside .dp-card{padding:16px}
.dp-aside-title{font-size:13px;font-weight:600;margin-bottom:12px;text-transform:capitalize}
.dp-aside-eyebrow{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.dp-day-evt{padding:10px 12px;background:var(--inset);border-radius:9px;margin-bottom:8px}
.dp-day-evt-top{display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px;font-weight:600}
.dp-day-evt-badge{font-size:10px;padding:2px 8px;border-radius:99px;font-weight:600}
.dp-day-evt-badge.neg{background:color-mix(in srgb,var(--neg) 14%,transparent);color:var(--neg)}
.dp-day-evt-badge.pos{background:color-mix(in srgb,var(--pos) 14%,transparent);color:var(--pos)}
.dp-empty{color:var(--text3);font-size:12px}
.dp-recent{display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--line)}
.dp-recent-dot{width:6px;height:6px;border-radius:50%;margin-top:5px;flex-shrink:0}
.dp-recent-dot.neg{background:var(--neg)}.dp-recent-dot.pos{background:var(--pos)}
.dp-recent-mid{flex:1;min-width:0}
.dp-recent-firm{font-size:12px;font-weight:500}
.dp-recent-meta{font-size:10px;color:var(--text3)}
.dp-recent-amt{font-size:12px;font-weight:700;font-family:var(--num)}

.dp-bottom{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.dp-bottom .dp-card{padding:18px}
.dp-card-title{font-size:13px;font-weight:600;color:var(--text2);margin-bottom:12px}
.dp-legend{display:flex;gap:14px;margin-bottom:12px}
.dp-legend span{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text2)}
.dp-legend i{width:10px;height:3px;border-radius:2px}
.dp-legend i.neg{background:var(--neg)}.dp-legend i.pos{background:var(--pos)}
.dp-bars{display:flex;align-items:flex-end;gap:10px;height:170px;padding-top:10px}
.dp-bar-group{flex:1;display:flex;flex-direction:column;align-items:center;height:100%}
.dp-bar-pair{flex:1;display:flex;align-items:flex-end;gap:4px;width:100%;justify-content:center}
.dp-bar{width:14px;border-radius:4px 4px 0 0;min-height:3px;transition:opacity .2s}
.dp-bar.neg{background:var(--neg)}.dp-bar.pos{background:var(--pos)}
.dp-bar:hover{opacity:.8}
.dp-bar-label{font-size:9px;color:var(--text3);margin-top:8px;font-family:var(--mono)}
.dp-statlist{display:flex;flex-direction:column}
.dp-statrow{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:12px;color:var(--text2)}
.dp-statrow-v{font-weight:700;font-family:var(--num)}
.dp-rank{display:flex;flex-direction:column}
.dp-rank-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer}
.dp-rank-logo{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;background:color-mix(in srgb,var(--fc) 18%,transparent);color:var(--fc)}
.dp-rank-mid{flex:1;min-width:0}
.dp-rank-name{font-size:12px;font-weight:600}
.dp-rank-meta{font-size:10px;color:var(--text3)}
.dp-rank-net{font-size:13px;font-weight:700;font-family:var(--num)}

.dp-foot{margin-top:30px;font-size:12px;color:var(--text3)}
.dp-foot a{color:var(--accent-solid)}

@media(max-width:1100px){.dp-stats5{grid-template-columns:repeat(2,1fr)}.dp-cal-grid{grid-template-columns:1fr}.dp-bottom{grid-template-columns:1fr}}
@media(max-width:680px){.dp-shell{grid-template-columns:58px 1fr}.dp-firms,.dp-stats5,.dp-cal-stats{grid-template-columns:1fr}.dp-main{padding:18px 14px 32px}.dp-searchbox{display:none}}
`
