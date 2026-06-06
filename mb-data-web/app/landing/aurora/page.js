'use client'
// Landing concept #1 — "Aurora"
// Premium light-mode fintech aesthetic (Stripe / Linear quality).
// Ivory background, soft aurora violet→teal gradients, floating dashboard
// preview, airy whitespace. Fully self-contained (no i18n / AppContext deps)
// so it can't affect the rest of the app. Quantara logo (QLogoIcon SVG) reused.

import Link from 'next/link'
import { useState } from 'react'
import QLogoIcon from '../../../components/QLogoIcon'

const A = {
  bg:      '#f6f4ef',
  bg2:     '#faf8f4',
  card:    '#ffffff',
  ink:     '#15131c',
  ink2:    '#4a4658',
  ink3:    '#8b8798',
  line:    'rgba(21,19,28,0.08)',
  violet:  '#7c5cff',
  teal:    '#15b8a6',
  grad:    'linear-gradient(115deg, #7c5cff 0%, #4f7dff 45%, #15b8a6 100%)',
  green:   '#0fa968',
  red:     '#e3504a',
}

const FIRMS = ['Topstep', 'Apex', 'Bulenox', 'MyFundedFutures', 'Take Profit Trader', 'Tradeify']

const FEATURES = [
  { t: 'Multi-PropFirms', d: 'Topstep, Apex, Bulenox, MFFU… tous tes comptes Challenge, Funded et Live réunis sur un seul écran.', span: 2, accent: A.violet, icon: '🏢' },
  { t: 'Journal de trading', d: 'Chaque trade horodaté, annoté, taggé par setup. Tes patterns gagnants ressortent tout seuls.', span: 1, accent: A.teal, icon: '📔' },
  { t: 'Courbe d\'équité', d: 'Equity curve live par compte et cumulée. Vois ton edge se dessiner jour après jour.', span: 1, accent: A.violet, icon: '📈' },
  { t: 'Payouts & dépenses', d: 'Frais de challenge, resets, abonnements vs payouts encaissés. Ton vrai net, sans illusion.', span: 2, accent: A.teal, icon: '💰' },
]

const STEPS = [
  { n: '01', t: 'Connecte tes firms', d: 'Ajoute tes comptes PropFirm en 30 secondes ou importe ton CSV — Quantara reconnaît la firme automatiquement.' },
  { n: '02', t: 'Trade normalement', d: 'Continue sur tes plateformes habituelles. Quantara consolide et calcule drawdown, consistance et net réel.' },
  { n: '03', t: 'Décide avec des chiffres', d: 'Sais exactement quel compte payer, lequel reset, et quand demander ton payout. Sans tableur.' },
]

const PRICING = [
  { name: 'Free', price: '0', period: '€/mois', tagline: 'Pour démarrer', feats: ['2 PropFirms', '100 trades / mois', 'Journal + equity curve', 'Calendrier économique'], cta: 'Commencer', hot: false },
  { name: 'Pro', price: '19', period: '€/mois', tagline: 'Le plus choisi', feats: ['PropFirms illimités', 'Trades illimités', 'Drawdown Guardian', 'Sync API + export PDF'], cta: 'Passer Pro', hot: true },
  { name: 'Lifetime', price: '249', period: '€ une fois', tagline: '100 places fondateurs', feats: ['Tout Pro, à vie', 'Badge Founding', 'Accès anticipé features', 'Support prioritaire'], cta: 'Réserver ma place', hot: false },
]

const FAQ = [
  { q: 'Quantara remplace mon tableur Excel ?', a: 'Oui — et il calcule automatiquement ce que ton tableur te fait recopier à la main : drawdown trailing, consistance, net réel après frais et resets.' },
  { q: 'Mes identifiants de trading sont-ils en sécurité ?', a: 'Tu n\'as jamais besoin de partager tes mots de passe de broker. L\'import se fait par CSV ou via des connexions chiffrées. Tes données restent les tiennes.' },
  { q: 'Quelles PropFirms sont supportées ?', a: 'Les 11 principales firmes futures (Topstep, Apex, Bulenox, MyFundedFutures, Take Profit Trader, Tradeify, et plus) avec leurs règles de drawdown et payout pré-chargées.' },
  { q: 'Je peux annuler quand je veux ?', a: 'Oui, sans engagement. Et tous les plans payants ont une garantie satisfait ou remboursé de 30 jours.' },
]

export default function AuroraLanding() {
  const [openFaq, setOpenFaq] = useState(0)
  return (
    <div style={{ background: A.bg, color: A.ink, minHeight: '100vh', overflowX: 'hidden', fontFamily: "-apple-system, 'Segoe UI', system-ui, sans-serif" }}>
      <style>{auroraCss}</style>

      {/* ===== NAV ===== */}
      <header className="au-nav">
        <Link href="/landing" className="au-brand">
          <QLogoIcon size={30} color={A.violet} />
          <span>QUANTARA</span>
        </Link>
        <nav className="au-links">
          <a href="#features">Fonctions</a>
          <a href="#how">Comment ça marche</a>
          <a href="#pricing">Tarifs</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="au-nav-cta">
          <Link href="/app" className="au-btn-ghost">Se connecter</Link>
          <Link href="/auth?mode=signup" className="au-btn-primary">Commencer gratuitement</Link>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="au-hero">
        <div className="au-aurora au-aurora-1" />
        <div className="au-aurora au-aurora-2" />
        <div className="au-hero-inner">
          <div className="au-pill"><span className="au-dot" /> Nouveau · Drawdown Guardian en temps réel</div>
          <h1 className="au-h1">
            Tous tes comptes PropFirm.<br />
            <span className="au-grad-text">Un seul tableau de bord.</span>
          </h1>
          <p className="au-sub">
            Quantara réunit tes challenges, comptes funded, payouts et dépenses en un endroit clair.
            Le journal de trading que les prop traders auraient dû avoir depuis le début.
          </p>
          <div className="au-hero-cta">
            <Link href="/auth?mode=signup" className="au-btn-primary au-lg">Démarrer gratuitement →</Link>
            <Link href="/demo" className="au-btn-ghost au-lg">Voir la démo</Link>
          </div>
          <div className="au-trust">
            <span>Compatible avec</span>
            <div className="au-trust-row">{FIRMS.map(f => <span key={f}>{f}</span>)}</div>
          </div>
        </div>

        {/* Floating dashboard preview */}
        <div className="au-preview">
          <div className="au-preview-card">
            <div className="au-pv-head">
              <div className="au-pv-dots"><i /><i /><i /></div>
              <span className="au-pv-url">quantara.tech/app</span>
            </div>
            <div className="au-pv-body">
              <div className="au-pv-balance">
                <div>
                  <div className="au-pv-label">Net consolidé · 6 comptes</div>
                  <div className="au-pv-big">+48 320 <span>€</span></div>
                  <div className="au-pv-delta">▲ 12,4 % ce mois</div>
                </div>
                <div className="au-pv-stats">
                  <div><b>3</b><span>Funded</span></div>
                  <div><b>2</b><span>Challenge</span></div>
                  <div><b>68%</b><span>Win rate</span></div>
                </div>
              </div>
              <div className="au-pv-chart">
                <EquityCurve />
              </div>
              <div className="au-pv-rows">
                <Row firm="Topstep 150K" pnl="+2 140 €" up dd="82%" />
                <Row firm="Apex 100K" pnl="+1 050 €" up dd="74%" />
                <Row firm="Bulenox 50K" pnl="-320 €" dd="61%" />
              </div>
            </div>
          </div>
          <div className="au-float-badge au-fb-1">💸 Payout demandé · 3 200 €</div>
          <div className="au-float-badge au-fb-2">🛡️ Drawdown OK · 82%</div>
        </div>
      </section>

      {/* ===== METRICS STRIP ===== */}
      <section className="au-metrics">
        {[['11', 'PropFirms supportées'], ['∞', 'Comptes & trades'], ['3', 'Langues · FR / EN / ES'], ['100%', 'Tes données privées']].map(([v, l]) => (
          <div key={l}><b>{v}</b><span>{l}</span></div>
        ))}
      </section>

      {/* ===== FEATURES (bento) ===== */}
      <section id="features" className="au-section">
        <div className="au-eyebrow">Tout au même endroit</div>
        <h2 className="au-h2">Le copilote de ta carrière prop</h2>
        <p className="au-lead">Arrête de jongler entre 4 dashboards de firms et un tableur qui ment. Quantara consolide, calcule et t'alerte.</p>
        <div className="au-bento">
          {FEATURES.map((f) => (
            <div key={f.t} className="au-bento-card" style={{ gridColumn: `span ${f.span}` }}>
              <div className="au-bento-icon" style={{ background: `${f.accent}1a`, color: f.accent }}>{f.icon}</div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="au-section au-how">
        <div className="au-eyebrow">3 étapes</div>
        <h2 className="au-h2">Opérationnel en 5 minutes</h2>
        <div className="au-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="au-step">
              <div className="au-step-n">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="au-section">
        <div className="au-eyebrow">Tarifs simples</div>
        <h2 className="au-h2">Commence gratuit. Scale quand tu veux.</h2>
        <div className="au-pricing">
          {PRICING.map((p) => (
            <div key={p.name} className={'au-price-card' + (p.hot ? ' hot' : '')}>
              {p.hot && <div className="au-price-flag">Populaire</div>}
              <div className="au-price-tag">{p.tagline}</div>
              <div className="au-price-name">{p.name}</div>
              <div className="au-price-amt"><b>{p.price}</b><span>{p.period}</span></div>
              <ul>{p.feats.map(f => <li key={f}>✓ {f}</li>)}</ul>
              <Link href="/auth?mode=signup" className={p.hot ? 'au-btn-primary au-full' : 'au-btn-ghost au-full'}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="au-section au-faq">
        <div className="au-eyebrow">Questions fréquentes</div>
        <h2 className="au-h2">Ce que tu te demandes</h2>
        <div className="au-faq-list">
          {FAQ.map((f, i) => (
            <div key={i} className={'au-faq-item' + (openFaq === i ? ' open' : '')} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
              <div className="au-faq-q">{f.q}<span>{openFaq === i ? '−' : '+'}</span></div>
              {openFaq === i && <div className="au-faq-a">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="au-final">
        <div className="au-final-glow" />
        <div className="au-final-inner">
          <h2>Reprends le contrôle de tes comptes prop.</h2>
          <p>Gratuit pour toujours sur l'essentiel. Aucune carte requise.</p>
          <Link href="/auth?mode=signup" className="au-btn-light au-lg">Créer mon tableau de bord →</Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="au-footer">
        <div className="au-brand"><QLogoIcon size={26} color={A.violet} /><span>QUANTARA</span></div>
        <p>© 2026 Quantara Technologies LLC · Albuquerque, NM</p>
        <div className="au-foot-links">
          <Link href="/landing/terminal">Voir concept Terminal</Link>
          <Link href="/landing/ledger">Voir concept Ledger</Link>
        </div>
      </footer>
    </div>
  )
}

function Row({ firm, pnl, up, dd }) {
  return (
    <div className="au-row">
      <span className="au-row-firm">{firm}</span>
      <span className="au-row-dd"><i style={{ width: dd }} />{dd}</span>
      <span className="au-row-pnl" style={{ color: up ? A.green : A.red }}>{pnl}</span>
    </div>
  )
}

function EquityCurve() {
  return (
    <svg viewBox="0 0 420 120" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="auFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="auLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#15b8a6" />
        </linearGradient>
      </defs>
      <path d="M0 95 L40 88 L80 92 L120 70 L160 76 L200 54 L240 60 L280 38 L320 30 L360 22 L420 8 L420 120 L0 120 Z" fill="url(#auFill)" />
      <path d="M0 95 L40 88 L80 92 L120 70 L160 76 L200 54 L240 60 L280 38 L320 30 L360 22 L420 8" fill="none" stroke="url(#auLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const auroraCss = `
.au-nav{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:16px 40px;background:rgba(246,244,239,0.75);backdrop-filter:blur(16px);border-bottom:1px solid ${A.line}}
.au-brand{display:flex;align-items:center;gap:9px;font-weight:800;letter-spacing:.14em;font-size:14px;color:${A.ink}}
.au-links{display:flex;gap:30px}
.au-links a{font-size:13.5px;color:${A.ink2};font-weight:500;transition:color .15s}
.au-links a:hover{color:${A.ink}}
.au-nav-cta{display:flex;gap:10px;align-items:center}
.au-btn-primary{background:${A.grad};color:#fff;padding:10px 18px;border-radius:10px;font-size:13.5px;font-weight:600;box-shadow:0 6px 20px rgba(124,92,255,.28);transition:transform .2s,box-shadow .2s;display:inline-block;border:none}
.au-btn-primary:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(124,92,255,.36)}
.au-btn-ghost{background:#fff;color:${A.ink};padding:10px 18px;border-radius:10px;font-size:13.5px;font-weight:600;border:1px solid ${A.line};transition:all .2s;display:inline-block}
.au-btn-ghost:hover{border-color:rgba(21,19,28,.2);transform:translateY(-1px)}
.au-btn-light{background:#fff;color:${A.ink};padding:13px 26px;border-radius:12px;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 10px 30px rgba(0,0,0,.18);transition:transform .2s}
.au-btn-light:hover{transform:translateY(-2px)}
.au-lg{padding:14px 26px;font-size:15px;border-radius:12px}
.au-full{width:100%;text-align:center;margin-top:18px}

.au-hero{position:relative;padding:70px 40px 40px;text-align:center;overflow:hidden}
.au-aurora{position:absolute;border-radius:50%;filter:blur(90px);opacity:.55;z-index:0;pointer-events:none}
.au-aurora-1{width:620px;height:620px;background:radial-gradient(circle,#7c5cff,transparent 70%);top:-180px;left:-120px}
.au-aurora-2{width:540px;height:540px;background:radial-gradient(circle,#15b8a6,transparent 70%);top:-60px;right:-100px}
.au-hero-inner{position:relative;z-index:2;max-width:860px;margin:0 auto}
.au-pill{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid ${A.line};border-radius:99px;padding:7px 15px;font-size:12.5px;font-weight:600;color:${A.ink2};margin-bottom:26px;box-shadow:0 4px 14px rgba(0,0,0,.05)}
.au-dot{width:7px;height:7px;border-radius:50%;background:${A.teal};box-shadow:0 0 0 3px ${A.teal}33}
.au-h1{font-size:clamp(40px,6.5vw,76px);font-weight:800;letter-spacing:-.035em;line-height:1.02;margin-bottom:22px}
.au-grad-text{background:${A.grad};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.au-sub{font-size:18px;line-height:1.6;color:${A.ink2};max-width:620px;margin:0 auto 32px}
.au-hero-cta{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:40px}
.au-trust{display:flex;flex-direction:column;align-items:center;gap:12px}
.au-trust>span{font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:${A.ink3};font-weight:600}
.au-trust-row{display:flex;gap:26px;flex-wrap:wrap;justify-content:center}
.au-trust-row span{font-size:14px;font-weight:700;color:${A.ink3};opacity:.7}

.au-preview{position:relative;z-index:2;max-width:1000px;margin:50px auto 0}
.au-preview-card{background:rgba(255,255,255,.7);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.9);border-radius:18px;box-shadow:0 40px 80px -20px rgba(60,40,120,.3),0 0 0 1px ${A.line};overflow:hidden}
.au-pv-head{display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid ${A.line};background:rgba(255,255,255,.5)}
.au-pv-dots{display:flex;gap:6px}.au-pv-dots i{width:11px;height:11px;border-radius:50%;background:rgba(21,19,28,.14)}
.au-pv-url{font-size:12px;color:${A.ink3};font-family:ui-monospace,monospace}
.au-pv-body{padding:24px}
.au-pv-balance{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:20px;margin-bottom:18px}
.au-pv-label{font-size:12px;color:${A.ink3};font-weight:600;margin-bottom:6px}
.au-pv-big{font-size:42px;font-weight:800;letter-spacing:-.03em}.au-pv-big span{font-size:24px;color:${A.ink3}}
.au-pv-delta{color:${A.green};font-weight:700;font-size:14px;margin-top:4px}
.au-pv-stats{display:flex;gap:22px}
.au-pv-stats>div{text-align:center}.au-pv-stats b{display:block;font-size:22px;font-weight:800}.au-pv-stats span{font-size:11px;color:${A.ink3}}
.au-pv-chart{height:120px;margin:0 -4px 18px}
.au-pv-rows{display:flex;flex-direction:column;gap:2px}
.au-row{display:grid;grid-template-columns:1.4fr 1fr auto;align-items:center;gap:16px;padding:11px 14px;border-radius:10px;background:rgba(255,255,255,.5);font-size:13.5px}
.au-row-firm{font-weight:600}
.au-row-dd{display:flex;align-items:center;gap:8px;font-size:12px;color:${A.ink3}}
.au-row-dd i{display:block;height:5px;border-radius:3px;background:${A.grad};max-width:60px}
.au-row-pnl{font-weight:700;text-align:right;font-variant-numeric:tabular-nums}
.au-float-badge{position:absolute;background:#fff;border:1px solid ${A.line};border-radius:12px;padding:11px 16px;font-size:13px;font-weight:700;box-shadow:0 14px 34px rgba(60,40,120,.18);animation:auFloat 4s ease-in-out infinite}
.au-fb-1{top:90px;left:-26px}
.au-fb-2{bottom:60px;right:-20px;animation-delay:1.5s}
@keyframes auFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}

.au-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;max-width:1000px;margin:90px auto 30px;padding:0 40px;text-align:center}
.au-metrics b{display:block;font-size:40px;font-weight:800;background:${A.grad};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.03em}
.au-metrics span{font-size:13px;color:${A.ink2};font-weight:500}

.au-section{max-width:1100px;margin:0 auto;padding:90px 40px;text-align:center}
.au-eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.16em;font-weight:700;color:${A.violet};margin-bottom:14px}
.au-h2{font-size:clamp(30px,4.5vw,46px);font-weight:800;letter-spacing:-.03em;margin-bottom:16px}
.au-lead{font-size:17px;color:${A.ink2};max-width:600px;margin:0 auto 50px;line-height:1.6}
.au-bento{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;text-align:left}
.au-bento-card{background:${A.card};border:1px solid ${A.line};border-radius:18px;padding:30px;transition:transform .25s,box-shadow .25s}
.au-bento-card:hover{transform:translateY(-4px);box-shadow:0 24px 50px -20px rgba(60,40,120,.22)}
.au-bento-icon{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:18px}
.au-bento-card h3{font-size:20px;font-weight:700;margin-bottom:9px}
.au-bento-card p{font-size:14.5px;color:${A.ink2};line-height:1.6}

.au-how{background:${A.bg2};border-radius:28px;border:1px solid ${A.line}}
.au-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;text-align:left;margin-top:20px}
.au-step{position:relative}
.au-step-n{font-size:48px;font-weight:800;background:${A.grad};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.04em;margin-bottom:8px}
.au-step h3{font-size:20px;font-weight:700;margin-bottom:8px}
.au-step p{font-size:14.5px;color:${A.ink2};line-height:1.6}

.au-pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;text-align:left}
.au-price-card{position:relative;background:${A.card};border:1px solid ${A.line};border-radius:20px;padding:32px;transition:transform .25s}
.au-price-card.hot{border:2px solid transparent;background:linear-gradient(${A.card},${A.card}) padding-box,${A.grad} border-box;box-shadow:0 30px 60px -24px rgba(124,92,255,.35);transform:scale(1.03)}
.au-price-flag{position:absolute;top:-12px;right:24px;background:${A.grad};color:#fff;font-size:11px;font-weight:700;padding:5px 12px;border-radius:99px}
.au-price-tag{font-size:12px;color:${A.violet};font-weight:600;margin-bottom:6px}
.au-price-name{font-size:22px;font-weight:800;margin-bottom:10px}
.au-price-amt{margin-bottom:20px}.au-price-amt b{font-size:46px;font-weight:800;letter-spacing:-.03em}.au-price-amt span{font-size:14px;color:${A.ink3};margin-left:4px}
.au-price-card ul{list-style:none}.au-price-card li{font-size:14px;color:${A.ink2};padding:7px 0;border-bottom:1px solid ${A.line}}

.au-faq{max-width:760px}
.au-faq-list{text-align:left;margin-top:10px}
.au-faq-item{border:1px solid ${A.line};border-radius:14px;padding:18px 22px;margin-bottom:12px;background:${A.card};cursor:pointer;transition:border-color .2s}
.au-faq-item.open{border-color:${A.violet}55}
.au-faq-q{display:flex;justify-content:space-between;align-items:center;font-size:16px;font-weight:600}
.au-faq-q span{font-size:22px;color:${A.violet};font-weight:400}
.au-faq-a{font-size:14.5px;color:${A.ink2};line-height:1.65;margin-top:12px}

.au-final{position:relative;margin:40px 40px 0;border-radius:32px;background:${A.grad};padding:90px 40px;text-align:center;overflow:hidden}
.au-final-glow{position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.3),transparent 50%)}
.au-final-inner{position:relative;z-index:2}
.au-final h2{font-size:clamp(30px,4.5vw,48px);font-weight:800;color:#fff;letter-spacing:-.03em;margin-bottom:14px}
.au-final p{font-size:17px;color:rgba(255,255,255,.85);margin-bottom:30px}

.au-footer{display:flex;flex-direction:column;align-items:center;gap:14px;padding:60px 40px;text-align:center}
.au-footer p{font-size:13px;color:${A.ink3}}
.au-foot-links{display:flex;gap:20px}
.au-foot-links a{font-size:13px;color:${A.violet};font-weight:600}

@media(max-width:880px){
  .au-links,.au-nav-cta .au-btn-ghost{display:none}
  .au-bento,.au-pricing,.au-steps,.au-metrics{grid-template-columns:1fr}
  .au-bento-card{grid-column:span 1!important}
  .au-price-card.hot{transform:none}
  .au-float-badge{display:none}
  .au-nav{padding:14px 20px}
  .au-hero,.au-section{padding-left:20px;padding-right:20px}
}
`
