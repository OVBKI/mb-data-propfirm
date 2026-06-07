'use client'
// Landing3DShell — shared full-page landing chrome for the 3D concepts.
// Renders a fixed full-viewport 3D scene behind dark glass content
// (nav, hero, stats, features, how-it-works, pricing, FAQ, CTA, footer).
// Each concept page passes a theme + its own <Scene/> node + the Magic credit.

import Link from 'next/link'
import { useState } from 'react'
import QLogoIcon from '../QLogoIcon'

const FEATURES = [
  { icon: '🏢', t: 'Multi-PropFirms', d: 'Topstep, Apex, Bulenox, MFFU… tous tes comptes Challenge, Funded et Live sur un seul écran.' },
  { icon: '📔', t: 'Journal de trading', d: 'Chaque trade horodaté, taggé par setup. Tes patterns gagnants ressortent tout seuls.' },
  { icon: '📈', t: 'Courbe d\'équité', d: 'Equity curve live par compte et cumulée. Ton edge se dessine jour après jour.' },
  { icon: '💰', t: 'Payouts & dépenses', d: 'Frais, resets et abonnements vs payouts encaissés. Ton vrai net, sans illusion.' },
]

const STEPS = [
  { n: '01', t: 'Connecte tes firms', d: 'Ajout en 30 s ou import CSV — la firme et ses règles de drawdown sont reconnues automatiquement.' },
  { n: '02', t: 'Trade normalement', d: 'Continue sur tes plateformes. Quantara consolide P&L, drawdown, consistance et net réel.' },
  { n: '03', t: 'Décide avec des chiffres', d: 'Quel compte payer, lequel reset, quand demander ton payout. Sans tableur.' },
]

const PRICING = [
  { name: 'Free', price: '0', period: '€/mois', feats: ['2 PropFirms', '100 trades / mois', 'Journal + equity', 'Calendrier éco'], hot: false },
  { name: 'Pro', price: '19', period: '€/mois', feats: ['PropFirms illimités', 'Trades illimités', 'Drawdown Guardian', 'Sync API + PDF'], hot: true },
  { name: 'Lifetime', price: '249', period: '€ une fois', feats: ['Tout Pro à vie', 'Badge Founding', 'Early access', '100 places only'], hot: false },
]

const FAQ = [
  { q: 'Quantara remplace mon tableur Excel ?', a: 'Oui — il calcule automatiquement drawdown trailing, consistance et net réel après frais et resets.' },
  { q: 'Mes identifiants sont-ils en sécurité ?', a: 'Tu ne partages jamais tes mots de passe broker. Import par CSV ou connexions chiffrées. Tes données restent les tiennes.' },
  { q: 'Quelles PropFirms sont supportées ?', a: 'Les 11 principales firmes futures avec leurs règles de drawdown et payout pré-chargées.' },
]

const FIRMS = ['TOPSTEP', 'APEX', 'BULENOX', 'MYFUNDEDFUTURES', 'TAKE PROFIT TRADER', 'TRADEIFY']

export default function Landing3DShell({
  name,
  accent = '#4d8fff',
  accent2 = '#7c5cff',
  scene = null,
  badge = '',
  heroTitle = 'Tous tes comptes PropFirm.',
  heroHighlight = 'Un seul tableau de bord.',
  heroSub = "Quantara réunit tes challenges, comptes funded, payouts et dépenses en un endroit clair. Le journal de trading pensé pour les prop traders.",
  magicCredit = '',
  others = [],
}) {
  const [openFaq, setOpenFaq] = useState(0)
  return (
    <div className="l3-root">
      <style>{shellCss(accent, accent2)}</style>

      {/* Fixed 3D scene background */}
      <div className="l3-scene">{scene}</div>
      <div className="l3-veil" />

      {/* NAV */}
      <header className="l3-nav">
        <Link href="/landing" className="l3-brand"><QLogoIcon size={28} color={accent} /><span>QUANTARA</span></Link>
        <nav className="l3-links">
          <a href="#features">Fonctions</a>
          <a href="#how">Méthode</a>
          <a href="#pricing">Tarifs</a>
        </nav>
        <div className="l3-nav-cta">
          <Link href="/app" className="l3-ghost">Se connecter</Link>
          <Link href="/auth?mode=signup" className="l3-primary">Commencer</Link>
        </div>
      </header>

      {/* HERO */}
      <section className="l3-hero">
        {badge && <div className="l3-badge">{badge}</div>}
        <h1 className="l3-h1">{heroTitle}<br /><span className="l3-grad">{heroHighlight}</span></h1>
        <p className="l3-sub">{heroSub}</p>
        <div className="l3-hero-cta">
          <Link href="/auth?mode=signup" className="l3-primary l3-lg">Démarrer gratuitement →</Link>
          <Link href="/demo" className="l3-ghost l3-lg">Voir la démo</Link>
        </div>
        <div className="l3-trust"><span>Compatible avec</span><div>{FIRMS.map(f => <em key={f}>{f}</em>)}</div></div>
        <div className="l3-scroll">↓</div>
      </section>

      {/* STATS */}
      <section className="l3-stats">
        {[['11', 'PropFirms'], ['∞', 'Comptes & trades'], ['3', 'Langues'], ['100%', 'Privé']].map(([v, l]) => (
          <div key={l}><b>{v}</b><span>{l}</span></div>
        ))}
      </section>

      {/* FEATURES */}
      <section id="features" className="l3-section">
        <div className="l3-eyebrow">Tout au même endroit</div>
        <h2 className="l3-h2">Le copilote de ta carrière prop</h2>
        <div className="l3-features">
          {FEATURES.map((f) => (
            <div key={f.t} className="l3-card">
              <div className="l3-card-icon">{f.icon}</div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="l3-section">
        <div className="l3-eyebrow">3 étapes</div>
        <h2 className="l3-h2">Opérationnel en 5 minutes</h2>
        <div className="l3-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="l3-step">
              <div className="l3-step-n">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="l3-section">
        <div className="l3-eyebrow">Tarifs simples</div>
        <h2 className="l3-h2">Commence gratuit. Scale quand tu veux.</h2>
        <div className="l3-pricing">
          {PRICING.map((p) => (
            <div key={p.name} className={'l3-price' + (p.hot ? ' hot' : '')}>
              {p.hot && <div className="l3-price-flag">Populaire</div>}
              <div className="l3-price-name">{p.name}</div>
              <div className="l3-price-amt"><b>{p.price}</b><span>{p.period}</span></div>
              <ul>{p.feats.map(x => <li key={x}>✓ {x}</li>)}</ul>
              <Link href="/auth?mode=signup" className={(p.hot ? 'l3-primary' : 'l3-ghost') + ' l3-full'}>Choisir {p.name}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="l3-section l3-faq">
        <div className="l3-eyebrow">FAQ</div>
        <h2 className="l3-h2">Ce que tu te demandes</h2>
        <div className="l3-faq-list">
          {FAQ.map((f, i) => (
            <div key={i} className={'l3-faq-item' + (openFaq === i ? ' open' : '')} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
              <div className="l3-faq-q">{f.q}<span>{openFaq === i ? '−' : '+'}</span></div>
              {openFaq === i && <div className="l3-faq-a">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="l3-final">
        <h2>Reprends le contrôle de tes comptes prop.</h2>
        <p>Gratuit pour toujours sur l'essentiel. Aucune carte requise.</p>
        <Link href="/auth?mode=signup" className="l3-primary l3-lg">Créer mon tableau de bord →</Link>
      </section>

      {/* FOOTER */}
      <footer className="l3-footer">
        <div className="l3-foot-top">
          <div className="l3-brand"><QLogoIcon size={24} color={accent} /><span>QUANTARA</span></div>
          <div className="l3-foot-links">
            {others.map(o => <Link key={o.href} href={o.href}>{o.label}</Link>)}
          </div>
        </div>
        <div className="l3-foot-bot">
          <span>© 2026 Quantara Technologies LLC · Albuquerque, NM</span>
          {magicCredit && <span className="l3-credit">{magicCredit}</span>}
        </div>
      </footer>
    </div>
  )
}

const shellCss = (accent, accent2) => `
.l3-root{position:relative;min-height:100vh;background:#05060a;color:#eef1f6;overflow-x:hidden;font-family:-apple-system,'Segoe UI',system-ui,sans-serif}
.l3-scene{position:fixed;inset:0;z-index:0;pointer-events:none}
.l3-scene canvas,.l3-scene>div{pointer-events:none}
.l3-veil{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at 50% 0%,transparent 30%,rgba(5,6,10,.55) 75%,rgba(5,6,10,.92) 100%)}
.l3-nav,.l3-hero,.l3-stats,.l3-section,.l3-final,.l3-footer{position:relative;z-index:3}

.l3-nav{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;padding:15px 32px;background:rgba(5,6,10,.5);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.07)}
.l3-brand{display:flex;align-items:center;gap:9px;font-weight:800;letter-spacing:.14em;font-size:14px;color:#fff}
.l3-links{display:flex;gap:26px}
.l3-links a{font-size:13px;color:#aab2c5;transition:color .15s}
.l3-links a:hover{color:#fff}
.l3-nav-cta{display:flex;gap:10px;align-items:center}
.l3-primary{background:linear-gradient(120deg,${accent},${accent2});color:#06070d;font-weight:700;padding:10px 18px;border-radius:10px;font-size:13px;display:inline-block;box-shadow:0 6px 22px ${accent}44;transition:transform .2s,box-shadow .2s}
.l3-primary:hover{transform:translateY(-1px);box-shadow:0 10px 30px ${accent}66}
.l3-ghost{background:rgba(255,255,255,.05);color:#eef1f6;border:1px solid rgba(255,255,255,.14);padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;display:inline-block;transition:all .2s}
.l3-ghost:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25)}
.l3-lg{padding:14px 26px;font-size:15px;border-radius:12px}
.l3-full{display:block;text-align:center;width:100%;margin-top:18px}

.l3-hero{min-height:92vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 24px 40px}
.l3-badge{display:inline-block;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:99px;padding:7px 16px;font-size:12.5px;font-weight:600;color:#cfd6e6;margin-bottom:26px;backdrop-filter:blur(8px)}
.l3-h1{font-size:clamp(42px,7vw,82px);font-weight:800;letter-spacing:-.035em;line-height:1.02;margin-bottom:22px;text-shadow:0 2px 40px rgba(0,0,0,.5)}
.l3-grad{background:linear-gradient(120deg,${accent},${accent2});-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.l3-sub{font-size:18px;line-height:1.6;color:#c3cad9;max-width:600px;margin:0 auto 34px;text-shadow:0 1px 20px rgba(0,0,0,.6)}
.l3-hero-cta{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:44px}
.l3-trust{display:flex;flex-direction:column;align-items:center;gap:12px}
.l3-trust>span{font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:#8089a0;font-weight:600}
.l3-trust>div{display:flex;gap:24px;flex-wrap:wrap;justify-content:center}
.l3-trust em{font-style:normal;font-size:12.5px;font-weight:700;color:#737c93;letter-spacing:.04em}
.l3-scroll{margin-top:40px;font-size:20px;color:#7b839b;animation:l3Float 2s ease-in-out infinite}
@keyframes l3Float{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(8px);opacity:1}}

.l3-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;max-width:980px;margin:30px auto;padding:30px 24px;text-align:center;background:rgba(12,14,22,.6);border:1px solid rgba(255,255,255,.08);border-radius:18px;backdrop-filter:blur(14px)}
.l3-stats b{display:block;font-size:38px;font-weight:800;background:linear-gradient(120deg,${accent},${accent2});-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.03em}
.l3-stats span{font-size:13px;color:#aab2c5}

.l3-section{max-width:1100px;margin:0 auto;padding:90px 24px;text-align:center}
.l3-eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.16em;font-weight:700;color:${accent};margin-bottom:14px}
.l3-h2{font-size:clamp(28px,4.4vw,46px);font-weight:800;letter-spacing:-.03em;margin-bottom:44px}
.l3-features{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:left}
.l3-card{background:rgba(14,16,24,.6);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:26px;backdrop-filter:blur(12px);transition:transform .25s,border-color .25s}
.l3-card:hover{transform:translateY(-5px);border-color:${accent}66}
.l3-card-icon{font-size:26px;margin-bottom:14px}
.l3-card h3{font-size:18px;font-weight:700;margin-bottom:8px}
.l3-card p{font-size:14px;color:#aab2c5;line-height:1.6}

.l3-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:left}
.l3-step-n{font-size:44px;font-weight:800;background:linear-gradient(120deg,${accent},${accent2});-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.04em;margin-bottom:8px}
.l3-step h3{font-size:19px;font-weight:700;margin-bottom:8px}
.l3-step p{font-size:14px;color:#aab2c5;line-height:1.6}

.l3-pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;text-align:left}
.l3-price{position:relative;background:rgba(14,16,24,.6);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:30px;backdrop-filter:blur(12px)}
.l3-price.hot{border-color:${accent};box-shadow:0 24px 60px -28px ${accent};transform:scale(1.03)}
.l3-price-flag{position:absolute;top:-12px;right:24px;background:linear-gradient(120deg,${accent},${accent2});color:#06070d;font-size:11px;font-weight:700;padding:5px 12px;border-radius:99px}
.l3-price-name{font-size:20px;font-weight:800;margin-bottom:10px}
.l3-price-amt{margin-bottom:18px}.l3-price-amt b{font-size:44px;font-weight:800;letter-spacing:-.03em}.l3-price-amt span{font-size:13px;color:#8089a0;margin-left:5px}
.l3-price ul{list-style:none}.l3-price li{font-size:14px;color:#c3cad9;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07)}

.l3-faq{max-width:760px}
.l3-faq-list{text-align:left}
.l3-faq-item{background:rgba(14,16,24,.55);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px 22px;margin-bottom:12px;cursor:pointer;backdrop-filter:blur(10px);transition:border-color .2s}
.l3-faq-item.open{border-color:${accent}66}
.l3-faq-q{display:flex;justify-content:space-between;align-items:center;font-size:16px;font-weight:600}
.l3-faq-q span{font-size:22px;color:${accent}}
.l3-faq-a{font-size:14.5px;color:#aab2c5;line-height:1.65;margin-top:12px}

.l3-final{text-align:center;padding:100px 24px;max-width:720px;margin:0 auto}
.l3-final h2{font-size:clamp(30px,5vw,50px);font-weight:800;letter-spacing:-.03em;margin-bottom:16px}
.l3-final p{font-size:17px;color:#c3cad9;margin-bottom:32px}

.l3-footer{padding:50px 32px;border-top:1px solid rgba(255,255,255,.07);background:rgba(5,6,10,.6);backdrop-filter:blur(10px)}
.l3-foot-top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;padding-bottom:22px;border-bottom:1px solid rgba(255,255,255,.07);max-width:1100px;margin:0 auto}
.l3-foot-links{display:flex;gap:20px}
.l3-foot-links a{font-size:13px;color:${accent};font-weight:600}
.l3-foot-bot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;max-width:1100px;margin:18px auto 0;font-size:12px;color:#737c93}
.l3-credit{opacity:.8}

@media(max-width:880px){
  .l3-links,.l3-nav-cta .l3-ghost{display:none}
  .l3-features,.l3-steps,.l3-pricing,.l3-stats{grid-template-columns:1fr}
  .l3-price.hot{transform:none}
  .l3-nav{padding:13px 18px}
  .l3-section,.l3-hero{padding-left:18px;padding-right:18px}
}
`
