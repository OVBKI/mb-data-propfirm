// /landing/clickfunded — Concept landing #7 (v2), style ClickFunded premium :
// fond animé multi-couches (faisceaux coniques en rotation, halos dérivants,
// grille mouvante masquée, spotlight pulsé, grain), typo distinctive.
//
// Standalone : aucune dép Supabase/AppContext. Server component, animations
// CSS-only (pas de JS client, pas d'injection HTML brute).
// Fonts via next/font (self-hosted -> compatible CSP Quantara).
// Preview dev uniquement, jamais mergé sur main.

import { Bricolage_Grotesque, Manrope } from 'next/font/google'

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display', display: 'swap' })
const body = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' })

const C = {
  bg: '#06070b',
  panel: 'rgba(255,255,255,0.035)',
  panel2: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.09)',
  border2: 'rgba(255,255,255,0.16)',
  text: '#f5f6f9',
  text2: '#a7afc2',
  text3: '#666f84',
  blue: '#3b6dff',
  violet: '#8b5cf6',
  cyan: '#22d3ee',
  green: '#27d39a',
}
const GRAD = `linear-gradient(110deg, ${C.cyan}, ${C.blue} 45%, ${C.violet})`
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

function QMark({ size = 30 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: size, height: size, borderRadius: 9, background: GRAD, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 22px rgba(59,109,255,0.45)', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: size * 0.56, letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>Q</span>
      </span>
      <span style={{ fontWeight: 700, letterSpacing: '0.14em', fontSize: 13.5, color: C.text }}>QUANTARA</span>
    </span>
  )
}

const STEPS = [
  { n: '01', t: 'Ajoute tes PropFirms', d: '11 firmes pré-configurées (Topstep, Apex, Lucid, MFFU…) avec leurs règles auto-remplies.' },
  { n: '02', t: 'Importe tes trades', d: 'Un CSV Rithmic R|Trader Pro, ou saisie manuelle dans le journal intégré.' },
  { n: '03', t: 'Pilote drawdown & payouts', d: 'Trailing drawdown, consistency et payouts calculés en live sur tous tes comptes.' },
]
const FEATURES = [
  { t: 'Multi-PropFirm', d: 'Tous tes comptes, toutes tes firmes, un seul dashboard. Net consolidé, dépenses, ROI par firme.', big: true },
  { t: 'Trailing drawdown auto', d: 'EOD, Intraday ou Static — selon les règles propres à chaque firme.' },
  { t: 'Consistency Monitor', d: 'Ton meilleur jour vs total, audité avant chaque payout.' },
  { t: 'Calendrier PnL', d: 'Heatmap mensuelle de tes gains/pertes, jour par jour.' },
  { t: 'Payouts & ROI', d: 'Retraits par firme, split appliqué, net réellement encaissé.' },
  { t: 'Calendrier éco', d: 'Anticipe la volatilité (FR/EN/ES) avant chaque session.' },
]
const STATS = [
  { v: '11', l: 'PropFirms supportées' },
  { v: '0 €', l: 'pendant la beta' },
  { v: '3', l: 'types de drawdown auto' },
]

export default function ClickfundedLanding() {
  return (
    <div className={`${display.variable} ${body.variable}`} style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: 'var(--font-body)', overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        .cf-bg{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
        .cf-beams{position:absolute;top:-40%;left:50%;width:140vmax;height:140vmax;transform:translateX(-50%);
          background:conic-gradient(from 0deg,
            transparent 0 8deg, rgba(59,109,255,.16) 9deg 11deg, transparent 12deg 26deg,
            rgba(139,92,246,.13) 27deg 29deg, transparent 30deg 52deg,
            rgba(34,211,238,.11) 53deg 55deg, transparent 56deg 96deg,
            rgba(59,109,255,.12) 97deg 99deg, transparent 100deg 150deg,
            rgba(139,92,246,.10) 151deg 153deg, transparent 154deg 360deg);
          -webkit-mask:radial-gradient(circle at 50% 38%, #000 0, rgba(0,0,0,.5) 38%, transparent 62%);
          mask:radial-gradient(circle at 50% 38%, #000 0, rgba(0,0,0,.5) 38%, transparent 62%);
          animation:cfSpin 48s linear infinite;opacity:.9}
        .cf-grid{position:absolute;inset:0;
          background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);
          background-size:56px 56px;
          -webkit-mask:radial-gradient(circle at 50% 30%, #000, transparent 72%);
          mask:radial-gradient(circle at 50% 30%, #000, transparent 72%);
          animation:cfDrift 20s linear infinite}
        .cf-orb{position:absolute;border-radius:50%;filter:blur(80px);will-change:transform}
        .cf-o1{width:480px;height:480px;background:rgba(59,109,255,.42);top:-120px;left:8%;animation:cfFloat 16s ease-in-out infinite}
        .cf-o2{width:420px;height:420px;background:rgba(139,92,246,.38);top:120px;right:4%;animation:cfFloat 21s ease-in-out infinite reverse}
        .cf-o3{width:380px;height:380px;background:rgba(34,211,238,.22);top:520px;left:42%;animation:cfFloat 26s ease-in-out infinite}
        .cf-spot{position:absolute;top:-10%;left:50%;width:900px;height:520px;transform:translateX(-50%);
          background:radial-gradient(ellipse at center, rgba(120,150,255,.20), transparent 70%);animation:cfPulse 9s ease-in-out infinite}
        .cf-grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.05;mix-blend-mode:soft-light;background-image:${GRAIN};background-size:180px 180px}
        .cf-vignette{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(120% 80% at 50% 0%, transparent 40%, rgba(0,0,0,.55) 100%)}

        @keyframes cfSpin{to{transform:translateX(-50%) rotate(360deg)}}
        @keyframes cfDrift{to{background-position:56px 56px}}
        @keyframes cfFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(26px,-32px)}}
        @keyframes cfPulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes cfRise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}

        .cf-rise{animation:cfRise .85s cubic-bezier(.2,.7,.2,1) both}
        .cf-cta{background:${GRAD};color:#0a0c12;font-weight:700;border:none;border-radius:13px;padding:16px 30px;font-size:15px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;box-shadow:0 12px 38px rgba(59,109,255,.45), inset 0 1px 0 rgba(255,255,255,.4);transition:transform .18s ease,box-shadow .18s ease}
        .cf-cta:hover{transform:translateY(-2px);box-shadow:0 18px 50px rgba(59,109,255,.6), inset 0 1px 0 rgba(255,255,255,.4)}
        .cf-ghost{color:${C.text};font-weight:600;border:1px solid ${C.border2};border-radius:13px;padding:16px 26px;font-size:15px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.02);transition:background .18s ease,border-color .18s ease}
        .cf-ghost:hover{background:${C.panel2};border-color:${C.text3}}
        .cf-card{background:${C.panel};border:1px solid ${C.border};border-radius:18px;padding:26px;backdrop-filter:blur(6px);transition:transform .22s ease,border-color .22s ease,background .22s ease,box-shadow .22s ease}
        .cf-card:hover{transform:translateY(-4px);border-color:rgba(139,92,246,.5);background:${C.panel2};box-shadow:0 18px 50px rgba(0,0,0,.4)}
        .cf-link{color:${C.text2};text-decoration:none;font-size:14px;transition:color .15s}
        .cf-link:hover{color:${C.text}}
        .cf-grad-text{background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent}
        h1,h2,h3{font-family:var(--font-display)}
        @media(prefers-reduced-motion:reduce){.cf-beams,.cf-grid,.cf-orb,.cf-spot,.cf-rise{animation:none !important}}
        @media(max-width:860px){
          .cf-h1{font-size:48px !important}
          .cf-navlinks{display:none !important}
          .cf-stats,.cf-steps,.cf-feat{grid-template-columns:1fr !important}
          .cf-feat-big{grid-column:auto !important}
        }
      `}</style>

      {/* ── FOND ANIMÉ (couches) ── */}
      <div className="cf-bg" aria-hidden>
        <div className="cf-spot" />
        <div className="cf-beams" />
        <div className="cf-grid" />
        <div className="cf-orb cf-o1" />
        <div className="cf-orb cf-o2" />
        <div className="cf-orb cf-o3" />
      </div>
      <div className="cf-grain" aria-hidden />
      <div className="cf-vignette" aria-hidden />

      {/* ── CONTENU ── */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* NAV */}
        <header style={{ position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(16px)', background: 'rgba(6,7,11,0.6)', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '15px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <QMark />
            <nav className="cf-navlinks" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
              <a className="cf-link" href="#how">Comment ça marche</a>
              <a className="cf-link" href="#features">Fonctions</a>
              <a className="cf-link" href="/compare">Comparateur</a>
              <a className="cf-link" href="/pricing">Tarifs</a>
            </nav>
            <a className="cf-cta" href="/auth?mode=signup" style={{ padding: '10px 18px', fontSize: 13.5, boxShadow: 'none' }}>Commencer</a>
          </div>
        </header>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '120px 24px 96px', maxWidth: 940, margin: '0 auto' }}>
          <span className="cf-rise" style={{ animationDelay: '.05s', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text2, border: `1px solid ${C.border2}`, borderRadius: 99, padding: '7px 16px', background: 'rgba(255,255,255,.03)' }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: C.green, boxShadow: `0 0 12px ${C.green}` }} />
            Beta publique · 100% gratuit
          </span>
          <h1 className="cf-h1 cf-rise" style={{ animationDelay: '.13s', fontSize: 82, lineHeight: 0.98, fontWeight: 800, letterSpacing: '-0.04em', margin: '26px 0 22px' }}>
            Sois financé.<br /><span className="cf-grad-text">Reste financé.</span>
          </h1>
          <p className="cf-rise" style={{ animationDelay: '.22s', fontSize: 19, lineHeight: 1.6, color: C.text2, maxWidth: 600, margin: '0 auto 38px' }}>
            Quantara suit ton <strong style={{ color: C.text }}>drawdown</strong>, ta <strong style={{ color: C.text }}>consistency</strong> et tes <strong style={{ color: C.text }}>payouts</strong> sur toutes tes PropFirms — pour passer tes évals et garder tes comptes financés.
          </p>
          <div className="cf-rise" style={{ animationDelay: '.3s', display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="cf-cta" href="/auth?mode=signup">Commencer gratuitement →</a>
            <a className="cf-ghost" href="/demo">Voir la démo</a>
          </div>
          <div className="cf-rise" style={{ animationDelay: '.4s', marginTop: 22, fontSize: 13, color: C.text3 }}>Sans carte bancaire · Tes données restent privées</div>
        </section>

        {/* STATS */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 96px' }}>
          <div className="cf-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, border: `1px solid ${C.border}`, borderRadius: 22, padding: '42px 24px', background: C.panel, backdropFilter: 'blur(6px)' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="cf-grad-text" style={{ fontSize: 50, fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>{s.v}</div>
                <div style={{ fontSize: 14, color: C.text2, marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW */}
        <section id="how" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
          <SectionTitle eyebrow="Comment ça marche" title="Financé en 3 étapes" />
          <div className="cf-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginTop: 44 }}>
            {STEPS.map((s, i) => (
              <div key={i} className="cf-card">
                <div className="cf-grad-text" style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}>{s.n}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 8px', letterSpacing: '-0.01em' }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
          <SectionTitle eyebrow="Tout pour rester financé" title="Le cockpit du trader PropFirm" />
          <div className="cf-feat" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginTop: 44 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className={`cf-card${f.big ? ' cf-feat-big' : ''}`} style={f.big ? { gridColumn: 'span 2', background: `linear-gradient(135deg, rgba(59,109,255,0.12), ${C.panel})`, borderColor: 'rgba(59,109,255,0.32)' } : undefined}>
                <h3 style={{ fontSize: f.big ? 26 : 18, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: '-0.01em' }}>{f.t}</h3>
                <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: 0, maxWidth: f.big ? 430 : 'none' }}>{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* OFFER */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 110px' }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 26, border: `1px solid ${C.border2}`, padding: '60px 32px', textAlign: 'center', background: `radial-gradient(120% 150% at 50% 0%, rgba(139,92,246,0.22), ${C.panel} 62%)` }}>
            <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px' }}>Gratuit pendant la beta.</h2>
            <p style={{ fontSize: 17, color: C.text2, maxWidth: 520, margin: '0 auto 30px', lineHeight: 1.6 }}>
              Les premiers inscrits gardent <strong style={{ color: C.text }}>-50% à vie</strong> quand Pro sortira. Aucune carte requise aujourd&apos;hui.
            </p>
            <a className="cf-cta" href="/auth?mode=signup">Réclamer mon accès early →</a>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: '40px 24px', maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 18 }}>
            <QMark size={26} />
            <nav style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
              <a className="cf-link" href="/compare">Comparateur</a>
              <a className="cf-link" href="/pricing">Tarifs</a>
              <a className="cf-link" href="/docs">Docs</a>
              <a className="cf-link" href="/demo">Démo</a>
            </nav>
          </div>
          <div style={{ marginTop: 22, fontSize: 12, color: C.text3 }}>© {new Date().getFullYear()} Quantara Technologies LLC — Albuquerque, NM. Concept de design (preview).</div>
        </footer>
      </div>
    </div>
  )
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.violet, marginBottom: 12 }}>{eyebrow}</div>
      <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>{title}</h2>
    </div>
  )
}
