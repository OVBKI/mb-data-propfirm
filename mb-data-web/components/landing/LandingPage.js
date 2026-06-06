'use client'
// LandingPage — "Mist & Mesh" variant.
// Calm, dreamy, fluid. Apple meets Notion meets a yoga studio.
// All inline styles. No Tailwind. Heavy reuse of /v2mist helpers.

import Link from 'next/link'
import { useT } from '../LanguageProvider'
import { mist, fonts, glassStyle } from './v2mist/tokens'
import MeshBackground from './v2mist/MeshBackground'
import MistNav from './v2mist/MistNav'
import MistHero from './v2mist/MistHero'
import FrostedCard from './v2mist/FrostedCard'
import Reveal from './v2mist/Reveal'
import FAQAccordion from './v2mist/FAQAccordion'

// ─────────────────────────────────────────────────────────────────────────────
// Inline SVG icon set — geometric only, no emoji. Each icon is sized 28×28
// and inherits color from currentColor so we can recolor per surface.
// ─────────────────────────────────────────────────────────────────────────────
function IconStack(props) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" {...props}>
      <rect x="4" y="6"  width="20" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="12" width="20" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="18" width="20" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
function IconChart(props) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" {...props}>
      <polyline points="4,20 10,14 14,17 24,6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="6" r="1.6" fill="currentColor" />
    </svg>
  )
}
function IconShield(props) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" {...props}>
      <path d="M14 4 L23 7 V14 C23 19 19 23 14 25 C9 23 5 19 5 14 V7 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <polyline points="10,14 13,17 18,11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconBell(props) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" {...props}>
      <path d="M7 19 H21 L19 16 V12 C19 8.5 16.9 6 14 6 C11.1 6 9 8.5 9 12 V16 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 22 C12 23 12.8 24 14 24 C15.2 24 16 23 16 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function IconCalendar(props) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" {...props}>
      <rect x="4" y="6" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4" y1="11" x2="24" y2="11" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="3" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="3" x2="18" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function IconGlobe(props) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" {...props}>
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="14" cy="14" rx="4.5" ry="10" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
function IconCheck(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...props}>
      <polyline points="3,7.5 6,10 11,4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Data — kept inside this file because it's purely landing-page copy.
// Text is intentionally French (primary locale).
// ─────────────────────────────────────────────────────────────────────────────
const STATS = [
  { n: '11', label: 'PropFirms supportées' },
  { n: '100%', label: 'Privé · aucune lecture de positions' },
  { n: '0', label: 'Friction · import en 2 min' },
]

const FEATURES = [
  {
    Icon: IconStack,
    title: 'Multi-PropFirms',
    body: 'Topstep, Apex, MFFU, Bulenox, Lucid, Tradeify, TPT et 4 autres. Toutes tes firmes dans une seule vue claire.',
  },
  {
    Icon: IconChart,
    title: 'Equity & drawdown live',
    body: 'Ta courbe d\'équité et ta ligne de drawdown trailing en temps réel. Tu sais exactement où tu en es.',
  },
  {
    Icon: IconShield,
    title: 'Drawdown Guardian',
    body: 'Alerte push automatique dès que ton compte passe sous 70% du drawdown autorisé. Avant que ça parte.',
  },
  {
    Icon: IconBell,
    title: 'Rappels de prélèvement',
    body: 'Notification 48h avant chaque facture mensuelle. Plus jamais de surprise sur ton compte bancaire.',
  },
  {
    Icon: IconCalendar,
    title: 'Calendrier économique',
    body: 'NFP, FOMC, CPI directement dans Quantara. Anticipe les news qui font bouger les futures.',
  },
  {
    Icon: IconGlobe,
    title: 'Données privées',
    body: 'Tes credentials chiffrés. Aucune lecture de positions. RGPD compliant. Tu peux tout exporter à tout moment.',
  },
]

const PRICING = [
  {
    name: 'Free',
    price: '0 €',
    period: '/mois',
    bullets: ['2 PropFirms', '100 trades / mois', 'Toutes les analytics'],
    cta: 'Commencer',
    href: '/auth?mode=signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '19 €',
    period: '/mois',
    bullets: ['PropFirms illimitées', 'Sync API + Drawdown Guardian', 'Export PDF · support prioritaire'],
    cta: 'Choisir Pro',
    href: '/pricing',
    highlight: true,
  },
  {
    name: 'Elite',
    price: '39 €',
    period: '/mois',
    bullets: ['Tout Pro inclus', 'AI Trade Coach hebdomadaire', '3 places équipe · support VIP'],
    cta: 'Choisir Elite',
    href: '/pricing',
    highlight: false,
  },
]

const FAQ_ITEMS = [
  {
    q: 'Comment Quantara accède à mes comptes ?',
    a: 'Tu connectes tes credentials Rithmic une seule fois — ils sont chiffrés avec une clé que nous seuls détenons. Quantara lit uniquement ton historique de trades fermés. Aucun ordre n\'est jamais passé en ton nom, et nous ne voyons jamais tes positions ouvertes.',
  },
  {
    q: 'Est-ce vraiment gratuit pour démarrer ?',
    a: 'Oui. Le plan gratuit te donne 2 PropFirms et 100 trades par mois pour toujours. Pas de carte bancaire requise, pas de période d\'essai déguisée. Tu passes à Pro uniquement quand tu en as besoin.',
  },
  {
    q: 'Quelles PropFirms sont supportées ?',
    a: 'Topstep, Apex Trader Funding, My Funded Futures, Bulenox, Lucid Trading, Tradeify, Take Profit Trader, Phidias, Funded Futures Network, FuturesElites et Alpha Futures. Soit 11 firmes représentant l\'écrasante majorité du marché futures.',
  },
  {
    q: 'Mes données sont-elles privées ?',
    a: 'Entièrement. Tes données vivent dans une base Supabase isolée par utilisateur (Row Level Security), nous n\'utilisons jamais tes trades pour entraîner quoi que ce soit. Tu peux exporter tout ton historique en CSV ou supprimer ton compte en un clic.',
  },
  {
    q: 'Puis-je essayer sans créer de compte ?',
    a: 'Oui — la page Démo est un clone du vrai dashboard avec des données fictives mais réalistes. Aucune inscription, aucune trace. Idéal pour te faire une idée en 30 secondes.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const t = useT()

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflowX: 'hidden',
        fontFamily: fonts.body,
        color: mist.text,
        fontSize: 16,
        lineHeight: 1.65,
        letterSpacing: '-0.005em',
      }}
    >
      {/* Google Fonts — Cabinet Grotesk via Fontshare + Inter via Google.
          Loaded via <link> per spec; using preconnect to keep them snappy. */}
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,400&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
      />

      {/* Soft smooth scroll — scoped via <html> selector so we don't override globals */}
      <style>{`
        html { scroll-behavior: smooth; }
        body { background: ${mist.bg}; }
      `}</style>

      {/* Fixed mesh background behind everything */}
      <MeshBackground />

      {/* Floating frosted nav pill */}
      <MistNav t={t} />

      {/* HERO */}
      <MistHero t={t} />

      {/* STATS STRIP */}
      <StatsStrip />

      {/* FEATURES GRID */}
      <FeaturesGrid />

      {/* PRODUCT PREVIEW (browser frame mockup) */}
      <ProductPreview />

      {/* PRICING TEASER */}
      <PricingTeaser />

      {/* FAQ */}
      <FaqSection />

      {/* FINAL CTA */}
      <FinalCta t={t} />

      {/* FOOTER */}
      <MistFooter />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HELPERS — kept in this file for proximity; each is small.
// ─────────────────────────────────────────────────────────────────────────────

function SectionShell({ children, eyebrow, title, subtitle, maxWidth = 1200, paddingTop = 140, paddingBottom = 140, id }) {
  return (
    <section id={id} style={{ padding: `${paddingTop}px 24px ${paddingBottom}px`, position: 'relative' }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        {(eyebrow || title || subtitle) && (
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
              {eyebrow && (
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: mist.text2,
                    opacity: 0.7,
                    marginBottom: 18,
                  }}
                >
                  {eyebrow}
                </div>
              )}
              {title && (
                <h2
                  style={{
                    fontFamily: fonts.title,
                    fontSize: 'clamp(34px, 4.5vw, 56px)',
                    fontWeight: 500,
                    lineHeight: 1.1,
                    letterSpacing: '-0.025em',
                    color: mist.text,
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 18,
                    lineHeight: 1.65,
                    color: mist.text2,
                    marginTop: 18,
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </Reveal>
        )}
        {children}
      </div>
    </section>
  )
}

// ─── Stats ──────────────────────────────────────────────────────────────────
function StatsStrip() {
  return (
    <section style={{ padding: '40px 24px 120px', position: 'relative' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Reveal>
          <div
            className="mist-stats-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
            }}
          >
            {STATS.map((s, i) => (
              <FrostedCard key={i} padding={36} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: fonts.title,
                    fontSize: 'clamp(48px, 6vw, 72px)',
                    fontWeight: 500,
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    color: mist.text,
                    marginBottom: 14,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 13,
                    fontWeight: 500,
                    color: mist.text2,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {s.label}
                </div>
              </FrostedCard>
            ))}
          </div>
        </Reveal>
      </div>
      <style>{`
        @media (max-width: 820px) {
          .mist-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

// ─── Features ───────────────────────────────────────────────────────────────
function FeaturesGrid() {
  return (
    <SectionShell
      id="features"
      eyebrow="Ce que Quantara fait"
      title="Construit pour ton calme, pas ton adrénaline."
      subtitle="Six fonctions essentielles, soigneusement choisies. Pas de feature creep, pas de dashboard surchargé. Juste ce qu'il te faut pour passer la prochaine évaluation."
    >
      <div
        className="mist-features-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}
      >
        {FEATURES.map((f, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <FrostedCard padding={36} style={{ height: '100%' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'rgba(232, 179, 148, 0.18)',
                  color: mist.peachHover,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 22,
                }}
              >
                <f.Icon />
              </div>
              <h3
                style={{
                  fontFamily: fonts.title,
                  fontSize: 24,
                  fontWeight: 500,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  color: mist.text,
                  margin: '0 0 12px',
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontFamily: fonts.body,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: mist.text2,
                  margin: 0,
                }}
              >
                {f.body}
              </p>
            </FrostedCard>
          </Reveal>
        ))}
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .mist-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 680px) {
          .mist-features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </SectionShell>
  )
}

// ─── Product preview ────────────────────────────────────────────────────────
function ProductPreview() {
  return (
    <SectionShell
      eyebrow="Aperçu du produit"
      title="Tout ce que tu trades, dans une seule respiration."
      subtitle="Une interface conçue pour réduire ton stress, pas pour te garder accroché. Lis vite, agis lentement."
    >
      <Reveal>
        <div
          style={{
            ...glassStyle({
              padding: 0,
              borderRadius: 20,
              overflow: 'hidden',
              maxWidth: 1080,
              margin: '0 auto',
            }),
          }}
        >
          {/* Browser chrome */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(45, 42, 62, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.35)',
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#ff605c' }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#ffbd44' }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#00ca4e' }} />
            <div
              style={{
                flex: 1,
                textAlign: 'center',
                fontFamily: fonts.body,
                fontSize: 12,
                color: mist.text3,
                letterSpacing: '0.02em',
              }}
            >
              quantara.tech/app/dashboard
            </div>
            <span style={{ width: 12, height: 12 }} />
          </div>

          {/* Body */}
          <div style={{ padding: '32px 36px 36px', background: 'rgba(255, 255, 255, 0.25)' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <div
                  style={{
                    fontFamily: fonts.title,
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    color: mist.text,
                  }}
                >
                  Tableau de bord
                </div>
                <div style={{ fontSize: 12, color: mist.text3, marginTop: 4 }}>
                  6 PropFirms · 14 comptes · MàJ il y a 2 min
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: 'rgba(232, 179, 148, 0.18)',
                  color: mist.peachHover,
                  fontWeight: 500,
                }}
              >
                + Ajouter PropFirm
              </div>
            </div>

            {/* Stat cards row */}
            <div
              className="mist-preview-stats"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 14,
                marginBottom: 28,
              }}
            >
              {[
                { label: 'PropFirms', val: '6' },
                { label: 'Total payouts', val: '+8 240 €' },
                { label: 'Total dépensé', val: '−1 820 €' },
                { label: 'Net', val: '+6 420 €' },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: '18px 18px',
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <div style={{ fontSize: 11, color: mist.text3, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: fonts.title,
                      fontSize: 22,
                      fontWeight: 500,
                      color: mist.text,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {s.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart placeholder */}
            <div
              style={{
                position: 'relative',
                height: 220,
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.55)',
                overflow: 'hidden',
                padding: 18,
              }}
            >
              <div style={{ fontSize: 12, color: mist.text3, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Équité cumulée · 12 mois
              </div>
              {/* SVG sparkline */}
              <svg viewBox="0 0 600 160" preserveAspectRatio="none" style={{ width: '100%', height: 160, display: 'block' }}>
                <defs>
                  <linearGradient id="mistLineGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={mist.peach} stopOpacity="0.45" />
                    <stop offset="100%" stopColor={mist.peach} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,130 C 60,128 100,118 150,100 C 200,82 240,90 300,72 C 360,54 420,60 480,40 C 540,22 580,28 600,18 L 600,160 L 0,160 Z"
                  fill="url(#mistLineGrad)"
                />
                <path
                  d="M0,130 C 60,128 100,118 150,100 C 200,82 240,90 300,72 C 360,54 420,60 480,40 C 540,22 580,28 600,18"
                  fill="none"
                  stroke={mist.peachHover}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  )
}

// ─── Pricing ────────────────────────────────────────────────────────────────
function PricingTeaser() {
  return (
    <SectionShell
      id="pricing"
      eyebrow="Tarifs"
      title="Commence gratuit. Passe Pro le jour où ça en vaut la peine."
      subtitle="Tu décides quand. Pas de carte demandée à l'inscription, pas de période d'essai cachée."
    >
      <div
        className="mist-pricing-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          alignItems: 'stretch',
        }}
      >
        {PRICING.map((p, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <FrostedCard
              padding={36}
              glow={p.highlight}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: p.highlight ? mist.peachHover : mist.text2,
                    opacity: p.highlight ? 1 : 0.7,
                  }}
                >
                  {p.name}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                <span
                  style={{
                    fontFamily: fonts.title,
                    fontSize: 44,
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    color: mist.text,
                    lineHeight: 1,
                  }}
                >
                  {p.price}
                </span>
                <span style={{ fontSize: 14, color: mist.text3 }}>{p.period}</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', flex: 1 }}>
                {p.bullets.map((b, j) => (
                  <li
                    key={j}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 0',
                      fontSize: 14,
                      color: mist.text2,
                      lineHeight: 1.55,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        background: 'rgba(232, 179, 148, 0.22)',
                        color: mist.peachHover,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <IconCheck />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              <Link
                href={p.href}
                className={p.highlight ? 'mist-pricing-cta-primary' : 'mist-pricing-cta-ghost'}
                style={{
                  display: 'inline-block',
                  textAlign: 'center',
                  padding: '13px 18px',
                  borderRadius: 999,
                  fontFamily: fonts.body,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: `background 0.4s ${mist.ease}, color 0.4s ${mist.ease}, transform 0.4s ${mist.ease}`,
                  background: p.highlight ? mist.peach : 'rgba(45, 42, 62, 0.05)',
                  color: p.highlight ? '#fff' : mist.text,
                  boxShadow: p.highlight ? `0 12px 30px -12px ${mist.peach}` : 'none',
                }}
              >
                {p.cta}
              </Link>
            </FrostedCard>
          </Reveal>
        ))}
      </div>

      <style>{`
        .mist-pricing-cta-primary:hover {
          background: ${mist.peachHover} !important;
          transform: translateY(-1px);
        }
        .mist-pricing-cta-ghost:hover {
          background: rgba(45, 42, 62, 0.09) !important;
          transform: translateY(-1px);
        }
        @media (max-width: 1024px) {
          .mist-pricing-grid { grid-template-columns: 1fr !important; max-width: 460px; margin: 0 auto; }
        }
      `}</style>
    </SectionShell>
  )
}

// ─── FAQ ────────────────────────────────────────────────────────────────────
function FaqSection() {
  return (
    <SectionShell
      id="faq"
      eyebrow="Questions"
      title="Les choses qu'on nous demande souvent."
      maxWidth={840}
    >
      <Reveal>
        <FAQAccordion items={FAQ_ITEMS} />
      </Reveal>
    </SectionShell>
  )
}

// ─── Final CTA ──────────────────────────────────────────────────────────────
function FinalCta({ t }) {
  return (
    <section style={{ padding: '120px 24px 160px', textAlign: 'center', position: 'relative' }}>
      <Reveal>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: mist.text2,
              opacity: 0.7,
              marginBottom: 22,
            }}
          >
            Prêt quand tu l'es
          </div>
          <h2
            style={{
              fontFamily: fonts.title,
              fontSize: 'clamp(40px, 5.5vw, 64px)',
              fontWeight: 500,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: mist.text,
              margin: '0 0 38px',
            }}
          >
            {t('finalCTA.titleStart')}
            {t('finalCTA.titleHighlight')}
            {t('finalCTA.titleEnd')}
          </h2>
          <Link
            href="/auth?mode=signup"
            className="mist-final-cta"
            style={{
              fontFamily: fonts.body,
              fontSize: 15,
              fontWeight: 500,
              color: '#fff',
              textDecoration: 'none',
              padding: '16px 34px',
              borderRadius: 999,
              background: mist.peach,
              boxShadow: `0 16px 40px -12px ${mist.peach}`,
              transition: `background 0.4s ${mist.ease}, transform 0.4s ${mist.ease}, box-shadow 0.4s ${mist.ease}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {t('finalCTA.button')}
            <span style={{ fontSize: 14, opacity: 0.9 }}>→</span>
          </Link>
          <p style={{ marginTop: 22, fontSize: 13, color: mist.text3, letterSpacing: '-0.005em' }}>
            30 jours d'essai · Sans CB
          </p>
        </div>
      </Reveal>
      <style>{`
        .mist-final-cta:hover {
          background: ${mist.peachHover} !important;
          transform: translateY(-2px);
          box-shadow: 0 22px 50px -10px ${mist.peachHover} !important;
        }
      `}</style>
    </section>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function MistFooter() {
  const columns = [
    {
      title: 'Produit',
      links: [
        { label: 'Tarifs', href: '/pricing' },
        { label: 'Démo', href: '/demo' },
        { label: 'Comparateur', href: '/compare' },
        { label: 'Intégrations', href: '/integrations' },
      ],
    },
    {
      title: 'Société',
      links: [
        { label: 'À propos', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Sécurité', href: '/security' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { label: 'Mentions légales', href: '/legal/mentions' },
        { label: 'Confidentialité', href: '/legal/privacy' },
        { label: 'CGU', href: '/legal/cgu' },
      ],
    },
    {
      title: 'Langue',
      links: [
        { label: 'Français', href: '/' },
        { label: 'English', href: '/?lang=en' },
      ],
    },
  ]

  return (
    <footer
      style={{
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: mist.glassBlur,
        WebkitBackdropFilter: mist.glassBlur,
        borderTop: '1px solid rgba(45, 42, 62, 0.08)',
        padding: '60px 24px 40px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          className="mist-footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr repeat(4, 1fr)',
            gap: 40,
            marginBottom: 40,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: fonts.title,
                fontWeight: 700,
                letterSpacing: '0.18em',
                fontSize: 14,
                color: mist.text,
                marginBottom: 12,
              }}
            >
              QUANTARA
            </div>
            <p style={{ fontSize: 13, color: mist.text2, margin: 0, lineHeight: 1.6, maxWidth: 280 }}>
              Le tableau de bord PropFirm conçu pour ton calme. Track. Analyse. Respire.
            </p>
          </div>

          {columns.map((col, i) => (
            <div key={i}>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: mist.text3,
                  marginBottom: 16,
                }}
              >
                {col.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {col.links.map((l, j) => (
                  <li key={j} style={{ marginBottom: 10 }}>
                    <Link
                      href={l.href}
                      className="mist-footer-link"
                      style={{
                        fontSize: 13,
                        color: mist.text2,
                        textDecoration: 'none',
                        transition: `color 0.3s ${mist.ease}`,
                      }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(45, 42, 62, 0.06)',
            paddingTop: 22,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, color: mist.text3 }}>
            © {new Date().getFullYear()} Quantara Technologies LLC · New Mexico
          </div>
          <div style={{ fontSize: 12, color: mist.text3 }}>
            Fait avec calme · à Albuquerque
          </div>
        </div>
      </div>

      <style>{`
        .mist-footer-link:hover { color: ${mist.peachHover} !important; }
        @media (max-width: 920px) {
          .mist-footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 540px) {
          .mist-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  )
}
