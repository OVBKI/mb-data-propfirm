'use client'
// Landing gallery index — preview & compare the 3 landing-page concepts.
// Each card links to its full-page route. Self-contained, Quantara logo reused.

import Link from 'next/link'
import QLogoIcon from '../../components/QLogoIcon'

const CONCEPTS = [
  {
    href: '/landing/aurora',
    name: 'Aurora',
    tag: 'Fintech premium · light mode',
    desc: 'Aéré, gradients aurora violet→teal, preview dashboard flottante. À la Stripe / Linear.',
    bg: 'linear-gradient(135deg,#f6f4ef,#efe9fb)',
    fg: '#15131c',
    sub: '#4a4658',
    accent: '#7c5cff',
    swatches: ['#7c5cff', '#15b8a6', '#f6f4ef'],
  },
  {
    href: '/landing/terminal',
    name: 'Terminal',
    tag: 'Pro-trader · dark · monospace',
    desc: 'Console façon Bloomberg : grille technique, néon phosphore, blotter live, tickers défilants.',
    bg: 'linear-gradient(135deg,#06080a,#0c1512)',
    fg: '#d6e2dc',
    sub: '#7d8a86',
    accent: '#25f4a7',
    swatches: ['#25f4a7', '#ffb547', '#06080a'],
  },
  {
    href: '/landing/ledger',
    name: 'Ledger',
    tag: 'Éditorial · brutalist · warm',
    desc: 'Typo géante, chiffres surdimensionnés, grille asymétrique, bordures franches. Branding fort.',
    bg: 'linear-gradient(135deg,#ece7dd,#e2dcd0)',
    fg: '#191512',
    sub: '#5b554c',
    accent: '#2438ff',
    swatches: ['#2438ff', '#ff4d1c', '#ece7dd'],
  },
  {
    href: '/landing/nebula',
    name: 'Nebula',
    tag: '3D · cosmique · Magic « Horizon »',
    desc: 'Scène 3D temps réel : champ d\'étoiles, nébuleuse animée, montagnes en parallaxe et bloom cinématique en fond.',
    bg: 'linear-gradient(135deg,#070a18,#1a1040)',
    fg: '#eef1f6',
    sub: '#aab2c5',
    accent: '#4d8fff',
    swatches: ['#4d8fff', '#a06bff', '#070a18'],
    badge3d: true,
  },
  {
    href: '/landing/flux',
    name: 'Flux',
    tag: '3D · interactif · Magic « Anomalous »',
    desc: 'Icosaèdre filaire déformé par du bruit, éclairé par une lumière qui suit ta souris. Électrique et vivant.',
    bg: 'linear-gradient(135deg,#04101a,#06283a)',
    fg: '#eef1f6',
    sub: '#aab2c5',
    accent: '#22d3ee',
    swatches: ['#22d3ee', '#3b82f6', '#04101a'],
    badge3d: true,
  },
  {
    href: '/landing/prism',
    name: 'Prism',
    tag: '3D · cinématique · Magic « Ethereal »',
    desc: 'Cristal à facettes avec shader palette-cosinus, grain film, aberration et étalonnage. Rendu premium.',
    bg: 'linear-gradient(135deg,#0a0820,#2a0f33)',
    fg: '#eef1f6',
    sub: '#aab2c5',
    accent: '#a78bfa',
    swatches: ['#a78bfa', '#ec4899', '#0a0820'],
    badge3d: true,
  },
]

export default function LandingGallery() {
  return (
    <div style={{ background: '#0d0f14', color: '#f0ede8', minHeight: '100vh', fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif", overflowX: 'hidden' }}>
      <style>{galleryCss}</style>

      <header className="gl-nav">
        <div className="gl-brand"><QLogoIcon size={30} color="#4d8fff" /><span>QUANTARA</span></div>
        <Link href="/" className="gl-back">← Retour au site</Link>
      </header>

      <section className="gl-hero">
        <div className="gl-eyebrow">3 concepts · carte blanche</div>
        <h1>Choisis la direction artistique<br />de la landing Quantara.</h1>
        <p>Trois pages complètes, trois ambiances radicalement différentes. Clique pour explorer chacune en plein écran.</p>
      </section>

      <section className="gl-grid">
        {CONCEPTS.map((c, i) => (
          <Link key={c.name} href={c.href} className="gl-card" style={{ background: c.bg, color: c.fg }}>
            <div className="gl-card-top">
              <span className="gl-num">0{i + 1}{c.badge3d && <em className="gl-3d" style={{ borderColor: c.accent, color: c.accent }}>3D</em>}</span>
              <div className="gl-swatches">{c.swatches.map(s => <i key={s} style={{ background: s }} />)}</div>
            </div>
            <div className="gl-card-mid">
              <QLogoIcon size={40} color={c.accent} />
              <h2>{c.name}</h2>
              <div className="gl-tag" style={{ color: c.accent }}>{c.tag}</div>
              <p style={{ color: c.sub }}>{c.desc}</p>
            </div>
            <div className="gl-card-cta" style={{ borderColor: c.accent, color: c.accent }}>
              Explorer en plein écran →
            </div>
          </Link>
        ))}
      </section>

      <footer className="gl-foot">© 2026 Quantara Technologies LLC · maquettes de landing pages</footer>
    </div>
  )
}

const galleryCss = `
.gl-nav{display:flex;align-items:center;justify-content:space-between;padding:18px 32px;border-bottom:1px solid rgba(255,255,255,.08)}
.gl-brand{display:flex;align-items:center;gap:9px;font-weight:800;letter-spacing:.14em;font-size:14px}
.gl-back{font-size:13px;color:#9098b0}
.gl-back:hover{color:#f0ede8}
.gl-hero{text-align:center;padding:70px 32px 40px;max-width:760px;margin:0 auto}
.gl-eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:#4d8fff;font-weight:700;margin-bottom:16px}
.gl-hero h1{font-size:clamp(30px,5vw,52px);font-weight:800;letter-spacing:-.03em;line-height:1.05;margin-bottom:18px}
.gl-hero p{font-size:17px;color:#9098b0;line-height:1.6}
.gl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;max-width:1240px;margin:0 auto;padding:40px 32px 80px}
.gl-card{display:flex;flex-direction:column;border-radius:22px;padding:28px;min-height:420px;text-decoration:none;border:1px solid rgba(255,255,255,.1);transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s}
.gl-card:hover{transform:translateY(-8px);box-shadow:0 40px 80px -30px rgba(0,0,0,.6)}
.gl-card-top{display:flex;justify-content:space-between;align-items:center}
.gl-num{font-size:14px;font-weight:800;letter-spacing:.1em;opacity:.5;display:flex;align-items:center;gap:10px}
.gl-3d{font-style:normal;font-size:10px;font-weight:800;letter-spacing:.1em;border:1.5px solid;border-radius:5px;padding:2px 6px;opacity:1}
.gl-swatches{display:flex;gap:6px}.gl-swatches i{width:18px;height:18px;border-radius:50%;display:block;box-shadow:0 0 0 1px rgba(0,0,0,.1)}
.gl-card-mid{flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:30px 0}
.gl-card-mid h2{font-size:34px;font-weight:900;letter-spacing:-.03em;margin-top:14px}
.gl-tag{font-size:12.5px;font-weight:700;letter-spacing:.04em;margin-bottom:10px}
.gl-card-mid p{font-size:14.5px;line-height:1.6}
.gl-card-cta{font-size:14px;font-weight:700;border:1.5px solid;border-radius:10px;padding:13px;text-align:center;transition:background .2s}
.gl-card:hover .gl-card-cta{background:rgba(0,0,0,.04)}
.gl-foot{text-align:center;padding:40px;font-size:13px;color:#5a6275;border-top:1px solid rgba(255,255,255,.08)}
@media(max-width:880px){.gl-grid{grid-template-columns:1fr}}
`
