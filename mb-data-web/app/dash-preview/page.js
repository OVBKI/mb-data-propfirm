'use client'
// /dash-preview — galerie : 3 variantes de redesign du dashboard (mêmes cases,
// même disposition, design/typo différents). Mock data, vrai dashboard intact.

import Link from 'next/link'
import QLogoIcon from '../../components/QLogoIcon'

const VARIANTS = [
  { href: '/dash-preview/glass', name: 'Glass', tag: 'Glassmorphism premium · dark', desc: 'Verre dépoli, halos bleu/teal, typo Plus Jakarta Sans, coins arrondis, chiffres mono. Le plus proche de l’actuel, en plus premium.', bg: 'linear-gradient(135deg,#0a0e1a,#11203f)', fg: '#eef1f6', sub: '#9aa3bd', accent: '#4d8fff', sw: ['#2d6fff', '#19c37d', '#0a0e1a'] },
  { href: '/dash-preview/terminal', name: 'Terminal', tag: 'OLED dense · quant · mono', desc: 'Near-black, monospace Fira Code, hairlines, vert phosphore + ambre, grille technique, coins nets. Pour traders hardcore.', bg: 'linear-gradient(135deg,#04060a,#06241a)', fg: '#d6e2dc', sub: '#8fa39b', accent: '#22f49d', sw: ['#22f49d', '#ffb547', '#04060a'] },
  { href: '/dash-preview/light', name: 'Light', tag: 'Éditorial clair · serif', desc: 'Fond ivoire, navy + or, titres serif Playfair Display, ombres douces. Clair, premium et chaleureux.', bg: 'linear-gradient(135deg,#f5f3ec,#e7e3d6)', fg: '#141b2e', sub: '#586079', accent: '#1e3a8a', sw: ['#1e3a8a', '#ca8a04', '#f5f3ec'] },
]

export default function DashPreviewGallery() {
  return (
    <div style={{ background: '#0b0d12', color: '#f0ede8', minHeight: '100vh', fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif", overflowX: 'hidden' }}>
      <style>{css}</style>
      <header className="dg-nav">
        <div className="dg-brand"><QLogoIcon size={28} color="#4d8fff" /><span>QUANTARA</span></div>
        <Link href="/landing" className="dg-back">Voir les landings →</Link>
      </header>
      <section className="dg-hero">
        <div className="dg-eyebrow">3 variantes · même structure</div>
        <h1>Redesign du dashboard</h1>
        <p>Mêmes cases, même disposition que ton vrai dashboard — seuls le design des cartes, la typo et les couleurs changent. Clique pour explorer chaque variante en plein écran (la sidebar se déplie).</p>
      </section>
      <section className="dg-grid">
        {VARIANTS.map((v, i) => (
          <Link key={v.name} href={v.href} className="dg-card" style={{ background: v.bg, color: v.fg }}>
            <div className="dg-card-top"><span className="dg-num">0{i + 1}</span><div className="dg-sw">{v.sw.map(s => <i key={s} style={{ background: s }} />)}</div></div>
            <div className="dg-card-mid">
              <h2>{v.name}</h2>
              <div className="dg-tag" style={{ color: v.accent }}>{v.tag}</div>
              <p style={{ color: v.sub }}>{v.desc}</p>
            </div>
            <div className="dg-cta" style={{ borderColor: v.accent, color: v.accent }}>Explorer →</div>
          </Link>
        ))}
      </section>
      <footer className="dg-foot">Maquettes · données fictives · le vrai dashboard n’est pas modifié.</footer>
    </div>
  )
}

const css = `
.dg-nav{display:flex;align-items:center;justify-content:space-between;padding:18px 32px;border-bottom:1px solid rgba(255,255,255,0.08)}
.dg-brand{display:flex;align-items:center;gap:9px;font-weight:800;letter-spacing:.14em;font-size:14px}
.dg-back{font-size:13px;color:#9098b0}.dg-back:hover{color:#fff}
.dg-hero{text-align:center;padding:64px 32px 36px;max-width:760px;margin:0 auto}
.dg-eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:#4d8fff;font-weight:700;margin-bottom:16px}
.dg-hero h1{font-size:clamp(30px,5vw,50px);font-weight:800;letter-spacing:-.03em;margin-bottom:16px}
.dg-hero p{font-size:16px;color:#9098b0;line-height:1.6}
.dg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1180px;margin:0 auto;padding:40px 32px 70px}
.dg-card{display:flex;flex-direction:column;border-radius:20px;padding:26px;min-height:340px;text-decoration:none;border:1px solid rgba(255,255,255,0.1);transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s}
.dg-card:hover{transform:translateY(-8px);box-shadow:0 40px 80px -30px rgba(0,0,0,.6)}
.dg-card-top{display:flex;justify-content:space-between;align-items:center}
.dg-num{font-size:14px;font-weight:800;letter-spacing:.1em;opacity:.5}
.dg-sw{display:flex;gap:6px}.dg-sw i{width:18px;height:18px;border-radius:50%;display:block;box-shadow:0 0 0 1px rgba(0,0,0,.1)}
.dg-card-mid{flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:26px 0}
.dg-card-mid h2{font-size:32px;font-weight:900;letter-spacing:-.03em}
.dg-tag{font-size:12.5px;font-weight:700;margin-bottom:8px}
.dg-card-mid p{font-size:14px;line-height:1.6}
.dg-cta{font-size:14px;font-weight:700;border:1.5px solid;border-radius:10px;padding:12px;text-align:center}
.dg-foot{text-align:center;padding:30px;font-size:12px;color:#5a6275;border-top:1px solid rgba(255,255,255,0.08)}
@media(max-width:880px){.dg-grid{grid-template-columns:1fr}}
`
