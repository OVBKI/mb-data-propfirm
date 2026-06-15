// /landing/clickfunded — Concept landing #7, inspiré du style ClickFunded
// (dark fintech minimaliste, hero centré punché, bande de stats, CTA glow),
// adapté à Quantara (tracker PropFirm : drawdown, consistency, payouts).
//
// Standalone : aucune dépendance Supabase/AppContext, données factices.
// Server component pur — animations en CSS only (pas de 'use client').
// Préviews dev uniquement, jamais mergé sur main.

const C = {
  bg: '#07080c',
  panel: 'rgba(255,255,255,0.03)',
  panel2: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.14)',
  text: '#f4f5f7',
  text2: '#aab2c5',
  text3: '#6b7488',
  blue: '#2d6fff',
  violet: '#7c5cff',
  green: '#1db87a',
}
const GRAD = `linear-gradient(115deg, ${C.blue}, ${C.violet})`

// ── Mini "Q" mark (logo Quantara, inline pour rester standalone) ──
function QMark({ size = 30 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span style={{
        width: size, height: size, borderRadius: 9, background: GRAD,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(45,111,255,0.4)', flexShrink: 0,
      }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: size * 0.56, letterSpacing: '-0.04em' }}>Q</span>
      </span>
      <span style={{ fontWeight: 800, letterSpacing: '0.12em', fontSize: 14, color: C.text }}>QUANTARA</span>
    </span>
  )
}

const STEPS = [
  { n: '01', t: 'Ajoute tes PropFirms', d: '11 firmes pré-configurées (Topstep, Apex, Lucid, MFFU…) avec leurs règles auto-remplies.' },
  { n: '02', t: 'Importe tes trades', d: 'Upload un CSV Rithmic R|Trader Pro ou saisis tes trades à la main dans le journal.' },
  { n: '03', t: 'Pilote drawdown & payouts', d: 'Trailing drawdown, consistency rule et payouts calculés en temps réel sur tous tes comptes.' },
]

const FEATURES = [
  { t: 'Multi-PropFirm', d: 'Tous tes comptes — toutes tes firmes — dans un seul dashboard. Net consolidé, dépenses, ROI.', big: true },
  { t: 'Trailing drawdown auto', d: 'EOD, Intraday ou Static — calculé selon les règles propres à chaque firme.' },
  { t: 'Consistency Monitor', d: 'Ton meilleur jour vs total, audité en temps réel avant chaque payout.' },
  { t: 'Calendrier PnL', d: 'Heatmap mensuelle de tes gains/pertes, jour par jour.' },
  { t: 'Payouts & ROI', d: 'Suivi des retraits par firme, split appliqué, net réellement encaissé.' },
  { t: 'Calendrier éco', d: 'Anticipe la volatilité (FR/EN/ES) avant chaque session.' },
]

const STATS = [
  { v: '11', l: 'PropFirms supportées' },
  { v: '0 €', l: 'pendant la beta' },
  { v: '3', l: 'types de drawdown auto' },
]

export default function ClickfundedLanding() {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflowX: 'hidden' }}>
      <style>{`
        .cf-glow{position:absolute;border-radius:50%;filter:blur(90px);opacity:.5;pointer-events:none}
        .cf-cta{background:${GRAD};color:#fff;font-weight:700;border:none;border-radius:12px;padding:16px 30px;font-size:15px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;box-shadow:0 10px 34px rgba(45,111,255,.42);transition:transform .18s ease, box-shadow .18s ease}
        .cf-cta:hover{transform:translateY(-2px);box-shadow:0 16px 44px rgba(45,111,255,.55)}
        .cf-ghost{color:${C.text};font-weight:600;border:1px solid ${C.border2};border-radius:12px;padding:16px 26px;font-size:15px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:background .18s ease,border-color .18s ease}
        .cf-ghost:hover{background:${C.panel2};border-color:${C.text3}}
        .cf-card{background:${C.panel};border:1px solid ${C.border};border-radius:18px;padding:26px;transition:transform .2s ease,border-color .2s ease,background .2s ease}
        .cf-card:hover{transform:translateY(-3px);border-color:rgba(124,92,255,.45);background:${C.panel2}}
        .cf-link{color:${C.text2};text-decoration:none;font-size:14px;transition:color .15s}
        .cf-link:hover{color:${C.text}}
        @keyframes cfFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        .cf-orb{animation:cfFloat 7s ease-in-out infinite}
        @media (max-width:860px){
          .cf-hero-h1{font-size:48px !important}
          .cf-nav-links{display:none !important}
          .cf-stats,.cf-steps,.cf-feat{grid-template-columns:1fr !important}
          .cf-feat-big{grid-column:auto !important}
        }
      `}</style>

      {/* NAV */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(14px)', background: 'rgba(7,8,12,0.72)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <QMark />
          <nav className="cf-nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            <a className="cf-link" href="#how">Comment ça marche</a>
            <a className="cf-link" href="#features">Fonctions</a>
            <a className="cf-link" href="/compare">Comparateur</a>
            <a className="cf-link" href="/pricing">Tarifs</a>
          </nav>
          <a className="cf-cta" href="/auth?mode=signup" style={{ padding: '11px 20px', fontSize: 14, boxShadow: 'none' }}>Commencer</a>
        </div>
      </header>

      {/* HERO */}
      <section style={{ position: 'relative', textAlign: 'center', padding: '110px 24px 90px', maxWidth: 980, margin: '0 auto' }}>
        <div className="cf-glow cf-orb" style={{ width: 520, height: 520, background: C.blue, top: -120, left: '50%', marginLeft: -260 }} />
        <div className="cf-glow" style={{ width: 360, height: 360, background: C.violet, top: 40, right: -80, opacity: 0.35 }} />
        <div style={{ position: 'relative' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text2, border: `1px solid ${C.border2}`, borderRadius: 99, padding: '7px 16px', background: C.panel }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: C.green, boxShadow: `0 0 10px ${C.green}` }} />
            Beta publique · 100% gratuit
          </span>
          <h1 className="cf-hero-h1" style={{ fontSize: 76, lineHeight: 1.02, fontWeight: 800, letterSpacing: '-0.035em', margin: '26px 0 22px' }}>
            Sois financé.<br />
            <span style={{ background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Reste financé.</span>
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: C.text2, maxWidth: 620, margin: '0 auto 38px' }}>
            Quantara suit ton <strong style={{ color: C.text }}>drawdown</strong>, ta <strong style={{ color: C.text }}>consistency</strong> et tes <strong style={{ color: C.text }}>payouts</strong> sur toutes tes PropFirms — pour passer tes évaluations et garder tes comptes financés.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="cf-cta" href="/auth?mode=signup">Commencer gratuitement →</a>
            <a className="cf-ghost" href="/demo">Voir la démo</a>
          </div>
          <div style={{ marginTop: 22, fontSize: 13, color: C.text3 }}>Sans carte bancaire · Tes données restent privées</div>
        </div>
      </section>

      {/* STATS BAND */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 90px' }}>
        <div className="cf-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, border: `1px solid ${C.border}`, borderRadius: 20, padding: '40px 24px', background: C.panel }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{s.v}</div>
              <div style={{ fontSize: 14, color: C.text2, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        <SectionTitle eyebrow="Comment ça marche" title="Financé en 3 étapes" />
        <div className="cf-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginTop: 44 }}>
          {STEPS.map((s, i) => (
            <div key={i} className="cf-card">
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{s.n}</div>
              <h3 style={{ fontSize: 19, fontWeight: 700, margin: '12px 0 8px', letterSpacing: '-0.01em' }}>{s.t}</h3>
              <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES — bento */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        <SectionTitle eyebrow="Tout pour rester financé" title="Le cockpit du trader PropFirm" />
        <div className="cf-feat" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginTop: 44 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className={`cf-card${f.big ? ' cf-feat-big' : ''}`} style={f.big ? { gridColumn: 'span 2', background: `linear-gradient(135deg, rgba(45,111,255,0.10), ${C.panel})`, borderColor: 'rgba(45,111,255,0.3)' } : undefined}>
              <h3 style={{ fontSize: f.big ? 24 : 18, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: '-0.01em' }}>{f.t}</h3>
              <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: 0, maxWidth: f.big ? 420 : 'none' }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OFFER BAND */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 110px' }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, border: `1px solid ${C.border2}`, padding: '56px 32px', textAlign: 'center', background: `radial-gradient(120% 140% at 50% 0%, rgba(124,92,255,0.18), ${C.panel} 60%)` }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px' }}>Gratuit pendant la beta.</h2>
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
  )
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.violet, marginBottom: 12 }}>{eyebrow}</div>
      <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>{title}</h2>
    </div>
  )
}
