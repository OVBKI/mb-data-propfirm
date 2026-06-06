'use client'
// Landing concept #3 — "Ledger"
// Warm editorial / brutalist aesthetic. Paper background, oversized type,
// huge tabular numbers, asymmetric grid, electric cobalt + orange accents,
// hard borders. Self-contained. Quantara logo (QLogoIcon SVG) reused (cobalt).

import Link from 'next/link'
import QLogoIcon from '../../../components/QLogoIcon'

const L = {
  paper:  '#ece7dd',
  paper2: '#f3efe7',
  ink:    '#191512',
  ink2:   '#5b554c',
  line:   '#191512',
  cobalt: '#2438ff',
  orange: '#ff4d1c',
  green:  '#0a8f4f',
}

const FIRMS = ['TOPSTEP', 'APEX', 'BULENOX', 'MYFUNDEDFUTURES', 'TAKE PROFIT TRADER', 'TRADEIFY', 'PHIDIAS', 'ALPHA FUTURES']

const BLOCKS = [
  { n: '01', t: 'Toutes tes firms, une seule vue', d: 'Topstep, Apex, Bulenox, MFFU… Challenges, comptes funded et live alignés. Fini les onglets qui se contredisent.', tone: L.cobalt },
  { n: '02', t: 'Un journal qui dit la vérité', d: 'Chaque trade daté, taggé, annoté. Tes setups gagnants et tes fuites apparaissent noir sur blanc.', tone: L.orange },
  { n: '03', t: 'Le net réel, pas le fantasme', d: 'Payouts encaissés moins frais, resets et abonnements. Le seul chiffre qui compte vraiment, calculé pour toi.', tone: L.green },
  { n: '04', t: 'Le drawdown sous surveillance', d: 'Trailing, EOD, intraday — selon la règle exacte de chaque firm. Alerte avant que tu casses un compte.', tone: L.cobalt },
]

export default function LedgerLanding() {
  return (
    <div style={{ background: L.paper, color: L.ink, minHeight: '100vh', overflowX: 'hidden', fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif" }}>
      <style>{ledgerCss}</style>

      {/* ===== NAV ===== */}
      <header className="lg-nav">
        <Link href="/landing" className="lg-brand">
          <QLogoIcon size={30} color={L.cobalt} />
          <span>QUANTARA</span>
        </Link>
        <nav className="lg-links">
          <a href="#what">Fonctions</a>
          <a href="#flow">Méthode</a>
          <a href="#pricing">Tarifs</a>
        </nav>
        <Link href="/auth?mode=signup" className="lg-btn">Commencer →</Link>
      </header>

      {/* ===== HERO ===== */}
      <section className="lg-hero">
        <div className="lg-hero-meta">
          <span>QUANTARA — JOURNAL DE TRADING PROPFIRM</span>
          <span>EST. 2026 · NM, USA</span>
        </div>
        <h1 className="lg-h1">
          Le grand livre<br />de ta carrière<br /><span className="lg-underline">prop trading.</span>
        </h1>
        <div className="lg-hero-grid">
          <p className="lg-hero-lead">
            Comptes, payouts, dépenses, drawdown — Quantara tient les comptes à ta place,
            avec la rigueur d'un livre comptable et la clarté dont tu as besoin pour décider vite.
          </p>
          <div className="lg-hero-fig">
            <span className="lg-fig-label">NET CONSOLIDÉ · 6 COMPTES</span>
            <div className="lg-fig-num">+48 320<span>€</span></div>
            <span className="lg-fig-delta">▲ 12,4 % CE MOIS-CI</span>
          </div>
        </div>
        <div className="lg-hero-cta">
          <Link href="/auth?mode=signup" className="lg-btn lg-btn-lg">Créer mon livre gratuitement</Link>
          <Link href="/demo" className="lg-btn-text">ou voir la démo →</Link>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="lg-marquee">
        <div className="lg-marquee-track">
          {[...Array(2)].map((_, k) => (
            <span key={k}>{FIRMS.map(f => <em key={f}>{f}<i>✦</i></em>)}</span>
          ))}
        </div>
      </div>

      {/* ===== BIG STATS ===== */}
      <section className="lg-stats">
        {[['11', 'PROPFIRMS', 'règles de drawdown & payout pré-chargées'], ['∞', 'COMPTES', 'challenges, funded, live — sans limite'], ['100%', 'PRIVÉ', 'tes données, jamais revendues']].map(([v, k, d]) => (
          <div key={k} className="lg-stat">
            <div className="lg-stat-v">{v}</div>
            <div className="lg-stat-k">{k}</div>
            <div className="lg-stat-d">{d}</div>
          </div>
        ))}
      </section>

      {/* ===== WHAT (editorial blocks) ===== */}
      <section id="what" className="lg-what">
        <div className="lg-sec-head">
          <span className="lg-sec-idx">§ FONCTIONS</span>
          <h2 className="lg-h2">Quatre certitudes,<br />zéro tableur.</h2>
        </div>
        {BLOCKS.map((b) => (
          <div key={b.n} className="lg-block">
            <div className="lg-block-n" style={{ color: b.tone }}>{b.n}</div>
            <h3 className="lg-block-t">{b.t}</h3>
            <p className="lg-block-d">{b.d}</p>
            <div className="lg-block-bar" style={{ background: b.tone }} />
          </div>
        ))}
      </section>

      {/* ===== FLOW ===== */}
      <section id="flow" className="lg-flow">
        <div className="lg-sec-head">
          <span className="lg-sec-idx">§ MÉTHODE</span>
          <h2 className="lg-h2">Trois pas. Cinq minutes.</h2>
        </div>
        <div className="lg-flow-grid">
          {[
            { t: 'Inscris tes comptes', d: 'Saisie en 30 secondes ou import CSV. La firme est reconnue, ses règles chargées.' },
            { t: 'Continue à trader', d: 'Quantara consolide tout en arrière-plan : P&L, drawdown, consistance, dépenses.' },
            { t: 'Lis tes chiffres', d: 'Quel compte payer, lequel reset, quand demander ton payout. Décision claire.' },
          ].map((s, i) => (
            <div key={i} className="lg-flow-item">
              <div className="lg-flow-n">{i + 1}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="lg-pricing-sec">
        <div className="lg-sec-head">
          <span className="lg-sec-idx">§ TARIFS</span>
          <h2 className="lg-h2">Honnête, comme un bilan.</h2>
        </div>
        <div className="lg-pricing">
          {[
            { n: 'FREE', p: '0', u: '€ / mois', f: ['2 PropFirms', '100 trades / mois', 'Journal + equity', 'Calendrier éco'], hot: false },
            { n: 'PRO', p: '19', u: '€ / mois', f: ['PropFirms illimités', 'Trades illimités', 'Drawdown Guardian', 'Sync API + PDF'], hot: true },
            { n: 'LIFETIME', p: '249', u: '€ une fois', f: ['Tout Pro, à vie', 'Badge Founding', 'Early access', '100 places only'], hot: false },
          ].map((p) => (
            <div key={p.n} className={'lg-price' + (p.hot ? ' hot' : '')}>
              <div className="lg-price-n">{p.n}{p.hot && <i>★ POPULAIRE</i>}</div>
              <div className="lg-price-amt">{p.p}<span>{p.u}</span></div>
              <ul>{p.f.map(x => <li key={x}>{x}</li>)}</ul>
              <Link href="/auth?mode=signup" className={'lg-btn lg-full' + (p.hot ? '' : ' lg-btn-out')}>Choisir {p.n}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="lg-final">
        <h2 className="lg-final-h">Ouvre ton<br />grand livre.</h2>
        <p>Gratuit pour toujours sur l'essentiel. Aucune carte bancaire.</p>
        <Link href="/auth?mode=signup" className="lg-btn lg-btn-lg lg-final-btn">Commencer maintenant →</Link>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="lg-footer">
        <div className="lg-foot-top">
          <div className="lg-brand"><QLogoIcon size={26} color={L.cobalt} /><span>QUANTARA</span></div>
          <div className="lg-foot-links">
            <Link href="/landing/aurora">Concept Aurora</Link>
            <Link href="/landing/terminal">Concept Terminal</Link>
          </div>
        </div>
        <div className="lg-foot-bot">© 2026 Quantara Technologies LLC · 1209 Mountain Road PL NE, Albuquerque, NM 87110</div>
      </footer>
    </div>
  )
}

const ledgerCss = `
.lg-nav{display:flex;align-items:center;justify-content:space-between;padding:18px 36px;border-bottom:2px solid ${L.line};position:sticky;top:0;background:${L.paper};z-index:50}
.lg-brand{display:flex;align-items:center;gap:9px;font-weight:900;font-size:15px;letter-spacing:.06em;color:${L.ink}}
.lg-links{display:flex;gap:30px}
.lg-links a{font-size:13px;font-weight:600;color:${L.ink};text-decoration:none;border-bottom:2px solid transparent;padding-bottom:2px;transition:border-color .15s}
.lg-links a:hover{border-color:${L.cobalt}}
.lg-btn{background:${L.ink};color:${L.paper};padding:11px 20px;border-radius:0;font-size:13px;font-weight:700;border:2px solid ${L.ink};transition:all .15s;display:inline-block;letter-spacing:.01em}
.lg-btn:hover{background:${L.cobalt};border-color:${L.cobalt}}
.lg-btn-lg{padding:16px 30px;font-size:16px}
.lg-btn-out{background:transparent;color:${L.ink}}
.lg-btn-out:hover{background:${L.ink};color:${L.paper}}
.lg-btn-text{font-size:14px;font-weight:600;color:${L.ink};border-bottom:2px solid ${L.cobalt};padding-bottom:2px}
.lg-full{display:block;text-align:center;width:100%;margin-top:18px}

.lg-hero{max-width:1200px;margin:0 auto;padding:60px 36px 50px}
.lg-hero-meta{display:flex;justify-content:space-between;font-size:11px;font-weight:700;letter-spacing:.14em;color:${L.ink2};border-bottom:1px solid ${L.line};padding-bottom:14px;margin-bottom:36px}
.lg-h1{font-size:clamp(48px,9vw,118px);font-weight:900;line-height:.92;letter-spacing:-.04em;margin-bottom:44px}
.lg-underline{position:relative;color:${L.cobalt}}
.lg-underline:after{content:'';position:absolute;left:0;right:0;bottom:.06em;height:.09em;background:${L.orange}}
.lg-hero-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:40px;align-items:end;border-top:1px solid ${L.line};padding-top:30px}
.lg-hero-lead{font-size:19px;line-height:1.55;color:${L.ink2};max-width:540px}
.lg-hero-fig{text-align:right}
.lg-fig-label{font-size:11px;font-weight:700;letter-spacing:.1em;color:${L.ink2}}
.lg-fig-num{font-size:clamp(44px,7vw,76px);font-weight:900;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;margin:6px 0}
.lg-fig-num span{font-size:.45em;color:${L.ink2};margin-left:4px}
.lg-fig-delta{font-size:13px;font-weight:800;color:${L.green};letter-spacing:.05em}
.lg-hero-cta{display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-top:40px}

.lg-marquee{border-top:2px solid ${L.line};border-bottom:2px solid ${L.line};background:${L.ink};color:${L.paper};overflow:hidden;padding:14px 0}
.lg-marquee-track{display:flex;white-space:nowrap;width:max-content;animation:lgScroll 30s linear infinite}
.lg-marquee-track em{font-style:normal;font-size:18px;font-weight:800;letter-spacing:.04em;display:inline-flex;align-items:center}
.lg-marquee-track i{font-style:normal;color:${L.orange};margin:0 22px}
@keyframes lgScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

.lg-stats{max-width:1200px;margin:0 auto;padding:80px 36px;display:grid;grid-template-columns:repeat(3,1fr);gap:0}
.lg-stat{padding:0 30px;border-left:1px solid ${L.line}}
.lg-stat:first-child{padding-left:0;border-left:none}
.lg-stat-v{font-size:clamp(56px,9vw,96px);font-weight:900;letter-spacing:-.05em;line-height:1}
.lg-stat-k{font-size:14px;font-weight:800;letter-spacing:.12em;margin:10px 0 8px}
.lg-stat-d{font-size:14px;color:${L.ink2};line-height:1.5}

.lg-sec-head{display:grid;grid-template-columns:auto 1fr;gap:30px;align-items:end;border-bottom:2px solid ${L.line};padding-bottom:24px;margin-bottom:10px}
.lg-sec-idx{font-size:12px;font-weight:800;letter-spacing:.14em;color:${L.cobalt};padding-bottom:6px}
.lg-h2{font-size:clamp(30px,5vw,58px);font-weight:900;letter-spacing:-.03em;line-height:.98;text-align:right}

.lg-what{max-width:1200px;margin:0 auto;padding:40px 36px 80px}
.lg-block{display:grid;grid-template-columns:120px 1fr 1.2fr;gap:30px;align-items:start;padding:38px 0;border-bottom:1px solid ${L.line};position:relative}
.lg-block-n{font-size:54px;font-weight:900;letter-spacing:-.04em;line-height:.8}
.lg-block-t{font-size:clamp(22px,2.6vw,30px);font-weight:800;letter-spacing:-.02em;line-height:1.1}
.lg-block-d{font-size:16px;color:${L.ink2};line-height:1.6}
.lg-block-bar{position:absolute;left:0;bottom:-1px;height:3px;width:0;transition:width .5s cubic-bezier(.16,1,.3,1)}
.lg-block:hover .lg-block-bar{width:100%}

.lg-flow{max-width:1200px;margin:0 auto;padding:40px 36px 90px}
.lg-flow-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:40px}
.lg-flow-item{padding:0 30px;border-left:1px solid ${L.line}}
.lg-flow-item:first-child{padding-left:0;border-left:none}
.lg-flow-n{width:46px;height:46px;border:2px solid ${L.ink};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;margin-bottom:18px}
.lg-flow-item h3{font-size:21px;font-weight:800;margin-bottom:10px;letter-spacing:-.01em}
.lg-flow-item p{font-size:15px;color:${L.ink2};line-height:1.6}

.lg-pricing-sec{max-width:1200px;margin:0 auto;padding:40px 36px 90px}
.lg-pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:40px;border:2px solid ${L.line}}
.lg-price{padding:34px 30px;border-left:2px solid ${L.line}}
.lg-price:first-child{border-left:none}
.lg-price.hot{background:${L.ink};color:${L.paper}}
.lg-price-n{font-size:15px;font-weight:900;letter-spacing:.1em;margin-bottom:18px;display:flex;align-items:center;gap:10px}
.lg-price-n i{font-style:normal;font-size:10px;background:${L.orange};color:#fff;padding:3px 8px;letter-spacing:.06em}
.lg-price-amt{font-size:60px;font-weight:900;letter-spacing:-.04em;line-height:1}
.lg-price-amt span{font-size:14px;font-weight:600;margin-left:8px;letter-spacing:0;opacity:.7}
.lg-price.hot .lg-price-amt span{color:${L.paper}}
.lg-price ul{list-style:none;margin:22px 0 0}
.lg-price li{font-size:14px;padding:9px 0;border-bottom:1px solid ${L.line}}
.lg-price.hot li{border-color:rgba(236,231,221,.18);color:${L.paper}}
.lg-price.hot .lg-btn{background:${L.orange};border-color:${L.orange};color:#fff}
.lg-price.hot .lg-btn:hover{background:${L.paper};border-color:${L.paper};color:${L.ink}}

.lg-final{text-align:center;padding:100px 36px;border-top:2px solid ${L.line};background:${L.paper2}}
.lg-final-h{font-size:clamp(44px,9vw,110px);font-weight:900;letter-spacing:-.04em;line-height:.9;margin-bottom:24px}
.lg-final p{font-size:17px;color:${L.ink2};margin-bottom:34px}
.lg-final-btn{background:${L.cobalt};border-color:${L.cobalt}}
.lg-final-btn:hover{background:${L.orange};border-color:${L.orange}}

.lg-footer{border-top:2px solid ${L.line};padding:36px}
.lg-foot-top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:18px;padding-bottom:24px;border-bottom:1px solid ${L.line}}
.lg-foot-links{display:flex;gap:24px}
.lg-foot-links a{font-size:13px;font-weight:600;color:${L.ink};border-bottom:2px solid ${L.cobalt};padding-bottom:2px}
.lg-foot-bot{font-size:12px;color:${L.ink2};padding-top:18px}

@media(max-width:880px){
  .lg-links{display:none}
  .lg-hero-grid{grid-template-columns:1fr;text-align:left}
  .lg-hero-fig{text-align:left}
  .lg-h2{text-align:left}
  .lg-sec-head{grid-template-columns:1fr;gap:10px}
  .lg-stats,.lg-flow-grid,.lg-pricing{grid-template-columns:1fr}
  .lg-stat,.lg-flow-item{padding:24px 0;border-left:none;border-top:1px solid ${L.line}}
  .lg-stat:first-child,.lg-flow-item:first-child{border-top:none;padding-top:0}
  .lg-block{grid-template-columns:1fr;gap:12px;padding:28px 0}
  .lg-price{border-left:none;border-top:2px solid ${L.line}}
  .lg-price:first-child{border-top:none}
  .lg-nav{padding:14px 20px}
  .lg-hero,.lg-what,.lg-flow,.lg-pricing-sec,.lg-stats{padding-left:20px;padding-right:20px}
}
`
