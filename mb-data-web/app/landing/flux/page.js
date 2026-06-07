'use client'
// Landing concept #5 — "Flux" — POLISHED bespoke edition.
// 3D model: Magic / 21st.dev "Anomalous Matter" (FluxScene), kept as the hero's
// living centerpiece. Everything else is a hand-crafted "electric lab / data
// terminal" interface: deep glassmorphism, cyan-on-near-black, Bricolage
// Grotesque display + Fira Code data mono + Fira Sans body, SVG icons (no
// emoji), staggered load reveals, crosshair/technical detailing, full a11y
// (focus-visible, AA contrast, reduced-motion).
//
// Design system via ui-ux-pro-max (glassmorphism / fintech-dark / Fira) +
// frontend-design (distinctive type, asymmetry, atmosphere, restraint).

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import QLogoIcon from '../../../components/QLogoIcon'

const FluxScene = dynamic(() => import('../../../components/landing3d/FluxScene'), { ssr: false, loading: () => null })

const C = {
  bg:     '#04060c',
  bg2:    '#070b14',
  glass:  'rgba(13,20,33,0.55)',
  glass2: 'rgba(18,27,43,0.7)',
  line:   'rgba(140,170,210,0.12)',
  line2:  'rgba(140,170,210,0.22)',
  text:   '#eaf1fb',
  text2:  '#a4b4cc',
  text3:  '#6f7f99',
  cyan:   '#22d3ee',
  blue:   '#3b82f6',
  green:  '#34e0a1',
  red:    '#ff5d6c',
}

// — Lucide-style inline SVG icons (24x24, 1.6 stroke) —
const Icon = ({ d, fill }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    {fill}
  </svg>
)
const ICONS = {
  firms:   <Icon d={['M3 21h18', 'M5 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16', 'M13 9h5a1 1 0 0 1 1 1v11']} fill={<><line x1="8" y1="8" x2="8" y2="8.01" /><line x1="8" y1="12" x2="8" y2="12.01" /><line x1="8" y1="16" x2="8" y2="16.01" /></>} />,
  journal: <Icon d={['M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z', 'M8 7h8', 'M8 11h6']} />,
  curve:   <Icon d={['M3 3v18h18', 'M19 9l-5 5-3-3-4 4']} />,
  wallet:  <Icon d={['M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M16 13h.01', 'M3 9h18']} />,
  shield:  <Icon d={['M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z', 'M9.5 12.5l1.8 1.8 3.4-3.6']} />,
  bolt:    <Icon d={['M13 2L4.5 13.5H11l-1 8.5L18.5 10H12z']} />,
}

const FIRMS = ['TOPSTEP', 'APEX', 'BULENOX', 'MYFUNDEDFUTURES', 'TAKE PROFIT TRADER', 'TRADEIFY', 'PHIDIAS', 'ALPHA FUTURES']

const FEATURES = [
  { k: 'firms',   t: 'Multi-PropFirms', d: 'Topstep, Apex, Bulenox, MFFU… tous tes comptes Challenge, Funded et Live agrégés sur un seul écran.' },
  { k: 'journal', t: 'Journal horodaté', d: 'Chaque trade daté, taggé par setup et session. Tes patterns gagnants et tes fuites ressortent seuls.' },
  { k: 'curve',   t: 'Courbe d’équité', d: 'Equity curve live par compte et cumulée. Ton edge se dessine, trade après trade.' },
  { k: 'wallet',  t: 'Payouts & dépenses', d: 'Frais, resets et abonnements vs payouts encaissés. Ton vrai net, sans illusion.' },
  { k: 'shield',  t: 'Drawdown Guardian', d: 'Trailing, EOD, intraday selon la règle exacte de chaque firm. Alerte avant la casse.' },
  { k: 'bolt',    t: 'Consistance', d: 'Ratio best-day / total vs seuil de la firm. Sache si ton payout passe avant de le demander.' },
]

const STEPS = [
  { n: '01', t: 'Connecte tes firms', d: 'Ajout en 30 s ou import CSV — la firme et ses règles de drawdown sont reconnues automatiquement.' },
  { n: '02', t: 'Trade normalement', d: 'Continue sur tes plateformes. Quantara consolide P&L, drawdown, consistance et net réel en continu.' },
  { n: '03', t: 'Décide avec des chiffres', d: 'Quel compte payer, lequel reset, quand demander ton payout. Décision nette, zéro tableur.' },
]

const PRICING = [
  { name: 'Free', price: '0', period: '€ / mois', feats: ['2 PropFirms', '100 trades / mois', 'Journal + equity', 'Calendrier éco'], hot: false },
  { name: 'Pro', price: '19', period: '€ / mois', feats: ['PropFirms illimités', 'Trades illimités', 'Drawdown Guardian', 'Sync API + export PDF'], hot: true },
  { name: 'Lifetime', price: '249', period: '€ une fois', feats: ['Tout Pro, à vie', 'Badge Founding', 'Accès anticipé', '100 places only'], hot: false },
]

const FAQ = [
  { q: 'Quantara remplace mon tableur Excel ?', a: 'Oui — et il calcule automatiquement ce que ton tableur te fait recopier : drawdown trailing, consistance, net réel après frais et resets.' },
  { q: 'Mes identifiants de trading sont-ils en sécurité ?', a: 'Tu ne partages jamais tes mots de passe broker. L’import se fait par CSV ou via connexions chiffrées. Tes données restent les tiennes.' },
  { q: 'Quelles PropFirms sont supportées ?', a: 'Les 11 principales firmes futures avec leurs règles de drawdown et de payout pré-chargées.' },
  { q: 'Je peux annuler quand je veux ?', a: 'Oui, sans engagement. Et tous les plans payants ont une garantie satisfait ou remboursé de 30 jours.' },
]

const BLOTTER = [
  { id: 'TS-150K', firm: 'Topstep', pnl: '+2 140', up: true, dd: 82 },
  { id: 'APX-100K', firm: 'Apex', pnl: '+1 050', up: true, dd: 74 },
  { id: 'BLX-50K', firm: 'Bulenox', pnl: '−320', up: false, dd: 61 },
]

export default function FluxLanding() {
  const [openFaq, setOpenFaq] = useState(0)
  const [clock, setClock] = useState('--:--:--')
  useEffect(() => {
    const t = () => setClock(new Date().toLocaleTimeString('fr-FR', { hour12: false }))
    t(); const id = setInterval(t, 1000); return () => clearInterval(id)
  }, [])

  return (
    <div className="fx">
      <style>{css}</style>

      {/* atmosphere layers */}
      <div className="fx-grid" aria-hidden="true" />
      <div className="fx-grain" aria-hidden="true" />

      {/* side rail (desktop) */}
      <div className="fx-rail" aria-hidden="true">
        <span className="fx-rail-dot" /> LIVE
        <span className="fx-rail-clock">{clock}</span>
        <span className="fx-rail-line" />
        <span className="fx-rail-tag">FLUX / 05</span>
      </div>

      {/* NAV */}
      <header className="fx-nav">
        <Link href="/landing" className="fx-brand" aria-label="Quantara — retour à la galerie">
          <QLogoIcon size={28} color={C.cyan} /><span>QUANTARA</span>
        </Link>
        <nav className="fx-links" aria-label="Navigation principale">
          <a href="#features">Fonctions</a>
          <a href="#how">Méthode</a>
          <a href="#pricing">Tarifs</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="fx-nav-cta">
          <Link href="/app" className="fx-btn fx-ghost">Se connecter</Link>
          <Link href="/auth?mode=signup" className="fx-btn fx-primary">Commencer</Link>
        </div>
      </header>

      {/* HERO */}
      <section className="fx-hero">
        {/* 3D model centerpiece (Magic) */}
        <div className="fx-scene"><FluxScene color={C.cyan} /></div>
        <div className="fx-scene-veil" aria-hidden="true" />

        <div className="fx-hero-content">
          <div className="fx-eyebrow rev" style={{ '--d': '0ms' }}>
            <span className="fx-tick" />MATIÈRE EN FLUX · BOUGE TA SOURIS
          </div>
          <h1 className="fx-h1 rev" style={{ '--d': '80ms' }}>
            Ton edge<br />prend forme.<br /><span className="fx-h1-accent">En temps réel.</span>
          </h1>
          <p className="fx-sub rev" style={{ '--d': '160ms' }}>
            Quantara transforme le chaos de tes comptes PropFirm — P&amp;L, drawdown,
            payouts, dépenses — en une structure claire qui réagit à chacun de tes trades.
          </p>
          <div className="fx-hero-cta rev" style={{ '--d': '240ms' }}>
            <Link href="/auth?mode=signup" className="fx-btn fx-primary fx-lg">
              Démarrer gratuitement
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <Link href="/demo" className="fx-btn fx-ghost fx-lg">Voir la démo</Link>
          </div>
          <div className="fx-trust rev" style={{ '--d': '320ms' }}>
            <span>Compatible avec</span>
            <div>{FIRMS.slice(0, 6).map(f => <em key={f}>{f}</em>)}</div>
          </div>
        </div>

        {/* floating glass blotter overlapping the scene */}
        <div className="fx-blotter rev" style={{ '--d': '420ms' }} role="img" aria-label="Aperçu du blotter : net consolidé +48 320 €, 3 comptes">
          <div className="fx-blotter-head">
            <span className="fx-blotter-title"><span className="fx-tick" />NET CONSOLIDÉ</span>
            <span className="fx-blotter-badge">6 comptes</span>
          </div>
          <div className="fx-blotter-net">+48 320 <i>€</i></div>
          <div className="fx-blotter-delta">▲ 12,4 % ce mois</div>
          <div className="fx-blotter-rows">
            {BLOTTER.map(r => (
              <div key={r.id} className="fx-brow">
                <span className="fx-brow-id">{r.id}<i>{r.firm}</i></span>
                <span className="fx-brow-dd"><b style={{ width: r.dd + '%', background: r.dd > 80 ? C.green : r.dd > 65 ? C.cyan : C.red }} />{r.dd}%</span>
                <span className="fx-brow-pnl" style={{ color: r.up ? C.green : C.red }}>{r.pnl} €</span>
              </div>
            ))}
          </div>
        </div>

        <div className="fx-scroll" aria-hidden="true"><span /></div>
      </section>

      {/* MARQUEE */}
      <div className="fx-marquee" aria-hidden="true">
        <div className="fx-marquee-track">
          {[...Array(2)].map((_, k) => (
            <span key={k}>{FIRMS.map(f => <em key={f}>{f}<i>/</i></em>)}</span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section className="fx-stats">
        {[['11', 'PropFirms supportées'], ['∞', 'Comptes & trades'], ['3', 'Langues · FR/EN/ES'], ['100%', 'Données privées']].map(([v, l], i) => (
          <div key={l} className="fx-stat"><b>{v}</b><span>{l}</span>{i < 3 && <i className="fx-stat-sep" />}</div>
        ))}
      </section>

      {/* FEATURES */}
      <section id="features" className="fx-section">
        <header className="fx-sec-head">
          <div className="fx-eyebrow"><span className="fx-tick" />TOUT AU MÊME ENDROIT</div>
          <h2 className="fx-h2">Le copilote de ta carrière prop</h2>
          <p className="fx-lead">Arrête de jongler entre quatre dashboards de firms et un tableur qui ment. Quantara consolide, calcule et t’alerte.</p>
        </header>
        <div className="fx-features">
          {FEATURES.map((f) => (
            <article key={f.k} className="fx-card">
              <span className="fx-card-ic">{ICONS[f.k]}</span>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
              <span className="fx-card-corner" aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="fx-section">
        <header className="fx-sec-head">
          <div className="fx-eyebrow"><span className="fx-tick" />MÉTHODE</div>
          <h2 className="fx-h2">Opérationnel en 5 minutes</h2>
        </header>
        <div className="fx-steps">
          <span className="fx-steps-line" aria-hidden="true" />
          {STEPS.map((s) => (
            <div key={s.n} className="fx-step">
              <div className="fx-step-n">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="fx-section">
        <header className="fx-sec-head">
          <div className="fx-eyebrow"><span className="fx-tick" />TARIFS SIMPLES</div>
          <h2 className="fx-h2">Commence gratuit. Scale quand tu veux.</h2>
        </header>
        <div className="fx-pricing">
          {PRICING.map((p) => (
            <div key={p.name} className={'fx-price' + (p.hot ? ' hot' : '')}>
              {p.hot && <div className="fx-price-flag">Populaire</div>}
              <div className="fx-price-name">{p.name}</div>
              <div className="fx-price-amt"><b>{p.price}</b><span>{p.period}</span></div>
              <ul>{p.feats.map(x => (
                <li key={x}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={C.green} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>{x}</li>
              ))}</ul>
              <Link href="/auth?mode=signup" className={'fx-btn fx-full ' + (p.hot ? 'fx-primary' : 'fx-ghost')}>Choisir {p.name}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="fx-section fx-faq">
        <header className="fx-sec-head">
          <div className="fx-eyebrow"><span className="fx-tick" />FAQ</div>
          <h2 className="fx-h2">Ce que tu te demandes</h2>
        </header>
        <div className="fx-faq-list">
          {FAQ.map((f, i) => (
            <div key={i} className={'fx-faq-item' + (openFaq === i ? ' open' : '')}>
              <button className="fx-faq-q" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <span>{f.q}</span>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <div className="fx-faq-a"><p>{f.a}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="fx-final">
        <div className="fx-final-glow" aria-hidden="true" />
        <div className="fx-final-inner">
          <div className="fx-eyebrow" style={{ justifyContent: 'center' }}><span className="fx-tick" />PRÊT ?</div>
          <h2>Donne une forme à ton trading.</h2>
          <p>Gratuit pour toujours sur l’essentiel. Aucune carte bancaire requise.</p>
          <Link href="/auth?mode=signup" className="fx-btn fx-primary fx-lg">
            Créer mon tableau de bord
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="fx-footer">
        <div className="fx-foot-top">
          <div className="fx-brand"><QLogoIcon size={24} color={C.cyan} /><span>QUANTARA</span></div>
          <nav className="fx-foot-links" aria-label="Autres concepts">
            <Link href="/landing/nebula">Concept Nebula</Link>
            <Link href="/landing/prism">Concept Prism</Link>
            <Link href="/landing">Galerie</Link>
          </nav>
        </div>
        <div className="fx-foot-bot">
          <span>© 2026 Quantara Technologies LLC · Albuquerque, NM</span>
          <span className="fx-credit">Modèle 3D : Magic / 21st.dev « Anomalous Matter » (adapté)</span>
        </div>
      </footer>
    </div>
  )
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@300;400;500;600&display=swap');

.fx{--bg:${C.bg};--cyan:${C.cyan};--blue:${C.blue};--green:${C.green};
  position:relative;min-height:100vh;background:
   radial-gradient(900px 600px at 78% 8%, rgba(34,211,238,.10), transparent 60%),
   radial-gradient(700px 500px at 12% 24%, rgba(59,130,246,.10), transparent 60%),
   ${C.bg};
  color:${C.text};overflow-x:hidden;
  font-family:'Fira Sans',-apple-system,system-ui,sans-serif;
  font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}

/* atmosphere */
.fx-grid{position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(140,170,210,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(140,170,210,.045) 1px,transparent 1px);
  background-size:54px 54px;mask-image:radial-gradient(ellipse at 50% 0%,#000 35%,transparent 85%)}
.fx-grain{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.04;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

.fx-nav,.fx-hero,.fx-stats,.fx-section,.fx-final,.fx-footer,.fx-marquee,.fx-rail{position:relative;z-index:3}

/* side rail */
.fx-rail{position:fixed;left:22px;top:0;bottom:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
  font-family:'Fira Code',monospace;font-size:10px;letter-spacing:.18em;color:${C.text3};writing-mode:vertical-rl;text-orientation:mixed}
.fx-rail-dot{writing-mode:horizontal-tb;width:7px;height:7px;border-radius:50%;background:${C.cyan};box-shadow:0 0 10px ${C.cyan};animation:fxPulse 1.6s infinite}
.fx-rail-clock{color:${C.text2}}
.fx-rail-line{writing-mode:horizontal-tb;width:1px;height:60px;background:linear-gradient(${C.cyan},transparent)}
.fx-rail-tag{color:${C.cyan}}
@keyframes fxPulse{0%,100%{opacity:1}50%{opacity:.25}}

/* nav (floating glass) */
.fx-nav{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;
  margin:0;padding:15px 34px;background:rgba(4,6,12,.55);backdrop-filter:blur(16px);
  border-bottom:1px solid ${C.line}}
.fx-brand{display:flex;align-items:center;gap:9px;font-family:'Fira Code',monospace;font-weight:600;letter-spacing:.16em;font-size:13px;color:#fff}
.fx-links{display:flex;gap:28px}
.fx-links a{font-family:'Fira Code',monospace;font-size:12.5px;color:${C.text2};letter-spacing:.02em;position:relative;transition:color .2s}
.fx-links a::after{content:'';position:absolute;left:0;right:100%;bottom:-5px;height:1px;background:${C.cyan};transition:right .25s}
.fx-links a:hover{color:#fff}.fx-links a:hover::after{right:0}
.fx-nav-cta{display:flex;gap:10px;align-items:center}

/* buttons */
.fx-btn{display:inline-flex;align-items:center;gap:8px;cursor:pointer;border-radius:11px;font-weight:600;font-size:13.5px;
  font-family:'Fira Code',monospace;letter-spacing:.01em;transition:transform .2s cubic-bezier(.16,1,.3,1),box-shadow .2s,background .2s,border-color .2s;text-decoration:none}
.fx-primary{position:relative;overflow:hidden;padding:11px 19px;color:#04121a;
  background:linear-gradient(120deg,${C.cyan},${C.blue});box-shadow:0 8px 26px rgba(34,211,238,.28),inset 0 1px 0 rgba(255,255,255,.5)}
.fx-primary::before{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(-120%);transition:transform .6s}
.fx-primary:hover{transform:translateY(-2px);box-shadow:0 14px 36px rgba(34,211,238,.42),inset 0 1px 0 rgba(255,255,255,.5)}
.fx-primary:hover::before{transform:translateX(120%)}
.fx-ghost{padding:11px 19px;color:${C.text};background:rgba(140,170,210,.06);border:1px solid ${C.line2}}
.fx-ghost:hover{background:rgba(140,170,210,.12);border-color:${C.cyan};transform:translateY(-2px)}
.fx-lg{padding:15px 26px;font-size:14.5px;border-radius:13px}
.fx-full{width:100%;justify-content:center;margin-top:20px}
.fx-btn:focus-visible{outline:2px solid ${C.cyan};outline-offset:3px}
a:focus-visible,button:focus-visible{outline:2px solid ${C.cyan};outline-offset:3px;border-radius:8px}

/* eyebrow + tick */
.fx-eyebrow{display:inline-flex;align-items:center;gap:9px;font-family:'Fira Code',monospace;font-size:11.5px;letter-spacing:.16em;color:${C.cyan};text-transform:uppercase}
.fx-tick{width:14px;height:1.5px;background:${C.cyan};box-shadow:0 0 8px ${C.cyan}}

/* HERO */
.fx-hero{position:relative;min-height:94vh;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:30px;
  max-width:1280px;margin:0 auto;padding:40px 40px 60px}
.fx-scene{position:absolute;inset:0 -8% 0 30%;z-index:0;pointer-events:none}
.fx-scene-veil{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:linear-gradient(100deg,${C.bg} 26%,rgba(4,6,12,.7) 46%,transparent 72%),radial-gradient(circle at 72% 50%,transparent 40%,${C.bg} 86%)}
.fx-hero-content{position:relative;z-index:2;max-width:560px}
.fx-h1{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:clamp(44px,6vw,82px);line-height:.98;letter-spacing:-.03em;margin:20px 0 22px}
.fx-h1-accent{background:linear-gradient(110deg,${C.cyan},${C.blue} 70%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.fx-sub{font-size:17px;color:${C.text2};max-width:480px;margin-bottom:32px}
.fx-hero-cta{display:flex;gap:13px;flex-wrap:wrap;margin-bottom:40px}
.fx-trust{display:flex;flex-direction:column;gap:11px}
.fx-trust>span{font-family:'Fira Code',monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:${C.text3}}
.fx-trust>div{display:flex;gap:18px;flex-wrap:wrap}
.fx-trust em{font-style:normal;font-family:'Fira Code',monospace;font-size:11px;font-weight:500;color:${C.text3};letter-spacing:.04em}

/* blotter card */
.fx-blotter{position:relative;z-index:2;justify-self:end;width:100%;max-width:380px;
  background:linear-gradient(165deg,${C.glass2},${C.glass});backdrop-filter:blur(22px);
  border:1px solid ${C.line2};border-radius:20px;padding:22px;
  box-shadow:0 40px 90px -30px rgba(0,0,0,.8),0 0 0 1px rgba(34,211,238,.08),inset 0 1px 0 rgba(255,255,255,.06)}
.fx-blotter-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.fx-blotter-title{display:flex;align-items:center;gap:8px;font-family:'Fira Code',monospace;font-size:10.5px;letter-spacing:.14em;color:${C.text3}}
.fx-blotter-badge{font-family:'Fira Code',monospace;font-size:10.5px;color:${C.cyan};background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.25);padding:3px 9px;border-radius:99px}
.fx-blotter-net{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:42px;letter-spacing:-.03em;color:${C.green};line-height:1;text-shadow:0 0 30px rgba(52,224,161,.35)}
.fx-blotter-net i{font-style:normal;font-size:22px;color:${C.text2}}
.fx-blotter-delta{font-family:'Fira Code',monospace;font-size:12px;color:${C.green};margin:6px 0 16px}
.fx-blotter-rows{display:flex;flex-direction:column;gap:7px}
.fx-brow{display:grid;grid-template-columns:1.2fr .9fr auto;align-items:center;gap:12px;padding:10px 12px;border-radius:11px;background:rgba(140,170,210,.05);border:1px solid ${C.line}}
.fx-brow-id{display:flex;flex-direction:column;gap:2px;font-family:'Fira Code',monospace;font-size:12px;color:${C.text}}
.fx-brow-id i{font-style:normal;font-size:10px;color:${C.text3}}
.fx-brow-dd{display:flex;align-items:center;gap:7px;font-family:'Fira Code',monospace;font-size:10.5px;color:${C.text3}}
.fx-brow-dd b{display:block;height:4px;border-radius:2px;max-width:46px;flex-shrink:0}
.fx-brow-pnl{font-family:'Fira Code',monospace;font-size:13px;font-weight:600;text-align:right}

.fx-scroll{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);z-index:2;width:22px;height:34px;border:1px solid ${C.line2};border-radius:12px;display:flex;justify-content:center;padding-top:6px}
.fx-scroll span{width:3px;height:7px;border-radius:2px;background:${C.cyan};animation:fxScroll 1.8s infinite}
@keyframes fxScroll{0%{opacity:0;transform:translateY(-3px)}40%{opacity:1}80%,100%{opacity:0;transform:translateY(9px)}}

/* marquee */
.fx-marquee{border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};overflow:hidden;padding:13px 0;background:rgba(7,11,20,.6)}
.fx-marquee-track{display:flex;width:max-content;animation:fxMarq 34s linear infinite}
.fx-marquee-track em{font-style:normal;font-family:'Fira Code',monospace;font-size:13px;font-weight:500;color:${C.text3};letter-spacing:.08em;display:inline-flex;align-items:center}
.fx-marquee-track i{font-style:normal;color:${C.cyan};margin:0 18px;opacity:.6}
@keyframes fxMarq{to{transform:translateX(-50%)}}

/* stats */
.fx-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0;max-width:1000px;margin:64px auto;padding:30px 28px;
  background:linear-gradient(165deg,${C.glass2},${C.glass});backdrop-filter:blur(18px);border:1px solid ${C.line};border-radius:20px;
  box-shadow:0 30px 70px -34px rgba(0,0,0,.7)}
.fx-stat{position:relative;text-align:center;padding:0 16px}
.fx-stat b{display:block;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:40px;letter-spacing:-.03em;
  background:linear-gradient(120deg,${C.cyan},${C.blue});-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.fx-stat span{font-family:'Fira Code',monospace;font-size:11.5px;color:${C.text2};letter-spacing:.02em}
.fx-stat-sep{position:absolute;right:0;top:14%;height:72%;width:1px;background:${C.line}}

/* sections */
.fx-section{max-width:1140px;margin:0 auto;padding:96px 40px}
.fx-sec-head{text-align:center;margin-bottom:50px}
.fx-sec-head .fx-eyebrow{justify-content:center;margin-bottom:16px}
.fx-h2{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:clamp(30px,4.4vw,50px);letter-spacing:-.03em;line-height:1.05;margin-bottom:16px}
.fx-lead{font-size:17px;color:${C.text2};max-width:600px;margin:0 auto;line-height:1.65}

/* feature cards */
.fx-features{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.fx-card{position:relative;overflow:hidden;background:linear-gradient(165deg,${C.glass2},${C.glass});backdrop-filter:blur(14px);
  border:1px solid ${C.line};border-radius:18px;padding:28px;transition:transform .3s cubic-bezier(.16,1,.3,1),border-color .3s,box-shadow .3s}
.fx-card:hover{transform:translateY(-6px);border-color:rgba(34,211,238,.4);box-shadow:0 30px 60px -30px rgba(0,0,0,.7),0 0 0 1px rgba(34,211,238,.12)}
.fx-card-ic{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:12px;color:${C.cyan};
  background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.22);margin-bottom:18px}
.fx-card h3{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:19px;letter-spacing:-.01em;margin-bottom:9px}
.fx-card p{font-size:14.5px;color:${C.text2};line-height:1.6}
.fx-card-corner{position:absolute;top:14px;right:14px;width:9px;height:9px;border-top:1px solid ${C.line2};border-right:1px solid ${C.line2};opacity:0;transition:opacity .3s}
.fx-card:hover .fx-card-corner{opacity:1}

/* steps */
.fx-steps{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.fx-steps-line{position:absolute;top:26px;left:8%;right:8%;height:1px;background:linear-gradient(90deg,transparent,${C.line2},transparent)}
.fx-step{position:relative;text-align:center;padding:0 12px}
.fx-step-n{width:54px;height:54px;margin:0 auto 18px;display:flex;align-items:center;justify-content:center;border-radius:50%;
  font-family:'Fira Code',monospace;font-weight:600;font-size:17px;color:${C.cyan};
  background:${C.bg2};border:1px solid rgba(34,211,238,.3);box-shadow:0 0 0 6px rgba(34,211,238,.05),0 0 24px -6px ${C.cyan}}
.fx-step h3{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:20px;margin-bottom:9px}
.fx-step p{font-size:14.5px;color:${C.text2};line-height:1.6;max-width:300px;margin:0 auto}

/* pricing */
.fx-pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:start}
.fx-price{position:relative;background:linear-gradient(165deg,${C.glass2},${C.glass});backdrop-filter:blur(14px);
  border:1px solid ${C.line};border-radius:20px;padding:32px;transition:transform .3s,border-color .3s}
.fx-price.hot{border-color:rgba(34,211,238,.45);box-shadow:0 34px 80px -36px rgba(34,211,238,.5),inset 0 1px 0 rgba(255,255,255,.05);transform:translateY(-8px)}
.fx-price-flag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);font-family:'Fira Code',monospace;font-size:10.5px;letter-spacing:.08em;
  background:linear-gradient(120deg,${C.cyan},${C.blue});color:#04121a;font-weight:600;padding:5px 14px;border-radius:99px;white-space:nowrap}
.fx-price-name{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:20px;margin-bottom:10px}
.fx-price-amt{margin-bottom:20px;display:flex;align-items:baseline;gap:6px}
.fx-price-amt b{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:48px;letter-spacing:-.03em}
.fx-price-amt span{font-family:'Fira Code',monospace;font-size:12.5px;color:${C.text3}}
.fx-price ul{list-style:none}
.fx-price li{display:flex;align-items:center;gap:10px;font-size:14px;color:${C.text2};padding:8px 0;border-bottom:1px solid ${C.line}}
.fx-price li svg{flex-shrink:0}

/* faq */
.fx-faq{max-width:780px}
.fx-faq-list{display:flex;flex-direction:column;gap:11px}
.fx-faq-item{background:linear-gradient(165deg,${C.glass2},${C.glass});backdrop-filter:blur(12px);border:1px solid ${C.line};border-radius:14px;overflow:hidden;transition:border-color .25s}
.fx-faq-item.open{border-color:rgba(34,211,238,.4)}
.fx-faq-q{width:100%;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 22px;background:none;border:none;color:${C.text};font-family:'Fira Sans',sans-serif;font-size:16px;font-weight:600;text-align:left;cursor:pointer}
.fx-faq-q svg{flex-shrink:0;color:${C.cyan};transition:transform .3s}
.fx-faq-item.open .fx-faq-q svg{transform:rotate(180deg)}
.fx-faq-a{max-height:0;overflow:hidden;transition:max-height .35s ease}
.fx-faq-item.open .fx-faq-a{max-height:200px}
.fx-faq-a p{padding:0 22px 20px;font-size:14.5px;color:${C.text2};line-height:1.65}

/* final */
.fx-final{position:relative;text-align:center;padding:110px 40px;overflow:hidden}
.fx-final-glow{position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 50% 50%,rgba(34,211,238,.16),transparent 65%)}
.fx-final-inner{position:relative;z-index:2;max-width:680px;margin:0 auto}
.fx-final-inner .fx-eyebrow{margin-bottom:18px}
.fx-final h2{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:clamp(32px,5vw,56px);letter-spacing:-.03em;line-height:1.04;margin-bottom:16px}
.fx-final p{font-size:17px;color:${C.text2};margin-bottom:32px}

/* footer */
.fx-footer{padding:54px 40px;border-top:1px solid ${C.line};background:rgba(4,6,12,.6);backdrop-filter:blur(10px)}
.fx-foot-top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;max-width:1140px;margin:0 auto;padding-bottom:22px;border-bottom:1px solid ${C.line}}
.fx-foot-top .fx-brand{font-family:'Fira Code',monospace;font-size:13px;letter-spacing:.16em}
.fx-foot-links{display:flex;gap:22px}
.fx-foot-links a{font-family:'Fira Code',monospace;font-size:12.5px;color:${C.text2};transition:color .2s}
.fx-foot-links a:hover{color:${C.cyan}}
.fx-foot-bot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;max-width:1140px;margin:18px auto 0;font-family:'Fira Code',monospace;font-size:11px;color:${C.text3}}

/* load reveal */
.rev{opacity:0;transform:translateY(16px);animation:fxRev .7s cubic-bezier(.16,1,.3,1) forwards;animation-delay:var(--d,0ms)}
@keyframes fxRev{to{opacity:1;transform:none}}

/* responsive */
@media(max-width:980px){
  .fx-hero{grid-template-columns:1fr;min-height:auto;padding:30px 22px 50px;gap:36px}
  .fx-scene{position:absolute;inset:0;opacity:.5}
  .fx-scene-veil{background:radial-gradient(circle at 50% 40%,transparent 30%,${C.bg} 80%)}
  .fx-blotter{justify-self:stretch;max-width:none}
  .fx-rail{display:none}
  .fx-features,.fx-pricing,.fx-steps{grid-template-columns:1fr}
  .fx-steps-line{display:none}
  .fx-price.hot{transform:none}
  .fx-stats{grid-template-columns:repeat(2,1fr);gap:24px 0}
  .fx-stat:nth-child(2) .fx-stat-sep{display:none}
  .fx-links,.fx-nav-cta .fx-ghost{display:none}
  .fx-section{padding:64px 22px}
}
@media(max-width:480px){.fx-stats{grid-template-columns:1fr}.fx-stat-sep{display:none}}

/* accessibility: reduced motion */
@media(prefers-reduced-motion:reduce){
  .rev{animation:none;opacity:1;transform:none}
  .fx-marquee-track,.fx-rail-dot,.fx-scroll span{animation:none}
  .fx-primary::before{display:none}
  *{transition-duration:.01ms!important}
}
`
