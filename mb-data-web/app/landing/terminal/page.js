'use client'
// Landing concept #2 — "Terminal"
// Dark pro-trader / Bloomberg-terminal aesthetic. Near-black, grid lines,
// phosphor green + amber, monospace data rows, live-looking ticker.
// Self-contained. Quantara logo (QLogoIcon SVG) reused, tinted phosphor green.

import Link from 'next/link'
import { useState, useEffect } from 'react'
import QLogoIcon from '../../../components/QLogoIcon'

const T = {
  bg:    '#06080a',
  panel: '#0c0f13',
  panel2:'#10141a',
  line:  'rgba(120,255,200,0.10)',
  line2: 'rgba(255,255,255,0.06)',
  text:  '#d6e2dc',
  text2: '#7d8a86',
  green: '#25f4a7',
  amber: '#ffb547',
  red:   '#ff5d52',
  mono:  "'SF Mono','JetBrains Mono',ui-monospace,Menlo,Consolas,monospace",
}

const ACCOUNTS = [
  { id: 'TS-150K-FUND', firm: 'TOPSTEP', pnl: 2140, dd: 82, st: 'FUNDED' },
  { id: 'APX-100K-FUND', firm: 'APEX', pnl: 1050, dd: 74, st: 'FUNDED' },
  { id: 'MFF-100K-EVAL', firm: 'MFFU', pnl: 880, dd: 91, st: 'EVAL' },
  { id: 'BLX-50K-EVAL', firm: 'BULENOX', pnl: -320, dd: 61, st: 'EVAL' },
  { id: 'TPT-50K-FUND', firm: 'TPT', pnl: 1410, dd: 88, st: 'FUNDED' },
]

const MODULES = [
  { k: 'MULTI_FIRM', t: 'Agrégateur multi-firms', d: 'Consolide Topstep, Apex, Bulenox, MFFU, TPT… en un blotter unique. État Eval / Funded / Live par compte.' },
  { k: 'JOURNAL', t: 'Journal horodaté', d: 'Chaque fill loggé, taggé par setup et session. Export CSV/PDF. Tes stats par stratégie en un coup d\'œil.' },
  { k: 'DD_GUARD', t: 'Drawdown Guardian', d: 'Calcul trailing / EOD / intraday par règle de firm. Alerte push quand un compte passe sous le seuil.' },
  { k: 'PNL_NET', t: 'P&L net réel', d: 'Payouts encaissés − frais d\'éval, resets et abonnements. Le chiffre que ton tableur refuse de te donner.' },
  { k: 'CONSISTENCY', t: 'Moniteur de consistance', d: 'Ratio best-day / total vs seuil de la firm. Sache si ton payout est bloqué avant de le demander.' },
  { k: 'ECON_CAL', t: 'Calendrier éco', d: 'CPI, NFP, FOMC en temps réel avec actuals. Évite de trader dans le mur d\'une news high-impact.' },
]

export default function TerminalLanding() {
  const [clock, setClock] = useState('--:--:--')
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('fr-FR', { hour12: false }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  const total = ACCOUNTS.reduce((s, a) => s + a.pnl, 0)

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: '100vh', overflowX: 'hidden', fontFamily: T.mono }}>
      <style>{termCss}</style>
      <div className="tm-grid-bg" />

      {/* ===== NAV ===== */}
      <header className="tm-nav">
        <Link href="/landing" className="tm-brand">
          <QLogoIcon size={26} color={T.green} />
          <span>QUANTARA<i>/term</i></span>
        </Link>
        <nav className="tm-links">
          <a href="#modules">[MODULES]</a>
          <a href="#how">[FLOW]</a>
          <a href="#pricing">[PRICING]</a>
        </nav>
        <div className="tm-nav-right">
          <span className="tm-clock"><i className="tm-live" />LIVE {clock} UTC+1</span>
          <Link href="/auth?mode=signup" className="tm-btn">INIT_SESSION →</Link>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="tm-hero">
        <div className="tm-hero-left">
          <div className="tm-tag">{'// PROP TRADING OPS CONSOLE · v3.1'}</div>
          <h1 className="tm-h1">
            Pilote chaque compte<br />prop comme un <span className="tm-grn">desk pro.</span>
          </h1>
          <p className="tm-sub">
            Quantara consolide tous tes comptes PropFirm — P&L, drawdown, payouts et dépenses —
            dans une console temps réel. Pensé pour les traders qui prennent ça au sérieux.
          </p>
          <div className="tm-cta">
            <Link href="/auth?mode=signup" className="tm-btn tm-btn-lg">$ démarrer --free</Link>
            <Link href="/demo" className="tm-btn tm-ghost tm-btn-lg">$ voir --demo</Link>
          </div>
          <div className="tm-stats">
            <div><b>11</b><span>FIRMS</span></div>
            <div><b className="tm-grn">+5.2K€</b><span>P&L_TODAY</span></div>
            <div><b>∞</b><span>ACCOUNTS</span></div>
            <div><b className="tm-amb">82%</b><span>DD_AVG</span></div>
          </div>
        </div>

        {/* Terminal panel */}
        <div className="tm-panel">
          <div className="tm-panel-head">
            <span className="tm-pd"><i style={{ background: T.red }} /><i style={{ background: T.amber }} /><i style={{ background: T.green }} /></span>
            <span className="tm-panel-title">quantara@desk — blotter --watch</span>
          </div>
          <div className="tm-panel-body">
            <div className="tm-net-row">
              <span>NET_CONSOLIDÉ</span>
              <b className="tm-grn">+{total.toLocaleString('fr-FR')} €</b>
            </div>
            <div className="tm-table-head">
              <span>ACCOUNT</span><span>FIRM</span><span>DD%</span><span>PNL</span>
            </div>
            {ACCOUNTS.map((a) => (
              <div key={a.id} className="tm-trow">
                <span className="tm-acc">{a.id}<i className={'tm-badge ' + (a.st === 'FUNDED' ? 'fund' : 'eval')}>{a.st}</i></span>
                <span className="tm-firm">{a.firm}</span>
                <span className="tm-dd"><i style={{ width: a.dd + '%', background: a.dd > 80 ? T.green : a.dd > 65 ? T.amber : T.red }} />{a.dd}</span>
                <span className="tm-pnl" style={{ color: a.pnl >= 0 ? T.green : T.red }}>{a.pnl >= 0 ? '+' : ''}{a.pnl.toLocaleString('fr-FR')}</span>
              </div>
            ))}
            <div className="tm-cursor">▌ <span className="tm-blink">_</span> drawdown guardian: <span className="tm-grn">ALL_OK</span></div>
          </div>
        </div>
      </section>

      {/* ===== TICKER ===== */}
      <div className="tm-ticker">
        <div className="tm-ticker-track">
          {[...Array(2)].map((_, k) => (
            <span key={k}>
              {['TOPSTEP +2 140€', 'APEX +1 050€', 'PAYOUT_REQ 3 200€', 'BULENOX −320€', 'MFFU EVAL 91%', 'CONSISTENCY 28%', 'TPT +1 410€', 'CPI 12:30 ⚠', 'DD_GUARD OK', 'NFP J+2'].map((x, i) => (
                <em key={i}>{x}<b>•</b></em>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ===== MODULES ===== */}
      <section id="modules" className="tm-section">
        <div className="tm-eyebrow">{'// MODULES_CHARGÉS'}</div>
        <h2 className="tm-h2">Tout ce qu'un prop trader doit monitorer</h2>
        <div className="tm-modules">
          {MODULES.map((m, i) => (
            <div key={m.k} className="tm-mod">
              <div className="tm-mod-head"><span className="tm-mod-idx">{String(i + 1).padStart(2, '0')}</span><span className="tm-mod-k">{m.k}</span></div>
              <h3>{m.t}</h3>
              <p>{m.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FLOW ===== */}
      <section id="how" className="tm-section tm-flow-sec">
        <div className="tm-eyebrow">{'// EXEC_FLOW'}</div>
        <h2 className="tm-h2">3 commandes pour être opérationnel</h2>
        <div className="tm-flow">
          {[
            { c: '$ quantara add --firm', t: 'Branche tes comptes', d: 'Ajout manuel ou import CSV. La firme est détectée automatiquement avec ses règles de drawdown.' },
            { c: '$ quantara sync', t: 'Laisse tourner', d: 'Trade sur tes plateformes habituelles. Quantara agrège fills, calcule DD, consistance et net.' },
            { c: '$ quantara payout --check', t: 'Encaisse au bon moment', d: 'Sache quel compte est éligible et conforme avant de demander ton payout. Zéro mauvaise surprise.' },
          ].map((s, i) => (
            <div key={i} className="tm-flow-step">
              <code className="tm-flow-cmd">{s.c}</code>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="tm-section">
        <div className="tm-eyebrow">{'// LICENSE_TIERS'}</div>
        <h2 className="tm-h2">Pricing, sans bullshit</h2>
        <div className="tm-pricing">
          {[
            { n: 'FREE', p: '0', u: '€/mo', f: ['2 firms', '100 trades/mo', 'journal + equity', 'calendrier éco'], hot: false },
            { n: 'PRO', p: '19', u: '€/mo', f: ['firms illimités', 'trades illimités', 'drawdown guardian', 'sync API + PDF'], hot: true },
            { n: 'LIFETIME', p: '249', u: '€ one-time', f: ['tout PRO à vie', 'badge founding', 'early access', '100 places only'], hot: false },
          ].map((p) => (
            <div key={p.n} className={'tm-price' + (p.hot ? ' hot' : '')}>
              {p.hot && <div className="tm-price-flag">◆ RECOMMENDED</div>}
              <div className="tm-price-n">{p.n}</div>
              <div className="tm-price-amt"><b>{p.p}</b><span>{p.u}</span></div>
              <ul>{p.f.map(x => <li key={x}><i>›</i>{x}</li>)}</ul>
              <Link href="/auth?mode=signup" className={'tm-btn tm-full' + (p.hot ? '' : ' tm-ghost')}>SELECT</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="tm-final">
        <div className="tm-final-box">
          <div className="tm-eyebrow">{'// READY'}</div>
          <h2>Ton desk prop t'attend.</h2>
          <p>$ quantara init — gratuit, sans carte, 5 minutes chrono.</p>
          <Link href="/auth?mode=signup" className="tm-btn tm-btn-lg tm-grn-btn">DÉMARRER MAINTENANT →</Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="tm-footer">
        <div className="tm-brand"><QLogoIcon size={22} color={T.green} /><span>QUANTARA</span></div>
        <span>© 2026 Quantara Technologies LLC · Albuquerque, NM · status: <i className="tm-grn">operational</i></span>
        <div className="tm-foot-links">
          <Link href="/landing/aurora">aurora</Link>
          <Link href="/landing/ledger">ledger</Link>
        </div>
      </footer>
    </div>
  )
}

const termCss = `
.tm-grid-bg{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(${T.line2} 1px,transparent 1px),linear-gradient(90deg,${T.line2} 1px,transparent 1px);background-size:46px 46px;mask-image:radial-gradient(ellipse at 50% 0%,#000 30%,transparent 80%)}
.tm-nav,.tm-hero,.tm-section,.tm-final,.tm-footer,.tm-ticker{position:relative;z-index:2}
.tm-nav{display:flex;align-items:center;justify-content:space-between;padding:14px 32px;border-bottom:1px solid ${T.line};background:rgba(6,8,10,.85);backdrop-filter:blur(10px);position:sticky;top:0}
.tm-brand{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;letter-spacing:.06em;color:${T.text}}
.tm-brand i{color:${T.green};font-style:normal;opacity:.7}
.tm-links{display:flex;gap:22px}
.tm-links a{font-size:12px;color:${T.text2};letter-spacing:.05em;transition:color .15s}
.tm-links a:hover{color:${T.green}}
.tm-nav-right{display:flex;align-items:center;gap:16px}
.tm-clock{font-size:11px;color:${T.text2};display:flex;align-items:center;gap:7px;letter-spacing:.05em}
.tm-live{width:7px;height:7px;border-radius:50%;background:${T.green};box-shadow:0 0 8px ${T.green};animation:tmPulse 1.4s infinite}
@keyframes tmPulse{0%,100%{opacity:1}50%{opacity:.3}}
.tm-btn{background:${T.green};color:#04110b;padding:9px 16px;border-radius:6px;font-size:12px;font-weight:700;letter-spacing:.04em;font-family:${T.mono};transition:filter .2s,transform .2s;display:inline-block;border:1px solid ${T.green}}
.tm-btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
.tm-ghost{background:transparent;color:${T.green};border:1px solid ${T.line}}
.tm-ghost:hover{border-color:${T.green};background:rgba(37,244,167,.06)}
.tm-btn-lg{padding:13px 22px;font-size:13px}
.tm-full{display:block;text-align:center;width:100%;margin-top:16px}
.tm-grn{color:${T.green}}.tm-amb{color:${T.amber}}

.tm-hero{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1240px;margin:0 auto;padding:80px 32px 50px}
.tm-tag{font-size:12px;color:${T.green};letter-spacing:.08em;margin-bottom:20px;opacity:.85}
.tm-h1{font-size:clamp(34px,4.6vw,56px);font-weight:800;line-height:1.05;letter-spacing:-.02em;margin-bottom:22px;font-family:-apple-system,system-ui,sans-serif}
.tm-sub{font-size:16px;line-height:1.6;color:${T.text2};max-width:520px;margin-bottom:30px;font-family:-apple-system,system-ui,sans-serif}
.tm-cta{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:36px}
.tm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;border-top:1px solid ${T.line};padding-top:24px}
.tm-stats b{display:block;font-size:24px;font-weight:800}.tm-stats span{font-size:10px;color:${T.text2};letter-spacing:.1em}

.tm-panel{background:${T.panel};border:1px solid ${T.line};border-radius:10px;overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,.4),0 30px 70px -20px rgba(0,0,0,.8),0 0 60px -30px ${T.green}}
.tm-panel-head{display:flex;align-items:center;gap:12px;padding:11px 15px;background:${T.panel2};border-bottom:1px solid ${T.line}}
.tm-pd{display:flex;gap:6px}.tm-pd i{width:11px;height:11px;border-radius:50%;display:block}
.tm-panel-title{font-size:11.5px;color:${T.text2}}
.tm-panel-body{padding:16px 18px 18px}
.tm-net-row{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:14px;margin-bottom:10px;border-bottom:1px dashed ${T.line}}
.tm-net-row span{font-size:11px;color:${T.text2};letter-spacing:.08em}
.tm-net-row b{font-size:28px;font-weight:800;text-shadow:0 0 16px ${T.green}55}
.tm-table-head{display:grid;grid-template-columns:1.7fr .9fr .9fr .8fr;gap:8px;font-size:10px;color:${T.text2};letter-spacing:.08em;padding:6px 0;border-bottom:1px solid ${T.line2}}
.tm-trow{display:grid;grid-template-columns:1.7fr .9fr .9fr .8fr;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid ${T.line2};font-size:12px}
.tm-acc{display:flex;flex-direction:column;gap:3px;font-size:11.5px}
.tm-badge{font-size:8.5px;padding:1px 5px;border-radius:3px;width:fit-content;font-style:normal;letter-spacing:.05em}
.tm-badge.fund{background:rgba(37,244,167,.14);color:${T.green}}
.tm-badge.eval{background:rgba(255,181,71,.14);color:${T.amber}}
.tm-firm{color:${T.text2};font-size:11px}
.tm-dd{display:flex;align-items:center;gap:6px;font-size:11px;color:${T.text2}}
.tm-dd i{display:block;height:4px;border-radius:2px;max-width:44px;flex-shrink:0}
.tm-pnl{text-align:right;font-weight:700}
.tm-cursor{margin-top:14px;font-size:11.5px;color:${T.text2}}
.tm-blink{animation:tmBlink 1s steps(2) infinite}
@keyframes tmBlink{0%,50%{opacity:1}51%,100%{opacity:0}}

.tm-ticker{border-top:1px solid ${T.line};border-bottom:1px solid ${T.line};background:${T.panel};overflow:hidden;padding:10px 0;margin-top:20px}
.tm-ticker-track{display:flex;white-space:nowrap;animation:tmScroll 32s linear infinite;width:max-content}
.tm-ticker-track em{font-style:normal;font-size:12px;color:${T.text2};margin:0 4px;letter-spacing:.04em}
.tm-ticker-track b{color:${T.green};margin:0 14px}
@keyframes tmScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

.tm-section{max-width:1180px;margin:0 auto;padding:90px 32px}
.tm-eyebrow{font-size:12px;color:${T.green};letter-spacing:.08em;margin-bottom:14px}
.tm-h2{font-size:clamp(26px,3.6vw,40px);font-weight:800;letter-spacing:-.02em;margin-bottom:44px;font-family:-apple-system,system-ui,sans-serif}
.tm-modules{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:${T.line};border:1px solid ${T.line};border-radius:12px;overflow:hidden}
.tm-mod{background:${T.panel};padding:28px 26px;transition:background .2s}
.tm-mod:hover{background:${T.panel2}}
.tm-mod-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.tm-mod-idx{font-size:12px;color:${T.text2}}
.tm-mod-k{font-size:11px;color:${T.green};letter-spacing:.06em;background:rgba(37,244,167,.08);padding:3px 8px;border-radius:4px}
.tm-mod h3{font-size:18px;font-weight:700;margin-bottom:9px;font-family:-apple-system,system-ui,sans-serif}
.tm-mod p{font-size:13.5px;color:${T.text2};line-height:1.6;font-family:-apple-system,system-ui,sans-serif}

.tm-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.tm-flow-step{border:1px solid ${T.line};border-radius:12px;padding:26px;background:${T.panel}}
.tm-flow-cmd{display:block;font-size:12.5px;color:${T.green};background:#04110b;border:1px solid ${T.line};padding:10px 12px;border-radius:6px;margin-bottom:18px}
.tm-flow-step h3{font-size:18px;font-weight:700;margin-bottom:8px;font-family:-apple-system,system-ui,sans-serif}
.tm-flow-step p{font-size:13.5px;color:${T.text2};line-height:1.6;font-family:-apple-system,system-ui,sans-serif}

.tm-pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.tm-price{position:relative;border:1px solid ${T.line};border-radius:12px;padding:30px;background:${T.panel}}
.tm-price.hot{border-color:${T.green};box-shadow:0 0 50px -20px ${T.green}}
.tm-price-flag{position:absolute;top:-11px;left:24px;background:${T.green};color:#04110b;font-size:10px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:.05em}
.tm-price-n{font-size:14px;color:${T.green};letter-spacing:.1em;margin-bottom:14px}
.tm-price-amt{margin-bottom:20px}.tm-price-amt b{font-size:44px;font-weight:800;letter-spacing:-.02em}.tm-price-amt span{font-size:13px;color:${T.text2};margin-left:6px}
.tm-price ul{list-style:none}.tm-price li{font-size:13px;color:${T.text2};padding:7px 0;border-bottom:1px solid ${T.line2};display:flex;gap:8px}
.tm-price li i{color:${T.green};font-style:normal}

.tm-final{padding:90px 32px;text-align:center}
.tm-final-box{max-width:680px;margin:0 auto;border:1px solid ${T.line};border-radius:16px;background:${T.panel};padding:60px 40px;box-shadow:0 0 80px -40px ${T.green}}
.tm-final h2{font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-.02em;margin-bottom:14px;font-family:-apple-system,system-ui,sans-serif}
.tm-final p{font-size:15px;color:${T.text2};margin-bottom:28px}
.tm-grn-btn{box-shadow:0 0 30px -8px ${T.green}}

.tm-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;padding:32px;border-top:1px solid ${T.line};font-size:12px;color:${T.text2}}
.tm-footer .tm-brand{font-size:13px}
.tm-footer i{font-style:normal}
.tm-foot-links{display:flex;gap:16px}
.tm-foot-links a{color:${T.green};opacity:.8}

@media(max-width:880px){
  .tm-hero{grid-template-columns:1fr;padding:50px 20px 30px}
  .tm-links{display:none}
  .tm-modules,.tm-flow,.tm-pricing{grid-template-columns:1fr}
  .tm-section{padding:60px 20px}
  .tm-clock{display:none}
}
`
