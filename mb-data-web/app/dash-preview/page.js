'use client'
// Dashboard redesign MOCKUP — "Mission Control"
// Standalone preview at /dash-preview. Mock data only, no Supabase / AppContext
// / i18n deps, so it renders on the preview build without env. Does NOT touch the
// real dashboard (app/app/(main)/dashboard/page.js).
// Direction: premium dark glassmorphism command-center, Quantara blue + green.

import Link from 'next/link'
import { useState } from 'react'
import QLogoIcon from '../../components/QLogoIcon'

const C = {
  bg: '#080a0f', bg2: '#0c0f16',
  glass: 'rgba(22,26,37,0.55)', glass2: 'rgba(30,35,50,0.6)',
  line: 'rgba(255,255,255,0.07)', line2: 'rgba(255,255,255,0.12)',
  text: '#f0ede8', text2: '#9aa3bd', text3: '#646e87',
  blue: '#2d6fff', blueLt: '#4d8fff', blueSoft: 'rgba(45,111,255,0.12)',
  green: '#19c37d', greenSoft: 'rgba(25,195,125,0.13)',
  red: '#ef5350', redSoft: 'rgba(239,83,80,0.13)',
  amber: '#f5b651', amberSoft: 'rgba(245,182,81,0.13)',
}

const I = (paths, extra) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths.map((d, i) => <path key={i} d={d} />)}{extra}
  </svg>
)
const ICON = {
  grid: I(['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z']),
  trades: I(['M3 17l6-6 4 4 8-8', 'M21 7v6', 'M15 7h6']),
  journal: I(['M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z', 'M8 7h8', 'M8 11h6']),
  calendar: I(['M3 5h18v16H3z', 'M3 9h18', 'M8 3v4', 'M16 3v4']),
  health: I(['M3 12h4l2 6 4-14 2 8h6']),
  shield: I(['M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z']),
  users: I(['M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1', 'M22 19v-1a4 4 0 0 0-3-3.9'], <><circle cx="9" cy="8" r="4" /><circle cx="17.5" cy="8" r="3" /></>),
  settings: I(['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7.6 1.6 1.6 0 0 0-1 1.5V22a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1A2 2 0 1 1 3.6 18l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H2a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 6 3.6l.1.1a1.6 1.6 0 0 0 1.8.3H8a1.6 1.6 0 0 0 1-1.5V2a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 20.4 6l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H22a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z']),
  wallet: I(['M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M16 13h.01', 'M3 9h18']),
  bell: I(['M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0']),
  search: I(['m21 21-4.3-4.3'], <circle cx="11" cy="11" r="7" />),
  plus: I(['M12 5v14', 'M5 12h14']),
  arrowUp: I(['M12 19V5', 'M5 12l7-7 7 7']),
  arrowDn: I(['M12 5v14', 'M5 12l7 7 7-7']),
}

const NAV = [
  { k: 'grid', label: 'Vue d’ensemble', active: true },
  { k: 'trades', label: 'Mes trades' },
  { k: 'journal', label: 'Journal' },
  { k: 'calendar', label: 'Calendrier' },
  { k: 'health', label: 'Health Center' },
  { k: 'users', label: 'Communauté' },
  { k: 'settings', label: 'Réglages' },
]

const KPIS = [
  { label: 'Net consolidé', value: '+48 320 €', delta: '+12,4%', up: true, spark: [12, 14, 13, 18, 17, 22, 25, 24, 30, 34, 40, 48], color: C.green },
  { label: 'Comptes funded', value: '3 / 5', delta: '2 en challenge', up: true, spark: [1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3], color: C.blueLt },
  { label: 'Santé drawdown', value: '82%', delta: 'marge OK', up: true, gauge: 82, color: C.green },
  { label: 'Payouts encaissés', value: '11 400 €', delta: '+3 200 € ce mois', up: true, spark: [2, 3, 3, 5, 6, 6, 8, 8, 9, 10, 11, 11], color: C.green },
  { label: 'Win rate', value: '68,4%', delta: '+6,2 pts', up: true, spark: [55, 58, 57, 60, 62, 61, 64, 63, 66, 67, 68, 68], color: C.blueLt },
]

const FIRMS = [
  { name: 'Topstep', tag: '150K · Funded', dd: 82, roi: '+14,2%', pnl: '+2 140 €', up: true, accts: 2, spark: [10, 12, 11, 15, 14, 18, 22, 24, 28, 32], color: '#e8b34a' },
  { name: 'Apex', tag: '100K · Funded', dd: 74, roi: '+9,8%', pnl: '+1 050 €', up: true, accts: 2, spark: [8, 9, 11, 10, 13, 14, 16, 15, 19, 21], color: '#5b8def' },
  { name: 'Bulenox', tag: '50K · Challenge', dd: 61, roi: '-2,1%', pnl: '-320 €', up: false, accts: 1, spark: [12, 11, 13, 10, 9, 11, 8, 9, 7, 6], color: '#27c2a0' },
  { name: 'MyFundedFutures', tag: '100K · Éligible', dd: 91, roi: '+18,6%', pnl: '+880 €', up: true, accts: 1, spark: [6, 8, 9, 12, 14, 16, 18, 22, 26, 29], color: '#a06bff' },
]

const PIPELINE = [
  { stage: 'Setup', items: ['Bulenox 50K'], tone: C.text3 },
  { stage: 'Building', items: ['Apex 100K', 'Topstep 150K'], tone: C.amber },
  { stage: 'Éligible', items: ['MFFU 100K'], tone: C.blueLt },
  { stage: 'Reçu', items: ['Topstep · 3 200 €'], tone: C.green },
]

const CAL = [
  { t: '08:30', name: 'US CPI (m/m)', imp: 'high', val: '0,3%', fc: '0,3%' },
  { t: '10:00', name: 'FOMC Minutes', imp: 'high', val: '—', fc: '—' },
  { t: '14:30', name: 'Jobless Claims', imp: 'med', val: '218K', fc: '220K' },
]

const ACT = [
  { type: 'payout', txt: 'Payout reçu · Topstep', amt: '+3 200 €', up: true, t: 'il y a 2h' },
  { type: 'trade', txt: 'Trade fermé · NQ Long', amt: '+1 000 €', up: true, t: 'il y a 5h' },
  { type: 'buy', txt: 'Reset · Bulenox 50K', amt: '-150 €', up: false, t: 'hier' },
  { type: 'trade', txt: 'Trade fermé · GC Long', amt: '-700 €', up: false, t: 'hier' },
]

function Spark({ data, color, w = 120, h = 34 }) {
  const min = Math.min(...data), max = Math.max(...data)
  const rng = max - min || 1
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - ((d - min) / rng) * (h - 4) - 2])
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = line + ` L${w} ${h} L0 ${h} Z`
  const id = 'g' + color.replace(/[^a-z0-9]/gi, '')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Gauge({ value, color }) {
  const r = 26, circ = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 64 64" width="56" height="56">
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)} transform="rotate(-90 32 32)" />
      <text x="32" y="36" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.text} fontFamily="ui-monospace,monospace">{value}</text>
    </svg>
  )
}

const EQUITY = [40, 44, 42, 50, 48, 56, 60, 58, 66, 72, 70, 78, 84, 82, 90, 96, 94, 104, 112, 118]

function EquityChart() {
  const w = 720, h = 220
  const min = Math.min(...EQUITY), max = Math.max(...EQUITY), rng = max - min || 1
  const pts = EQUITY.map((d, i) => [(i / (EQUITY.length - 1)) * w, h - ((d - min) / rng) * (h - 30) - 15])
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = line + ` L${w} ${h} L0 ${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 220 }}>
      <defs>
        <linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity="0.3" /><stop offset="100%" stopColor={C.blue} stopOpacity="0" /></linearGradient>
        <linearGradient id="eqline" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.blueLt} /><stop offset="100%" stopColor={C.green} /></linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(g => <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
      <path d={area} fill="url(#eqfill)" />
      <path d={line} fill="none" stroke="url(#eqline)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill={C.green} />
    </svg>
  )
}

export default function DashPreview() {
  const [tf, setTf] = useState('3M')
  return (
    <div className="mc">
      <style>{css}</style>
      <div className="mc-banner">Maquette de redesign · données fictives · le vrai dashboard n’est pas modifié</div>

      <div className="mc-shell">
        {/* SIDEBAR */}
        <aside className="mc-side">
          <div className="mc-side-logo"><QLogoIcon size={28} color={C.blueLt} /></div>
          <nav className="mc-nav">
            {NAV.map(n => (
              <button key={n.k} className={'mc-nav-btn' + (n.active ? ' active' : '')} title={n.label} aria-label={n.label}>
                {ICON[n.k]}
                <span className="mc-nav-tip">{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="mc-side-foot"><div className="mc-avatar">QT</div></div>
        </aside>

        {/* MAIN */}
        <main className="mc-main">
          {/* TOPBAR */}
          <header className="mc-top">
            <div>
              <div className="mc-eyebrow">Vue d’ensemble</div>
              <h1 className="mc-title">Bonjour, trader 👋</h1>
            </div>
            <div className="mc-top-actions">
              <div className="mc-seg">{['USD', 'EUR'].map((c, i) => <button key={c} className={i === 1 ? 'on' : ''}>{c}</button>)}</div>
              <div className="mc-searchbox">{ICON.search}<input placeholder="Rechercher une firm, un compte…" /></div>
              <button className="mc-icon-btn" aria-label="Notifications">{ICON.bell}<i className="mc-dot" /></button>
              <button className="mc-btn-primary">{ICON.plus}Ajouter une PropFirm</button>
            </div>
          </header>

          {/* KPI ROW */}
          <section className="mc-kpis">
            {KPIS.map(k => (
              <div key={k.label} className="mc-kpi glass">
                <div className="mc-kpi-top">
                  <span className="mc-kpi-label">{k.label}</span>
                  <span className="mc-kpi-delta" style={{ color: k.up ? C.green : C.red }}>{k.up ? ICON.arrowUp : ICON.arrowDn}{k.delta}</span>
                </div>
                <div className="mc-kpi-val">{k.value}</div>
                {k.gauge != null
                  ? <div className="mc-kpi-gauge"><Gauge value={k.gauge} color={k.color} /></div>
                  : <div className="mc-kpi-spark"><Spark data={k.spark} color={k.color} w={150} h={36} /></div>}
              </div>
            ))}
          </section>

          {/* EQUITY + REPARTITION */}
          <section className="mc-row2">
            <div className="mc-card glass mc-equity">
              <div className="mc-card-head">
                <div><div className="mc-card-title">Courbe d’équité</div><div className="mc-card-sub">Net cumulé · tous comptes</div></div>
                <div className="mc-seg sm">{['1M', '3M', '6M', 'YTD', 'Max'].map(x => <button key={x} className={tf === x ? 'on' : ''} onClick={() => setTf(x)}>{x}</button>)}</div>
              </div>
              <EquityChart />
            </div>
            <div className="mc-card glass mc-split">
              <div className="mc-card-title">Répartition par firm</div>
              <div className="mc-split-list">
                {FIRMS.map(f => (
                  <div key={f.name} className="mc-split-row">
                    <span className="mc-split-dot" style={{ background: f.color }} />
                    <span className="mc-split-name">{f.name}</span>
                    <div className="mc-split-bar"><i style={{ width: f.dd + '%', background: f.color }} /></div>
                    <span className="mc-split-pnl" style={{ color: f.up ? C.green : C.red }}>{f.pnl}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FIRM CARDS */}
          <section className="mc-firms">
            {FIRMS.map(f => (
              <div key={f.name} className="mc-card glass mc-firm">
                <div className="mc-firm-top">
                  <div className="mc-firm-logo" style={{ background: f.color + '22', color: f.color }}>{f.name[0]}</div>
                  <div className="mc-firm-id"><div className="mc-firm-name">{f.name}</div><div className="mc-firm-tag">{f.tag}</div></div>
                  <div className="mc-firm-dd"><Gauge value={f.dd} color={f.dd > 80 ? C.green : f.dd > 65 ? C.amber : C.red} /></div>
                </div>
                <div className="mc-firm-spark"><Spark data={f.spark} color={f.up ? C.green : C.red} w={240} h={40} /></div>
                <div className="mc-firm-foot">
                  <span className="mc-chip">{f.accts} compte{f.accts > 1 ? 's' : ''}</span>
                  <span className="mc-firm-roi" style={{ color: f.up ? C.green : C.red }}>{f.roi}</span>
                </div>
              </div>
            ))}
          </section>

          {/* PIPELINE + CAL + ACTIVITY */}
          <section className="mc-row3">
            <div className="mc-card glass">
              <div className="mc-card-title">Pipeline payouts</div>
              <div className="mc-pipe">
                {PIPELINE.map(col => (
                  <div key={col.stage} className="mc-pipe-col">
                    <div className="mc-pipe-head" style={{ color: col.tone }}><i style={{ background: col.tone }} />{col.stage}</div>
                    {col.items.map(it => <div key={it} className="mc-pipe-card">{it}</div>)}
                  </div>
                ))}
              </div>
            </div>
            <div className="mc-card glass">
              <div className="mc-card-title">Calendrier éco · aujourd’hui</div>
              <div className="mc-callist">
                {CAL.map(e => (
                  <div key={e.name} className="mc-cal-row">
                    <span className="mc-cal-time">{e.t}</span>
                    <span className={'mc-cal-imp ' + e.imp} />
                    <span className="mc-cal-name">{e.name}</span>
                    <span className="mc-cal-val">{e.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mc-card glass">
              <div className="mc-card-title">Activité récente</div>
              <div className="mc-actlist">
                {ACT.map((a, i) => (
                  <div key={i} className="mc-act-row">
                    <span className="mc-act-ic" style={{ background: a.up ? C.greenSoft : C.redSoft, color: a.up ? C.green : C.red }}>
                      {a.type === 'payout' ? ICON.wallet : a.type === 'buy' ? ICON.shield : ICON.trades}
                    </span>
                    <div className="mc-act-mid"><div className="mc-act-txt">{a.txt}</div><div className="mc-act-t">{a.t}</div></div>
                    <span className="mc-act-amt" style={{ color: a.up ? C.green : C.red }}>{a.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="mc-foot">
            Quantara · maquette « Mission Control » —
            <Link href="/landing"> voir les concepts de landing</Link>
          </footer>
        </main>
      </div>
    </div>
  )
}

const css = `
.mc{--blue:${C.blue};--blueLt:${C.blueLt};--green:${C.green};
  min-height:100vh;background:
   radial-gradient(900px 500px at 80% -5%, rgba(45,111,255,0.10), transparent 60%),
   radial-gradient(700px 500px at 0% 30%, rgba(25,195,125,0.06), transparent 60%),
   ${C.bg};
  color:${C.text};font-family:-apple-system,'Segoe UI',system-ui,sans-serif;font-size:14px}
.mc *{box-sizing:border-box}
.mc-banner{text-align:center;font-size:12px;color:${C.text2};background:rgba(45,111,255,0.08);border-bottom:1px solid ${C.line};padding:8px 16px}
.glass{background:linear-gradient(165deg,${C.glass2},${C.glass});backdrop-filter:blur(18px);border:1px solid ${C.line};border-radius:16px}

.mc-shell{display:grid;grid-template-columns:72px 1fr;min-height:calc(100vh - 33px)}
/* sidebar */
.mc-side{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 0;border-right:1px solid ${C.line};background:rgba(8,10,15,0.6);backdrop-filter:blur(10px);position:sticky;top:0;height:100vh}
.mc-side-logo{margin-bottom:14px}
.mc-nav{display:flex;flex-direction:column;gap:6px;flex:1}
.mc-nav-btn{position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;border:none;background:transparent;color:${C.text3};cursor:pointer;transition:all .18s}
.mc-nav-btn:hover{color:${C.text};background:rgba(255,255,255,0.05)}
.mc-nav-btn.active{color:#fff;background:linear-gradient(135deg,${C.blue},${C.blueLt});box-shadow:0 6px 18px rgba(45,111,255,0.35)}
.mc-nav-tip{position:absolute;left:54px;white-space:nowrap;background:#11151f;border:1px solid ${C.line2};color:${C.text};font-size:12px;padding:5px 10px;border-radius:8px;opacity:0;pointer-events:none;transform:translateX(-4px);transition:all .15s;z-index:5}
.mc-nav-btn:hover .mc-nav-tip{opacity:1;transform:none}
.mc-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${C.blue},${C.green});display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff}

/* main */
.mc-main{padding:26px 30px 40px;max-width:1280px}
.mc-top{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:26px}
.mc-eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:${C.blueLt};font-weight:700;margin-bottom:6px}
.mc-title{font-size:26px;font-weight:800;letter-spacing:-.02em}
.mc-top-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.mc-seg{display:flex;border:1px solid ${C.line2};border-radius:9px;overflow:hidden;background:rgba(255,255,255,0.02)}
.mc-seg button{padding:8px 14px;font-size:12px;font-weight:600;border:none;background:transparent;color:${C.text2};cursor:pointer}
.mc-seg button.on{background:var(--blue);color:#fff}
.mc-seg.sm button{padding:6px 11px;font-size:11.5px}
.mc-searchbox{display:flex;align-items:center;gap:8px;padding:9px 13px;border:1px solid ${C.line2};border-radius:10px;background:rgba(255,255,255,0.02);color:${C.text3}}
.mc-searchbox input{border:none;background:none;outline:none;color:${C.text};font-size:13px;width:200px;font-family:inherit}
.mc-icon-btn{position:relative;width:40px;height:40px;border-radius:10px;border:1px solid ${C.line2};background:rgba(255,255,255,0.02);color:${C.text2};display:flex;align-items:center;justify-content:center;cursor:pointer}
.mc-icon-btn .mc-dot{position:absolute;top:9px;right:10px;width:7px;height:7px;border-radius:50%;background:${C.red};border:2px solid ${C.bg}}
.mc-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border:none;border-radius:10px;background:linear-gradient(135deg,${C.blue},${C.blueLt});color:#fff;font-weight:600;font-size:13px;cursor:pointer;box-shadow:0 8px 22px rgba(45,111,255,0.32)}

/* kpis */
.mc-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:16px}
.mc-kpi{padding:16px 18px}
.mc-kpi-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.mc-kpi-label{font-size:12px;color:${C.text2};font-weight:500}
.mc-kpi-delta{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600}
.mc-kpi-delta svg{width:13px;height:13px}
.mc-kpi-val{font-size:26px;font-weight:800;letter-spacing:-.02em;font-family:ui-monospace,monospace;margin-bottom:10px}
.mc-kpi-spark{height:36px}
.mc-kpi-gauge{display:flex;justify-content:flex-start}

/* row2 */
.mc-row2{display:grid;grid-template-columns:1.7fr 1fr;gap:16px;margin-bottom:16px}
.mc-card{padding:20px}
.mc-card-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;gap:12px}
.mc-card-title{font-size:15px;font-weight:700}
.mc-card-sub{font-size:12px;color:${C.text3};margin-top:3px}
.mc-split-list{display:flex;flex-direction:column;gap:14px;margin-top:6px}
.mc-split-row{display:grid;grid-template-columns:auto 1fr 70px auto;align-items:center;gap:10px}
.mc-split-dot{width:9px;height:9px;border-radius:50%}
.mc-split-name{font-size:13px;font-weight:600}
.mc-split-bar{height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden}
.mc-split-bar i{display:block;height:100%;border-radius:3px}
.mc-split-pnl{font-size:13px;font-weight:700;text-align:right;font-family:ui-monospace,monospace}

/* firm cards */
.mc-firms{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}
.mc-firm{padding:18px}
.mc-firm-top{display:flex;align-items:center;gap:12px;margin-bottom:8px}
.mc-firm-logo{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0}
.mc-firm-id{flex:1;min-width:0}
.mc-firm-name{font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mc-firm-tag{font-size:11.5px;color:${C.text3}}
.mc-firm-dd{flex-shrink:0}
.mc-firm-spark{height:40px;margin:6px 0 12px}
.mc-firm-foot{display:flex;justify-content:space-between;align-items:center}
.mc-chip{font-size:11px;color:${C.text2};background:rgba(255,255,255,0.05);border:1px solid ${C.line};padding:4px 10px;border-radius:99px}
.mc-firm-roi{font-size:15px;font-weight:800;font-family:ui-monospace,monospace}

/* row3 */
.mc-row3{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:16px}
.mc-pipe{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:6px}
.mc-pipe-col{display:flex;flex-direction:column;gap:8px}
.mc-pipe-head{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.mc-pipe-head i{width:6px;height:6px;border-radius:50%}
.mc-pipe-card{font-size:12px;padding:10px;border-radius:9px;background:rgba(255,255,255,0.04);border:1px solid ${C.line};color:${C.text2}}
.mc-callist,.mc-actlist{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.mc-cal-row{display:grid;grid-template-columns:auto auto 1fr auto;align-items:center;gap:10px;padding:9px 8px;border-radius:8px}
.mc-cal-row:hover{background:rgba(255,255,255,0.03)}
.mc-cal-time{font-size:12px;font-family:ui-monospace,monospace;color:${C.text2}}
.mc-cal-imp{width:7px;height:7px;border-radius:50%}
.mc-cal-imp.high{background:${C.red}}.mc-cal-imp.med{background:${C.amber}}
.mc-cal-name{font-size:13px}
.mc-cal-val{font-size:12px;font-family:ui-monospace,monospace;color:${C.text2}}
.mc-act-row{display:flex;align-items:center;gap:11px;padding:8px}
.mc-act-ic{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.mc-act-ic svg{width:17px;height:17px}
.mc-act-mid{flex:1;min-width:0}
.mc-act-txt{font-size:13px;font-weight:500}
.mc-act-t{font-size:11px;color:${C.text3}}
.mc-act-amt{font-size:13px;font-weight:700;font-family:ui-monospace,monospace}

.mc-foot{margin-top:30px;font-size:12px;color:${C.text3}}
.mc-foot a{color:${C.blueLt}}

@media(max-width:1180px){
  .mc-kpis{grid-template-columns:repeat(3,1fr)}
  .mc-firms{grid-template-columns:repeat(2,1fr)}
  .mc-row2,.mc-row3{grid-template-columns:1fr}
}
@media(max-width:680px){
  .mc-shell{grid-template-columns:60px 1fr}
  .mc-kpis,.mc-firms{grid-template-columns:1fr}
  .mc-pipe{grid-template-columns:repeat(2,1fr)}
  .mc-main{padding:18px 16px 32px}
  .mc-searchbox{display:none}
}
`
